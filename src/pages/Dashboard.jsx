import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FolderCog, PenSquare, BarChart3, QrCode, Plus, CalendarDays,
  ChevronRight, Scale, Briefcase, Receipt, LayoutDashboard,
  CreditCard, AlertTriangle, UploadCloud, BellRing, Tags, BadgeIndianRupee,
  Layers, Landmark
} from 'lucide-react'
import Topbar from '../components/Topbar.jsx'
import StatCard from '../components/StatCard.jsx'
import {
  STATS,
  CASE_OPERATIONS_MODULES,
  ACCOUNTS_FINANCIAL_MODULES
} from '../data/menu.js'
import { getPracticeOverviewStats, onStorageUpdate } from '../services/storageService.js'
import './dashboard.css'

// Stat card click -> related screen
const STAT_LINK = {
  clients: '/clients',
  cases: '/cases',
  billing: '/due-list',
  payment: '/payments',
  expense: '/expenses',
  consultancy: '/consultancy-fees',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [overviewStats, setOverviewStats] = useState(() => getPracticeOverviewStats())

  // Listen to storage changes to keep statistics live & dynamic
  useEffect(() => {
    return onStorageUpdate(() => {
      setOverviewStats(getPracticeOverviewStats())
    })
  }, [])

  const go = (target) => {
    if (target.startsWith('/')) {
      navigate(target)
    } else {
      navigate(`/module/${target}`)
    }
  }

  // Inject real dynamic counts into the statistics cards
  const displayStats = STATS.map((s) => {
    if (s.key === 'clients') return { ...s, value: overviewStats.totalClients }
    if (s.key === 'cases') return { ...s, value: overviewStats.totalCases }
    if (s.key === 'billing') return { ...s, value: overviewStats.totalBilling }
    if (s.key === 'payment') return { ...s, value: overviewStats.totalPayment }
    if (s.key === 'expense') return { ...s, value: overviewStats.totalExpense }
    if (s.key === 'consultancy') return { ...s, value: overviewStats.totalConsultancy }
    return s
  })

  return (
    <div className="app-shell">
      {/* Sleek brand & quick navigation rail */}
      <aside className="rail">
        <div className="rail-top">
          <button className="rail-brand-icon" onClick={() => navigate('/dashboard')} title="LegalCase Dashboard">
            <Scale size={18} strokeWidth={2.4} />
          </button>
          <div className="rail-sep" />
          <nav className="rail-nav">
            <button className="rail-btn active" onClick={() => navigate('/dashboard')} title="Dashboard">
              <LayoutDashboard size={17} />
              <span className="rail-tip">Dashboard</span>
            </button>
            <button className="rail-btn" onClick={() => go('/cases')} title="Case Management">
              <Briefcase size={17} />
              <span className="rail-tip">Cases</span>
            </button>
            <button className="rail-btn" onClick={() => go('/clients')} title="Client Management">
              <Scale size={17} />
              <span className="rail-tip">Clients</span>
            </button>
            <button className="rail-btn" onClick={() => go('/payments')} title="Payment & Accounts">
              <CreditCard size={17} />
              <span className="rail-tip">Payments</span>
            </button>
            <button className="rail-btn" onClick={() => go('/due-list')} title="Outstanding Due List">
              <AlertTriangle size={17} />
              <span className="rail-tip">Dues</span>
            </button>
            <button className="rail-btn" onClick={() => go('/reminders')} title="Hearing Schedule">
              <BellRing size={17} />
              <span className="rail-tip">Hearings</span>
            </button>
            <button className="rail-btn" onClick={() => go('/case-search')} title="Reports & Query">
              <BarChart3 size={17} />
              <span className="rail-tip">Search</span>
            </button>
          </nav>
        </div>

        <div className="rail-bottom">
          <button
            className="rail-qr"
            title="Advocate Chambers Digital Verification QR"
            onClick={() => alert('Advocate Chambers Digital Verification QR')}
          >
            <QrCode size={18} />
          </button>
          <span className="rail-brand">Netprogen.</span>
        </div>
      </aside>

      <div className="app-main">
        <Topbar />

        <main className="dash">
          {/* Executive Dashboard Header */}
          <div className="dash-head">
            <div className="dash-head-text">
              <div className="dash-meta-badge">
                <span className="pulse-dot" />
                <span>Advocate Practice Console</span>
                <span className="badge-divider">/</span>
                <span className="badge-highlight">Active Session</span>
              </div>
              <h1 className="dash-title">Practice Overview</h1>
              <p className="dash-desc">Real-time statistics for clients, cases, fee billing, recoveries and expenditures</p>
            </div>

            <div className="dash-head-actions">
              <button className="btn-secondary" onClick={() => go('/reminders')}>
                <CalendarDays size={14} />
                <span>Today's Hearings</span>
              </button>
              <button className="btn-primary" onClick={() => go('/cases')}>
                <Plus size={15} strokeWidth={2.4} />
                <span>New Case</span>
              </button>
            </div>
          </div>

          {/* Compact 6-Card Metric Strip with Subtle Professional Palette */}
          <section className="stats-section" aria-label="Key Performance Metrics">
            <div className="stats-grid">
              {displayStats.map((s, i) => {
                const { key: statKey, ...rest } = s
                return (
                  <StatCard key={statKey} {...rest} delay={i * 35} onClick={() => go(STAT_LINK[statKey])} />
                )
              })}
            </div>
          </section>

          {/* Two Clearly Separated Dashboard Groups */}
          <div className="dash-group-section">
            {/* GROUP 1 – CASE MANAGEMENT & OPERATIONS */}
            <section className="group-panel group-panel-case" aria-label="Case Management & Operations">
              <div className="panel-head">
                <div className="panel-head-left">
                  <span className="panel-icon-wrap" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1.5px solid #bfdbfe' }}>
                    <Briefcase size={16} strokeWidth={2.2} />
                  </span>
                  <div>
                    <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', letterSpacing: '0.2px' }}>
                      GROUP 1 – CASE MANAGEMENT &amp; OPERATIONS
                    </h2>
                    <span className="panel-sub" style={{ color: '#475569' }}>
                      Client Master, Case Master, Hearing Calendar, Cause Lists &amp; Litigation Registry
                    </span>
                  </div>
                </div>
                <span className="panel-badge" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                  {CASE_OPERATIONS_MODULES.length} Modules
                </span>
              </div>

              <div className="dash-group-grid">
                {CASE_OPERATIONS_MODULES.map((m) => (
                  <button
                    key={m.slug}
                    className={`module-card ${m.isMaster ? 'card-master' : ''}`}
                    onClick={() => go(m.slug)}
                    title={m.desc}
                  >
                    <span className="mod-icon-wrap" style={m.isMaster ? { background: '#f1f5f9', color: '#2563eb' } : {}}>
                      <m.icon size={16} strokeWidth={2.2} />
                    </span>
                    <div className="mod-body">
                      <span className="mod-title">{m.label}</span>
                      <span className="mod-desc">{m.desc}</span>
                    </div>
                    <ChevronRight size={14} className="mod-arrow" />
                  </button>
                ))}
              </div>
            </section>

            {/* GROUP 2 – ACCOUNTS & FINANCIAL MANAGEMENT */}
            <section className="group-panel group-panel-accounts" aria-label="Accounts & Financial Management">
              <div className="panel-head">
                <div className="panel-head-left">
                  <span className="panel-icon-wrap" style={{ background: '#ecfdf5', color: '#047857', border: '1.5px solid #a7f3d0' }}>
                    <Receipt size={16} strokeWidth={2.2} />
                  </span>
                  <div>
                    <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', letterSpacing: '0.2px' }}>
                      GROUP 2 – ACCOUNTS &amp; FINANCIAL MANAGEMENT
                    </h2>
                    <span className="panel-sub" style={{ color: '#475569' }}>
                      Client Billing, Payment Receipts, Expenses, Consultancy Fees &amp; Outstanding Dues
                    </span>
                  </div>
                </div>
                <span className="panel-badge" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                  {ACCOUNTS_FINANCIAL_MODULES.length} Modules
                </span>
              </div>

              <div className="dash-group-grid">
                {ACCOUNTS_FINANCIAL_MODULES.map((m) => (
                  <button
                    key={m.slug}
                    className="module-card"
                    onClick={() => go(m.slug)}
                    title={m.desc}
                  >
                    <span className="mod-icon-wrap">
                      <m.icon size={16} strokeWidth={2.2} />
                    </span>
                    <div className="mod-body">
                      <span className="mod-title">{m.label}</span>
                      <span className="mod-desc">{m.desc}</span>
                    </div>
                    <ChevronRight size={14} className="mod-arrow" />
                  </button>
                ))}
              </div>
            </section>
          </div>

          <footer className="dash-foot">
            <div className="dash-foot-inner">
              <span>Advocate Office Automation &amp; Practice Management System</span>
              <span className="dash-foot-dot">·</span>
              <span>Secure Case Ledger</span>
              <span className="dash-foot-dot">·</span>
              <span>Powered by <strong>Netprogen.</strong></span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}
