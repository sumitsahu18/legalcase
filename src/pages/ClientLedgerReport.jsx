import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen, Printer, ArrowLeft, ChevronRight, Search, Download,
  RotateCcw, AlertCircle, User, Phone, CheckCircle2
} from 'lucide-react'
import Topbar from '../components/Topbar.jsx'
import { OFFICE } from '../data/menu.js'
import {
  getClients, getCases, getPayments, getBills, onStorageUpdate
} from '../services/storageService.js'
import './management.css'

export default function ClientLedgerReport() {
  const navigate = useNavigate()
  const [clients, setClients] = useState(() => getClients())
  const [cases, setCases] = useState(() => getCases())
  const [payments, setPayments] = useState(() => getPayments())
  const [bills, setBills] = useState(() => getBills())

  // Search input state (Client ID or Name)
  const [clientIdInput, setClientIdInput] = useState(() => (clients.length > 0 ? clients[0].id : ''))
  const [activeClient, setActiveClient] = useState(() => (clients.length > 0 ? clients[0] : null))
  const [searchError, setSearchError] = useState('')

  useEffect(() => {
    return onStorageUpdate(() => {
      const refreshedClients = getClients()
      setClients(refreshedClients)
      setCases(getCases())
      setPayments(getPayments())
      setBills(getBills())
      if (activeClient) {
        const found = refreshedClients.find((c) => c.id === activeClient.id)
        if (found) setActiveClient(found)
      }
    })
  }, [activeClient])

  // Handle Search button / Enter key
  const handleSearch = (e) => {
    if (e) e.preventDefault()
    setSearchError('')
    const query = clientIdInput.trim().toLowerCase()
    if (!query) {
      setSearchError('Please enter a Client ID or Name to search.')
      return
    }

    // Exact ID match, partial ID match, or name match
    const found = clients.find((c) => {
      const idStr = String(c.id || '').toLowerCase()
      const rawNumber = idStr.replace(/\D/g, '')
      const nameStr = String(c.name || '').toLowerCase()
      return (
        idStr === query ||
        rawNumber === query ||
        idStr.includes(query) ||
        nameStr.includes(query)
      )
    })

    if (found) {
      setActiveClient(found)
      setClientIdInput(found.id)
      setSearchError('')
    } else {
      setSearchError(`No client found matching "${clientIdInput}".`)
    }
  }

  // Quick switch dropdown
  const handleSelectClient = (cId) => {
    const found = clients.find((c) => c.id === cId)
    if (found) {
      setActiveClient(found)
      setClientIdInput(found.id)
      setSearchError('')
    }
  }

  // Derive Ledger Data for Active Client
  const clientCases = useMemo(() => {
    if (!activeClient) return []
    return cases.filter((cs) => cs.clientId === activeClient.id)
  }, [cases, activeClient])

  const clientCaseIds = useMemo(() => {
    return new Set(clientCases.map((c) => c.id))
  }, [clientCases])

  // 1. BILLING ROWS (Left Table)
  const billingRows = useMemo(() => {
    if (!activeClient) return []
    const rows = []
    const clientBills = bills.filter((b) => b.clientId === activeClient.id || clientCaseIds.has(b.caseId))

    if (clientBills.length > 0) {
      clientBills.forEach((b) => {
        rows.push({
          id: b.id,
          date: b.billDate || '',
          billAmount: Number(b.totalBillAmount || 0),
          details: b.description || b.remarks || (b.contractAmount ? 'COMPROMISE CONTRACT' : 'LEGAL BILL'),
        })
      })
    } else {
      // Synthesize from cases contracts if no explicit bills created yet
      clientCases.forEach((cs) => {
        const amt = Number(cs.contractAmount || cs.tcc || cs.totalFees || 0)
        if (amt > 0) {
          rows.push({
            id: `cs-bill-${cs.id}`,
            date: cs.createdAt ? cs.createdAt.split('T')[0] : '2026-01-15',
            billAmount: amt,
            details: cs.caseType ? `${cs.caseType.toUpperCase()} CONTRACT` : 'COMPROMISE CONTRACT',
          })
        }
      })
    }

    return rows.sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  }, [activeClient, bills, clientCases, clientCaseIds])

  // 2. PAYMENT ROWS (Right Table)
  const paymentRows = useMemo(() => {
    if (!activeClient) return []
    const clientPayments = payments.filter((p) => p.clientId === activeClient.id || clientCaseIds.has(p.caseId))
    return clientPayments
      .map((p) => ({
        id: p.id,
        date: p.paymentDate || '',
        paidAmount: Number(p.amount || 0),
        details: p.remarks || (p.mode === 'Cash' ? 'U/B CASH' : 'CONTRACT ADVANCE'),
      }))
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  }, [activeClient, payments, clientCaseIds])

  const totalBilling = billingRows.reduce((acc, r) => acc + r.billAmount, 0)
  const totalPaid = paymentRows.reduce((acc, r) => acc + r.paidAmount, 0)
  const balance = Math.max(0, totalBilling - totalPaid)

  const handlePrint = () => {
    window.print()
  }

  const handleExportCSV = () => {
    if (!activeClient) return
    const rows = [
      ['CLIENT LEDGER STATEMENT', `Client: ${activeClient.name}`, `Client ID: ${activeClient.id}`, `Phone: ${activeClient.phone}`],
      [],
      ['BILLING / BILL AMOUNT', '', '', 'PAYMENT / PAID AMOUNT', '', ''],
      ['Date', 'Bill Amount', 'Details', 'Date', 'Paid Amount', 'Details']
    ]

    const maxLen = Math.max(billingRows.length, paymentRows.length)
    for (let i = 0; i < maxLen; i++) {
      const b = billingRows[i] || {}
      const p = paymentRows[i] || {}
      rows.push([
        b.date || '',
        b.billAmount || '',
        `"${b.details || ''}"`,
        p.date || '',
        p.paidAmount || '',
        `"${p.details || ''}"`
      ])
    }

    rows.push([])
    rows.push(['Total Billing', totalBilling, '', 'Total Paid', totalPaid, `Balance: ${balance}`])

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((r) => r.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Client_Ledger_${activeClient.id}.csv`)
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
            <b className="crumbs-active">Client Ledger</b>
          </div>

          <div className="mgmt-header">
            <div className="mgmt-header-left">
              <span className="mgmt-icon-badge" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                <BookOpen size={20} strokeWidth={2.2} />
              </span>
              <div>
                <div className="mgmt-tag-row">
                  <span className="tag-blue">Client Account Statements</span>
                  <span className="tag-muted">Client Ledger Statement</span>
                </div>
                <h1 className="mgmt-title">Client Ledger Statement</h1>
                <p className="mgmt-desc">Side-by-side reconciliation of billing claims, payment credits, and outstanding fee balance</p>
              </div>
            </div>
            <div className="mgmt-header-actions">
              <button className="btn-secondary" onClick={handleExportCSV}>
                <Download size={14} />
                <span>Export CSV</span>
              </button>
              <button className="btn-secondary" onClick={handlePrint}>
                <Printer size={14} />
                <span>Print Ledger</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TOP SEARCH & CLIENT HEADER BAR (MATCHES REFERENCE SCREENSHOT)             */}
          {/* ========================================================================= */}
          <div
            className="panel"
            style={{
              background: '#f8fafc',
              border: '1.5px solid #0f172a',
              borderRadius: '6px',
              padding: '14px 18px',
              marginBottom: '16px',
            }}
          >
            <form onSubmit={handleSearch} style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
              {/* Client Id Search Box */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap' }}>
                  Client Id:
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2056 or CL-1001"
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    border: '1.5px solid #0f172a',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: '700',
                    width: '130px',
                    background: '#ffffff',
                    color: '#0f172a'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '6px 14px',
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
              </div>

              {/* Client Name Display Box */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '240px' }}>
                <span style={{ fontSize: '13px', fontStyle: 'italic', color: '#334155', whiteSpace: 'nowrap' }}>
                  Client Name:
                </span>
                <div
                  style={{
                    flex: 1,
                    padding: '6px 12px',
                    background: '#ffffff',
                    border: '1px solid #94a3b8',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#0f172a',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {activeClient ? activeClient.name : '—'}
                </div>
              </div>

              {/* Phone No Display Box */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '220px' }}>
                <span style={{ fontSize: '13px', fontStyle: 'italic', color: '#334155', whiteSpace: 'nowrap' }}>
                  Phone No:
                </span>
                <div
                  style={{
                    flex: 1,
                    padding: '6px 12px',
                    background: '#ffffff',
                    border: '1px solid #94a3b8',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#0f172a'
                  }}
                >
                  {activeClient ? (activeClient.phone ? `${activeClient.phone} - ${activeClient.name.split(' ')[0]}` : '—') : '—'}
                </div>
              </div>

              {/* Quick Dropdown Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <select
                  value={activeClient ? activeClient.id : ''}
                  onChange={(e) => handleSelectClient(e.target.value)}
                  style={{
                    padding: '6px 8px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    fontSize: '12px',
                    background: '#ffffff',
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} — {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </form>

            {searchError && (
              <div style={{ marginTop: '8px', color: '#dc2626', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={14} />
                <span>{searchError}</span>
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
            {/* LEFT TABLE: BILLING                                                     */}
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
              {/* Table Header Row */}
              <div style={{ borderBottom: '1.5px solid #0f172a', background: '#ffffff' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #0f172a' }}>
                      <th style={{ textAlign: 'left', padding: '8px 10px', width: '110px', fontStyle: 'italic', fontWeight: '800', color: '#0f172a' }}>
                        DATE
                      </th>
                      <th style={{ textAlign: 'right', padding: '8px 10px', width: '120px', fontStyle: 'italic', fontWeight: '800', color: '#0f172a' }}>
                        BILL AMOUNT
                      </th>
                      <th style={{ textAlign: 'left', padding: '8px 10px', fontStyle: 'italic', fontWeight: '800', color: '#0f172a' }}>
                        DETAILS
                      </th>
                    </tr>
                  </thead>
                </table>
              </div>

              {/* Table Scroll / Content Area with Classic Ledger Styling */}
              <div
                style={{
                  minHeight: '260px',
                  maxHeight: '380px',
                  overflowY: 'auto',
                  background: '#94a3b8', // Classic software gray canvas background
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', background: '#ffffff' }}>
                  <tbody>
                    {billingRows.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
                          No billing records recorded for this client.
                        </td>
                      </tr>
                    ) : (
                      billingRows.map((b, idx) => (
                        <tr
                          key={b.id || idx}
                          style={{
                            borderBottom: '1px solid #e2e8f0',
                            background: idx % 2 === 0 ? '#ffffff' : '#f8fafc'
                          }}
                        >
                          <td style={{ padding: '8px 10px', width: '110px', color: '#0f172a', fontWeight: '500' }}>
                            {b.date}
                          </td>
                          <td style={{ padding: '8px 10px', width: '120px', textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                            {b.billAmount.toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '8px 10px', color: '#334155', fontStyle: 'italic', textTransform: 'uppercase' }}>
                            {b.details}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                {/* Gray void filler to recreate the classic screenshot look */}
                <div style={{ flex: 1, minHeight: '60px', background: '#94a3b8' }} />
              </div>

              {/* Bottom: Total Billing Box (Aligned Right under table) */}
              <div
                style={{
                  padding: '10px 14px',
                  background: '#f8fafc',
                  borderTop: '1.5px solid #0f172a',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
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
                  {totalBilling.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* ----------------------------------------------------------------------- */}
            {/* RIGHT TABLE: PAYMENT                                                    */}
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
              {/* Table Header Row */}
              <div style={{ borderBottom: '1.5px solid #0f172a', background: '#ffffff' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #0f172a' }}>
                      <th style={{ textAlign: 'left', padding: '8px 10px', width: '110px', fontStyle: 'italic', fontWeight: '800', color: '#0f172a' }}>
                        DATE
                      </th>
                      <th style={{ textAlign: 'right', padding: '8px 10px', width: '120px', fontStyle: 'italic', fontWeight: '800', color: '#0f172a' }}>
                        PAID AMOUNT
                      </th>
                      <th style={{ textAlign: 'left', padding: '8px 10px', fontStyle: 'italic', fontWeight: '800', color: '#0f172a' }}>
                        DETAILS
                      </th>
                    </tr>
                  </thead>
                </table>
              </div>

              {/* Table Scroll / Content Area */}
              <div
                style={{
                  minHeight: '260px',
                  maxHeight: '380px',
                  overflowY: 'auto',
                  background: '#94a3b8',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', background: '#ffffff' }}>
                  <tbody>
                    {paymentRows.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
                          No payment receipts recorded for this client.
                        </td>
                      </tr>
                    ) : (
                      paymentRows.map((p, idx) => (
                        <tr
                          key={p.id || idx}
                          style={{
                            borderBottom: '1px solid #e2e8f0',
                            background: idx % 2 === 0 ? '#ffffff' : '#f8fafc'
                          }}
                        >
                          <td style={{ padding: '8px 10px', width: '110px', color: '#0f172a', fontWeight: '500' }}>
                            {p.date}
                          </td>
                          <td style={{ padding: '8px 10px', width: '120px', textAlign: 'right', fontWeight: '700', color: '#16a34a' }}>
                            {p.paidAmount.toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '8px 10px', color: '#334155', fontStyle: 'italic', textTransform: 'uppercase' }}>
                            {p.details}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                {/* Gray void filler to recreate the classic screenshot look */}
                <div style={{ flex: 1, minHeight: '60px', background: '#94a3b8' }} />
              </div>

              {/* Bottom: Total Paid Box + Balance Box (Exact layout from Screenshot) */}
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
                {/* Total Paid Box */}
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
                  {totalPaid.toLocaleString('en-IN')}
                </div>

                {/* Balance: [ 0 ] */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontStyle: 'italic', fontWeight: '700', color: '#0f172a' }}>
                    Balance:
                  </span>
                  <div
                    style={{
                      border: '1.5px solid #0f172a',
                      padding: '4px 16px',
                      fontSize: '14px',
                      fontWeight: '800',
                      background: '#ffffff',
                      color: balance > 0 ? '#dc2626' : '#0f172a',
                      minWidth: '100px',
                      textAlign: 'right'
                    }}
                  >
                    {balance.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Info & Chambers Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b' }}>
            <span>
              <strong>{OFFICE.name}</strong> · {OFFICE.address}
            </span>
            <span>
              Statement Generated for: <b>{activeClient ? activeClient.name : 'All Clients'}</b> ({activeClient ? activeClient.id : ''})
            </span>
          </div>
        </main>
      </div>
    </div>
  )
}
