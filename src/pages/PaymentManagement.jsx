import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CreditCard, Save, RefreshCw, Printer, XCircle, Search,
  Calendar, ArrowLeft, CheckCircle2, AlertCircle, ChevronRight,
  Hash, IndianRupee, FileText, Trash2, Filter, Layers, Download
} from 'lucide-react'
import Topbar from '../components/Topbar.jsx'
import { OFFICE } from '../data/menu.js'
import {
  getCases, getPayments, savePayment, updatePayment, deletePayment,
  getCaseById, onStorageUpdate
} from '../services/storageService.js'
import './management.css'

export default function PaymentManagement({ initialTab = 'entry' }) {
  const navigate = useNavigate()
  const [cases, setCases] = useState(() => getCases())
  const [payments, setPayments] = useState(() => getPayments())
  const [activeTab, setActiveTab] = useState(initialTab) // 'entry' | 'date-wise'
  const [selectedPaymentId, setSelectedPaymentId] = useState(null)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [paymentToDelete, setPaymentToDelete] = useState(null)

  // Form State
  const getInitialForm = () => ({
    caseId: '',
    clientId: '',
    clientName: '',
    tcc: '',
    idNumber: '',
    paymentDate: new Date().toISOString().split('T')[0],
    amount: '',
    dueAmount: '',
    mode: 'Cash',
    remarks: '',
  })

  const [formData, setFormData] = useState(getInitialForm)
  const [selectedCaseDetails, setSelectedCaseDetails] = useState(null)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    return onStorageUpdate(() => {
      setCases(getCases())
      setPayments(getPayments())
    })
  }, [])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = (type, message) => {
    setToast({ type, message })
  }

  // Handle Case selection in Form
  const handleCaseSelect = (caseId) => {
    if (!caseId) {
      setSelectedCaseDetails(null)
      setFormData(getInitialForm())
      return
    }

    const cs = cases.find((c) => c.id === caseId)
    if (cs) {
      setSelectedCaseDetails(cs)
      const currentDue = Number(cs.dueAmount || 0)
      setFormData((prev) => ({
        ...prev,
        caseId: cs.id,
        clientId: cs.clientId,
        clientName: cs.clientName,
        tcc: cs.tcc || '',
        idNumber: cs.idNumber || '',
        dueAmount: currentDue,
      }))
    }
  }

  // Handle Amount change & re-compute remaining due
  const handleAmountChange = (e) => {
    const amt = Number(e.target.value || 0)
    setFormData((prev) => {
      const currentDue = selectedCaseDetails ? Number(selectedCaseDetails.dueAmount || 0) : 0
      const remainingDue = Math.max(0, currentDue - amt)
      return {
        ...prev,
        amount: e.target.value,
        dueAmount: remainingDue,
      }
    })
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: null }))
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }))
  }

  const validateForm = () => {
    const errs = {}
    if (!formData.caseId) errs.caseId = 'Please select a Court Case Docket'
    if (!formData.amount || Number(formData.amount) <= 0) errs.amount = 'Enter valid payment amount'
    if (!formData.paymentDate) errs.paymentDate = 'Payment date is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSelectPayment = (p) => {
    setSelectedPaymentId(p.id)
    const cs = cases.find((c) => c.id === p.caseId)
    setSelectedCaseDetails(cs || null)
    setFormData({
      caseId: p.caseId || '',
      clientId: p.clientId || '',
      clientName: p.clientName || '',
      tcc: p.tcc || '',
      idNumber: p.idNumber || '',
      paymentDate: p.paymentDate || '',
      amount: String(p.amount || ''),
      dueAmount: p.dueAmount !== undefined ? p.dueAmount : '',
      mode: p.mode || 'Cash',
      remarks: p.remarks || '',
    })
    setErrors({})
    showToast('info', `Loaded payment receipt ${p.id}`)
  }

  const handleClear = () => {
    setSelectedPaymentId(null)
    setSelectedCaseDetails(null)
    setFormData(getInitialForm())
    setErrors({})
  }

  const handleSave = (e) => {
    if (e) e.preventDefault()
    if (!validateForm()) {
      showToast('error', 'Please resolve form errors.')
      return
    }

    setLoading(true)
    setTimeout(() => {
      try {
        const saved = savePayment(formData)
        setSelectedPaymentId(saved.id)
        showToast('success', `Payment receipt ${saved.id} of ₹${Number(saved.amount).toLocaleString('en-IN')} recorded successfully!`)
      } catch (err) {
        showToast('error', err.message || 'Failed to save payment.')
      } finally {
        setLoading(false)
      }
    }, 120)
  }

  const handleUpdate = (e) => {
    if (e) e.preventDefault()
    if (!selectedPaymentId) {
      showToast('error', 'Select a payment receipt to update.')
      return
    }
    if (!validateForm()) return

    setLoading(true)
    setTimeout(() => {
      try {
        const updated = updatePayment(selectedPaymentId, formData)
        showToast('success', `Payment receipt ${updated.id} updated successfully!`)
      } catch (err) {
        showToast('error', err.message || 'Failed to update payment.')
      } finally {
        setLoading(false)
      }
    }, 120)
  }

  const promptDeletePayment = (p) => {
    setPaymentToDelete(p)
    setShowDeleteModal(true)
  }

  const confirmDeletePayment = () => {
    if (!paymentToDelete) return
    try {
      deletePayment(paymentToDelete.id)
      if (selectedPaymentId === paymentToDelete.id) {
        handleClear()
      }
      showToast('success', `Payment ${paymentToDelete.id} deleted. Case balance adjusted.`)
    } catch (err) {
      showToast('error', err.message || 'Failed to delete payment.')
    } finally {
      setShowDeleteModal(false)
      setPaymentToDelete(null)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  // Filtered payments for Tab 1
  const filteredPayments = payments.filter((p) => {
    const q = search.toLowerCase()
    return (
      (p.id && p.id.toLowerCase().includes(q)) ||
      (p.caseId && p.caseId.toLowerCase().includes(q)) ||
      (p.clientName && p.clientName.toLowerCase().includes(q)) ||
      (p.tcc && p.tcc.toLowerCase().includes(q)) ||
      (p.idNumber && p.idNumber.toLowerCase().includes(q)) ||
      (p.paymentDate && p.paymentDate.includes(q)) ||
      (p.mode && p.mode.toLowerCase().includes(q)) ||
      (p.remarks && p.remarks.toLowerCase().includes(q))
    )
  })

  // Date-wise payments for Tab 2 (PDF Layout)
  const dateWisePayments = payments.filter((p) => String(p.paymentDate) === selectedDate)
  const totalDateWiseAmt = dateWisePayments.reduce((acc, p) => acc + Number(p.amount || 0), 0)

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
            <span className="crumbs-muted">Data Entry</span>
            <ChevronRight size={12} className="crumbs-sep" />
            <b className="crumbs-active">Payment Management &amp; Accounts</b>
          </div>

          <div className="mgmt-header">
            <div className="mgmt-header-left">
              <span className="mgmt-icon-badge" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                <CreditCard size={20} strokeWidth={2.2} />
              </span>
              <div>
                <div className="mgmt-tag-row">
                  <span className="tag-muted">Module 4: Client Accounts &amp; PDF Payment Details</span>
                  <span className="tag-muted">{payments.length} Total Receipts</span>
                </div>
                <h1 className="mgmt-title">Payment Management &amp; Accounts</h1>
                <p className="mgmt-desc">Record client fee installments, track outstanding dues, &amp; view date-wise payment details</p>
              </div>
            </div>
            <div className="mgmt-header-actions">
              <button
                className={`btn-secondary ${activeTab === 'entry' ? 'active-tab' : ''}`}
                style={activeTab === 'entry' ? { background: '#0f172a', color: '#ffffff' } : {}}
                onClick={() => setActiveTab('entry')}
              >
                <CreditCard size={14} />
                <span>Case Payment Entry</span>
              </button>
              <button
                className={`btn-secondary ${activeTab === 'date-wise' ? 'active-tab' : ''}`}
                style={activeTab === 'date-wise' ? { background: '#0f172a', color: '#ffffff' } : {}}
                onClick={() => setActiveTab('date-wise')}
              >
                <FileText size={14} />
                <span>Date-Wise Payment Details (PDF)</span>
              </button>
              <button className="btn-secondary" onClick={handlePrint}>
                <Printer size={14} />
                <span>Print</span>
              </button>
            </div>
          </div>

          {toast && (
            <div className={`mgmt-toast toast-${toast.type}`}>
              {toast.type === 'success' && <CheckCircle2 size={16} />}
              {toast.type === 'error' && <AlertCircle size={16} />}
              {toast.type === 'info' && <CheckCircle2 size={16} />}
              <span>{toast.message}</span>
            </div>
          )}

          {/* ================= TAB 1: CASE PAYMENT ENTRY ================= */}
          {activeTab === 'entry' && (
            <div className="mgmt-two-panel">
              {/* LEFT: Payment Form */}
              <div className="mgmt-form-panel">
                <div className="panel-card-head">
                  <div className="pch-title">
                    <span className="pch-dot" style={{ background: '#10b981' }} />
                    <h3>{selectedPaymentId ? `Edit Receipt (${selectedPaymentId})` : 'New Case Fee Receipt'}</h3>
                  </div>
                  {selectedPaymentId ? (
                    <span className="status-badge editing">Editing Receipt</span>
                  ) : (
                    <span className="status-badge creating">New Payment</span>
                  )}
                </div>

                <form className="mgmt-form" onSubmit={(e) => e.preventDefault()}>
                  {/* Select Case */}
                  <div className="form-field">
                    <label className="field-lbl">Select Case Docket <span className="req">*</span></label>
                    <select
                      name="caseId"
                      className={`form-input form-select ${errors.caseId ? 'input-err' : ''}`}
                      value={formData.caseId}
                      onChange={(e) => handleCaseSelect(e.target.value)}
                    >
                      <option value="">-- Choose Case Docket --</option>
                      {cases.map((cs) => (
                        <option key={cs.id} value={cs.id}>
                          {cs.id} — {cs.caseNumber} ({cs.clientName}) — Due: ₹{Number(cs.dueAmount || 0).toLocaleString('en-IN')}
                        </option>
                      ))}
                    </select>
                    {errors.caseId && <span className="err-msg">{errors.caseId}</span>}
                  </div>

                  {/* Case Context Banner */}
                  {selectedCaseDetails && (
                    <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', margin: '4px 0', fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span><b>Court:</b> {selectedCaseDetails.courtName}</span>
                        <span><b>Total Fees:</b> ₹{Number(selectedCaseDetails.totalFees || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span><b>Already Paid:</b> <span style={{ color: '#16a34a', fontWeight: '700' }}>₹{Number(selectedCaseDetails.paidAmount || 0).toLocaleString('en-IN')}</span></span>
                        <span><b>Current Outstanding:</b> <span style={{ color: '#dc2626', fontWeight: '700' }}>₹{Number(selectedCaseDetails.dueAmount || 0).toLocaleString('en-IN')}</span></span>
                      </div>
                    </div>
                  )}

                  {/* Client Name & Case ID */}
                  <div className="form-row-2">
                    <div className="form-field">
                      <label className="field-lbl">Client Name</label>
                      <input
                        type="text"
                        name="clientName"
                        className="form-input readonly-input"
                        value={formData.clientName || 'Auto-filled from Case'}
                        readOnly
                      />
                    </div>
                    <div className="form-field">
                      <label className="field-lbl">Payment Date <span className="req">*</span></label>
                      <input
                        type="date"
                        name="paymentDate"
                        className={`form-input ${errors.paymentDate ? 'input-err' : ''}`}
                        value={formData.paymentDate}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {/* T.C.C. & ID Number */}
                  <div className="form-row-2">
                    <div className="form-field">
                      <label className="field-lbl">T.C.C. (Trial Court Case)</label>
                      <input
                        type="text"
                        name="tcc"
                        placeholder="e.g. TCC-42/26"
                        className="form-input"
                        value={formData.tcc}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-field">
                      <label className="field-lbl">ID Number</label>
                      <input
                        type="text"
                        name="idNumber"
                        placeholder="e.g. ID-101"
                        className="form-input"
                        value={formData.idNumber}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {/* Amount & Remaining Due */}
                  <div className="form-row-2">
                    <div className="form-field">
                      <label className="field-lbl">Payment Amount (₹) <span className="req">*</span></label>
                      <div className="input-with-icon">
                        <IndianRupee size={14} className="input-ic" />
                        <input
                          type="number"
                          name="amount"
                          placeholder="Amount received"
                          className={`form-input ${errors.amount ? 'input-err' : ''}`}
                          value={formData.amount}
                          onChange={handleAmountChange}
                        />
                      </div>
                      {errors.amount && <span className="err-msg">{errors.amount}</span>}
                    </div>

                    <div className="form-field">
                      <label className="field-lbl">Due After Payment (₹)</label>
                      <input
                        type="number"
                        name="dueAmount"
                        className="form-input readonly-input"
                        value={formData.dueAmount !== '' ? formData.dueAmount : ''}
                        readOnly
                        style={{ color: Number(formData.dueAmount || 0) > 0 ? '#dc2626' : '#16a34a', fontWeight: '700' }}
                      />
                    </div>
                  </div>

                  {/* Payment Mode */}
                  <div className="form-field">
                    <label className="field-lbl">Payment Mode</label>
                    <select
                      name="mode"
                      className="form-input form-select"
                      value={formData.mode}
                      onChange={handleChange}
                    >
                      <option value="Cash">Cash at Chambers</option>
                      <option value="UPI">UPI / GPay / PhonePe</option>
                      <option value="Bank Transfer">Bank Transfer / NEFT / IMPS</option>
                      <option value="Cheque">Bank Cheque / DD</option>
                    </select>
                  </div>

                  {/* Remarks */}
                  <div className="form-field">
                    <label className="field-lbl">Payment Remarks / Stage Note</label>
                    <input
                      type="text"
                      name="remarks"
                      placeholder="e.g. Evidence stage fee, filing fee, retainer..."
                      className="form-input"
                      value={formData.remarks}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Buttons */}
                  <div className="mgmt-btn-bar">
                    <button
                      type="button"
                      className="act-btn btn-save"
                      onClick={handleSave}
                      disabled={loading || !!selectedPaymentId}
                      style={{ background: '#10b981', borderColor: '#059669', color: '#ffffff' }}
                    >
                      <Save size={14} />
                      <span>SAVE RECEIPT</span>
                    </button>

                    <button
                      type="button"
                      className="act-btn btn-update"
                      onClick={handleUpdate}
                      disabled={loading || !selectedPaymentId}
                    >
                      <RefreshCw size={14} />
                      <span>UPDATE</span>
                    </button>

                    {selectedPaymentId && (
                      <button
                        type="button"
                        className="act-btn"
                        style={{ background: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' }}
                        onClick={() => promptDeletePayment(formData)}
                        disabled={loading}
                      >
                        <Trash2 size={14} />
                        <span>DELETE</span>
                      </button>
                    )}

                    <button type="button" className="act-btn btn-clear" onClick={handleClear}>
                      <XCircle size={14} />
                      <span>CLEAR</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* RIGHT: Payments Table */}
              <div className="mgmt-table-panel">
                <div className="panel-card-head">
                  <div className="pch-title">
                    <span className="pch-dot" style={{ background: '#10b981' }} />
                    <h3>Fee Receipt Ledger</h3>
                  </div>
                  <span className="panel-count">{filteredPayments.length} of {payments.length} Receipts</span>
                </div>

                <div className="table-search-bar">
                  <Search size={14} className="search-ic" />
                  <input
                    type="text"
                    placeholder="Search by receipt ID, case ID, client name, T.C.C, or remarks..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="table-search-input"
                  />
                  {search && (
                    <button className="clear-search-btn" onClick={() => setSearch('')}>×</button>
                  )}
                </div>

                <div className="table-scroll-container">
                  <table className="mgmt-table">
                    <thead>
                      <tr>
                        <th style={{ width: '80px' }}>RECEIPT</th>
                        <th>CASE &amp; CLIENT</th>
                        <th style={{ width: '85px' }}>T.C.C / ID</th>
                        <th style={{ width: '90px' }}>DATE</th>
                        <th style={{ width: '90px' }}>AMOUNT (₹)</th>
                        <th style={{ width: '85px' }}>DUE (₹)</th>
                        <th style={{ width: '65px' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="empty-table-cell">
                            <AlertCircle size={18} className="empty-ic" />
                            <span>No payment records found matching query.</span>
                          </td>
                        </tr>
                      ) : (
                        filteredPayments.map((p) => {
                          const isSelected = p.id === selectedPaymentId
                          return (
                            <tr
                              key={p.id}
                              className={`table-row-clickable ${isSelected ? 'row-selected' : ''}`}
                              onClick={() => handleSelectPayment(p)}
                            >
                              <td><span className="id-pill" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>{p.id}</span></td>
                              <td>
                                <strong className="primary-text">{p.clientName}</strong>
                                <small className="muted-subtext">{p.caseId} · {p.mode}</small>
                              </td>
                              <td>
                                <span style={{ fontSize: '11px', fontWeight: '600' }}>{p.tcc || '—'}</span>
                                {p.idNumber && <small className="muted-subtext">{p.idNumber}</small>}
                              </td>
                              <td><span className="cell-date">{p.paymentDate}</span></td>
                              <td>
                                <span style={{ color: '#16a34a', fontWeight: '700', fontSize: '13px' }}>
                                  ₹{Number(p.amount || 0).toLocaleString('en-IN')}
                                </span>
                              </td>
                              <td>
                                <span style={{ color: Number(p.dueAmount || 0) > 0 ? '#dc2626' : '#64748b', fontSize: '12px', fontWeight: '600' }}>
                                  ₹{Number(p.dueAmount || 0).toLocaleString('en-IN')}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    className="btn-icon-subtle"
                                    style={{ padding: '3px 6px', border: '1px solid #fecaca', background: '#fff1f2', cursor: 'pointer' }}
                                    onClick={() => promptDeletePayment(p)}
                                    title="Delete Receipt"
                                  >
                                    <Trash2 size={12} color="#dc2626" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: DATE-WISE PAYMENT DETAILS (PDF FORMAT) ================= */}
          {activeTab === 'date-wise' && (
            <div className="panel" style={{ background: '#ffffff', borderRadius: '8px', border: '2px solid #0f172a', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
              {/* PDF Header Box */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '0.8px', textDecoration: 'underline', color: '#0f172a', margin: 0 }}>
                  DATE WISE PAYMENT DETAILS :
                </h2>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Date.-</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{ padding: '6px 12px', fontSize: '14px', fontWeight: '600', border: '1.5px solid #0f172a', borderRadius: '4px' }}
                  />
                  <span style={{ fontSize: '13px', color: '#475569', marginLeft: '12px' }}>
                    ({dateWisePayments.length} entries on this date)
                  </span>
                </div>
              </div>

              {/* Exact PDF Layout Format Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'inherit' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #0f172a', background: '#f8fafc' }}>
                      <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>T.C.C-</th>
                      <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>ID No.:</th>
                      <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>Client Name &amp; Case</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>Payment Amt.-</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dateWisePayments.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                          <AlertCircle size={24} style={{ margin: '0 auto 8px', display: 'block', color: '#94a3b8' }} />
                          No payment transactions recorded on <strong>{selectedDate}</strong>.
                        </td>
                      </tr>
                    ) : (
                      dateWisePayments.map((p, idx) => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '12px 14px', fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>
                            {p.tcc || `T.C.C-${idx + 1}`}
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: '600', fontSize: '14px', color: '#334155' }}>
                            {p.idNumber || p.clientId || '—'}
                          </td>
                          <td style={{ padding: '12px 14px', fontSize: '14px', color: '#0f172a' }}>
                            <strong>{p.clientName}</strong>
                            <small style={{ display: 'block', color: '#64748b', fontSize: '11px' }}>{p.caseId} ({p.mode})</small>
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800', fontSize: '14px', color: '#16a34a' }}>
                            ₹{Number(p.amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '700', fontSize: '14px', color: Number(p.dueAmount || 0) > 0 ? '#dc2626' : '#64748b' }}>
                            ₹{Number(p.dueAmount || 0).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {dateWisePayments.length > 0 && (
                    <tfoot>
                      <tr style={{ borderTop: '2px solid #0f172a', background: '#f8fafc' }}>
                        <td colSpan={3} style={{ padding: '12px 14px', fontWeight: '800', fontSize: '14px' }}>
                          TOTAL COLLECTED ON {selectedDate}:
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800', fontSize: '15px', color: '#16a34a' }}>
                          ₹{Number(totalDateWiseAmt).toLocaleString('en-IN')}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Chambers Signature in PDF format */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '48px', paddingTop: '24px', borderTop: '1px dashed #cbd5e1' }}>
                <div style={{ textAlign: 'center', width: '200px' }}>
                  <div style={{ borderTop: '1.5px solid #0f172a', paddingTop: '4px', fontSize: '12px', fontWeight: '700' }}>
                    Office Accounts Clerk
                  </div>
                </div>
                <div style={{ textAlign: 'center', width: '220px' }}>
                  <div style={{ borderTop: '1.5px solid #0f172a', paddingTop: '4px', fontSize: '12px', fontWeight: '700' }}>
                    Advocate Signature &amp; Seal
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delete Payment Modal */}
          {showDeleteModal && paymentToDelete && (
            <div className="mgmt-modal-overlay" onClick={() => setShowDeleteModal(false)}>
              <div className="mgmt-modal-box" style={{ maxWidth: '420px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fee2e2', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Trash2 size={18} color="#dc2626" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#991b1b' }}>Delete Payment Receipt?</h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>Case balance will be adjusted.</p>
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: '#334155', lineHeight: '1.5', margin: '10px 0 16px' }}>
                  Are you sure you want to delete receipt <strong>{paymentToDelete.id}</strong> (₹{Number(paymentToDelete.amount).toLocaleString('en-IN')} on {paymentToDelete.paymentDate})? The case due amount will increase accordingly.
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                  <button
                    className="btn-primary"
                    style={{ background: '#dc2626', borderColor: '#b91c1c' }}
                    onClick={confirmDeletePayment}
                  >
                    Confirm Delete
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
