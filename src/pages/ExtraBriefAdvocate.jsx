import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Scale, Plus, Save, RefreshCw, Printer, Download, Trash2, Edit3,
  Search, ArrowLeft, ChevronRight, CheckCircle2, AlertCircle,
  Building2, User, Hash, FileText, LayoutGrid, List
} from 'lucide-react'
import Topbar from '../components/Topbar.jsx'
import { OFFICE } from '../data/menu.js'
import {
  getExtraBriefs, saveExtraBrief, updateExtraBrief, deleteExtraBrief,
  getClients, onStorageUpdate
} from '../services/storageService.js'
import './management.css'

export default function ExtraBriefAdvocate() {
  const navigate = useNavigate()
  const [briefs, setBriefs] = useState(() => getExtraBriefs())
  const [clients, setClients] = useState(() => getClients())
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('pdf') // 'pdf' | 'table'
  const [toast, setToast] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingBrief, setEditingBrief] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [selectedBriefToPrint, setSelectedBriefToPrint] = useState(null)

  // Form State
  const initialForm = {
    clientName: '',
    hasIdNumber: true,
    idNumber: '',
    advocateLawClerk: '',
    courtName: '',
    caseNumber: '',
    date: new Date().toISOString().split('T')[0],
    evidenceDetails: '',
    remarks: '',
  }
  const [formData, setFormData] = useState(initialForm)

  useEffect(() => {
    return onStorageUpdate(() => {
      setBriefs(getExtraBriefs())
      setClients(getClients())
    })
  }, [])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = (type, message) => setToast({ type, message })

  // Client dropdown autofill
  const handleClientSelect = (clientId) => {
    const c = clients.find((x) => x.id === clientId)
    if (c) {
      setFormData((prev) => ({
        ...prev,
        clientName: c.name,
        idNumber: prev.hasIdNumber ? c.id : '',
      }))
    }
  }

  const handleOpenAddModal = () => {
    setEditingBrief(null)
    setFormData(initialForm)
    setShowModal(true)
  }

  const handleOpenEditModal = (b) => {
    setEditingBrief(b)
    setFormData({
      clientName: b.clientName || '',
      hasIdNumber: b.hasIdNumber !== false,
      idNumber: b.idNumber || '',
      advocateLawClerk: b.advocateLawClerk || '',
      courtName: b.courtName || '',
      caseNumber: b.caseNumber || '',
      date: b.date || '',
      evidenceDetails: b.evidenceDetails || '',
      remarks: b.remarks || '',
    })
    setShowModal(true)
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!formData.clientName.trim()) {
      showToast('error', 'Client Name is required.')
      return
    }

    try {
      if (editingBrief) {
        updateExtraBrief(editingBrief.id, formData)
        showToast('success', `Updated brief docket ${editingBrief.id}!`)
      } else {
        const saved = saveExtraBrief(formData)
        showToast('success', `Created Extra Court Brief ${saved.id} for ${saved.clientName}!`)
      }
      setShowModal(false)
    } catch (err) {
      showToast('error', err.message || 'Operation failed.')
    }
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    try {
      deleteExtraBrief(deleteTarget.id)
      showToast('success', `Extra Brief ${deleteTarget.id} deleted.`)
    } catch (err) {
      showToast('error', err.message || 'Failed to delete.')
    } finally {
      setDeleteTarget(null)
    }
  }

  // Filtered briefs
  const filteredBriefs = briefs.filter((b) => {
    const q = search.toLowerCase()
    return (
      (b.clientName && b.clientName.toLowerCase().includes(q)) ||
      (b.advocateLawClerk && b.advocateLawClerk.toLowerCase().includes(q)) ||
      (b.idNumber && b.idNumber.toLowerCase().includes(q)) ||
      (b.courtName && b.courtName.toLowerCase().includes(q)) ||
      (b.evidenceDetails && b.evidenceDetails.toLowerCase().includes(q)) ||
      (b.caseNumber && b.caseNumber.toLowerCase().includes(q))
    )
  })

  const handlePrintBriefDocket = (b) => {
    setSelectedBriefToPrint(b)
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
            <span className="crumbs-muted">Operations</span>
            <ChevronRight size={12} className="crumbs-sep" />
            <b className="crumbs-active">Extra Brief for Court (Evidence)</b>
          </div>

          <div className="mgmt-header">
            <div className="mgmt-header-left">
              <span className="mgmt-icon-badge" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                <Scale size={20} strokeWidth={2.2} />
              </span>
              <div>
                <div className="mgmt-tag-row">
                  <span className="tag-muted" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}>
                    Module 13: Client Spec (Software.pdf)
                  </span>
                  <span className="tag-muted">{briefs.length} Registered Briefs</span>
                </div>
                <h1 className="mgmt-title">EXTRA BRIEF FOR COURT TO OTHER ADVOCATE (EVIDENCE)</h1>
                <p className="mgmt-desc">Brief external counsel or law clerks with or without ID number for evidence and court proceedings</p>
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
              <button className="btn-primary" onClick={handleOpenAddModal}>
                <Plus size={14} />
                <span>New Court Brief</span>
              </button>
              <button className="btn-secondary" onClick={() => window.print()}>
                <Printer size={14} />
                <span>Print</span>
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
              <span>{toast.message}</span>
            </div>
          )}

          {/* Search Bar */}
          <div className="panel" style={{ padding: '12px 16px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: '1', maxWidth: '400px', position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search Client Name, Advocate / Law Clerk, ID No..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '32px', fontSize: '12px' }}
              />
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Showing {filteredBriefs.length} briefs (With ID No. &amp; Without ID No.)
            </div>
          </div>

          {/* ================= VIEW 1: EXACT PDF SPECIFICATION CARD VIEW ================= */}
          {viewMode === 'pdf' && (
            <div className="panel" style={{ background: '#ffffff', borderRadius: '8px', border: '2px solid #0f172a', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
              {/* PDF Header Banner */}
              <div style={{ background: '#dc2626', color: '#ffffff', padding: '10px 16px', textAlign: 'center', fontWeight: '900', fontSize: '16px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '24px' }}>
                EXTRA BRIEF FOR COURT TO OTHER ADVOCATE (EVIDENCE)
              </div>

              {filteredBriefs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                  <AlertCircle size={24} style={{ margin: '0 auto 8px', display: 'block', color: '#94a3b8' }} />
                  No extra brief records found.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {filteredBriefs.map((b, idx) => (
                    <div
                      key={b.id}
                      style={{
                        border: '1.5px solid #0f172a',
                        borderRadius: '4px',
                        padding: '14px 18px',
                        background: '#ffffff',
                      }}
                    >
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: b.hasIdNumber ? '2fr 1fr 2fr auto' : '2fr 2fr auto',
                          gap: '16px',
                          alignItems: 'center',
                          borderBottom: b.evidenceDetails ? '1px dashed #cbd5e1' : 'none',
                          paddingBottom: b.evidenceDetails ? '10px' : '0',
                        }}
                      >
                        {/* 1. Client Name : */}
                        <div>
                          <strong>{idx + 1}. Client Name :</strong>{' '}
                          <span style={{ fontWeight: '700', color: '#0f172a' }}>{b.clientName}</span>
                          {b.caseNumber && <small style={{ display: 'block', color: '#64748b', fontSize: '11px' }}>Case: {b.caseNumber} ({b.courtName})</small>}
                        </div>

                        {/* ID No. or Without ID No. */}
                        {b.hasIdNumber ? (
                          <div>
                            <strong>ID No.</strong>{' '}
                            <span style={{ fontWeight: '700', color: '#1e40af' }}>{b.idNumber || '—'}</span>
                          </div>
                        ) : (
                          <div>
                            <span style={{ fontWeight: '700', color: '#b45309', background: '#fef3c7', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
                              Without ID No.
                            </span>
                          </div>
                        )}

                        {/* Advocate / Law Clerk */}
                        <div>
                          <strong>Advocate / Law Clerk :</strong>{' '}
                          <span style={{ fontWeight: '700', color: '#0f172a' }}>{b.advocateLawClerk || '—'}</span>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            type="button"
                            className="btn-icon-subtle"
                            style={{ padding: '4px 6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                            onClick={() => handlePrintBriefDocket(b)}
                            title="Print Brief Docket"
                          >
                            <Printer size={12} color="#0f172a" />
                          </button>
                          <button
                            type="button"
                            className="btn-icon-subtle"
                            style={{ padding: '4px 6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                            onClick={() => handleOpenEditModal(b)}
                            title="Edit Brief"
                          >
                            <Edit3 size={12} color="#475569" />
                          </button>
                          <button
                            type="button"
                            className="btn-icon-subtle"
                            style={{ padding: '4px 6px', border: '1px solid #fecaca', background: '#fff1f2', cursor: 'pointer' }}
                            onClick={() => setDeleteTarget(b)}
                            title="Delete"
                          >
                            <Trash2 size={12} color="#dc2626" />
                          </button>
                        </div>
                      </div>

                      {/* Evidence Notes */}
                      {b.evidenceDetails && (
                        <div style={{ paddingTop: '8px', fontSize: '12px', color: '#334155', lineHeight: '1.4' }}>
                          <strong>Evidence &amp; Cross-Brief Notes:</strong> {b.evidenceDetails}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Chambers Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '48px', paddingTop: '20px', borderTop: '1px solid #0f172a' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  <strong>{OFFICE.name}</strong> · Senior Advocate Briefing Chamber
                </div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                  Court Deposition &amp; Evidence Ledger
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
                  <h3>Court Advocate Briefs Register</h3>
                </div>
                <span className="panel-count">{filteredBriefs.length} Briefs</span>
              </div>

              <div className="table-scroll-container">
                <table className="mgmt-table">
                  <thead>
                    <tr>
                      <th style={{ width: '45px' }}>#</th>
                      <th>CLIENT NAME</th>
                      <th style={{ width: '130px' }}>ID SPECIFICATION</th>
                      <th>BRIEFED ADVOCATE / LAW CLERK</th>
                      <th>COURT &amp; CASE</th>
                      <th>EVIDENCE DETAILS</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBriefs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="empty-table-cell">
                          <AlertCircle size={18} className="empty-ic" />
                          <span>No brief records match query.</span>
                        </td>
                      </tr>
                    ) : (
                      filteredBriefs.map((b, idx) => (
                        <tr key={b.id}>
                          <td><b>{idx + 1}</b></td>
                          <td><strong className="primary-text">{b.clientName}</strong></td>
                          <td>
                            {b.hasIdNumber ? (
                              <span className="id-pill" style={{ background: '#ede9fe', color: '#6d28d9', fontWeight: '700' }}>
                                {b.idNumber || 'With ID'}
                              </span>
                            ) : (
                              <span style={{ fontSize: '11px', fontWeight: '700', color: '#b45309', background: '#fef3c7', padding: '2px 8px', borderRadius: '4px' }}>
                                Without ID No.
                              </span>
                            )}
                          </td>
                          <td><strong style={{ color: '#0f172a' }}>{b.advocateLawClerk || '—'}</strong></td>
                          <td>
                            <span style={{ fontSize: '12px', fontWeight: '600' }}>{b.courtName}</span>
                            {b.caseNumber && <small className="muted-subtext">{b.caseNumber}</small>}
                          </td>
                          <td><span style={{ fontSize: '12px', color: '#334155' }}>{b.evidenceDetails || '—'}</span></td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                              <button
                                type="button"
                                className="btn-icon-subtle"
                                style={{ padding: '3px 6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                                onClick={() => handlePrintBriefDocket(b)}
                                title="Print Brief"
                              >
                                <Printer size={12} color="#0f172a" />
                              </button>
                              <button
                                type="button"
                                className="btn-icon-subtle"
                                style={{ padding: '3px 6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                                onClick={() => handleOpenEditModal(b)}
                                title="Edit"
                              >
                                <Edit3 size={12} color="#475569" />
                              </button>
                              <button
                                type="button"
                                className="btn-icon-subtle"
                                style={{ padding: '3px 6px', border: '1px solid #fecaca', background: '#fff1f2', cursor: 'pointer' }}
                                onClick={() => setDeleteTarget(b)}
                                title="Delete"
                              >
                                <Trash2 size={12} color="#dc2626" />
                              </button>
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

          {/* Add / Edit Brief Modal */}
          {showModal && (
            <div className="mgmt-modal-overlay" onClick={() => setShowModal(false)}>
              <div className="mgmt-modal-box" style={{ maxWidth: '520px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
                <div className="mgmt-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>
                    {editingBrief ? 'Edit Court Brief' : 'New Extra Brief for Court to Other Advocate'}
                  </h3>
                  <button className="clear-search-btn" onClick={() => setShowModal(false)}>✕</button>
                </div>

                <form onSubmit={handleSave} style={{ marginTop: '12px' }}>
                  <div className="form-field" style={{ marginBottom: '10px' }}>
                    <label className="field-lbl">Autofill from Registered Client</label>
                    <select
                      className="form-input form-select"
                      onChange={(e) => handleClientSelect(e.target.value)}
                    >
                      <option value="">-- Choose Existing Client --</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field" style={{ marginBottom: '10px' }}>
                    <label className="field-lbl">Client Full Name <span className="req">*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.clientName}
                      onChange={(e) => setFormData((p) => ({ ...p, clientName: e.target.value }))}
                      placeholder="e.g. Rajesh Kumar Sharma"
                      required
                      autoFocus
                    />
                  </div>

                  {/* ID Option Toggle */}
                  <div className="form-field" style={{ marginBottom: '10px' }}>
                    <label className="field-lbl">ID Number Specification Option <span className="req">*</span></label>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="hasIdNumber"
                          checked={formData.hasIdNumber === true}
                          onChange={() => setFormData((p) => ({ ...p, hasIdNumber: true }))}
                        />
                        <span>With ID Number</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="hasIdNumber"
                          checked={formData.hasIdNumber === false}
                          onChange={() => setFormData((p) => ({ ...p, hasIdNumber: false, idNumber: '' }))}
                        />
                        <span style={{ color: '#b45309', fontWeight: '600' }}>Without ID Number</span>
                      </label>
                    </div>
                  </div>

                  {formData.hasIdNumber && (
                    <div className="form-field" style={{ marginBottom: '10px' }}>
                      <label className="field-lbl">ID Number</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.idNumber}
                        onChange={(e) => setFormData((p) => ({ ...p, idNumber: e.target.value }))}
                        placeholder="e.g. ID-101, CL-1001"
                      />
                    </div>
                  )}

                  <div className="form-field" style={{ marginBottom: '10px' }}>
                    <label className="field-lbl">Briefed Advocate / Law Clerk Name <span className="req">*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.advocateLawClerk}
                      onChange={(e) => setFormData((p) => ({ ...p, advocateLawClerk: e.target.value }))}
                      placeholder="e.g. Adv. Somnath Das or Bikash Mondal (Law Clerk)"
                      required
                    />
                  </div>

                  <div className="form-row-2" style={{ marginBottom: '10px' }}>
                    <div className="form-field">
                      <label className="field-lbl">Court Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.courtName}
                        onChange={(e) => setFormData((p) => ({ ...p, courtName: e.target.value }))}
                        placeholder="e.g. ACJM Court, Contai"
                      />
                    </div>
                    <div className="form-field">
                      <label className="field-lbl">Case Number</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.caseNumber}
                        onChange={(e) => setFormData((p) => ({ ...p, caseNumber: e.target.value }))}
                        placeholder="e.g. CR/342/2026"
                      />
                    </div>
                  </div>

                  <div className="form-field" style={{ marginBottom: '14px' }}>
                    <label className="field-lbl">Evidence &amp; Cross-Examination Particulars</label>
                    <textarea
                      rows={3}
                      className="form-input form-textarea"
                      value={formData.evidenceDetails}
                      onChange={(e) => setFormData((p) => ({ ...p, evidenceDetails: e.target.value }))}
                      placeholder="e.g. Deposition notes of PW-3, seizure memo examination, documents to produce..."
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                    <button type="submit" className="btn-primary" style={{ background: '#dc2626', borderColor: '#b91c1c' }}>
                      {editingBrief ? 'Update Brief' : 'Save Court Brief'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Modal */}
          {deleteTarget && (
            <div className="mgmt-modal-overlay" onClick={() => setDeleteTarget(null)}>
              <div className="mgmt-modal-box" style={{ maxWidth: '400px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fee2e2', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Trash2 size={18} color="#dc2626" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#991b1b' }}>Delete Court Brief?</h3>
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: '#334155', margin: '10px 0 16px' }}>
                  Are you sure you want to delete the brief docket for <strong>{deleteTarget.clientName}</strong>?
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                  <button className="btn-primary" style={{ background: '#dc2626', borderColor: '#b91c1c' }} onClick={confirmDelete}>
                    Confirm Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Printable Docket */}
          {selectedBriefToPrint && (
            <div className="printable-docket">
              <div className="print-header">
                <div className="print-chambers">
                  <h2>{OFFICE.name}</h2>
                  <p className="print-address">{OFFICE.address}</p>
                  <p className="print-title">COURT EXTRA BRIEF TO OTHER ADVOCATE / LAW CLERK</p>
                </div>
                <div className="print-meta">
                  <div><b>Brief ID:</b> {selectedBriefToPrint.id}</div>
                  <div><b>Date:</b> {selectedBriefToPrint.date}</div>
                </div>
              </div>

              <div className="print-divider" />

              <table className="print-table">
                <tbody>
                  <tr>
                    <th>Client Full Name:</th>
                    <td><strong>{selectedBriefToPrint.clientName}</strong></td>
                    <th>ID Specification:</th>
                    <td><strong>{selectedBriefToPrint.hasIdNumber ? selectedBriefToPrint.idNumber : 'Without ID Number'}</strong></td>
                  </tr>
                  <tr>
                    <th>Briefed Counsel / Clerk:</th>
                    <td><strong>{selectedBriefToPrint.advocateLawClerk}</strong></td>
                    <th>Court Name:</th>
                    <td>{selectedBriefToPrint.courtName || 'District Court'}</td>
                  </tr>
                  <tr>
                    <th>Case Number:</th>
                    <td colSpan={3}>{selectedBriefToPrint.caseNumber || 'Trial Court Proceeding'}</td>
                  </tr>
                  <tr>
                    <th>Evidence &amp; Cross Notes:</th>
                    <td colSpan={3}>{selectedBriefToPrint.evidenceDetails || 'Brief handed over for court appearance.'}</td>
                  </tr>
                </tbody>
              </table>

              <div className="print-signatures">
                <div className="print-sig-box">
                  <div className="sig-line" />
                  <span>Briefing Senior Advocate Signature</span>
                </div>
                <div className="print-sig-box right">
                  <div className="sig-line" />
                  <span>Briefed Advocate / Clerk Acknowledgement</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
