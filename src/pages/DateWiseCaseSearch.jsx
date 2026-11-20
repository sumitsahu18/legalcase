import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileSpreadsheet, Calendar, Search, Printer, Download, ArrowLeft,
  ChevronRight, AlertCircle, LayoutGrid, List, RotateCcw, Filter
} from 'lucide-react'
import Topbar from '../components/Topbar.jsx'
import { OFFICE } from '../data/menu.js'
import { getCases, getAppearances, onStorageUpdate } from '../services/storageService.js'
import './management.css'

export default function DateWiseCaseSearch() {
  const navigate = useNavigate()
  const [cases, setCases] = useState(() => getCases())
  const [appearances, setAppearances] = useState(() => getAppearances())

  // Date range inputs
  const [fromDate, setFromDate] = useState(() => {
    // Default to earliest appearance or today
    const apps = getAppearances()
    if (apps.length > 0) {
      const dates = apps.map((a) => a.appearanceDate).filter(Boolean).sort()
      return dates[0] || new Date().toISOString().split('T')[0]
    }
    return new Date().toISOString().split('T')[0]
  })

  const [toDate, setToDate] = useState(() => {
    // Default to latest appearance or today + 30 days
    const apps = getAppearances()
    if (apps.length > 0) {
      const dates = apps.map((a) => a.appearanceDate).filter(Boolean).sort()
      return dates[dates.length - 1] || new Date().toISOString().split('T')[0]
    }
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().split('T')[0]
  })

  const [appliedFromDate, setAppliedFromDate] = useState(fromDate)
  const [appliedToDate, setAppliedToDate] = useState(toDate)
  const [dateError, setDateError] = useState('')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('table') // 'table' | 'pdf'

  useEffect(() => {
    return onStorageUpdate(() => {
      setCases(getCases())
      setAppearances(getAppearances())
    })
  }, [])

  // Consolidate appearance records: all recorded appearances + cases nextDate fallback
  const allAppearanceRecords = useMemo(() => {
    const records = []
    const seen = new Set()

    // 1. Stored appearance events
    appearances.forEach((app) => {
      const key = `${app.caseId || ''}_${app.appearanceDate || ''}_${app.id || ''}`
      if (!seen.has(key)) {
        seen.add(key)
        // Find parent case for supplementary details if missing
        const parentCase = cases.find((c) => c.id === app.caseId) || {}
        records.push({
          id: app.id,
          caseId: app.caseId || parentCase.id || '—',
          clientId: app.clientId || parentCase.clientId || '—',
          clientName: app.clientName || parentCase.clientName || '—',
          phone: app.phone || parentCase.phone || '—',
          caseNumber: app.caseNumber || parentCase.caseNumber || '—',
          courtName: app.courtName || parentCase.courtName || '—',
          appearanceDate: app.appearanceDate || parentCase.nextDate || '',
          purpose: app.purpose || parentCase.purpose || parentCase.caseDetails || parentCase.notes || 'Hearing Scheduled',
          ppName: app.ppName || parentCase.ppName || 'State Public Prosecutor',
          otherCaseNumber: app.otherCaseNumber || parentCase.otherCaseNumber || parentCase.otherCaseNo || '—',
        })
      }
    })

    // 2. Add cases whose nextDate is set but not yet recorded in appearances
    cases.forEach((cs) => {
      if (cs.nextDate) {
        const key = `${cs.id}_${cs.nextDate}`
        const alreadyIn = records.some((r) => r.caseId === cs.id && r.appearanceDate === cs.nextDate)
        if (!alreadyIn) {
          records.push({
            id: `cs-app-${cs.id}`,
            caseId: cs.id,
            clientId: cs.clientId || '—',
            clientName: cs.clientName || '—',
            phone: cs.phone || '—',
            caseNumber: cs.caseNumber || '—',
            courtName: cs.courtName || '—',
            appearanceDate: cs.nextDate,
            purpose: cs.purpose || cs.caseDetails || cs.notes || 'Court Hearing Scheduled',
            ppName: cs.ppName || 'State Public Prosecutor',
            otherCaseNumber: cs.otherCaseNumber || cs.otherCaseNo || '—',
          })
        }
      }
    })

    // Sort chronologically by appearanceDate
    return records.sort((a, b) => (a.appearanceDate || '').localeCompare(b.appearanceDate || ''))
  }, [cases, appearances])

  // Filter according to applied dates and search query
  const filteredRecords = useMemo(() => {
    return allAppearanceRecords.filter((rec) => {
      // Date Range filter
      if (appliedFromDate && rec.appearanceDate && rec.appearanceDate < appliedFromDate) return false
      if (appliedToDate && rec.appearanceDate && rec.appearanceDate > appliedToDate) return false

      // Text search
      if (search.trim()) {
        const q = search.toLowerCase()
        const matches =
          (rec.clientId && rec.clientId.toLowerCase().includes(q)) ||
          (rec.clientName && rec.clientName.toLowerCase().includes(q)) ||
          (rec.phone && rec.phone.includes(q)) ||
          (rec.caseNumber && rec.caseNumber.toLowerCase().includes(q)) ||
          (rec.courtName && rec.courtName.toLowerCase().includes(q)) ||
          (rec.appearanceDate && rec.appearanceDate.includes(q)) ||
          (rec.purpose && rec.purpose.toLowerCase().includes(q)) ||
          (rec.ppName && rec.ppName.toLowerCase().includes(q)) ||
          (rec.otherCaseNumber && rec.otherCaseNumber.toLowerCase().includes(q))
        if (!matches) return false
      }

      return true
    })
  }, [allAppearanceRecords, appliedFromDate, appliedToDate, search])

  const handleApplyFilter = (e) => {
    if (e) e.preventDefault()
    if (fromDate && toDate && fromDate > toDate) {
      setDateError('From Date cannot be later than To Date.')
      return
    }
    setDateError('')
    setAppliedFromDate(fromDate)
    setAppliedToDate(toDate)
  }

  const handleClearFilter = () => {
    setFromDate('')
    setToDate('')
    setAppliedFromDate('')
    setAppliedToDate('')
    setDateError('')
    setSearch('')
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportCSV = () => {
    const headers = [
      'Serial Number',
      'Client ID',
      'Client Full Name',
      'Client Mobile Number',
      'Case Number',
      'Court Name',
      'Appearance Date',
      'For / Purpose of Hearing',
      'PP Name',
      'Other Case Number'
    ]
    const rows = filteredRecords.map((r, idx) => [
      idx + 1,
      `"${r.clientId || ''}"`,
      `"${r.clientName || ''}"`,
      `"${r.phone || ''}"`,
      `"${r.caseNumber || ''}"`,
      `"${r.courtName || ''}"`,
      `"${r.appearanceDate || ''}"`,
      `"${(r.purpose || '').replace(/"/g, '""')}"`,
      `"${r.ppName || ''}"`,
      `"${r.otherCaseNumber || ''}"`
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Date_Wise_Case_Search_${appliedFromDate || 'Start'}_to_${appliedToDate || 'End'}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="app-shell">
      <div className="app-main">
        <Topbar />

        <main className="dash mgmt-page">
          <div className="crumbs">
            <button className="crumbs-link" onClick={() => navigate('/dashboard')}>
              <ArrowLeft size={13} />
              <span>Dashboard</span>
            </button>
            <ChevronRight size={12} className="crumbs-sep" />
            <span className="crumbs-muted">Reports</span>
            <ChevronRight size={12} className="crumbs-sep" />
            <b className="crumbs-active">Date-Wise Case Searching</b>
          </div>

          <div className="mgmt-header">
            <div className="mgmt-header-left">
              <span className="mgmt-icon-badge" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                <FileSpreadsheet size={20} strokeWidth={2.2} />
              </span>
              <div>
                <div className="mgmt-tag-row">
                  <span className="tag-muted" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}>
                    Module 11: Date-Wise Case Searching
                  </span>
                  <span className="tag-muted">{filteredRecords.length} Hearing Entries Found</span>
                </div>
                <h1 className="mgmt-title">Date-Wise Case Searching</h1>
                <p className="mgmt-desc">Multi-date appearance search across court hearings with independent appearance history</p>
              </div>
            </div>
            <div className="mgmt-header-actions">
              <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                <button
                  type="button"
                  style={{
                    padding: '6px 12px',
                    background: viewMode === 'table' ? '#0f172a' : '#ffffff',
                    color: viewMode === 'table' ? '#ffffff' : '#475569',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                  onClick={() => setViewMode('table')}
                >
                  <List size={14} /> Table Layout
                </button>
                <button
                  type="button"
                  style={{
                    padding: '6px 12px',
                    background: viewMode === 'pdf' ? '#0f172a' : '#ffffff',
                    color: viewMode === 'pdf' ? '#ffffff' : '#475569',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                  onClick={() => setViewMode('pdf')}
                >
                  <LayoutGrid size={14} /> PDF Card Layout
                </button>
              </div>
              <button className="btn-secondary" onClick={handleExportCSV}>
                <Download size={14} />
                <span>Export CSV</span>
              </button>
              <button className="btn-secondary" onClick={handlePrint}>
                <Printer size={14} />
                <span>Print Schedule</span>
              </button>
            </div>
          </div>

          {/* Date Range Selector & Filter Form */}
          <div className="panel" style={{ padding: '16px 20px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
            <form onSubmit={handleApplyFilter} style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                    From Date
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => {
                      setFromDate(e.target.value)
                      if (dateError) setDateError('')
                    }}
                    className="form-input"
                    style={{ width: '165px', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                    To Date
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => {
                      setToDate(e.target.value)
                      if (dateError) setDateError('')
                    }}
                    className="form-input"
                    style={{ width: '165px', fontSize: '13px' }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', height: '38px', fontSize: '13px' }}
                >
                  <Search size={14} />
                  <span>Search</span>
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', height: '38px', fontSize: '13px' }}
                  onClick={handleClearFilter}
                >
                  <RotateCcw size={14} />
                  <span>Clear Filters</span>
                </button>
              </div>

              {/* General Text Search */}
              <div style={{ minWidth: '280px', flex: '1', maxWidth: '380px', position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search Client ID, Name, Case No, PP Name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '34px', fontSize: '12px', height: '38px' }}
                />
              </div>
            </form>

            {dateError && (
              <div style={{ marginTop: '10px', color: '#b91c1c', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                <AlertCircle size={14} />
                <span>{dateError}</span>
              </div>
            )}

            <div style={{ marginTop: '10px', fontSize: '12px', color: '#64748b', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <span>
                Active Range: <b>{appliedFromDate || 'Beginning'}</b> to <b>{appliedToDate || 'Latest'}</b>
              </span>
              <span>Showing: <b>{filteredRecords.length}</b> total appearance records</span>
            </div>
          </div>

          {/* ================= VIEW 1: TABLE LAYOUT (10 EXACT REQUIRED COLUMNS) ================= */}
          {viewMode === 'table' && (
            <div className="panel" style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div className="panel-card-head" style={{ padding: '12px 18px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="pch-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="pch-dot" style={{ background: '#dc2626', width: '8px', height: '8px', borderRadius: '50%' }} />
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                    Court Hearing Appearances ({appliedFromDate || 'Start'} to {appliedToDate || 'End'})
                  </h3>
                </div>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>
                  {filteredRecords.length} Records
                </span>
              </div>

              <div className="table-scroll-container" style={{ overflowX: 'auto' }}>
                <table className="mgmt-table" style={{ width: '100%', minWidth: '1100px', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#0f172a', color: '#ffffff' }}>
                      <th style={{ width: '45px', textAlign: 'center', color: '#ffffff' }}>#</th>
                      <th style={{ width: '100px', color: '#ffffff' }}>CLIENT ID</th>
                      <th style={{ width: '160px', color: '#ffffff' }}>CLIENT FULL NAME</th>
                      <th style={{ width: '110px', color: '#ffffff' }}>MOBILE NO</th>
                      <th style={{ width: '140px', color: '#ffffff' }}>CASE NUMBER</th>
                      <th style={{ width: '150px', color: '#ffffff' }}>COURT NAME</th>
                      <th style={{ width: '115px', color: '#ffffff' }}>APPEARANCE DATE</th>
                      <th style={{ minWidth: '220px', color: '#ffffff' }}>FOR / PURPOSE OF HEARING</th>
                      <th style={{ width: '130px', color: '#ffffff' }}>PP NAME</th>
                      <th style={{ width: '120px', color: '#ffffff' }}>OTHER CASE NO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                          <AlertCircle size={24} style={{ margin: '0 auto 8px', display: 'block', color: '#94a3b8' }} />
                          No court appearance records found matching the selected date range and criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((r, idx) => (
                        <tr key={r.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          {/* 1. Serial Number */}
                          <td style={{ textAlign: 'center', fontWeight: '700', color: '#475569' }}>
                            {idx + 1}
                          </td>

                          {/* 2. Client ID */}
                          <td>
                            <span className="id-pill" style={{ background: '#eff6ff', color: '#1d4ed8', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', display: 'inline-block' }}>
                              {r.clientId}
                            </span>
                          </td>

                          {/* 3. Client Full Name */}
                          <td>
                            <strong style={{ color: '#0f172a', display: 'block' }}>
                              {r.clientName}
                            </strong>
                          </td>

                          {/* 4. Client Mobile Number */}
                          <td>
                            <span style={{ color: '#334155', fontFamily: 'monospace', fontSize: '12px' }}>
                              {r.phone}
                            </span>
                          </td>

                          {/* 5. Case Number */}
                          <td>
                            <strong style={{ color: '#7c3aed', fontSize: '12px' }}>
                              {r.caseNumber}
                            </strong>
                          </td>

                          {/* 6. Court Name */}
                          <td>
                            <span style={{ color: '#0f172a', fontWeight: '500' }}>
                              {r.courtName}
                            </span>
                          </td>

                          {/* 7. Appearance Date */}
                          <td>
                            <span style={{ fontWeight: '700', color: '#b91c1c', background: '#fef2f2', padding: '3px 6px', borderRadius: '4px', border: '1px solid #fecaca' }}>
                              {r.appearanceDate || '—'}
                            </span>
                          </td>

                          {/* 8. For / Purpose of Hearing (Fully visible with text-wrapping and tooltip) */}
                          <td style={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: '1.4' }} title={r.purpose}>
                            <span style={{ color: '#1e293b', fontWeight: '500' }}>
                              {r.purpose || 'Hearing'}
                            </span>
                          </td>

                          {/* 9. PP Name */}
                          <td>
                            <span style={{ color: '#475569', fontSize: '11px' }}>
                              {r.ppName || '—'}
                            </span>
                          </td>

                          {/* 10. Other Case Number */}
                          <td>
                            <span style={{ color: '#64748b', fontSize: '11px', fontFamily: 'monospace' }}>
                              {r.otherCaseNumber || '—'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= VIEW 2: EXACT PDF SPECIFICATION CARD VIEW ================= */}
          {viewMode === 'pdf' && (
            <div className="panel" style={{ background: '#ffffff', borderRadius: '8px', border: '2px solid #0f172a', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ background: '#dc2626', color: '#ffffff', padding: '8px 16px', textAlign: 'center', fontWeight: '900', fontSize: '16px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '20px' }}>
                DATE WISE CASE SEARCHING
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '13px', color: '#0f172a', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                <span>Listing Date Range: <u>{appliedFromDate || 'Beginning'}</u> to <u>{appliedToDate || 'Latest'}</u></span>
                <span>Total Hearings: <u>{filteredRecords.length}</u></span>
              </div>

              {filteredRecords.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                  <AlertCircle size={24} style={{ margin: '0 auto 8px', display: 'block', color: '#94a3b8' }} />
                  No court case records found matching this date range.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {filteredRecords.map((rec, idx) => (
                    <div
                      key={rec.id || idx}
                      style={{
                        border: '1.5px solid #0f172a',
                        borderRadius: '4px',
                        padding: '14px 16px',
                        background: '#ffffff',
                      }}
                    >
                      {/* Row 1: Header Row */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1.6fr 1.1fr 1.2fr 1.5fr 1.2fr',
                          gap: '12px',
                          borderBottom: '1px dashed #cbd5e1',
                          paddingBottom: '8px',
                          fontSize: '12.5px',
                          alignItems: 'baseline',
                        }}
                      >
                        <div>
                          <strong>{idx + 1}. Name :</strong>{' '}
                          <span style={{ fontWeight: '700', color: '#0f172a' }}>{rec.clientName}</span>
                        </div>
                        <div>
                          <strong>Client ID:</strong>{' '}
                          <span style={{ fontWeight: '700', color: '#1d4ed8' }}>{rec.clientId}</span>
                        </div>
                        <div>
                          <strong>Mob. No. :</strong>{' '}
                          <span style={{ fontWeight: '600', color: '#0f172a' }}>{rec.phone}</span>
                        </div>
                        <div>
                          <strong>Court Name :</strong>{' '}
                          <span style={{ fontWeight: '600', color: '#0f172a' }}>{rec.courtName}</span>
                        </div>
                        <div>
                          <strong>Appearance Date:</strong>{' '}
                          <span style={{ fontWeight: '700', color: '#b91c1c' }}>{rec.appearanceDate}</span>
                        </div>
                      </div>

                      {/* Row 2: Supplementary Info */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1.5fr 1.5fr 1.5fr',
                          gap: '12px',
                          paddingTop: '8px',
                          paddingBottom: '8px',
                          borderBottom: '1px dashed #f1f5f9',
                          fontSize: '12px',
                          color: '#475569',
                        }}
                      >
                        <div>
                          <strong>Case Number:</strong>{' '}
                          <span style={{ color: '#7c3aed', fontWeight: '700' }}>{rec.caseNumber}</span>
                        </div>
                        <div>
                          <strong>PP Name:</strong>{' '}
                          <span style={{ color: '#0f172a' }}>{rec.ppName}</span>
                        </div>
                        <div>
                          <strong>Other Case No:</strong>{' '}
                          <span style={{ color: '#0f172a' }}>{rec.otherCaseNumber}</span>
                        </div>
                      </div>

                      {/* Row 3: For / Purpose of Hearing */}
                      <div style={{ paddingTop: '8px', fontSize: '12.5px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <strong style={{ minWidth: '55px', color: '#0f172a' }}>For :</strong>
                        <span style={{ color: '#1e293b', lineHeight: '1.4', wordBreak: 'break-word', whiteSpace: 'normal', fontWeight: '500' }}>
                          {rec.purpose}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Chambers Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '36px', paddingTop: '16px', borderTop: '1px solid #0f172a' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  <strong>{OFFICE.name}</strong> · {OFFICE.address}
                </div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a' }}>
                  Advocate Chambers Judicial Diary
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
