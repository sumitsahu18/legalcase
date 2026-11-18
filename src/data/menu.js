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

// GROUP 1 – CASE MANAGEMENT & OPERATIONS
export const CASE_OPERATIONS_MODULES = [
  { slug: 'client-master',                label: 'Client Master',                 icon: UserPlus,         desc: 'Register & edit client details', isMaster: true },
  { slug: 'case-master',                  label: 'Case Master',                   icon: FolderPlus,       desc: 'Register & manage court cases', isMaster: true },
  { slug: 'case-next-entry',             label: 'Case Next Entry',               icon: CalendarClock,    desc: 'Next hearing dates & reminders' },
  { slug: 'client-information',          label: 'Client Information',            icon: Info,             desc: 'Full client profile & ledger view' },
  { slug: 'waiting-list',                 label: 'Waiting List',                  icon: Hourglass,        desc: 'Clients in chamber queue' },
  { slug: 'date-wise-reminders',          label: 'Reminder / Hearing Management', icon: BellRing,         desc: 'Cause list reminders & alerts' },
  { slug: 'case-search-reports',          label: 'Case Search & Reports',         icon: Search,           desc: 'Multi-filter case search & reports' },
  { slug: 'date-wise-case-search',        label: 'Date-Wise Case Search',         icon: FileSpreadsheet,  desc: 'Court schedule & calendar register' },
  { slug: 'extra-brief',                  label: 'Extra Brief (Evidence)',        icon: Scale,            desc: 'Court brief to other advocate' },
  { slug: 'for-wise-case-report',         label: 'For / Purpose Wise Report',     icon: Layers,           desc: 'Case status by hearing purpose' },
  { slug: 'document-upload',              label: 'Document Upload System',        icon: UploadCloud,      desc: 'ID-wise document upload system' },
  { slug: 'welcome-screen',               label: 'Reception Welcome Screen',      icon: Sparkles,         desc: 'Client chamber greeting display' },
]

// GROUP 2 – ACCOUNTS & FINANCIAL MANAGEMENT
export const ACCOUNTS_FINANCIAL_MODULES = [
  { slug: 'client-billing',              label: 'Client Billing',                icon: CreditCard,       desc: 'Record case fee receipts & billing' },
  { slug: 'client-payment',              label: 'Client Payment',                icon: FileText,         desc: 'Date-wise payment history' },
  { slug: 'expense',                     label: 'Expense Management',            icon: TrendingDown,     desc: 'Record office & court expenses' },
  { slug: 'expense-head-master',         label: 'Expense Head Master',           icon: Tags,             desc: 'Expenditure categories & ledger heads' },
  { slug: 'consultancy-fees',            label: 'Consultancy Fees',              icon: BadgeIndianRupee, desc: 'Consultation entries (No Case ID)' },
  { slug: 'due-list',                    label: 'Outstanding Chamber Dues',      icon: AlertTriangle,    desc: 'Cases with pending fee balances' },
  { slug: 'income-expense-report',       label: 'Income & Expense Reports',      icon: ChartPie,         desc: 'Overall financial balance & profit' },
  { slug: 'client-ledger-report',        label: 'Client Ledger',                 icon: BookOpen,         desc: 'Client statement & fee balance' },
  { slug: 'daily-collection-report',     label: 'Daily Collection Report',       icon: Receipt,          desc: 'Day-wise case & consultancy collections' },
  { slug: 'head-wise-expense-report',    label: 'Head Wise Expense Report',      icon: ClipboardList,    desc: 'Categorized expenditure statements' },
]

export const MASTER_ENTRY = CASE_OPERATIONS_MODULES.slice(0, 2)
export const DATA_ENTRY = [
  ...CASE_OPERATIONS_MODULES.slice(2, 6),
  ...ACCOUNTS_FINANCIAL_MODULES.slice(0, 5),
]
export const REPORTS = [
  ...CASE_OPERATIONS_MODULES.slice(6),
  ...ACCOUNTS_FINANCIAL_MODULES.slice(5),
]

export const ALL_MODULES = [
  ...CASE_OPERATIONS_MODULES.map((m) => ({ ...m, group: 'Case Management & Operations' })),
  ...ACCOUNTS_FINANCIAL_MODULES.map((m) => ({ ...m, group: 'Accounts & Financial Management' })),
]

// Indian number format: 22766902 -> 2,27,66,902
export const formatIN = (n) => Number(n || 0).toLocaleString('en-IN')
