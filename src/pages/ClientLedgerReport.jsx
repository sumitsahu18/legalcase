import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen, Printer, ArrowLeft, ChevronRight
} from 'lucide-react'
import Topbar from '../components/Topbar.jsx'
import {
  getClients, getCases, getPayments, onStorageUpdate
} from '../services/storageService.js'
import './management.css'

export default function ClientLedgerReport() {
  const navigate = useNavigate()
  const [clients, setClients] = useState(() => getClients())
  const [cases, setCases] = useState(() => getCases())
  const [payments, setPayments] = useState(() => getPayments())
  const [selectedClientId, setSelectedClientId] = useState(() => (clients.length > 0 ? clients[0].id : ''))
  const [search, setSearch] = useState('')

  useEffect(() => {
    return onStorageUpdate(() => {
      setClients(getClients())
      setCases(getCases())
      setPayments(getPayments())
    })
  }, [])

  const selectedClient = clients.find((c) => c.id === selectedClientId) || null
  const clientCases = cases.filter((cs) => cs.clientId === selectedClientId)
  const clientCaseIds = new Set(clientCases.map((c) => c.id))
  const clientPayments = payments.filter((p) => p.clientId === selectedClientId || clientCaseIds.has(p.caseId))

  const totalBilled = clientCases.reduce((acc, c) => acc + Number(c.totalFees || 0), 0)
  const totalPaid = clientPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0)
  const totalDue = Math.max(0, totalBilled - totalPaid)

  const filteredClients = clients.filter((c) => {
    const q = search.toLowerCase()
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.id && c.id.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q))
    )
  })

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
            <b className="crumbs-active">Client Ledger Statement</b>
          </div>

          <div className="mgmt-header">
            <div className="mgmt-header-left">
              <span className="mgmt-icon-badge" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                <BookOpen size={20} strokeWidth={2.2} />
              </span>
              <div>
                <div className="mgmt-tag-row">
                  <span className="tag-blue">Client Account Statements</span>
                  <span className="tag-muted">{clients.length} Registered Accounts</span>
                </div>
                <h1 className="mgmt-title">Client Ledger &amp; Financial Statement</h1>
                <p className="mgmt-desc">Detailed client-by-client billing, payment credits, and outstanding fee balance statement</p>
              </div>
            </div>
            <div className="mgmt-header-actions">
              <button className="btn-secondary" onClick={() => window.print()}>
                <Printer size={14} />
                <span>Print Ledger</span>
              </button>
              <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
                <ArrowLeft size={14} />
                <span>Dashboard</span>
              </button>
            </div>
          </div>

          <div className="mgmt-two-panel">
            {/* Client Selector Panel */}
            <div className="mgmt-form-panel" style={{ flex: '0 0 320px' }}>
              <div className="panel-card-head">
                <div className="pch-title">
                  <span className="pch-dot pch-blue" />
                  <h3>Select Client</h3>
                </div>
              </div>

              <div style={{ padding: '10px' }}>
                <input
                  type="text"
                  placeholder="Search client name or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="form-input"
                  style={{ marginBottom: '10px', fontSize: '12px' }}
                />

                <div style={{ maxHeight: '450px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {filteredClients.map((c) => {
                    const isSelected = c.id === selectedClientId
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedClientId(c.id)}
                        style={{
                          textAlign: 'left',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: isSelected ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                          background: isSelected ? '#eff6ff' : '#ffffff',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#1e40af' }}>{c.id}</span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>{c.phone}</span>
                        </div>
                        <strong style={{ display: 'block', fontSize: '13px', color: '#0f172a', marginTop: '2px' }}>{c.name}</strong>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Ledger Display */}
            <div className="mgmt-table-panel" style={{ flex: 1 }}>
              {selectedClient ? (
                <div>
                  {/* Ledger Header Card */}
                  <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                          {selectedClient.name}
                        </h2>
                        <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#475569' }}>
                          Client ID: <b>{selectedClient.id}</b> · Phone: <b>{selectedClient.phone}</b> · S/O: {selectedClient.relation || '—'}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                          Address: {selectedClient.address || '—'}
                        </p>
                      </div>

                      {/* Financial Balances */}
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <small style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Total Billed</small>
                          <span style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>₹{totalBilled.toLocaleString('en-IN')}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <small style={{ fontSize: '11px', color: '#166534', display: 'block' }}>Total Paid</small>
                          <span style={{ fontSize: '15px', fontWeight: '700', color: '#15803d' }}>₹{totalPaid.toLocaleString('en-IN')}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <small style={{ fontSize: '11px', color: '#dc2626', display: 'block' }}>Net Outstanding</small>
                          <span style={{ fontSize: '16px', fontWeight: '800', color: totalDue > 0 ? '#dc2626' : '#16a34a' }}>
                            ₹{totalDue.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Registered Cases Table */}
                  <div style={{ padding: '16px 20px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 8px', color: '#1e293b' }}>
                      Litigation Matters ({clientCases.length})
                    </h4>
                    {clientCases.length === 0 ? (
                      <p style={{ fontSize: '12px', color: '#94a3b8' }}>No cases registered under this client.</p>
                    ) : (
                      <table className="mgmt-table" style={{ fontSize: '12px', marginBottom: '16px' }}>
                        <thead>
                          <tr>
                            <th>Case ID</th>
                            <th>Case Number</th>
                            <th>Court Name</th>
                            <th>Next Date</th>
                            <th style={{ textAlign: 'right' }}>Total Fee</th>
                            <th style={{ textAlign: 'right' }}>Paid</th>
                            <th style={{ textAlign: 'right' }}>Due</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clientCases.map((cs) => (
                            <tr key={cs.id}>
                              <td><b>{cs.id}</b></td>
                              <td><strong>{cs.caseNumber}</strong></td>
                              <td>{cs.courtName}</td>
                              <td>{cs.nextDate}</td>
                              <td style={{ textAlign: 'right' }}>₹{Number(cs.totalFees || 0).toLocaleString('en-IN')}</td>
                              <td style={{ textAlign: 'right', color: '#16a34a' }}>₹{Number(cs.paidAmount || 0).toLocaleString('en-IN')}</td>
                              <td style={{ textAlign: 'right', color: Number(cs.dueAmount || 0) > 0 ? '#dc2626' : '#16a34a', fontWeight: '700' }}>
                                ₹{Number(cs.dueAmount || 0).toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {/* Payment Receipts Ledger */}
                    <h4 style={{ fontSize: '13px', fontWeight: '700', margin: '14px 0 8px', color: '#1e293b' }}>
                      Payment Credit History ({clientPayments.length})
                    </h4>
                    {clientPayments.length === 0 ? (
                      <p style={{ fontSize: '12px', color: '#94a3b8' }}>No payment receipts recorded for this client.</p>
                    ) : (
                      <table className="mgmt-table" style={{ fontSize: '12px' }}>
                        <thead>
                          <tr>
                            <th>Receipt ID</th>
                            <th>Date</th>
                            <th>Case Ref</th>
                            <th>Mode</th>
                            <th style={{ textAlign: 'right' }}>Credit Amount (₹)</th>
                            <th>Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clientPayments.map((p) => (
                            <tr key={p.id}>
                              <td><span className="id-pill" style={{ background: '#ecfdf5', color: '#065f46' }}>{p.id}</span></td>
                              <td>{p.paymentDate}</td>
                              <td>{p.caseId}</td>
                              <td>{p.mode}</td>
                              <td style={{ textAlign: 'right', color: '#16a34a', fontWeight: '700' }}>
                                ₹{Number(p.amount).toLocaleString('en-IN')}
                              </td>
                              <td>{p.remarks || 'Fee payment received'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  Select a client from the left panel to inspect their ledger statement.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
