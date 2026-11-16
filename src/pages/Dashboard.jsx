import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FolderCog, PenSquare, BarChart3, QrCode, Plus, CalendarDays,
  ChevronRight, Scale, Briefcase, Receipt, LayoutDashboard,
  CreditCard, AlertTriangle, UploadCloud, BellRing, Tags, BadgeIndianRupee
} from 'lucide-react'
import Topbar from '../components/Topbar.jsx'
import StatCard from '../components/StatCard.jsx'
import { STATS, MASTER_ENTRY, DATA_ENTRY, REPORTS } from '../data/menu.js'
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

          {/* Balanced 2-Column Operational Grid */}
          <div className="dash-grid">
            {/* Left Column: Master Entry & Data Entry */}
            <div className="dash-left-col">
              {/* Master Entry Panel */}
              <div className="panel panel-master">
                <div className="panel-head">
                  <div className="panel-head-left">
                    <span className="panel-icon-wrap icon-master">
                      <FolderCog size={15} />
                    </span>
                    <div>
                      <h2>Master Registry</h2>
                      <span className="panel-sub">Primary registries &amp; core legal configurations</span>
                    </div>
                  </div>
                  <span className="panel-badge">{MASTER_ENTRY.length} Masters</span>
                </div>

                <div className="master-grid">
                  {MASTER_ENTRY.map((m) => (
                    <button
                      key={m.slug}
                      className="master-card"
                      onClick={() => go(m.slug)}
                    >
                      <span className="mc-icon">
                        <m.icon size={16} strokeWidth={2.2} />
                      </span>
                      <div className="mc-body">
                        <span className="mc-title">{m.label}</span>
                        <span className="mc-desc">{m.desc}</span>
                      </div>
                      <ChevronRight size={14} className="mc-arrow" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Data Entry Panel */}
              <div className="panel panel-data">
                <div className="panel-head">
                  <div className="panel-head-left">
                    <span className="panel-icon-wrap icon-data">
                      <PenSquare size={15} />
                    </span>
                    <div>
                      <h2>Data Entry &amp; Operations</h2>
                      <span className="panel-sub">Daily litigation records, payments &amp; document vaults</span>
                    </div>
                  </div>
                  <span className="panel-badge">{DATA_ENTRY.length} Entry Modules</span>
                </div>

                <div className="data-grid">
                  {DATA_ENTRY.map((m) => (
                    <button
                      key={m.slug}
                      className="data-card"
                      onClick={() => go(m.slug)}
                    >
                      <span className="dc-icon">
                        <m.icon size={15} strokeWidth={2.2} />
                      </span>
                      <div className="dc-body">
                        <span className="dc-title">{m.label}</span>
                        <span className="dc-desc">{m.desc}</span>
                      </div>
                      <ChevronRight size={13} className="dc-arrow" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Reports & Legal Analytics */}
            <div className="dash-reports-col">
              <section className="panel panel-reports">
                <div className="panel-head">
                  <div className="panel-head-left">
                    <span className="panel-icon-wrap icon-reports">
                      <BarChart3 size={15} />
                    </span>
                    <div>
                      <h2>Reports &amp; Case Intelligence</h2>
                      <span className="panel-sub">Financial statements, cause lists &amp; judicial rosters</span>
                    </div>
                  </div>
                  <span className="panel-badge">{REPORTS.length} Reports</span>
                </div>

                <div className="reports-list">
                  {REPORTS.map((r, idx) => (
                    <button key={r.slug} className="report-row" onClick={() => go(r.slug)}>
                      <span className="rr-num">0{idx + 1}</span>
                      <span className="rr-icon">
                        <r.icon size={16} strokeWidth={2.2} />
                      </span>
                      <div className="rr-body">
                        <span className="rr-title">{r.label}</span>
                        <span className="rr-desc">{r.desc || 'Comprehensive report & audit statement'}</span>
                      </div>
                      <span className="rr-action">
                        <span>View</span>
                        <ChevronRight size={13} />
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
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
