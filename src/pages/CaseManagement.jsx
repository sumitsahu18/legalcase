import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase, FolderPlus, Save, RefreshCw, Printer, XCircle, Search,
  Calendar, Building2, Gavel, ArrowLeft, CheckCircle2,
  AlertCircle, ChevronRight, Hash, Phone, User
} from 'lucide-react'
import Topbar from '../components/Topbar.jsx'
import { OFFICE } from '../data/menu.js'
import {
  getClients, getCases, saveCase, updateCase, onStorageUpdate
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

  // Initial Form State
  const getInitialForm = () => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return {
      clientId: '',
      clientName: '',
      phone: '',
      caseNumber: '',
      nextDate: d.toISOString().split('T')[0],
      purpose: '',
      courtName: '',
      ppName: '',
      otherCaseNumber: '',
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
      }))
      if (errors.clientId) {
        setErrors((prev) => ({ ...prev, clientId: null }))
      }
    }
  }

  // Handle regular input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  // Validation
  const validateForm = () => {
    const errs = {}
    if (!formData.clientId) errs.clientId = 'Please select a Client ID'
    if (!formData.caseNumber.trim()) errs.caseNumber = 'Case Number is required'
    if (!formData.nextDate) errs.nextDate = 'Next hearing date is required'
    if (!formData.courtName.trim()) errs.courtName = 'Court Name is required'
    if (!formData.purpose.trim()) errs.purpose = 'For / Purpose of hearing is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Select a case from the table
  const handleSelectCase = (cs) => {
    setSelectedCaseId(cs.id)
    setFormData({
      clientId: cs.clientId || '',
      clientName: cs.clientName || '',
      phone: cs.phone || '',
      caseNumber: cs.caseNumber || '',
      nextDate: cs.nextDate || '',
      purpose: cs.purpose || '',
      courtName: cs.courtName || '',
      ppName: cs.ppName || '',
      otherCaseNumber: cs.otherCaseNumber || '',
    })
    setErrors({})
    showToast('info', `Selected Case: ${cs.caseNumber} (${cs.id})`)
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
        showToast('success', `Case ${saved.caseNumber} linked to client ${saved.clientName} successfully!`)
      } catch (err) {
        showToast('error', err.message || 'Failed to save case.')
      } finally {
        setLoading(false)
      }
    }, 150)
  }

  // Update existing case
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
        showToast('success', `Case ${updated.caseNumber} updated successfully!`)
      } catch (err) {
        showToast('error', err.message || 'Failed to update case.')
      } finally {
        setLoading(false)
      }
    }, 150)
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
      (cs.caseNumber && cs.caseNumber.toLowerCase().includes(q)) ||
      (cs.clientName && cs.clientName.toLowerCase().includes(q)) ||
      (cs.courtName && cs.courtName.toLowerCase().includes(q)) ||
      (cs.purpose && cs.purpose.toLowerCase().includes(q)) ||
      (cs.ppName && cs.ppName.toLowerCase().includes(q)) ||
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
            <b className="crumbs-active">Case Master &amp; Hearing Entry</b>
          </div>

          {/* Page Sub-header */}
          <div className="mgmt-header">
            <div className="mgmt-header-left">
              <span className="mgmt-icon-badge case-badge">
                <Briefcase size={20} strokeWidth={2.2} />
              </span>
              <div>
                <div className="mgmt-tag-row">
                  <span className="tag-violet">Case Registry &amp; Hearing Schedules</span>
                  <span className="tag-muted">{cases.length} Registered Cases</span>
                </div>
                <h1 className="mgmt-title">Case Management System</h1>
                <p className="mgmt-desc">Link cases to registered clients, schedule next hearing dates, record courts &amp; print court dockets</p>
              </div>
            </div>
            <div className="mgmt-header-actions">
              <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
                <ArrowLeft size={14} />
                <span>Dashboard Overview</span>
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
                  <h3>{selectedCaseId ? `Edit Case Docket (${formData.caseNumber || selectedCaseId})` : 'Register New Court Case'}</h3>
                </div>
                {selectedCaseId ? (
                  <span className="status-badge editing">Editing Docket</span>
                ) : (
                  <span className="status-badge creating">New Case</span>
                )}
              </div>

              <form className="mgmt-form" onSubmit={(e) => e.preventDefault()}>
                {/* Row 1: Client ID Selection */}
                <div className="form-field">
                  <label className="field-lbl">Select Client ID <span className="req">*</span></label>
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

                {/* Row 2: Client Name & Phone (Auto-populated) */}
                <div className="form-row-2">
                  <div className="form-field">
                    <label className="field-lbl">Client Name (Auto-filled)</label>
                    <input
                      type="text"
                      className="form-input readonly-input"
                      value={formData.clientName || 'Auto-populated from Client ID'}
                      readOnly
                    />
                  </div>
                  <div className="form-field">
                    <label className="field-lbl">Phone Number (Auto-filled)</label>
                    <div className="input-with-icon">
                      <Phone size={14} className="input-ic" />
                      <input
                        type="text"
                        className="form-input readonly-input"
                        value={formData.phone || 'Auto-populated'}
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                {/* Row 3: Case Number & Other Case Number */}
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
                    <label className="field-lbl">Other Case Number / Police Station Ref</label>
                    <input
                      type="text"
                      name="otherCaseNumber"
                      placeholder="e.g. Ramnagar PS Case 84/2025"
                      className="form-input"
                      value={formData.otherCaseNumber}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Row 4: Next Date & For / Purpose */}
                <div className="form-row-2">
                  <div className="form-field">
                    <label className="field-lbl">Next Date <span className="req">*</span></label>
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

                {/* Row 5: Court Name & PP Name */}
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
                    <label className="field-lbl">PP Name / Opposite Advocate</label>
                    <input
                      type="text"
                      name="ppName"
                      placeholder="Public Prosecutor or Opp. Counsel name"
                      className="form-input"
                      value={formData.ppName}
                      onChange={handleChange}
                    />
                  </div>
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
                  placeholder="Search by case no, client name, court, purpose or date..."
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
                      <th style={{ width: '95px' }}>NEXT DATE</th>
                      <th>FOR / PURPOSE</th>
                      <th>COURT NAME</th>
                      <th>PP NAME / OPP.</th>
                      <th style={{ width: '110px' }}>CASE NUMBER</th>
                      <th>CLIENT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCases.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="empty-table-cell">
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
                            className={`table-row-clickable ${isSelected ? 'row-selected-violet' : ''}`}
                            onClick={() => handleSelectCase(cs)}
                            title="Click to load case into form"
                          >
                            <td>
                              <span className="date-badge-pill">{cs.nextDate}</span>
                            </td>
                            <td>
                              <span className="purpose-text">{cs.purpose}</span>
                            </td>
                            <td>
                              <span className="cell-court">{cs.courtName}</span>
                            </td>
                            <td>
                              <span className="cell-pp">{cs.ppName || '—'}</span>
                            </td>
                            <td>
                              <span className="id-pill case-pill">{cs.caseNumber}</span>
                            </td>
                            <td>
                              <div className="client-link-cell">
                                <span className="cl-name">{cs.clientName}</span>
                                <small className="cl-id">{cs.clientId}</small>
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
                <span className="hint-highlight">Action:</span>
                <span>Click any row to load into form for editing or printing cause docket. Clients can be linked to multiple cases.</span>
              </div>
            </div>
          </div>

          {/* ================= Printable Case Docket ================= */}
          {selectedCase && (
            <div className="printable-docket" id="printable-case-docket">
              <div className="print-header">
                <div className="print-chambers">
                  <h2>{OFFICE.name}</h2>
                  <p className="print-address">{OFFICE.address}</p>
                  <p className="print-title">COURT HEARING DOCKET &amp; CAUSE BRIEF</p>
                </div>
                <div className="print-meta">
                  <div><b>Case ID:</b> {selectedCase.id}</div>
                  <div><b>Docket Date:</b> {new Date().toLocaleDateString('en-IN')}</div>
                </div>
              </div>

              <div className="print-divider" />

              <table className="print-table">
                <tbody>
                  <tr>
                    <th>Case Number:</th>
                    <td><strong>{selectedCase.caseNumber}</strong></td>
                    <th>Next Hearing Date:</th>
                    <td><strong className="highlight-date">{selectedCase.nextDate}</strong></td>
                  </tr>
                  <tr>
                    <th>Designated Court:</th>
                    <td colSpan={3}><strong>{selectedCase.courtName}</strong></td>
                  </tr>
                  <tr>
                    <th>For / Purpose of Hearing:</th>
                    <td colSpan={3}><strong>{selectedCase.purpose}</strong></td>
                  </tr>
                  <tr>
                    <th>Client Name (Deponent):</th>
                    <td>{selectedCase.clientName}</td>
                    <th>Client ID:</th>
                    <td>{selectedCase.clientId}</td>
                  </tr>
                  <tr>
                    <th>Client Phone Number:</th>
                    <td>{selectedCase.phone || '—'}</td>
                    <th>Public Prosecutor / Opp. Counsel:</th>
                    <td>{selectedCase.ppName || '—'}</td>
                  </tr>
                  {selectedCase.otherCaseNumber && (
                    <tr>
                      <th>Police Station / Other Ref No:</th>
                      <td colSpan={3}>{selectedCase.otherCaseNumber}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="print-terms">
                <h4>Advocate Hearing Instructions &amp; Brief:</h4>
                <p>
                  Case brief prepared for court appearance on <b>{selectedCase.nextDate}</b> before the <b>{selectedCase.courtName}</b> for <b>{selectedCase.purpose}</b>. Certified copies of records and petition annexures are tagged with this docket.
                </p>
              </div>

              <div className="print-signatures">
                <div className="print-sig-box">
                  <div className="sig-line" />
                  <span>Client / Law Clerk Signature</span>
                </div>
                <div className="print-sig-box right">
                  <div className="sig-line" />
                  <span>Advocate Signature &amp; Chambers Seal</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
