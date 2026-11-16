import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Scale, Bell, LogOut, MapPin, Search, ChevronDown, Calendar, ShieldCheck, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { OFFICE, ALL_MODULES } from '../data/menu.js'

// Map module slugs to their actual routes
const slugToRoute = (slug) => {
  const special = {
    'client-master':       '/clients',
    'client-information':  '/clients',
    'case-master':         '/cases',
    'case-next-entry':     '/reminders',
    'consultancy-fees':    '/consultancy-fees',
    'document-upload':     '/document-upload',
    'add-waiting-list':    '/waiting-list',
    'case-search-reports': '/case-search',
    'due-list':            '/due-list',
    'daily-collection-report': '/module/daily-collection-report',
    'date-wise-case-search':   '/module/date-wise-case-search',
    'date-wise-reminders':     '/module/date-wise-reminders',
    'head-wise-expense-report': '/expenses',
    'client-ledger-report':    '/module/client-ledger-report',
    'income-expense-report':   '/module/income-expense-report',
    'for-wise-case-report':    '/module/for-wise-case-report',
    'waiting-list':            '/waiting-list',
    'welcome-screen':          '/module/welcome-screen',
    'expense':                 '/expenses',
    'extra-brief':             '/module/extra-brief',
    'expense-head-master':     '/expenses',
    'client-billing':          '/payments',
    'client-payment':          '/payments',
    'date-wise-case-list-report': '/module/date-wise-case-list-report',
  }
  return special[slug] || `/module/${slug}`
}

export default function Topbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [now, setNow] = useState(new Date())
  const [open, setOpen] = useState(false)

  // Search state
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const searchRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 10000)
    return () => clearInterval(t)
  }, [])

  // Live-filter modules on every keystroke
  useEffect(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      setResults([])
      setSearchOpen(false)
      return
    }
    const matched = ALL_MODULES.filter(
      (m) =>
        m.label.toLowerCase().includes(q) ||
        m.desc.toLowerCase().includes(q) ||
        m.group.toLowerCase().includes(q)
    ).slice(0, 8)
    setResults(matched)
    setSearchOpen(matched.length > 0)
    setActiveIdx(-1)
  }, [query])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (!searchOpen) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIdx((i) => Math.min(i + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIdx((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        if (activeIdx >= 0 && results[activeIdx]) {
          selectResult(results[activeIdx])
        }
      } else if (e.key === 'Escape') {
        setSearchOpen(false)
        setQuery('')
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchOpen, results, activeIdx]
  )

  // Ctrl+K global shortcut to focus search
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const selectResult = (mod) => {
    navigate(slugToRoute(mod.slug))
    setQuery('')
    setResults([])
    setSearchOpen(false)
    setActiveIdx(-1)
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setSearchOpen(false)
    inputRef.current?.focus()
  }

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
        {/* Functional Module Search */}
        <div className="tb-search" ref={searchRef} style={{ position: 'relative' }}>
          <Search size={14} className="tb-search-icon" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query.trim() && setSearchOpen(results.length > 0)}
            placeholder="Search modules, reports..."
            aria-label="Search modules"
            aria-autocomplete="list"
            aria-expanded={searchOpen}
            autoComplete="off"
          />
          {query ? (
            <button
              onClick={clearSearch}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', display: 'flex', alignItems: 'center', color: '#888' }}
              aria-label="Clear search"
              title="Clear"
            >
              <X size={13} />
            </button>
          ) : (
            <kbd className="tb-shortcut">Ctrl K</kbd>
          )}

          {/* Search Results Dropdown */}
          {searchOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                background: 'var(--surface, #fff)',
                border: '1px solid var(--border, #e2e8f0)',
                borderRadius: '10px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                zIndex: 9999,
                overflow: 'hidden',
                minWidth: '260px',
              }}
              role="listbox"
              aria-label="Module search results"
            >
              {results.map((mod, idx) => {
                const Icon = mod.icon
                return (
                  <button
                    key={mod.slug}
                    role="option"
                    aria-selected={idx === activeIdx}
                    onClick={() => selectResult(mod)}
                    onMouseEnter={() => setActiveIdx(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '9px 14px',
                      background: idx === activeIdx ? 'var(--primary-tint, #eff6ff)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      borderBottom: idx < results.length - 1 ? '1px solid var(--border, #f1f5f9)' : 'none',
                      transition: 'background 0.12s',
                    }}
                  >
                    {Icon && (
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 28,
                          height: 28,
                          borderRadius: 7,
                          background: 'var(--primary-tint, #eff6ff)',
                          color: 'var(--primary, #3b82f6)',
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={14} />
                      </span>
                    )}
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontWeight: 600, fontSize: '0.78rem', color: 'var(--text, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {mod.label}
                      </span>
                      <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted, #64748b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {mod.group} · {mod.desc}
                      </span>
                    </span>
                    <ChevronDown
                      size={12}
                      style={{ transform: 'rotate(-90deg)', color: '#94a3b8', flexShrink: 0 }}
                    />
                  </button>
                )
              })}
            </div>
          )}
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
