import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UploadCloud, FileText, Image as ImageIcon, Download, Trash2,
  Eye, Search, ArrowLeft, CheckCircle2, AlertCircle, ChevronRight,
  Filter, FileCheck, HardDrive, ShieldCheck, Plus, X
} from 'lucide-react'
import Topbar from '../components/Topbar.jsx'
import { OFFICE } from '../data/menu.js'
import {
  getClients, getCases, getDocuments, saveDocument,
  getDocumentById, deleteDocument, onStorageUpdate
} from '../services/storageService.js'
import './management.css'

export default function DocumentUploadSystem() {
  const navigate = useNavigate()
  const [clients, setClients] = useState(() => getClients())
  const [cases, setCases] = useState(() => getCases())
  const [documents, setDocuments] = useState(() => getDocuments())
  const [search, setSearch] = useState('')
  const [filterId, setFilterId] = useState('')
  const [filterType, setFilterType] = useState('')
  const [toast, setToast] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [previewDoc, setPreviewDoc] = useState(null)
  const [deleteDocTarget, setDeleteDocTarget] = useState(null)

  // Upload Form State
  const initialForm = {
    entityType: 'case', // 'case' | 'client' | 'idNumber'
    associatedId: '',
    idNumber: '',
    docType: 'Vakalatnama',
    docName: '',
    remarks: '',
  }
  const [uploadForm, setUploadForm] = useState(initialForm)
  const [selectedFile, setSelectedFile] = useState(null)
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    return onStorageUpdate(() => {
      setClients(getClients())
      setCases(getCases())
      setDocuments(getDocuments())
    })
  }, [])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = (type, message) => setToast({ type, message })

  // Handle file picker
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate size (max 15MB)
    const maxSize = 15 * 1024 * 1024
    if (file.size > maxSize) {
      showToast('error', 'File size exceeds 15MB limit. Please select a smaller file.')
      return
    }

    // Validate type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!validTypes.includes(file.type)) {
      showToast('error', 'Invalid file format. Allowed formats: PDF, JPG, PNG, DOC, DOCX.')
      return
    }

    setSelectedFile(file)
    if (!uploadForm.docName) {
      setUploadForm((prev) => ({ ...prev, docName: file.name }))
    }
    if (formErrors.file) setFormErrors((prev) => ({ ...prev, file: null }))
  }

  // Handle entity selection
  const handleEntitySelect = (e) => {
    const val = e.target.value
    if (!val) {
      setUploadForm((prev) => ({ ...prev, associatedId: '', idNumber: '' }))
      return
    }

    if (uploadForm.entityType === 'case') {
      const cs = cases.find((c) => c.id === val)
      setUploadForm((prev) => ({
        ...prev,
        associatedId: val,
        idNumber: cs ? cs.idNumber || '' : '',
      }))
    } else if (uploadForm.entityType === 'client') {
      setUploadForm((prev) => ({
        ...prev,
        associatedId: val,
        idNumber: '',
      }))
    } else {
      setUploadForm((prev) => ({
        ...prev,
        associatedId: val,
        idNumber: val,
      }))
    }
  }

  const handleUploadSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!uploadForm.associatedId.trim()) errs.associatedId = 'Please select or enter an Associated ID'
    if (!uploadForm.docName.trim()) errs.docName = 'Document Name is required'
    if (!selectedFile) errs.file = 'Please choose a file to upload'
    setFormErrors(errs)

    if (Object.keys(errs).length > 0) return

    setUploading(true)
    try {
      // Convert file to Base64 data URL
      const reader = new FileReader()
      reader.onload = async () => {
        const fileData = reader.result
        const docPayload = {
          entityType: uploadForm.entityType,
          associatedId: uploadForm.associatedId,
          idNumber: uploadForm.idNumber || '',
          docName: uploadForm.docName,
          docType: uploadForm.docType,
          fileSize: selectedFile.size,
          fileType: selectedFile.type,
          fileData,
          remarks: uploadForm.remarks,
        }

        const saved = await saveDocument(docPayload)
        setDocuments(getDocuments())
        setSelectedFile(null)
        setUploadForm({ ...initialForm, entityType: uploadForm.entityType, associatedId: uploadForm.associatedId })
        showToast('success', `Document "${saved.docName}" (${saved.id}) uploaded under ${saved.associatedId}!`)
        setUploading(false)
      }
      reader.onerror = () => {
        showToast('error', 'Failed to read file.')
        setUploading(false)
      }
      reader.readAsDataURL(selectedFile)
    } catch (err) {
      showToast('error', err.message || 'Upload failed.')
      setUploading(false)
    }
  }

  // Preview Document
  const handleOpenPreview = async (doc) => {
    const full = await getDocumentById(doc.id)
    setPreviewDoc(full || doc)
  }

  // Delete Document
  const confirmDeleteDoc = async () => {
    if (!deleteDocTarget) return
    try {
      await deleteDocument(deleteDocTarget.id)
      setDocuments(getDocuments())
      showToast('success', `Document ${deleteDocTarget.id} deleted.`)
    } catch (err) {
      showToast('error', err.message || 'Failed to delete document.')
    } finally {
      setDeleteDocTarget(null)
    }
  }

  // Filtered documents
  const filteredDocs = documents.filter((d) => {
    const q = search.toLowerCase()
    const matchesSearch =
      !search ||
      (d.docName && d.docName.toLowerCase().includes(q)) ||
      (d.associatedId && d.associatedId.toLowerCase().includes(q)) ||
      (d.idNumber && d.idNumber.toLowerCase().includes(q)) ||
      (d.docType && d.docType.toLowerCase().includes(q)) ||
      (d.remarks && d.remarks.toLowerCase().includes(q))

    const matchesId = !filterId || String(d.associatedId).toLowerCase().includes(filterId.toLowerCase()) || String(d.idNumber).toLowerCase().includes(filterId.toLowerCase())
    const matchesType = !filterType || d.docType === filterType

    return matchesSearch && matchesId && matchesType
  })

  // Format bytes to readable string
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 KB'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
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
            <span className="crumbs-muted">Data Entry</span>
            <ChevronRight size={12} className="crumbs-sep" />
            <b className="crumbs-active">ID-Wise Document Upload System</b>
          </div>

          <div className="mgmt-header">
            <div className="mgmt-header-left">
              <span className="mgmt-icon-badge" style={{ background: '#ede9fe', color: '#7c3aed', border: '1px solid #ddd6fe' }}>
                <UploadCloud size={20} strokeWidth={2.2} />
              </span>
              <div>
                <div className="mgmt-tag-row">
                  <span className="tag-violet">Module 9: Digital Legal Vault (IndexedDB Backed)</span>
                  <span className="tag-muted">{documents.length} Uploaded Files</span>
                </div>
                <h1 className="mgmt-title">ID-Wise Legal Document Repository</h1>
                <p className="mgmt-desc">Upload, preview, download, and archive case records, bail petitions, deeds &amp; evidence files</p>
              </div>
            </div>
            <div className="mgmt-header-actions">
              <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
                <ArrowLeft size={14} />
                <span>Dashboard</span>
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

          {/* Two Panel Layout */}
          <div className="mgmt-two-panel">
            {/* Upload Form */}
            <div className="mgmt-form-panel">
              <div className="panel-card-head">
                <div className="pch-title">
                  <span className="pch-dot pch-violet" />
                  <h3>Upload Legal Document Under ID</h3>
                </div>
                <span className="status-badge creating">Encrypted Storage</span>
              </div>

              <form className="mgmt-form" onSubmit={handleUploadSubmit}>
                {/* Entity Type Picker */}
                <div className="form-field">
                  <label className="field-lbl">1. Associate Document By ID Type <span className="req">*</span></label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    <button
                      type="button"
                      className={`btn-secondary ${uploadForm.entityType === 'case' ? 'active-tab' : ''}`}
                      style={uploadForm.entityType === 'case' ? { background: '#7c3aed', color: '#ffffff', borderColor: '#6d28d9', fontSize: '11px', padding: '6px' } : { fontSize: '11px', padding: '6px' }}
                      onClick={() => setUploadForm((prev) => ({ ...prev, entityType: 'case', associatedId: '' }))}
                    >
                      Case ID
                    </button>
                    <button
                      type="button"
                      className={`btn-secondary ${uploadForm.entityType === 'client' ? 'active-tab' : ''}`}
                      style={uploadForm.entityType === 'client' ? { background: '#7c3aed', color: '#ffffff', borderColor: '#6d28d9', fontSize: '11px', padding: '6px' } : { fontSize: '11px', padding: '6px' }}
                      onClick={() => setUploadForm((prev) => ({ ...prev, entityType: 'client', associatedId: '' }))}
                    >
                      Client ID
                    </button>
                    <button
                      type="button"
                      className={`btn-secondary ${uploadForm.entityType === 'idNumber' ? 'active-tab' : ''}`}
                      style={uploadForm.entityType === 'idNumber' ? { background: '#7c3aed', color: '#ffffff', borderColor: '#6d28d9', fontSize: '11px', padding: '6px' } : { fontSize: '11px', padding: '6px' }}
                      onClick={() => setUploadForm((prev) => ({ ...prev, entityType: 'idNumber', associatedId: '' }))}
                    >
                      ID Number (Ref)
                    </button>
                  </div>
                </div>

                {/* Associated ID Selector */}
                <div className="form-field">
                  <label className="field-lbl">
                    2. Select / Enter Associated {uploadForm.entityType === 'case' ? 'Case ID' : uploadForm.entityType === 'client' ? 'Client ID' : 'ID Number'} <span className="req">*</span>
                  </label>
                  {uploadForm.entityType === 'case' ? (
                    <select
                      className={`form-input form-select ${formErrors.associatedId ? 'input-err' : ''}`}
                      value={uploadForm.associatedId}
                      onChange={handleEntitySelect}
                    >
                      <option value="">-- Choose Registered Case --</option>
                      {cases.map((cs) => (
                        <option key={cs.id} value={cs.id}>
                          {cs.id} — {cs.caseNumber} ({cs.clientName})
                        </option>
                      ))}
                    </select>
                  ) : uploadForm.entityType === 'client' ? (
                    <select
                      className={`form-input form-select ${formErrors.associatedId ? 'input-err' : ''}`}
                      value={uploadForm.associatedId}
                      onChange={handleEntitySelect}
                    >
                      <option value="">-- Choose Registered Client --</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.id} — {c.name} ({c.phone})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. ID-101, ID-402"
                      className={`form-input ${formErrors.associatedId ? 'input-err' : ''}`}
                      value={uploadForm.associatedId}
                      onChange={(e) => setUploadForm((prev) => ({ ...prev, associatedId: e.target.value, idNumber: e.target.value }))}
                    />
                  )}
                  {formErrors.associatedId && <span className="err-msg">{formErrors.associatedId}</span>}
                </div>

                {/* Document Type */}
                <div className="form-row-2">
                  <div className="form-field">
                    <label className="field-lbl">Document Category <span className="req">*</span></label>
                    <select
                      className="form-input form-select"
                      value={uploadForm.docType}
                      onChange={(e) => setUploadForm((prev) => ({ ...prev, docType: e.target.value }))}
                    >
                      <option value="FIR Copy">FIR Copy</option>
                      <option value="Charge Sheet">Charge Sheet / CS</option>
                      <option value="Bail Petition">Bail Petition / Bail Order</option>
                      <option value="Vakalatnama">Vakalatnama</option>
                      <option value="Plaint / Written Statement">Plaint / Written Statement</option>
                      <option value="Order Sheet">Court Order Sheet</option>
                      <option value="Evidence Document">Evidence / Deposition</option>
                      <option value="Certified Deed">Certified Deed / Khatian</option>
                      <option value="Identity Proof">Client ID Proof (Aadhaar / Voter)</option>
                      <option value="Other">Other Legal Paper</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label className="field-lbl">Document Title / Display Name <span className="req">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. Bail_Order_ACJM.pdf"
                      className={`form-input ${formErrors.docName ? 'input-err' : ''}`}
                      value={uploadForm.docName}
                      onChange={(e) => setUploadForm((prev) => ({ ...prev, docName: e.target.value }))}
                    />
                    {formErrors.docName && <span className="err-msg">{formErrors.docName}</span>}
                  </div>
                </div>

                {/* File Dropzone / Picker */}
                <div className="form-field">
                  <label className="field-lbl">Select File to Upload (Max 15MB: PDF, JPG, PNG) <span className="req">*</span></label>
                  <div style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '16px', textAlign: 'center', background: '#f8fafc' }}>
                    <input
                      type="file"
                      id="docFileInput"
                      style={{ display: 'none' }}
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      onChange={handleFileChange}
                    />
                    <label htmlFor="docFileInput" style={{ cursor: 'pointer', display: 'block' }}>
                      <UploadCloud size={28} color="#7c3aed" style={{ margin: '0 auto 6px' }} />
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                        {selectedFile ? selectedFile.name : 'Click to Browse File from Computer'}
                      </div>
                      <small style={{ color: '#64748b', fontSize: '11px' }}>
                        {selectedFile ? `${formatBytes(selectedFile.size)} · ${selectedFile.type}` : 'Supports PDF, JPG, PNG & Word documents'}
                      </small>
                    </label>
                  </div>
                  {formErrors.file && <span className="err-msg">{formErrors.file}</span>}
                </div>

                {/* Remarks */}
                <div className="form-field">
                  <label className="field-lbl">Remarks / Document Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. Certified copy received from Contai Bench on 14/11"
                    className="form-input"
                    value={uploadForm.remarks}
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, remarks: e.target.value }))}
                  />
                </div>

                <div className="mgmt-btn-bar">
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={uploading}
                    style={{ background: '#7c3aed', borderColor: '#6d28d9', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <UploadCloud size={15} />
                    <span>{uploading ? 'Archiving Document...' : 'UPLOAD & SAVE TO ID'}</span>
                  </button>

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setSelectedFile(null)
                      setUploadForm(initialForm)
                      setFormErrors({})
                    }}
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>

            {/* Document Library Table */}
            <div className="mgmt-table-panel">
              <div className="panel-card-head">
                <div className="pch-title">
                  <span className="pch-dot pch-violet" />
                  <h3>Archived Documents Library</h3>
                </div>
                <span className="panel-count">{filteredDocs.length} Documents</span>
              </div>

              {/* Filters */}
              <div style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1', minWidth: '150px' }}>
                  <input
                    type="text"
                    placeholder="Search by name, ID or type..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="form-input"
                    style={{ fontSize: '12px' }}
                  />
                </div>
                <div style={{ width: '130px' }}>
                  <input
                    type="text"
                    placeholder="Filter by ID..."
                    value={filterId}
                    onChange={(e) => setFilterId(e.target.value)}
                    className="form-input"
                    style={{ fontSize: '12px' }}
                  />
                </div>
                <div style={{ width: '150px' }}>
                  <select
                    className="form-input form-select"
                    style={{ fontSize: '12px' }}
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="">All Document Types</option>
                    <option value="FIR Copy">FIR Copy</option>
                    <option value="Charge Sheet">Charge Sheet</option>
                    <option value="Bail Petition">Bail Petition</option>
                    <option value="Vakalatnama">Vakalatnama</option>
                    <option value="Evidence Document">Evidence Document</option>
                  </select>
                </div>
              </div>

              <div className="table-scroll-container">
                <table className="mgmt-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>ASSOCIATED ID</th>
                      <th>DOCUMENT NAME</th>
                      <th style={{ width: '120px' }}>CATEGORY</th>
                      <th style={{ width: '75px' }}>SIZE</th>
                      <th style={{ width: '110px' }}>UPLOADED</th>
                      <th style={{ width: '80px', textAlign: 'center' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="empty-table-cell">
                          <AlertCircle size={18} className="empty-ic" />
                          <span>No documents found matching criteria.</span>
                        </td>
                      </tr>
                    ) : (
                      filteredDocs.map((doc) => (
                        <tr key={doc.id}>
                          <td>
                            <span className="id-pill" style={{ background: '#ede9fe', color: '#6d28d9', fontWeight: '700' }}>
                              {doc.associatedId}
                            </span>
                            {doc.idNumber && doc.idNumber !== doc.associatedId && (
                              <small style={{ display: 'block', fontSize: '10px', color: '#64748b' }}>{doc.idNumber}</small>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {doc.fileType?.includes('pdf') ? (
                                <FileText size={15} color="#dc2626" />
                              ) : doc.fileType?.includes('image') ? (
                                <ImageIcon size={15} color="#2563eb" />
                              ) : (
                                <FileCheck size={15} color="#16a34a" />
                              )}
                              <div>
                                <strong className="primary-text">{doc.docName}</strong>
                                {doc.remarks && <small className="muted-subtext">{doc.remarks}</small>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: '11px', fontWeight: '600', color: '#334155' }}>{doc.docType}</span>
                          </td>
                          <td>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>{formatBytes(doc.fileSize)}</span>
                          </td>
                          <td>
                            <span className="cell-date">{doc.uploadDate}</span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                              <button
                                type="button"
                                className="btn-icon-subtle"
                                style={{ padding: '3px 6px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}
                                onClick={() => handleOpenPreview(doc)}
                                title="Preview Document"
                              >
                                <Eye size={12} color="#7c3aed" />
                              </button>
                              <a
                                href={doc.downloadUrl || '#'}
                                download={doc.docName}
                                className="btn-icon-subtle"
                                style={{ padding: '3px 6px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                                title="Download Document"
                              >
                                <Download size={12} color="#2563eb" />
                              </a>
                              <button
                                type="button"
                                className="btn-icon-subtle"
                                style={{ padding: '3px 6px', border: '1px solid #fecaca', background: '#fff1f2', cursor: 'pointer' }}
                                onClick={() => setDeleteDocTarget(doc)}
                                title="Delete Document"
                              >
                                <Trash2 size={12} color="#dc2626" />
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

          {/* ================= PREVIEW MODAL ================= */}
          {previewDoc && (
            <div className="mgmt-modal-overlay" onClick={() => setPreviewDoc(null)}>
              <div className="mgmt-modal-box" style={{ maxWidth: '750px', width: '92%' }} onClick={(e) => e.stopPropagation()}>
                <div className="mgmt-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>
                      Document Preview: {previewDoc.docName}
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                      Associated ID: {previewDoc.associatedId} · Category: {previewDoc.docType} · Size: {formatBytes(previewDoc.fileSize)}
                    </p>
                  </div>
                  <button className="clear-search-btn" onClick={() => setPreviewDoc(null)}>✕</button>
                </div>

                <div style={{ margin: '16px 0', minHeight: '260px', maxHeight: '450px', overflowY: 'auto', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                  {previewDoc.fileData && previewDoc.fileType?.includes('image') ? (
                    <img src={previewDoc.fileData} alt={previewDoc.docName} style={{ maxWidth: '100%', maxHeight: '420px', borderRadius: '4px', objectFit: 'contain' }} />
                  ) : previewDoc.fileData && previewDoc.fileType?.includes('pdf') ? (
                    <iframe src={previewDoc.fileData} title={previewDoc.docName} style={{ width: '100%', height: '420px', border: 'none' }} />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '30px' }}>
                      <FileText size={48} color="#7c3aed" style={{ margin: '0 auto 12px' }} />
                      <h4 style={{ margin: '0 0 6px', fontSize: '15px', color: '#0f172a' }}>{previewDoc.docName}</h4>
                      <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b' }}>
                        Archived under ID <strong>{previewDoc.associatedId}</strong> in the digital case vault.
                      </p>
                      <a
                        href={previewDoc.fileData || previewDoc.downloadUrl || '#'}
                        download={previewDoc.docName}
                        className="btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Download size={14} /> Download Document
                      </a>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <a
                    href={previewDoc.fileData || previewDoc.downloadUrl || '#'}
                    download={previewDoc.docName}
                    className="btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Download size={14} /> Download File
                  </a>
                  <button className="btn-secondary" onClick={() => setPreviewDoc(null)}>Close</button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Modal */}
          {deleteDocTarget && (
            <div className="mgmt-modal-overlay" onClick={() => setDeleteDocTarget(null)}>
              <div className="mgmt-modal-box" style={{ maxWidth: '420px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fee2e2', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Trash2 size={18} color="#dc2626" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#991b1b' }}>Delete Document?</h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>Permanent deletion from vault.</p>
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: '#334155', lineHeight: '1.5', margin: '10px 0 16px' }}>
                  Are you sure you want to delete <strong>{deleteDocTarget.docName}</strong> associated with ID <strong>{deleteDocTarget.associatedId}</strong>?
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button className="btn-secondary" onClick={() => setDeleteDocTarget(null)}>Cancel</button>
                  <button className="btn-primary" style={{ background: '#dc2626', borderColor: '#b91c1c' }} onClick={confirmDeleteDoc}>
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
