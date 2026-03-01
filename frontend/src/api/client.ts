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

// --- HR ---
export const hrApi = {
  listEmployees: (skip = 0, limit = 50) => api.get(`/hr/employees?skip=${skip}&limit=${limit}`),
  createEmployee: (data: object) => api.post('/hr/employees', data),
  updateEmployee: (id: number, data: object) => api.patch(`/hr/employees/${id}`, data),
}

// --- Companies ---
export const companiesApi = {
  list: () => api.get('/companies/'),
  create: (data: object) => api.post('/companies/', data),
}
