import type { Vertical } from '@/types'

/**
 * Defines which navigation items appear for each vertical.
 * The `module` field matches the backend module name and the frontend route path.
 */
export interface NavItem {
  to: string
  label: string
  module: string
}

export interface VerticalConfig {
  label: string
  description: string
  color: string          // Tailwind background class for the badge
  navItems: NavItem[]
}

export const VERTICALS: Record<Vertical, VerticalConfig> = {
  general: {
    label: 'General ERP',
    description: 'Full enterprise suite — all modules enabled',
    color: 'bg-blue-100 text-blue-700',
    navItems: [
      { to: '/crm', label: 'CRM', module: 'crm' },
      { to: '/sales', label: 'Sales', module: 'sales' },
      { to: '/purchasing', label: 'Purchasing', module: 'purchasing' },
      { to: '/inventory', label: 'Inventory', module: 'inventory' },
      { to: '/accounting', label: 'Accounting', module: 'accounting' },
      { to: '/hr', label: 'HR', module: 'hr' },
    ],
  },
  trading: {
    label: 'Trading',
    description: 'Buy, sell, manage stock and suppliers',
    color: 'bg-green-100 text-green-700',
    navItems: [
      { to: '/crm', label: 'CRM', module: 'crm' },
      { to: '/sales', label: 'Sales Orders', module: 'sales' },
      { to: '/purchasing', label: 'Purchase Orders', module: 'purchasing' },
      { to: '/inventory', label: 'Inventory', module: 'inventory' },
    ],
  },
  medical: {
    label: 'Medical / Clinic',
    description: 'Patients, appointments, prescriptions & pharmacy',
    color: 'bg-red-100 text-red-700',
    navItems: [
      { to: '/medical/patients', label: 'Patients', module: 'medical' },
      { to: '/medical/appointments', label: 'Appointments', module: 'medical' },
      { to: '/medical/pharmacy', label: 'Pharmacy', module: 'medical' },
      { to: '/hr', label: 'Staff / HR', module: 'hr' },
    ],
  },
  manufacturing: {
    label: 'Manufacturing',
    description: 'Production orders, BOM and quality control',
    color: 'bg-orange-100 text-orange-700',
    navItems: [
      { to: '/manufacturing/work-orders', label: 'Work Orders', module: 'manufacturing' },
      { to: '/manufacturing/bom', label: 'Bill of Materials', module: 'manufacturing' },
      { to: '/inventory', label: 'Inventory', module: 'inventory' },
      { to: '/quality', label: 'Quality Control', module: 'quality' },
      { to: '/purchasing', label: 'Purchasing', module: 'purchasing' },
      { to: '/hr', label: 'HR', module: 'hr' },
    ],
  },
}
