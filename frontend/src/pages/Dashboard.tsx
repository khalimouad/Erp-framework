import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Package, UserCheck, Building2 } from 'lucide-react'
import Header from '@/components/Layout/Header'
import StatCard from '@/components/common/StatCard'
import { crmApi, inventoryApi, hrApi, companiesApi } from '@/api/client'

export default function Dashboard() {
  const { data: leads } = useQuery({ queryKey: ['leads-count'], queryFn: () => crmApi.listLeads(0, 1000) })
  const { data: products } = useQuery({ queryKey: ['products-count'], queryFn: () => inventoryApi.listProducts(0, 1000) })
  const { data: employees } = useQuery({ queryKey: ['employees-count'], queryFn: () => hrApi.listEmployees(0, 1000) })
  const { data: companies } = useQuery({ queryKey: ['companies-count'], queryFn: () => companiesApi.list() })

  const stats = [
    {
      title: 'Total Leads',
      value: leads?.data?.length ?? 0,
      icon: <TrendingUp size={24} />,
      color: 'blue' as const,
    },
    {
      title: 'Products',
      value: products?.data?.length ?? 0,
      icon: <Package size={24} />,
      color: 'green' as const,
    },
    {
      title: 'Employees',
      value: employees?.data?.length ?? 0,
      icon: <UserCheck size={24} />,
      color: 'purple' as const,
    },
    {
      title: 'Companies',
      value: companies?.data?.length ?? 0,
      icon: <Building2 size={24} />,
      color: 'orange' as const,
    },
  ]

  return (
    <div>
      <Header title="Dashboard" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <StatCard key={s.title} {...s} />
          ))}
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-2">Welcome to NextERP</h3>
          <p className="text-gray-500 text-sm">
            A modular ERP framework built with FastAPI + React. Navigate using the sidebar to manage
            your CRM leads, inventory, HR, and more.
          </p>
        </div>
      </div>
    </div>
  )
}
