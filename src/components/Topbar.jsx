import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Scale, Bell, LogOut, MapPin, Search, ChevronDown, Calendar, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { OFFICE } from '../data/menu.js'

export default function Topbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [now, setNow] = useState(new Date())
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 10000)
    return () => clearInterval(t)
  }, [])

  const doLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="topbar">
      <div className="tb-left">
        <button className="tb-brand" onClick={() => navigate('/dashboard')} title="LegalCase Dashboard">
          <span className="tb-logo">
            <Scale size={17} strokeWidth={2.4} />
          </span>
          <div className="tb-brand-info">
            <span className="tb-brand-name">Legal<span className="tb-brand-gold">Case</span></span>
            <span className="tb-brand-sub">Practice Suite</span>
          </div>
        </button>

        <div className="tb-office-badge">
          <div className="tb-office-row">
            <span className="tb-office-icon"><ShieldCheck size={13} /></span>
            <strong className="tb-office-name">{OFFICE.name}</strong>
          </div>
          <div className="tb-office-loc">
            <MapPin size={11} className="tb-pin" />
            <span title={OFFICE.address}>{OFFICE.address}</span>
          </div>
        </div>
      </div>

      <div className="tb-right">
        <div className="tb-search">
          <Search size={14} className="tb-search-icon" />
          <input placeholder="Search client, case no, CNR..." aria-label="Search cases and clients" />
          <kbd className="tb-shortcut">Ctrl K</kbd>
        </div>

        <div className="tb-datetime">
          <div className="tb-date">
            <Calendar size={12} className="tb-cal-icon" />
            <span>{now.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
          <div className="tb-time">
            <span className="tb-live-dot" />
            <span>{now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        <button
          className="tb-icon-btn"
          onClick={() => alert('Notifications — All daily court listings are up to date')}
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={15} />
          <span className="tb-notif-dot" />
        </button>

        <div className="tb-user-wrapper">
          <button
            className="tb-user-btn"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-haspopup="true"
          >
            <span className="tb-avatar">{(user?.name || 'A').charAt(0)}</span>
            <span className="tb-user-details">
              <span className="tb-user-name">{user?.name || 'Anupam Maity'}</span>
              <small className="tb-user-role">Advocate / Admin</small>
            </span>
            <ChevronDown size={13} className={`tb-chevron ${open ? 'open' : ''}`} />
          </button>

          {open && (
            <div className="tb-dropdown" onMouseLeave={() => setOpen(false)}>
              <div className="tb-dropdown-header">
                <span className="tb-dh-name">{user?.name || 'Anupam Maity'}</span>
                <span className="tb-dh-id">{user?.username || 'admin'} · Active Session</span>
              </div>
              <div className="tb-dropdown-divider" />
              <button className="tb-dropdown-action" onClick={doLogout}>
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
