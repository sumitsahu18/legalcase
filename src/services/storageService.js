// Persistent Storage Service for LegalCase Management
// Ensures clients and cases persist across sessions and page reloads.

const CLIENTS_KEY = 'legalcase_clients_data_v1'
const CASES_KEY = 'legalcase_cases_data_v1'
const EVENT_NAME = 'legalcase_storage_updated'

// Seed clients reflecting an established advocate's practice
const SEED_CLIENTS = [
  {
    id: 'CL-1001',
    name: 'Rajesh Kumar Sharma',
    relation: 'S/O Late Ramesh Sharma',
    address: 'Vill-Digha, PO-Digha, PS-Digha, Medinipur East, PIN-721428',
    phone: '9832104512',
    referenceName: 'Subhasish Mondal (Pradhan)',
    referencePhone: '9434198230',
    fees: 15000,
    date: '2026-08-14',
    createdAt: '2026-08-14T10:30:00.000Z',
  },
  {
    id: 'CL-1002',
    name: 'Sunita Devi Adhikari',
    relation: 'W/O Pradip Adhikari',
    address: 'Station Road, Contai, PS-Contai, Medinipur East, PIN-721401',
    phone: '9733481290',
    referenceName: 'Advocate B. K. Patra',
    referencePhone: '9830219401',
    fees: 25000,
    date: '2026-09-02',
    createdAt: '2026-09-02T11:15:00.000Z',
  },
  {
    id: 'CL-1003',
    name: 'Debashis Roy Chowdhury',
    relation: 'S/O Manoranjan Roy',
    address: 'Bhograi Bazar, Jaleswar Border, Medinipur East, PIN-721442',
    phone: '8918234190',
    referenceName: 'Dr. S. K. Mahapatra',
    referencePhone: '9475102938',
    fees: 30000,
    date: '2026-09-18',
    createdAt: '2026-09-18T14:20:00.000Z',
  },
  {
    id: 'CL-1004',
    name: 'Manas Ranjan Giri',
    relation: 'S/O Birendra Nath Giri',
    address: 'Talgachhari, PS-Ramnagar, Medinipur East, PIN-721441',
    phone: '9434810293',
    referenceName: 'Chanchal Jana',
    referencePhone: '9123847192',
    fees: 12000,
    date: '2026-10-05',
    createdAt: '2026-10-05T09:45:00.000Z',
  },
  {
    id: 'CL-1005',
    name: 'Priyanka Mukherjee',
    relation: 'D/O Ashim Mukherjee',
    address: 'Ward No 4, Egra Municipality, Medinipur East, PIN-721429',
    phone: '9831920381',
    referenceName: 'Tapan Kumar Sen',
    referencePhone: '9732104928',
    fees: 18000,
    date: '2026-10-22',
    createdAt: '2026-10-22T16:00:00.000Z',
  },
  {
    id: 'CL-1006',
    name: 'Amitava Sen',
    relation: 'S/O Late Bimal Sen',
    address: 'Kalyanpur, PS-Ramnagar, Medinipur East, PIN-721441',
    phone: '8250192841',
    referenceName: 'Direct Client',
    referencePhone: '',
    fees: 20000,
    date: '2026-11-01',
    createdAt: '2026-11-01T12:10:00.000Z',
  },
]

// Seed cases linked to clients
const SEED_CASES = [
  {
    id: 'CS-2001',
    clientId: 'CL-1001',
    clientName: 'Rajesh Kumar Sharma',
    phone: '9832104512',
    caseNumber: 'CR/342/2026',
    nextDate: '2026-11-20',
    purpose: 'Evidence / Cross Examination',
    courtName: 'ACJM Court, Contai',
    ppName: 'Mr. S. K. Bera (APP)',
    otherCaseNumber: 'Ramnagar PS Case No. 84/2025',
    createdAt: '2026-08-14T11:00:00.000Z',
  },
  {
    id: 'CS-2002',
    clientId: 'CL-1002',
    clientName: 'Sunita Devi Adhikari',
    phone: '9733481290',
    caseNumber: 'TS/108/2026',
    nextDate: '2026-11-25',
    purpose: 'Hearing on Injunction Application',
    courtName: 'Civil Judge (Sr. Div), Contai',
    ppName: 'Adv. Amit Roy (Opp. Counsel)',
    otherCaseNumber: 'Title Suit Registration No. 492',
    createdAt: '2026-09-02T12:00:00.000Z',
  },
  {
    id: 'CS-2003',
    clientId: 'CL-1003',
    clientName: 'Debashis Roy Chowdhury',
    phone: '8918234190',
    caseNumber: 'BL/89/2026',
    nextDate: '2026-11-18',
    purpose: 'Anticipatory Bail Hearing',
    courtName: 'Sessions Court, Medinipur',
    ppName: 'Public Prosecutor, Medinipur East',
    otherCaseNumber: 'Digha Coastal PS GR-1204/25',
    createdAt: '2026-09-18T15:00:00.000Z',
  },
  {
    id: 'CS-2004',
    clientId: 'CL-1001',
    clientName: 'Rajesh Kumar Sharma',
    phone: '9832104512',
    caseNumber: 'MISC/44/2026',
    nextDate: '2026-12-02',
    purpose: 'Production of Certified Deeds',
    courtName: 'Sub-Divisional Magistrate Court, Contai',
    ppName: 'State Represented by BL&LRO',
    otherCaseNumber: 'LR Record Rectification Case 14',
    createdAt: '2026-09-25T10:00:00.000Z',
  },
  {
    id: 'CS-2005',
    clientId: 'CL-1004',
    clientName: 'Manas Ranjan Giri',
    phone: '9434810293',
    caseNumber: 'EX/19/2026',
    nextDate: '2026-11-28',
    purpose: 'Execution of Money Decree',
    courtName: 'Civil Judge (Jr. Div), Contai',
    ppName: 'Adv. P. K. Das (Decree Holder)',
    otherCaseNumber: 'Execution Case No. 19/2026',
    createdAt: '2026-10-05T10:30:00.000Z',
  },
  {
    id: 'CS-2006',
    clientId: 'CL-1005',
    clientName: 'Priyanka Mukherjee',
    phone: '9831920381',
    caseNumber: 'MAT/52/2026',
    nextDate: '2026-12-05',
    purpose: 'Mediation & Conciliation Session',
    courtName: 'District Family Court, Medinipur',
    ppName: 'Mediator: Adv. Tapati Sen',
    otherCaseNumber: 'Section 125 CrPC Petition',
    createdAt: '2026-10-22T16:30:00.000Z',
  },
]

function dispatchStorageEvent() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_NAME))
  }
}

// ----------------- Client APIs -----------------

export function getClients() {
  try {
    const raw = localStorage.getItem(CLIENTS_KEY)
    if (!raw) {
      localStorage.setItem(CLIENTS_KEY, JSON.stringify(SEED_CLIENTS))
      return SEED_CLIENTS
    }
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : SEED_CLIENTS
  } catch (err) {
    console.error('Error reading clients from storage:', err)
    return SEED_CLIENTS
  }
}

export function getClientById(id) {
  const clients = getClients()
  return clients.find((c) => String(c.id).toLowerCase() === String(id).toLowerCase()) || null
}

export function saveClient(clientData) {
  const clients = getClients()
  // Generate next Client ID e.g. CL-1007
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
    fees: Number(clientData.fees || 0),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const updated = [newClient, ...clients]
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(updated))
  dispatchStorageEvent()
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
    id, // preserve original ID
    fees: Number(clientData.fees || 0),
    updatedAt: new Date().toISOString(),
  }

  clients[idx] = updatedClient
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients))

  // Synchronize client details in linked cases as well
  try {
    const cases = getCases()
    let caseChanged = false
    const updatedCases = cases.map((cs) => {
      if (String(cs.clientId).toLowerCase() === String(id).toLowerCase()) {
        caseChanged = true
        return {
          ...cs,
          clientName: updatedClient.name,
          phone: updatedClient.phone,
        }
      }
      return cs
    })
    if (caseChanged) {
      localStorage.setItem(CASES_KEY, JSON.stringify(updatedCases))
    }
  } catch (e) {
    console.error('Failed to update linked cases:', e)
  }

  dispatchStorageEvent()
  return updatedClient
}

export function deleteClient(id) {
  const clients = getClients()
  const filtered = clients.filter((c) => String(c.id).toLowerCase() !== String(id).toLowerCase())
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(filtered))
  dispatchStorageEvent()
  return true
}

// ----------------- Case APIs -----------------

export function getCases() {
  try {
    const raw = localStorage.getItem(CASES_KEY)
    if (!raw) {
      localStorage.setItem(CASES_KEY, JSON.stringify(SEED_CASES))
      return SEED_CASES
    }
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : SEED_CASES
  } catch (err) {
    console.error('Error reading cases from storage:', err)
    return SEED_CASES
  }
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

  const newCase = {
    ...caseData,
    id: newId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const updated = [newCase, ...cases]
  localStorage.setItem(CASES_KEY, JSON.stringify(updated))
  dispatchStorageEvent()
  return newCase
}

export function updateCase(id, caseData) {
  const cases = getCases()
  const idx = cases.findIndex((c) => String(c.id).toLowerCase() === String(id).toLowerCase())
  if (idx === -1) {
    throw new Error(`Case with ID ${id} not found`)
  }

  const updatedCase = {
    ...cases[idx],
    ...caseData,
    id,
    updatedAt: new Date().toISOString(),
  }

  cases[idx] = updatedCase
  localStorage.setItem(CASES_KEY, JSON.stringify(cases))
  dispatchStorageEvent()
  return updatedCase
}

export function deleteCase(id) {
  const cases = getCases()
  const filtered = cases.filter((c) => String(c.id).toLowerCase() !== String(id).toLowerCase())
  localStorage.setItem(CASES_KEY, JSON.stringify(filtered))
  dispatchStorageEvent()
  return true
}

// ----------------- Event Listener Hook Helper -----------------

export function onStorageUpdate(callback) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(EVENT_NAME, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(EVENT_NAME, callback)
    window.removeEventListener('storage', callback)
  }
}
