import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CreditCard, Save, RefreshCw, Printer, XCircle, Search,
  Calendar, ArrowLeft, CheckCircle2, AlertCircle, ChevronRight,
  Hash, IndianRupee, FileText, Trash2, Filter, Layers, Download,
  Receipt, Plus, Eye, Check, X
} from 'lucide-react'
import Topbar from '../components/Topbar.jsx'
import { OFFICE } from '../data/menu.js'
import {
  getCases, getClients, getPayments, savePayment, updatePayment, deletePayment,
  getBills, saveBill, updateBill, deleteBill, onStorageUpdate
} from '../services/storageService.js'
import './management.css'

export default function PaymentManagement({ initialTab = 'billing' }) {
  const navigate = useNavigate()
  const [cases, setCases] = useState(() => getCases())
  const [clients, setClients] = useState(() => getClients())
  const [payments, setPayments] = useState(() => getPayments())
  const [bills, setBills] = useState(() => getBills())

  // Tabs: 'billing' | 'payments' | 'date-wise'
  const [activeTab, setActiveTab] = useState(
    initialTab === 'entry' ? 'billing' : initialTab === 'date-wise' ? 'date-wise' : initialTab
  )

  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  // Modals
  const [showBillModal, setShowBillModal] = useState(false)
  const [selectedBillForPrint, setSelectedBillForPrint] = useState(null)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [selectedReceiptForPrint, setSelectedReceiptForPrint] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null) // { type: 'bill' | 'payment', id: string }

  // ----------------------------------------------------
  // BILLING FORM STATE
  // ----------------------------------------------------
  const getInitialBillForm = () => ({
    billNumber: `BILL-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    billDate: new Date().toISOString().split('T')[0],
    caseId: '',
    clientId: '',
    clientName: '',
    caseNumber: '',
    courtName: '',
    contractAmount: '',
    additionalCharges: '0',
    discount: '0',
    totalBillAmount: '',
    description: 'Legal representation and court appearance fees',
    remarks: '',
  })

  const [billFormData, setBillFormData] = useState(getInitialBillForm)
  const [billSearchQuery, setBillSearchQuery] = useState('')
  const [billDropdownOpen, setBillDropdownOpen] = useState(false)
  const billDropdownRef = useRef(null)
  const [billErrors, setBillErrors] = useState({})

  // ----------------------------------------------------
  // PAYMENT FORM STATE
  // ----------------------------------------------------
  const getInitialPaymentForm = () => ({
    caseId: '',
    clientId: '',
    clientName: '',
    billId: '',
    contract: '', // Total Case Contract label
    totalBillAmount: '',
    alreadyPaid: '0',
    dueAmount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    amount: '',
    dueAfterPayment: '',
    mode: 'Cash',
    reference: '',
    remarks: '',
  })

  const [paymentFormData, setPaymentFormData] = useState(getInitialPaymentForm)
  const [paymentSearchQuery, setPaymentSearchQuery] = useState('')
  const [paymentDropdownOpen, setPaymentDropdownOpen] = useState(false)
  const paymentDropdownRef = useRef(null)
  const [paymentErrors, setPaymentErrors] = useState({})
  const [selectedPaymentId, setSelectedPaymentId] = useState(null)

  // Date-wise Tab Date
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])

  useEffect(() => {
    return onStorageUpdate(() => {
      setCases(getCases())
      setClients(getClients())
      setPayments(getPayments())
      setBills(getBills())
    })
  }, [])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = (type, message) => {
    setToast({ type, message })
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (billDropdownRef.current && !billDropdownRef.current.contains(e.target)) {
        setBillDropdownOpen(false)
      }
      if (paymentDropdownRef.current && !paymentDropdownRef.current.contains(e.target)) {
        setPaymentDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ----------------------------------------------------
  // BILLING HANDLERS
  // ----------------------------------------------------
  // Filter cases/clients for Bill Registration
  const billSearchResults = useMemo(() => {
    if (!billSearchQuery.trim()) return []
    const q = billSearchQuery.toLowerCase()
    return cases.filter((cs) => {
      return (
        (cs.clientId && cs.clientId.toLowerCase().includes(q)) ||
        (cs.clientName && cs.clientName.toLowerCase().includes(q)) ||
        (cs.id && cs.id.toLowerCase().includes(q)) ||
        (cs.caseNumber && cs.caseNumber.toLowerCase().includes(q)) ||
        (cs.phone && cs.phone.includes(q))
      )
    }).slice(0, 8)
  }, [cases, billSearchQuery])

  const handleSelectCaseForBill = (cs) => {
    const contract = Number(cs.contractAmount || cs.tcc || cs.totalFees || 0)
    const addl = Number(billFormData.additionalCharges || 0)
    const disc = Number(billFormData.discount || 0)
    const total = Math.max(0, contract + addl - disc)

    setBillFormData((prev) => ({
      ...prev,
      caseId: cs.id,
      clientId: cs.clientId || 'CL-1001',
      clientName: cs.clientName,
      caseNumber: cs.caseNumber || '',
      courtName: cs.courtName || '',
      contractAmount: String(contract),
      totalBillAmount: String(total),
    }))
    setBillSearchQuery(`${cs.clientId} - ${cs.clientName} (${cs.caseNumber || cs.id})`)
    setBillDropdownOpen(false)
    if (billErrors.caseId) setBillErrors((prev) => ({ ...prev, caseId: null }))
  }

  const handleBillAmountMath = (contractStr, addlStr, discStr) => {
    const contract = Number(contractStr || 0)
    const addl = Number(addlStr || 0)
    const disc = Number(discStr || 0)
    return Math.max(0, contract + addl - disc)
  }

  const handleBillInputChange = (e) => {
    const { name, value } = e.target
    setBillFormData((prev) => {
      const next = { ...prev, [name]: value }
      if (name === 'contractAmount' || name === 'additionalCharges' || name === 'discount') {
        next.totalBillAmount = String(handleBillAmountMath(
          name === 'contractAmount' ? value : next.contractAmount,
          name === 'additionalCharges' ? value : next.additionalCharges,
          name === 'discount' ? value : next.discount
        ))
      }
      return next
    })
    if (billErrors[name]) setBillErrors((prev) => ({ ...prev, [name]: null }))
  }

  const handleClearBillForm = () => {
    setBillFormData(getInitialBillForm())
    setBillSearchQuery('')
    setBillErrors({})
  }

  const handleSaveBill = (e) => {
    if (e) e.preventDefault()
    const errs = {}
    if (!billFormData.caseId) errs.caseId = 'Please select a Client Case Docket'
    if (!billFormData.totalBillAmount || Number(billFormData.totalBillAmount) <= 0) {
      errs.totalBillAmount = 'Total bill amount must be greater than 0'
    }
    if (!billFormData.billDate) errs.billDate = 'Bill date is required'
    if (Object.keys(errs).length > 0) {
      setBillErrors(errs)
      showToast('error', 'Please resolve errors in the bill form.')
      return
    }

    setLoading(true)
    setTimeout(() => {
      try {
        const saved = saveBill({
          billNumber: billFormData.billNumber,
          billDate: billFormData.billDate,
          caseId: billFormData.caseId,
          clientId: billFormData.clientId,
          clientName: billFormData.clientName,
          caseNumber: billFormData.caseNumber,
          courtName: billFormData.courtName,
          contractAmount: Number(billFormData.contractAmount || 0),
          additionalCharges: Number(billFormData.additionalCharges || 0),
          discount: Number(billFormData.discount || 0),
          totalBillAmount: Number(billFormData.totalBillAmount || 0),
          description: billFormData.description,
          remarks: billFormData.remarks,
        })
        showToast('success', `Bill ${saved.billNumber} created successfully!`)
        handleClearBillForm()
      } catch (err) {
        showToast('error', err.message || 'Failed to save bill.')
      } finally {
        setLoading(false)
      }
    }, 100)
  }

  // ----------------------------------------------------
  // PAYMENT HANDLERS
  // ----------------------------------------------------
  // Filter cases/bills for Payment Receipt
  const paymentSearchResults = useMemo(() => {
    if (!paymentSearchQuery.trim()) return []
    const q = paymentSearchQuery.toLowerCase()
    return cases.filter((cs) => {
      return (
        (cs.clientId && cs.clientId.toLowerCase().includes(q)) ||
        (cs.clientName && cs.clientName.toLowerCase().includes(q)) ||
        (cs.id && cs.id.toLowerCase().includes(q)) ||
        (cs.caseNumber && cs.caseNumber.toLowerCase().includes(q)) ||
        (cs.phone && cs.phone.includes(q))
      )
    }).slice(0, 8)
  }, [cases, paymentSearchQuery])

  const handleSelectCaseForPayment = (cs) => {
    const contract = Number(cs.contractAmount || cs.tcc || cs.totalFees || 0)
    const paid = Number(cs.paidAmount || 0)
    const due = Number(cs.dueAmount !== undefined ? cs.dueAmount : Math.max(0, contract - paid))

    // Check if there's a matching bill
    const relatedBill = bills.find((b) => b.caseId === cs.id)

    setPaymentFormData((prev) => ({
      ...prev,
      caseId: cs.id,
      clientId: cs.clientId || 'CL-1001',
      clientName: cs.clientName,
      billId: relatedBill ? relatedBill.id : '',
      contract: String(contract),
      totalBillAmount: String(relatedBill ? relatedBill.totalBillAmount : contract),
      alreadyPaid: String(paid),
      dueAmount: String(due),
      amount: '',
      dueAfterPayment: String(due),
    }))
    setPaymentSearchQuery(`${cs.clientId} - ${cs.clientName} (${cs.caseNumber || cs.id})`)
    setPaymentDropdownOpen(false)
    if (paymentErrors.caseId) setPaymentErrors((prev) => ({ ...prev, caseId: null }))
  }

  const handlePaymentAmountChange = (e) => {
    const amtStr = e.target.value
    const amt = Number(amtStr || 0)
    const currentDue = Number(paymentFormData.dueAmount || 0)
    const remaining = Math.max(0, currentDue - amt)

    setPaymentFormData((prev) => ({
      ...prev,
      amount: amtStr,
      dueAfterPayment: String(remaining),
    }))
    if (paymentErrors.amount) setPaymentErrors((prev) => ({ ...prev, amount: null }))
  }

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target
    setPaymentFormData((prev) => ({ ...prev, [name]: value }))
    if (paymentErrors[name]) setPaymentErrors((prev) => ({ ...prev, [name]: null }))
  }

  const handleClearPaymentForm = () => {
    setSelectedPaymentId(null)
    setPaymentFormData(getInitialPaymentForm())
    setPaymentSearchQuery('')
    setPaymentErrors({})
  }

  const handleSavePayment = (e) => {
    if (e) e.preventDefault()
    const errs = {}
    if (!paymentFormData.caseId) errs.caseId = 'Please select a Client Case Docket'
    if (!paymentFormData.amount || Number(paymentFormData.amount) <= 0) {
      errs.amount = 'Enter a valid payment amount'
    }
    if (!paymentFormData.paymentDate) errs.paymentDate = 'Payment date is required'
    if (Object.keys(errs).length > 0) {
      setPaymentErrors(errs)
      showToast('error', 'Please resolve form errors.')
      return
    }

    setLoading(true)
    setTimeout(() => {
      try {
        if (selectedPaymentId) {
          const updated = updatePayment(selectedPaymentId, {
            caseId: paymentFormData.caseId,
            clientId: paymentFormData.clientId,
            clientName: paymentFormData.clientName,
            billId: paymentFormData.billId,
            contract: paymentFormData.contract,
            paymentDate: paymentFormData.paymentDate,
            amount: Number(paymentFormData.amount),
            mode: paymentFormData.mode,
            reference: paymentFormData.reference,
            remarks: paymentFormData.remarks,
          })
          showToast('success', `Payment receipt ${updated.receiptNumber || updated.id} updated!`)
        } else {
          const saved = savePayment({
            caseId: paymentFormData.caseId,
            clientId: paymentFormData.clientId,
            clientName: paymentFormData.clientName,
            billId: paymentFormData.billId,
            contract: paymentFormData.contract,
            paymentDate: paymentFormData.paymentDate,
            amount: Number(paymentFormData.amount),
            mode: paymentFormData.mode,
            reference: paymentFormData.reference,
            remarks: paymentFormData.remarks,
          })
          showToast('success', `Payment receipt ${saved.receiptNumber || saved.id} of ₹${Number(saved.amount).toLocaleString('en-IN')} recorded!`)
        }
        handleClearPaymentForm()
      } catch (err) {
        showToast('error', err.message || 'Failed to record payment.')
      } finally {
        setLoading(false)
      }
    }, 100)
  }

  // ----------------------------------------------------
  // DELETE HANDLERS
  // ----------------------------------------------------
  const confirmDelete = () => {
    if (!itemToDelete) return
    try {
      if (itemToDelete.type === 'bill') {
        deleteBill(itemToDelete.id)
        showToast('success', `Bill ${itemToDelete.id} removed.`)
      } else if (itemToDelete.type === 'payment') {
        deletePayment(itemToDelete.id)
        showToast('success', `Payment ${itemToDelete.id} deleted. Case balance adjusted.`)
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to delete.')
    } finally {
      setShowDeleteModal(false)
      setItemToDelete(null)
    }
  }

  // ----------------------------------------------------
  // FILTERED LISTS
  // ----------------------------------------------------
  const filteredBills = useMemo(() => {
    const q = search.toLowerCase()
    return bills.filter((b) => {
      return (
        !q ||
        (b.billNumber && b.billNumber.toLowerCase().includes(q)) ||
        (b.clientId && b.clientId.toLowerCase().includes(q)) ||
        (b.clientName && b.clientName.toLowerCase().includes(q)) ||
        (b.caseNumber && b.caseNumber.toLowerCase().includes(q)) ||
        (b.description && b.description.toLowerCase().includes(q))
      )
    })
  }, [bills, search])

  const filteredPayments = useMemo(() => {
    const q = search.toLowerCase()
    return payments.filter((p) => {
      return (
        !q ||
        (p.id && p.id.toLowerCase().includes(q)) ||
        (p.receiptNumber && p.receiptNumber.toLowerCase().includes(q)) ||
        (p.clientId && p.clientId.toLowerCase().includes(q)) ||
        (p.clientName && p.clientName.toLowerCase().includes(q)) ||
        (p.caseId && p.caseId.toLowerCase().includes(q)) ||
        (p.mode && p.mode.toLowerCase().includes(q)) ||
        (p.remarks && p.remarks.toLowerCase().includes(q))
      )
    })
  }, [payments, search])

  // Date-wise payments for Date-Wise Tab
  const dateWisePayments = payments.filter((p) => String(p.paymentDate) === selectedDate)
  const totalDateWiseAmt = dateWisePayments.reduce((acc, p) => acc + Number(p.amount || 0), 0)

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
            <span className="crumbs-muted">Accounts</span>
            <ChevronRight size={12} className="crumbs-sep" />
            <b className="crumbs-active">
              {activeTab === 'billing' ? 'Client Billing' : activeTab === 'payments' ? 'Client Payment' : 'Date-Wise Payments'}
            </b>
          </div>

          <div className="mgmt-header">
            <div className="mgmt-header-left">
              <span className="mgmt-icon-badge" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                <CreditCard size={20} strokeWidth={2.2} />
              </span>
              <div>
                <div className="mgmt-tag-row">
                  <span className="tag-green">Accounts &amp; Financial Management</span>
                  <span className="tag-muted">{bills.length} Bills · {payments.length} Receipts</span>
                </div>
                <h1 className="mgmt-title">
                  {activeTab === 'billing' ? 'Client Billing (Invoices & Claims)' : activeTab === 'payments' ? 'Client Payment (Fee Receipts)' : 'Date-Wise Payment Details'}
                </h1>
                <p className="mgmt-desc">
                  {activeTab === 'billing'
                    ? 'Generate and manage client bills, fee contracts, and additional legal disbursements'
                    : 'Record fee payments, issue signed receipts, and track outstanding case balances'}
                </p>
              </div>
            </div>

            <div className="mgmt-header-actions">
              <button
                type="button"
                className={`btn-secondary ${activeTab === 'billing' ? 'active-tab' : ''}`}
                style={activeTab === 'billing' ? { background: '#0f172a', color: '#ffffff', fontWeight: '700' } : {}}
                onClick={() => {
                  setActiveTab('billing')
                  setSearch('')
                }}
              >
                <FileText size={14} />
                <span>Client Billing</span>
              </button>

              <button
                type="button"
                className={`btn-secondary ${activeTab === 'payments' ? 'active-tab' : ''}`}
                style={activeTab === 'payments' ? { background: '#0f172a', color: '#ffffff', fontWeight: '700' } : {}}
                onClick={() => {
                  setActiveTab('payments')
                  setSearch('')
                }}
              >
                <CreditCard size={14} />
                <span>Client Payment</span>
              </button>

              <button
                type="button"
                className={`btn-secondary ${activeTab === 'date-wise' ? 'active-tab' : ''}`}
                style={activeTab === 'date-wise' ? { background: '#0f172a', color: '#ffffff', fontWeight: '700' } : {}}
                onClick={() => {
                  setActiveTab('date-wise')
                  setSearch('')
                }}
              >
                <Receipt size={14} />
                <span>Date-Wise Receipts</span>
              </button>

              <button className="btn-secondary" onClick={() => window.print()}>
                <Printer size={14} />
                <span>Print</span>
              </button>
            </div>
          </div>

          {toast && (
            <div className={`mgmt-toast toast-${toast.type}`}>
              {toast.type === 'success' && <CheckCircle2 size={16} />}
              {toast.type === 'error' && <AlertCircle size={16} />}
              {toast.type === 'info' && <CheckCircle2 size={16} />}
              <span>{toast.message}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: CLIENT BILLING (BILLS / CLAIMS ISSUED)                             */}
          {/* ========================================================================= */}
          {activeTab === 'billing' && (
            <div className="mgmt-two-panel">
              {/* LEFT: Create Bill Form */}
              <div className="mgmt-form-panel" style={{ flex: '0 0 420px' }}>
                <div className="panel-card-head">
                  <div className="pch-title">
                    <span className="pch-dot" style={{ background: '#2563eb' }} />
                    <h3>Create Client Bill / Invoice</h3>
                  </div>
                  <span className="status-badge creating">New Bill</span>
                </div>

                <form className="mgmt-form" onSubmit={handleSaveBill}>
                  {/* Searchable Client & Case Selector */}
                  <div className="form-field" ref={billDropdownRef} style={{ position: 'relative' }}>
                    <label className="field-lbl">Select Client / Case Docket <span className="req">*</span></label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="Search Client ID, Name or Case No..."
                        className={`form-input ${billErrors.caseId ? 'input-err' : ''}`}
                        value={billSearchQuery}
                        onChange={(e) => {
                          setBillSearchQuery(e.target.value)
                          setBillDropdownOpen(true)
                        }}
                        onFocus={() => setBillDropdownOpen(true)}
                      />
                      {billSearchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setBillSearchQuery('')
                            setBillFormData(prev => ({
                              ...prev,
                              caseId: '',
                              clientId: '',
                              clientName: '',
                              caseNumber: '',
                              contractAmount: '',
                              totalBillAmount: ''
                            }))
                          }}
                          style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {billDropdownOpen && billSearchResults.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 40,
                        background: '#ffffff',
                        border: '1.5px solid #2563eb',
                        borderRadius: '6px',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                        maxHeight: '220px',
                        overflowY: 'auto',
                        marginTop: '4px'
                      }}>
                        {billSearchResults.map((cs) => (
                          <div
                            key={cs.id}
                            onClick={() => handleSelectCaseForBill(cs)}
                            style={{
                              padding: '10px 12px',
                              borderBottom: '1px solid #f1f5f9',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                          >
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: '700', color: '#2563eb' }}>{cs.clientId || 'CL-1001'}</div>
                              <strong style={{ fontSize: '13px', color: '#0f172a' }}>{cs.clientName}</strong>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>{cs.caseNumber} · {cs.courtName}</div>
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                              ₹{Number(cs.contractAmount || cs.tcc || cs.totalFees || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {billErrors.caseId && <span className="err-msg">{billErrors.caseId}</span>}
                  </div>

                  {/* Bill Number & Date */}
                  <div className="form-row-2">
                    <div className="form-field">
                      <label className="field-lbl">Bill Number <span className="req">*</span></label>
                      <input
                        type="text"
                        name="billNumber"
                        className="form-input"
                        value={billFormData.billNumber}
                        onChange={handleBillInputChange}
                      />
                    </div>
                    <div className="form-field">
                      <label className="field-lbl">Bill Date <span className="req">*</span></label>
                      <input
                        type="date"
                        name="billDate"
                        className={`form-input ${billErrors.billDate ? 'input-err' : ''}`}
                        value={billFormData.billDate}
                        onChange={handleBillInputChange}
                      />
                    </div>
                  </div>

                  {/* Client Info (Read Only Display) */}
                  <div className="form-row-2">
                    <div className="form-field">
                      <label className="field-lbl">Client ID</label>
                      <input
                        type="text"
                        className="form-input readonly-input"
                        value={billFormData.clientId || '—'}
                        readOnly
                      />
                    </div>
                    <div className="form-field">
                      <label className="field-lbl">Client Name</label>
                      <input
                        type="text"
                        className="form-input readonly-input"
                        value={billFormData.clientName || 'Auto-filled from case'}
                        readOnly
                      />
                    </div>
                  </div>

                  {/* Contract Amount, Additional Charges, Discount */}
                  <div className="form-row-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div className="form-field">
                      <label className="field-lbl">Contract (₹)</label>
                      <input
                        type="number"
                        name="contractAmount"
                        placeholder="0"
                        className="form-input"
                        value={billFormData.contractAmount}
                        onChange={handleBillInputChange}
                      />
                    </div>
                    <div className="form-field">
                      <label className="field-lbl">Addl Charges (₹)</label>
                      <input
                        type="number"
                        name="additionalCharges"
                        placeholder="0"
                        className="form-input"
                        value={billFormData.additionalCharges}
                        onChange={handleBillInputChange}
                      />
                    </div>
                    <div className="form-field">
                      <label className="field-lbl">Discount (₹)</label>
                      <input
                        type="number"
                        name="discount"
                        placeholder="0"
                        className="form-input"
                        value={billFormData.discount}
                        onChange={handleBillInputChange}
                      />
                    </div>
                  </div>

                  {/* Total Bill Amount */}
                  <div className="form-field">
                    <label className="field-lbl" style={{ color: '#1e40af', fontWeight: '800' }}>
                      Total Bill Amount (₹) = Contract + Addl - Discount
                    </label>
                    <div className="input-with-icon">
                      <IndianRupee size={15} className="input-ic" />
                      <input
                        type="number"
                        name="totalBillAmount"
                        placeholder="Calculated Total"
                        className={`form-input readonly-input ${billErrors.totalBillAmount ? 'input-err' : ''}`}
                        value={billFormData.totalBillAmount}
                        readOnly
                        style={{ fontSize: '16px', fontWeight: '800', color: '#1e3a8a', background: '#eff6ff' }}
                      />
                    </div>
                    {billErrors.totalBillAmount && <span className="err-msg">{billErrors.totalBillAmount}</span>}
                  </div>

                  {/* Description / Particulars */}
                  <div className="form-field">
                    <label className="field-lbl">Description / Billing Particulars</label>
                    <input
                      type="text"
                      name="description"
                      placeholder="e.g. Legal defense, draft petitions, and hearing fees"
                      className="form-input"
                      value={billFormData.description}
                      onChange={handleBillInputChange}
                    />
                  </div>

                  {/* Remarks */}
                  <div className="form-field">
                    <label className="field-lbl">Remarks / Billing Terms</label>
                    <textarea
                      name="remarks"
                      rows={2}
                      placeholder="Special instructions or stage details..."
                      className="form-input"
                      value={billFormData.remarks}
                      onChange={handleBillInputChange}
                    />
                  </div>

                  <div className="form-actions-split" style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={loading}
                      style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                    >
                      <Save size={14} />
                      <span>{loading ? 'Saving...' : 'Generate Bill'}</span>
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleClearBillForm}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <RefreshCw size={14} />
                      <span>Clear</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* RIGHT: Bills Register Table */}
              <div className="mgmt-table-panel" style={{ flex: 1 }}>
                <div className="panel-card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="pch-title">
                    <span className="pch-dot" style={{ background: '#2563eb' }} />
                    <h3>Client Bills Register</h3>
                    <span className="panel-count">{filteredBills.length} Invoices</span>
                  </div>
                  <div style={{ width: '240px', position: 'relative' }}>
                    <Search size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      placeholder="Search bill no, client, case..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: '28px', fontSize: '12px', height: '32px' }}
                    />
                  </div>
                </div>

                <div className="table-scroll-container">
                  <table className="mgmt-table">
                    <thead>
                      <tr>
                        <th>BILL NO</th>
                        <th>DATE</th>
                        <th>CLIENT ID</th>
                        <th>CLIENT NAME</th>
                        <th>CASE NO</th>
                        <th style={{ textAlign: 'right' }}>TOTAL BILL</th>
                        <th style={{ textAlign: 'right' }}>PAID</th>
                        <th style={{ textAlign: 'right' }}>DUE</th>
                        <th style={{ textAlign: 'center' }}>STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBills.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="empty-table-cell">
                            <AlertCircle size={18} className="empty-ic" />
                            <span>No bills found matching search.</span>
                          </td>
                        </tr>
                      ) : (
                        filteredBills.map((b) => {
                          const billTotal = Number(b.totalBillAmount || 0)
                          const billPaid = Number(b.paidAmount || 0)
                          const billDue = Math.max(0, billTotal - billPaid)
                          const isFullyPaid = billPaid >= billTotal && billTotal > 0
                          const isPartial = billPaid > 0 && billPaid < billTotal

                          return (
                            <tr key={b.id}>
                              <td>
                                <strong style={{ color: '#1e40af', fontSize: '12px' }}>{b.billNumber}</strong>
                              </td>
                              <td><span style={{ fontSize: '11px', color: '#475569' }}>{b.billDate}</span></td>
                              <td>
                                <span className="id-pill" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                                  {b.clientId}
                                </span>
                              </td>
                              <td><strong className="primary-text">{b.clientName}</strong></td>
                              <td><span style={{ color: '#7c3aed', fontSize: '12px', fontWeight: '600' }}>{b.caseNumber || b.caseId}</span></td>
                              <td style={{ textAlign: 'right', fontWeight: '800', color: '#0f172a' }}>
                                ₹{billTotal.toLocaleString('en-IN')}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: '700', color: '#16a34a' }}>
                                ₹{billPaid.toLocaleString('en-IN')}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: '700', color: billDue > 0 ? '#dc2626' : '#64748b' }}>
                                ₹{billDue.toLocaleString('en-IN')}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '10.5px',
                                  fontWeight: '700',
                                  background: isFullyPaid ? '#dcfce7' : isPartial ? '#fef3c7' : '#fee2e2',
                                  color: isFullyPaid ? '#15803d' : isPartial ? '#b45309' : '#b91c1c'
                                }}>
                                  {isFullyPaid ? 'Paid' : isPartial ? 'Partial' : 'Due'}
                                </span>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                  <button
                                    type="button"
                                    title="View / Print Bill"
                                    onClick={() => {
                                      setSelectedBillForPrint(b)
                                      setShowBillModal(true)
                                    }}
                                    style={{ padding: '4px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px', cursor: 'pointer', color: '#1d4ed8' }}
                                  >
                                    <Eye size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    title="Delete Bill"
                                    onClick={() => {
                                      setItemToDelete({ type: 'bill', id: b.id })
                                      setShowDeleteModal(true)
                                    }}
                                    style={{ padding: '4px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', cursor: 'pointer', color: '#dc2626' }}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: CLIENT PAYMENT (FEE RECEIPTS RECORDED)                             */}
          {/* ========================================================================= */}
          {activeTab === 'payments' && (
            <div className="mgmt-two-panel">
              {/* LEFT: Record Payment Form */}
              <div className="mgmt-form-panel" style={{ flex: '0 0 420px' }}>
                <div className="panel-card-head">
                  <div className="pch-title">
                    <span className="pch-dot" style={{ background: '#10b981' }} />
                    <h3>{selectedPaymentId ? `Edit Receipt (${selectedPaymentId})` : 'Record Fee Payment Receipt'}</h3>
                  </div>
                  <span className="status-badge" style={{ background: '#dcfce7', color: '#15803d' }}>
                    {selectedPaymentId ? 'Editing' : 'New Receipt'}
                  </span>
                </div>

                <form className="mgmt-form" onSubmit={handleSavePayment}>
                  {/* Searchable Case / Client Selector */}
                  <div className="form-field" ref={paymentDropdownRef} style={{ position: 'relative' }}>
                    <label className="field-lbl">Select Client / Case Docket <span className="req">*</span></label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="Search Client ID, Name or Case No..."
                        className={`form-input ${paymentErrors.caseId ? 'input-err' : ''}`}
                        value={paymentSearchQuery}
                        onChange={(e) => {
                          setPaymentSearchQuery(e.target.value)
                          setPaymentDropdownOpen(true)
                        }}
                        onFocus={() => setPaymentDropdownOpen(true)}
                      />
                      {paymentSearchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentSearchQuery('')
                            setPaymentFormData(getInitialPaymentForm())
                          }}
                          style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {paymentDropdownOpen && paymentSearchResults.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 40,
                        background: '#ffffff',
                        border: '1.5px solid #10b981',
                        borderRadius: '6px',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                        maxHeight: '220px',
                        overflowY: 'auto',
                        marginTop: '4px'
                      }}>
                        {paymentSearchResults.map((cs) => (
                          <div
                            key={cs.id}
                            onClick={() => handleSelectCaseForPayment(cs)}
                            style={{
                              padding: '10px 12px',
                              borderBottom: '1px solid #f1f5f9',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                          >
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: '700', color: '#10b981' }}>{cs.clientId || 'CL-1001'}</div>
                              <strong style={{ fontSize: '13px', color: '#0f172a' }}>{cs.clientName}</strong>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>{cs.caseNumber} · {cs.courtName}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>Due</div>
                              <span style={{ fontSize: '12px', fontWeight: '800', color: '#dc2626' }}>
                                ₹{Number(cs.dueAmount !== undefined ? cs.dueAmount : 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {paymentErrors.caseId && <span className="err-msg">{paymentErrors.caseId}</span>}
                  </div>

                  {/* Financial Balance Summary Banner */}
                  {paymentFormData.caseId && (
                    <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', margin: '4px 0', fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span><b>Contract:</b> ₹{Number(paymentFormData.contract || 0).toLocaleString('en-IN')}</span>
                        <span><b>Total Billed:</b> ₹{Number(paymentFormData.totalBillAmount || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span><b>Already Paid:</b> <span style={{ color: '#16a34a', fontWeight: '700' }}>₹{Number(paymentFormData.alreadyPaid || 0).toLocaleString('en-IN')}</span></span>
                        <span><b>Current Due:</b> <span style={{ color: '#dc2626', fontWeight: '800' }}>₹{Number(paymentFormData.dueAmount || 0).toLocaleString('en-IN')}</span></span>
                      </div>
                    </div>
                  )}

                  {/* Client Name & Payment Date */}
                  <div className="form-row-2">
                    <div className="form-field">
                      <label className="field-lbl">Client Name</label>
                      <input
                        type="text"
                        className="form-input readonly-input"
                        value={paymentFormData.clientName || 'Auto-filled from Case'}
                        readOnly
                      />
                    </div>
                    <div className="form-field">
                      <label className="field-lbl">Payment Date <span className="req">*</span></label>
                      <input
                        type="date"
                        name="paymentDate"
                        className={`form-input ${paymentErrors.paymentDate ? 'input-err' : ''}`}
                        value={paymentFormData.paymentDate}
                        onChange={handlePaymentInputChange}
                      />
                    </div>
                  </div>

                  {/* Contract Field strictly labelled "Contract" (NO TCC wording, NO ID Number) */}
                  <div className="form-field">
                    <label className="field-lbl">Contract (₹)</label>
                    <input
                      type="text"
                      name="contract"
                      className="form-input readonly-input"
                      value={paymentFormData.contract ? `₹${Number(paymentFormData.contract).toLocaleString('en-IN')}` : 'Auto-filled from docket'}
                      readOnly
                    />
                  </div>

                  {/* Payment Amount & Due After Payment */}
                  <div className="form-row-2">
                    <div className="form-field">
                      <label className="field-lbl">Amount Received (₹) <span className="req">*</span></label>
                      <div className="input-with-icon">
                        <IndianRupee size={14} className="input-ic" />
                        <input
                          type="number"
                          name="amount"
                          placeholder="Amount paid"
                          className={`form-input ${paymentErrors.amount ? 'input-err' : ''}`}
                          value={paymentFormData.amount}
                          onChange={handlePaymentAmountChange}
                          style={{ fontWeight: '700', fontSize: '15px' }}
                        />
                      </div>
                      {paymentErrors.amount && <span className="err-msg">{paymentErrors.amount}</span>}
                    </div>

                    <div className="form-field">
                      <label className="field-lbl">Due After Payment (₹)</label>
                      <input
                        type="number"
                        className="form-input readonly-input"
                        value={paymentFormData.dueAfterPayment}
                        readOnly
                        style={{
                          color: Number(paymentFormData.dueAfterPayment || 0) > 0 ? '#dc2626' : '#16a34a',
                          fontWeight: '800'
                        }}
                      />
                    </div>
                  </div>

                  {/* Payment Mode & Reference */}
                  <div className="form-row-2">
                    <div className="form-field">
                      <label className="field-lbl">Payment Mode</label>
                      <select
                        name="mode"
                        className="form-input form-select"
                        value={paymentFormData.mode}
                        onChange={handlePaymentInputChange}
                      >
                        <option value="Cash">Cash at Chambers</option>
                        <option value="UPI">UPI / GPay / PhonePe</option>
                        <option value="Bank Transfer">Bank Transfer / NEFT</option>
                        <option value="Cheque">Bank Cheque / DD</option>
                      </select>
                    </div>

                    <div className="form-field">
                      <label className="field-lbl">Txn / Cheque Ref No</label>
                      <input
                        type="text"
                        name="reference"
                        placeholder="Ref / Chq / Txn ID"
                        className="form-input"
                        value={paymentFormData.reference}
                        onChange={handlePaymentInputChange}
                      />
                    </div>
                  </div>

                  {/* Remarks / Details */}
                  <div className="form-field">
                    <label className="field-lbl">Receipt Remarks / Particulars</label>
                    <input
                      type="text"
                      name="remarks"
                      placeholder="e.g. Contract Advance, Witness deposition charges..."
                      className="form-input"
                      value={paymentFormData.remarks}
                      onChange={handlePaymentInputChange}
                    />
                  </div>

                  <div className="form-actions-split" style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={loading}
                      style={{ flex: 1, background: '#059669', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                    >
                      <Save size={14} />
                      <span>{loading ? 'Recording...' : selectedPaymentId ? 'Update Receipt' : 'Save Payment Receipt'}</span>
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleClearPaymentForm}
                    >
                      <RefreshCw size={14} />
                      <span>Clear</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* RIGHT: Payment Receipts Table */}
              <div className="mgmt-table-panel" style={{ flex: 1 }}>
                <div className="panel-card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="pch-title">
                    <span className="pch-dot" style={{ background: '#10b981' }} />
                    <h3>Client Payment Receipts</h3>
                    <span className="panel-count">{filteredPayments.length} Receipts</span>
                  </div>
                  <div style={{ width: '240px', position: 'relative' }}>
                    <Search size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      placeholder="Search receipt no, client, mode..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: '28px', fontSize: '12px', height: '32px' }}
                    />
                  </div>
                </div>

                <div className="table-scroll-container">
                  <table className="mgmt-table">
                    <thead>
                      <tr>
                        <th>RECEIPT NO</th>
                        <th>DATE</th>
                        <th>CLIENT ID</th>
                        <th>CLIENT NAME</th>
                        <th>CASE DOCKET</th>
                        <th style={{ textAlign: 'right' }}>AMOUNT</th>
                        <th>MODE</th>
                        <th>DETAILS / REMARKS</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="empty-table-cell">
                            <AlertCircle size={18} className="empty-ic" />
                            <span>No payments found matching search.</span>
                          </td>
                        </tr>
                      ) : (
                        filteredPayments.map((p) => (
                          <tr key={p.id}>
                            <td>
                              <strong style={{ color: '#059669', fontSize: '12px' }}>{p.receiptNumber || p.id}</strong>
                            </td>
                            <td><span style={{ fontSize: '11px', color: '#475569' }}>{p.paymentDate}</span></td>
                            <td>
                              <span className="id-pill" style={{ background: '#ecfdf5', color: '#047857' }}>
                                {p.clientId || 'CL-1001'}
                              </span>
                            </td>
                            <td><strong className="primary-text">{p.clientName}</strong></td>
                            <td><span style={{ color: '#7c3aed', fontSize: '12px', fontWeight: '600' }}>{p.caseId}</span></td>
                            <td style={{ textAlign: 'right', fontWeight: '800', color: '#16a34a' }}>
                              ₹{Number(p.amount || 0).toLocaleString('en-IN')}
                            </td>
                            <td>
                              <span style={{ fontSize: '11px', padding: '2px 6px', background: '#f1f5f9', borderRadius: '4px', fontWeight: '600', color: '#334155' }}>
                                {p.mode || 'Cash'}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: '12px', color: '#475569' }}>
                                {p.remarks || 'Fee installment'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                <button
                                  type="button"
                                  title="Print Payment Receipt"
                                  onClick={() => {
                                    setSelectedReceiptForPrint(p)
                                    setShowReceiptModal(true)
                                  }}
                                  style={{ padding: '4px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '4px', cursor: 'pointer', color: '#059669' }}
                                >
                                  <Printer size={13} />
                                </button>
                                <button
                                  type="button"
                                  title="Delete Receipt"
                                  onClick={() => {
                                    setItemToDelete({ type: 'payment', id: p.id })
                                    setShowDeleteModal(true)
                                  }}
                                  style={{ padding: '4px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', cursor: 'pointer', color: '#dc2626' }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: DATE-WISE PAYMENTS (PDF SPECIFICATION)                             */}
          {/* ========================================================================= */}
          {activeTab === 'date-wise' && (
            <div>
              {/* Date Filter Bar */}
              <div className="panel" style={{ padding: '14px 18px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px', display: 'flex', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Calendar size={18} style={{ color: '#059669' }} />
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>Select Collection Date:</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="form-input"
                    style={{ width: '180px', fontWeight: '600' }}
                  />
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                  Total Day Receipts: <span style={{ color: '#16a34a', fontSize: '16px' }}>₹{totalDateWiseAmt.toLocaleString('en-IN')}</span> ({dateWisePayments.length} entries)
                </div>
              </div>

              {/* Printable Card Layout */}
              <div className="panel" style={{ background: '#ffffff', borderRadius: '8px', border: '2px solid #0f172a', padding: '24px' }}>
                <div style={{ background: '#059669', color: '#ffffff', padding: '8px 16px', textAlign: 'center', fontWeight: '900', fontSize: '16px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '20px' }}>
                  DATE WISE PAYMENT DETAILS
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '13px', color: '#0f172a', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <span>Listing Date: <u>{selectedDate}</u></span>
                  <span>Total Amount Collected: <u style={{ color: '#16a34a' }}>₹{totalDateWiseAmt.toLocaleString('en-IN')}</u></span>
                </div>

                {dateWisePayments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    <AlertCircle size={24} style={{ margin: '0 auto 8px', display: 'block', color: '#94a3b8' }} />
                    No fee receipts recorded on {selectedDate}.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {dateWisePayments.map((p, idx) => (
                      <div
                        key={p.id}
                        style={{
                          border: '1.5px solid #0f172a',
                          borderRadius: '4px',
                          padding: '14px 16px',
                          background: '#ffffff',
                        }}
                      >
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1.6fr 1.1fr 1.2fr 1.2fr 1.2fr',
                            gap: '12px',
                            borderBottom: '1px dashed #cbd5e1',
                            paddingBottom: '8px',
                            fontSize: '12.5px',
                            alignItems: 'baseline',
                          }}
                        >
                          <div>
                            <strong>{idx + 1}. Client Name :</strong>{' '}
                            <span style={{ fontWeight: '700', color: '#0f172a' }}>{p.clientName}</span>
                          </div>
                          <div>
                            <strong>Client ID:</strong>{' '}
                            <span style={{ fontWeight: '700', color: '#1d4ed8' }}>{p.clientId || 'CL-1001'}</span>
                          </div>
                          <div>
                            <strong>Receipt No:</strong>{' '}
                            <span style={{ fontWeight: '700', color: '#059669' }}>{p.receiptNumber || p.id}</span>
                          </div>
                          <div>
                            <strong>Mode:</strong>{' '}
                            <span style={{ fontWeight: '600', color: '#334155' }}>{p.mode || 'Cash'}</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <strong>Amount:</strong>{' '}
                            <span style={{ fontWeight: '800', color: '#16a34a', fontSize: '14px' }}>
                              ₹{Number(p.amount || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>

                        <div style={{ paddingTop: '8px', fontSize: '12px', display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                          <span><b>Case Docket:</b> {p.caseId} {p.reference ? `· Ref: ${p.reference}` : ''}</span>
                          <span><b>Remarks:</b> {p.remarks || 'Fee installment credited'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '36px', paddingTop: '16px', borderTop: '1px solid #0f172a' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    <strong>{OFFICE.name}</strong> · {OFFICE.address}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a' }}>
                    Official Chambers Collection Statement
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: VIEW / PRINT BILL MODAL                                          */}
      {/* ========================================================================= */}
      {showBillModal && selectedBillForPrint && (
        <div className="modal-backdrop" onClick={() => setShowBillModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px', padding: '28px' }}>
            {/* Invoice Header */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>
                {OFFICE.name}
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#475569' }}>
                {OFFICE.address} · Phone: {OFFICE.phone} · Chambers: {OFFICE.chamber}
              </p>
              <div style={{ marginTop: '12px', display: 'inline-block', background: '#0f172a', color: '#ffffff', padding: '4px 16px', fontWeight: '800', fontSize: '13px', borderRadius: '4px' }}>
                FEE BILL &amp; CLAIM INVOICE
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '12.5px', marginBottom: '20px' }}>
              <div>
                <div><b>Billed To:</b> {selectedBillForPrint.clientName}</div>
                <div><b>Client ID:</b> {selectedBillForPrint.clientId}</div>
                <div><b>Case Docket:</b> {selectedBillForPrint.caseNumber || selectedBillForPrint.caseId}</div>
                <div><b>Court:</b> {selectedBillForPrint.courtName || 'Court of Civil / Criminal Judge'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div><b>Bill No:</b> {selectedBillForPrint.billNumber}</div>
                <div><b>Bill Date:</b> {selectedBillForPrint.billDate}</div>
                <div><b>Status:</b> {Number(selectedBillForPrint.paidAmount || 0) >= Number(selectedBillForPrint.totalBillAmount || 0) ? 'PAID' : 'DUE'}</div>
              </div>
            </div>

            {/* Invoice Line Items */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '20px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #0f172a' }}>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Description</th>
                  <th style={{ textAlign: 'right', padding: '8px', width: '120px' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px' }}>
                    <strong>Contract Fee / Retainer</strong>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{selectedBillForPrint.description || 'Legal counsel'}</div>
                  </td>
                  <td style={{ textAlign: 'right', padding: '8px', fontWeight: '600' }}>
                    ₹{Number(selectedBillForPrint.contractAmount || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
                {Number(selectedBillForPrint.additionalCharges || 0) > 0 && (
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px' }}>Additional Court &amp; Drafting Charges</td>
                    <td style={{ textAlign: 'right', padding: '8px', fontWeight: '600' }}>
                      ₹{Number(selectedBillForPrint.additionalCharges || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                )}
                {Number(selectedBillForPrint.discount || 0) > 0 && (
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#16a34a' }}>
                    <td style={{ padding: '8px' }}>Concession / Discount</td>
                    <td style={{ textAlign: 'right', padding: '8px', fontWeight: '600' }}>
                      -₹{Number(selectedBillForPrint.discount || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                )}
                <tr style={{ borderTop: '2px solid #0f172a', fontWeight: '800' }}>
                  <td style={{ padding: '10px 8px', fontSize: '14px' }}>Total Bill Amount</td>
                  <td style={{ textAlign: 'right', padding: '10px 8px', fontSize: '15px', color: '#1e3a8a' }}>
                    ₹{Number(selectedBillForPrint.totalBillAmount || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 8px', fontSize: '12px', color: '#16a34a' }}>Amount Paid So Far</td>
                  <td style={{ textAlign: 'right', padding: '6px 8px', fontSize: '13px', color: '#16a34a', fontWeight: '700' }}>
                    ₹{Number(selectedBillForPrint.paidAmount || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 8px', fontSize: '12px', color: '#dc2626' }}>Balance Payable</td>
                  <td style={{ textAlign: 'right', padding: '6px 8px', fontSize: '13px', color: '#dc2626', fontWeight: '800' }}>
                    ₹{Math.max(0, Number(selectedBillForPrint.totalBillAmount || 0) - Number(selectedBillForPrint.paidAmount || 0)).toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Signature Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '36px', paddingTop: '16px', borderTop: '1px dashed #cbd5e1' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Terms: Fees payable upon receipt or before appearance date.
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderTop: '1px solid #0f172a', width: '160px', paddingTop: '4px', fontSize: '12px', fontWeight: '700' }}>
                  Advocate Signature &amp; Seal
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button className="btn-secondary" onClick={() => setShowBillModal(false)}>Close</button>
              <button className="btn-primary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Printer size={14} /> Print Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: VIEW / PRINT PAYMENT RECEIPT MODAL                               */}
      {/* ========================================================================= */}
      {showReceiptModal && selectedReceiptForPrint && (
        <div className="modal-backdrop" onClick={() => setShowReceiptModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px', padding: '26px' }}>
            <div style={{ textAlign: 'center', borderBottom: '2px solid #059669', paddingBottom: '14px', marginBottom: '18px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>
                {OFFICE.name}
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#475569' }}>
                {OFFICE.address} · Phone: {OFFICE.phone}
              </p>
              <div style={{ marginTop: '10px', display: 'inline-block', background: '#059669', color: '#ffffff', padding: '3px 14px', fontWeight: '800', fontSize: '12px', borderRadius: '4px' }}>
                OFFICIAL PAYMENT RECEIPT
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '12px', marginBottom: '18px' }}>
              <div>
                <div><b>Receipt No:</b> {selectedReceiptForPrint.receiptNumber || selectedReceiptForPrint.id}</div>
                <div><b>Date:</b> {selectedReceiptForPrint.paymentDate}</div>
                <div><b>Client ID:</b> {selectedReceiptForPrint.clientId || 'CL-1001'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div><b>Case Docket:</b> {selectedReceiptForPrint.caseId}</div>
                <div><b>Mode:</b> {selectedReceiptForPrint.mode || 'Cash'}</div>
                {selectedReceiptForPrint.reference && <div><b>Txn Ref:</b> {selectedReceiptForPrint.reference}</div>}
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '18px', fontSize: '13px' }}>
              <p style={{ margin: '0 0 8px', color: '#334155' }}>
                Received with thanks from <strong>{selectedReceiptForPrint.clientName}</strong>:
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ecfdf5', padding: '10px 14px', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                <span style={{ fontWeight: '700', color: '#065f46' }}>Sum of:</span>
                <span style={{ fontSize: '20px', fontWeight: '900', color: '#047857' }}>
                  ₹{Number(selectedReceiptForPrint.amount || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#64748b' }}>
                <b>Particulars:</b> {selectedReceiptForPrint.remarks || 'Fee installment towards legal counsel'}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '28px', paddingTop: '14px', borderTop: '1px dashed #cbd5e1' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Thank you for your trust in our counsel.
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderTop: '1px solid #0f172a', width: '150px', paddingTop: '4px', fontSize: '11px', fontWeight: '700' }}>
                  Authorized Receiver
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button className="btn-secondary" onClick={() => setShowReceiptModal(false)}>Close</button>
              <button className="btn-primary" onClick={() => window.print()} style={{ background: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Printer size={14} /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CONFIRM DELETE MODAL                                             */}
      {/* ========================================================================= */}
      {showDeleteModal && (
        <div className="modal-backdrop" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', padding: '22px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '16px', fontWeight: '800', color: '#dc2626' }}>
              Confirm Deletion
            </h3>
            <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 18px', lineHeight: '1.5' }}>
              Are you sure you want to delete this {itemToDelete?.type}? Case balance and ledger entries will be updated automatically.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={confirmDelete} style={{ background: '#dc2626' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
