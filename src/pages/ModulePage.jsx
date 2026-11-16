import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Construction, ChevronRight, Home } from 'lucide-react'
import Topbar from '../components/Topbar.jsx'
import { ALL_MODULES } from '../data/menu.js'

// Fully Functional Module Components
import ClientManagement from './ClientManagement.jsx'
import CaseManagement from './CaseManagement.jsx'
import CaseSearchReports from './CaseSearchReports.jsx'
import PaymentManagement from './PaymentManagement.jsx'
import DueList from './DueList.jsx'
import DailyCollectionReport from './DailyCollectionReport.jsx'
import ExpenseManagement from './ExpenseManagement.jsx'
import ConsultancyFees from './ConsultancyFees.jsx'
import DocumentUploadSystem from './DocumentUploadSystem.jsx'
import NextDateReminders from './NextDateReminders.jsx'
import DateWiseCaseSearch from './DateWiseCaseSearch.jsx'
import DateWiseReminders from './DateWiseReminders.jsx'
import ExtraBriefAdvocate from './ExtraBriefAdvocate.jsx'
import WaitingList from './WaitingList.jsx'
import ClientLedgerReport from './ClientLedgerReport.jsx'
import IncomeExpenseReport from './IncomeExpenseReport.jsx'
import ForWiseCaseReport from './ForWiseCaseReport.jsx'
import WelcomeScreen from './WelcomeScreen.jsx'
import './dashboard.css'

export default function ModulePage() {
  const { slug } = useParams()
  const navigate = useNavigate()

  // Module 1: Client Master & Client Information
  if (slug === 'client-master' || slug === 'client-information') {
    return <ClientManagement />
  }

  // Module 2: Case Master
  if (slug === 'case-master') {
    return <CaseManagement />
  }

  // Module 3: Case Search & Head-Wise Reports
  if (slug === 'case-search-reports') {
    return <CaseSearchReports />
  }

  // Module 4: Payment Management & Date-Wise Payments
  if (slug === 'client-billing') {
    return <PaymentManagement initialTab="entry" />
  }
  if (slug === 'client-payment') {
    return <PaymentManagement initialTab="date-wise" />
  }

  // Module 5: Due List
  if (slug === 'due-list') {
    return <DueList />
  }

  // Module 6: Daily Collection Report
  if (slug === 'daily-collection-report') {
    return <DailyCollectionReport />
  }

  // Module 7: Expense Head Master, Expense Entry & Head-Wise Expense Reports
  if (slug === 'expense-head-master') {
    return <ExpenseManagement initialTab="heads" />
  }
  if (slug === 'expense') {
    return <ExpenseManagement initialTab="expenses" />
  }
  if (slug === 'head-wise-expense-report') {
    return <ExpenseManagement initialTab="summary" />
  }

  // Module 8: Consultancy Fees
  if (slug === 'consultancy-fees') {
    return <ConsultancyFees />
  }

  // Module 9: ID-Wise Document Upload System
  if (slug === 'document-upload') {
    return <DocumentUploadSystem />
  }

  // Module 10: Next Date Reminder System & Case Cause List
  if (slug === 'case-next-entry' || slug === 'date-wise-case-list-report' || slug === 'next-date-reminders') {
    return <NextDateReminders />
  }

  // Module 11: Date-Wise Case Searching (PDF Specification)
  if (slug === 'date-wise-case-search') {
    return <DateWiseCaseSearch />
  }

  // Module 12: Date-Wise Reminders for Anupam Maity (PDF Specification)
  if (slug === 'date-wise-reminders') {
    return <DateWiseReminders />
  }

  // Module 13: Extra Brief for Court to Other Advocate (Evidence)
  if (slug === 'extra-brief') {
    return <ExtraBriefAdvocate />
  }

  // Supporting Operational Modules
  if (slug === 'add-waiting-list' || slug === 'waiting-list') {
    return <WaitingList />
  }
  if (slug === 'client-ledger-report') {
    return <ClientLedgerReport />
  }
  if (slug === 'income-expense-report') {
    return <IncomeExpenseReport />
  }
  if (slug === 'for-wise-case-report') {
    return <ForWiseCaseReport />
  }
  if (slug === 'welcome-screen') {
    return <WelcomeScreen />
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
            <h2>{mod?.label || slug} Workspace</h2>
            <p className="me-text">
              The operational workspace for this module is configured and active.
            </p>
            <button className="btn-primary" onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
