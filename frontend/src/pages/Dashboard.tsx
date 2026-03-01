import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Package, UserCheck, Building2, ShoppingCart, Users, Stethoscope, Cog } from 'lucide-react'
import Header from '@/components/Layout/Header'
import StatCard from '@/components/common/StatCard'
import { crmApi, inventoryApi, hrApi, companiesApi, salesApi, medicalApi, manufacturingApi } from '@/api/client'
import { useVerticalStore } from '@/store/vertical'
import { VERTICALS } from '@/config/verticals'
import clsx from 'clsx'

export default function Dashboard() {
  const { vertical } = useVerticalStore()
  const config = VERTICALS[vertical]

  // Always fetch
  const { data: companies } = useQuery({ queryKey: ['companies-count'], queryFn: () => companiesApi.list() })
  const { data: employees } = useQuery({ queryKey: ['employees-count'], queryFn: () => hrApi.listEmployees(0, 1000) })

  // Conditional fetches based on vertical
  const { data: leads } = useQuery({ queryKey: ['leads-count'], queryFn: () => crmApi.listLeads(0, 1000), enabled: ['general', 'trading'].includes(vertical) })
  const { data: products } = useQuery({ queryKey: ['products-count'], queryFn: () => inventoryApi.listProducts(0, 1000), enabled: ['general', 'trading', 'manufacturing'].includes(vertical) })
  const { data: salesOrders } = useQuery({ queryKey: ['sales-count'], queryFn: () => salesApi.listOrders(0, 1000), enabled: ['general', 'trading'].includes(vertical) })
  const { data: patients } = useQuery({ queryKey: ['patients-count'], queryFn: () => medicalApi.listPatients(0, 1000), enabled: vertical === 'medical' })
  const { data: appointments } = useQuery({ queryKey: ['appointments-count'], queryFn: () => medicalApi.listAppointments(0, 50), enabled: vertical === 'medical' })
  const { data: workOrders } = useQuery({ queryKey: ['wo-count'], queryFn: () => manufacturingApi.listWorkOrders(0, 1000), enabled: vertical === 'manufacturing' })

  const statsByVertical = {
    general: [
      { title: 'Leads', value: leads?.data?.length ?? 0, icon: <TrendingUp size={24} />, color: 'blue' as const },
      { title: 'Sale Orders', value: salesOrders?.data?.length ?? 0, icon: <ShoppingCart size={24} />, color: 'green' as const },
      { title: 'Products', value: products?.data?.length ?? 0, icon: <Package size={24} />, color: 'purple' as const },
      { title: 'Employees', value: employees?.data?.length ?? 0, icon: <UserCheck size={24} />, color: 'orange' as const },
    ],
    trading: [
      { title: 'Leads', value: leads?.data?.length ?? 0, icon: <TrendingUp size={24} />, color: 'blue' as const },
      { title: 'Sale Orders', value: salesOrders?.data?.length ?? 0, icon: <ShoppingCart size={24} />, color: 'green' as const },
      { title: 'Products', value: products?.data?.length ?? 0, icon: <Package size={24} />, color: 'purple' as const },
      { title: 'Companies', value: companies?.data?.length ?? 0, icon: <Building2 size={24} />, color: 'orange' as const },
    ],
    medical: [
      { title: 'Patients', value: patients?.data?.length ?? 0, icon: <Users size={24} />, color: 'blue' as const },
      { title: 'Appointments Today', value: appointments?.data?.length ?? 0, icon: <Stethoscope size={24} />, color: 'green' as const },
      { title: 'Staff', value: employees?.data?.length ?? 0, icon: <UserCheck size={24} />, color: 'purple' as const },
      { title: 'Companies', value: companies?.data?.length ?? 0, icon: <Building2 size={24} />, color: 'orange' as const },
    ],
    manufacturing: [
      { title: 'Work Orders', value: workOrders?.data?.length ?? 0, icon: <Cog size={24} />, color: 'blue' as const },
      { title: 'Products', value: products?.data?.length ?? 0, icon: <Package size={24} />, color: 'green' as const },
      { title: 'Employees', value: employees?.data?.length ?? 0, icon: <UserCheck size={24} />, color: 'purple' as const },
      { title: 'Companies', value: companies?.data?.length ?? 0, icon: <Building2 size={24} />, color: 'orange' as const },
    ],
  }

  const stats = statsByVertical[vertical]

  return (
    <div>
      <Header title="Dashboard" />
      <div className="p-6 space-y-6">
        {/* Vertical banner */}
        <div className={clsx('flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium', config.color)}>
          <span className="font-semibold">{config.label}</span>
          <span className="opacity-70">—</span>
          <span className="font-normal opacity-80">{config.description}</span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <StatCard key={s.title} {...s} />
          ))}
        </div>

        {/* Quick links */}
        <div className="card p-6">
          <h3 className="text-base font-semibold mb-3">Quick Access</h3>
          <div className="flex flex-wrap gap-2">
            {config.navItems.map(({ to, label }) => (
              <a key={to} href={to} className="btn-secondary text-sm">
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
