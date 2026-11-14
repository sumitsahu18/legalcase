import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Construction, ChevronRight, Home } from 'lucide-react'
import Topbar from '../components/Topbar.jsx'
import { ALL_MODULES } from '../data/menu.js'
import ClientManagement from './ClientManagement.jsx'
import CaseManagement from './CaseManagement.jsx'
import './dashboard.css'

export default function ModulePage() {
  const { slug } = useParams()
  const navigate = useNavigate()

  // Route to functional client management for client master and information
  if (slug === 'client-master' || slug === 'client-information') {
    return <ClientManagement />
  }

  // Route to functional case management for case master and next entry
  if (slug === 'case-master' || slug === 'case-next-entry') {
    return <CaseManagement />
  }

  const mod = ALL_MODULES.find((m) => m.slug === slug)
  const Icon = mod?.icon || Construction

  return (
    <div className="app-shell">
      <div className="app-main">
        <Topbar />
        <main className="dash">
          <div className="crumbs">
            <button className="crumbs-link" onClick={() => navigate('/dashboard')}>
              <Home size={13} />
              <span>Dashboard</span>
            </button>
            <ChevronRight size={12} className="crumbs-sep" />
            <span className="crumbs-muted">{mod?.group || 'Module'}</span>
            <ChevronRight size={12} className="crumbs-sep" />
            <b className="crumbs-active">{mod?.label || slug}</b>
          </div>

          <div className="module-head">
            <div className="module-head-left">
              <span className="module-icon">
                <Icon size={20} strokeWidth={2.2} />
              </span>
              <div>
                <div className="module-badge-row">
                  <span className="module-group-tag">{mod?.group || 'Advocate Module'}</span>
                  <span className="module-route-tag">/{slug}</span>
                </div>
                <h1 className="module-title">{mod?.label || 'Module Workspace'}</h1>
                <p className="module-desc">{mod?.desc || 'Operational data records and practice interface'}</p>
              </div>
            </div>
            <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
              <ArrowLeft size={14} />
              <span>Back to Dashboard</span>
            </button>
          </div>

          <div className="panel module-empty">
            <div className="me-badge">
              <Construction size={28} strokeWidth={1.8} />
            </div>
            <h2>{mod?.label} Workspace</h2>
            <p className="me-text">
              The interface and business route for this legal module are registered and active. Interactive forms, data tables, and reporting queries will connect to the backend API here.
            </p>

            <div className="me-details-grid">
              <div className="me-detail-item">
                <span className="me-detail-k">Category</span>
                <span className="me-detail-v">{mod?.group || 'System'}</span>
              </div>
              <div className="me-detail-item">
                <span className="me-detail-k">Module Slug</span>
                <span className="me-detail-v">{slug}</span>
              </div>
              <div className="me-detail-item">
                <span className="me-detail-k">Access Role</span>
                <span className="me-detail-v">Administrator</span>
              </div>
              <div className="me-detail-item">
                <span className="me-detail-k">Route Status</span>
                <span className="me-detail-v tag-active">Connected</span>
              </div>
            </div>

            <button className="btn-primary" onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
