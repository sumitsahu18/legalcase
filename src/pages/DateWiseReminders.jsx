import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BellRing, Calendar, Phone, Plus, Trash2, Edit3, Save, Printer,
  Download, ArrowLeft, ChevronRight, Search, CheckCircle2, AlertCircle,
  MessageSquare, User, LayoutGrid, List
} from 'lucide-react'
import Topbar from '../components/Topbar.jsx'
import { OFFICE } from '../data/menu.js'
import {
  getReminders, saveReminder, updateReminder, deleteReminder,
  getClients, onStorageUpdate
} from '../services/storageService.js'
import './management.css'

export default function DateWiseReminders() {
  const navigate = useNavigate()
  const [reminders, setReminders] = useState(() => getReminders())
  const [clients, setClients] = useState(() => getClients())
  const [selectedDate, setSelectedDate] = useState(() => {
    const r = getReminders()
    return r.length > 0 ? r[0].date : new Date().toISOString().split('T')[0]
  })
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingReminder, setEditingReminder] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [viewMode, setViewMode] = useState('pdf') // 'pdf' | 'table'

  // New / Edit Reminder Form State
  const initialForm = {
    clientName: '',
    phone: '',
    date: new Date().toISOString().split('T')[0],
    reasons: '',
    courtName: '',
  }
  const [formData, setFormData] = useState(initialForm)

  useEffect(() => {
    return onStorageUpdate(() => {
      setReminders(getReminders())
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

  // Handle client select autofill in modal
  const handleClientSelect = (clientId) => {
    const c = clients.find((x) => x.id === clientId)
    if (c) {
      setFormData((prev) => ({
        ...prev,
        clientName: c.name,
        phone: c.phone || '',
      }))
    }
  }

  const handleOpenAddModal = () => {
    setEditingReminder(null)
    setFormData({ ...initialForm, date: selectedDate || new Date().toISOString().split('T')[0] })
    setShowAddModal(true)
  }

  const handleOpenEditModal = (rem) => {
    setEditingReminder(rem)
    setFormData({
      clientName: rem.clientName || '',
      phone: rem.phone || '',
      date: rem.date || '',
      reasons: rem.reasons || '',
      courtName: rem.courtName || '',
    })
    setShowAddModal(true)
  }

  const handleSaveReminder = (e) => {
    e.preventDefault()
    if (!formData.clientName.trim() || !formData.date || !formData.reasons.trim()) {
      showToast('error', 'Please fill in Client Name, Date and Reasons.')
      return
    }

    try {
      if (editingReminder) {
        updateReminder(editingReminder.id, formData)
        showToast('success', `Reminder for ${formData.clientName} updated!`)
      } else {
        saveReminder(formData)
        showToast('success', `Reminder for ${formData.clientName} created for ${formData.date}!`)
      }
      setShowAddModal(false)
    } catch (err) {
      showToast('error', err.message || 'Operation failed.')
    }
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    try {
      deleteReminder(deleteTarget.id)
      showToast('success', `Reminder deleted.`)
    } catch (err) {
      showToast('error', err.message || 'Deletion failed.')
    } finally {
      setDeleteTarget(null)
    }
  }

  // Filter reminders by selectedDate and search
  const filteredReminders = reminders.filter((r) => {
    const matchesDate = !selectedDate || r.date === selectedDate
    const q = search.toLowerCase()
    const matchesSearch =
      !search ||
      (r.clientName && r.clientName.toLowerCase().includes(q)) ||
      (r.phone && r.phone.includes(q)) ||
      (r.reasons && r.reasons.toLowerCase().includes(q)) ||
      (r.courtName && r.courtName.toLowerCase().includes(q))

    return matchesDate && matchesSearch
  })

  // WhatsApp click-to-chat
  const handleSendWhatsApp = (rem) => {
    const cleanPhone = String(rem.phone || '').replace(/[\s-+]/g, '')
    if (!cleanPhone || cleanPhone.length < 10) {
      showToast('error', 'Mobile number missing or invalid.')
      return
    }
    const msg = `CHAMBERS REMINDER (${OFFICE.name}):\nDear ${rem.clientName},\nThis is an advance court & chamber notice regarding:\n${rem.reasons}\nDate: ${rem.date}\nChambers: ${OFFICE.address}`
    const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`
    window.open(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg)}`, '_blank')
    showToast('success', `WhatsApp launched for ${rem.clientName}!`)
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
            <b className="crumbs-active">Date-Wise Reminders (PDF)</b>
          </div>

          <div className="mgmt-header">
            <div className="mgmt-header-left">
              <span className="mgmt-icon-badge" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                <BellRing size={20} strokeWidth={2.2} />
              </span>
              <div>
                <div className="mgmt-tag-row">
                  <span className="tag-muted" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}>
                    Module 12: Client Spec (Software.pdf)
                  </span>
                  <span className="tag-muted">{filteredReminders.length} Scheduled Reminders</span>
                </div>
                <h1 className="mgmt-title">DATE WISE REMINDERS FOR ANUPAM MAITY</h1>
                <p className="mgmt-desc">Exact specification from client PDF: Client Name, Mob. No. &amp; Reasons with date filtering</p>
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
                <span>Add Reminder</span>
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

          {/* Date Selector & Search Bar */}
          <div className="panel" style={{ padding: '14px 18px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                All Dates
              </button>
            </div>

            <div style={{ width: '320px', position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search Client Name, Mobile, Reason..."
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
              {/* PDF Header Banner */}
              <div style={{ background: '#dc2626', color: '#ffffff', padding: '10px 16px', textAlign: 'center', fontWeight: '900', fontSize: '16px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '24px' }}>
                DATE WISE REMINDERS FOR ANUPAM MAITY
              </div>

              {selectedDate && (
                <div style={{ textAlign: 'right', fontWeight: '700', fontSize: '13px', color: '#0f172a', marginBottom: '16px' }}>
                  Reminder Date: <u>{selectedDate}</u>
                </div>
              )}

              {filteredReminders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                  <AlertCircle size={24} style={{ margin: '0 auto 8px', display: 'block', color: '#94a3b8' }} />
                  No reminders scheduled for <strong>{selectedDate || 'all dates'}</strong>.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {filteredReminders.map((rem, idx) => (
                    <div
                      key={rem.id}
                      style={{
                        border: '1.5px solid #0f172a',
                        borderRadius: '4px',
                        padding: '14px 18px',
                        background: '#ffffff',
                        display: 'grid',
                        gridTemplateColumns: '1.5fr 1.2fr 3fr auto',
                        gap: '16px',
                        alignItems: 'center',
                      }}
                    >
                      {/* 1. Client Name : */}
                      <div>
                        <strong>{idx + 1}. Client Name :</strong>{' '}
                        <span style={{ fontWeight: '700', color: '#0f172a' }}>{rem.clientName}</span>
                      </div>

                      {/* Mob. No.- */}
                      <div>
                        <strong>Mob. No.-</strong>{' '}
                        <span style={{ fontWeight: '700', color: '#0f172a' }}>{rem.phone || '—'}</span>
                      </div>

                      {/* Reasons */}
                      <div>
                        <strong>Reasons :</strong>{' '}
                        <span style={{ color: '#334155', lineHeight: '1.4' }}>{rem.reasons}</span>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn-icon-subtle"
                          style={{ padding: '4px 8px', background: '#dcfce7', border: '1px solid #86efac', color: '#15803d', cursor: 'pointer', borderRadius: '4px' }}
                          onClick={() => handleSendWhatsApp(rem)}
                          title="Send WhatsApp Reminder"
                        >
                          <MessageSquare size={13} color="#16a34a" />
                        </button>
                        <button
                          type="button"
                          className="btn-icon-subtle"
                          style={{ padding: '4px 6px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', borderRadius: '4px' }}
                          onClick={() => handleOpenEditModal(rem)}
                          title="Edit Reminder"
                        >
                          <Edit3 size={13} color="#475569" />
                        </button>
                        <button
                          type="button"
                          className="btn-icon-subtle"
                          style={{ padding: '4px 6px', border: '1px solid #fecaca', background: '#fff1f2', cursor: 'pointer', borderRadius: '4px' }}
                          onClick={() => setDeleteTarget(rem)}
                          title="Delete Reminder"
                        >
                          <Trash2 size={13} color="#dc2626" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= VIEW 2: TABLE LAYOUT ================= */}
          {viewMode === 'table' && (
            <div className="panel" style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div className="panel-card-head">
                <div className="pch-title">
                  <span className="pch-dot" style={{ background: '#dc2626' }} />
                  <h3>Reminders Roster ({selectedDate || 'All Dates'})</h3>
                </div>
                <span className="panel-count">{filteredReminders.length} Entries</span>
              </div>

              <div className="table-scroll-container">
                <table className="mgmt-table">
                  <thead>
                    <tr>
                      <th style={{ width: '45px' }}>#</th>
                      <th style={{ width: '95px' }}>DATE</th>
                      <th>CLIENT NAME</th>
                      <th style={{ width: '110px' }}>MOB. NO.</th>
                      <th>REASONS</th>
                      <th style={{ width: '120px', textAlign: 'center' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReminders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="empty-table-cell">
                          <AlertCircle size={18} className="empty-ic" />
                          <span>No reminders scheduled for this criteria.</span>
                        </td>
                      </tr>
                    ) : (
                      filteredReminders.map((rem, idx) => (
                        <tr key={rem.id}>
                          <td><b>{idx + 1}</b></td>
                          <td><span className="cell-date">{rem.date}</span></td>
                          <td><strong className="primary-text">{rem.clientName}</strong></td>
                          <td><span className="cell-phone">{rem.phone}</span></td>
                          <td><span style={{ fontSize: '13px', color: '#334155' }}>{rem.reasons}</span></td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                              <button
                                type="button"
                                className="btn-icon-subtle"
                                style={{ padding: '3px 6px', background: '#dcfce7', border: '1px solid #86efac', cursor: 'pointer' }}
                                onClick={() => handleSendWhatsApp(rem)}
                                title="WhatsApp"
                              >
                                <MessageSquare size={12} color="#16a34a" />
                              </button>
                              <button
                                type="button"
                                className="btn-icon-subtle"
                                style={{ padding: '3px 6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                                onClick={() => handleOpenEditModal(rem)}
                                title="Edit"
                              >
                                <Edit3 size={12} color="#475569" />
                              </button>
                              <button
                                type="button"
                                className="btn-icon-subtle"
                                style={{ padding: '3px 6px', border: '1px solid #fecaca', background: '#fff1f2', cursor: 'pointer' }}
                                onClick={() => setDeleteTarget(rem)}
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

          {/* Add / Edit Reminder Modal */}
          {showAddModal && (
            <div className="mgmt-modal-overlay" onClick={() => setShowAddModal(false)}>
              <div className="mgmt-modal-box" style={{ maxWidth: '480px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
                <div className="mgmt-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>
                    {editingReminder ? 'Edit Reminder' : 'Add New Chamber Reminder'}
                  </h3>
                  <button className="clear-search-btn" onClick={() => setShowAddModal(false)}>✕</button>
                </div>

                <form onSubmit={handleSaveReminder} style={{ marginTop: '12px' }}>
                  <div className="form-field" style={{ marginBottom: '10px' }}>
                    <label className="field-lbl">Autofill from Registered Client (Optional)</label>
                    <select
                      className="form-input form-select"
                      onChange={(e) => handleClientSelect(e.target.value)}
                    >
                      <option value="">-- Choose Existing Client --</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
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
                    />
                  </div>

                  <div className="form-row-2" style={{ marginBottom: '10px' }}>
                    <div className="form-field">
                      <label className="field-lbl">Mobile Number</label>
                      <input
                        type="tel"
                        className="form-input"
                        value={formData.phone}
                        onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                        placeholder="10-digit mobile"
                      />
                    </div>
                    <div className="form-field">
                      <label className="field-lbl">Reminder Date <span className="req">*</span></label>
                      <input
                        type="date"
                        className="form-input"
                        value={formData.date}
                        onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-field" style={{ marginBottom: '14px' }}>
                    <label className="field-lbl">Reasons / Matters for Adv. Anupam Maity <span className="req">*</span></label>
                    <textarea
                      rows={3}
                      className="form-input form-textarea"
                      value={formData.reasons}
                      onChange={(e) => setFormData((p) => ({ ...p, reasons: e.target.value }))}
                      placeholder="e.g. Production of certified deed; witness cross-examination; anticipatory bail reminder..."
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                    <button type="submit" className="btn-primary" style={{ background: '#dc2626', borderColor: '#b91c1c' }}>
                      {editingReminder ? 'Update Reminder' : 'Save Reminder'}
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
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#991b1b' }}>Delete Reminder?</h3>
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: '#334155', margin: '10px 0 16px' }}>
                  Are you sure you want to delete this reminder for <strong>{deleteTarget.clientName}</strong> on <strong>{deleteTarget.date}</strong>?
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
        </main>
      </div>
    </div>
  )
}
