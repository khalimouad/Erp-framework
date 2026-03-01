export type Vertical = 'general' | 'trading' | 'medical' | 'manufacturing'

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

export interface SaleOrder {
  id: number
  reference: string
  customer_name: string
  customer_email: string | null
  status: 'draft' | 'confirmed' | 'shipped' | 'invoiced' | 'cancelled'
  total_amount: number
  created_at: string
}

export interface PurchaseOrder {
  id: number
  reference: string
  vendor_name: string
  status: 'draft' | 'sent' | 'received' | 'cancelled'
  total_amount: number
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

// Medical
export interface Patient {
  id: number
  patient_code: string
  first_name: string
  last_name: string
  date_of_birth: string | null
  gender: 'male' | 'female' | 'other' | null
  blood_type: string | null
  phone: string | null
  email: string | null
  allergies: string | null
  chronic_conditions: string | null
  insurance_provider: string | null
  is_active: boolean
  created_at: string
}

export interface Appointment {
  id: number
  patient_id: number
  doctor_id: number | null
  appointment_date: string
  duration_minutes: number
  appointment_type: string | null
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  notes: string | null
  created_at: string
}

export interface PharmacyItem {
  id: number
  drug_name: string
  generic_name: string | null
  dosage_form: string | null
  strength: string | null
  quantity_on_hand: number
  reorder_level: number
  unit_price: number
  expiry_date: string | null
  is_active: boolean
  created_at: string
}

// Manufacturing
export interface WorkOrder {
  id: number
  reference: string
  bom_id: number
  quantity_planned: number
  quantity_produced: number
  status: 'draft' | 'confirmed' | 'in_progress' | 'done' | 'cancelled'
  scheduled_start: string | null
  scheduled_end: string | null
  created_at: string
}

export interface BOM {
  id: number
  product_id: number
  reference: string | null
  quantity: number
  is_active: boolean
  created_at: string
}

// Accounting
export interface Invoice {
  id: number
  reference: string
  invoice_type: 'customer' | 'vendor'
  partner_name: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  total_amount: number
  amount_paid: number
  issue_date: string
  due_date: string | null
  created_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: User
}
