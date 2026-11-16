import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, RotateCcw, Printer, Download, Eye, ArrowLeft,
  ChevronRight, AlertCircle
} from 'lucide-react'
import Topbar from '../components/Topbar.jsx'
import { OFFICE } from '../data/menu.js'
import { getCases, onStorageUpdate, getPaymentsByCaseId } from '../services/storageService.js'
import './management.css'

export default function CaseSearchReports() {
  const navigate = useNavigate()
  const [cases, setCases] = useState(() => getCases())
  const [viewCase, setViewCase] = useState(null)

  // Multi-Filter State
  const initialFilters = {
    name: '',
    caseNumber: '',
    idNumber: '',
    psCaseNumber: '',
    court: '',
    advocate: '',
    vsName: '',
    otherDetails: '',
    dateFrom: '',
    dateTo: '',
  }
  const [filters, setFilters] = useState(initialFilters)

  useEffect(() => {
    return onStorageUpdate(() => {
      setCases(getCases())
    })
  }, [])

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const handleReset = () => {
    setFilters(initialFilters)
  }

  // Multi-filter evaluation
  const filteredCases = cases.filter((cs) => {
    if (filters.name && !String(cs.clientName || '').toLowerCase().includes(filters.name.toLowerCase())) return false
    if (filters.caseNumber && !String(cs.caseNumber || '').toLowerCase().includes(filters.caseNumber.toLowerCase())) return false
    if (filters.idNumber && !String(cs.idNumber || '').toLowerCase().includes(filters.idNumber.toLowerCase())) return false
    if (filters.psCaseNumber && !String(cs.psCaseNumber || cs.otherCaseNumber || '').toLowerCase().includes(filters.psCaseNumber.toLowerCase())) return false
    if (filters.court && !String(cs.courtName || '').toLowerCase().includes(filters.court.toLowerCase())) return false
    if (filters.advocate && !String(cs.advocateName || '').toLowerCase().includes(filters.advocate.toLowerCase())) return false
    if (filters.vsName && !String(cs.vsName || '').toLowerCase().includes(filters.vsName.toLowerCase())) return false
    if (filters.otherDetails) {
      const q = filters.otherDetails.toLowerCase()
      const haystack = `${cs.underSection || ''} ${cs.policeStation || ''} ${cs.purpose || ''} ${cs.caseDetails || ''} ${cs.notes || ''} ${cs.tcc || ''} ${cs.lc || ''}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    if (filters.dateFrom && cs.nextDate && cs.nextDate < filters.dateFrom) return false
    if (filters.dateTo && cs.nextDate && cs.nextDate > filters.dateTo) return false
    return true
  })

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Case ID', 'Case No', 'Client Name', 'Court', 'Under Section', 'ID No', 'TCC', 'Next Date', 'Purpose', 'Total Fees', 'Paid', 'Due']
    const rows = filteredCases.map((c) => [
      c.id,
      `"${c.caseNumber || ''}"`,
      `"${c.clientName || ''}"`,
      `"${c.courtName || ''}"`,
      `"${c.underSection || ''}"`,
      `"${c.idNumber || ''}"`,
      `"${c.tcc || ''}"`,
      c.nextDate || '',
      `"${c.purpose || ''}"`,
      c.totalFees || 0,
      c.paidAmount || 0,
      c.dueAmount || 0,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Case_Search_Report_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    window.print()
  }

  const openCaseDetails = (cs) => {
    const payments = getPaymentsByCaseId(cs.id)
    setViewCase({ ...cs, payments })
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
            <b className="crumbs-active">Case Search &amp; Head-Wise Reports</b>
          </div>

          <div className="mgmt-header">
            <div className="mgmt-header-left">
              <span className="mgmt-icon-badge" style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}>
                <Search size={20} strokeWidth={2.2} />
              </span>
              <div>
                <div className="mgmt-tag-row">
                  <span className="tag-violet">Module 3: Advanced Legal Query</span>
                  <span className="tag-muted">{filteredCases.length} Matching Dockets</span>
                </div>
                <h1 className="mgmt-title">Case Search &amp; Head-Wise Reports</h1>
                <p className="mgmt-desc">Simultaneous multi-parameter searching across courts, advocates, sections, dates &amp; parties</p>
              </div>
            </div>
            <div className="mgmt-header-actions">
              <button className="btn-secondary" onClick={handleExportCSV}>
                <Download size={14} />
                <span>Export CSV</span>
              </button>
              <button className="btn-secondary" onClick={handlePrint}>
                <Printer size={14} />
                <span>Print Report</span>
              </button>
              <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
                <ArrowLeft size={14} />
                <span>Dashboard</span>
              </button>
            </div>
          </div>

          {/* Multi-Filter Search Panel */}
          <div className="panel" style={{ padding: '16px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Search size={15} color="#6366f1" /> Multi-Criteria Search Filters
              </span>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '12px' }}
                onClick={handleReset}
              >
                <RotateCcw size={12} />
                <span>Reset Filters</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div className="form-field">
                <label className="field-lbl">Client Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Filter by client..."
                  className="form-input"
                  value={filters.name}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="form-field">
                <label className="field-lbl">Case Number</label>
                <input
                  type="text"
                  name="caseNumber"
                  placeholder="e.g. CR/342/2026"
                  className="form-input"
                  value={filters.caseNumber}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="form-field">
                <label className="field-lbl">ID Number</label>
                <input
                  type="text"
                  name="idNumber"
                  placeholder="e.g. ID-101"
                  className="form-input"
                  value={filters.idNumber}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="form-field">
                <label className="field-lbl">P.S. Case Number</label>
                <input
                  type="text"
                  name="psCaseNumber"
                  placeholder="e.g. PS Case 84/2025"
                  className="form-input"
                  value={filters.psCaseNumber}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="form-field">
                <label className="field-lbl">Court Name</label>
                <input
                  type="text"
                  name="court"
                  placeholder="e.g. ACJM, Sessions..."
                  className="form-input"
                  value={filters.court}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="form-field">
                <label className="field-lbl">Advocate Name</label>
                <input
                  type="text"
                  name="advocate"
                  placeholder="e.g. Anupam Maity"
                  className="form-input"
                  value={filters.advocate}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="form-field">
                <label className="field-lbl">V.S. Name (Opposite Party)</label>
                <input
                  type="text"
                  name="vsName"
                  placeholder="e.g. State of WB..."
                  className="form-input"
                  value={filters.vsName}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="form-field">
                <label className="field-lbl">Other Details (U/S, Purpose)</label>
                <input
                  type="text"
                  name="otherDetails"
                  placeholder="e.g. 302 IPC, Evidence..."
                  className="form-input"
                  value={filters.otherDetails}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="form-field">
                <label className="field-lbl">Hearing Date From</label>
                <input
                  type="date"
                  name="dateFrom"
                  className="form-input"
                  value={filters.dateFrom}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="form-field">
                <label className="field-lbl">Hearing Date To</label>
                <input
                  type="date"
                  name="dateTo"
                  className="form-input"
                  value={filters.dateTo}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="panel" style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div className="panel-card-head">
              <div className="pch-title">
                <span className="pch-dot pch-violet" />
                <h3>Search Query Results</h3>
              </div>
              <span className="panel-count">{filteredCases.length} Matching Records</span>
            </div>

            <div className="table-scroll-container">
              <table className="mgmt-table">
                <thead>
                  <tr>
                    <th style={{ width: '85px' }}>CASE ID</th>
                    <th>CASE NO &amp; COURT</th>
                    <th>CLIENT NAME</th>
                    <th>U/S &amp; PS</th>
                    <th>V.S. NAME</th>
                    <th>ID / T.C.C</th>
                    <th style={{ width: '95px' }}>NEXT DATE</th>
                    <th>PURPOSE</th>
                    <th style={{ width: '70px' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCases.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="empty-table-cell">
                        <AlertCircle size={18} className="empty-ic" />
                        <span>No cases match your active search filters. Try broadening your criteria or reset filters.</span>
                      </td>
                    </tr>
                  ) : (
                    filteredCases.map((cs) => (
                      <tr key={cs.id} className="table-row-clickable" onClick={() => openCaseDetails(cs)}>
                        <td>
                          <span className="id-pill case-id">{cs.id}</span>
                        </td>
                        <td>
                          <strong className="primary-text">{cs.caseNumber}</strong>
                          <small className="muted-subtext">{cs.courtName}</small>
                        </td>
                        <td>
                          <span className="cell-client">{cs.clientName}</span>
                          <small className="cell-cid">{cs.phone || cs.clientId}</small>
                        </td>
                        <td>
                          <span style={{ fontSize: '11px', color: '#6d28d9', fontWeight: '600' }}>{cs.underSection || '—'}</span>
                          <small className="muted-subtext">{cs.policeStation || '—'}</small>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: '#334155' }}>{cs.vsName || '—'}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: '11px', fontWeight: '600' }}>{cs.idNumber || '—'}</span>
                          <small className="muted-subtext">{cs.tcc || '—'}</small>
                        </td>
                        <td>
                          <div className="hearing-date-badge">
                            <Calendar size={11} className="h-cal-ic" />
                            <span>{cs.nextDate}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '11px', color: '#475569' }}>{cs.purpose}</span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-icon-subtle"
                            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
                            onClick={(e) => {
                              e.stopPropagation()
                              openCaseDetails(cs)
                            }}
                            title="View Case Docket"
                          >
                            <Eye size={13} color="#7c3aed" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Case Detail Modal */}
          {viewCase && (
            <div className="mgmt-modal-overlay" onClick={() => setViewCase(null)}>
              <div className="mgmt-modal-box" style={{ maxWidth: '700px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
                <div className="mgmt-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>
                      Case Docket: {viewCase.caseNumber} ({viewCase.id})
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                      {viewCase.courtName} · Next Date: {viewCase.nextDate}
                    </p>
                  </div>
                  <button className="clear-search-btn" onClick={() => setViewCase(null)}>✕</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', margin: '14px 0', fontSize: '13px' }}>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div><b>Client:</b> {viewCase.clientName} ({viewCase.clientId})</div>
                    <div><b>Contact:</b> {viewCase.phone || '—'}</div>
                    <div><b>Advocate:</b> {viewCase.advocateName || OFFICE.name}</div>
                    <div><b>Law Clerk (L/C):</b> {viewCase.lc || '—'}</div>
                    <div><b>Police Station:</b> {viewCase.policeStation || '—'}</div>
                    <div><b>P.S. Case No:</b> {viewCase.psCaseNumber || '—'}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div><b>Under Section:</b> {viewCase.underSection || '—'}</div>
                    <div><b>V.S. Name:</b> {viewCase.vsName || '—'}</div>
                    <div><b>ID Number:</b> {viewCase.idNumber || '—'}</div>
                    <div><b>T.C.C:</b> {viewCase.tcc || '—'}</div>
                    <div><b>Hearing Purpose:</b> {viewCase.purpose || '—'}</div>
                    <div><b>Other Details:</b> {viewCase.caseDetails || viewCase.notes || '—'}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', margin: '12px 0' }}>
                  <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <small style={{ color: '#64748b', fontSize: '11px' }}>Total Agreed Fees</small>
                    <div style={{ fontSize: '15px', fontWeight: '700' }}>₹{Number(viewCase.totalFees || 0).toLocaleString('en-IN')}</div>
                  </div>
                  <div style={{ background: '#f0fdf4', padding: '8px 12px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                    <small style={{ color: '#166534', fontSize: '11px' }}>Total Paid</small>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#15803d' }}>₹{Number(viewCase.paidAmount || 0).toLocaleString('en-IN')}</div>
                  </div>
                  <div style={{ background: '#fff1f2', padding: '8px 12px', borderRadius: '6px', border: '1px solid #fecaca' }}>
                    <small style={{ color: '#991b1b', fontSize: '11px' }}>Outstanding Due</small>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#b91c1c' }}>₹{Number(viewCase.dueAmount || 0).toLocaleString('en-IN')}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                  <button className="btn-secondary" onClick={() => setViewCase(null)}>Close</button>
                  <button className="btn-primary" onClick={() => {
                    setViewCase(null)
                    navigate('/cases')
                  }}>
                    Open in Case Master
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
