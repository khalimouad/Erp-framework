import { useQuery } from '@tanstack/react-query'
import Header from '@/components/Layout/Header'
import DataTable from '@/components/common/DataTable'
import { manufacturingApi } from '@/api/client'
import type { BOM } from '@/types'

export default function BOMList() {
  const { data, isLoading } = useQuery({
    queryKey: ['boms'],
    queryFn: () => manufacturingApi.listBoms(),
  })

  const columns = [
    { key: 'id', label: '#' },
    { key: 'product_id', label: 'Product ID' },
    { key: 'reference', label: 'Reference' },
    { key: 'quantity', label: 'Output Qty' },
    {
      key: 'is_active', label: 'Status',
      render: (row: BOM) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    { key: 'created_at', label: 'Created', render: (row: BOM) => new Date(row.created_at).toLocaleDateString() },
  ]

  return (
    <div>
      <Header title="Manufacturing — Bill of Materials" />
      <div className="p-6 space-y-4">
        <p className="text-gray-500 text-sm">{data?.data?.length ?? 0} BOMs</p>
        <div className="card">
          <DataTable<BOM> columns={columns} data={data?.data ?? []} loading={isLoading} />
        </div>
      </div>
    </div>
  )
}
