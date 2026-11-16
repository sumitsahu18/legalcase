import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Layers, Search, Printer, Download, ArrowLeft, ChevronRight,
  Gavel, Calendar, Building2, User, Hash, AlertCircle
} from 'lucide-react'
import Topbar from '../components/Topbar.jsx'
import { OFFICE } from '../data/menu.js'
import { getCases, onStorageUpdate } from '../services/storageService.js'
import './management.css'

export default function ForWiseCaseReport() {
  const navigate = useNavigate()
  const [cases, setCases] = useState(() => getCases())
  const [selectedPurpose, setSelectedPurpose] = useState('All')
  const [search, setSearch] = useState('')

  useEffect(() => {
    return onStorageUpdate(() => {
      setCases(getCases())
    })
  }, [])

  // Extract distinct purposes
  const purposes = ['All', ...Array.from(new Set(cases.map((c) => c.purpose).filter(Boolean)))]

  // Filter
  const filteredCases = cases.filter((cs) => {
    const matchesPurpose = selectedPurpose === 'All' || cs.purpose === selectedPurpose
    const q = search.toLowerCase()
    const matchesSearch =
      !search ||
      (cs.clientName && cs.clientName.toLowerCase().includes(q)) ||
      (cs.caseNumber && cs.caseNumber.toLowerCase().includes(q)) ||
      (cs.courtName && cs.courtName.toLowerCase().includes(q)) ||
      (cs.purpose && cs.purpose.toLowerCase().includes(q))
    return matchesPurpose && matchesSearch
  })

  // Grouped counts for badges
  const purposeCounts = {}
  cases.forEach((c) => {
    const p = c.purpose || 'Other'
    purposeCounts[p] = (purposeCounts[p] || 0) + 1
  })

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
            <b className="crumbs-active">For / Purpose Wise Case Report</b>
          </div>

          <div className="mgmt-header">
            <div className="mgmt-header-left">
              <span className="mgmt-icon-badge" style={{ background: '#ede9fe', color: '#6d28d9', border: '1px solid #ddd6fe' }}>
                <Layers size={20} strokeWidth={2.2} />
              </span>
              <div>
                <div className="mgmt-tag-row">
                  <span className="tag-violet">Procedural Stage Intelligence</span>
                  <span className="tag-muted">{cases.length} Total Court Dockets</span>
                </div>
                <h1 className="mgmt-title">For Wise Case Stage Report</h1>
                <p className="mgmt-desc">Case docket classification categorized by hearing purpose: Evidence, Arguments, Bail, Injunction &amp; Summons</p>
              </div>
            </div>
            <div className="mgmt-header-actions">
              <button className="btn-secondary" onClick={() => window.print()}>
                <Printer size={14} />
                <span>Print Report</span>
              </button>
              <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
                <ArrowLeft size={14} />
                <span>Dashboard</span>
              </button>
            </div>
          </div>

          {/* Purpose Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '14px' }}>
            {purposes.map((p) => {
              const isSelected = selectedPurpose === p
              const count = p === 'All' ? cases.length : purposeCounts[p] || 0
              return (
                <button
                  key={p}
                  type="button"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: isSelected ? '1.5px solid #6d28d9' : '1px solid #cbd5e1',
                    background: isSelected ? '#6d28d9' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#334155',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                  }}
                  onClick={() => setSelectedPurpose(p)}
                >
                  <span>{p}</span>
                  <span style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: isSelected ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                    color: isSelected ? '#ffffff' : '#64748b',
                  }}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Table */}
          <div className="panel" style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div className="panel-card-head">
              <div className="pch-title">
                <span className="pch-dot pch-violet" />
                <h3>Cases Listed For: {selectedPurpose}</h3>
              </div>
              <span className="panel-count">{filteredCases.length} Matching Dockets</span>
            </div>

            <div className="table-scroll-container">
              <table className="mgmt-table">
                <thead>
                  <tr>
                    <th style={{ width: '85px' }}>CASE ID</th>
                    <th>FOR / PURPOSE OF HEARING</th>
                    <th>CASE NO &amp; COURT</th>
                    <th>CLIENT NAME</th>
                    <th>UNDER SECTION</th>
                    <th style={{ width: '95px' }}>NEXT DATE</th>
                    <th style={{ width: '85px', textAlign: 'right' }}>DUE (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCases.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="empty-table-cell">
                        <AlertCircle size={18} className="empty-ic" />
                        <span>No cases found for purpose "{selectedPurpose}".</span>
                      </td>
                    </tr>
                  ) : (
                    filteredCases.map((cs) => (
                      <tr key={cs.id}>
                        <td><span className="id-pill case-id">{cs.id}</span></td>
                        <td>
                          <strong style={{ color: '#6d28d9', fontSize: '13px' }}>{cs.purpose}</strong>
                          {cs.caseDetails && <small className="muted-subtext">{cs.caseDetails}</small>}
                        </td>
                        <td>
                          <strong className="primary-text">{cs.caseNumber}</strong>
                          <small className="muted-subtext">{cs.courtName}</small>
                        </td>
                        <td>
                          <span className="cell-client">{cs.clientName}</span>
                          <small className="cell-cid">{cs.phone}</small>
                        </td>
                        <td>
                          <span style={{ fontSize: '11px', color: '#475569' }}>{cs.underSection || '—'}</span>
                        </td>
                        <td>
                          <div className="hearing-date-badge">
                            <Calendar size={11} className="h-cal-ic" />
                            <span>{cs.nextDate}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '700', color: Number(cs.dueAmount || 0) > 0 ? '#dc2626' : '#16a34a' }}>
                          ₹{Number(cs.dueAmount || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
