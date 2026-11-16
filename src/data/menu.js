import {
  Users, Briefcase, Receipt, Wallet, TrendingDown, BadgeIndianRupee,
  UserPlus, FolderPlus, Tags, CalendarClock, FileText, CreditCard,
  ListPlus, Info, Hourglass, BookOpen, CalendarDays, ChartPie, Sparkles, Layers, ClipboardList,
  Search, AlertTriangle, UploadCloud, BellRing, Scale, FileSpreadsheet
} from 'lucide-react'

// Advocate / office info (header bar)
export const OFFICE = {
  name: 'ANUPAM MAITY (ADVOCATE)',
  address: 'Talgachhari, PS-Ramnagar, Medinipur East, PIN-721441',
  phone: '9832104512',
  chamber: 'Contai Court Chambers & Ramnagar Office',
}

// Dashboard summary cards with refined subtle executive color palette
export const STATS = [
  { key: 'clients',     label: 'Total No. of Clients',   value: 3157,     icon: Users,            theme: 'blue',    money: false, trend: '+12 this month' },
  { key: 'cases',       label: 'Total No. of Cases',     value: 3188,     icon: Briefcase,        theme: 'violet',  money: false, trend: '+18 this month' },
  { key: 'billing',     label: 'Total Billing',          value: 22766902, icon: Receipt,          theme: 'slate',   money: true,  trend: 'All time' },
  { key: 'payment',     label: 'Total Payment',          value: 21375009, icon: Wallet,           theme: 'green',   money: true,  trend: '93.9% collected' },
  { key: 'expense',     label: 'Total Expense',          value: 21412169, icon: TrendingDown,     theme: 'amber',   money: true,  trend: 'All heads' },
  { key: 'consultancy', label: 'Total Consultancy Fees', value: 38827,    icon: BadgeIndianRupee, theme: 'teal',    money: true,  trend: 'Direct consultation' },
]

export const MASTER_ENTRY = [
  { slug: 'client-master',       label: 'Client Master',       icon: UserPlus,   desc: 'Register & edit client details' },
  { slug: 'case-master',         label: 'Case Master',         icon: FolderPlus, desc: 'Register & manage court cases' },
  { slug: 'expense-head-master', label: 'Expense Head Master', icon: Tags,       desc: 'Expenditure categories & ledger heads' },
  { slug: 'extra-brief',         label: 'Extra Brief (Evidence)', icon: Scale,   desc: 'Court brief to other advocate with/without ID' },
]

export const DATA_ENTRY = [
  { slug: 'case-next-entry',    label: 'Case Next Entry',    icon: CalendarClock, desc: 'Next hearing dates & reminders' },
  { slug: 'client-billing',     label: 'Case Payment Entry', icon: CreditCard,    desc: 'Record case fee receipts & dues' },
  { slug: 'client-payment',     label: 'Date-Wise Payments', icon: FileText,      desc: 'PDF format date-wise payments' },
  { slug: 'consultancy-fees',   label: 'Consultancy Fees',   icon: BadgeIndianRupee, desc: 'Consultation entries (No Case ID)' },
  { slug: 'document-upload',    label: 'Document Upload',    icon: UploadCloud,   desc: 'ID-wise document upload system' },
  { slug: 'expense',            label: 'Expense Entry',      icon: TrendingDown,  desc: 'Record office & court expenses' },
  { slug: 'add-waiting-list',   label: 'Add Waiting List',   icon: ListPlus,      desc: 'Clients in chamber queue' },
  { slug: 'client-information', label: 'Client Profile',     icon: Info,          desc: 'Full client profile & ledger view' },
]

export const REPORTS = [
  { slug: 'case-search-reports',          label: 'Case Search & Reports',        icon: Search,        desc: 'Multi-filter case search & reports' },
  { slug: 'date-wise-case-search',        label: 'Date-Wise Case Search (PDF)',  icon: FileSpreadsheet, desc: 'PDF format date-wise court schedule' },
  { slug: 'due-list',                     label: 'Outstanding Due List',         icon: AlertTriangle, desc: 'Clients & cases with pending dues' },
  { slug: 'daily-collection-report',      label: 'Daily Collection Report',      icon: Receipt,       desc: 'Day-wise case & consultancy collections' },
  { slug: 'date-wise-reminders',          label: 'Date-Wise Reminders (PDF)',    icon: BellRing,      desc: 'Client reminders for Anupam Maity' },
  { slug: 'head-wise-expense-report',     label: 'Head Wise Expense Report',     icon: ClipboardList, desc: 'Categorized expenditure statements' },
  { slug: 'client-ledger-report',         label: 'Client Ledger Report',         icon: BookOpen,      desc: 'Client statement & fee balance' },
  { slug: 'date-wise-case-list-report',   label: 'Hearing Schedule Cause List',  icon: CalendarDays,  desc: 'Court cause list by hearing date' },
  { slug: 'income-expense-report',        label: 'Income & Expense Statement',   icon: ChartPie,      desc: 'Overall financial balance & profit' },
  { slug: 'for-wise-case-report',         label: 'For / Purpose Wise Report',    icon: Layers,        desc: 'Case status by hearing purpose' },
  { slug: 'waiting-list',                 label: 'Waiting List Appointments',    icon: Hourglass,     desc: 'Upcoming client chamber queue' },
  { slug: 'welcome-screen',               label: 'Reception Welcome Screen',     icon: Sparkles,      desc: 'Client chamber greeting display' },
]

export const ALL_MODULES = [
  ...MASTER_ENTRY.map((m) => ({ ...m, group: 'Master Entry' })),
  ...DATA_ENTRY.map((m) => ({ ...m, group: 'Data Entry' })),
  ...REPORTS.map((m) => ({ ...m, group: 'Reports' })),
]

// Indian number format: 22766902 -> 2,27,66,902
export const formatIN = (n) => Number(n || 0).toLocaleString('en-IN')
