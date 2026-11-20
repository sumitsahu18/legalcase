import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChartPie, ArrowLeft, ChevronRight, Printer, Download,
  RotateCcw, Search, AlertCircle, TrendingUp, TrendingDown, IndianRupee
} from 'lucide-react'
import Topbar from '../components/Topbar.jsx'
import { OFFICE } from '../data/menu.js'
import {
  getPayments, getExpenses, getConsultancyFees, onStorageUpdate
} from '../services/storageService.js'
import './management.css'

export default function IncomeExpenseReport() {
  const navigate = useNavigate()
  const [payments, setPayments] = useState(() => getPayments())
  const [expenses, setExpenses] = useState(() => getExpenses())
  const [consultancy, setConsultancy] = useState(() => getConsultancyFees())

  // Date filters
  const [fromDate, setFromDate] = useState('2026-11-15')
  const [toDate, setToDate] = useState('2026-11-20')
  const [appliedFrom, setAppliedFrom] = useState('2026-11-15')
  const [appliedTo, setAppliedTo] = useState('2026-11-20')
  const [dateError, setDateError] = useState('')

  useEffect(() => {
    return onStorageUpdate(() => {
      setPayments(getPayments())
      setExpenses(getExpenses())
      setConsultancy(getConsultancyFees())
    })
  }, [])

  // Consolidate Income Entries: Payments Received + Consultancy Fees
  const allIncomeEntries = useMemo(() => {
    const list = []

    // 1. Fee Payments from court cases
    payments.forEach((p) => {
      let displayName = p.clientName || 'CLIENT'
      if (p.caseId && !displayName.includes(p.caseId)) {
        displayName = `${displayName} (${p.caseId})`
      }
      if (p.remarks && !displayName.includes(p.remarks)) {
        displayName = `${displayName} - ${p.remarks}`
      }
      list.push({
        id: `pay-${p.id}`,
        date: p.paymentDate || '',
        clientName: displayName.toUpperCase(),
        amount: Number(p.amount || 0),
        source: 'Litigation Payment',
      })
    })

    // 2. Chamber Consultancy Fees
    consultancy.forEach((c) => {
      const displayName = c.clientName ? `${c.clientName} (CONSULTANCY)` : 'CONSULTANCY'
      list.push({
        id: `con-${c.id}`,
        date: c.date || '',
        clientName: displayName.toUpperCase(),
        amount: Number(c.amount || 0),
        source: 'Chamber Consultancy',
      })
    })

    return list.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }, [payments, consultancy])

  // Consolidate Expense Entries
  const allExpenseEntries = useMemo(() => {
    return expenses.map((e) => ({
      id: `exp-${e.id}`,
      date: e.date || '',
      paidTo: (e.paidTo || e.head || e.category || 'EXPENSE').toUpperCase(),
      amount: Number(e.amount || 0),
      remarks: e.remarks || '',
    })).sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }, [expenses])

  // Apply Date Range Filter
  const filteredIncome = useMemo(() => {
    return allIncomeEntries.filter((item) => {
      if (appliedFrom && item.date && item.date < appliedFrom) return false
      if (appliedTo && item.date && item.date > appliedTo) return false
      return true
    })
  }, [allIncomeEntries, appliedFrom, appliedTo])

  const filteredExpenses = useMemo(() => {
    return allExpenseEntries.filter((item) => {
      if (appliedFrom && item.date && item.date < appliedFrom) return false
      if (appliedTo && item.date && item.date > appliedTo) return false
      return true
    })
  }, [allExpenseEntries, appliedFrom, appliedTo])

  const totalIncome = filteredIncome.reduce((acc, item) => acc + item.amount, 0)
  const totalExpense = filteredExpenses.reduce((acc, item) => acc + item.amount, 0)
  const netProfit = totalIncome - totalExpense

  const handleApplyFilter = (e) => {
    if (e) e.preventDefault()
    if (fromDate && toDate && fromDate > toDate) {
      setDateError('From Date cannot be later than To Date.')
      return
    }
    setDateError('')
    setAppliedFrom(fromDate)
    setAppliedTo(toDate)
  }

  const handleClear = () => {
    setFromDate('')
    setToDate('')
    setAppliedFrom('')
    setAppliedTo('')
    setDateError('')
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportCSV = () => {
    const rows = [
      ['INCOME & EXPENSE STATEMENT', `From: ${appliedFrom || 'All'}`, `To: ${appliedTo || 'All'}`],
      [],
      ['INCOME', '', '', 'EXPENSES', '', ''],
      ['Date', 'Client Name', 'Amount', 'Date', 'Paid To', 'Amount']
    ]

    const maxLen = Math.max(filteredIncome.length, filteredExpenses.length)
    for (let i = 0; i < maxLen; i++) {
      const inc = filteredIncome[i] || {}
      const exp = filteredExpenses[i] || {}
      rows.push([
        inc.date || '',
        `"${inc.clientName || ''}"`,
        inc.amount || '',
        exp.date || '',
        `"${exp.paidTo || ''}"`,
        exp.amount || ''
      ])
    }

    rows.push([])
    rows.push(['Total Income', totalIncome, '', 'Total Expense', totalExpense, `Profit: ${netProfit}`])

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((r) => r.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Income_Expense_Statement_${appliedFrom || 'Start'}_to_${appliedTo || 'End'}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="app-shell">
      <div className="app-main">
        <Topbar />

        <main className="dash mgmt-page">
          <div className="crumbs">
            <button className="crumbs-link" onClick={() => navigate('/dashboard')}>
              <ArrowLeft size={13} />
              <span>Dashboard</span>
            </button>
            <ChevronRight size={12} className="crumbs-sep" />
            <span className="crumbs-muted">Reports</span>
            <ChevronRight size={12} className="crumbs-sep" />
            <b className="crumbs-active">Income &amp; Expense Statement</b>
          </div>

          <div className="mgmt-header">
            <div className="mgmt-header-left">
              <span className="mgmt-icon-badge" style={{ background: '#ede9fe', color: '#7c3aed', border: '1px solid #ddd6fe' }}>
                <ChartPie size={20} strokeWidth={2.2} />
              </span>
              <div>
                <div className="mgmt-tag-row">
                  <span className="tag-violet">Practice Financial Balance</span>
                  <span className="tag-muted">Income &amp; Expense Report</span>
                </div>
                <h1 className="mgmt-title">Income &amp; Expense Statement</h1>
                <p className="mgmt-desc">Side-by-side statement of chambers collections vs operating disbursements and net profit</p>
              </div>
            </div>
            <div className="mgmt-header-actions">
              <button className="btn-secondary" onClick={handleExportCSV}>
                <Download size={14} />
                <span>Export CSV</span>
              </button>
              <button className="btn-secondary" onClick={handlePrint}>
                <Printer size={14} />
                <span>Print Statement</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TOP DATE FILTER BAR (MATCHES REFERENCE SCREENSHOT EXACTLY)                 */}
          {/* ========================================================================= */}
          <div
            className="panel"
            style={{
              background: '#f8fafc',
              border: '1.5px solid #0f172a',
              borderRadius: '6px',
              padding: '12px 18px',
              marginBottom: '16px',
            }}
          >
            <form onSubmit={handleApplyFilter} style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
              {/* From Date: [date] */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontStyle: 'italic', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap' }}>
                  From Date:
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value)
                    if (dateError) setDateError('')
                  }}
                  style={{
                    padding: '5px 10px',
                    border: '1.5px solid #0f172a',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: '600',
                    background: '#ffffff',
                    color: '#0f172a'
                  }}
                />
              </div>

              {/* From To: [date] */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontStyle: 'italic', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap' }}>
                  From To:
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value)
                    if (dateError) setDateError('')
                  }}
                  style={{
                    padding: '5px 10px',
                    border: '1.5px solid #0f172a',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: '600',
                    background: '#ffffff',
                    color: '#0f172a'
                  }}
                />
              </div>

              {/* [Search] Button */}
              <button
                type="submit"
                style={{
                  padding: '5px 16px',
                  background: '#ffffff',
                  border: '1.5px solid #0f172a',
                  borderRadius: '4px',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: '1px 1px 0px #0f172a'
                }}
              >
                Search
              </button>

              {/* [Clear] Button */}
              <button
                type="button"
                onClick={handleClear}
                style={{
                  padding: '5px 12px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                Show All
              </button>

              <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#64748b' }}>
                Active Range: <b>{appliedFrom || 'All'}</b> to <b>{appliedTo || 'All'}</b>
              </div>
            </form>

            {dateError && (
              <div style={{ marginTop: '8px', color: '#dc2626', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={14} />
                <span>{dateError}</span>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* TWO SIDE-BY-SIDE TABLES (MATCHES REFERENCE SCREENSHOT EXACTLY)             */}
          {/* ========================================================================= */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
              gap: '16px',
              marginBottom: '16px',
            }}
          >
            {/* ----------------------------------------------------------------------- */}
            {/* LEFT TABLE: INCOME                                                      */}
            {/* ----------------------------------------------------------------------- */}
            <div
              style={{
                background: '#ffffff',
                border: '1.5px solid #0f172a',
                borderRadius: '4px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
              }}
            >
              {/* Header Row */}
              <div style={{ borderBottom: '1.5px solid #0f172a', background: '#ffffff' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #0f172a' }}>
                      <th style={{ textAlign: 'left', padding: '8px 10px', width: '105px', fontStyle: 'italic', fontWeight: '800', color: '#0f172a' }}>
                        DATE
                      </th>
                      <th style={{ textAlign: 'left', padding: '8px 10px', fontStyle: 'italic', fontWeight: '800', color: '#0f172a' }}>
                        CLIENT NAME
                      </th>
                      <th style={{ textAlign: 'right', padding: '8px 10px', width: '110px', fontStyle: 'italic', fontWeight: '800', color: '#0f172a' }}>
                        AMOUNT
                      </th>
                    </tr>
                  </thead>
                </table>
              </div>

              {/* Scrollable Rows */}
              <div
                style={{
                  minHeight: '280px',
                  maxHeight: '420px',
                  overflowY: 'auto',
                  background: '#94a3b8',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', background: '#ffffff' }}>
                  <tbody>
                    {filteredIncome.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
                          No income receipts in this date range.
                        </td>
                      </tr>
                    ) : (
                      filteredIncome.map((item, idx) => (
                        <tr
                          key={item.id || idx}
                          style={{
                            borderBottom: '1px solid #e2e8f0',
                            background: idx % 2 === 0 ? '#ffffff' : '#f8fafc'
                          }}
                        >
                          <td style={{ padding: '8px 10px', width: '105px', color: '#0f172a', fontWeight: '500' }}>
                            {item.date}
                          </td>
                          <td style={{ padding: '8px 10px', color: '#1e293b', fontStyle: 'italic', textTransform: 'uppercase' }}>
                            {item.clientName}
                          </td>
                          <td style={{ padding: '8px 10px', width: '110px', textAlign: 'right', fontWeight: '700', color: '#16a34a' }}>
                            {item.amount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <div style={{ flex: 1, minHeight: '60px', background: '#94a3b8' }} />
              </div>

              {/* Bottom: Total Income Box */}
              <div
                style={{
                  padding: '10px 14px',
                  background: '#f8fafc',
                  borderTop: '1.5px solid #0f172a',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '13px', fontStyle: 'italic', fontWeight: '700', color: '#0f172a' }}>
                  Total Income:
                </span>
                <div
                  style={{
                    border: '1.5px solid #0f172a',
                    padding: '4px 16px',
                    fontSize: '14px',
                    fontWeight: '800',
                    background: '#ffffff',
                    color: '#0f172a',
                    minWidth: '100px',
                    textAlign: 'right'
                  }}
                >
                  {totalIncome.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* ----------------------------------------------------------------------- */}
            {/* RIGHT TABLE: EXPENSES                                                   */}
            {/* ----------------------------------------------------------------------- */}
            <div
              style={{
                background: '#ffffff',
                border: '1.5px solid #0f172a',
                borderRadius: '4px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
              }}
            >
              {/* Header Row */}
              <div style={{ borderBottom: '1.5px solid #0f172a', background: '#ffffff' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #0f172a' }}>
                      <th style={{ textAlign: 'left', padding: '8px 10px', width: '105px', fontStyle: 'italic', fontWeight: '800', color: '#0f172a' }}>
                        DATE
                      </th>
                      <th style={{ textAlign: 'left', padding: '8px 10px', fontStyle: 'italic', fontWeight: '800', color: '#0f172a' }}>
                        PAID TO
                      </th>
                      <th style={{ textAlign: 'right', padding: '8px 10px', width: '110px', fontStyle: 'italic', fontWeight: '800', color: '#0f172a' }}>
                        AMOUNT
                      </th>
                    </tr>
                  </thead>
                </table>
              </div>

              {/* Scrollable Rows */}
              <div
                style={{
                  minHeight: '280px',
                  maxHeight: '420px',
                  overflowY: 'auto',
                  background: '#94a3b8',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', background: '#ffffff' }}>
                  <tbody>
                    {filteredExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
                          No expenses recorded in this date range.
                        </td>
                      </tr>
                    ) : (
                      filteredExpenses.map((exp, idx) => (
                        <tr
                          key={exp.id || idx}
                          style={{
                            borderBottom: '1px solid #e2e8f0',
                            background: idx % 2 === 0 ? '#ffffff' : '#f8fafc'
                          }}
                        >
                          <td style={{ padding: '8px 10px', width: '105px', color: '#0f172a', fontWeight: '500' }}>
                            {exp.date}
                          </td>
                          <td style={{ padding: '8px 10px', color: '#1e293b', fontStyle: 'italic', textTransform: 'uppercase' }}>
                            {exp.paidTo}
                          </td>
                          <td style={{ padding: '8px 10px', width: '110px', textAlign: 'right', fontWeight: '700', color: '#dc2626' }}>
                            {exp.amount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <div style={{ flex: 1, minHeight: '60px', background: '#94a3b8' }} />
              </div>

              {/* Bottom: Total Expense & Profit (Exact Layout from Screenshot) */}
              <div
                style={{
                  padding: '10px 14px',
                  background: '#f8fafc',
                  borderTop: '1.5px solid #0f172a',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '6px'
                }}
              >
                {/* Total Expense: [ 9700 ] */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontStyle: 'italic', fontWeight: '700', color: '#0f172a' }}>
                    Total Expense:
                  </span>
                  <div
                    style={{
                      border: '1.5px solid #0f172a',
                      padding: '4px 16px',
                      fontSize: '14px',
                      fontWeight: '800',
                      background: '#ffffff',
                      color: '#0f172a',
                      minWidth: '100px',
                      textAlign: 'right'
                    }}
                  >
                    {totalExpense.toLocaleString('en-IN')}
                  </div>
                </div>

                {/* Profit: [ 11187 ] */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontStyle: 'italic', fontWeight: '700', color: '#0f172a' }}>
                    Profit:
                  </span>
                  <div
                    style={{
                      border: '1.5px solid #0f172a',
                      padding: '4px 16px',
                      fontSize: '14px',
                      fontWeight: '800',
                      background: '#ffffff',
                      color: netProfit >= 0 ? '#15803d' : '#dc2626',
                      minWidth: '100px',
                      textAlign: 'right'
                    }}
                  >
                    {netProfit.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b' }}>
            <span>
              <strong>{OFFICE.name}</strong> · {OFFICE.address}
            </span>
            <span>
              Official Balance Sheet Statement
            </span>
          </div>
        </main>
      </div>
    </div>
  )
}
