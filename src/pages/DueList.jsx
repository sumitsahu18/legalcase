import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, Search, Printer, Download, CreditCard, ArrowLeft,
  ChevronRight, Calendar, IndianRupee, Phone, CheckCircle2, User,
  Building2, Hash, ArrowUpRight
} from 'lucide-react'
import Topbar from '../components/Topbar.jsx'
import { OFFICE } from '../data/menu.js'
import {
  getDueList, getPaymentsByCaseId, savePayment, onStorageUpdate
} from '../services/storageService.js'
import './management.css'

export default function DueList() {
  const navigate = useNavigate()
  const [dueCases, setDueCases] = useState(() => getDueList())
  const [search, setSearch] = useState('')
  const [courtFilter, setCourtFilter] = useState('')
  const [payModalCase, setPayModalCase] = useState(null)
  const [payAmount, setPayAmount] = useState('')
  const [payMode, setPayMode] = useState('Cash')
  const [payRemarks, setPayRemarks] = useState('')
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split('T')[0])
  const [toast, setToast] = useState(null)

  useEffect(() => {
    return onStorageUpdate(() => {
      setDueCases(getDueList())
    })
  }, [])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = (type, message) => setToast({ type, message })

  // Courts list for filtering
  const courts = Array.from(new Set(dueCases.map((c) => c.courtName).filter(Boolean)))

  // Total outstanding due calculation
  const totalOutstanding = dueCases.reduce((acc, c) => acc + Number(c.dueAmount || 0), 0)

  // Filtered due cases
  const filteredDueCases = dueCases.filter((c) => {
    const q = search.toLowerCase()
    const matchesSearch =
      !search ||
      (c.clientName && c.clientName.toLowerCase().includes(q)) ||
      (c.caseNumber && c.caseNumber.toLowerCase().includes(q)) ||
      (c.id && c.id.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q)) ||
      (c.courtName && c.courtName.toLowerCase().includes(q)) ||
      (c.idNumber && c.idNumber.toLowerCase().includes(q)) ||
      (c.tcc && c.tcc.toLowerCase().includes(q))

    const matchesCourt = !courtFilter || c.courtName === courtFilter
    return matchesSearch && matchesCourt
  })

  // Quick Payment Handling
  const handleOpenPayModal = (cs) => {
    setPayModalCase(cs)
    setPayAmount(String(cs.dueAmount || ''))
    setPayRemarks(`Payment against outstanding fee for ${cs.caseNumber}`)
  }

  const handleCollectPayment = (e) => {
    e.preventDefault()
    if (!payAmount || Number(payAmount) <= 0) {
      showToast('error', 'Please enter a valid payment amount.')
      return
    }

    try {
      const remaining = Math.max(0, Number(payModalCase.dueAmount || 0) - Number(payAmount))
      savePayment({
        caseId: payModalCase.id,
        clientId: payModalCase.clientId,
        clientName: payModalCase.clientName,
        tcc: payModalCase.tcc || '',
        idNumber: payModalCase.idNumber || '',
        paymentDate: payDate,
        amount: Number(payAmount),
        dueAmount: remaining,
        mode: payMode,
        remarks: payRemarks,
      })
      showToast('success', `Collected ₹${Number(payAmount).toLocaleString('en-IN')} for ${payModalCase.clientName}!`)
      setPayModalCase(null)
    } catch (err) {
      showToast('error', err.message || 'Payment collection failed.')
    }
  }

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Case ID', 'Case Number', 'Client Name', 'Phone', 'Court', 'ID No', 'TCC', 'Total Fees', 'Paid Amount', 'Due Amount', 'Next Date']
    const rows = filteredDueCases.map((c) => [
      c.id,
      `"${c.caseNumber || ''}"`,
      `"${c.clientName || ''}"`,
      c.phone || '',
      `"${c.courtName || ''}"`,
      c.idNumber || '',
      c.tcc || '',
      c.totalFees || 0,
      c.paidAmount || 0,
      c.dueAmount || 0,
      c.nextDate || '',
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Outstanding_Due_List_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    window.print()
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
            <b className="crumbs-active">Outstanding Due List</b>
          </div>

          <div className="mgmt-header">
            <div className="mgmt-header-left">
              <span className="mgmt-icon-badge" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                <AlertTriangle size={20} strokeWidth={2.2} />
              </span>
              <div>
                <div className="mgmt-tag-row">
                  <span className="tag-muted">Module 5: Chambers Outstanding Accounts</span>
                  <span className="tag-muted" style={{ color: '#dc2626', fontWeight: '700' }}>{dueCases.length} Cases with Pending Dues</span>
                </div>
                <h1 className="mgmt-title">Outstanding Client Fee Due List</h1>
                <p className="mgmt-desc">Display cases with pending fee balances, inspect payment status &amp; collect installments</p>
              </div>
            </div>
            <div className="mgmt-header-actions">
              <button className="btn-secondary" onClick={handleExportCSV}>
                <Download size={14} />
                <span>Export CSV</span>
              </button>
              <button className="btn-secondary" onClick={handlePrint}>
                <Printer size={14} />
                <span>Print Due List</span>
              </button>
              <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
                <ArrowLeft size={14} />
                <span>Dashboard</span>
              </button>
            </div>
          </div>

          {toast && (
            <div className={`mgmt-toast toast-${toast.type}`}>
              {toast.type === 'success' && <CheckCircle2 size={16} />}
              {toast.type === 'error' && <AlertTriangle size={16} />}
              <span>{toast.message}</span>
            </div>
          )}

          {/* Outstanding Summary Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            <div className="panel" style={{ padding: '14px 18px', background: '#ffffff', borderRadius: '8px', borderLeft: '4px solid #dc2626' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px', color: '#64748b', fontWeight: '700' }}>Total Pending Dues</span>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#dc2626', marginTop: '4px' }}>
                ₹{Number(totalOutstanding).toLocaleString('en-IN')}
              </div>
              <small style={{ color: '#64748b', fontSize: '11px' }}>Across {dueCases.length} pending case fee accounts</small>
            </div>

            <div className="panel" style={{ padding: '14px 18px', background: '#ffffff', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px', color: '#64748b', fontWeight: '700' }}>Average Due Per Case</span>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#b45309', marginTop: '4px' }}>
                ₹{dueCases.length > 0 ? Number(Math.round(totalOutstanding / dueCases.length)).toLocaleString('en-IN') : 0}
              </div>
              <small style={{ color: '#64748b', fontSize: '11px' }}>Installments awaiting chamber recovery</small>
            </div>

            <div className="panel" style={{ padding: '14px 18px', background: '#ffffff', borderRadius: '8px', borderLeft: '4px solid #2563eb' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px', color: '#64748b', fontWeight: '700' }}>Active Filter Matches</span>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#1d4ed8', marginTop: '4px' }}>
                {filteredDueCases.length} Cases
              </div>
              <small style={{ color: '#64748b', fontSize: '11px' }}>Subtotal: ₹{filteredDueCases.reduce((s, c) => s + Number(c.dueAmount || 0), 0).toLocaleString('en-IN')}</small>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="panel" style={{ padding: '12px 16px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: '1', minWidth: '240px', position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search by client name, case no, ID no, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '32px' }}
              />
            </div>

            <div style={{ width: '220px' }}>
              <select
                className="form-input form-select"
                value={courtFilter}
                onChange={(e) => setCourtFilter(e.target.value)}
              >
                <option value="">All Courts</option>
                {courts.map((ct) => (
                  <option key={ct} value={ct}>{ct}</option>
                ))}
              </select>
            </div>

            {(search || courtFilter) && (
              <button
                className="btn-secondary"
                onClick={() => {
                  setSearch('')
                  setCourtFilter('')
                }}
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Due List Table */}
          <div className="panel" style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div className="panel-card-head">
              <div className="pch-title">
                <span className="pch-dot" style={{ background: '#dc2626' }} />
                <h3>Cases with Outstanding Chamber Dues</h3>
              </div>
              <span className="panel-count">{filteredDueCases.length} Records</span>
            </div>

            <div className="table-scroll-container">
              <table className="mgmt-table">
                <thead>
                  <tr>
                    <th style={{ width: '85px' }}>CASE ID</th>
                    <th>CLIENT NAME</th>
                    <th>CASE NO &amp; COURT</th>
                    <th style={{ width: '85px' }}>ID / T.C.C</th>
                    <th style={{ width: '95px' }}>TOTAL (₹)</th>
                    <th style={{ width: '95px' }}>PAID (₹)</th>
                    <th style={{ width: '100px' }}>DUE (₹)</th>
                    <th style={{ width: '95px' }}>NEXT DATE</th>
                    <th style={{ width: '130px', textAlign: 'center' }}>QUICK ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDueCases.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="empty-table-cell">
                        <CheckCircle2 size={20} color="#16a34a" style={{ margin: '0 auto 6px', display: 'block' }} />
                        <span>No cases with pending dues found! All client accounts are settled.</span>
                      </td>
                    </tr>
                  ) : (
                    filteredDueCases.map((cs) => (
                      <tr key={cs.id}>
                        <td>
                          <span className="id-pill case-id">{cs.id}</span>
                        </td>
                        <td>
                          <strong className="primary-text">{cs.clientName}</strong>
                          <small className="muted-subtext">{cs.phone || cs.clientId}</small>
                        </td>
                        <td>
                          <span style={{ fontWeight: '600', color: '#0f172a' }}>{cs.caseNumber}</span>
                          <small className="muted-subtext">{cs.courtName}</small>
                        </td>
                        <td>
                          <span style={{ fontSize: '11px', fontWeight: '600' }}>{cs.idNumber || '—'}</span>
                          <small className="muted-subtext">{cs.tcc || '—'}</small>
                        </td>
                        <td>
                          <span style={{ fontSize: '13px', fontWeight: '600' }}>
                            ₹{Number(cs.totalFees || 0).toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600' }}>
                            ₹{Number(cs.paidAmount || 0).toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '14px', color: '#dc2626', fontWeight: '800' }}>
                            ₹{Number(cs.dueAmount || 0).toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td>
                          <div className="hearing-date-badge">
                            <Calendar size={11} className="h-cal-ic" />
                            <span>{cs.nextDate || '—'}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ padding: '4px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => handleOpenPayModal(cs)}
                            title="Record Payment Receipt for this Case"
                          >
                            <CreditCard size={12} />
                            <span>Receive Fee</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Collect Payment Modal */}
          {payModalCase && (
            <div className="mgmt-modal-overlay" onClick={() => setPayModalCase(null)}>
              <div className="mgmt-modal-box" style={{ maxWidth: '460px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
                <div className="mgmt-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>
                    Receive Payment: {payModalCase.clientName}
                  </h3>
                  <button className="clear-search-btn" onClick={() => setPayModalCase(null)}>✕</button>
                </div>

                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', margin: '12px 0', fontSize: '12px' }}>
                  <div><b>Case:</b> {payModalCase.caseNumber} ({payModalCase.id})</div>
                  <div><b>Court:</b> {payModalCase.courtName}</div>
                  <div style={{ marginTop: '4px' }}>
                    <b>Current Due:</b> <span style={{ color: '#dc2626', fontWeight: '800', fontSize: '14px' }}>₹{Number(payModalCase.dueAmount).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <form onSubmit={handleCollectPayment}>
                  <div className="form-field" style={{ marginBottom: '10px' }}>
                    <label className="field-lbl">Payment Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-field" style={{ marginBottom: '10px' }}>
                    <label className="field-lbl">Amount Receiving (₹) <span className="req">*</span></label>
                    <input
                      type="number"
                      className="form-input"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder="Amount in Rupees"
                      required
                      autoFocus
                    />
                  </div>

                  <div className="form-field" style={{ marginBottom: '10px' }}>
                    <label className="field-lbl">Payment Mode</label>
                    <select
                      className="form-input form-select"
                      value={payMode}
                      onChange={(e) => setPayMode(e.target.value)}
                    >
                      <option value="Cash">Cash at Chambers</option>
                      <option value="UPI">UPI / GPay / PhonePe</option>
                      <option value="Bank Transfer">Bank Transfer / NEFT</option>
                      <option value="Cheque">Cheque / Demand Draft</option>
                    </select>
                  </div>

                  <div className="form-field" style={{ marginBottom: '14px' }}>
                    <label className="field-lbl">Remarks</label>
                    <input
                      type="text"
                      className="form-input"
                      value={payRemarks}
                      onChange={(e) => setPayRemarks(e.target.value)}
                      placeholder="Receipt notes"
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button type="button" className="btn-secondary" onClick={() => setPayModalCase(null)}>Cancel</button>
                    <button type="submit" className="btn-primary" style={{ background: '#16a34a', borderColor: '#15803d' }}>
                      Save &amp; Update Due
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
