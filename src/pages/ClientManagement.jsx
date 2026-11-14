import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, UserPlus, Save, RefreshCw, Printer, XCircle, Search,
  Phone, MapPin, Calendar, IndianRupee, ArrowLeft, CheckCircle2,
  AlertCircle, ChevronRight, UserCheck
} from 'lucide-react'
import Topbar from '../components/Topbar.jsx'
import { OFFICE } from '../data/menu.js'
import { getClients, saveClient, updateClient, onStorageUpdate } from '../services/storageService.js'
import './management.css'

export default function ClientManagement() {
  const navigate = useNavigate()
  const [clients, setClients] = useState(() => getClients())
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)

  // Form State
  const getInitialForm = () => ({
    name: '',
    relation: '',
    address: '',
    phone: '',
    referenceName: '',
    referencePhone: '',
    fees: '',
    date: new Date().toISOString().split('T')[0],
  })
  const [formData, setFormData] = useState(getInitialForm)
  const [errors, setErrors] = useState({})

  // Subscribe to storage updates
  useEffect(() => {
    return onStorageUpdate(() => {
      setClients(getClients())
    })
  }, [])

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = (type, message) => {
    setToast({ type, message })
  }

  // Handle Input Changes
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
    if (!formData.name.trim()) errs.name = 'Client Name is required'
    if (!formData.phone.trim()) {
      errs.phone = 'Phone number is required'
    } else if (!/^\d{10}$/.test(formData.phone.replace(/[\s-+]/g, ''))) {
      errs.phone = 'Enter valid 10-digit mobile number'
    }
    if (formData.referencePhone && !/^\d{10}$/.test(formData.referencePhone.replace(/[\s-+]/g, ''))) {
      errs.referencePhone = 'Enter valid 10-digit phone'
    }
    if (!formData.date) errs.date = 'Date is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Select a Client from the Table
  const handleSelectClient = (client) => {
    setSelectedId(client.id)
    setFormData({
      name: client.name || '',
      relation: client.relation || '',
      address: client.address || '',
      phone: client.phone || '',
      referenceName: client.referenceName || '',
      referencePhone: client.referencePhone || '',
      fees: client.fees !== undefined ? String(client.fees) : '',
      date: client.date || new Date().toISOString().split('T')[0],
    })
    setErrors({})
    showToast('info', `Selected client ${client.id} — loaded into form`)
  }

  // Clear Form for New Client Entry
  const handleClear = () => {
    setSelectedId(null)
    setFormData(getInitialForm())
    setErrors({})
  }

  // Save New Client
  const handleSave = (e) => {
    if (e) e.preventDefault()
    if (!validateForm()) {
      showToast('error', 'Please resolve form validation errors.')
      return
    }

    setLoading(true)
    setTimeout(() => {
      try {
        const saved = saveClient(formData)
        setSelectedId(saved.id)
        showToast('success', `Client ${saved.name} registered successfully with ID ${saved.id}!`)
      } catch (err) {
        showToast('error', err.message || 'Failed to save client.')
      } finally {
        setLoading(false)
      }
    }, 150)
  }

  // Update Existing Client
  const handleUpdate = (e) => {
    if (e) e.preventDefault()
    if (!selectedId) {
      showToast('error', 'Please select a client from the table to update.')
      return
    }
    if (!validateForm()) {
      showToast('error', 'Please resolve form validation errors.')
      return
    }

    setLoading(true)
    setTimeout(() => {
      try {
        const updated = updateClient(selectedId, formData)
        showToast('success', `Client ${updated.id} (${updated.name}) updated successfully!`)
      } catch (err) {
        showToast('error', err.message || 'Failed to update client.')
      } finally {
        setLoading(false)
      }
    }, 150)
  }

  // Print Selected Client Docket
  const handlePrint = () => {
    if (!selectedId) {
      showToast('error', 'Please select a client from the table to print docket.')
      return
    }
    window.print()
  }

  // Search filter
  const filteredClients = clients.filter((c) => {
    const q = search.toLowerCase()
    return (
      (c.id && c.id.toLowerCase().includes(q)) ||
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q)) ||
      (c.relation && c.relation.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    )
  })

  const selectedClient = clients.find((c) => c.id === selectedId) || null

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
            <b className="crumbs-active">Client Master &amp; Registration</b>
          </div>

          {/* Page Sub-header */}
          <div className="mgmt-header">
            <div className="mgmt-header-left">
              <span className="mgmt-icon-badge client-badge">
                <Users size={20} strokeWidth={2.2} />
              </span>
              <div>
                <div className="mgmt-tag-row">
                  <span className="tag-blue">Client Registration Module</span>
                  <span className="tag-muted">{clients.length} Registered Clients</span>
                </div>
                <h1 className="mgmt-title">Client Management System</h1>
                <p className="mgmt-desc">Register new clients, edit profiles, maintain fee accounts &amp; generate official dockets</p>
              </div>
            </div>
            <div className="mgmt-header-actions">
              <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
                <ArrowLeft size={14} />
                <span>Dashboard Overview</span>
              </button>
              <button className="btn-primary" onClick={handleClear}>
                <UserPlus size={14} />
                <span>New Client Form</span>
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          {toast && (
            <div className={`mgmt-toast toast-${toast.type}`}>
              {toast.type === 'success' && <CheckCircle2 size={16} />}
              {toast.type === 'error' && <AlertCircle size={16} />}
              {toast.type === 'info' && <UserCheck size={16} />}
              <span>{toast.message}</span>
            </div>
          )}

          {/* Two-Panel Layout */}
          <div className="mgmt-two-panel">
            {/* ================= LEFT PANEL: CLIENT FORM ================= */}
            <div className="mgmt-form-panel">
              <div className="panel-card-head">
                <div className="pch-title">
                  <span className="pch-dot pch-blue" />
                  <h3>{selectedId ? `Edit Client (${selectedId})` : 'New Client Registration'}</h3>
                </div>
                {selectedId ? (
                  <span className="status-badge editing">Editing Mode</span>
                ) : (
                  <span className="status-badge creating">New Entry</span>
                )}
              </div>

              <form className="mgmt-form" onSubmit={(e) => e.preventDefault()}>
                {/* Row 1: Client ID indicator & Date */}
                <div className="form-row-2">
                  <div className="form-field">
                    <label className="field-lbl">Client ID</label>
                    <input
                      type="text"
                      className="form-input readonly-input"
                      value={selectedId || '(Auto Assigned Upon Save)'}
                      readOnly
                    />
                  </div>
                  <div className="form-field">
                    <label className="field-lbl">Registration Date <span className="req">*</span></label>
                    <div className="input-with-icon">
                      <Calendar size={14} className="input-ic" />
                      <input
                        type="date"
                        name="date"
                        className={`form-input ${errors.date ? 'input-err' : ''}`}
                        value={formData.date}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.date && <span className="err-msg">{errors.date}</span>}
                  </div>
                </div>

                {/* Row 2: Client Name */}
                <div className="form-field">
                  <label className="field-lbl">Client Name <span className="req">*</span></label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter full legal name of client"
                    className={`form-input ${errors.name ? 'input-err' : ''}`}
                    value={formData.name}
                    onChange={handleChange}
                    autoFocus
                  />
                  {errors.name && <span className="err-msg">{errors.name}</span>}
                </div>

                {/* Row 3: S/O or W/O */}
                <div className="form-field">
                  <label className="field-lbl">S/O or W/O (Son of / Wife of / Care of)</label>
                  <input
                    type="text"
                    name="relation"
                    placeholder="e.g. S/O Late Ramesh Sharma or W/O Pradip Adhikari"
                    className="form-input"
                    value={formData.relation}
                    onChange={handleChange}
                  />
                </div>

                {/* Row 4: Phone & Case/Other Fees */}
                <div className="form-row-2">
                  <div className="form-field">
                    <label className="field-lbl">Phone Number <span className="req">*</span></label>
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
                    <label className="field-lbl">Case / Other Fees (₹)</label>
                    <div className="input-with-icon">
                      <IndianRupee size={14} className="input-ic" />
                      <input
                        type="number"
                        name="fees"
                        placeholder="Agreed consultation fees"
                        className="form-input"
                        value={formData.fees}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Row 5: Reference Name & Phone */}
                <div className="form-row-2">
                  <div className="form-field">
                    <label className="field-lbl">Reference Name</label>
                    <input
                      type="text"
                      name="referenceName"
                      placeholder="Referred by (advocate, village pradhan, etc.)"
                      className="form-input"
                      value={formData.referenceName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-field">
                    <label className="field-lbl">Reference Phone Number</label>
                    <div className="input-with-icon">
                      <Phone size={14} className="input-ic" />
                      <input
                        type="tel"
                        name="referencePhone"
                        placeholder="Referee contact number"
                        maxLength={10}
                        className={`form-input ${errors.referencePhone ? 'input-err' : ''}`}
                        value={formData.referencePhone}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.referencePhone && <span className="err-msg">{errors.referencePhone}</span>}
                  </div>
                </div>

                {/* Row 6: Address */}
                <div className="form-field">
                  <label className="field-lbl">Residential / Chamber Address</label>
                  <div className="input-with-icon align-top">
                    <MapPin size={14} className="input-ic top-ic" />
                    <textarea
                      name="address"
                      rows={2}
                      placeholder="Village/City, Post Office, Police Station, District, PIN..."
                      className="form-input form-textarea"
                      value={formData.address}
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
                    disabled={loading || !!selectedId}
                    title={selectedId ? 'Clear selection to save a new client' : 'Save client permanently'}
                  >
                    <Save size={14} />
                    <span>SAVE</span>
                  </button>

                  <button
                    type="button"
                    className="act-btn btn-update"
                    onClick={handleUpdate}
                    disabled={loading || !selectedId}
                    title={!selectedId ? 'Select a client from the table to update' : 'Save modifications'}
                  >
                    <RefreshCw size={14} />
                    <span>UPDATE</span>
                  </button>

                  <button
                    type="button"
                    className="act-btn btn-print"
                    onClick={handlePrint}
                    disabled={!selectedId}
                    title="Print legal client registration docket"
                  >
                    <Printer size={14} />
                    <span>PRINT</span>
                  </button>

                  <button
                    type="button"
                    className="act-btn btn-clear"
                    onClick={handleClear}
                    title="Clear fields for a fresh registration"
                  >
                    <XCircle size={14} />
                    <span>CLEAR</span>
                  </button>
                </div>
              </form>
            </div>

            {/* ================= RIGHT PANEL: CLIENT TABLE ================= */}
            <div className="mgmt-table-panel">
              <div className="panel-card-head">
                <div className="pch-title">
                  <span className="pch-dot pch-slate" />
                  <h3>Registered Clients Directory</h3>
                </div>
                <span className="panel-count">{filteredClients.length} of {clients.length} Records</span>
              </div>

              {/* Search Bar */}
              <div className="table-search-bar">
                <Search size={14} className="search-ic" />
                <input
                  type="text"
                  placeholder="Search by client ID, name, phone, S/O or address..."
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

              {/* Client Interactive Table */}
              <div className="table-scroll-container">
                <table className="mgmt-table">
                  <thead>
                    <tr>
                      <th style={{ width: '85px' }}>CLIENT ID</th>
                      <th>CLIENT NAME</th>
                      <th>S/O OR W/O</th>
                      <th style={{ width: '105px' }}>PHONE</th>
                      <th style={{ width: '85px' }}>FEES (₹)</th>
                      <th style={{ width: '90px' }}>REG. DATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="empty-table-cell">
                          <AlertCircle size={18} className="empty-ic" />
                          <span>No client records match your search query.</span>
                        </td>
                      </tr>
                    ) : (
                      filteredClients.map((client) => {
                        const isSelected = client.id === selectedId
                        return (
                          <tr
                            key={client.id}
                            className={`table-row-clickable ${isSelected ? 'row-selected' : ''}`}
                            onClick={() => handleSelectClient(client)}
                            title="Click to load client into form"
                          >
                            <td>
                              <span className="id-pill client-id">{client.id}</span>
                            </td>
                            <td>
                              <div className="client-name-cell">
                                <strong className="primary-text">{client.name}</strong>
                                {client.referenceName && (
                                  <small className="muted-subtext">Ref: {client.referenceName}</small>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className="cell-text">{client.relation || '—'}</span>
                            </td>
                            <td>
                              <span className="cell-phone">{client.phone}</span>
                            </td>
                            <td>
                              <span className="cell-fees">
                                {client.fees ? `₹${Number(client.fees).toLocaleString('en-IN')}` : '—'}
                              </span>
                            </td>
                            <td>
                              <span className="cell-date">{client.date}</span>
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
                <span>Click any row to load into form for editing or printing. Click <b>New Client Form</b> to register a fresh client.</span>
              </div>
            </div>
          </div>

          {/* ================= Printable Docket (Rendered during Print) ================= */}
          {selectedClient && (
            <div className="printable-docket" id="printable-client-docket">
              <div className="print-header">
                <div className="print-chambers">
                  <h2>{OFFICE.name}</h2>
                  <p className="print-address">{OFFICE.address}</p>
                  <p className="print-title">CLIENT REGISTRATION DOCKET &amp; CASE RECORD</p>
                </div>
                <div className="print-meta">
                  <div><b>Docket ID:</b> {selectedClient.id}</div>
                  <div><b>Date:</b> {selectedClient.date}</div>
                </div>
              </div>

              <div className="print-divider" />

              <table className="print-table">
                <tbody>
                  <tr>
                    <th>Client Full Name:</th>
                    <td><strong>{selectedClient.name}</strong></td>
                    <th>Client ID:</th>
                    <td><strong>{selectedClient.id}</strong></td>
                  </tr>
                  <tr>
                    <th>S/O or W/O:</th>
                    <td>{selectedClient.relation || '—'}</td>
                    <th>Contact Phone:</th>
                    <td>{selectedClient.phone || '—'}</td>
                  </tr>
                  <tr>
                    <th>Residential Address:</th>
                    <td colSpan={3}>{selectedClient.address || '—'}</td>
                  </tr>
                  <tr>
                    <th>Reference Person:</th>
                    <td>{selectedClient.referenceName || 'Direct'}</td>
                    <th>Reference Phone:</th>
                    <td>{selectedClient.referencePhone || '—'}</td>
                  </tr>
                  <tr>
                    <th>Case / Professional Fees:</th>
                    <td>₹{Number(selectedClient.fees || 0).toLocaleString('en-IN')}</td>
                    <th>Registration Status:</th>
                    <td>Permanent Record Verified</td>
                  </tr>
                </tbody>
              </table>

              <div className="print-terms">
                <h4>Chambers Record &amp; Authorization Notice:</h4>
                <p>
                  The above particulars have been entered into the advocate office case ledger. All original court documents and briefs are maintained under confidential custody at chambers.
                </p>
              </div>

              <div className="print-signatures">
                <div className="print-sig-box">
                  <div className="sig-line" />
                  <span>Client / Deponent Signature</span>
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
