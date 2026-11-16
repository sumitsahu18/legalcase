import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Receipt, Calendar, Printer, Download, ArrowLeft, ChevronRight,
  IndianRupee, CreditCard, BadgeIndianRupee, AlertCircle, FileSpreadsheet,
  CheckCircle2, Clock
} from 'lucide-react'
import Topbar from '../components/Topbar.jsx'
import { OFFICE } from '../data/menu.js'
import { getDailyCollection, onStorageUpdate } from '../services/storageService.js'
import './management.css'

export default function DailyCollectionReport() {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [collectionData, setCollectionData] = useState(() => getDailyCollection(new Date().toISOString().split('T')[0]))

  useEffect(() => {
    return onStorageUpdate(() => {
      setCollectionData(getDailyCollection(selectedDate))
    })
  }, [selectedDate])

  const handleDateChange = (e) => {
    const d = e.target.value
    setSelectedDate(d)
    setCollectionData(getDailyCollection(d))
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportCSV = () => {
    const headers = ['Time', 'Receipt / Ref ID', 'Category', 'Client Name', 'Payment Mode', 'Amount (INR)', 'Remarks']
    const rows = collectionData.rows.map((r) => [
      r.time,
      `"${r.refId}"`,
      `"${r.type}"`,
      `"${r.clientName}"`,
      `"${r.mode}"`,
      r.amount,
      `"${r.remarks || ''}"`,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Daily_Collection_Report_${selectedDate}.csv`)
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
            <b className="crumbs-active">Daily Collection Report</b>
          </div>

          <div className="mgmt-header">
            <div className="mgmt-header-left">
              <span className="mgmt-icon-badge" style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                <Receipt size={20} strokeWidth={2.2} />
              </span>
              <div>
                <div className="mgmt-tag-row">
                  <span className="tag-blue">Module 6: Daily Chambers Financial Audit</span>
                  <span className="tag-muted">{collectionData.count} Collections on {selectedDate}</span>
                </div>
                <h1 className="mgmt-title">Daily Collection Statement &amp; Report</h1>
                <p className="mgmt-desc">Unified daily audit aggregating case fee installments and direct consultancy fees</p>
              </div>
            </div>
            <div className="mgmt-header-actions">
              <button className="btn-secondary" onClick={handleExportCSV}>
                <Download size={14} />
                <span>Export CSV</span>
              </button>
              <button className="btn-secondary" onClick={handlePrint}>
                <Printer size={14} />
                <span>Print Daily Statement</span>
              </button>
              <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
                <ArrowLeft size={14} />
                <span>Dashboard</span>
              </button>
            </div>
          </div>

          {/* Date Picker Bar */}
          <div className="panel" style={{ padding: '14px 18px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={18} color="#2563eb" />
              <label style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>Select Collection Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="form-input"
                style={{ width: '180px', fontWeight: '600' }}
              />
            </div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              Viewing collection statement for <strong>{new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>
            </div>
          </div>

          {/* 3 Summary Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            <div className="panel" style={{ padding: '14px 18px', background: '#ffffff', borderRadius: '8px', borderLeft: '4px solid #16a34a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px', color: '#64748b', fontWeight: '700' }}>Grand Total Collection</span>
                <IndianRupee size={16} color="#16a34a" />
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#16a34a', marginTop: '4px' }}>
                ₹{Number(collectionData.grandTotal).toLocaleString('en-IN')}
              </div>
              <small style={{ color: '#64748b', fontSize: '11px' }}>Total cash &amp; digital money collected today</small>
            </div>

            <div className="panel" style={{ padding: '14px 18px', background: '#ffffff', borderRadius: '8px', borderLeft: '4px solid #2563eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px', color: '#64748b', fontWeight: '700' }}>Case Litigation Payments</span>
                <CreditCard size={16} color="#2563eb" />
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#1d4ed8', marginTop: '4px' }}>
                ₹{Number(collectionData.totalCasePayments).toLocaleString('en-IN')}
              </div>
              <small style={{ color: '#64748b', fontSize: '11px' }}>Court case installments &amp; retainer advances</small>
            </div>

            <div className="panel" style={{ padding: '14px 18px', background: '#ffffff', borderRadius: '8px', borderLeft: '4px solid #0d9488' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px', color: '#64748b', fontWeight: '700' }}>Direct Consultancy Fees</span>
                <BadgeIndianRupee size={16} color="#0d9488" />
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f766e', marginTop: '4px' }}>
                ₹{Number(collectionData.totalConsultancy).toLocaleString('en-IN')}
              </div>
              <small style={{ color: '#64748b', fontSize: '11px' }}>One-off legal advice &amp; opinion fees (No Case ID)</small>
            </div>
          </div>

          {/* Collection Table */}
          <div className="panel" style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div className="panel-card-head">
              <div className="pch-title">
                <span className="pch-dot pch-blue" />
                <h3>Transactions Collected on {selectedDate}</h3>
              </div>
              <span className="panel-count">{collectionData.count} Collected Items</span>
            </div>

            <div className="table-scroll-container">
              <table className="mgmt-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>TIME</th>
                    <th style={{ width: '130px' }}>CATEGORY / TYPE</th>
                    <th style={{ width: '120px' }}>CASE ID / REF</th>
                    <th>CLIENT NAME</th>
                    <th style={{ width: '85px' }}>T.C.C / ID</th>
                    <th style={{ width: '100px' }}>PAY MODE</th>
                    <th style={{ width: '110px', textAlign: 'right' }}>COLLECTED (₹)</th>
                    <th>REMARKS</th>
                  </tr>
                </thead>
                <tbody>
                  {collectionData.rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="empty-table-cell">
                        <AlertCircle size={20} className="empty-ic" />
                        <span>No payments or consultancy fees recorded on {selectedDate}.</span>
                      </td>
                    </tr>
                  ) : (
                    collectionData.rows.map((row, idx) => (
                      <tr key={`${row.id}-${idx}`}>
                        <td>
                          <span style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Clock size={11} /> {row.time}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${row.type === 'Case Payment' ? 'editing' : 'creating'}`}>
                            {row.type}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: '700', fontSize: '12px', color: row.type === 'Case Payment' ? '#7c3aed' : '#0d9488' }}>
                            {row.refId}
                          </span>
                        </td>
                        <td>
                          <strong className="primary-text">{row.clientName}</strong>
                        </td>
                        <td>
                          <span style={{ fontSize: '11px', color: '#475569' }}>{row.tcc !== '—' ? row.tcc : row.idNumber}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', fontWeight: '500', color: '#334155' }}>{row.mode}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span style={{ color: '#16a34a', fontWeight: '800', fontSize: '14px' }}>
                            ₹{Number(row.amount).toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>{row.remarks}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {collectionData.rows.length > 0 && (
                  <tfoot>
                    <tr style={{ background: '#f8fafc', fontWeight: '800' }}>
                      <td colSpan={6} style={{ textAlign: 'right', padding: '12px 14px' }}>
                        DAILY GRAND TOTAL COLLECTED:
                      </td>
                      <td style={{ textAlign: 'right', padding: '12px 14px', color: '#16a34a', fontSize: '16px' }}>
                        ₹{Number(collectionData.grandTotal).toLocaleString('en-IN')}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Printable Daily Audit Docket */}
          <div className="printable-docket">
            <div className="print-header">
              <div className="print-chambers">
                <h2>{OFFICE.name}</h2>
                <p className="print-address">{OFFICE.address}</p>
                <p className="print-title">OFFICIAL DAILY CASH &amp; BANK COLLECTION AUDIT</p>
              </div>
              <div className="print-meta">
                <div><b>Audit Date:</b> {selectedDate}</div>
                <div><b>Total Collected:</b> ₹{Number(collectionData.grandTotal).toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div className="print-divider" />

            <table className="print-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Category</th>
                  <th>Ref ID</th>
                  <th>Client Name</th>
                  <th>Mode</th>
                  <th>Amount (₹)</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {collectionData.rows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.time}</td>
                    <td>{r.type}</td>
                    <td>{r.refId}</td>
                    <td>{r.clientName}</td>
                    <td>{r.mode}</td>
                    <td>₹{Number(r.amount).toLocaleString('en-IN')}</td>
                    <td>{r.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="print-signatures">
              <div className="print-sig-box">
                <div className="sig-line" />
                <span>Chamber Cashier / Accounts</span>
              </div>
              <div className="print-sig-box right">
                <div className="sig-line" />
                <span>Advocate Signature &amp; Seal</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
