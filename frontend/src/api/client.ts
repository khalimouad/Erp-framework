import axios from 'axios'

export const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

// --- Health / Vertical info ---
export const healthApi = {
  info: () => axios.get('/'),  // hits root, no auth needed
}

// --- Auth ---
export const authApi = {
  login: (email: string, password: string) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    return api.post('/users/auth/token', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },
  me: () => api.get('/users/me'),
}

// --- Users ---
export const usersApi = {
  list: (skip = 0, limit = 50) => api.get(`/users/?skip=${skip}&limit=${limit}`),
  get: (id: number) => api.get(`/users/${id}`),
  create: (data: object) => api.post('/users/', data),
  update: (id: number, data: object) => api.patch(`/users/${id}`, data),
  // Role assignment
  listRoles: (userId: number) => api.get(`/users/${userId}/roles`),
  assignRole: (userId: number, roleId: number) => api.post(`/users/${userId}/roles`, { role_id: roleId }),
  revokeRole: (userId: number, roleId: number) => api.delete(`/users/${userId}/roles/${roleId}`),
}

// --- CRM ---
export const crmApi = {
  listLeads: (skip = 0, limit = 50) => api.get(`/crm/leads?skip=${skip}&limit=${limit}`),
  getLead: (id: number) => api.get(`/crm/leads/${id}`),
  createLead: (data: object) => api.post('/crm/leads', data),
  updateLead: (id: number, data: object) => api.patch(`/crm/leads/${id}`, data),
  deleteLead: (id: number) => api.delete(`/crm/leads/${id}`),
}

// --- Inventory ---
export const inventoryApi = {
  listProducts: (skip = 0, limit = 50) => api.get(`/inventory/products?skip=${skip}&limit=${limit}`),
  createProduct: (data: object) => api.post('/inventory/products', data),
  updateProduct: (id: number, data: object) => api.patch(`/inventory/products/${id}`, data),
  recordMove: (data: object) => api.post('/inventory/stock-moves', data),
  getStockLevel: (productId: number, warehouseId: number) =>
    api.get(`/inventory/stock-level?product_id=${productId}&warehouse_id=${warehouseId}`),
}

// --- Sales ---
export const salesApi = {
  listOrders: (skip = 0, limit = 50) => api.get(`/sales/orders?skip=${skip}&limit=${limit}`),
  getOrder: (id: number) => api.get(`/sales/orders/${id}`),
  createOrder: (data: object) => api.post('/sales/orders', data),
  updateOrder: (id: number, data: object) => api.patch(`/sales/orders/${id}`, data),
}

// --- Purchasing ---
export const purchasingApi = {
  listOrders: (skip = 0, limit = 50) => api.get(`/purchasing/orders?skip=${skip}&limit=${limit}`),
  createOrder: (data: object) => api.post('/purchasing/orders', data),
  updateOrder: (id: number, data: object) => api.patch(`/purchasing/orders/${id}`, data),
}

// --- HR ---
export const hrApi = {
  listEmployees: (skip = 0, limit = 50) => api.get(`/hr/employees?skip=${skip}&limit=${limit}`),
  createEmployee: (data: object) => api.post('/hr/employees', data),
  updateEmployee: (id: number, data: object) => api.patch(`/hr/employees/${id}`, data),
}

// --- Medical ---
export const medicalApi = {
  listPatients: (skip = 0, limit = 50) => api.get(`/medical/patients?skip=${skip}&limit=${limit}`),
  createPatient: (data: object) => api.post('/medical/patients', data),
  updatePatient: (id: number, data: object) => api.patch(`/medical/patients/${id}`, data),
  listAppointments: (skip = 0, limit = 50) => api.get(`/medical/appointments?skip=${skip}&limit=${limit}`),
  createAppointment: (data: object) => api.post('/medical/appointments', data),
  updateAppointment: (id: number, data: object) => api.patch(`/medical/appointments/${id}`, data),
  listPharmacy: () => api.get('/medical/pharmacy'),
  createPharmacyItem: (data: object) => api.post('/medical/pharmacy', data),
  lowStock: () => api.get('/medical/pharmacy/low-stock'),
  createPrescription: (data: object) => api.post('/medical/prescriptions', data),
  createRecord: (data: object) => api.post('/medical/records', data),
}

// --- Manufacturing ---
export const manufacturingApi = {
  listBoms: () => api.get('/manufacturing/bom'),
  createBom: (data: object) => api.post('/manufacturing/bom', data),
  listWorkOrders: (skip = 0, limit = 50) => api.get(`/manufacturing/work-orders?skip=${skip}&limit=${limit}`),
  createWorkOrder: (data: object) => api.post('/manufacturing/work-orders', data),
  updateWorkOrder: (id: number, data: object) => api.patch(`/manufacturing/work-orders/${id}`, data),
}

// --- Quality ---
export const qualityApi = {
  listQcs: () => api.get('/quality/'),
  createQc: (data: object) => api.post('/quality/', data),
  updateQc: (id: number, data: object) => api.patch(`/quality/${id}`, data),
}

// --- Accounting ---
export const accountingApi = {
  listInvoices: (skip = 0, limit = 50) => api.get(`/accounting/invoices?skip=${skip}&limit=${limit}`),
  createInvoice: (data: object) => api.post('/accounting/invoices', data),
  updateInvoice: (id: number, data: object) => api.patch(`/accounting/invoices/${id}`, data),
  addPayment: (invoiceId: number, data: object) => api.post(`/accounting/invoices/${invoiceId}/payments`, data),
}

// --- Companies ---
export const companiesApi = {
  list: () => api.get('/companies/'),
  create: (data: object) => api.post('/companies/', data),
}

// --- Base (module registry + system config + roles) ---
export const baseApi = {
  // Modules
  listModules: () => api.get('/base/modules'),
  installModule: (name: string) => api.post(`/base/modules/${name}/install`),
  uninstallModule: (name: string) => api.post(`/base/modules/${name}/uninstall`),
  // Config
  listConfig: (group?: string) =>
    api.get('/base/config' + (group ? `?group=${group}` : '')),
  setConfig: (key: string, value: string) =>
    api.put(`/base/config/${key}`, { value }),
  // Sequences
  listSequences: () => api.get('/base/sequences'),
  // Roles
  listRoles: (module?: string) =>
    api.get('/base/roles' + (module ? `?module=${module}` : '')),
  getRole: (id: number) => api.get(`/base/roles/${id}`),
}
