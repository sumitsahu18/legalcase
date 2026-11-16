import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Hourglass, ListPlus, Clock, User, Phone, CheckCircle2,
  AlertCircle, ArrowLeft, ChevronRight, Search, Plus, Trash2, Edit3
} from 'lucide-react'
import Topbar from '../components/Topbar.jsx'
import { OFFICE } from '../data/menu.js'
import {
  getWaitingList, saveWaitingListEntry, updateWaitingListEntry,
  deleteWaitingListEntry, getClients, onStorageUpdate
} from '../services/storageService.js'
import './management.css'

export default function WaitingList() {
  const navigate = useNavigate()
  const [list, setList] = useState(() => getWaitingList())
  const [clients, setClients] = useState(() => getClients())
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  const initialForm = {
    clientName: '',
    phone: '',
    purpose: '',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '11:00 AM',
    status: 'Waiting',
    notes: '',
  }
  const [formData, setFormData] = useState(initialForm)

  useEffect(() => {
    return onStorageUpdate(() => {
      setList(getWaitingList())
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

  const handleClientSelect = (clientId) => {
    const c = clients.find((x) => x.id === clientId)
    if (c) {
      setFormData((p) => ({
        ...p,
        clientName: c.name,
        phone: c.phone || '',
      }))
    }
  }

  const handleOpenAdd = () => {
    setEditingItem(null)
    setFormData(initialForm)
    setShowModal(true)
  }

  const handleOpenEdit = (item) => {
    setEditingItem(item)
    setFormData({
      clientName: item.clientName || '',
      phone: item.phone || '',
      purpose: item.purpose || '',
      date: item.date || '',
      timeSlot: item.timeSlot || '11:00 AM',
      status: item.status || 'Waiting',
      notes: item.notes || '',
    })
    setShowModal(true)
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!formData.clientName.trim() || !formData.purpose.trim()) {
      showToast('error', 'Client Name and Consultation Purpose required.')
      return
    }

    try {
      if (editingItem) {
        updateWaitingListEntry(editingItem.id, formData)
        showToast('success', `Updated appointment for ${formData.clientName}!`)
      } else {
        saveWaitingListEntry(formData)
        showToast('success', `Added ${formData.clientName} to Chamber Waiting Queue!`)
      }
      setShowModal(false)
    } catch (err) {
      showToast('error', err.message || 'Operation failed.')
    }
  }

  const handleDelete = (id) => {
    if (window.confirm('Remove client from waiting list?')) {
      deleteWaitingListEntry(id)
      showToast('info', 'Client removed from queue.')
    }
  }

  const handleStatusChange = (id, newStatus) => {
    updateWaitingListEntry(id, { status: newStatus })
    showToast('success', `Status updated to ${newStatus}`)
  }

  const filteredList = list.filter((w) => {
    const q = search.toLowerCase()
    return (
      (w.clientName && w.clientName.toLowerCase().includes(q)) ||
      (w.phone && w.phone.includes(q)) ||
      (w.purpose && w.purpose.toLowerCase().includes(q)) ||
      (w.status && w.status.toLowerCase().includes(q))
    )
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
            <span className="crumbs-muted">Chamber Operations</span>
            <ChevronRight size={12} className="crumbs-sep" />
            <b className="crumbs-active">Chamber Waiting List &amp; Queue</b>
          </div>

          <div className="mgmt-header">
            <div className="mgmt-header-left">
              <span className="mgmt-icon-badge" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
                <Hourglass size={20} strokeWidth={2.2} />
              </span>
              <div>
                <div className="mgmt-tag-row">
                  <span className="tag-muted">Chamber Reception Queue</span>
                  <span className="tag-muted">{list.filter((x) => x.status === 'Waiting').length} In Waiting</span>
                </div>
                <h1 className="mgmt-title">Client Chamber Waiting List</h1>
                <p className="mgmt-desc">Manage daily visitor queue, appointment slots, &amp; consultation progress</p>
              </div>
            </div>
            <div className="mgmt-header-actions">
              <button className="btn-primary" onClick={handleOpenAdd}>
                <Plus size={14} />
                <span>Add to Queue</span>
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
          <div className="panel" style={{ padding: '12px 16px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search waiting client name, mobile, purpose, or status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '32px' }}
              />
            </div>
          </div>

          {/* Waiting Table */}
          <div className="panel" style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div className="panel-card-head">
              <div className="pch-title">
                <span className="pch-dot" style={{ background: '#f59e0b' }} />
                <h3>Chamber Consultation Queue</h3>
              </div>
              <span className="panel-count">{filteredList.length} Appointments</span>
            </div>

            <div className="table-scroll-container">
              <table className="mgmt-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>QUEUE ID</th>
                    <th>CLIENT NAME &amp; PHONE</th>
                    <th style={{ width: '95px' }}>DATE</th>
                    <th style={{ width: '100px' }}>TIME SLOT</th>
                    <th>PURPOSE OF VISIT</th>
                    <th style={{ width: '130px' }}>STATUS</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="empty-table-cell">
                        <CheckCircle2 size={20} color="#16a34a" style={{ margin: '0 auto 6px', display: 'block' }} />
                        <span>No clients currently in the waiting list queue.</span>
                      </td>
                    </tr>
                  ) : (
                    filteredList.map((w) => (
                      <tr key={w.id}>
                        <td><span className="id-pill" style={{ background: '#fef3c7', color: '#b45309' }}>{w.id}</span></td>
                        <td>
                          <strong className="primary-text">{w.clientName}</strong>
                          <small className="muted-subtext">{w.phone}</small>
                        </td>
                        <td><span className="cell-date">{w.date}</span></td>
                        <td>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a' }}>{w.timeSlot}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: '#334155' }}>{w.purpose}</span>
                          {w.notes && <small className="muted-subtext">{w.notes}</small>}
                        </td>
                        <td>
                          <select
                            value={w.status}
                            onChange={(e) => handleStatusChange(w.id, e.target.value)}
                            style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid #cbd5e1',
                              background: w.status === 'Waiting' ? '#fef3c7' : w.status === 'In Consultation' ? '#eff6ff' : '#dcfce7',
                              color: w.status === 'Waiting' ? '#b45309' : w.status === 'In Consultation' ? '#1d4ed8' : '#15803d',
                            }}
                          >
                            <option value="Waiting">Waiting</option>
                            <option value="In Consultation">In Consultation</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                            <button
                              type="button"
                              className="btn-icon-subtle"
                              style={{ padding: '3px 6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                              onClick={() => handleOpenEdit(w)}
                              title="Edit"
                            >
                              <Edit3 size={12} color="#475569" />
                            </button>
                            <button
                              type="button"
                              className="btn-icon-subtle"
                              style={{ padding: '3px 6px', border: '1px solid #fecaca', background: '#fff1f2', cursor: 'pointer' }}
                              onClick={() => handleDelete(w.id)}
                              title="Remove"
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

          {/* Modal */}
          {showModal && (
            <div className="mgmt-modal-overlay" onClick={() => setShowModal(false)}>
              <div className="mgmt-modal-box" style={{ maxWidth: '440px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
                <div className="mgmt-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>
                    {editingItem ? 'Edit Queue Entry' : 'Add Client to Waiting List'}
                  </h3>
                  <button className="clear-search-btn" onClick={() => setShowModal(false)}>✕</button>
                </div>

                <form onSubmit={handleSave} style={{ marginTop: '12px' }}>
                  <div className="form-field" style={{ marginBottom: '10px' }}>
                    <label className="field-lbl">Autofill from Registered Client</label>
                    <select className="form-input form-select" onChange={(e) => handleClientSelect(e.target.value)}>
                      <option value="">-- Optional --</option>
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
                      required
                      autoFocus
                    />
                  </div>

                  <div className="form-row-2" style={{ marginBottom: '10px' }}>
                    <div className="form-field">
                      <label className="field-lbl">Phone Number</label>
                      <input
                        type="tel"
                        className="form-input"
                        value={formData.phone}
                        onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                      />
                    </div>
                    <div className="form-field">
                      <label className="field-lbl">Date</label>
                      <input
                        type="date"
                        className="form-input"
                        value={formData.date}
                        onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row-2" style={{ marginBottom: '10px' }}>
                    <div className="form-field">
                      <label className="field-lbl">Time Slot</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.timeSlot}
                        onChange={(e) => setFormData((p) => ({ ...p, timeSlot: e.target.value }))}
                        placeholder="e.g. 11:30 AM"
                      />
                    </div>
                    <div className="form-field">
                      <label className="field-lbl">Status</label>
                      <select
                        className="form-input form-select"
                        value={formData.status}
                        onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                      >
                        <option value="Waiting">Waiting</option>
                        <option value="In Consultation">In Consultation</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-field" style={{ marginBottom: '14px' }}>
                    <label className="field-lbl">Purpose of Visit <span className="req">*</span></label>
                    <textarea
                      rows={2}
                      className="form-input form-textarea"
                      value={formData.purpose}
                      onChange={(e) => setFormData((p) => ({ ...p, purpose: e.target.value }))}
                      placeholder="e.g. Bail consultation, land injunction urgent advice..."
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                    <button type="submit" className="btn-primary" style={{ background: '#f59e0b', borderColor: '#d97706', color: '#0f172a' }}>
                      {editingItem ? 'Update Queue' : 'Add to Queue'}
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
