import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BadgeIndianRupee, Save, RefreshCw, Printer, XCircle, Search,
  Calendar, Phone, ArrowLeft, CheckCircle2, AlertCircle, ChevronRight,
  IndianRupee, Trash2, ShieldCheck, UserCheck
} from 'lucide-react'
import Topbar from '../components/Topbar.jsx'
import { OFFICE } from '../data/menu.js'
import {
  getConsultancyFees, saveConsultancyFee, updateConsultancyFee,
  deleteConsultancyFee, onStorageUpdate
} from '../services/storageService.js'
import './management.css'

export default function ConsultancyFees() {
  const navigate = useNavigate()
  const [records, setRecords] = useState(() => getConsultancyFees())
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [receiptToPrint, setReceiptToPrint] = useState(null)

  // Form State - IMPORTANT: NO CASE ID FIELD
  const getInitialForm = () => ({
    clientName: '',
    phone: '',
    consultationDate: new Date().toISOString().split('T')[0],
    amount: '',
    paymentMode: 'Cash',
    remarks: '',
  })
  const [formData, setFormData] = useState(getInitialForm)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    return onStorageUpdate(() => {
      setRecords(getConsultancyFees())
    })
  }, [])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = (type, message) => setToast({ type, message })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }))
  }

  const validateForm = () => {
    const errs = {}
    if (!formData.clientName.trim()) errs.clientName = 'Client Name is required'
    if (!formData.phone.trim()) {
      errs.phone = 'Mobile number is required'
    } else if (!/^\d{10}$/.test(formData.phone.replace(/[\s-+]/g, ''))) {
      errs.phone = 'Enter valid 10-digit mobile number'
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      errs.amount = 'Enter valid consultancy fee amount'
    }
    if (!formData.consultationDate) errs.consultationDate = 'Date is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSelectRecord = (rec) => {
    setSelectedId(rec.id)
    setFormData({
      clientName: rec.clientName || '',
      phone: rec.phone || '',
      consultationDate: rec.consultationDate || '',
      amount: String(rec.amount || ''),
      paymentMode: rec.paymentMode || 'Cash',
      remarks: rec.remarks || '',
    })
    setErrors({})
    showToast('info', `Selected consultation receipt ${rec.id}`)
  }

  const handleClear = () => {
    setSelectedId(null)
    setFormData(getInitialForm())
    setErrors({})
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    setTimeout(() => {
      try {
        const saved = saveConsultancyFee(formData)
        setSelectedId(saved.id)
        showToast('success', `Consultancy fee ${saved.id} (₹${Number(saved.amount).toLocaleString('en-IN')}) saved! No Case ID created.`)
      } catch (err) {
        showToast('error', err.message || 'Failed to save consultancy record.')
      } finally {
        setLoading(false)
      }
    }, 120)
  }

  const handleUpdate = (e) => {
    e.preventDefault()
    if (!selectedId) return
    if (!validateForm()) return

    setLoading(true)
    setTimeout(() => {
      try {
        const updated = updateConsultancyFee(selectedId, formData)
        showToast('success', `Consultancy record ${updated.id} updated!`)
      } catch (err) {
        showToast('error', err.message || 'Failed to update record.')
      } finally {
        setLoading(false)
      }
    }, 120)
  }

  const confirmDelete = () => {
    if (!itemToDelete) return
    try {
      deleteConsultancyFee(itemToDelete.id)
      if (selectedId === itemToDelete.id) handleClear()
      showToast('success', `Consultancy record ${itemToDelete.id} deleted.`)
    } catch (err) {
      showToast('error', err.message || 'Failed to delete.')
    } finally {
      setShowDeleteModal(false)
      setItemToDelete(null)
    }
  }

  const filteredRecords = records.filter((r) => {
    const q = search.toLowerCase()
    return (
      (r.clientName && r.clientName.toLowerCase().includes(q)) ||
      (r.phone && r.phone.includes(q)) ||
      (r.id && r.id.toLowerCase().includes(q)) ||
      (r.remarks && r.remarks.toLowerCase().includes(q)) ||
      (r.consultationDate && r.consultationDate.includes(q))
    )
  })

  const totalConsultancyAmt = filteredRecords.reduce((acc, r) => acc + Number(r.amount || 0), 0)

  const handlePrintReceipt = (rec) => {
    setReceiptToPrint(rec)
    setTimeout(() => {
      window.print()
    }, 100)
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
            <span className="crumbs-muted">Data Entry</span>
            <ChevronRight size={12} className="crumbs-sep" />
            <b className="crumbs-active">Consultancy Fees (Direct Advice)</b>
          </div>

          <div className="mgmt-header">
            <div className="mgmt-header-left">
              <span className="mgmt-icon-badge" style={{ background: '#f0fdfa', color: '#0d9488', border: '1px solid #99f6e4' }}>
                <BadgeIndianRupee size={20} strokeWidth={2.2} />
              </span>
              <div>
                <div className="mgmt-tag-row">
                  <span className="tag-muted" style={{ color: '#0f766e', background: '#ccfbf1', border: '1px solid #99f6e4' }}>
                    Module 8: Direct Chamber Legal Advice
                  </span>
                  <span className="tag-muted">Independent Record — No Case ID Generated</span>
                </div>
                <h1 className="mgmt-title">Consultancy Fees Management</h1>
                <p className="mgmt-desc">Record direct legal opinions, pre-litigation consultations, &amp; issue advice receipts</p>
              </div>
            </div>
            <div className="mgmt-header-actions">
              <button className="btn-secondary" onClick={() => navigate('/daily-collection')}>
                <span>View in Daily Collections</span>
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
              {toast.type === 'error' && <AlertCircle size={16} />}
              {toast.type === 'info' && <UserCheck size={16} />}
              <span>{toast.message}</span>
            </div>
          )}

          {/* Important Rule Notice */}
          <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={18} color="#0d9488" />
            <span style={{ fontSize: '13px', color: '#134e4a' }}>
              <strong>Notice:</strong> Consultancy-only records represent advisory consultations that do not enter court litigation. As per system rules, no Case Master record or Case ID is generated for these entries. They feed automatically into the Daily Collection Report.
            </span>
          </div>

          <div className="mgmt-two-panel">
            {/* Form */}
            <div className="mgmt-form-panel">
              <div className="panel-card-head">
                <div className="pch-title">
                  <span className="pch-dot" style={{ background: '#0d9488' }} />
                  <h3>{selectedId ? `Edit Consultation (${selectedId})` : 'New Consultancy Entry'}</h3>
                </div>
                {selectedId ? (
                  <span className="status-badge editing">Editing Consultation</span>
                ) : (
                  <span className="status-badge creating">Direct Opinion</span>
                )}
              </div>

              <form className="mgmt-form" onSubmit={(e) => e.preventDefault()}>
                <div className="form-field">
                  <label className="field-lbl">Client Legal Name <span className="req">*</span></label>
                  <input
                    type="text"
                    name="clientName"
                    placeholder="Full name of client seeking advice"
                    className={`form-input ${errors.clientName ? 'input-err' : ''}`}
                    value={formData.clientName}
                    onChange={handleChange}
                    autoFocus
                  />
                  {errors.clientName && <span className="err-msg">{errors.clientName}</span>}
                </div>

                <div className="form-row-2">
                  <div className="form-field">
                    <label className="field-lbl">Mobile Phone <span className="req">*</span></label>
                    <div className="input-with-icon">
                      <Phone size={14} className="input-ic" />
                      <input
                        type="tel"
                        name="phone"
                        placeholder="10-digit mobile no."
                        maxLength={10}
                        className={`form-input ${errors.phone ? 'input-err' : ''}`}
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.phone && <span className="err-msg">{errors.phone}</span>}
                  </div>

                  <div className="form-field">
                    <label className="field-lbl">Consultation Date <span className="req">*</span></label>
                    <div className="input-with-icon">
                      <Calendar size={14} className="input-ic" />
                      <input
                        type="date"
                        name="consultationDate"
                        className={`form-input ${errors.consultationDate ? 'input-err' : ''}`}
                        value={formData.consultationDate}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-field">
                    <label className="field-lbl">Consultancy Fee Amount (₹) <span className="req">*</span></label>
                    <div className="input-with-icon">
                      <IndianRupee size={14} className="input-ic" />
                      <input
                        type="number"
                        name="amount"
                        placeholder="e.g. 1500"
                        className={`form-input ${errors.amount ? 'input-err' : ''}`}
                        value={formData.amount}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.amount && <span className="err-msg">{errors.amount}</span>}
                  </div>

                  <div className="form-field">
                    <label className="field-lbl">Payment Mode</label>
                    <select
                      name="paymentMode"
                      className="form-input form-select"
                      value={formData.paymentMode}
                      onChange={handleChange}
                    >
                      <option value="Cash">Cash at Chambers</option>
                      <option value="UPI">UPI / GPay / PhonePe</option>
                      <option value="Bank Transfer">Bank Transfer / NEFT</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>

                <div className="form-field">
                  <label className="field-lbl">Legal Advice Subject / Remarks</label>
                  <textarea
                    name="remarks"
                    rows={3}
                    placeholder="Brief legal issue discussed (e.g. land partition, consumer grievance, deed scrutiny)..."
                    className="form-input form-textarea"
                    value={formData.remarks}
                    onChange={handleChange}
                  />
                </div>

                <div className="mgmt-btn-bar">
                  <button
                    type="button"
                    className="act-btn btn-save"
                    onClick={handleSave}
                    disabled={loading || !!selectedId}
                    style={{ background: '#0d9488', borderColor: '#0f766e', color: '#ffffff' }}
                  >
                    <Save size={14} />
                    <span>SAVE CONSULTANCY</span>
                  </button>

                  <button
                    type="button"
                    className="act-btn btn-update"
                    onClick={handleUpdate}
                    disabled={loading || !selectedId}
                  >
                    <RefreshCw size={14} />
                    <span>UPDATE</span>
                  </button>

                  {selectedId && (
                    <button
                      type="button"
                      className="act-btn"
                      style={{ background: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' }}
                      onClick={() => {
                        const r = records.find((x) => x.id === selectedId)
                        if (r) {
                          setItemToDelete(r)
                          setShowDeleteModal(true)
                        }
                      }}
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

            {/* Table */}
            <div className="mgmt-table-panel">
              <div className="panel-card-head">
                <div className="pch-title">
                  <span className="pch-dot" style={{ background: '#0d9488' }} />
                  <h3>Consultation Register</h3>
                </div>
                <span className="panel-count">Total: ₹{Number(totalConsultancyAmt).toLocaleString('en-IN')}</span>
              </div>

              <div className="table-search-bar">
                <Search size={14} className="search-ic" />
                <input
                  type="text"
                  placeholder="Search by client name, mobile, date, or advice topic..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="table-search-input"
                />
                {search && <button className="clear-search-btn" onClick={() => setSearch('')}>×</button>}
              </div>

              <div className="table-scroll-container">
                <table className="mgmt-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>RECEIPT</th>
                      <th>CLIENT NAME</th>
                      <th style={{ width: '105px' }}>PHONE</th>
                      <th style={{ width: '90px' }}>DATE</th>
                      <th>LEGAL ADVICE SUBJECT</th>
                      <th style={{ width: '90px', textAlign: 'right' }}>FEE (₹)</th>
                      <th style={{ width: '70px', textAlign: 'center' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="empty-table-cell">
                          <AlertCircle size={18} className="empty-ic" />
                          <span>No consultancy fee records match your search query.</span>
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((rec) => {
                        const isSelected = rec.id === selectedId
                        return (
                          <tr
                            key={rec.id}
                            className={`table-row-clickable ${isSelected ? 'row-selected' : ''}`}
                            onClick={() => handleSelectRecord(rec)}
                          >
                            <td><span className="id-pill" style={{ background: '#ccfbf1', color: '#0f766e', border: '1px solid #99f6e4' }}>{rec.id}</span></td>
                            <td><strong className="primary-text">{rec.clientName}</strong></td>
                            <td><span className="cell-phone">{rec.phone}</span></td>
                            <td><span className="cell-date">{rec.consultationDate}</span></td>
                            <td><span style={{ fontSize: '12px', color: '#475569' }}>{rec.remarks || 'General advice'}</span></td>
                            <td style={{ textAlign: 'right' }}>
                              <span style={{ color: '#0d9488', fontWeight: '800', fontSize: '13px' }}>
                                ₹{Number(rec.amount || 0).toLocaleString('en-IN')}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                className="btn-icon-subtle"
                                style={{ padding: '3px 6px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handlePrintReceipt(rec)
                                }}
                                title="Print Consultation Slip"
                              >
                                <Printer size={12} color="#0d9488" />
                              </button>
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

          {/* Delete Modal */}
          {showDeleteModal && itemToDelete && (
            <div className="mgmt-modal-overlay" onClick={() => setShowDeleteModal(false)}>
              <div className="mgmt-modal-box" style={{ maxWidth: '420px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fee2e2', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Trash2 size={18} color="#dc2626" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#991b1b' }}>Delete Consultation Record?</h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>Action cannot be undone.</p>
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: '#334155', lineHeight: '1.5', margin: '10px 0 16px' }}>
                  Are you sure you want to delete consultancy record <strong>{itemToDelete.id}</strong> ({itemToDelete.clientName} — ₹{Number(itemToDelete.amount).toLocaleString('en-IN')})?
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                  <button className="btn-primary" style={{ background: '#dc2626', borderColor: '#b91c1c' }} onClick={confirmDelete}>
                    Confirm Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Printable Receipt */}
          {receiptToPrint && (
            <div className="printable-docket">
              <div className="print-header">
                <div className="print-chambers">
                  <h2>{OFFICE.name}</h2>
                  <p className="print-address">{OFFICE.address}</p>
                  <p className="print-title">LEGAL CONSULTATION &amp; ADVICE FEE RECEIPT</p>
                </div>
                <div className="print-meta">
                  <div><b>Receipt No:</b> {receiptToPrint.id}</div>
                  <div><b>Date:</b> {receiptToPrint.consultationDate}</div>
                </div>
              </div>

              <div className="print-divider" />

              <table className="print-table">
                <tbody>
                  <tr>
                    <th>Client Name:</th>
                    <td><strong>{receiptToPrint.clientName}</strong></td>
                    <th>Contact Phone:</th>
                    <td>{receiptToPrint.phone}</td>
                  </tr>
                  <tr>
                    <th>Consultation Nature:</th>
                    <td colSpan={3}>{receiptToPrint.remarks || 'Legal consultation and documentation scrutiny'}</td>
                  </tr>
                  <tr>
                    <th>Fee Amount Received:</th>
                    <td><strong style={{ fontSize: '15px' }}>₹{Number(receiptToPrint.amount).toLocaleString('en-IN')}</strong></td>
                    <th>Payment Mode:</th>
                    <td>{receiptToPrint.paymentMode}</td>
                  </tr>
                </tbody>
              </table>

              <div className="print-signatures">
                <div className="print-sig-box">
                  <div className="sig-line" />
                  <span>Client Acknowledgement</span>
                </div>
                <div className="print-sig-box right">
                  <div className="sig-line" />
                  <span>Advocate Signature &amp; Stamp</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
