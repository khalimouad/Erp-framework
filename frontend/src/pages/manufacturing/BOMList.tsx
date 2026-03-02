import { useQuery } from '@tanstack/react-query'
import { PageTemplate }    from '@/components/layout/PageTemplate'
import { AdvancedTable }   from '@/components/table/AdvancedTable'
import { Badge }           from '@/components/ui/Badge'
import { manufacturingApi } from '@/api/client'
import type { BOM }        from '@/types'
import type { ColumnDef }  from '@/types/ui'

const COLUMNS: ColumnDef<BOM>[] = [
  { key: 'id',         label: '#' },
  { key: 'product_id', label: 'Product ID' },
  { key: 'reference',  label: 'Reference', searchable: true },
  { key: 'quantity',   label: 'Output Qty', type: 'number' },
  {
    key: 'is_active',
    label: 'Status',
    render: (row: BOM) => (
      <Badge color={row.is_active ? 'green' : 'gray'} dot>
        {row.is_active ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
  { key: 'created_at', label: 'Created', type: 'date' },
]

export default function BOMList() {
  const { data, isLoading } = useQuery<BOM[]>({
    queryKey: ['boms'],
    queryFn: () => manufacturingApi.listBoms().then(r => r.data),
  })

  return (
    <PageTemplate
      title="Bill of Materials"
      breadcrumbs={[{ label: 'Manufacturing' }, { label: 'Bill of Materials' }]}
      loading={isLoading}
    >
      <div className="p-6">
        <AdvancedTable<BOM>
          columns={COLUMNS}
          data={data ?? []}
          rowKey="id"
          searchPlaceholder="Search BOMs..."
          emptyText="No bills of materials found"
        />
      </div>
    </PageTemplate>
  )
}
