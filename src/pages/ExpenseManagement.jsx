import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingDown, Tags, Save, RefreshCw, Printer, XCircle, Search,
  Calendar, ArrowLeft, CheckCircle2, AlertCircle, ChevronRight,
  IndianRupee, Trash2, Plus, Edit3, ShieldAlert, Download, Layers
} from 'lucide-react'
import Topbar from '../components/Topbar.jsx'
import { OFFICE } from '../data/menu.js'
import {
  getExpenseHeads, saveExpenseHead, updateExpenseHead, deleteExpenseHead,
  getExpenses, saveExpense, updateExpense, deleteExpense,
  getExpenseHeadWiseSummary, onStorageUpdate
} from '../services/storageService.js'
import './management.css'

export default function ExpenseManagement({ initialTab = 'expenses' }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(initialTab) // 'expenses' | 'heads' | 'summary'
  const [heads, setHeads] = useState(() => getExpenseHeads())
  const [expenses, setExpenses] = useState(() => getExpenses())
  const [toast, setToast] = useState(null)
  const [search, setSearch] = useState('')
  const [headFilter, setHeadFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Expense Form State
  const initialExpenseForm = {
    headId: '',
    headName: '',
    expenseDate: new Date().toISOString().split('T')[0],
    amount: '',
    paidTo: '',
    paymentMode: 'Cash',
    description: '',
    remarks: '',
  }
  const [expenseForm, setExpenseForm] = useState(initialExpenseForm)
  const [selectedExpenseId, setSelectedExpenseId] = useState(null)
  const [expenseErrors, setExpenseErrors] = useState({})

  // Expense Head Form State
  const initialHeadForm = { name: '', description: '' }
  const [headForm, setHeadForm] = useState(initialHeadForm)
  const [selectedHeadId, setSelectedHeadId] = useState(null)
  const [headErrors, setHeadErrors] = useState({})

  // Deletion modals
  const [itemToDelete, setItemToDelete] = useState(null) // { type: 'expense' | 'head', item: ... }

  useEffect(() => {
    return onStorageUpdate(() => {
      setHeads(getExpenseHeads())
      setExpenses(getExpenses())
    })
  }, [])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = (type, message) => setToast({ type, message })

  // ---------------- Expense Form Handlers ----------------
  const handleHeadSelect = (e) => {
    const hid = e.target.value
    const matched = heads.find((h) => h.id === hid)
    setExpenseForm((prev) => ({
      ...prev,
      headId: hid,
      headName: matched ? matched.name : '',
    }))
    if (expenseErrors.headId) setExpenseErrors((prev) => ({ ...prev, headId: null }))
  }

  const handleExpenseChange = (e) => {
    const { name, value } = e.target
    setExpenseForm((prev) => ({ ...prev, [name]: value }))
    if (expenseErrors[name]) setExpenseErrors((prev) => ({ ...prev, [name]: null }))
  }

  const validateExpenseForm = () => {
    const errs = {}
    if (!expenseForm.headId) errs.headId = 'Select an Expense Head category'
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) errs.amount = 'Enter valid expense amount'
    if (!expenseForm.expenseDate) errs.expenseDate = 'Expense date is required'
    if (!expenseForm.description.trim()) errs.description = 'Expense description is required'
    setExpenseErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSaveExpense = (e) => {
    e.preventDefault()
    if (!validateExpenseForm()) return
    try {
      const saved = saveExpense(expenseForm)
      setSelectedExpenseId(saved.id)
      showToast('success', `Recorded expense ${saved.id} of ₹${Number(saved.amount).toLocaleString('en-IN')}`)
    } catch (err) {
      showToast('error', err.message || 'Failed to save expense.')
    }
  }

  const handleUpdateExpense = (e) => {
    e.preventDefault()
    if (!selectedExpenseId) return
    if (!validateExpenseForm()) return
    try {
      const updated = updateExpense(selectedExpenseId, expenseForm)
      showToast('success', `Updated expense ${updated.id}`)
    } catch (err) {
      showToast('error', err.message || 'Failed to update expense.')
    }
  }

  const handleSelectExpense = (ex) => {
    setSelectedExpenseId(ex.id)
    setExpenseForm({
      headId: ex.headId || '',
      headName: ex.headName || '',
      expenseDate: ex.expenseDate || '',
      amount: String(ex.amount || ''),
      paidTo: ex.paidTo || '',
      paymentMode: ex.paymentMode || 'Cash',
      description: ex.description || '',
      remarks: ex.remarks || '',
    })
    setExpenseErrors({})
  }

  const handleClearExpense = () => {
    setSelectedExpenseId(null)
    setExpenseForm(initialExpenseForm)
    setExpenseErrors({})
  }

  // ---------------- Expense Head Form Handlers ----------------
  const handleHeadChange = (e) => {
    const { name, value } = e.target
    setHeadForm((prev) => ({ ...prev, [name]: value }))
    if (headErrors[name]) setHeadErrors((prev) => ({ ...prev, [name]: null }))
  }

  const validateHeadForm = () => {
    const errs = {}
    if (!headForm.name.trim()) errs.name = 'Expense Head name is required'
    setHeadErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSaveHead = (e) => {
    e.preventDefault()
    if (!validateHeadForm()) return
    try {
      const saved = saveExpenseHead(headForm)
      setSelectedHeadId(saved.id)
      showToast('success', `Created Expense Head "${saved.name}" (${saved.id})`)
      setHeadForm(initialHeadForm)
    } catch (err) {
      showToast('error', err.message || 'Failed to save head.')
    }
  }

  const handleUpdateHead = (e) => {
    e.preventDefault()
    if (!selectedHeadId) return
    if (!validateHeadForm()) return
    try {
      const updated = updateExpenseHead(selectedHeadId, headForm)
      showToast('success', `Updated Expense Head "${updated.name}"`)
    } catch (err) {
      showToast('error', err.message || 'Failed to update head.')
    }
  }

  const handleSelectHead = (h) => {
    setSelectedHeadId(h.id)
    setHeadForm({
      name: h.name || '',
      description: h.description || '',
    })
    setHeadErrors({})
  }

  const handleClearHead = () => {
    setSelectedHeadId(null)
    setHeadForm(initialHeadForm)
    setHeadErrors({})
  }

  // Confirm delete
  const confirmDelete = () => {
    if (!itemToDelete) return
    try {
      if (itemToDelete.type === 'expense') {
        deleteExpense(itemToDelete.item.id)
        if (selectedExpenseId === itemToDelete.item.id) handleClearExpense()
        showToast('success', `Expense ${itemToDelete.item.id} deleted.`)
      } else if (itemToDelete.type === 'head') {
        deleteExpenseHead(itemToDelete.item.id)
        if (selectedHeadId === itemToDelete.item.id) handleClearHead()
        showToast('success', `Expense Head "${itemToDelete.item.name}" deleted.`)
      }
    } catch (err) {
      showToast('error', err.message || 'Deletion failed.')
    } finally {
      setItemToDelete(null)
    }
  }

  // Filtered expenses
  const filteredExpenses = expenses.filter((ex) => {
    const q = search.toLowerCase()
    const matchesSearch =
      !search ||
      (ex.description && ex.description.toLowerCase().includes(q)) ||
      (ex.headName && ex.headName.toLowerCase().includes(q)) ||
      (ex.paidTo && ex.paidTo.toLowerCase().includes(q)) ||
      (ex.id && ex.id.toLowerCase().includes(q)) ||
      (ex.remarks && ex.remarks.toLowerCase().includes(q))

    const matchesHead = !headFilter || ex.headId === headFilter
    const matchesDateFrom = !dateFrom || ex.expenseDate >= dateFrom
    const matchesDateTo = !dateTo || ex.expenseDate <= dateTo
    return matchesSearch && matchesHead && matchesDateFrom && matchesDateTo
  })

  const totalFilteredExpense = filteredExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0)
  const headWiseSummary = getExpenseHeadWiseSummary()

  const handleExportCSV = () => {
    const headers = ['Expense ID', 'Date', 'Expense Head', 'Paid To', 'Mode', 'Amount (INR)', 'Description', 'Remarks']
    const rows = filteredExpenses.map((e) => [
      e.id,
      e.expenseDate,
      `"${e.headName}"`,
      `"${e.paidTo || ''}"`,
      e.paymentMode,
      e.amount,
      `"${e.description || ''}"`,
      `"${e.remarks || ''}"`,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Expense_Report_${new Date().toISOString().split('T')[0]}.csv`)
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
            <span className="crumbs-muted">Master &amp; Operations</span>
            <ChevronRight size={12} className="crumbs-sep" />
            <b className="crumbs-active">Expense Head Master &amp; Expenses</b>
          </div>

          <div className="mgmt-header">
            <div className="mgmt-header-left">
              <span className="mgmt-icon-badge" style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>
                <TrendingDown size={20} strokeWidth={2.2} />
              </span>
              <div>
                <div className="mgmt-tag-row">
                  <span className="tag-muted">Module 7: Chambers Expenditure Control</span>
                  <span className="tag-muted">{heads.length} Heads · {expenses.length} Records</span>
                </div>
                <h1 className="mgmt-title">Expense Head Master &amp; Expenditure</h1>
                <p className="mgmt-desc">Configure expense categories, record court stamps, conveyances &amp; track expenditure statements</p>
              </div>
            </div>
            <div className="mgmt-header-actions">
              <button
                className={`btn-secondary ${activeTab === 'expenses' ? 'active-tab' : ''}`}
                style={activeTab === 'expenses' ? { background: '#0f172a', color: '#ffffff' } : {}}
                onClick={() => setActiveTab('expenses')}
              >
                <TrendingDown size={14} />
                <span>Expense Entries</span>
              </button>
              <button
                className={`btn-secondary ${activeTab === 'heads' ? 'active-tab' : ''}`}
                style={activeTab === 'heads' ? { background: '#0f172a', color: '#ffffff' } : {}}
                onClick={() => setActiveTab('heads')}
              >
                <Tags size={14} />
                <span>Expense Head Master</span>
              </button>
              <button
                className={`btn-secondary ${activeTab === 'summary' ? 'active-tab' : ''}`}
                style={activeTab === 'summary' ? { background: '#0f172a', color: '#ffffff' } : {}}
                onClick={() => setActiveTab('summary')}
              >
                <Layers size={14} />
                <span>Head-Wise Summary</span>
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
              <span>{toast.message}</span>
            </div>
          )}

          {/* ================= TAB 1: EXPENSE ENTRIES ================= */}
          {activeTab === 'expenses' && (
            <div className="mgmt-two-panel">
              {/* Form */}
              <div className="mgmt-form-panel">
                <div className="panel-card-head">
                  <div className="pch-title">
                    <span className="pch-dot" style={{ background: '#d97706' }} />
                    <h3>{selectedExpenseId ? `Edit Expense (${selectedExpenseId})` : 'Record Chamber Expense'}</h3>
                  </div>
                  {selectedExpenseId ? (
                    <span className="status-badge editing">Editing Voucher</span>
                  ) : (
                    <span className="status-badge creating">New Entry</span>
                  )}
                </div>

                <form className="mgmt-form" onSubmit={(e) => e.preventDefault()}>
                  <div className="form-field">
                    <label className="field-lbl">Expense Head Category <span className="req">*</span></label>
                    <select
                      name="headId"
                      className={`form-input form-select ${expenseErrors.headId ? 'input-err' : ''}`}
                      value={expenseForm.headId}
                      onChange={handleHeadSelect}
                    >
                      <option value="">-- Choose Expense Head --</option>
                      {heads.map((h) => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                    {expenseErrors.headId && <span className="err-msg">{expenseErrors.headId}</span>}
                  </div>

                  <div className="form-row-2">
                    <div className="form-field">
                      <label className="field-lbl">Expense Date <span className="req">*</span></label>
                      <input
                        type="date"
                        name="expenseDate"
                        className={`form-input ${expenseErrors.expenseDate ? 'input-err' : ''}`}
                        value={expenseForm.expenseDate}
                        onChange={handleExpenseChange}
                      />
                    </div>
                    <div className="form-field">
                      <label className="field-lbl">Amount (₹) <span className="req">*</span></label>
                      <div className="input-with-icon">
                        <IndianRupee size={14} className="input-ic" />
                        <input
                          type="number"
                          name="amount"
                          placeholder="Amount in Rupees"
                          className={`form-input ${expenseErrors.amount ? 'input-err' : ''}`}
                          value={expenseForm.amount}
                          onChange={handleExpenseChange}
                        />
                      </div>
                      {expenseErrors.amount && <span className="err-msg">{expenseErrors.amount}</span>}
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-field">
                      <label className="field-lbl">Paid To / Beneficiary</label>
                      <input
                        type="text"
                        name="paidTo"
                        placeholder="e.g. Treasury vendor, clerk, cab..."
                        className="form-input"
                        value={expenseForm.paidTo}
                        onChange={handleExpenseChange}
                      />
                    </div>
                    <div className="form-field">
                      <label className="field-lbl">Payment Mode</label>
                      <select
                        name="paymentMode"
                        className="form-input form-select"
                        value={expenseForm.paymentMode}
                        onChange={handleExpenseChange}
                      >
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="Bank">Bank Transfer</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-field">
                    <label className="field-lbl">Description / Item Particulars <span className="req">*</span></label>
                    <textarea
                      name="description"
                      rows={2}
                      placeholder="e.g. Court fees stamps for Title Suit 108/2026..."
                      className={`form-input form-textarea ${expenseErrors.description ? 'input-err' : ''}`}
                      value={expenseForm.description}
                      onChange={handleExpenseChange}
                    />
                    {expenseErrors.description && <span className="err-msg">{expenseErrors.description}</span>}
                  </div>

                  <div className="form-field">
                    <label className="field-lbl">Remarks / Voucher Ref No.</label>
                    <input
                      type="text"
                      name="remarks"
                      placeholder="e.g. Bill #492, Cash memo attached"
                      className="form-input"
                      value={expenseForm.remarks}
                      onChange={handleExpenseChange}
                    />
                  </div>

                  <div className="mgmt-btn-bar">
                    <button
                      type="button"
                      className="act-btn btn-save"
                      onClick={handleSaveExpense}
                      disabled={!!selectedExpenseId}
                      style={{ background: '#d97706', borderColor: '#b45309', color: '#ffffff' }}
                    >
                      <Save size={14} />
                      <span>SAVE EXPENSE</span>
                    </button>

                    <button
                      type="button"
                      className="act-btn btn-update"
                      onClick={handleUpdateExpense}
                      disabled={!selectedExpenseId}
                    >
                      <RefreshCw size={14} />
                      <span>UPDATE</span>
                    </button>

                    {selectedExpenseId && (
                      <button
                        type="button"
                        className="act-btn"
                        style={{ background: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' }}
                        onClick={() => setItemToDelete({ type: 'expense', item: { id: selectedExpenseId } })}
                      >
                        <Trash2 size={14} />
                        <span>DELETE</span>
                      </button>
                    )}

                    <button type="button" className="act-btn btn-clear" onClick={handleClearExpense}>
                      <XCircle size={14} />
                      <span>CLEAR</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Table */}
              <div className="mgmt-table-panel">
                <div className="panel-card-head">
                  <div className="pch-title">
                    <span className="pch-dot" style={{ background: '#d97706' }} />
                    <h3>Expenditure Register</h3>
                  </div>
                  <span className="panel-count">Total: ₹{Number(totalFilteredExpense).toLocaleString('en-IN')}</span>
                </div>

                {/* Search & Filter Bar */}
                <div style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1', minWidth: '150px' }}>
                    <input
                      type="text"
                      placeholder="Search description, paid to, voucher..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="form-input"
                      style={{ fontSize: '12px' }}
                    />
                  </div>
                  <div style={{ width: '160px' }}>
                    <select
                      className="form-input form-select"
                      style={{ fontSize: '12px' }}
                      value={headFilter}
                      onChange={(e) => setHeadFilter(e.target.value)}
                    >
                      <option value="">All Expense Heads</option>
                      {heads.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="table-scroll-container">
                  <table className="mgmt-table table-fluid">
                    <thead>
                      <tr>
                        <th className="nowrap-col" style={{ width: '85px' }}>VOUCHER NUMBER</th>
                        <th className="nowrap-col" style={{ width: '85px' }}>DATE</th>
                        <th style={{ width: '130px' }}>EXPENSE HEAD</th>
                        <th style={{ width: '110px' }}>PAID TO</th>
                        <th>DESCRIPTION</th>
                        <th className="nowrap-col" style={{ width: '95px', textAlign: 'right' }}>AMOUNT</th>
                        <th className="nowrap-col" style={{ width: '75px', textAlign: 'right' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExpenses.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="empty-table-cell">
                            <AlertCircle size={18} className="empty-ic" />
                            <span>No expense vouchers match query.</span>
                          </td>
                        </tr>
                      ) : (
                        filteredExpenses.map((ex) => {
                          const isSelected = ex.id === selectedExpenseId
                          return (
                            <tr
                              key={ex.id}
                              className={`table-row-clickable ${isSelected ? 'row-selected' : ''}`}
                              onClick={() => handleSelectExpense(ex)}
                            >
                              <td className="nowrap-col"><span className="id-pill" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>{ex.id}</span></td>
                              <td className="nowrap-col"><span className="cell-date">{ex.expenseDate}</span></td>
                              <td>
                                <strong className="primary-text" style={{ fontSize: '12px' }}>{ex.headName}</strong>
                              </td>
                              <td>
                                <span style={{ fontSize: '12px', color: '#1e293b', fontWeight: '500' }}>
                                  {ex.paidTo || '—'}
                                </span>
                                {ex.paymentMode && (
                                  <small className="muted-subtext" style={{ display: 'block', fontSize: '10.5px' }}>
                                    {ex.paymentMode}
                                  </small>
                                )}
                              </td>
                              <td style={{ maxWidth: '240px' }}>
                                <div
                                  title={`${ex.description || ''}${ex.remarks ? ` (Ref: ${ex.remarks})` : ''}`}
                                  style={{
                                    fontSize: '12px',
                                    color: '#334155',
                                    lineHeight: '1.35',
                                    wordBreak: 'break-word',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                  }}
                                >
                                  {ex.description}
                                </div>
                                {ex.remarks && (
                                  <small className="muted-subtext" style={{ display: 'block', fontSize: '10.5px' }}>
                                    Ref: {ex.remarks}
                                  </small>
                                )}
                              </td>
                              <td className="nowrap-col" style={{ textAlign: 'right' }}>
                                <span style={{ color: '#d97706', fontWeight: '800', fontSize: '13px' }}>
                                  ₹{Number(ex.amount || 0).toLocaleString('en-IN')}
                                </span>
                              </td>
                              <td className="nowrap-col" style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                                  <button
                                    type="button"
                                    className="btn-icon-subtle"
                                    style={{ padding: '3px 6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleSelectExpense(ex)
                                    }}
                                    title="Edit Expense"
                                  >
                                    <Edit3 size={12} color="#475569" />
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-icon-subtle"
                                    style={{ padding: '3px 6px', border: '1px solid #fecaca', background: '#fff1f2', cursor: 'pointer' }}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setItemToDelete({ type: 'expense', item: ex })
                                    }}
                                    title="Delete Expense"
                                  >
                                    <Trash2 size={12} color="#dc2626" />
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

          {/* ================= TAB 2: EXPENSE HEAD MASTER ================= */}
          {activeTab === 'heads' && (
            <div className="mgmt-two-panel">
              {/* Head Form */}
              <div className="mgmt-form-panel">
                <div className="panel-card-head">
                  <div className="pch-title">
                    <span className="pch-dot" style={{ background: '#6366f1' }} />
                    <h3>{selectedHeadId ? `Edit Expense Head (${selectedHeadId})` : 'New Expense Head Category'}</h3>
                  </div>
                  {selectedHeadId ? (
                    <span className="status-badge editing">Editing Head</span>
                  ) : (
                    <span className="status-badge creating">New Category</span>
                  )}
                </div>

                <form className="mgmt-form" onSubmit={(e) => e.preventDefault()}>
                  <div className="form-field">
                    <label className="field-lbl">Head Name / Category <span className="req">*</span></label>
                    <input
                      type="text"
                      name="name"
                      placeholder="e.g. Court Fees & Stamp Duty, Travel, Photocopy..."
                      className={`form-input ${headErrors.name ? 'input-err' : ''}`}
                      value={headForm.name}
                      onChange={handleHeadChange}
                      autoFocus
                    />
                    {headErrors.name && <span className="err-msg">{headErrors.name}</span>}
                  </div>

                  <div className="form-field">
                    <label className="field-lbl">Description / Scope</label>
                    <textarea
                      name="description"
                      rows={3}
                      placeholder="Enter description of what this ledger head covers..."
                      className="form-input form-textarea"
                      value={headForm.description}
                      onChange={handleHeadChange}
                    />
                  </div>

                  <div className="mgmt-btn-bar">
                    <button
                      type="button"
                      className="act-btn btn-save"
                      onClick={handleSaveHead}
                      disabled={!!selectedHeadId}
                    >
                      <Save size={14} />
                      <span>SAVE HEAD</span>
                    </button>

                    <button
                      type="button"
                      className="act-btn btn-update"
                      onClick={handleUpdateHead}
                      disabled={!selectedHeadId}
                    >
                      <RefreshCw size={14} />
                      <span>UPDATE</span>
                    </button>

                    {selectedHeadId && (
                      <button
                        type="button"
                        className="act-btn"
                        style={{ background: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' }}
                        onClick={() => {
                          const h = heads.find((x) => x.id === selectedHeadId)
                          if (h) setItemToDelete({ type: 'head', item: h })
                        }}
                      >
                        <Trash2 size={14} />
                        <span>DELETE</span>
                      </button>
                    )}

                    <button type="button" className="act-btn btn-clear" onClick={handleClearHead}>
                      <XCircle size={14} />
                      <span>CLEAR</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Heads Table */}
              <div className="mgmt-table-panel">
                <div className="panel-card-head">
                  <div className="pch-title">
                    <span className="pch-dot" style={{ background: '#6366f1' }} />
                    <h3>Configured Expense Heads</h3>
                  </div>
                  <span className="panel-count">{heads.length} Master Heads</span>
                </div>

                <div className="table-scroll-container">
                  <table className="mgmt-table">
                    <thead>
                      <tr>
                        <th style={{ width: '80px' }}>HEAD ID</th>
                        <th>HEAD NAME</th>
                        <th>DESCRIPTION</th>
                        <th style={{ width: '80px' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {heads.map((h) => {
                        const isSelected = h.id === selectedHeadId
                        return (
                          <tr
                            key={h.id}
                            className={`table-row-clickable ${isSelected ? 'row-selected' : ''}`}
                            onClick={() => handleSelectHead(h)}
                          >
                            <td><span className="id-pill" style={{ background: '#ede9fe', color: '#6d28d9', border: '1px solid #ddd6fe' }}>{h.id}</span></td>
                            <td><strong className="primary-text">{h.name}</strong></td>
                            <td><span style={{ fontSize: '12px', color: '#64748b' }}>{h.description || '—'}</span></td>
                            <td>
                              <button
                                type="button"
                                className="btn-icon-subtle"
                                style={{ padding: '3px 6px', border: '1px solid #fecaca', background: '#fff1f2', cursor: 'pointer' }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setItemToDelete({ type: 'head', item: h })
                                }}
                                title="Delete Expense Head"
                              >
                                <Trash2 size={12} color="#dc2626" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: HEAD-WISE SUMMARY ================= */}
          {activeTab === 'summary' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                {headWiseSummary.map((h) => (
                  <div key={h.id} className="panel" style={{ padding: '16px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className="id-pill" style={{ background: '#fef3c7', color: '#92400e', fontSize: '11px' }}>{h.id}</span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>{h.count} Vouchers</span>
                    </div>
                    <h4 style={{ margin: '8px 0 4px', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{h.name}</h4>
                    <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#64748b', minHeight: '32px' }}>{h.description || 'Chamber expenditure head'}</p>
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700' }}>Total Spent</span>
                      <strong style={{ fontSize: '16px', color: '#d97706' }}>₹{Number(h.total).toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Banner */}
              <div className="panel" style={{ padding: '16px 20px', background: '#0f172a', color: '#ffffff', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Overall Expenditure Across All Heads</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>Cumulative recorded office and court case expenses</p>
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#fbbf24' }}>
                  ₹{Number(expenses.reduce((s, e) => s + Number(e.amount || 0), 0)).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {itemToDelete && (
            <div className="mgmt-modal-overlay" onClick={() => setItemToDelete(null)}>
              <div className="mgmt-modal-box" style={{ maxWidth: '440px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fee2e2', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Trash2 size={18} color="#dc2626" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#991b1b' }}>
                      Delete {itemToDelete.type === 'expense' ? 'Expense Voucher' : 'Expense Head'}?
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>Action cannot be undone.</p>
                  </div>
                </div>

                <p style={{ fontSize: '13px', color: '#334155', lineHeight: '1.5', margin: '10px 0 16px' }}>
                  {itemToDelete.type === 'head' ? (
                    <>Are you sure you want to delete Expense Head <strong>"{itemToDelete.item.name}"</strong>? If any expenses are currently linked to this head, deletion will be blocked to maintain audit integrity.</>
                  ) : (
                    <>Are you sure you want to delete expense voucher <strong>{itemToDelete.item.id}</strong> (₹{Number(itemToDelete.item.amount || 0).toLocaleString('en-IN')})?</>
                  )}
                </p>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button className="btn-secondary" onClick={() => setItemToDelete(null)}>Cancel</button>
                  <button
                    className="btn-primary"
                    style={{ background: '#dc2626', borderColor: '#b91c1c' }}
                    onClick={confirmDelete}
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
