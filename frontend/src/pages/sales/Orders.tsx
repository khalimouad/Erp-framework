import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { PageTemplate }  from '@/components/layout/PageTemplate'
import { AdvancedTable } from '@/components/table/AdvancedTable'
import { Modal }         from '@/components/ui/Modal'
import { Button }        from '@/components/ui/Button'
import { Badge }         from '@/components/ui/Badge'
import { FormView }      from '@/components/form/FormView'
import { LinesTable }    from '@/components/form/LinesTable'
import { salesApi }       from '@/api/client'
import { ResponsiveTable } from '@/components/views/ResponsiveTable'
import type { SaleOrder }  from '@/types'
import type { ColumnDef, RowAction, FormFieldDef, LineColumnDef } from '@/types/ui'

const STATUS_COLOR: Record<string, string> = {
  draft: 'gray', confirmed: 'blue', shipped: 'yellow', invoiced: 'green', cancelled: 'red',
}

const COLUMNS: ColumnDef<SaleOrder>[] = [
  { key: 'reference',     label: 'Reference', searchable: true },
  { key: 'customer_name', label: 'Customer',  searchable: true },
  {
    key: 'status',
    label: 'Status',
    render: (row: SaleOrder) => (
      <Badge color={STATUS_COLOR[row.status] ?? 'gray'}>
        {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
      </Badge>
    ),
  },
  { key: 'total_amount', label: 'Total', type: 'currency' },
  { key: 'created_at',   label: 'Date',  type: 'date' },
]

const FIELDS: FormFieldDef[] = [
  { key: 'customer_name',  label: 'Customer Name',  type: 'text',  required: true },
  { key: 'customer_email', label: 'Customer Email', type: 'email' },
]

const LINE_COLUMNS: LineColumnDef[] = [
  { key: 'description', label: 'Description', type: 'text',     editable: true },
  { key: 'quantity',    label: 'Qty',         type: 'number',   editable: true, width: '100px' },
  { key: 'unit_price',  label: 'Unit Price',  type: 'currency', editable: true, width: '120px' },
  { key: 'subtotal',    label: 'Subtotal',    type: 'currency', editable: false, width: '120px' },
]

type OrderLine = { description: string; quantity: number; unit_price: number; subtotal?: number }

export default function SalesOrders() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<SaleOrder | null>(null)
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [lines, setLines] = useState<OrderLine[]>([])

  const { data, isLoading } = useQuery<SaleOrder[]>({
    queryKey: ['sale-orders'],
    queryFn: () => salesApi.listOrders().then(r => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) =>
      editing ? salesApi.updateOrder(editing.id, d) : salesApi.createOrder(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sale-orders'] })
      setOpen(false)
      setEditing(null)
    },
  })

  const rowActions: RowAction<SaleOrder>[] = [
    {
      key: 'edit',
      label: 'Edit',
      onClick: (r) => {
        setEditing(r)
        setFormData({ ...r })
        setLines((r as SaleOrder & { lines?: OrderLine[] }).lines ?? [])
        setOpen(true)
      },
    },
  ]

  const computedLines = lines.map(l => ({
    ...l,
    subtotal: (l.quantity ?? 0) * (l.unit_price ?? 0),
  }))

  const openNew = () => {
    setEditing(null)
    setFormData({})
    setLines([])
    setOpen(true)
  }

  return (
    <PageTemplate
      title="Sales Orders"
      breadcrumbs={[{ label: 'Sales' }, { label: 'Orders' }]}
      actions={[{
        key: 'new',
        label: 'New Order',
        icon: <Plus size={14} />,
        variant: 'primary',
        onClick: openNew,
      }]}
      loading={isLoading}
    >
      <div className="p-4 sm:p-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="sm:hidden">
            <ResponsiveTable<SaleOrder>
              columns={[
                { key: 'reference',     label: 'Reference' },
                { key: 'customer_name', label: 'Customer' },
              ]}
              data={data ?? []}
              rowKey="id"
              loading={isLoading}
              buildRowActions={(r) => [{ key: 'edit', label: 'Edit', onClick: () => rowActions[0].onClick(r) }]}
              onRowClick={(r) => rowActions[0].onClick(r)}
              mobileStatusRender={(r) => (
                <Badge color={STATUS_COLOR[r.status] ?? 'gray'} size="xs">
                  {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                </Badge>
              )}
              emptyTitle="No orders yet"
              emptyText="Create your first sales order."
            />
          </div>
          <div className="hidden sm:block">
            <AdvancedTable<SaleOrder>
              columns={COLUMNS}
              data={data ?? []}
              rowKey="id"
              rowActions={rowActions}
              searchPlaceholder="Search orders..."
              emptyText="No orders found"
            />
          </div>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Edit — ${editing.reference}` : 'New Order'}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              loading={saveMutation.isPending}
              onClick={() => saveMutation.mutate({ ...formData, lines: computedLines })}
            >
              Save
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormView fields={FIELDS} data={formData} onChange={setFormData} readOnly={false} />
          <LinesTable
            columns={LINE_COLUMNS}
            rows={computedLines}
            onChange={setLines}
            readOnly={false}
            addLabel="Add Line"
          />
        </div>
      </Modal>
    </PageTemplate>
  )
}
