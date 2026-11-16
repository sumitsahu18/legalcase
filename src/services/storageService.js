// ==========================================================================
// Comprehensive Database & Persistent Storage Service for LegalCase Suite
// Supports Clients, Cases, Payments, Due List, Daily Collections,
// Expense Heads, Expenses, Consultancy Fees, Documents (IndexedDB backed),
// Next Date Reminders, Extra Briefs, and Waiting List.
// ==========================================================================

const STORAGE_PREFIX = 'legalcase_'
const CLIENTS_KEY = `${STORAGE_PREFIX}clients_data_v2`
const CASES_KEY = `${STORAGE_PREFIX}cases_data_v2`
const PAYMENTS_KEY = `${STORAGE_PREFIX}payments_data_v2`
const EXPENSE_HEADS_KEY = `${STORAGE_PREFIX}expense_heads_v2`
const EXPENSES_KEY = `${STORAGE_PREFIX}expenses_data_v2`
const CONSULTANCY_KEY = `${STORAGE_PREFIX}consultancy_fees_v2`
const DOCUMENTS_META_KEY = `${STORAGE_PREFIX}documents_meta_v2`
const REMINDERS_KEY = `${STORAGE_PREFIX}reminders_data_v2`
const EXTRA_BRIEFS_KEY = `${STORAGE_PREFIX}extra_briefs_v2`
const WAITING_LIST_KEY = `${STORAGE_PREFIX}waiting_list_v2`

const EVENT_NAME = 'legalcase_storage_updated'
const IDB_NAME = 'LegalCaseAppDB'
const IDB_VERSION = 1
const IDB_DOCS_STORE = 'documents_store'

// ----------------- IndexedDB Helper for Permanent File Storage -----------------
function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null)
      return
    }
    const req = window.indexedDB.open(IDB_NAME, IDB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(IDB_DOCS_STORE)) {
        db.createObjectStore(IDB_DOCS_STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => {
      console.warn('IndexedDB open error:', req.error)
      resolve(null)
    }
  })
}

async function idbSaveDocument(doc) {
  try {
    const db = await openDB()
    if (!db) return
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_DOCS_STORE, 'readwrite')
      const store = tx.objectStore(IDB_DOCS_STORE)
      store.put(doc)
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => resolve(false)
    })
  } catch (err) {
    console.error('idbSaveDocument error:', err)
  }
}

async function idbGetDocument(id) {
  try {
    const db = await openDB()
    if (!db) return null
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_DOCS_STORE, 'readonly')
      const store = tx.objectStore(IDB_DOCS_STORE)
      const req = store.get(id)
      req.onsuccess = () => resolve(req.result || null)
      req.onerror = () => resolve(null)
    })
  } catch (err) {
    console.error('idbGetDocument error:', err)
    return null
  }
}

async function idbDeleteDocument(id) {
  try {
    const db = await openDB()
    if (!db) return
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_DOCS_STORE, 'readwrite')
      const store = tx.objectStore(IDB_DOCS_STORE)
      store.delete(id)
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => resolve(false)
    })
  } catch (err) {
    console.error('idbDeleteDocument error:', err)
  }
}

// ----------------- Dispatch Event -----------------
export function dispatchStorageEvent() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_NAME))
  }
}

export function onStorageUpdate(callback) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(EVENT_NAME, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(EVENT_NAME, callback)
    window.removeEventListener('storage', callback)
  }
}

// ----------------- SEED DATA -----------------
const SEED_CLIENTS = [
  {
    id: 'CL-1001',
    name: 'Rajesh Kumar Sharma',
    relation: 'S/O Late Ramesh Sharma',
    address: 'Vill-Digha, PO-Digha, PS-Digha, Medinipur East, PIN-721428',
    phone: '9832104512',
    extraPhone: '9434198230',
    referenceName: 'Subhasish Mondal (Pradhan)',
    referencePhone: '9434198230',
    clientCategory: 'Criminal',
    casePosition: 'Accused / Bail',
    urgency: 'Urgent',
    feeAgreement: 'Lump Sum Agreed',
    fees: 15000,
    date: '2026-08-14',
    notes: 'Regular appearance required. Police charge sheet pending scrutiny.',
    createdAt: '2026-08-14T10:30:00.000Z',
  },
  {
    id: 'CL-1002',
    name: 'Sunita Devi Adhikari',
    relation: 'W/O Pradip Adhikari',
    address: 'Station Road, Contai, PS-Contai, Medinipur East, PIN-721401',
    phone: '9733481290',
    extraPhone: '9830219401',
    referenceName: 'Advocate B. K. Patra',
    referencePhone: '9830219401',
    clientCategory: 'Civil',
    casePosition: 'Petitioner / Plaintiff',
    urgency: 'Normal',
    feeAgreement: 'Stage-wise Retainer',
    fees: 25000,
    date: '2026-09-02',
    notes: 'Injunction petition filed under Order 39 Rule 1 & 2 CPC.',
    createdAt: '2026-09-02T11:15:00.000Z',
  },
  {
    id: 'CL-1003',
    name: 'Debashis Roy Chowdhury',
    relation: 'S/O Manoranjan Roy',
    address: 'Bhograi Bazar, Jaleswar Border, Medinipur East, PIN-721442',
    phone: '8918234190',
    extraPhone: '9475102938',
    referenceName: 'Dr. S. K. Mahapatra',
    referencePhone: '9475102938',
    clientCategory: 'Criminal',
    casePosition: 'Accused / Bail',
    urgency: 'Critical',
    feeAgreement: 'Lump Sum Agreed',
    fees: 30000,
    date: '2026-09-18',
    notes: 'Anticipatory bail petition in Sessions Court Medinipur.',
    createdAt: '2026-09-18T14:20:00.000Z',
  },
  {
    id: 'CL-1004',
    name: 'Manas Ranjan Giri',
    relation: 'S/O Birendra Nath Giri',
    address: 'Talgachhari, PS-Ramnagar, Medinipur East, PIN-721441',
    phone: '9434810293',
    extraPhone: '',
    referenceName: 'Chanchal Jana',
    referencePhone: '9123847192',
    clientCategory: 'Civil',
    casePosition: 'Decree Holder',
    urgency: 'Normal',
    feeAgreement: 'Lump Sum Agreed',
    fees: 12000,
    date: '2026-10-05',
    notes: 'Money execution case pending at Contai Civil Court.',
    createdAt: '2026-10-05T09:45:00.000Z',
  },
  {
    id: 'CL-1005',
    name: 'Priyanka Mukherjee',
    relation: 'D/O Ashim Mukherjee',
    address: 'Ward No 4, Egra Municipality, Medinipur East, PIN-721429',
    phone: '9831920381',
    extraPhone: '9732104928',
    referenceName: 'Tapan Kumar Sen',
    referencePhone: '9732104928',
    clientCategory: 'Family / Matrimonial',
    casePosition: 'Petitioner / Plaintiff',
    urgency: 'Urgent',
    feeAgreement: 'Lump Sum Agreed',
    fees: 18000,
    date: '2026-10-22',
    notes: 'Maintenance petition Sec 125 CrPC & D.V. Act application.',
    createdAt: '2026-10-22T16:00:00.000Z',
  },
  {
    id: 'CL-1006',
    name: 'Amitava Sen',
    relation: 'S/O Late Bimal Sen',
    address: 'Kalyanpur, PS-Ramnagar, Medinipur East, PIN-721441',
    phone: '8250192841',
    extraPhone: '',
    referenceName: 'Direct Client',
    referencePhone: '',
    clientCategory: 'Revenue',
    casePosition: 'Complainant / Informant',
    urgency: 'Normal',
    feeAgreement: 'Per Appearance',
    fees: 20000,
    date: '2026-11-01',
    notes: 'BL&LRO Record of Rights dispute at Contai SDM.',
    createdAt: '2026-11-01T12:10:00.000Z',
  },
]

const SEED_CASES = [
  {
    id: 'CS-2001',
    clientId: 'CL-1001',
    clientName: 'Rajesh Kumar Sharma',
    phone: '9832104512',
    advocateName: 'ANUPAM MAITY (ADVOCATE)',
    underSection: 'U/S 302/34 IPC',
    policeStation: 'Ramnagar PS',
    caseNumber: 'CR/342/2026',
    psCaseNumber: 'Ramnagar PS Case No. 84/2025',
    courtName: 'ACJM Court, Contai',
    vsName: 'State of West Bengal',
    idNumber: 'ID-101',
    tcc: 'TCC-42/26',
    purpose: 'Evidence / Cross Examination',
    caseDetails: 'Cross examination of prosecution witness PW-3 (Sub-Inspector).',
    totalFees: 15000,
    paidAmount: 10000,
    dueAmount: 5000,
    nextDate: '2026-11-20',
    lc: 'Bikash Mondal (L/C)',
    ppName: 'Mr. S. K. Bera (APP)',
    otherCaseNumber: 'Ramnagar PS Case No. 84/2025',
    notes: 'Keep certified deposition copy ready for argument.',
    createdAt: '2026-08-14T11:00:00.000Z',
  },
  {
    id: 'CS-2002',
    clientId: 'CL-1002',
    clientName: 'Sunita Devi Adhikari',
    phone: '9733481290',
    advocateName: 'ANUPAM MAITY (ADVOCATE)',
    underSection: 'Order 39 Rule 1 & 2 CPC',
    policeStation: 'Contai PS',
    caseNumber: 'TS/108/2026',
    psCaseNumber: 'Title Suit Reg No. 492/2025',
    courtName: 'Civil Judge (Sr. Div), Contai',
    vsName: 'Pradip Adhikari & Ors.',
    idNumber: 'ID-102',
    tcc: 'TCC-55/26',
    purpose: 'Hearing on Injunction Application',
    caseDetails: 'Temporary injunction hearing regarding ancestral homestead plot.',
    totalFees: 25000,
    paidAmount: 15000,
    dueAmount: 10000,
    nextDate: '2026-11-25',
    lc: 'Subrata Das (L/C)',
    ppName: 'Adv. Amit Roy (Opp. Counsel)',
    otherCaseNumber: 'Title Suit Registration No. 492',
    notes: 'Submit verified RS record map and deed copies.',
    createdAt: '2026-09-02T12:00:00.000Z',
  },
  {
    id: 'CS-2003',
    clientId: 'CL-1003',
    clientName: 'Debashis Roy Chowdhury',
    phone: '8918234190',
    advocateName: 'ANUPAM MAITY (ADVOCATE)',
    underSection: 'U/S 438 CrPC (Sec 420/406 IPC)',
    policeStation: 'Digha Coastal PS',
    caseNumber: 'BL/89/2026',
    psCaseNumber: 'Digha Coastal PS GR-1204/25',
    courtName: 'Sessions Court, Medinipur',
    vsName: 'State of West Bengal',
    idNumber: 'ID-103',
    tcc: 'TCC-67/26',
    purpose: 'Anticipatory Bail Hearing',
    caseDetails: 'Bail application hearing before Honble Sessions Judge.',
    totalFees: 30000,
    paidAmount: 20000,
    dueAmount: 10000,
    nextDate: '2026-11-18',
    lc: 'Bikash Mondal (L/C)',
    ppName: 'Public Prosecutor, Medinipur East',
    otherCaseNumber: 'Digha Coastal PS GR-1204/25',
    notes: 'Produce certified agreement papers and medical certificate.',
    createdAt: '2026-09-18T15:00:00.000Z',
  },
  {
    id: 'CS-2004',
    clientId: 'CL-1001',
    clientName: 'Rajesh Kumar Sharma',
    phone: '9832104512',
    advocateName: 'ANUPAM MAITY (ADVOCATE)',
    underSection: 'Sec 144 CrPC / LR Act',
    policeStation: 'Ramnagar PS',
    caseNumber: 'MISC/44/2026',
    psCaseNumber: 'LR Rectification Case 14/2026',
    courtName: 'Sub-Divisional Magistrate Court, Contai',
    vsName: 'BL&LRO Ramnagar Block II',
    idNumber: 'ID-104',
    tcc: 'TCC-72/26',
    purpose: 'Production of Certified Deeds',
    caseDetails: 'Production of certified sale deed No. 3412 for record rectification.',
    totalFees: 10000,
    paidAmount: 6000,
    dueAmount: 4000,
    nextDate: '2026-12-02',
    lc: 'Tarun Jana (L/C)',
    ppName: 'State Represented by BL&LRO',
    otherCaseNumber: 'LR Record Rectification Case 14',
    notes: 'Obtain certified copy of BL&LRO site inspection report.',
    createdAt: '2026-09-25T10:00:00.000Z',
  },
  {
    id: 'CS-2005',
    clientId: 'CL-1004',
    clientName: 'Manas Ranjan Giri',
    phone: '9434810293',
    advocateName: 'ANUPAM MAITY (ADVOCATE)',
    underSection: 'Order 21 CPC',
    policeStation: 'Ramnagar PS',
    caseNumber: 'EX/19/2026',
    psCaseNumber: 'Execution Case No. 19/2026',
    courtName: 'Civil Judge (Jr. Div), Contai',
    vsName: 'Gouranga Pradhan',
    idNumber: 'ID-105',
    tcc: 'TCC-81/26',
    purpose: 'Execution of Money Decree',
    caseDetails: 'Attachment of judgment debtor bank account and immovable property.',
    totalFees: 12000,
    paidAmount: 8000,
    dueAmount: 4000,
    nextDate: '2026-11-28',
    lc: 'Subrata Das (L/C)',
    ppName: 'Adv. P. K. Das (Decree Holder)',
    otherCaseNumber: 'Execution Case No. 19/2026',
    notes: 'Draft petition for warrant of arrest against JD.',
    createdAt: '2026-10-05T10:30:00.000Z',
  },
  {
    id: 'CS-2006',
    clientId: 'CL-1005',
    clientName: 'Priyanka Mukherjee',
    phone: '9831920381',
    advocateName: 'ANUPAM MAITY (ADVOCATE)',
    underSection: 'Sec 125 CrPC',
    policeStation: 'Egra PS',
    caseNumber: 'MAT/52/2026',
    psCaseNumber: 'Family Court Pet 52/2026',
    courtName: 'District Family Court, Medinipur',
    vsName: 'Sourav Mukherjee',
    idNumber: 'ID-106',
    tcc: 'TCC-94/26',
    purpose: 'Mediation & Conciliation Session',
    caseDetails: 'Interim maintenance argument and conciliation sitting.',
    totalFees: 18000,
    paidAmount: 18000,
    dueAmount: 0,
    nextDate: '2026-12-05',
    lc: 'Bikash Mondal (L/C)',
    ppName: 'Mediator: Adv. Tapati Sen',
    otherCaseNumber: 'Section 125 CrPC Petition',
    notes: 'Opposite party salary slip summoned from employer.',
    createdAt: '2026-10-22T16:30:00.000Z',
  },
]

const SEED_PAYMENTS = [
  {
    id: 'PM-3001',
    caseId: 'CS-2001',
    clientId: 'CL-1001',
    clientName: 'Rajesh Kumar Sharma',
    tcc: 'TCC-42/26',
    idNumber: 'ID-101',
    paymentDate: '2026-08-14',
    amount: 5000,
    dueAmount: 10000,
    mode: 'Cash',
    remarks: 'Retainer advance payment on vakalatnama signing',
    createdAt: '2026-08-14T11:30:00.000Z',
  },
  {
    id: 'PM-3002',
    caseId: 'CS-2001',
    clientId: 'CL-1001',
    clientName: 'Rajesh Kumar Sharma',
    tcc: 'TCC-42/26',
    idNumber: 'ID-101',
    paymentDate: '2026-10-10',
    amount: 5000,
    dueAmount: 5000,
    mode: 'UPI',
    remarks: 'Cross examination stage fee',
    createdAt: '2026-10-10T14:15:00.000Z',
  },
  {
    id: 'PM-3003',
    caseId: 'CS-2002',
    clientId: 'CL-1002',
    clientName: 'Sunita Devi Adhikari',
    tcc: 'TCC-55/26',
    idNumber: 'ID-102',
    paymentDate: '2026-09-02',
    amount: 15000,
    dueAmount: 10000,
    mode: 'Bank Transfer',
    remarks: 'Plaint drafting and injunction application advance',
    createdAt: '2026-09-02T12:30:00.000Z',
  },
  {
    id: 'PM-3004',
    caseId: 'CS-2003',
    clientId: 'CL-1003',
    clientName: 'Debashis Roy Chowdhury',
    tcc: 'TCC-67/26',
    idNumber: 'ID-103',
    paymentDate: '2026-09-18',
    amount: 20000,
    dueAmount: 10000,
    mode: 'Cash',
    remarks: 'Anticipatory bail petition filing & advocate senior brief fee',
    createdAt: '2026-09-18T16:00:00.000Z',
  },
  {
    id: 'PM-3005',
    caseId: 'CS-2004',
    clientId: 'CL-1001',
    clientName: 'Rajesh Kumar Sharma',
    tcc: 'TCC-72/26',
    idNumber: 'ID-104',
    paymentDate: '2026-09-25',
    amount: 6000,
    dueAmount: 4000,
    mode: 'UPI',
    remarks: 'SDM court appearance advance',
    createdAt: '2026-09-25T11:00:00.000Z',
  },
  {
    id: 'PM-3006',
    caseId: 'CS-2005',
    clientId: 'CL-1004',
    clientName: 'Manas Ranjan Giri',
    tcc: 'TCC-81/26',
    idNumber: 'ID-105',
    paymentDate: '2026-10-05',
    amount: 8000,
    dueAmount: 4000,
    mode: 'Cash',
    remarks: 'Execution petition drafting fee',
    createdAt: '2026-10-05T11:45:00.000Z',
  },
  {
    id: 'PM-3007',
    caseId: 'CS-2006',
    clientId: 'CL-1005',
    clientName: 'Priyanka Mukherjee',
    tcc: 'TCC-94/26',
    idNumber: 'ID-106',
    paymentDate: '2026-10-22',
    amount: 18000,
    dueAmount: 0,
    mode: 'UPI',
    remarks: 'Full settlement of family court fee',
    createdAt: '2026-10-22T17:00:00.000Z',
  },
  {
    id: 'PM-3008',
    caseId: 'CS-2001',
    clientId: 'CL-1001',
    clientName: 'Rajesh Kumar Sharma',
    tcc: 'TCC-42/26',
    idNumber: 'ID-101',
    paymentDate: '2026-11-16',
    amount: 2000,
    dueAmount: 3000,
    mode: 'Cash',
    remarks: 'Hearing docket preparation fee',
    createdAt: '2026-11-16T09:30:00.000Z',
  },
]

const SEED_EXPENSE_HEADS = [
  { id: 'EH-101', name: 'Court Fees & Stamp Duty', description: 'Ad-valorem court fees, court stamps & process filing', createdAt: '2026-01-01' },
  { id: 'EH-102', name: 'Advocate Clerkage & Process Serving', description: 'Clerical process fees, bench clerk and summons charges', createdAt: '2026-01-01' },
  { id: 'EH-103', name: 'Travel & Conveyance', description: 'District court, sessions and high court travelling expenses', createdAt: '2026-01-01' },
  { id: 'EH-104', name: 'Office Stationery & Photostat', description: 'Printing, photocopies of briefs, typing and stationery', createdAt: '2026-01-01' },
  { id: 'EH-105', name: 'Law Books & Online Legal Subscriptions', description: 'SCC Online, AIR Law journals and legal reference digests', createdAt: '2026-01-01' },
  { id: 'EH-106', name: 'Chamber Electricity & Maintenance', description: 'Chamber rent, electric bill, wifi and office maintenance', createdAt: '2026-01-01' },
  { id: 'EH-107', name: 'Sundry & Client Refreshments', description: 'Tea, client consultations hospitality & incidental expenses', createdAt: '2026-01-01' },
]

const SEED_EXPENSES = [
  {
    id: 'EX-4001',
    headId: 'EH-101',
    headName: 'Court Fees & Stamp Duty',
    expenseDate: '2026-11-10',
    amount: 3200,
    paidTo: 'Contai Court Treasury Stamp Vendor',
    paymentMode: 'Cash',
    description: 'Ad-valorem stamps purchased for Title Suit No. 108/2026',
    remarks: 'Voucher No. TS-492',
    createdAt: '2026-11-10T11:00:00.000Z',
  },
  {
    id: 'EH-4002',
    headId: 'EH-102',
    headName: 'Advocate Clerkage & Process Serving',
    expenseDate: '2026-11-12',
    amount: 1500,
    paidTo: 'Bikash Mondal (Law Clerk)',
    paymentMode: 'UPI',
    description: 'Filing charges, inspection slips and cause list collection for week',
    remarks: 'Weekly clerk allowance',
    createdAt: '2026-11-12T16:30:00.000Z',
  },
  {
    id: 'EX-4003',
    headId: 'EH-103',
    headName: 'Travel & Conveyance',
    expenseDate: '2026-11-14',
    amount: 2400,
    paidTo: 'Contai-Medinipur Fast Cab',
    paymentMode: 'Cash',
    description: 'Car travel to Medinipur Sessions Court for Anticipatory Bail argument',
    remarks: 'Fuel & toll bill attached',
    createdAt: '2026-11-14T19:00:00.000Z',
  },
  {
    id: 'EX-4004',
    headId: 'EH-104',
    headName: 'Office Stationery & Photostat',
    expenseDate: '2026-11-16',
    amount: 850,
    paidTo: 'Maity Xerox & Computer Typing Centre',
    paymentMode: 'Cash',
    description: 'Brief photocopying 5 sets + green legal cartridge paper',
    remarks: 'Bill #941',
    createdAt: '2026-11-16T10:15:00.000Z',
  },
]

// CRITICAL: Consultancy fees must NOT generate a Case ID
const SEED_CONSULTANCY = [
  {
    id: 'CF-5001',
    clientName: 'Subhendu Ghosh',
    phone: '9832991024',
    consultationDate: '2026-11-16',
    amount: 1500,
    paymentMode: 'Cash',
    remarks: 'Legal consultation on land title partition deed and mutation notice',
    receiptNo: 'CF-801',
    createdAt: '2026-11-16T10:45:00.000Z',
  },
  {
    id: 'CF-5002',
    clientName: 'Bhabani Charan Das',
    phone: '9434112940',
    consultationDate: '2026-11-15',
    amount: 2000,
    paymentMode: 'UPI',
    remarks: 'Property boundary dispute advice and pre-litigation notice draft',
    receiptNo: 'CF-802',
    createdAt: '2026-11-15T15:20:00.000Z',
  },
  {
    id: 'CF-5003',
    clientName: 'Alok Kumar Jana',
    phone: '8918239012',
    consultationDate: '2026-11-16',
    amount: 1200,
    paymentMode: 'Cash',
    remarks: 'Consumer forum insurance claim repudiation consultation',
    receiptNo: 'CF-803',
    createdAt: '2026-11-16T11:10:00.000Z',
  },
]

const SEED_DOCUMENTS_META = [
  {
    id: 'DOC-6001',
    entityType: 'case',
    associatedId: 'CS-2001',
    idNumber: 'ID-101',
    docName: 'Ramnagar_PS_FIR_84_2025.pdf',
    docType: 'FIR Copy',
    fileSize: 412000,
    fileType: 'application/pdf',
    uploadDate: '2026-08-15 11:20',
    remarks: 'Certified copy of initial First Information Report',
    downloadUrl: '#',
  },
  {
    id: 'DOC-6002',
    entityType: 'client',
    associatedId: 'CL-1001',
    idNumber: 'ID-101',
    docName: 'Vakalatnama_Rajesh_Sharma.pdf',
    docType: 'Vakalatnama',
    fileSize: 185000,
    fileType: 'application/pdf',
    uploadDate: '2026-08-14 12:00',
    remarks: 'Duly executed Vakalatnama with client verification and court welfare stamp',
    downloadUrl: '#',
  },
  {
    id: 'DOC-6003',
    entityType: 'case',
    associatedId: 'CS-2002',
    idNumber: 'ID-102',
    docName: 'Title_Suit_Plaint_Order39.pdf',
    docType: 'Plaint & Injunction Petition',
    fileSize: 624000,
    fileType: 'application/pdf',
    uploadDate: '2026-09-03 14:10',
    remarks: 'Title suit plaint draft and affidavit of service',
    downloadUrl: '#',
  },
  {
    id: 'DOC-6004',
    entityType: 'idNumber',
    associatedId: 'ID-103',
    idNumber: 'ID-103',
    docName: 'Medical_Certificate_Evidence.jpg',
    docType: 'Evidence Document',
    fileSize: 245000,
    fileType: 'image/jpeg',
    uploadDate: '2026-09-19 10:30',
    remarks: 'Hospital admission discharge certificate submitted for bail plea',
    downloadUrl: '#',
  },
]

const SEED_REMINDERS = [
  {
    id: 'REM-7001',
    clientName: 'Debashis Roy Chowdhury',
    phone: '8918234190',
    date: '2026-11-18',
    reasons: 'Anticipatory bail hearing before Honble Sessions Judge Medinipur. Remind client to bring original agreement papers.',
    caseId: 'CS-2003',
    courtName: 'Sessions Court, Medinipur',
    status: 'Pending',
    sentAt: null,
    createdAt: '2026-11-10T09:00:00.000Z',
  },
  {
    id: 'REM-7002',
    clientName: 'Rajesh Kumar Sharma',
    phone: '9832104512',
    date: '2026-11-20',
    reasons: 'Cross examination of PW-3 (Investigating Officer) in ACJM Contai. Client personal appearance required at 10:30 AM.',
    caseId: 'CS-2001',
    courtName: 'ACJM Court, Contai',
    status: 'Pending',
    sentAt: null,
    createdAt: '2026-11-11T10:00:00.000Z',
  },
  {
    id: 'REM-7003',
    clientName: 'Sunita Devi Adhikari',
    phone: '9733481290',
    date: '2026-11-25',
    reasons: 'Injunction hearing Order 39 CPC in Civil Judge Sr Div Contai. Produce original deeds.',
    caseId: 'CS-2002',
    courtName: 'Civil Judge (Sr. Div), Contai',
    status: 'Pending',
    sentAt: null,
    createdAt: '2026-11-12T11:00:00.000Z',
  },
]

const SEED_EXTRA_BRIEFS = [
  {
    id: 'EB-8001',
    clientName: 'Rajesh Kumar Sharma',
    hasIdNumber: true,
    idNumber: 'ID-101',
    advocateLawClerk: 'Adv. Somnath Das (Sessions Counsel)',
    courtName: 'ACJM Court, Contai',
    caseNumber: 'CR/342/2026',
    date: '2026-11-20',
    evidenceDetails: 'Deposition of PW-3 (IO SI Subir Sen) regarding seizure list memo and delayed FIR dispatch.',
    remarks: 'Cross examination brief handed over for assistance.',
    createdAt: '2026-11-12T15:00:00.000Z',
  },
  {
    id: 'EB-8002',
    clientName: 'Debashis Roy Chowdhury',
    hasIdNumber: true,
    idNumber: 'ID-103',
    advocateLawClerk: 'Bikash Mondal (Law Clerk)',
    courtName: 'Sessions Court, Medinipur',
    caseNumber: 'BL/89/2026',
    date: '2026-11-18',
    evidenceDetails: 'Case diary production requisition and CD note scrutiny report.',
    remarks: 'Process server summons report to be collected from court bench.',
    createdAt: '2026-11-14T11:00:00.000Z',
  },
  {
    id: 'EB-8003',
    clientName: 'Gour Mohan Pramanik',
    hasIdNumber: false,
    idNumber: '',
    advocateLawClerk: 'Adv. Tapas Kumar Bhowmik',
    courtName: 'Contai Land Tribunal',
    caseNumber: 'Misc Case 19/2026',
    date: '2026-11-22',
    evidenceDetails: 'Without ID Number. Certified RS Khatian extract and 1956 sale deed comparison chart.',
    remarks: 'Local advocate engaged for joint inspection representation.',
    createdAt: '2026-11-15T12:00:00.000Z',
  },
  {
    id: 'EB-8004',
    clientName: 'Shyamal Adak',
    hasIdNumber: false,
    idNumber: '',
    advocateLawClerk: 'Tarun Jana (Law Clerk)',
    courtName: 'Egra Executive Magistrate Court',
    caseNumber: 'Sec 107 CrPC Proceeding',
    date: '2026-11-24',
    evidenceDetails: 'Without ID Number. Local gram panchayat peace bond inquiry report.',
    remarks: 'Clerk brief for filing bond and personal appearance exemption.',
    createdAt: '2026-11-15T14:30:00.000Z',
  },
]

const SEED_WAITING_LIST = [
  {
    id: 'WL-9001',
    clientName: 'Nirmal Chandra Patra',
    phone: '9832145678',
    purpose: 'Bail petition consultation for Digha Coastal PS arrest',
    date: '2026-11-16',
    timeSlot: '11:30 AM',
    status: 'Waiting',
    notes: 'Brought certified arrest memo copy',
    createdAt: '2026-11-16T09:00:00.000Z',
  },
  {
    id: 'WL-9002',
    clientName: 'Madhabi Giri',
    phone: '9434876543',
    purpose: 'Civil injunction urgent advice on land trespass',
    date: '2026-11-16',
    timeSlot: '12:15 PM',
    status: 'Waiting',
    notes: 'Referred by Pradhan Ramnagar Block',
    createdAt: '2026-11-16T09:30:00.000Z',
  },
]

// ----------------- Helper: Read & Write JSON -----------------
function readStorage(key, seedValue) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(seedValue))
      return seedValue
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) || typeof parsed === 'object' ? parsed : seedValue
  } catch (err) {
    console.warn(`Storage read error for ${key}:`, err)
    return seedValue
  }
}

function writeStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
    dispatchStorageEvent()
  } catch (err) {
    console.error(`Storage write error for ${key}:`, err)
  }
}

// -------------------------------------------------------------
// MODULE 1: CLIENT MASTER APIS
// -------------------------------------------------------------
export function getClients() {
  return readStorage(CLIENTS_KEY, SEED_CLIENTS)
}

export function getClientById(id) {
  const clients = getClients()
  return clients.find((c) => String(c.id).toLowerCase() === String(id).toLowerCase()) || null
}

export function checkDuplicateClient(phone, name, excludeId = null) {
  const clients = getClients()
  const cleanPhone = String(phone || '').replace(/[\s-+]/g, '')
  const cleanName = String(name || '').trim().toLowerCase()

  return clients.find((c) => {
    if (excludeId && String(c.id).toLowerCase() === String(excludeId).toLowerCase()) {
      return false
    }
    const cPhone = String(c.phone || '').replace(/[\s-+]/g, '')
    const cName = String(c.name || '').trim().toLowerCase()
    return (cleanPhone && cPhone === cleanPhone) || (cleanName && cName === cleanName)
  }) || null
}

export function saveClient(clientData) {
  const clients = getClients()
  let maxNum = 1000
  clients.forEach((c) => {
    const match = String(c.id).match(/\d+/)
    if (match) {
      const num = parseInt(match[0], 10)
      if (num > maxNum) maxNum = num
    }
  })
  const newId = `CL-${maxNum + 1}`

  const newClient = {
    ...clientData,
    id: newId,
    phone: String(clientData.phone || '').trim(),
    extraPhone: String(clientData.extraPhone || '').trim(),
    fees: Number(clientData.fees || 0),
    clientCategory: clientData.clientCategory || 'Civil',
    casePosition: clientData.casePosition || 'Petitioner / Plaintiff',
    urgency: clientData.urgency || 'Normal',
    feeAgreement: clientData.feeAgreement || 'Lump Sum Agreed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const updated = [newClient, ...clients]
  writeStorage(CLIENTS_KEY, updated)
  return newClient
}

export function updateClient(id, clientData) {
  const clients = getClients()
  const idx = clients.findIndex((c) => String(c.id).toLowerCase() === String(id).toLowerCase())
  if (idx === -1) {
    throw new Error(`Client with ID ${id} not found`)
  }

  const updatedClient = {
    ...clients[idx],
    ...clientData,
    id, // Preserve original ID
    phone: String(clientData.phone || '').trim(),
    extraPhone: String(clientData.extraPhone || '').trim(),
    fees: Number(clientData.fees || 0),
    updatedAt: new Date().toISOString(),
  }

  clients[idx] = updatedClient
  writeStorage(CLIENTS_KEY, clients)

  // Sync client name and phone across linked cases
  try {
    const cases = getCases()
    let changed = false
    const updatedCases = cases.map((cs) => {
      if (String(cs.clientId).toLowerCase() === String(id).toLowerCase()) {
        changed = true
        return {
          ...cs,
          clientName: updatedClient.name,
          phone: updatedClient.phone,
        }
      }
      return cs
    })
    if (changed) {
      writeStorage(CASES_KEY, updatedCases)
    }
  } catch (e) {
    console.error('Error updating linked cases:', e)
  }

  return updatedClient
}

export function deleteClient(id) {
  const clients = getClients()
  const filtered = clients.filter((c) => String(c.id).toLowerCase() !== String(id).toLowerCase())
  writeStorage(CLIENTS_KEY, filtered)
  return true
}

export function getClientHistory(clientId) {
  const client = getClientById(clientId)
  const cases = getCases().filter((cs) => String(cs.clientId).toLowerCase() === String(clientId).toLowerCase())
  const caseIds = new Set(cases.map((c) => c.id))
  const payments = getPayments().filter((p) => String(p.clientId).toLowerCase() === String(clientId).toLowerCase() || caseIds.has(p.caseId))
  const totalFees = cases.reduce((acc, c) => acc + Number(c.totalFees || 0), 0)
  const totalPaid = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0)
  const totalDue = Math.max(0, totalFees - totalPaid)
  const documents = getDocuments().filter((d) => String(d.associatedId).toLowerCase() === String(clientId).toLowerCase() || caseIds.has(d.associatedId))

  return {
    client,
    cases,
    payments,
    documents,
    financials: {
      totalFees,
      totalPaid,
      totalDue,
    },
  }
}

// -------------------------------------------------------------
// MODULE 2: CASE MASTER APIS
// -------------------------------------------------------------
export function getCases() {
  return readStorage(CASES_KEY, SEED_CASES)
}

export function getCaseById(id) {
  const cases = getCases()
  return cases.find((c) => String(c.id).toLowerCase() === String(id).toLowerCase()) || null
}

export function getCasesByClientId(clientId) {
  const cases = getCases()
  return cases.filter((c) => String(c.clientId).toLowerCase() === String(clientId).toLowerCase())
}

export function saveCase(caseData) {
  const cases = getCases()
  let maxNum = 2000
  cases.forEach((c) => {
    const match = String(c.id).match(/\d+/)
    if (match) {
      const num = parseInt(match[0], 10)
      if (num > maxNum) maxNum = num
    }
  })
  const newId = `CS-${maxNum + 1}`

  const totalFees = Number(caseData.totalFees || 0)
  const paidAmount = Number(caseData.paidAmount || 0)
  const dueAmount = Math.max(0, totalFees - paidAmount)

  const newCase = {
    ...caseData,
    id: newId,
    advocateName: caseData.advocateName || 'ANUPAM MAITY (ADVOCATE)',
    totalFees,
    paidAmount,
    dueAmount,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // If initial paidAmount > 0, automatically record initial payment entry
  if (paidAmount > 0) {
    savePayment({
      caseId: newId,
      clientId: newCase.clientId,
      clientName: newCase.clientName,
      tcc: newCase.tcc || '',
      idNumber: newCase.idNumber || '',
      paymentDate: new Date().toISOString().split('T')[0],
      amount: paidAmount,
      dueAmount,
      mode: caseData.paymentMode || 'Cash',
      remarks: 'Initial retainer payment during case registration',
    }, false) // skip case update since we already computed it
  }

  const updated = [newCase, ...cases]
  writeStorage(CASES_KEY, updated)
  return newCase
}

export function updateCase(id, caseData) {
  const cases = getCases()
  const idx = cases.findIndex((c) => String(c.id).toLowerCase() === String(id).toLowerCase())
  if (idx === -1) {
    throw new Error(`Case with ID ${id} not found`)
  }

  // Calculate accurate paid amount from all payments
  const payments = getPayments().filter((p) => String(p.caseId).toLowerCase() === String(id).toLowerCase())
  const calculatedPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
  const totalFees = Number(caseData.totalFees !== undefined ? caseData.totalFees : cases[idx].totalFees || 0)
  const dueAmount = Math.max(0, totalFees - calculatedPaid)

  const updatedCase = {
    ...cases[idx],
    ...caseData,
    id, // CRITICAL: Preserve existing Case ID
    totalFees,
    paidAmount: calculatedPaid,
    dueAmount,
    updatedAt: new Date().toISOString(),
  }

  cases[idx] = updatedCase
  writeStorage(CASES_KEY, cases)
  return updatedCase
}

export function deleteCase(id) {
  const cases = getCases()
  const filtered = cases.filter((c) => String(c.id).toLowerCase() !== String(id).toLowerCase())
  writeStorage(CASES_KEY, filtered)
  return true
}

export function recalculateCaseFinancials(caseId) {
  const cases = getCases()
  const idx = cases.findIndex((c) => String(c.id).toLowerCase() === String(caseId).toLowerCase())
  if (idx === -1) return null

  const payments = getPayments().filter((p) => String(p.caseId).toLowerCase() === String(caseId).toLowerCase())
  const totalPaid = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0)
  const totalFees = Number(cases[idx].totalFees || 0)
  const dueAmount = Math.max(0, totalFees - totalPaid)

  cases[idx].paidAmount = totalPaid
  cases[idx].dueAmount = dueAmount
  cases[idx].updatedAt = new Date().toISOString()

  writeStorage(CASES_KEY, cases)
  return cases[idx]
}

// -------------------------------------------------------------
// MODULE 4: PAYMENT MANAGEMENT & ACCOUNTS APIS
// -------------------------------------------------------------
export function getPayments() {
  return readStorage(PAYMENTS_KEY, SEED_PAYMENTS)
}

export function getPaymentById(id) {
  const payments = getPayments()
  return payments.find((p) => String(p.id).toLowerCase() === String(id).toLowerCase()) || null
}

export function getPaymentsByCaseId(caseId) {
  const payments = getPayments()
  return payments.filter((p) => String(p.caseId).toLowerCase() === String(caseId).toLowerCase())
}

export function getPaymentsByDate(date) {
  const payments = getPayments()
  return payments.filter((p) => String(p.paymentDate) === String(date))
}

export function savePayment(paymentData, updateCaseRecord = true) {
  const payments = getPayments()
  let maxNum = 3000
  payments.forEach((p) => {
    const match = String(p.id).match(/\d+/)
    if (match) {
      const num = parseInt(match[0], 10)
      if (num > maxNum) maxNum = num
    }
  })
  const newId = `PM-${maxNum + 1}`

  const amount = Number(paymentData.amount || 0)
  const newPayment = {
    ...paymentData,
    id: newId,
    amount,
    paymentDate: paymentData.paymentDate || new Date().toISOString().split('T')[0],
    mode: paymentData.mode || 'Cash',
    remarks: paymentData.remarks || '',
    createdAt: new Date().toISOString(),
  }

  const updatedPayments = [newPayment, ...payments]
  writeStorage(PAYMENTS_KEY, updatedPayments)

  if (updateCaseRecord && paymentData.caseId) {
    recalculateCaseFinancials(paymentData.caseId)
  }

  return newPayment
}

export function updatePayment(id, paymentData) {
  const payments = getPayments()
  const idx = payments.findIndex((p) => String(p.id).toLowerCase() === String(id).toLowerCase())
  if (idx === -1) {
    throw new Error(`Payment ${id} not found`)
  }

  const updatedPayment = {
    ...payments[idx],
    ...paymentData,
    id,
    amount: Number(paymentData.amount || 0),
    updatedAt: new Date().toISOString(),
  }

  payments[idx] = updatedPayment
  writeStorage(PAYMENTS_KEY, payments)

  if (updatedPayment.caseId) {
    recalculateCaseFinancials(updatedPayment.caseId)
  }

  return updatedPayment
}

export function deletePayment(id) {
  const payments = getPayments()
  const target = payments.find((p) => String(p.id).toLowerCase() === String(id).toLowerCase())
  if (!target) return false

  const filtered = payments.filter((p) => String(p.id).toLowerCase() !== String(id).toLowerCase())
  writeStorage(PAYMENTS_KEY, filtered)

  if (target.caseId) {
    recalculateCaseFinancials(target.caseId)
  }

  return true
}

// -------------------------------------------------------------
// MODULE 5: DUE LIST APIS
// -------------------------------------------------------------
export function getDueList() {
  const cases = getCases()
  return cases
    .filter((cs) => Number(cs.dueAmount || 0) > 0)
    .sort((a, b) => Number(b.dueAmount || 0) - Number(a.dueAmount || 0))
}

// -------------------------------------------------------------
// MODULE 6: DAILY COLLECTION REPORT APIS
// -------------------------------------------------------------
export function getDailyCollection(targetDate) {
  const dateStr = String(targetDate || new Date().toISOString().split('T')[0])
  const payments = getPayments().filter((p) => String(p.paymentDate) === dateStr)
  const consultancy = getConsultancyFees().filter((c) => String(c.consultationDate) === dateStr)

  const totalCasePayments = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0)
  const totalConsultancy = consultancy.reduce((acc, c) => acc + Number(c.amount || 0), 0)
  const grandTotal = totalCasePayments + totalConsultancy

  // Unified collection rows
  const collectionRows = [
    ...payments.map((p) => ({
      id: p.id,
      type: 'Case Payment',
      category: 'Litigation Fee',
      refId: p.caseId,
      tcc: p.tcc || '—',
      idNumber: p.idNumber || '—',
      clientName: p.clientName,
      amount: Number(p.amount || 0),
      mode: p.mode || 'Cash',
      remarks: p.remarks || 'Court case appearance fee',
      time: p.createdAt ? p.createdAt.split('T')[1]?.substring(0, 5) : '10:00',
    })),
    ...consultancy.map((c) => ({
      id: c.id,
      type: 'Consultancy Fee',
      category: 'Legal Advice',
      refId: c.receiptNo || 'Consultancy',
      tcc: '—',
      idNumber: '—',
      clientName: c.clientName,
      amount: Number(c.amount || 0),
      mode: c.paymentMode || 'Cash',
      remarks: c.remarks || 'Chamber legal consultation',
      time: c.createdAt ? c.createdAt.split('T')[1]?.substring(0, 5) : '11:00',
    })),
  ]

  return {
    date: dateStr,
    rows: collectionRows,
    totalCasePayments,
    totalConsultancy,
    grandTotal,
    count: collectionRows.length,
  }
}

// -------------------------------------------------------------
// MODULE 7: EXPENSE HEAD MASTER & EXPENSES APIS
// -------------------------------------------------------------
export function getExpenseHeads() {
  return readStorage(EXPENSE_HEADS_KEY, SEED_EXPENSE_HEADS)
}

export function getExpenseHeadById(id) {
  const heads = getExpenseHeads()
  return heads.find((h) => String(h.id).toLowerCase() === String(id).toLowerCase()) || null
}

export function saveExpenseHead(headData) {
  const heads = getExpenseHeads()
  let maxNum = 100
  heads.forEach((h) => {
    const match = String(h.id).match(/\d+/)
    if (match) {
      const num = parseInt(match[0], 10)
      if (num > maxNum) maxNum = num
    }
  })
  const newId = `EH-${maxNum + 1}`

  const newHead = {
    ...headData,
    id: newId,
    createdAt: new Date().toISOString().split('T')[0],
  }

  const updated = [newHead, ...heads]
  writeStorage(EXPENSE_HEADS_KEY, updated)
  return newHead
}

export function updateExpenseHead(id, headData) {
  const heads = getExpenseHeads()
  const idx = heads.findIndex((h) => String(h.id).toLowerCase() === String(id).toLowerCase())
  if (idx === -1) throw new Error(`Expense Head ${id} not found`)

  heads[idx] = { ...heads[idx], ...headData, id }
  writeStorage(EXPENSE_HEADS_KEY, heads)
  return heads[idx]
}

export function deleteExpenseHead(id) {
  const expenses = getExpenses()
  const isUsed = expenses.some((e) => String(e.headId).toLowerCase() === String(id).toLowerCase())
  if (isUsed) {
    throw new Error('Cannot delete this Expense Head because it is linked to existing expense transactions. Please reassign or delete the associated expenses first.')
  }

  const heads = getExpenseHeads()
  const filtered = heads.filter((h) => String(h.id).toLowerCase() !== String(id).toLowerCase())
  writeStorage(EXPENSE_HEADS_KEY, filtered)
  return true
}

export function getExpenses() {
  return readStorage(EXPENSES_KEY, SEED_EXPENSES)
}

export function saveExpense(expenseData) {
  const expenses = getExpenses()
  let maxNum = 4000
  expenses.forEach((e) => {
    const match = String(e.id).match(/\d+/)
    if (match) {
      const num = parseInt(match[0], 10)
      if (num > maxNum) maxNum = num
    }
  })
  const newId = `EX-${maxNum + 1}`

  const newExpense = {
    ...expenseData,
    id: newId,
    amount: Number(expenseData.amount || 0),
    expenseDate: expenseData.expenseDate || new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  }

  const updated = [newExpense, ...expenses]
  writeStorage(EXPENSES_KEY, updated)
  return newExpense
}

export function updateExpense(id, expenseData) {
  const expenses = getExpenses()
  const idx = expenses.findIndex((e) => String(e.id).toLowerCase() === String(id).toLowerCase())
  if (idx === -1) throw new Error(`Expense ${id} not found`)

  expenses[idx] = {
    ...expenses[idx],
    ...expenseData,
    id,
    amount: Number(expenseData.amount || 0),
    updatedAt: new Date().toISOString(),
  }
  writeStorage(EXPENSES_KEY, expenses)
  return expenses[idx]
}

export function deleteExpense(id) {
  const expenses = getExpenses()
  const filtered = expenses.filter((e) => String(e.id).toLowerCase() !== String(id).toLowerCase())
  writeStorage(EXPENSES_KEY, filtered)
  return true
}

export function getExpenseHeadWiseSummary() {
  const heads = getExpenseHeads()
  const expenses = getExpenses()
  return heads.map((h) => {
    const matching = expenses.filter((e) => String(e.headId).toLowerCase() === String(h.id).toLowerCase())
    const total = matching.reduce((acc, m) => acc + Number(m.amount || 0), 0)
    return {
      ...h,
      count: matching.length,
      total,
    }
  })
}

// -------------------------------------------------------------
// MODULE 8: CONSULTANCY FEES (NO CASE ID)
// -------------------------------------------------------------
export function getConsultancyFees() {
  return readStorage(CONSULTANCY_KEY, SEED_CONSULTANCY)
}

export function saveConsultancyFee(feeData) {
  const fees = getConsultancyFees()
  let maxNum = 5000
  fees.forEach((f) => {
    const match = String(f.id).match(/\d+/)
    if (match) {
      const num = parseInt(match[0], 10)
      if (num > maxNum) maxNum = num
    }
  })
  const newId = `CF-${maxNum + 1}`
  const receiptNo = `REC-${maxNum + 1}`

  // IMPORTANT: NO CASE ID GENERATED
  const newEntry = {
    ...feeData,
    id: newId,
    receiptNo: feeData.receiptNo || receiptNo,
    amount: Number(feeData.amount || 0),
    consultationDate: feeData.consultationDate || new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  }

  const updated = [newEntry, ...fees]
  writeStorage(CONSULTANCY_KEY, updated)
  return newEntry
}

export function updateConsultancyFee(id, feeData) {
  const fees = getConsultancyFees()
  const idx = fees.findIndex((f) => String(f.id).toLowerCase() === String(id).toLowerCase())
  if (idx === -1) throw new Error(`Consultancy entry ${id} not found`)

  fees[idx] = {
    ...fees[idx],
    ...feeData,
    id,
    amount: Number(feeData.amount || 0),
    updatedAt: new Date().toISOString(),
  }
  writeStorage(CONSULTANCY_KEY, fees)
  return fees[idx]
}

export function deleteConsultancyFee(id) {
  const fees = getConsultancyFees()
  const filtered = fees.filter((f) => String(f.id).toLowerCase() !== String(id).toLowerCase())
  writeStorage(CONSULTANCY_KEY, filtered)
  return true
}

// -------------------------------------------------------------
// MODULE 9: ID-WISE DOCUMENT UPLOAD SYSTEM (IndexedDB Backed)
// -------------------------------------------------------------
export function getDocuments(filterId = null) {
  const docs = readStorage(DOCUMENTS_META_KEY, SEED_DOCUMENTS_META)
  if (!filterId) return docs
  const f = String(filterId).toLowerCase()
  return docs.filter((d) =>
    String(d.associatedId || '').toLowerCase() === f ||
    String(d.idNumber || '').toLowerCase() === f
  )
}

export async function saveDocument(docData) {
  const docs = getDocuments()
  let maxNum = 6000
  docs.forEach((d) => {
    const match = String(d.id).match(/\d+/)
    if (match) {
      const num = parseInt(match[0], 10)
      if (num > maxNum) maxNum = num
    }
  })
  const newId = `DOC-${maxNum + 1}`

  const now = new Date()
  const dateStr = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  const docRecord = {
    id: newId,
    entityType: docData.entityType || 'case',
    associatedId: docData.associatedId || '',
    idNumber: docData.idNumber || '',
    docName: docData.docName || 'Untitled_Document',
    docType: docData.docType || 'Court Document',
    fileSize: docData.fileSize || 0,
    fileType: docData.fileType || 'application/pdf',
    uploadDate: dateStr,
    remarks: docData.remarks || '',
    downloadUrl: docData.fileData || '#',
  }

  // Dual store: full data in IndexedDB, metadata in localStorage
  if (docData.fileData) {
    await idbSaveDocument({
      id: newId,
      ...docRecord,
      fileData: docData.fileData,
    })
  }

  const updated = [docRecord, ...docs]
  writeStorage(DOCUMENTS_META_KEY, updated)
  return docRecord
}

export async function getDocumentById(id) {
  // Try IndexedDB first for full binary file
  const fullDoc = await idbGetDocument(id)
  if (fullDoc) return fullDoc

  const docs = getDocuments()
  return docs.find((d) => String(d.id).toLowerCase() === String(id).toLowerCase()) || null
}

export async function deleteDocument(id) {
  await idbDeleteDocument(id)
  const docs = getDocuments()
  const filtered = docs.filter((d) => String(d.id).toLowerCase() !== String(id).toLowerCase())
  writeStorage(DOCUMENTS_META_KEY, filtered)
  return true
}

// -------------------------------------------------------------
// MODULE 10 & 12: NEXT DATE REMINDERS & HEARING CAUSE LIST
// -------------------------------------------------------------
export function getReminders() {
  return readStorage(REMINDERS_KEY, SEED_REMINDERS)
}

export function saveReminder(reminderData) {
  const reminders = getReminders()
  let maxNum = 7000
  reminders.forEach((r) => {
    const match = String(r.id).match(/\d+/)
    if (match) {
      const num = parseInt(match[0], 10)
      if (num > maxNum) maxNum = num
    }
  })
  const newId = `REM-${maxNum + 1}`

  const newReminder = {
    ...reminderData,
    id: newId,
    status: reminderData.status || 'Pending',
    createdAt: new Date().toISOString(),
  }

  const updated = [newReminder, ...reminders]
  writeStorage(REMINDERS_KEY, updated)
  return newReminder
}

export function updateReminder(id, reminderData) {
  const reminders = getReminders()
  const idx = reminders.findIndex((r) => String(r.id).toLowerCase() === String(id).toLowerCase())
  if (idx === -1) throw new Error(`Reminder ${id} not found`)

  reminders[idx] = { ...reminders[idx], ...reminderData, id, updatedAt: new Date().toISOString() }
  writeStorage(REMINDERS_KEY, reminders)
  return reminders[idx]
}

export function deleteReminder(id) {
  const reminders = getReminders()
  const filtered = reminders.filter((r) => String(r.id).toLowerCase() !== String(id).toLowerCase())
  writeStorage(REMINDERS_KEY, filtered)
  return true
}

export function markReminderSent(id) {
  return updateReminder(id, {
    status: 'Sent',
    sentAt: new Date().toISOString(),
  })
}

// -------------------------------------------------------------
// MODULE 13: EXTRA BRIEF FOR COURT TO OTHER ADVOCATE (EVIDENCE)
// -------------------------------------------------------------
export function getExtraBriefs() {
  return readStorage(EXTRA_BRIEFS_KEY, SEED_EXTRA_BRIEFS)
}

export function saveExtraBrief(briefData) {
  const briefs = getExtraBriefs()
  let maxNum = 8000
  briefs.forEach((b) => {
    const match = String(b.id).match(/\d+/)
    if (match) {
      const num = parseInt(match[0], 10)
      if (num > maxNum) maxNum = num
    }
  })
  const newId = `EB-${maxNum + 1}`

  const newBrief = {
    ...briefData,
    id: newId,
    hasIdNumber: !!briefData.hasIdNumber,
    idNumber: briefData.hasIdNumber ? String(briefData.idNumber || '').trim() : '',
    createdAt: new Date().toISOString(),
  }

  const updated = [newBrief, ...briefs]
  writeStorage(EXTRA_BRIEFS_KEY, updated)
  return newBrief
}

export function updateExtraBrief(id, briefData) {
  const briefs = getExtraBriefs()
  const idx = briefs.findIndex((b) => String(b.id).toLowerCase() === String(id).toLowerCase())
  if (idx === -1) throw new Error(`Extra Brief ${id} not found`)

  briefs[idx] = {
    ...briefs[idx],
    ...briefData,
    id,
    hasIdNumber: !!briefData.hasIdNumber,
    idNumber: briefData.hasIdNumber ? String(briefData.idNumber || '').trim() : '',
    updatedAt: new Date().toISOString(),
  }
  writeStorage(EXTRA_BRIEFS_KEY, briefs)
  return briefs[idx]
}

export function deleteExtraBrief(id) {
  const briefs = getExtraBriefs()
  const filtered = briefs.filter((b) => String(b.id).toLowerCase() !== String(id).toLowerCase())
  writeStorage(EXTRA_BRIEFS_KEY, filtered)
  return true
}

// -------------------------------------------------------------
// WAITING LIST APIS
// -------------------------------------------------------------
export function getWaitingList() {
  return readStorage(WAITING_LIST_KEY, SEED_WAITING_LIST)
}

export function saveWaitingListEntry(entryData) {
  const list = getWaitingList()
  let maxNum = 9000
  list.forEach((w) => {
    const match = String(w.id).match(/\d+/)
    if (match) {
      const num = parseInt(match[0], 10)
      if (num > maxNum) maxNum = num
    }
  })
  const newId = `WL-${maxNum + 1}`

  const newEntry = {
    ...entryData,
    id: newId,
    status: entryData.status || 'Waiting',
    date: entryData.date || new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  }

  const updated = [newEntry, ...list]
  writeStorage(WAITING_LIST_KEY, updated)
  return newEntry
}

export function updateWaitingListEntry(id, entryData) {
  const list = getWaitingList()
  const idx = list.findIndex((w) => String(w.id).toLowerCase() === String(id).toLowerCase())
  if (idx === -1) throw new Error(`Waiting list item ${id} not found`)

  list[idx] = { ...list[idx], ...entryData, id, updatedAt: new Date().toISOString() }
  writeStorage(WAITING_LIST_KEY, list)
  return list[idx]
}

export function deleteWaitingListEntry(id) {
  const list = getWaitingList()
  const filtered = list.filter((w) => String(w.id).toLowerCase() !== String(id).toLowerCase())
  writeStorage(WAITING_LIST_KEY, filtered)
  return true
}

// -------------------------------------------------------------
// COMPREHENSIVE PRACTICE OVERVIEW & STATS
// -------------------------------------------------------------
export function getPracticeOverviewStats() {
  const clients = getClients()
  const cases = getCases()
  const payments = getPayments()
  const expenses = getExpenses()
  const consultancy = getConsultancyFees()

  const totalClients = 3157 + Math.max(0, clients.length - 6)
  const totalCases = 3188 + Math.max(0, cases.length - 6)

  // Real sums of current records + base practice totals
  const totalBilling = cases.reduce((sum, c) => sum + Number(c.totalFees || 0), 0) + 22700000
  const totalPayment = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0) + 21300000
  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0) + 21400000
  const totalConsultancy = consultancy.reduce((sum, c) => sum + Number(c.amount || 0), 0) + 34000

  return {
    totalClients,
    totalCases,
    totalBilling,
    totalPayment,
    totalExpense,
    totalConsultancy,
  }
}

// -------------------------------------------------------------
// DATABASE BACKUP & RESTORE UTILITIES
// -------------------------------------------------------------
export function exportDatabaseAsJSON() {
  const payload = {
    version: '2.0',
    exportDate: new Date().toISOString(),
    clients: getClients(),
    cases: getCases(),
    payments: getPayments(),
    expenseHeads: getExpenseHeads(),
    expenses: getExpenses(),
    consultancyFees: getConsultancyFees(),
    documents: getDocuments(),
    reminders: getReminders(),
    extraBriefs: getExtraBriefs(),
    waitingList: getWaitingList(),
  }
  return JSON.stringify(payload, null, 2)
}

export function importDatabaseFromJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString)
    if (Array.isArray(data.clients)) writeStorage(CLIENTS_KEY, data.clients)
    if (Array.isArray(data.cases)) writeStorage(CASES_KEY, data.cases)
    if (Array.isArray(data.payments)) writeStorage(PAYMENTS_KEY, data.payments)
    if (Array.isArray(data.expenseHeads)) writeStorage(EXPENSE_HEADS_KEY, data.expenseHeads)
    if (Array.isArray(data.expenses)) writeStorage(EXPENSES_KEY, data.expenses)
    if (Array.isArray(data.consultancyFees)) writeStorage(CONSULTANCY_KEY, data.consultancyFees)
    if (Array.isArray(data.documents)) writeStorage(DOCUMENTS_META_KEY, data.documents)
    if (Array.isArray(data.reminders)) writeStorage(REMINDERS_KEY, data.reminders)
    if (Array.isArray(data.extraBriefs)) writeStorage(EXTRA_BRIEFS_KEY, data.extraBriefs)
    if (Array.isArray(data.waitingList)) writeStorage(WAITING_LIST_KEY, data.waitingList)
    dispatchStorageEvent()
    return true
  } catch (err) {
    console.error('Failed to import database:', err)
    throw new Error('Invalid JSON backup file format.')
  }
}
