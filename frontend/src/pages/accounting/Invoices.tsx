import { useQuery } from '@tanstack/react-query'
import Header from '@/components/Layout/Header'
import DataTable from '@/components/common/DataTable'
import { accountingApi } from '@/api/client'
import type { Invoice } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-200 text-gray-500',
}

export default function Invoices() {
  const { data, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => accountingApi.listInvoices(),
  })

  const columns = [
    { key: 'reference', label: 'Reference' },
    { key: 'invoice_type', label: 'Type', render: (row: Invoice) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.invoice_type === 'customer' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
        {row.invoice_type}
      </span>
    )},
    { key: 'partner_name', label: 'Partner' },
    { key: 'issue_date', label: 'Date' },
    { key: 'due_date', label: 'Due Date' },
    { key: 'total_amount', label: 'Total', render: (row: Invoice) => `$${row.total_amount.toLocaleString()}` },
    { key: 'amount_paid', label: 'Paid', render: (row: Invoice) => `$${row.amount_paid.toLocaleString()}` },
    {
      key: 'status', label: 'Status',
      render: (row: Invoice) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[row.status]}`}>{row.status}</span>
      ),
    },
  ]

  return (
    <div>
      <Header title="Accounting — Invoices" />
      <div className="p-6 space-y-4">
        <p className="text-gray-500 text-sm">{data?.data?.length ?? 0} invoices</p>
        <div className="card">
          <DataTable<Invoice> columns={columns} data={data?.data ?? []} loading={isLoading} />
        </div>
      </div>
    </div>
  )
}
