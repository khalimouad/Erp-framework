import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Package, UserCheck, Building2, ShoppingCart, Users, Stethoscope, Cog, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

import { PageTemplate } from '@/components/layout/PageTemplate'
import { useVerticalStore } from '@/store/vertical'
import { VERTICALS } from '@/config/verticals'
import { crmApi, inventoryApi, hrApi, companiesApi, salesApi, medicalApi, manufacturingApi } from '@/api/client'

// ── stat card ─────────────────────────────────────────────────────────────────

const COLOR_MAP = {
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   icon: 'bg-blue-100'   },
  green:  { bg: 'bg-green-50',  text: 'text-green-600',  icon: 'bg-green-100'  },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'bg-purple-100' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', icon: 'bg-orange-100' },
} as const

type Color = keyof typeof COLOR_MAP

function StatCard({ title, value, icon, color, href }: {
  title: string; value: number; icon: React.ReactNode; color: Color; href?: string
}) {
  const c = COLOR_MAP[color]
  const inner = (
    <div className={clsx('rounded-xl border border-gray-100 p-5 flex items-center gap-4 transition-shadow hover:shadow-md', c.bg)}>
      <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', c.icon, c.text)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        <p className={clsx('text-sm font-medium', c.text)}>{title}</p>
      </div>
      {href && <ArrowRight size={16} className="text-gray-400 flex-shrink-0" />}
    </div>
  )
  return href ? <Link to={href}>{inner}</Link> : inner
}

// ── main ──────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { vertical } = useVerticalStore()
  const config = VERTICALS[vertical]

  const { data: companies }    = useQuery({ queryKey: ['companies-count'],     queryFn: () => companiesApi.list() })
  const { data: employees }    = useQuery({ queryKey: ['employees-count'],     queryFn: () => hrApi.listEmployees(0, 1000) })
  const { data: leads }        = useQuery({ queryKey: ['leads-count'],         queryFn: () => crmApi.listLeads(0, 1000),             enabled: ['general', 'trading'].includes(vertical) })
  const { data: products }     = useQuery({ queryKey: ['products-count'],      queryFn: () => inventoryApi.listProducts(0, 1000),    enabled: ['general', 'trading', 'manufacturing'].includes(vertical) })
  const { data: salesOrders }  = useQuery({ queryKey: ['sales-count'],        queryFn: () => salesApi.listOrders(0, 1000),          enabled: ['general', 'trading'].includes(vertical) })
  const { data: patients }     = useQuery({ queryKey: ['patients-count'],     queryFn: () => medicalApi.listPatients(0, 1000),      enabled: vertical === 'medical' })
  const { data: appointments } = useQuery({ queryKey: ['appointments-count'], queryFn: () => medicalApi.listAppointments(0, 50),    enabled: vertical === 'medical' })
  const { data: workOrders }   = useQuery({ queryKey: ['wo-count'],           queryFn: () => manufacturingApi.listWorkOrders(0, 1000), enabled: vertical === 'manufacturing' })

  const statsByVertical: Record<string, { title: string; value: number; icon: React.ReactNode; color: Color; href: string }[]> = {
    general: [
      { title: 'Leads',       value: leads?.data?.length ?? 0,       icon: <TrendingUp size={22} />,  color: 'blue',   href: '/crm' },
      { title: 'Sale Orders', value: salesOrders?.data?.length ?? 0, icon: <ShoppingCart size={22} />,color: 'green',  href: '/sales' },
      { title: 'Products',    value: products?.data?.length ?? 0,    icon: <Package size={22} />,     color: 'purple', href: '/inventory' },
      { title: 'Employees',   value: employees?.data?.length ?? 0,   icon: <UserCheck size={22} />,   color: 'orange', href: '/hr' },
    ],
    trading: [
      { title: 'Leads',       value: leads?.data?.length ?? 0,       icon: <TrendingUp size={22} />,  color: 'blue',   href: '/crm' },
      { title: 'Sale Orders', value: salesOrders?.data?.length ?? 0, icon: <ShoppingCart size={22} />,color: 'green',  href: '/sales' },
      { title: 'Products',    value: products?.data?.length ?? 0,    icon: <Package size={22} />,     color: 'purple', href: '/inventory' },
      { title: 'Companies',   value: companies?.data?.length ?? 0,   icon: <Building2 size={22} />,   color: 'orange', href: '/companies' },
    ],
    medical: [
      { title: 'Patients',     value: patients?.data?.length ?? 0,     icon: <Users size={22} />,       color: 'blue',   href: '/medical/patients' },
      { title: 'Appointments', value: appointments?.data?.length ?? 0, icon: <Stethoscope size={22} />, color: 'green',  href: '/medical/appointments' },
      { title: 'Staff',        value: employees?.data?.length ?? 0,    icon: <UserCheck size={22} />,   color: 'purple', href: '/hr' },
      { title: 'Companies',    value: companies?.data?.length ?? 0,    icon: <Building2 size={22} />,   color: 'orange', href: '/companies' },
    ],
    manufacturing: [
      { title: 'Work Orders', value: workOrders?.data?.length ?? 0, icon: <Cog size={22} />,       color: 'blue',   href: '/manufacturing/work-orders' },
      { title: 'Products',    value: products?.data?.length ?? 0,   icon: <Package size={22} />,   color: 'green',  href: '/inventory' },
      { title: 'Employees',   value: employees?.data?.length ?? 0,  icon: <UserCheck size={22} />, color: 'purple', href: '/hr' },
      { title: 'Companies',   value: companies?.data?.length ?? 0,  icon: <Building2 size={22} />, color: 'orange', href: '/companies' },
    ],
  }

  const stats = statsByVertical[vertical] ?? statsByVertical.general

  return (
    <PageTemplate
      title="Dashboard"
      breadcrumbs={[{ label: 'Dashboard' }]}
    >
      <div className="p-6 space-y-6">
        {/* Vertical banner */}
        <div className={clsx('flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium', config.color)}>
          <span className="font-semibold">{config.label}</span>
          <span className="opacity-60">—</span>
          <span className="font-normal opacity-80">{config.description}</span>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => <StatCard key={s.title} {...s} />)}
        </div>

        {/* Quick nav */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Access</h3>
          <div className="flex flex-wrap gap-2">
            {config.navItems.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-colors"
              >
                {label}
                <ArrowRight size={12} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </PageTemplate>
  )
}
