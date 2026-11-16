import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ModulePage from './pages/ModulePage.jsx'

// Module Views
import ClientManagement from './pages/ClientManagement.jsx'
import CaseManagement from './pages/CaseManagement.jsx'
import CaseSearchReports from './pages/CaseSearchReports.jsx'
import PaymentManagement from './pages/PaymentManagement.jsx'
import DueList from './pages/DueList.jsx'
import DailyCollectionReport from './pages/DailyCollectionReport.jsx'
import ExpenseManagement from './pages/ExpenseManagement.jsx'
import ConsultancyFees from './pages/ConsultancyFees.jsx'
import DocumentUploadSystem from './pages/DocumentUploadSystem.jsx'
import NextDateReminders from './pages/NextDateReminders.jsx'
import DateWiseCaseSearch from './pages/DateWiseCaseSearch.jsx'
import DateWiseReminders from './pages/DateWiseReminders.jsx'
import ExtraBriefAdvocate from './pages/ExtraBriefAdvocate.jsx'
import WaitingList from './pages/WaitingList.jsx'
import ClientLedgerReport from './pages/ClientLedgerReport.jsx'
import IncomeExpenseReport from './pages/IncomeExpenseReport.jsx'
import ForWiseCaseReport from './pages/ForWiseCaseReport.jsx'
import WelcomeScreen from './pages/WelcomeScreen.jsx'

function Protected({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />

      {/* Module 1: Client Master */}
      <Route path="/clients" element={<Protected><ClientManagement /></Protected>} />
      <Route path="/client-master" element={<Protected><ClientManagement /></Protected>} />

      {/* Module 2: Case Master */}
      <Route path="/cases" element={<Protected><CaseManagement /></Protected>} />
      <Route path="/case-master" element={<Protected><CaseManagement /></Protected>} />

      {/* Module 3: Case Search & Reports */}
      <Route path="/case-search" element={<Protected><CaseSearchReports /></Protected>} />

      {/* Module 4: Payment Management */}
      <Route path="/payments" element={<Protected><PaymentManagement initialTab="entry" /></Protected>} />
      <Route path="/date-wise-payments" element={<Protected><PaymentManagement initialTab="date-wise" /></Protected>} />

      {/* Module 5: Due List */}
      <Route path="/due-list" element={<Protected><DueList /></Protected>} />

      {/* Module 6: Daily Collection Report */}
      <Route path="/daily-collection" element={<Protected><DailyCollectionReport /></Protected>} />

      {/* Module 7: Expense Head Master & Expenses */}
      <Route path="/expenses" element={<Protected><ExpenseManagement initialTab="expenses" /></Protected>} />
      <Route path="/expense-heads" element={<Protected><ExpenseManagement initialTab="heads" /></Protected>} />
      <Route path="/head-wise-expenses" element={<Protected><ExpenseManagement initialTab="summary" /></Protected>} />

      {/* Module 8: Consultancy Fees */}
      <Route path="/consultancy" element={<Protected><ConsultancyFees /></Protected>} />
      <Route path="/consultancy-fees" element={<Protected><ConsultancyFees /></Protected>} />

      {/* Module 9: ID-Wise Document Upload */}
      <Route path="/documents" element={<Protected><DocumentUploadSystem /></Protected>} />
      <Route path="/document-upload" element={<Protected><DocumentUploadSystem /></Protected>} />

      {/* Module 10: Next Date Reminder System */}
      <Route path="/reminders" element={<Protected><NextDateReminders /></Protected>} />
      <Route path="/case-next-entry" element={<Protected><NextDateReminders /></Protected>} />

      {/* Module 11: Date-Wise Case Searching (PDF) */}
      <Route path="/date-wise-case-search" element={<Protected><DateWiseCaseSearch /></Protected>} />

      {/* Module 12: Date-Wise Reminders (PDF) */}
      <Route path="/date-wise-reminders" element={<Protected><DateWiseReminders /></Protected>} />

      {/* Module 13: Extra Brief for Court to Other Advocate (Evidence) */}
      <Route path="/extra-brief" element={<Protected><ExtraBriefAdvocate /></Protected>} />

      {/* Supporting Operations & Reports */}
      <Route path="/waiting-list" element={<Protected><WaitingList /></Protected>} />
      <Route path="/client-ledger" element={<Protected><ClientLedgerReport /></Protected>} />
      <Route path="/income-expense" element={<Protected><IncomeExpenseReport /></Protected>} />
      <Route path="/for-wise-case" element={<Protected><ForWiseCaseReport /></Protected>} />
      <Route path="/welcome-screen" element={<Protected><WelcomeScreen /></Protected>} />

      {/* Generic Dynamic Module Route */}
      <Route path="/module/:slug" element={<Protected><ModulePage /></Protected>} />

      {/* Wildcard */}
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  )
}
