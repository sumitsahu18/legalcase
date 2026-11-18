import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarClock, Calendar, MessageSquare, Send, CheckCircle2,
  AlertCircle, ArrowLeft, ChevronRight, Search, Phone, User,
  Building2, Hash, Copy, Check, Clock, AlertTriangle, Printer,
  Plus, Edit3, X, Save, RotateCcw, Scale, FileText, ChevronDown
} from 'lucide-react'
import Topbar from '../components/Topbar.jsx'
import { OFFICE } from '../data/menu.js'
import {
  getCases, getClients, saveCase, updateCase,
  getReminders, onStorageUpdate
} from '../services/storageService.js'
import './management.css'

export default function NextDateReminders() {
  const navigate = useNavigate()
  const [cases, setCases] = useState(() => getCases())
  const [clients, setClients] = useState(() => getClients())
  const [reminders, setReminders] = useState(() => getReminders())
  const [activeFilter, setActiveFilter] = useState('all') // 'today' | 'upcoming' | 'overdue' | 'all'
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  // ---------------- Section 6: Date-Wise Case List States ----------------
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // ---------------- Section 4: + New Entry Modal States ----------------
  const [showNewEntryModal, setShowNewEntryModal] = useState(false)
  const initialNewEntryForm = {
    clientId: '',
    clientName: '',
    phone: '',
    caseNumber: '',
    psCaseNumber: '',
    courtName: '',
    underSection: '',
    nextDate: new Date().toISOString().split('T')[0],
    purpose: '',
    ppName: '',
    lc: '',
    tcc: '',
    briefForRoom: '',
    regNumber: '',
    notes: '',
  }
  const [newEntryForm, setNewEntryForm] = useState(initialNewEntryForm)
  const [newEntryErrors, setNewEntryErrors] = useState({})

  // ---------------- Section 5: Reminder Action Section States ----------------
  const [actionCase, setActionCase] = useState(null)
  const reminderActionRef = useRef(null)

  // Three Editable Fields inside Reminder Action
  const [editingCourt, setEditingCourt] = useState(false)
  const [editCourtVal, setEditCourtVal] = useState('')
  const [editingPP, setEditingPP] = useState(false)
  const [editPPVal, setEditPPVal] = useState('')
  const [editingOtherCase, setEditingOtherCase] = useState(false)
  const [editOtherCaseVal, setEditOtherCaseVal] = useState('')

  // Quick Date Reschedule Modal
  const [rescheduleCase, setRescheduleCase] = useState(null)
  const [newNextDate, setNewNextDate] = useState('')
  const [newPurpose, setNewPurpose] = useState('')

  useEffect(() => {
    return onStorageUpdate(() => {
      setCases(getCases())
      setClients(getClients())
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

  // Classify cases by appearance date
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
      (c.purpose && c.purpose.toLowerCase().includes(q)) ||
      (c.ppName && c.ppName.toLowerCase().includes(q)) ||
      (c.psCaseNumber && c.psCaseNumber.toLowerCase().includes(q))
    )
  })

  // Format WhatsApp Message
  const buildReminderMessage = (cs) => {
    const advocate = cs.advocateName || OFFICE.name
    return `COURT APPEARANCE NOTICE:\nDear ${cs.clientName},\nThis is a court appearance notification from the Chambers of Adv. ${advocate}.\n\nCase No: ${cs.caseNumber}\nCourt: ${cs.courtName}\nAppearance Date: ${cs.nextDate}\nPurpose: ${cs.purpose || 'Court appearance'}\nPP Name: ${cs.ppName || 'N/A'}\n\nPlease reach chambers or court premises by 10:30 AM with all relevant briefs and papers.\nChambers: ${OFFICE.address}`
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
    showToast('info', `Appearance notice text copied to clipboard!`)
    setTimeout(() => setCopiedId(null), 2500)
  }

  // Reschedule Appearance Date
  const handleOpenReschedule = (cs) => {
    setRescheduleCase(cs)
    setNewNextDate(cs.nextDate || '')
    setNewPurpose(cs.purpose || '')
  }

  const handleSaveReschedule = (e) => {
    e.preventDefault()
    if (!newNextDate) {
      showToast('error', 'Please choose an appearance date.')
      return
    }

    try {
      const updated = updateCase(rescheduleCase.id, {
        nextDate: newNextDate,
        purpose: newPurpose || rescheduleCase.purpose,
      })
      showToast('success', `Appearance date updated to ${newNextDate} for ${rescheduleCase.caseNumber}!`)
      setRescheduleCase(null)
      if (actionCase && actionCase.id === rescheduleCase.id) {
        setActionCase(updated)
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to update appearance date.')
    }
  }

  // ---------------- Section 5: Reminder Action Open & In-place Editing ----------------
  const handleOpenReminderAction = (cs) => {
    setActionCase(cs)
    setEditingCourt(false)
    setEditingPP(false)
    setEditingOtherCase(false)
    setTimeout(() => {
      if (reminderActionRef.current) {
        reminderActionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  const handleStartEditCourt = () => {
    setEditCourtVal(actionCase.courtName || '')
    setEditingCourt(true)
  }

  const handleSaveCourt = () => {
    if (!editCourtVal.trim()) {
      showToast('error', 'Court Name cannot be blank.')
      return
    }
    try {
      const updated = updateCase(actionCase.id, { courtName: editCourtVal.trim() })
      setActionCase(updated)
      setCases(getCases())
      setEditingCourt(false)
      showToast('success', `Court Name updated to "${editCourtVal.trim()}"!`)
    } catch (err) {
      showToast('error', err.message || 'Failed to update Court Name.')
    }
  }

  const handleStartEditPP = () => {
    setEditPPVal(actionCase.ppName || '')
    setEditingPP(true)
  }

  const handleSavePP = () => {
    try {
      const updated = updateCase(actionCase.id, { ppName: editPPVal.trim() })
      setActionCase(updated)
      setCases(getCases())
      setEditingPP(false)
      showToast('success', `PP Name updated to "${editPPVal.trim()}"!`)
    } catch (err) {
      showToast('error', err.message || 'Failed to update PP Name.')
    }
  }

  const handleStartEditOtherCase = () => {
    setEditOtherCaseVal(actionCase.otherCaseNumber || actionCase.psCaseNumber || '')
    setEditingOtherCase(true)
  }

  const handleSaveOtherCase = () => {
    try {
      const updated = updateCase(actionCase.id, {
        otherCaseNumber: editOtherCaseVal.trim(),
        psCaseNumber: editOtherCaseVal.trim(),
      })
      setActionCase(updated)
      setCases(getCases())
      setEditingOtherCase(false)
      showToast('success', `Other Case No. updated to "${editOtherCaseVal.trim()}"!`)
    } catch (err) {
      showToast('error', err.message || 'Failed to update Other Case No.')
    }
  }

  // ---------------- Section 4: + New Entry Form Handlers ----------------
  const handleClientSelectForNewEntry = (e) => {
    const cid = e.target.value
    if (!cid) {
      setNewEntryForm((prev) => ({ ...prev, clientId: '', clientName: '', phone: '' }))
      return
    }
    const c = clients.find((x) => x.id === cid)
    if (c) {
      setNewEntryForm((prev) => ({
        ...prev,
        clientId: c.id,
        clientName: c.name,
        phone: c.phone || '',
      }))
      if (newEntryErrors.clientName) {
        setNewEntryErrors((prev) => ({ ...prev, clientName: null }))
      }
    }
  }

  const handleSaveNewEntry = (e) => {
    e.preventDefault()
    const errs = {}
    if (!newEntryForm.clientName.trim()) errs.clientName = 'Client Name is required'
    if (!newEntryForm.caseNumber.trim()) errs.caseNumber = 'Case Number is required'
    if (!newEntryForm.courtName.trim()) errs.courtName = 'Court Name is required'
    if (!newEntryForm.nextDate) errs.nextDate = 'Appearance Date is required'

    if (Object.keys(errs).length > 0) {
      setNewEntryErrors(errs)
      showToast('error', 'Please resolve all required fields.')
      return
    }

    try {
      const saved = saveCase({
        ...newEntryForm,
        caseDetails: newEntryForm.notes || '',
      })
      setCases(getCases())
      showToast('success', `Case ${saved.caseNumber} registered with Appearance Date ${saved.nextDate}!`)
      setShowNewEntryModal(false)
      setNewEntryForm(initialNewEntryForm)
      setNewEntryErrors({})
    } catch (err) {
      showToast('error', err.message || 'Failed to create new case entry.')
    }
  }

  // ---------------- Section 6: Date-Wise Case List Filtering ----------------
  const dateRangeInvalid = Boolean(dateFrom && dateTo && dateFrom > dateTo)

  const dateFilteredCases = cases.filter((cs) => {
    if (dateRangeInvalid) return false
    if (dateFrom && (!cs.nextDate || cs.nextDate < dateFrom)) return false
    if (dateTo && (!cs.nextDate || cs.nextDate > dateTo)) return false
    if (search) {
      const q = search.toLowerCase()
      const matches =
        (cs.clientName && cs.clientName.toLowerCase().includes(q)) ||
        (cs.caseNumber && cs.caseNumber.toLowerCase().includes(q)) ||
        (cs.courtName && cs.courtName.toLowerCase().includes(q)) ||
        (cs.phone && cs.phone.includes(q)) ||
        (cs.id && cs.id.toLowerCase().includes(q)) ||
        (cs.purpose && cs.purpose.toLowerCase().includes(q)) ||
        (cs.ppName && cs.ppName.toLowerCase().includes(q)) ||
        (cs.psCaseNumber && cs.psCaseNumber.toLowerCase().includes(q))
      if (!matches) return false
    }
    return true
  }).sort((a, b) => (a.nextDate || '').localeCompare(b.nextDate || ''))

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
            <b className="crumbs-active">Case Next Entry &amp; Appearance Reminders</b>
          </div>

          <div className="mgmt-header">
            <div className="mgmt-header-left">
              <span className="mgmt-icon-badge" style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}>
                <CalendarClock size={20} strokeWidth={2.2} />
              </span>
              <div>
                <div className="mgmt-tag-row">
                  <span className="tag-violet">Case Next Entry &amp; Reminders</span>
                  <span className="tag-muted">{cases.length} Listed Dockets</span>
                </div>
                <h1 className="mgmt-title">Case Next Entry &amp; Appearance Schedule</h1>
                <p className="mgmt-desc">Manage judicial appearance dates, view date-wise register &amp; execute reminder actions</p>
              </div>
            </div>
            <div className="mgmt-header-actions">
              {/* Section 4: Prominently Placed + New Entry Button */}
              <button
                className="btn-primary"
                onClick={() => {
                  setNewEntryForm(initialNewEntryForm)
                  setNewEntryErrors({})
                  setShowNewEntryModal(true)
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}
              >
                <Plus size={15} strokeWidth={2.4} />
                <span>+ New Entry</span>
              </button>

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
                placeholder="Search by client name, mobile number, case no, court, PP Name, or hearing reason..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '32px' }}
              />
            </div>
          </div>

          {/* ---------------- Section 6: Date-Wise Case List (Directly Below Search Bar) ---------------- */}
          <section className="panel" style={{ background: '#ffffff', borderRadius: '8px', border: '1.5px solid #cbd5e1', marginBottom: '20px', overflow: 'hidden' }}>
            <div className="panel-card-head" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div className="pch-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="pch-dot" style={{ background: '#2563eb' }} />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>Date-Wise Case List</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>From Date:</label>
                  <input
                    type="date"
                    className="form-input"
                    style={{ width: '150px', padding: '4px 8px', fontSize: '12px' }}
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>To Date:</label>
                  <input
                    type="date"
                    className="form-input"
                    style={{ width: '150px', padding: '4px 8px', fontSize: '12px' }}
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
                {(dateFrom || dateTo) && (
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => {
                      setDateFrom('')
                      setDateTo('')
                    }}
                  >
                    <RotateCcw size={12} />
                    <span>Clear Dates</span>
                  </button>
                )}
                <span className="panel-count">{dateFilteredCases.length} Matching Records</span>
              </div>
            </div>

            {/* Date Validation Alert */}
            {dateRangeInvalid && (
              <div style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca', padding: '10px 16px', color: '#dc2626', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <strong>Validation Warning:</strong> From Date cannot be later than To Date. Please adjust the date range.
              </div>
            )}

            {/* Structured Register Table */}
            <div className="table-scroll-container">
              <table className="mgmt-table">
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ width: '55px', textAlign: 'center' }}>SL NO.</th>
                    <th style={{ width: '130px' }}>CASE NUMBER</th>
                    <th style={{ width: '130px' }}>PS CASE NUMBER</th>
                    <th>COURT NAME</th>
                    <th>CLIENT / PARTY NAME</th>
                    <th style={{ width: '115px' }}>APPEARANCE DATE</th>
                    <th>PP NAME</th>
                    <th>FOR / PURPOSE</th>
                    <th style={{ width: '130px', textAlign: 'center' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {dateFilteredCases.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="empty-table-cell">
                        <AlertCircle size={18} className="empty-ic" />
                        <span>No cases found for the selected date range.</span>
                      </td>
                    </tr>
                  ) : (
                    dateFilteredCases.map((cs, idx) => (
                      <tr key={cs.id} className="table-row-clickable" onClick={() => handleOpenReminderAction(cs)}>
                        <td style={{ textAlign: 'center', fontWeight: '700', color: '#64748b' }}>
                          {idx + 1}
                        </td>
                        <td>
                          <strong className="primary-text">{cs.caseNumber}</strong>
                          <small className="muted-subtext">{cs.id}</small>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: '#334155' }}>
                            {cs.psCaseNumber || cs.otherCaseNumber || '—'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a' }}>{cs.courtName}</span>
                        </td>
                        <td>
                          <strong className="primary-text">{cs.clientName}</strong>
                          <small className="muted-subtext">{cs.phone || '—'}</small>
                        </td>
                        <td>
                          <div className="hearing-date-badge">
                            <Calendar size={11} className="h-cal-ic" />
                            <strong style={{ fontSize: '12px' }}>{cs.nextDate || 'Not Set'}</strong>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: '#1e40af', fontWeight: '600' }}>
                            {cs.ppName || '—'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: '#475569' }}>
                            {cs.purpose || 'Court appearance'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="btn-primary"
                              style={{ padding: '3px 8px', fontSize: '11px', background: '#7c3aed', borderColor: '#6d28d9' }}
                              onClick={() => handleOpenReminderAction(cs)}
                              title="Open Reminder Action Detail & Scroll Down"
                            >
                              Reminder Action
                            </button>
                            <button
                              type="button"
                              className="btn-icon-subtle"
                              style={{ padding: '3px 6px', background: '#dcfce7', border: '1px solid #86efac', color: '#15803d', cursor: 'pointer', borderRadius: '4px' }}
                              onClick={() => handleSendWhatsApp(cs)}
                              title="Send WhatsApp Reminder"
                            >
                              <MessageSquare size={12} color="#16a34a" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* All Listings Schedule Table */}
          <div className="panel" style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '20px' }}>
            <div className="panel-card-head">
              <div className="pch-title">
                <span className="pch-dot pch-violet" />
                <h3>Court Appearance Cause List &amp; Dispatch</h3>
              </div>
              <span className="panel-count">{filteredCases.length} Dockets</span>
            </div>

            <div className="table-scroll-container">
              <table className="mgmt-table">
                <thead>
                  <tr>
                    <th style={{ width: '110px' }}>APPEARANCE DATE</th>
                    <th>CLIENT NAME &amp; PHONE</th>
                    <th>CASE NUMBER &amp; COURT</th>
                    <th style={{ width: '90px' }}>CASE ID</th>
                    <th>FOR / REASON / PURPOSE</th>
                    <th style={{ width: '210px', textAlign: 'center' }}>REMINDER ACTIONS</th>
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
                              {cs.purpose || 'Court appearance'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                              <button
                                type="button"
                                className="btn-primary"
                                style={{ padding: '3px 8px', fontSize: '11px', background: '#7c3aed', borderColor: '#6d28d9' }}
                                onClick={() => handleOpenReminderAction(cs)}
                                title="Open Reminder Action and Scroll Down"
                              >
                                Reminder Action
                              </button>
                              <button
                                type="button"
                                className="btn-icon-subtle"
                                style={{ padding: '4px 8px', background: '#dcfce7', border: '1px solid #86efac', color: '#15803d', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', borderRadius: '4px' }}
                                onClick={() => handleSendWhatsApp(cs)}
                                title="Open WhatsApp Notice"
                              >
                                <MessageSquare size={12} color="#16a34a" />
                              </button>
                              <button
                                type="button"
                                className="btn-icon-subtle"
                                style={{ padding: '4px 6px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', borderRadius: '4px' }}
                                onClick={() => handleCopyMessage(cs)}
                                title="Copy Notice"
                              >
                                {copiedId === cs.id ? <Check size={12} color="#16a34a" /> : <Copy size={12} color="#475569" />}
                              </button>
                              <button
                                type="button"
                                className="btn-icon-subtle"
                                style={{ padding: '4px 6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', borderRadius: '4px' }}
                                onClick={() => handleOpenReschedule(cs)}
                                title="Update Appearance Date"
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

          {/* ---------------- Section 5: REMINDER ACTION SECTION (Persistent, Auto-Scroll, Editable Court/PP/OtherCase) ---------------- */}
          {actionCase && (
            <div
              ref={reminderActionRef}
              id="reminder-action-section"
              className="panel"
              style={{
                background: '#ffffff',
                border: '2px solid #7c3aed',
                borderRadius: '10px',
                padding: '20px',
                marginBottom: '24px',
                boxShadow: '0 8px 24px rgba(124, 58, 237, 0.12)',
              }}
            >
              {/* Header with ONLY EXPLICIT CLOSE (X) BUTTON */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f5f3ff', color: '#7c3aed', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>
                    <CalendarClock size={13} />
                    <span>Active Reminder Action Dossier</span>
                  </div>
                  <h3 style={{ margin: '4px 0 0', fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
                    {actionCase.caseNumber} — {actionCase.clientName} ({actionCase.id})
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                    Client Mobile: {actionCase.phone || 'N/A'} · Under Section: {actionCase.underSection || 'N/A'}
                  </p>
                </div>

                {/* Only Close (X) button dismisses this section */}
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setActionCase(null)}
                  title="Close Reminder Action Section"
                  style={{ width: '28px', height: '28px', fontSize: '16px', background: '#f1f5f9', borderRadius: '50%' }}
                >
                  ✕
                </button>
              </div>

              {/* 3 EDITABLE CASE INFORMATION FIELDS: Court Name, PP Name, Other Case No. */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', margin: '16px 0' }}>
                {/* 1. Court Name */}
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#475569' }}>
                      Court Name
                    </label>
                    {!editingCourt && (
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '2px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        onClick={handleStartEditCourt}
                      >
                        <Edit3 size={11} />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                  {editingCourt ? (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      <input
                        type="text"
                        className="form-input"
                        value={editCourtVal}
                        onChange={(e) => setEditCourtVal(e.target.value)}
                        placeholder="Enter updated Court Name"
                        autoFocus
                      />
                      <button type="button" className="btn-primary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={handleSaveCourt}>
                        Save
                      </button>
                      <button type="button" className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => setEditingCourt(false)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>
                      {actionCase.courtName || '—'}
                    </strong>
                  )}
                </div>

                {/* 2. PP Name */}
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#475569' }}>
                      PP Name (Public Prosecutor)
                    </label>
                    {!editingPP && (
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '2px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        onClick={handleStartEditPP}
                      >
                        <Edit3 size={11} />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                  {editingPP ? (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      <input
                        type="text"
                        className="form-input"
                        value={editPPVal}
                        onChange={(e) => setEditPPVal(e.target.value)}
                        placeholder="Enter PP Name"
                        autoFocus
                      />
                      <button type="button" className="btn-primary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={handleSavePP}>
                        Save
                      </button>
                      <button type="button" className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => setEditingPP(false)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>
                      {actionCase.ppName || '—'}
                    </strong>
                  )}
                </div>

                {/* 3. Other Case No. */}
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#475569' }}>
                      Other Case No. / P.S. Case No.
                    </label>
                    {!editingOtherCase && (
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '2px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        onClick={handleStartEditOtherCase}
                      >
                        <Edit3 size={11} />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                  {editingOtherCase ? (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      <input
                        type="text"
                        className="form-input"
                        value={editOtherCaseVal}
                        onChange={(e) => setEditOtherCaseVal(e.target.value)}
                        placeholder="Enter Other Case Number"
                        autoFocus
                      />
                      <button type="button" className="btn-primary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={handleSaveOtherCase}>
                        Save
                      </button>
                      <button type="button" className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => setEditingOtherCase(false)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>
                      {actionCase.otherCaseNumber || actionCase.psCaseNumber || '—'}
                    </strong>
                  )}
                </div>
              </div>

              {/* Additional Reminder Case Details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Appearance Date:</span>
                  <strong style={{ fontSize: '13px', color: '#7c3aed' }}>{actionCase.nextDate || 'Not set'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>For / Hearing Purpose:</span>
                  <strong style={{ fontSize: '13px', color: '#0f172a' }}>{actionCase.purpose || 'Court appearance'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Total Case Contract:</span>
                  <strong style={{ fontSize: '13px', color: '#0f172a' }}>{actionCase.tcc || '—'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Law Clerk (L/C):</span>
                  <strong style={{ fontSize: '13px', color: '#0f172a' }}>{actionCase.lc || '—'}</strong>
                </div>
              </div>

              {/* Quick Actions Row inside Reminder Section */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ background: '#16a34a', borderColor: '#15803d', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => handleSendWhatsApp(actionCase)}
                  >
                    <MessageSquare size={14} />
                    <span>Send WhatsApp Appearance Notice</span>
                  </button>

                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => handleCopyMessage(actionCase)}
                  >
                    {copiedId === actionCase.id ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                    <span>Copy Full Notice Text</span>
                  </button>

                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => handleOpenReschedule(actionCase)}
                  >
                    <Calendar size={14} />
                    <span>Reschedule Appearance Date</span>
                  </button>
                </div>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setActionCase(null)}
                  style={{ fontWeight: '600' }}
                >
                  Close Dossier (X)
                </button>
              </div>
            </div>
          )}

          {/* ---------------- Section 4: + NEW ENTRY MODAL ---------------- */}
          {showNewEntryModal && (
            <div className="mgmt-modal-overlay" onClick={() => setShowNewEntryModal(false)}>
              <div className="mgmt-modal-box" style={{ maxWidth: '680px', width: '92%' }} onClick={(e) => e.stopPropagation()}>
                <div className="mgmt-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#f5f3ff', color: '#7c3aed', display: 'grid', placeItems: 'center' }}>
                      <Plus size={18} strokeWidth={2.4} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>+ New Case Entry</h3>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                        Register new case schedule entry in the active practice database
                      </p>
                    </div>
                  </div>
                  <button className="clear-search-btn" onClick={() => setShowNewEntryModal(false)}>✕</button>
                </div>

                <form onSubmit={handleSaveNewEntry} style={{ marginTop: '14px' }}>
                  {/* Select Registered Client */}
                  <div className="form-field" style={{ marginBottom: '10px' }}>
                    <label className="field-lbl">Autofill from Registered Client (Optional)</label>
                    <select
                      className="form-input form-select"
                      value={newEntryForm.clientId}
                      onChange={handleClientSelectForNewEntry}
                    >
                      <option value="">-- Choose Registered Client or enter manually below --</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>{c.id} — {c.name} ({c.phone})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row-2" style={{ marginBottom: '10px' }}>
                    <div className="form-field">
                      <label className="field-lbl">Client Full Name <span className="req">*</span></label>
                      <input
                        type="text"
                        className={`form-input ${newEntryErrors.clientName ? 'input-err' : ''}`}
                        placeholder="Client legal name"
                        value={newEntryForm.clientName}
                        onChange={(e) => setNewEntryForm((p) => ({ ...p, clientName: e.target.value }))}
                        required
                      />
                      {newEntryErrors.clientName && <span className="err-msg">{newEntryErrors.clientName}</span>}
                    </div>

                    <div className="form-field">
                      <label className="field-lbl">Client Mobile Number</label>
                      <input
                        type="tel"
                        className="form-input"
                        placeholder="10-digit phone"
                        maxLength={10}
                        value={newEntryForm.phone}
                        onChange={(e) => setNewEntryForm((p) => ({ ...p, phone: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="form-row-2" style={{ marginBottom: '10px' }}>
                    <div className="form-field">
                      <label className="field-lbl">Case Number <span className="req">*</span></label>
                      <input
                        type="text"
                        className={`form-input ${newEntryErrors.caseNumber ? 'input-err' : ''}`}
                        placeholder="e.g. CR/342/2026 or TS/108/2026"
                        value={newEntryForm.caseNumber}
                        onChange={(e) => setNewEntryForm((p) => ({ ...p, caseNumber: e.target.value }))}
                        required
                      />
                      {newEntryErrors.caseNumber && <span className="err-msg">{newEntryErrors.caseNumber}</span>}
                    </div>

                    <div className="form-field">
                      <label className="field-lbl">Court Name <span className="req">*</span></label>
                      <input
                        type="text"
                        className={`form-input ${newEntryErrors.courtName ? 'input-err' : ''}`}
                        placeholder="e.g. ACJM Court, Contai"
                        value={newEntryForm.courtName}
                        onChange={(e) => setNewEntryForm((p) => ({ ...p, courtName: e.target.value }))}
                        required
                      />
                      {newEntryErrors.courtName && <span className="err-msg">{newEntryErrors.courtName}</span>}
                    </div>
                  </div>

                  <div className="form-row-2" style={{ marginBottom: '10px' }}>
                    <div className="form-field">
                      <label className="field-lbl">Appearance Date <span className="req">*</span></label>
                      <input
                        type="date"
                        className={`form-input ${newEntryErrors.nextDate ? 'input-err' : ''}`}
                        value={newEntryForm.nextDate}
                        onChange={(e) => setNewEntryForm((p) => ({ ...p, nextDate: e.target.value }))}
                        required
                      />
                      {newEntryErrors.nextDate && <span className="err-msg">{newEntryErrors.nextDate}</span>}
                    </div>

                    <div className="form-field">
                      <label className="field-lbl">For / Purpose of Hearing</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Evidence, Hearing, Framing Charge..."
                        value={newEntryForm.purpose}
                        onChange={(e) => setNewEntryForm((p) => ({ ...p, purpose: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="form-row-2" style={{ marginBottom: '10px' }}>
                    <div className="form-field">
                      <label className="field-lbl">P.S. Case Number</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Ramnagar PS Case No. 84/2025"
                        value={newEntryForm.psCaseNumber}
                        onChange={(e) => setNewEntryForm((p) => ({ ...p, psCaseNumber: e.target.value }))}
                      />
                    </div>

                    <div className="form-field">
                      <label className="field-lbl">PP Name (Public Prosecutor)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Mr. S. K. Bera (APP)"
                        value={newEntryForm.ppName}
                        onChange={(e) => setNewEntryForm((p) => ({ ...p, ppName: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="form-row-2" style={{ marginBottom: '10px' }}>
                    <div className="form-field">
                      <label className="field-lbl">Brief for Room</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Brief for Room"
                        value={newEntryForm.briefForRoom}
                        onChange={(e) => setNewEntryForm((p) => ({ ...p, briefForRoom: e.target.value }))}
                      />
                    </div>

                    <div className="form-field">
                      <label className="field-lbl">Reg Number</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Reg Number"
                        value={newEntryForm.regNumber}
                        onChange={(e) => setNewEntryForm((p) => ({ ...p, regNumber: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="form-field" style={{ marginBottom: '16px' }}>
                    <label className="field-lbl">Remarks</label>
                    <textarea
                      rows={2}
                      className="form-input form-textarea"
                      placeholder="Remarks, custody notes, or hearing instructions..."
                      value={newEntryForm.notes}
                      onChange={(e) => setNewEntryForm((p) => ({ ...p, notes: e.target.value }))}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                    <button type="button" className="btn-secondary" onClick={() => setShowNewEntryModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary" style={{ background: '#7c3aed', borderColor: '#6d28d9', padding: '6px 16px' }}>
                      Save New Entry
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Quick Reschedule Modal */}
          {rescheduleCase && (
            <div className="mgmt-modal-overlay" onClick={() => setRescheduleCase(null)}>
              <div className="mgmt-modal-box" style={{ maxWidth: '440px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
                <div className="mgmt-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>
                    Reschedule Appearance Date: {rescheduleCase.caseNumber}
                  </h3>
                  <button className="clear-search-btn" onClick={() => setRescheduleCase(null)}>✕</button>
                </div>

                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', margin: '12px 0', fontSize: '12px' }}>
                  <div><b>Client:</b> {rescheduleCase.clientName} ({rescheduleCase.phone})</div>
                  <div><b>Court:</b> {rescheduleCase.courtName}</div>
                  <div><b>Current Appearance Date:</b> {rescheduleCase.nextDate || 'None'}</div>
                </div>

                <form onSubmit={handleSaveReschedule}>
                  <div className="form-field" style={{ marginBottom: '10px' }}>
                    <label className="field-lbl">New Appearance Date <span className="req">*</span></label>
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
                      Update Appearance Date
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
