import {
  Users, Briefcase, Receipt, Wallet, TrendingDown, BadgeIndianRupee,
  UserPlus, FolderPlus, Tags, CalendarClock, FileText, CreditCard,
  ListPlus, Info, Hourglass, BookOpen, CalendarDays, ChartPie, Sparkles, Layers, ClipboardList,
} from 'lucide-react'

// Advocate / office info (header bar)
export const OFFICE = {
  name: 'ANUPAM MAITY (ADVOCATE)',
  address: 'Talgachhari, PS-Ramnagar, Medinipur East, PIN-721441',
}

// Dashboard summary cards with refined subtle executive color palette:
// - Clients: subtle blue
// - Cases: subtle violet
// - Billing/hearings: subtle slate
// - Payment/completed: subtle green
// - Expense: subtle amber
// - Consultancy/reports: subtle teal
export const STATS = [
  { key: 'clients',     label: 'Total No. of Clients',   value: 3157,     icon: Users,            theme: 'blue',    money: false, trend: '+12 this month' },
  { key: 'cases',       label: 'Total No. of Cases',     value: 3188,     icon: Briefcase,        theme: 'violet',  money: false, trend: '+18 this month' },
  { key: 'billing',     label: 'Total Billing',          value: 22766902, icon: Receipt,          theme: 'slate',   money: true,  trend: 'All time' },
  { key: 'payment',     label: 'Total Payment',          value: 21375009, icon: Wallet,           theme: 'green',   money: true,  trend: '93.9% collected' },
  { key: 'expense',     label: 'Total Expense',          value: 21412169, icon: TrendingDown,     theme: 'amber',   money: true,  trend: 'All heads' },
  { key: 'consultancy', label: 'Total Consultancy Fees', value: 38827,    icon: BadgeIndianRupee, theme: 'teal',    money: true,  trend: 'Direct fees' },
]

export const MASTER_ENTRY = [
  { slug: 'client-master',       label: 'Client Master',       icon: UserPlus,   desc: 'Add / edit client details' },
  { slug: 'case-master',         label: 'Case Master',         icon: FolderPlus, desc: 'Register & manage cases' },
  { slug: 'expense-head-master', label: 'Expense Head Master', icon: Tags,       desc: 'Expense categories' },
]

export const DATA_ENTRY = [
  { slug: 'case-next-entry',    label: 'Case Next Entry',    icon: CalendarClock, desc: 'Next hearing date entry' },
  { slug: 'client-billing',     label: 'Client Billing',     icon: FileText,      desc: 'Generate client bills' },
  { slug: 'client-payment',     label: 'Client Payment',     icon: CreditCard,    desc: 'Record received payments' },
  { slug: 'expense',            label: 'Expense',            icon: TrendingDown,  desc: 'Add office / case expense' },
  { slug: 'add-waiting-list',   label: 'Add Waiting List',   icon: ListPlus,      desc: 'Clients in waiting queue' },
  { slug: 'client-information', label: 'Client Information', icon: Info,          desc: 'Full client profile view' },
]

export const REPORTS = [
  { slug: 'client-ledger-report',         label: 'Client Ledger Report',         icon: BookOpen,      desc: 'Client statements & balances' },
  { slug: 'date-wise-case-list-report',   label: 'Date Wise Case List Report',   icon: CalendarDays,  desc: 'Hearing schedule by date' },
  { slug: 'income-expense-report',        label: 'Income & Expense Report',      icon: ChartPie,      desc: 'Financial balance & profit' },
  { slug: 'for-wise-case-report',         label: 'For Wise Case Report',         icon: Layers,        desc: 'Case status by category' },
  { slug: 'waiting-list',                 label: 'Waiting List',                 icon: Hourglass,     desc: 'Upcoming appointments' },
  { slug: 'welcome-screen',               label: 'Welcome Screen',               icon: Sparkles,      desc: 'Client reception greeting' },
  { slug: 'head-wise-expense-report',     label: 'Head Wise Expense Report',     icon: ClipboardList, desc: 'Categorized expenditure' },
]

export const ALL_MODULES = [
  ...MASTER_ENTRY.map((m) => ({ ...m, group: 'Master Entry' })),
  ...DATA_ENTRY.map((m) => ({ ...m, group: 'Data Entry' })),
  ...REPORTS.map((m) => ({ ...m, group: 'Reports' })),
]

// Indian number format: 22766902 -> 2,27,66,902
export const formatIN = (n) => Number(n).toLocaleString('en-IN')
