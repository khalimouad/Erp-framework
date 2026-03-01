export interface User {
  id: number
  email: string
  full_name: string
  is_active: boolean
  is_superadmin: boolean
  company_id: number | null
  created_at: string
}

export interface Company {
  id: number
  name: string
  tax_id: string | null
  email: string | null
  phone: string | null
  address: string | null
  country: string | null
  currency: string
  is_active: boolean
  created_at: string
}

export interface Lead {
  id: number
  name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  company_id: number | null
  assigned_to: number | null
  status: 'new' | 'qualified' | 'proposition' | 'won' | 'lost'
  expected_revenue: number
  description: string | null
  expected_close_date: string | null
  created_at: string
  updated_at: string | null
}

export interface Product {
  id: number
  sku: string
  name: string
  description: string | null
  category_id: number | null
  unit_price: number
  cost_price: number
  unit_of_measure: string
  is_active: boolean
  created_at: string
}

export interface Employee {
  id: number
  first_name: string
  last_name: string
  job_title: string | null
  work_email: string | null
  work_phone: string | null
  department_id: number | null
  company_id: number | null
  hire_date: string | null
  salary: number
  is_active: boolean
  created_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: User
}
