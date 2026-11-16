import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileSpreadsheet, Calendar, Search, Printer, Download, ArrowLeft,
  ChevronRight, Phone, Building2, User, Hash, AlertCircle, LayoutGrid, List
} from 'lucide-react'
import Topbar from '../components/Topbar.jsx'
import { OFFICE } from '../data/menu.js'
import { getCases, onStorageUpdate } from '../services/storageService.js'
import './management.css'

export default function DateWiseCaseSearch() {
  const navigate = useNavigate()
  const [cases, setCases] = useState(() => getCases())
  const [selectedDate, setSelectedDate] = useState(() => {
    // Default to a date that has cases or today
    const cs = getCases()
    const firstWithDate = cs.find((c) => c.nextDate)
    return firstWithDate ? firstWithDate.nextDate : new Date().toISOString().split('T')[0]
  })
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('pdf') // 'pdf' | 'table'

  useEffect(() => {
    return onStorageUpdate(() => {
      setCases(getCases())
    })
  }, [])

  // Filter cases matching selectedDate (or all if empty) + search term
  const matchingCases = cases.filter((cs) => {
    const matchesDate = !selectedDate || cs.nextDate === selectedDate
    const q = search.toLowerCase()
    const matchesSearch =
      !search ||
      (cs.clientName && cs.clientName.toLowerCase().includes(q)) ||
      (cs.idNumber && cs.idNumber.toLowerCase().includes(q)) ||
      (cs.phone && cs.phone.includes(q)) ||
      (cs.courtName && cs.courtName.toLowerCase().includes(q)) ||
      (cs.lc && cs.lc.toLowerCase().includes(q)) ||
      (cs.caseDetails && cs.caseDetails.toLowerCase().includes(q)) ||
      (cs.notes && cs.notes.toLowerCase().includes(q)) ||
      (cs.caseNumber && cs.caseNumber.toLowerCase().includes(q))

    return matchesDate && matchesSearch
  })

  const handlePrint = () => {
    window.print()
  }

  const handleExportCSV = () => {
    const headers = ['Serial', 'Date', 'Name', 'ID No', 'Mobile No', 'Court Name', 'L/C', 'Case No', 'Notes']
    const rows = matchingCases.map((cs, idx) => [
      idx + 1,
      cs.nextDate || selectedDate,
      `"${cs.clientName || ''}"`,
      `"${cs.idNumber || ''}"`,
      `"${cs.phone || ''}"`,
      `"${cs.courtName || ''}"`,
      `"${cs.lc || ''}"`,
      `"${cs.caseNumber || ''}"`,
      `"${cs.caseDetails || cs.notes || cs.purpose || ''}"`,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Date_Wise_Case_Search_${selectedDate || 'All'}.csv`)
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
                    Module 11: Client Spec (Software.pdf)
                  </span>
                  <span className="tag-muted">{matchingCases.length} Court Hearings</span>
                </div>
                <h1 className="mgmt-title">Date-Wise Case Searching</h1>
                <p className="mgmt-desc">Exact specification format from client PDF: Name, ID No., Mob. No., Court Name, L/C &amp; Notes</p>
              </div>
            </div>
            <div className="mgmt-header-actions">
              <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                <button
                  type="button"
                  style={{ padding: '6px 10px', background: viewMode === 'pdf' ? '#0f172a' : '#ffffff', color: viewMode === 'pdf' ? '#ffffff' : '#475569', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                  onClick={() => setViewMode('pdf')}
                >
                  <LayoutGrid size={13} /> PDF Card Layout
                </button>
                <button
                  type="button"
                  style={{ padding: '6px 10px', background: viewMode === 'table' ? '#0f172a' : '#ffffff', color: viewMode === 'table' ? '#ffffff' : '#475569', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                  onClick={() => setViewMode('table')}
                >
                  <List size={13} /> Table Layout
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
              <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
                <ArrowLeft size={14} />
                <span>Dashboard</span>
              </button>
            </div>
          </div>

          {/* Date Selector & Search Controls */}
          <div className="panel" style={{ padding: '14px 18px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>Date.-</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="form-input"
                style={{ width: '180px', fontWeight: '600' }}
              />
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '11px', padding: '4px 8px' }}
                onClick={() => setSelectedDate('')}
              >
                Show All Dates
              </button>
            </div>

            <div style={{ width: '320px', position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search Name, ID No, Mobile, Court, L/C..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '32px', fontSize: '12px' }}
              />
            </div>
          </div>

          {/* ================= VIEW 1: EXACT PDF SPECIFICATION CARD VIEW ================= */}
          {viewMode === 'pdf' && (
            <div className="panel" style={{ background: '#ffffff', borderRadius: '8px', border: '2px solid #0f172a', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
              {/* PDF Section Header Banner */}
              <div style={{ background: '#dc2626', color: '#ffffff', padding: '8px 16px', textAlign: 'center', fontWeight: '900', fontSize: '16px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '24px' }}>
                DATE WISE CASE SEARCHING
              </div>

              {selectedDate && (
                <div style={{ textAlign: 'right', fontWeight: '700', fontSize: '13px', color: '#0f172a', marginBottom: '16px' }}>
                  Listing Date: <u>{selectedDate}</u>
                </div>
              )}

              {matchingCases.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                  <AlertCircle size={24} style={{ margin: '0 auto 8px', display: 'block', color: '#94a3b8' }} />
                  No court case records found matching date <strong>{selectedDate || 'All'}</strong>.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {matchingCases.map((cs, idx) => (
                    <div
                      key={cs.id}
                      style={{
                        border: '1.5px solid #0f172a',
                        borderRadius: '4px',
                        padding: '16px',
                        background: '#ffffff',
                      }}
                    >
                      {/* Row 1: 1. Name : | ID No.: | Mob. No. : | Court Name : | L/C : */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1.5fr 1fr 1.2fr 1.5fr 1.2fr',
                          gap: '12px',
                          borderBottom: '1px dashed #cbd5e1',
                          paddingBottom: '10px',
                          fontSize: '13px',
                          alignItems: 'baseline',
                        }}
                      >
                        <div>
                          <strong>{idx + 1}. Name :</strong>{' '}
                          <span style={{ fontWeight: '700', color: '#0f172a' }}>{cs.clientName}</span>
                        </div>
                        <div>
                          <strong>ID No.:</strong>{' '}
                          <span style={{ fontWeight: '600', color: '#334155' }}>{cs.idNumber || cs.clientId || '—'}</span>
                        </div>
                        <div>
                          <strong>Mob. No. :</strong>{' '}
                          <span style={{ fontWeight: '600', color: '#0f172a' }}>{cs.phone || '—'}</span>
                        </div>
                        <div>
                          <strong>Court Name :</strong>{' '}
                          <span style={{ fontWeight: '600', color: '#0f172a' }}>{cs.courtName}</span>
                        </div>
                        <div>
                          <strong>L/C :</strong>{' '}
                          <span style={{ fontWeight: '600', color: '#475569' }}>{cs.lc || 'Bikash Mondal (L/C)'}</span>
                        </div>
                      </div>

                      {/* Row 2: Notes : */}
                      <div style={{ paddingTop: '10px', fontSize: '13px', display: 'flex', gap: '8px' }}>
                        <strong style={{ minWidth: '55px' }}>Notes :</strong>
                        <span style={{ color: '#334155', lineHeight: '1.5' }}>
                          {cs.caseDetails || cs.notes || cs.purpose || 'Hearing scheduled. Witness deposition and brief inspection.'}
                          {cs.caseNumber && <span style={{ marginLeft: '8px', color: '#6d28d9', fontSize: '12px' }}>({cs.caseNumber})</span>}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Chambers Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '48px', paddingTop: '20px', borderTop: '1px solid #0f172a' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  <strong>{OFFICE.name}</strong> · {OFFICE.address}
                </div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                  Advocate Chambers Judicial Diary
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW 2: TABLE LAYOUT ================= */}
          {viewMode === 'table' && (
            <div className="panel" style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div className="panel-card-head">
                <div className="pch-title">
                  <span className="pch-dot" style={{ background: '#dc2626' }} />
                  <h3>Court Case Cause List ({selectedDate || 'All Dates'})</h3>
                </div>
                <span className="panel-count">{matchingCases.length} Records</span>
              </div>

              <div className="table-scroll-container">
                <table className="mgmt-table">
                  <thead>
                    <tr>
                      <th style={{ width: '45px' }}>#</th>
                      <th>CLIENT NAME</th>
                      <th style={{ width: '90px' }}>ID NO.</th>
                      <th style={{ width: '105px' }}>MOB. NO.</th>
                      <th>COURT NAME</th>
                      <th style={{ width: '130px' }}>L/C</th>
                      <th>CASE NO &amp; NOTES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchingCases.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="empty-table-cell">
                          <AlertCircle size={18} className="empty-ic" />
                          <span>No cases match search criteria.</span>
                        </td>
                      </tr>
                    ) : (
                      matchingCases.map((cs, idx) => (
                        <tr key={cs.id}>
                          <td><b>{idx + 1}</b></td>
                          <td><strong className="primary-text">{cs.clientName}</strong></td>
                          <td><span className="id-pill" style={{ background: '#fee2e2', color: '#991b1b' }}>{cs.idNumber || cs.clientId}</span></td>
                          <td><span className="cell-phone">{cs.phone}</span></td>
                          <td><strong style={{ color: '#0f172a' }}>{cs.courtName}</strong></td>
                          <td><span style={{ fontSize: '12px', color: '#475569' }}>{cs.lc || 'Bikash Mondal'}</span></td>
                          <td>
                            <div style={{ fontSize: '12px', color: '#334155' }}>
                              <span style={{ color: '#7c3aed', fontWeight: '600', marginRight: '6px' }}>{cs.caseNumber}:</span>
                              {cs.caseDetails || cs.notes || cs.purpose}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
