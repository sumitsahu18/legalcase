import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase, FolderPlus, Save, RefreshCw, Printer, XCircle, Search,
  Calendar, Building2, Gavel, ArrowLeft, CheckCircle2,
  AlertCircle, ChevronRight, Hash, Phone, User, Trash2, Eye
} from 'lucide-react'
import Topbar from '../components/Topbar.jsx'
import { OFFICE } from '../data/menu.js'
import {
  getClients, getCases, saveCase, updateCase, deleteCase,
  getPaymentsByCaseId, onStorageUpdate
} from '../services/storageService.js'
import './management.css'

export default function CaseManagement() {
  const navigate = useNavigate()
  const [clients, setClients] = useState(() => getClients())
  const [cases, setCases] = useState(() => getCases())
  const [selectedCaseId, setSelectedCaseId] = useState(null)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [caseToDelete, setCaseToDelete] = useState(null)
  const [viewModalCase, setViewModalCase] = useState(null)

  // Initial Form State
  const getInitialForm = () => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return {
      clientId: '',
      clientName: '',
      phone: '',
      advocateName: 'ANUPAM MAITY (ADVOCATE)',
      underSection: '',
      policeStation: '',
      caseNumber: '',
      psCaseNumber: '',
      courtName: '',
      vsName: '',
      idNumber: '',
      tcc: '',
      purpose: '',
      caseDetails: '',
      totalFees: '',
      paidAmount: '',
      dueAmount: '',
      nextDate: d.toISOString().split('T')[0],
      lc: '',
      ppName: '',
      otherCaseNumber: '',
      notes: '',
    }
  }

  const [formData, setFormData] = useState(getInitialForm)
  const [errors, setErrors] = useState({})

  // Subscribe to storage updates
  useEffect(() => {
    return onStorageUpdate(() => {
      setClients(getClients())
      setCases(getCases())
    })
  }, [])

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = (type, message) => {
    setToast({ type, message })
  }

  // Handle Client ID selection: auto-populate Client Name and Phone
  const handleClientSelectChange = (e) => {
    const selectedCid = e.target.value
    if (!selectedCid) {
      setFormData((prev) => ({
        ...prev,
        clientId: '',
        clientName: '',
        phone: '',
      }))
      return
    }

    const matchedClient = clients.find((c) => c.id === selectedCid)
    if (matchedClient) {
      setFormData((prev) => ({
        ...prev,
        clientId: matchedClient.id,
        clientName: matchedClient.name,
        phone: matchedClient.phone || '',
        totalFees: prev.totalFees || matchedClient.fees || '',
      }))
      if (errors.clientId) {
        setErrors((prev) => ({ ...prev, clientId: null }))
      }
    }
  }

  // Handle regular input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => {
      const next = { ...prev, [name]: value }
      // Auto-compute due amount when totalFees or paidAmount changes
      if (name === 'totalFees' || name === 'paidAmount') {
        const tf = Number(name === 'totalFees' ? value : prev.totalFees || 0)
        const pa = Number(name === 'paidAmount' ? value : prev.paidAmount || 0)
        next.dueAmount = Math.max(0, tf - pa)
      }
      return next
    })

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  // Validation
  const validateForm = () => {
    const errs = {}
    if (!formData.clientId && !formData.clientName.trim()) {
      errs.clientId = 'Please select a registered client or provide client name'
    }
    if (!formData.caseNumber.trim()) errs.caseNumber = 'Case Number is required'
    if (!formData.courtName.trim()) errs.courtName = 'Court Name is required'
    if (!formData.nextDate) errs.nextDate = 'Next hearing date is required'
    if (!formData.purpose.trim()) errs.purpose = 'For / Purpose of hearing is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Select a case from the table for editing
  const handleSelectCase = (cs) => {
    setSelectedCaseId(cs.id)
    const tf = Number(cs.totalFees || 0)
    const pa = Number(cs.paidAmount || 0)
    setFormData({
      clientId: cs.clientId || '',
      clientName: cs.clientName || '',
      phone: cs.phone || '',
      advocateName: cs.advocateName || 'ANUPAM MAITY (ADVOCATE)',
      underSection: cs.underSection || '',
      policeStation: cs.policeStation || '',
      caseNumber: cs.caseNumber || '',
      psCaseNumber: cs.psCaseNumber || cs.otherCaseNumber || '',
      courtName: cs.courtName || '',
      vsName: cs.vsName || '',
      idNumber: cs.idNumber || '',
      tcc: cs.tcc || '',
      purpose: cs.purpose || '',
      caseDetails: cs.caseDetails || '',
      totalFees: cs.totalFees !== undefined ? String(cs.totalFees) : '',
      paidAmount: cs.paidAmount !== undefined ? String(cs.paidAmount) : '',
      dueAmount: Math.max(0, tf - pa),
      nextDate: cs.nextDate || '',
      lc: cs.lc || '',
      ppName: cs.ppName || '',
      otherCaseNumber: cs.otherCaseNumber || '',
      notes: cs.notes || '',
    })
    setErrors({})
    showToast('info', `Selected Case ID: ${cs.id} (${cs.caseNumber}) — editing mode`)
  }

  // Clear form
  const handleClear = () => {
    setSelectedCaseId(null)
    setFormData(getInitialForm())
    setErrors({})
  }

  // Save new case
  const handleSave = (e) => {
    if (e) e.preventDefault()
    if (!validateForm()) {
      showToast('error', 'Please resolve all required fields.')
      return
    }

    setLoading(true)
    setTimeout(() => {
      try {
        const saved = saveCase(formData)
        setSelectedCaseId(saved.id)
        showToast('success', `Case ${saved.caseNumber} registered successfully with unique Case ID ${saved.id}!`)
      } catch (err) {
        showToast('error', err.message || 'Failed to save case.')
      } finally {
        setLoading(false)
      }
    }, 120)
  }

  // Update existing case (CRITICAL: preserves existing Case ID!)
  const handleUpdate = (e) => {
    if (e) e.preventDefault()
    if (!selectedCaseId) {
      showToast('error', 'Please select a case from the table to update.')
      return
    }
    if (!validateForm()) {
      showToast('error', 'Please resolve all required fields.')
      return
    }

    setLoading(true)
    setTimeout(() => {
      try {
        const updated = updateCase(selectedCaseId, formData)
        showToast('success', `Case ${updated.id} (${updated.caseNumber}) updated successfully! Case ID preserved.`)
      } catch (err) {
        showToast('error', err.message || 'Failed to update case.')
      } finally {
        setLoading(false)
      }
    }, 120)
  }

  // Delete Case with confirmation
  const promptDeleteCase = (cs) => {
    setCaseToDelete(cs)
    setShowDeleteModal(true)
  }

  const confirmDeleteCase = () => {
    if (!caseToDelete) return
    try {
      deleteCase(caseToDelete.id)
      if (selectedCaseId === caseToDelete.id) {
        handleClear()
      }
      showToast('success', `Case ${caseToDelete.id} (${caseToDelete.caseNumber}) deleted.`)
    } catch (err) {
      showToast('error', err.message || 'Failed to delete case.')
    } finally {
      setShowDeleteModal(false)
      setCaseToDelete(null)
    }
  }

  // Open Full Case Details Modal
  const handleViewCaseDetails = (cs) => {
    const payments = getPaymentsByCaseId(cs.id)
    setViewModalCase({ ...cs, payments })
  }

  // Print Case Docket
  const handlePrint = () => {
    if (!selectedCaseId) {
      showToast('error', 'Please select a case from the table to print docket.')
      return
    }
    window.print()
  }

  // Filter cases
  const filteredCases = cases.filter((cs) => {
    const q = search.toLowerCase()
    return (
      (cs.id && cs.id.toLowerCase().includes(q)) ||
      (cs.caseNumber && cs.caseNumber.toLowerCase().includes(q)) ||
      (cs.clientName && cs.clientName.toLowerCase().includes(q)) ||
      (cs.courtName && cs.courtName.toLowerCase().includes(q)) ||
      (cs.purpose && cs.purpose.toLowerCase().includes(q)) ||
      (cs.vsName && cs.vsName.toLowerCase().includes(q)) ||
      (cs.idNumber && cs.idNumber.toLowerCase().includes(q)) ||
      (cs.tcc && cs.tcc.toLowerCase().includes(q)) ||
      (cs.underSection && cs.underSection.toLowerCase().includes(q)) ||
      (cs.policeStation && cs.policeStation.toLowerCase().includes(q)) ||
      (cs.nextDate && cs.nextDate.includes(q)) ||
      (cs.clientId && cs.clientId.toLowerCase().includes(q))
    )
  })

  const selectedCase = cases.find((c) => c.id === selectedCaseId) || null

  return (
    <div className="app-shell">
      <div className="app-main">
        <Topbar />

        <main className="dash mgmt-page">
          {/* Breadcrumb Navigation */}
          <div className="crumbs">
            <button className="crumbs-link" onClick={() => navigate('/dashboard')}>
              <ArrowLeft size={13} />
              <span>Dashboard</span>
            </button>
            <ChevronRight size={12} className="crumbs-sep" />
            <span className="crumbs-muted">Master Entry</span>
            <ChevronRight size={12} className="crumbs-sep" />
            <b className="crumbs-active">Case Master (Case Registry &amp; Dockets)</b>
          </div>

          {/* Page Sub-header */}
          <div className="mgmt-header">
            <div className="mgmt-header-left">
              <span className="mgmt-icon-badge case-badge">
                <Briefcase size={20} strokeWidth={2.2} />
              </span>
              <div>
                <div className="mgmt-tag-row">
                  <span className="tag-violet">Case Master &amp; Hearing Registry</span>
                  <span className="tag-muted">{cases.length} Registered Cases</span>
                </div>
                <h1 className="mgmt-title">Case Master Management</h1>
                <p className="mgmt-desc">Generate unique Case IDs, manage court proceedings, fee accounts &amp; next hearing schedules</p>
              </div>
            </div>
            <div className="mgmt-header-actions">
              <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
                <ArrowLeft size={14} />
                <span>Dashboard</span>
              </button>
              <button className="btn-primary" onClick={handleClear}>
                <FolderPlus size={14} />
                <span>New Case Registration</span>
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          {toast && (
            <div className={`mgmt-toast toast-${toast.type}`}>
              {toast.type === 'success' && <CheckCircle2 size={16} />}
              {toast.type === 'error' && <AlertCircle size={16} />}
              {toast.type === 'info' && <CheckCircle2 size={16} />}
              <span>{toast.message}</span>
            </div>
          )}

          {/* Two-Panel Layout */}
          <div className="mgmt-two-panel">
            {/* ================= LEFT SIDE: CASE FORM ================= */}
            <div className="mgmt-form-panel">
              <div className="panel-card-head">
                <div className="pch-title">
                  <span className="pch-dot pch-violet" />
                  <h3>{selectedCaseId ? `Edit Case (${selectedCaseId} — ${formData.caseNumber || ''})` : 'New Case Registration'}</h3>
                </div>
                {selectedCaseId ? (
                  <span className="status-badge editing">Editing Case</span>
                ) : (
                  <span className="status-badge creating">Unique Case ID Auto-Generated</span>
                )}
              </div>

              <form className="mgmt-form" onSubmit={(e) => e.preventDefault()}>
                {/* Row 1: Case ID & Client Selection */}
                <div className="form-row-2">
                  <div className="form-field">
                    <label className="field-lbl">Case ID (Auto Unique)</label>
                    <input
                      type="text"
                      className="form-input readonly-input"
                      value={selectedCaseId || '(Unique ID Auto-Generated on Save)'}
                      readOnly
                    />
                  </div>
                  <div className="form-field">
                    <label className="field-lbl">Select Registered Client <span className="req">*</span></label>
                    <div className="input-with-icon">
                      <User size={14} className="input-ic" />
                      <select
                        name="clientId"
                        className={`form-input form-select ${errors.clientId ? 'input-err' : ''}`}
                        value={formData.clientId}
                        onChange={handleClientSelectChange}
                      >
                        <option value="">-- Choose Registered Client --</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.id} — {c.name} {c.phone ? `(${c.phone})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.clientId && <span className="err-msg">{errors.clientId}</span>}
                  </div>
                </div>

                {/* Row 2: Client Name & Mobile */}
                <div className="form-row-2">
                  <div className="form-field">
                    <label className="field-lbl">Client Name</label>
                    <input
                      type="text"
                      name="clientName"
                      placeholder="Client legal name"
                      className="form-input"
                      value={formData.clientName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-field">
                    <label className="field-lbl">Client Phone Number</label>
                    <div className="input-with-icon">
                      <Phone size={14} className="input-ic" />
                      <input
                        type="tel"
                        name="phone"
                        placeholder="10-digit mobile number"
                        className="form-input"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Row 3: Advocate Name & L/C (Law Clerk) */}
                <div className="form-row-2">
                  <div className="form-field">
                    <label className="field-lbl">Advocate Name <span className="req">*</span></label>
                    <input
                      type="text"
                      name="advocateName"
                      placeholder="e.g. ANUPAM MAITY (ADVOCATE)"
                      className="form-input"
                      value={formData.advocateName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-field">
                    <label className="field-lbl">L/C (Law Clerk / Legal Counsel)</label>
                    <input
                      type="text"
                      name="lc"
                      placeholder="e.g. Bikash Mondal (L/C)"
                      className="form-input"
                      value={formData.lc}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Row 4: Court Name & V.S. Name (Opposite Party) */}
                <div className="form-row-2">
                  <div className="form-field">
                    <label className="field-lbl">Court Name <span className="req">*</span></label>
                    <div className="input-with-icon">
                      <Building2 size={14} className="input-ic" />
                      <input
                        type="text"
                        name="courtName"
                        placeholder="e.g. ACJM Court, Contai or Sessions Court"
                        className={`form-input ${errors.courtName ? 'input-err' : ''}`}
                        value={formData.courtName}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.courtName && <span className="err-msg">{errors.courtName}</span>}
                  </div>
                  <div className="form-field">
                    <label className="field-lbl">V.S. Name (Versus / Opposite Party)</label>
                    <input
                      type="text"
                      name="vsName"
                      placeholder="e.g. State of West Bengal or Bimal Roy"
                      className="form-input"
                      value={formData.vsName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Row 5: Case Number & Under Section (U/S) */}
                <div className="form-row-2">
                  <div className="form-field">
                    <label className="field-lbl">Case Number <span className="req">*</span></label>
                    <div className="input-with-icon">
                      <Hash size={14} className="input-ic" />
                      <input
                        type="text"
                        name="caseNumber"
                        placeholder="e.g. CR/342/2026 or TS/108/2026"
                        className={`form-input ${errors.caseNumber ? 'input-err' : ''}`}
                        value={formData.caseNumber}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.caseNumber && <span className="err-msg">{errors.caseNumber}</span>}
                  </div>

                  <div className="form-field">
                    <label className="field-lbl">Under Section (U/S)</label>
                    <input
                      type="text"
                      name="underSection"
                      placeholder="e.g. U/S 302/34 IPC or 138 NI Act"
                      className="form-input"
                      value={formData.underSection}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Row 6: Police Station (P.S.) & P.S. Case Number */}
                <div className="form-row-2">
                  <div className="form-field">
                    <label className="field-lbl">Police Station (P.S.)</label>
                    <input
                      type="text"
                      name="policeStation"
                      placeholder="e.g. Ramnagar PS, Contai PS, Digha Coastal PS"
                      className="form-input"
                      value={formData.policeStation}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-field">
                    <label className="field-lbl">P.S. Case Number</label>
                    <input
                      type="text"
                      name="psCaseNumber"
                      placeholder="e.g. Ramnagar PS Case No. 84/2025"
                      className="form-input"
                      value={formData.psCaseNumber}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Row 7: ID Number & T.C.C. (Prominent from PDF) */}
                <div className="form-row-2">
                  <div className="form-field">
                    <label className="field-lbl">ID Number (Chamber / Ref ID)</label>
                    <input
                      type="text"
                      name="idNumber"
                      placeholder="e.g. ID-101, ID-402"
                      className="form-input"
                      value={formData.idNumber}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-field">
                    <label className="field-lbl">T.C.C. (Trial Court Case)</label>
                    <input
                      type="text"
                      name="tcc"
                      placeholder="e.g. TCC-42/26, TCC-55/26"
                      className="form-input"
                      value={formData.tcc}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Row 8: Next Date & Hearing Purpose */}
                <div className="form-row-2">
                  <div className="form-field">
                    <label className="field-lbl">Case Next Date <span className="req">*</span></label>
                    <div className="input-with-icon">
                      <Calendar size={14} className="input-ic" />
                      <input
                        type="date"
                        name="nextDate"
                        className={`form-input ${errors.nextDate ? 'input-err' : ''}`}
                        value={formData.nextDate}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.nextDate && <span className="err-msg">{errors.nextDate}</span>}
                  </div>

                  <div className="form-field">
                    <label className="field-lbl">For / Purpose of Hearing <span className="req">*</span></label>
                    <div className="input-with-icon">
                      <Gavel size={14} className="input-ic" />
                      <input
                        type="text"
                        name="purpose"
                        placeholder="e.g. Evidence, Hearing, Framing Charge, Argument, Bail"
                        className={`form-input ${errors.purpose ? 'input-err' : ''}`}
                        value={formData.purpose}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.purpose && <span className="err-msg">{errors.purpose}</span>}
                  </div>
                </div>

                {/* ================= ACCOUNT / PAYMENT DETAILS ================= */}
                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', margin: '4px 0' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', color: '#475569', marginBottom: '8px' }}>
                    Account &amp; Payment Details
                  </div>
                  <div className="form-row-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    <div className="form-field">
                      <label className="field-lbl">Total Case Fees (₹)</label>
                      <input
                        type="number"
                        name="totalFees"
                        placeholder="e.g. 25000"
                        className="form-input"
                        value={formData.totalFees}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-field">
                      <label className="field-lbl">Paid Amount (₹)</label>
                      <input
                        type="number"
                        name="paidAmount"
                        placeholder="e.g. 15000"
                        className="form-input"
                        value={formData.paidAmount}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-field">
                      <label className="field-lbl">Due Amount (₹)</label>
                      <input
                        type="number"
                        name="dueAmount"
                        className="form-input readonly-input"
                        value={formData.dueAmount !== '' ? formData.dueAmount : Math.max(0, Number(formData.totalFees || 0) - Number(formData.paidAmount || 0))}
                        readOnly
                        style={{ color: Number(formData.dueAmount || 0) > 0 ? '#dc2626' : '#16a34a', fontWeight: '700' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Row 10: Case Details / Notes */}
                <div className="form-field">
                  <label className="field-lbl">Case Details &amp; Chamber Remarks</label>
                  <textarea
                    name="caseDetails"
                    rows={2}
                    placeholder="Enter stage notes, witness details, document custody records..."
                    className="form-input form-textarea"
                    value={formData.caseDetails}
                    onChange={handleChange}
                  />
                </div>

                {/* Action Buttons Row */}
                <div className="mgmt-btn-bar">
                  <button
                    type="button"
                    className="act-btn btn-save"
                    onClick={handleSave}
                    disabled={loading || !!selectedCaseId}
                    title={selectedCaseId ? 'Clear selection to create a new case' : 'Save case permanently'}
                  >
                    <Save size={14} />
                    <span>SAVE</span>
                  </button>

                  <button
                    type="button"
                    className="act-btn btn-update"
                    onClick={handleUpdate}
                    disabled={loading || !selectedCaseId}
                    title={!selectedCaseId ? 'Select a case from the table to update' : 'Save modifications'}
                  >
                    <RefreshCw size={14} />
                    <span>UPDATE</span>
                  </button>

                  {selectedCaseId && (
                    <button
                      type="button"
                      className="act-btn"
                      style={{ background: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' }}
                      onClick={() => promptDeleteCase(selectedCase)}
                      disabled={loading}
                      title="Delete case with confirmation"
                    >
                      <Trash2 size={14} />
                      <span>DELETE</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="act-btn btn-print"
                    onClick={handlePrint}
                    disabled={!selectedCaseId}
                    title="Print official court case hearing brief"
                  >
                    <Printer size={14} />
                    <span>PRINT</span>
                  </button>

                  <button
                    type="button"
                    className="act-btn btn-clear"
                    onClick={handleClear}
                    title="Clear fields for a fresh case entry"
                  >
                    <XCircle size={14} />
                    <span>CLEAR</span>
                  </button>
                </div>
              </form>
            </div>

            {/* ================= RIGHT SIDE: CASE TABLE ================= */}
            <div className="mgmt-table-panel">
              <div className="panel-card-head">
                <div className="pch-title">
                  <span className="pch-dot pch-violet" />
                  <h3>Hearing Cause List &amp; Case Registry</h3>
                </div>
                <span className="panel-count">{filteredCases.length} of {cases.length} Records</span>
              </div>

              {/* Search Bar */}
              <div className="table-search-bar">
                <Search size={14} className="search-ic" />
                <input
                  type="text"
                  placeholder="Search by case no, client name, court, purpose, U/S, TCC or ID No..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="table-search-input"
                />
                {search && (
                  <button className="clear-search-btn" onClick={() => setSearch('')}>
                    ×
                  </button>
                )}
              </div>

              {/* Case Interactive Table */}
              <div className="table-scroll-container">
                <table className="mgmt-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>CASE ID</th>
                      <th>CASE NUMBER &amp; COURT</th>
                      <th>CLIENT NAME</th>
                      <th style={{ width: '85px' }}>T.C.C / ID</th>
                      <th style={{ width: '90px' }}>NEXT DATE</th>
                      <th style={{ width: '80px' }}>DUE (₹)</th>
                      <th style={{ width: '75px' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCases.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="empty-table-cell">
                          <AlertCircle size={18} className="empty-ic" />
                          <span>No case records match your search criteria.</span>
                        </td>
                      </tr>
                    ) : (
                      filteredCases.map((cs) => {
                        const isSelected = cs.id === selectedCaseId
                        return (
                          <tr
                            key={cs.id}
                            className={`table-row-clickable ${isSelected ? 'row-selected' : ''}`}
                            onClick={() => handleSelectCase(cs)}
                            title="Click to load case into form"
                          >
                            <td>
                              <span className="id-pill case-id">{cs.id}</span>
                            </td>
                            <td>
                              <div className="case-no-cell">
                                <strong className="primary-text">{cs.caseNumber}</strong>
                                <small className="muted-subtext">{cs.courtName}</small>
                                {cs.underSection && (
                                  <span style={{ fontSize: '10px', color: '#6d28d9', fontWeight: '500' }}>{cs.underSection}</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className="client-link-cell">
                                <span className="cell-client">{cs.clientName}</span>
                                <small className="cell-cid">{cs.clientId}</small>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '11px', fontWeight: '600', color: '#0f172a' }}>{cs.tcc || '—'}</span>
                                {cs.idNumber && <small style={{ fontSize: '10px', color: '#64748b' }}>{cs.idNumber}</small>}
                              </div>
                            </td>
                            <td>
                              <div className="hearing-date-badge">
                                <Calendar size={11} className="h-cal-ic" />
                                <span>{cs.nextDate}</span>
                              </div>
                            </td>
                            <td>
                              <span style={{ fontSize: '12px', fontWeight: '700', color: Number(cs.dueAmount || 0) > 0 ? '#dc2626' : '#16a34a' }}>
                                ₹{Number(cs.dueAmount || 0).toLocaleString('en-IN')}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  className="btn-icon-subtle"
                                  style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}
                                  onClick={() => handleViewCaseDetails(cs)}
                                  title="View Case Docket & Payments"
                                >
                                  <Eye size={13} color="#7c3aed" />
                                </button>
                                <button
                                  type="button"
                                  className="btn-icon-subtle"
                                  style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid #fecaca', background: '#fff1f2', cursor: 'pointer' }}
                                  onClick={() => promptDeleteCase(cs)}
                                  title="Delete Case Record"
                                >
                                  <Trash2 size={13} color="#dc2626" />
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

              {/* Table Footer Instructions */}
              <div className="table-foot-hint">
                <span className="hint-highlight">Tip:</span>
                <span>Click any row to load into form for editing hearing dates &amp; fees. Case ID is strictly preserved on update.</span>
              </div>
            </div>
          </div>

          {/* ================= VIEW CASE MODAL ================= */}
          {viewModalCase && (
            <div className="mgmt-modal-overlay" onClick={() => setViewModalCase(null)}>
              <div className="mgmt-modal-box" style={{ maxWidth: '750px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
                <div className="mgmt-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>
                      Court Docket: {viewModalCase.caseNumber} ({viewModalCase.id})
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                      Court: {viewModalCase.courtName} · Client: {viewModalCase.clientName} ({viewModalCase.clientId})
                    </p>
                  </div>
                  <button className="clear-search-btn" onClick={() => setViewModalCase(null)}>✕</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', margin: '14px 0', fontSize: '13px' }}>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div><b>Advocate:</b> {viewModalCase.advocateName || OFFICE.name}</div>
                    <div><b>Law Clerk:</b> {viewModalCase.lc || '—'}</div>
                    <div><b>Under Section:</b> {viewModalCase.underSection || '—'}</div>
                    <div><b>Police Station:</b> {viewModalCase.policeStation || '—'}</div>
                    <div><b>P.S. Case No:</b> {viewModalCase.psCaseNumber || '—'}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div><b>V.S. Name:</b> {viewModalCase.vsName || '—'}</div>
                    <div><b>T.C.C:</b> {viewModalCase.tcc || '—'}</div>
                    <div><b>ID Number:</b> {viewModalCase.idNumber || '—'}</div>
                    <div><b>Next Hearing Date:</b> <span style={{ color: '#7c3aed', fontWeight: '700' }}>{viewModalCase.nextDate}</span></div>
                    <div><b>Purpose:</b> {viewModalCase.purpose || '—'}</div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', margin: '10px 0' }}>
                  <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <small style={{ color: '#64748b', fontSize: '11px' }}>Total Case Fees</small>
                    <div style={{ fontSize: '15px', fontWeight: '700' }}>₹{Number(viewModalCase.totalFees || 0).toLocaleString('en-IN')}</div>
                  </div>
                  <div style={{ background: '#f0fdf4', padding: '8px 12px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                    <small style={{ color: '#166534', fontSize: '11px' }}>Total Paid</small>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#15803d' }}>₹{Number(viewModalCase.paidAmount || 0).toLocaleString('en-IN')}</div>
                  </div>
                  <div style={{ background: '#fff1f2', padding: '8px 12px', borderRadius: '6px', border: '1px solid #fecaca' }}>
                    <small style={{ color: '#991b1b', fontSize: '11px' }}>Outstanding Due</small>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#b91c1c' }}>₹{Number(viewModalCase.dueAmount || 0).toLocaleString('en-IN')}</div>
                  </div>
                </div>

                {/* Payments */}
                <h4 style={{ fontSize: '13px', margin: '14px 0 6px', color: '#1e293b' }}>
                  Case Payment Receipts ({viewModalCase.payments?.length || 0})
                </h4>
                {(!viewModalCase.payments || viewModalCase.payments.length === 0) ? (
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>No payment entries recorded yet for this case.</p>
                ) : (
                  <div style={{ maxHeight: '130px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                    <table className="mgmt-table" style={{ fontSize: '12px' }}>
                      <thead>
                        <tr>
                          <th>Receipt No</th>
                          <th>Date</th>
                          <th>T.C.C</th>
                          <th>Mode</th>
                          <th>Amount</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewModalCase.payments.map((p) => (
                          <tr key={p.id}>
                            <td><b>{p.id}</b></td>
                            <td>{p.paymentDate}</td>
                            <td>{p.tcc || '—'}</td>
                            <td>{p.mode}</td>
                            <td style={{ color: '#16a34a', fontWeight: '700' }}>₹{Number(p.amount).toLocaleString('en-IN')}</td>
                            <td>{p.remarks || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                  <button className="btn-secondary" onClick={() => setViewModalCase(null)}>
                    Close Docket
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= DELETE CASE MODAL ================= */}
          {showDeleteModal && caseToDelete && (
            <div className="mgmt-modal-overlay" onClick={() => setShowDeleteModal(false)}>
              <div className="mgmt-modal-box" style={{ maxWidth: '420px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fee2e2', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Trash2 size={18} color="#dc2626" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#991b1b' }}>Delete Case Record?</h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>Permanent deletion from registry.</p>
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: '#334155', lineHeight: '1.5', margin: '10px 0 16px' }}>
                  Are you sure you want to permanently delete case <strong>{caseToDelete.caseNumber}</strong> ({caseToDelete.id})? Client and payment records will remain preserved.
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                  <button
                    className="btn-primary"
                    style={{ background: '#dc2626', borderColor: '#b91c1c' }}
                    onClick={confirmDeleteCase}
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= Printable Court Docket ================= */}
          {selectedCase && (
            <div className="printable-docket" id="printable-case-docket">
              <div className="print-header">
                <div className="print-chambers">
                  <h2>{OFFICE.name}</h2>
                  <p className="print-address">{OFFICE.address}</p>
                  <p className="print-title">COURT CASE BRIEF &amp; CAUSE LIST DOCKET</p>
                </div>
                <div className="print-meta">
                  <div><b>Case ID:</b> {selectedCase.id}</div>
                  <div><b>Case Number:</b> {selectedCase.caseNumber}</div>
                  <div><b>T.C.C:</b> {selectedCase.tcc || '—'}</div>
                  <div><b>ID No:</b> {selectedCase.idNumber || '—'}</div>
                </div>
              </div>

              <div className="print-divider" />

              <table className="print-table">
                <tbody>
                  <tr>
                    <th>Client Name:</th>
                    <td><strong>{selectedCase.clientName}</strong> ({selectedCase.clientId})</td>
                    <th>Contact Phone:</th>
                    <td>{selectedCase.phone || '—'}</td>
                  </tr>
                  <tr>
                    <th>Advocate on Record:</th>
                    <td>{selectedCase.advocateName || OFFICE.name}</td>
                    <th>L/C (Law Clerk):</th>
                    <td>{selectedCase.lc || '—'}</td>
                  </tr>
                  <tr>
                    <th>Court Name:</th>
                    <td><strong>{selectedCase.courtName}</strong></td>
                    <th>Versus (Opposite Party):</th>
                    <td>{selectedCase.vsName || '—'}</td>
                  </tr>
                  <tr>
                    <th>Under Section (U/S):</th>
                    <td>{selectedCase.underSection || '—'}</td>
                    <th>Police Station / PS Case:</th>
                    <td>{selectedCase.policeStation || '—'} / {selectedCase.psCaseNumber || '—'}</td>
                  </tr>
                  <tr>
                    <th>Next Hearing Date:</th>
                    <td><strong style={{ fontSize: '13px' }}>{selectedCase.nextDate}</strong></td>
                    <th>For / Hearing Purpose:</th>
                    <td><strong>{selectedCase.purpose}</strong></td>
                  </tr>
                  <tr>
                    <th>Total Case Fees:</th>
                    <td>₹{Number(selectedCase.totalFees || 0).toLocaleString('en-IN')}</td>
                    <th>Fee Status:</th>
                    <td>Paid: ₹{Number(selectedCase.paidAmount || 0).toLocaleString('en-IN')} | Due: ₹{Number(selectedCase.dueAmount || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <th>Case Brief &amp; Notes:</th>
                    <td colSpan={3}>{selectedCase.caseDetails || selectedCase.notes || 'Routine court proceeding scheduled.'}</td>
                  </tr>
                </tbody>
              </table>

              <div className="print-terms">
                <h4>Advocate Chambers Case Brief Verification:</h4>
                <p>
                  Certified that the above court listing and cause list information is accurate as recorded in the court registry and advocate diary.
                </p>
              </div>

              <div className="print-signatures">
                <div className="print-sig-box">
                  <div className="sig-line" />
                  <span>Law Clerk / Advocate Assistant</span>
                </div>
                <div className="print-sig-box right">
                  <div className="sig-line" />
                  <span>Advocate Signature &amp; Seal</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
