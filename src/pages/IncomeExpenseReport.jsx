import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChartPie, ArrowLeft, ChevronRight, Printer, Download,
  TrendingDown, TrendingUp, IndianRupee, Layers, Calendar
} from 'lucide-react'
import Topbar from '../components/Topbar.jsx'
import { OFFICE } from '../data/menu.js'
import {
  getCases, getPayments, getExpenses, getConsultancyFees,
  getExpenseHeadWiseSummary, onStorageUpdate
} from '../services/storageService.js'
import './management.css'

export default function IncomeExpenseReport() {
  const navigate = useNavigate()
  const [payments, setPayments] = useState(() => getPayments())
  const [expenses, setExpenses] = useState(() => getExpenses())
  const [consultancy, setConsultancy] = useState(() => getConsultancyFees())
  const [headSummary, setHeadSummary] = useState(() => getExpenseHeadWiseSummary())

  useEffect(() => {
    return onStorageUpdate(() => {
      setPayments(getPayments())
      setExpenses(getExpenses())
      setConsultancy(getConsultancyFees())
      setHeadSummary(getExpenseHeadWiseSummary())
    })
  }, [])

  const totalLitigationIncome = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0)
  const totalConsultancyIncome = consultancy.reduce((acc, c) => acc + Number(c.amount || 0), 0)
  const totalGrossIncome = totalLitigationIncome + totalConsultancyIncome
  const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0)
  const netPracticeSurplus = totalGrossIncome - totalExpenses

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
                  <span className="tag-violet">Practice Financial Intelligence</span>
                  <span className="tag-muted">Audited Balance Sheet</span>
                </div>
                <h1 className="mgmt-title">Income &amp; Expenditure Statement</h1>
                <p className="mgmt-desc">Chambers revenue overview comparing case fee receipts, consultancy earnings &amp; categorized disbursements</p>
              </div>
            </div>
            <div className="mgmt-header-actions">
              <button className="btn-secondary" onClick={() => window.print()}>
                <Printer size={14} />
                <span>Print Statement</span>
              </button>
              <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
                <ArrowLeft size={14} />
                <span>Dashboard</span>
              </button>
            </div>
          </div>

          {/* 4 Financial KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            <div className="panel" style={{ padding: '16px', background: '#ffffff', borderRadius: '8px', borderLeft: '4px solid #16a34a' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px', color: '#64748b', fontWeight: '700' }}>Gross Practice Revenue</span>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#16a34a', marginTop: '4px' }}>
                ₹{Number(totalGrossIncome).toLocaleString('en-IN')}
              </div>
              <small style={{ color: '#64748b', fontSize: '11px' }}>Litigation fees + direct consultancy</small>
            </div>

            <div className="panel" style={{ padding: '16px', background: '#ffffff', borderRadius: '8px', borderLeft: '4px solid #2563eb' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px', color: '#64748b', fontWeight: '700' }}>Direct Consultancy</span>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#1d4ed8', marginTop: '4px' }}>
                ₹{Number(totalConsultancyIncome).toLocaleString('en-IN')}
              </div>
              <small style={{ color: '#64748b', fontSize: '11px' }}>{consultancy.length} direct advice records</small>
            </div>

            <div className="panel" style={{ padding: '16px', background: '#ffffff', borderRadius: '8px', borderLeft: '4px solid #dc2626' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px', color: '#64748b', fontWeight: '700' }}>Total Expenditure</span>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#dc2626', marginTop: '4px' }}>
                ₹{Number(totalExpenses).toLocaleString('en-IN')}
              </div>
              <small style={{ color: '#64748b', fontSize: '11px' }}>Across {headSummary.length} expense categories</small>
            </div>

            <div className="panel" style={{ padding: '16px', background: '#ffffff', borderRadius: '8px', borderLeft: '4px solid #7c3aed' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px', color: '#64748b', fontWeight: '700' }}>Net Practice Surplus</span>
              <div style={{ fontSize: '24px', fontWeight: '800', color: netPracticeSurplus >= 0 ? '#7c3aed' : '#dc2626', marginTop: '4px' }}>
                ₹{Number(netPracticeSurplus).toLocaleString('en-IN')}
              </div>
              <small style={{ color: '#64748b', fontSize: '11px' }}>Operating balance after expenses</small>
            </div>
          </div>

          {/* Two Columns: Revenue Breakdown vs Expenditure Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
            {/* Revenue Column */}
            <div className="panel" style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div className="panel-card-head">
                <div className="pch-title">
                  <span className="pch-dot" style={{ background: '#16a34a' }} />
                  <h3>Chambers Inflow / Receipts</h3>
                </div>
                <span className="panel-count">Total: ₹{totalGrossIncome.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ padding: '16px' }}>
                <table className="mgmt-table">
                  <thead>
                    <tr>
                      <th>REVENUE STREAM</th>
                      <th style={{ width: '80px', textAlign: 'center' }}>ENTRIES</th>
                      <th style={{ width: '130px', textAlign: 'right' }}>AMOUNT (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <strong>Court Case Litigation Fees</strong>
                        <small className="muted-subtext">Retainer advances, appearance &amp; hearing fees</small>
                      </td>
                      <td style={{ textAlign: 'center' }}>{payments.length}</td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: '#16a34a' }}>
                        ₹{totalLitigationIncome.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Chamber Consultancy Fees</strong>
                        <small className="muted-subtext">Legal opinions &amp; pre-litigation scrutiny</small>
                      </td>
                      <td style={{ textAlign: 'center' }}>{consultancy.length}</td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: '#0d9488' }}>
                        ₹{totalConsultancyIncome.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f8fafc', fontWeight: '800' }}>
                      <td>TOTAL REVENUE:</td>
                      <td style={{ textAlign: 'center' }}>{payments.length + consultancy.length}</td>
                      <td style={{ textAlign: 'right', color: '#16a34a', fontSize: '15px' }}>
                        ₹{totalGrossIncome.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Expenses Column */}
            <div className="panel" style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div className="panel-card-head">
                <div className="pch-title">
                  <span className="pch-dot" style={{ background: '#dc2626' }} />
                  <h3>Head-Wise Expenditure Outflow</h3>
                </div>
                <span className="panel-count">Total: ₹{totalExpenses.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ padding: '16px' }}>
                <table className="mgmt-table">
                  <thead>
                    <tr>
                      <th>EXPENSE CATEGORY</th>
                      <th style={{ width: '80px', textAlign: 'center' }}>VOUCHERS</th>
                      <th style={{ width: '130px', textAlign: 'right' }}>AMOUNT (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {headSummary.map((h) => (
                      <tr key={h.id}>
                        <td>
                          <strong>{h.name}</strong>
                          <small className="muted-subtext">{h.id}</small>
                        </td>
                        <td style={{ textAlign: 'center' }}>{h.count}</td>
                        <td style={{ textAlign: 'right', fontWeight: '700', color: '#d97706' }}>
                          ₹{Number(h.total).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f8fafc', fontWeight: '800' }}>
                      <td>TOTAL EXPENDITURE:</td>
                      <td style={{ textAlign: 'center' }}>{expenses.length}</td>
                      <td style={{ textAlign: 'right', color: '#dc2626', fontSize: '15px' }}>
                        ₹{totalExpenses.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
