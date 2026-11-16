import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarClock, Calendar, MessageSquare, Send, CheckCircle2,
  AlertCircle, ArrowLeft, ChevronRight, Search, Phone, User,
  Building2, Hash, Copy, Check, Clock, AlertTriangle, Printer
} from 'lucide-react'
import Topbar from '../components/Topbar.jsx'
import { OFFICE } from '../data/menu.js'
import {
  getCases, getReminders, saveReminder, updateCase,
  markReminderSent, onStorageUpdate
} from '../services/storageService.js'
import './management.css'

export default function NextDateReminders() {
  const navigate = useNavigate()
  const [cases, setCases] = useState(() => getCases())
  const [reminders, setReminders] = useState(() => getReminders())
  const [activeFilter, setActiveFilter] = useState('all') // 'today' | 'upcoming' | 'overdue' | 'all'
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  // Quick Date Reschedule Modal
  const [rescheduleCase, setRescheduleCase] = useState(null)
  const [newNextDate, setNewNextDate] = useState('')
  const [newPurpose, setNewPurpose] = useState('')

  useEffect(() => {
    return onStorageUpdate(() => {
      setCases(getCases())
      setReminders(getReminders())
    })
  }, [])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = (type, message) => setToast({ type, message })

  const todayStr = new Date().toISOString().split('T')[0]

  // Classify cases by hearing date
  const todayCases = cases.filter((c) => c.nextDate === todayStr)
  const upcomingCases = cases.filter((c) => c.nextDate && c.nextDate > todayStr).sort((a, b) => a.nextDate.localeCompare(b.nextDate))
  const overdueCases = cases.filter((c) => c.nextDate && c.nextDate < todayStr).sort((a, b) => b.nextDate.localeCompare(a.nextDate))

  let displayedCases = cases
  if (activeFilter === 'today') displayedCases = todayCases
  else if (activeFilter === 'upcoming') displayedCases = upcomingCases
  else if (activeFilter === 'overdue') displayedCases = overdueCases

  const filteredCases = displayedCases.filter((c) => {
    const q = search.toLowerCase()
    return (
      (c.clientName && c.clientName.toLowerCase().includes(q)) ||
      (c.caseNumber && c.caseNumber.toLowerCase().includes(q)) ||
      (c.courtName && c.courtName.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q)) ||
      (c.id && c.id.toLowerCase().includes(q)) ||
      (c.purpose && c.purpose.toLowerCase().includes(q))
    )
  })

  // Format WhatsApp Message
  const buildReminderMessage = (cs) => {
    const advocate = cs.advocateName || OFFICE.name
    return `COURT HEARING REMINDER:\nDear ${cs.clientName},\nThis is a court listing notification from the Chambers of Adv. ${advocate}.\n\nCase No: ${cs.caseNumber}\nCourt: ${cs.courtName}\nNext Date: ${cs.nextDate}\nPurpose: ${cs.purpose}\n\nPlease reach chambers or the court premises by 10:30 AM with all relevant briefs and papers.\nChambers: ${OFFICE.address}`
  }

  // Open WhatsApp Click-to-Chat
  const handleSendWhatsApp = (cs) => {
    const cleanPhone = String(cs.phone || '').replace(/[\s-+]/g, '')
    if (!cleanPhone || cleanPhone.length < 10) {
      showToast('error', 'Client mobile number is missing or invalid.')
      return
    }

    const message = buildReminderMessage(cs)
    const encoded = encodeURIComponent(message)
    const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`
    const waUrl = `https://wa.me/${phoneWithCountry}?text=${encoded}`

    window.open(waUrl, '_blank')
    showToast('success', `WhatsApp click-to-chat launched for ${cs.clientName}!`)
  }

  // Copy Message to Clipboard
  const handleCopyMessage = (cs) => {
    const message = buildReminderMessage(cs)
    navigator.clipboard.writeText(message)
    setCopiedId(cs.id)
    showToast('info', `Hearing notice text copied to clipboard!`)
    setTimeout(() => setCopiedId(null), 2500)
  }

  // Reschedule Next Hearing Date
  const handleOpenReschedule = (cs) => {
    setRescheduleCase(cs)
    setNewNextDate(cs.nextDate || '')
    setNewPurpose(cs.purpose || '')
  }

  const handleSaveReschedule = (e) => {
    e.preventDefault()
    if (!newNextDate) {
      showToast('error', 'Please choose a next hearing date.')
      return
    }

    try {
      updateCase(rescheduleCase.id, {
        nextDate: newNextDate,
        purpose: newPurpose || rescheduleCase.purpose,
      })
      showToast('success', `Next hearing date updated to ${newNextDate} for ${rescheduleCase.caseNumber}!`)
      setRescheduleCase(null)
    } catch (err) {
      showToast('error', err.message || 'Failed to update hearing date.')
    }
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
            <b className="crumbs-active">Next Date Hearing Reminders</b>
          </div>

          <div className="mgmt-header">
            <div className="mgmt-header-left">
              <span className="mgmt-icon-badge" style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}>
                <CalendarClock size={20} strokeWidth={2.2} />
              </span>
              <div>
                <div className="mgmt-tag-row">
                  <span className="tag-violet">Module 10: Judicial Calendar &amp; Client SMS / WhatsApp</span>
                  <span className="tag-muted">{cases.length} Listed Dockets</span>
                </div>
                <h1 className="mgmt-title">Case Next Date &amp; Hearing Reminders</h1>
                <p className="mgmt-desc">Track court dates, prepare advocate notices &amp; dispatch WhatsApp click-to-chat reminders</p>
              </div>
            </div>
            <div className="mgmt-header-actions">
              <button className="btn-secondary" onClick={() => window.print()}>
                <Printer size={14} />
                <span>Print Cause List</span>
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
              {toast.type === 'info' && <CheckCircle2 size={16} />}
              <span>{toast.message}</span>
            </div>
          )}

          {/* 4 Interactive Filter Tabs Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            <button
              type="button"
              className="panel"
              style={{
                padding: '14px 16px',
                textAlign: 'left',
                border: activeFilter === 'today' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                background: activeFilter === 'today' ? '#eff6ff' : '#ffffff',
                cursor: 'pointer',
                borderRadius: '8px',
              }}
              onClick={() => setActiveFilter('today')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', color: '#1e40af' }}>Today's Listings</span>
                <Clock size={16} color="#2563eb" />
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#1d4ed8', marginTop: '4px' }}>
                {todayCases.length} Hearings
              </div>
              <small style={{ color: '#64748b', fontSize: '11px' }}>Listed for today ({todayStr})</small>
            </button>

            <button
              type="button"
              className="panel"
              style={{
                padding: '14px 16px',
                textAlign: 'left',
                border: activeFilter === 'upcoming' ? '2px solid #16a34a' : '1px solid #e2e8f0',
                background: activeFilter === 'upcoming' ? '#f0fdf4' : '#ffffff',
                cursor: 'pointer',
                borderRadius: '8px',
              }}
              onClick={() => setActiveFilter('upcoming')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', color: '#15803d' }}>Upcoming Hearings</span>
                <Calendar size={16} color="#16a34a" />
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#16a34a', marginTop: '4px' }}>
                {upcomingCases.length} Hearings
              </div>
              <small style={{ color: '#64748b', fontSize: '11px' }}>Scheduled for future dates</small>
            </button>

            <button
              type="button"
              className="panel"
              style={{
                padding: '14px 16px',
                textAlign: 'left',
                border: activeFilter === 'overdue' ? '2px solid #dc2626' : '1px solid #e2e8f0',
                background: activeFilter === 'overdue' ? '#fef2f2' : '#ffffff',
                cursor: 'pointer',
                borderRadius: '8px',
              }}
              onClick={() => setActiveFilter('overdue')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', color: '#b91c1c' }}>Past / Need Next Date</span>
                <AlertTriangle size={16} color="#dc2626" />
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#dc2626', marginTop: '4px' }}>
                {overdueCases.length} Cases
              </div>
              <small style={{ color: '#64748b', fontSize: '11px' }}>Hearing passed, needs next date</small>
            </button>

            <button
              type="button"
              className="panel"
              style={{
                padding: '14px 16px',
                textAlign: 'left',
                border: activeFilter === 'all' ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                background: activeFilter === 'all' ? '#f5f3ff' : '#ffffff',
                cursor: 'pointer',
                borderRadius: '8px',
              }}
              onClick={() => setActiveFilter('all')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', color: '#6d28d9' }}>All Court Dockets</span>
                <CalendarClock size={16} color="#7c3aed" />
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#7c3aed', marginTop: '4px' }}>
                {cases.length} Total
              </div>
              <small style={{ color: '#64748b', fontSize: '11px' }}>Entire practice cause list</small>
            </button>
          </div>

          {/* Search Bar */}
          <div className="panel" style={{ padding: '12px 16px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search by client name, mobile number, case no, court, or hearing reason..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '32px' }}
              />
            </div>
          </div>

          {/* Hearing Schedule Table */}
          <div className="panel" style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div className="panel-card-head">
              <div className="pch-title">
                <span className="pch-dot pch-violet" />
                <h3>Court Hearing Cause List &amp; Dispatch</h3>
              </div>
              <span className="panel-count">{filteredCases.length} Dockets</span>
            </div>

            <div className="table-scroll-container">
              <table className="mgmt-table">
                <thead>
                  <tr>
                    <th style={{ width: '95px' }}>NEXT DATE</th>
                    <th>CLIENT NAME &amp; PHONE</th>
                    <th>CASE NUMBER &amp; COURT</th>
                    <th style={{ width: '90px' }}>CASE ID</th>
                    <th>FOR / REASON / PURPOSE</th>
                    <th style={{ width: '190px', textAlign: 'center' }}>REMINDER ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCases.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty-table-cell">
                        <AlertCircle size={18} className="empty-ic" />
                        <span>No cases found in this view.</span>
                      </td>
                    </tr>
                  ) : (
                    filteredCases.map((cs) => {
                      const isToday = cs.nextDate === todayStr
                      const isPast = cs.nextDate && cs.nextDate < todayStr
                      return (
                        <tr key={cs.id}>
                          <td>
                            <div className="hearing-date-badge" style={isToday ? { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' } : isPast ? { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' } : {}}>
                              <Calendar size={11} className="h-cal-ic" />
                              <strong style={{ fontSize: '12px' }}>{cs.nextDate || 'Not Set'}</strong>
                            </div>
                            {isToday && <small style={{ color: '#1d4ed8', fontWeight: '700', display: 'block', fontSize: '10px' }}>TODAY</small>}
                            {isPast && <small style={{ color: '#dc2626', fontWeight: '700', display: 'block', fontSize: '10px' }}>OVERDUE</small>}
                          </td>
                          <td>
                            <strong className="primary-text">{cs.clientName}</strong>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <Phone size={10} color="#64748b" />
                              <span style={{ fontSize: '11px', color: '#475569', fontWeight: '600' }}>{cs.phone || 'No phone'}</span>
                            </div>
                          </td>
                          <td>
                            <strong style={{ color: '#0f172a' }}>{cs.caseNumber}</strong>
                            <small className="muted-subtext">{cs.courtName}</small>
                          </td>
                          <td>
                            <span className="id-pill case-id">{cs.id}</span>
                          </td>
                          <td>
                            <span style={{ fontSize: '12px', color: '#334155', fontWeight: '500' }}>
                              {cs.purpose || 'Court hearing'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                              <button
                                type="button"
                                className="btn-icon-subtle"
                                style={{ padding: '4px 8px', background: '#dcfce7', border: '1px solid #86efac', color: '#15803d', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', borderRadius: '4px' }}
                                onClick={() => handleSendWhatsApp(cs)}
                                title="Open WhatsApp Click-to-Chat with Pre-composed Legal Notice"
                              >
                                <MessageSquare size={12} color="#16a34a" />
                                <span>WhatsApp</span>
                              </button>

                              <button
                                type="button"
                                className="btn-icon-subtle"
                                style={{ padding: '4px 6px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', borderRadius: '4px' }}
                                onClick={() => handleCopyMessage(cs)}
                                title="Copy Notice to Clipboard"
                              >
                                {copiedId === cs.id ? <Check size={12} color="#16a34a" /> : <Copy size={12} color="#475569" />}
                              </button>

                              <button
                                type="button"
                                className="btn-icon-subtle"
                                style={{ padding: '4px 6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', borderRadius: '4px' }}
                                onClick={() => handleOpenReschedule(cs)}
                                title="Update Next Date"
                              >
                                <Calendar size={12} color="#7c3aed" />
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

          {/* Quick Reschedule Modal */}
          {rescheduleCase && (
            <div className="mgmt-modal-overlay" onClick={() => setRescheduleCase(null)}>
              <div className="mgmt-modal-box" style={{ maxWidth: '440px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
                <div className="mgmt-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>
                    Reschedule Hearing: {rescheduleCase.caseNumber}
                  </h3>
                  <button className="clear-search-btn" onClick={() => setRescheduleCase(null)}>✕</button>
                </div>

                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', margin: '12px 0', fontSize: '12px' }}>
                  <div><b>Client:</b> {rescheduleCase.clientName} ({rescheduleCase.phone})</div>
                  <div><b>Court:</b> {rescheduleCase.courtName}</div>
                  <div><b>Current Hearing Date:</b> {rescheduleCase.nextDate || 'None'}</div>
                </div>

                <form onSubmit={handleSaveReschedule}>
                  <div className="form-field" style={{ marginBottom: '10px' }}>
                    <label className="field-lbl">New Next Hearing Date <span className="req">*</span></label>
                    <input
                      type="date"
                      className="form-input"
                      value={newNextDate}
                      onChange={(e) => setNewNextDate(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="form-field" style={{ marginBottom: '14px' }}>
                    <label className="field-lbl">Hearing Stage / Purpose</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newPurpose}
                      onChange={(e) => setNewPurpose(e.target.value)}
                      placeholder="e.g. Evidence, Arguments, Charge Framing..."
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button type="button" className="btn-secondary" onClick={() => setRescheduleCase(null)}>Cancel</button>
                    <button type="submit" className="btn-primary" style={{ background: '#7c3aed', borderColor: '#6d28d9' }}>
                      Update Court Schedule
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
