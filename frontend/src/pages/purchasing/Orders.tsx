import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { PageTemplate }  from '@/components/layout/PageTemplate'
import { AdvancedTable } from '@/components/table/AdvancedTable'
import { TableCard }     from '@/components/views/TableCard'
import { Modal }         from '@/components/ui/Modal'
import { Button }        from '@/components/ui/Button'
import { Badge }         from '@/components/ui/Badge'
import { FormView }      from '@/components/form/FormView'
import { LinesTable }    from '@/components/form/LinesTable'
import { useEditForm }   from '@/hooks/useEditForm'
import { purchasingApi }  from '@/api/client'
import { ResponsiveTable } from '@/components/views/ResponsiveTable'
import type { PurchaseOrder } from '@/types'
import type { ColumnDef, RowAction, FormFieldDef, LineColumnDef } from '@/types/ui'

const STATUS_COLOR: Record<string, string> = {
  draft: 'gray', sent: 'blue', received: 'green', cancelled: 'red',
}

const COLUMNS: ColumnDef<PurchaseOrder>[] = [
  { key: 'reference',   label: 'Reference', searchable: true },
  { key: 'vendor_name', label: 'Vendor',    searchable: true },
  {
    key: 'status',
    label: 'Status',
    render: (row: PurchaseOrder) => (
      <Badge color={STATUS_COLOR[row.status] ?? 'gray'}>
        {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
      </Badge>
    ),
  },
  { key: 'total_amount', label: 'Total', type: 'currency' },
  { key: 'created_at',   label: 'Date',  type: 'date' },
]

const FIELDS: FormFieldDef[] = [
  { key: 'vendor_name',  label: 'Vendor Name',  type: 'text',  required: true },
  { key: 'vendor_email', label: 'Vendor Email', type: 'email' },
]

const LINE_COLUMNS: LineColumnDef[] = [
  { key: 'description', label: 'Description', type: 'text',     editable: true },
  { key: 'quantity',    label: 'Qty',         type: 'number',   editable: true, width: '100px' },
  { key: 'unit_price',  label: 'Unit Price',  type: 'currency', editable: true, width: '120px' },
  { key: 'subtotal',    label: 'Subtotal',    type: 'currency', editable: false, width: '120px' },
]

type OrderLine = { description: string; quantity: number; unit_price: number; subtotal?: number }

export default function PurchaseOrders() {
  const qc = useQueryClient()
  const { open, editing, formData, setFormData, openNew, openEdit, close } = useEditForm<PurchaseOrder>()
  const [lines, setLines] = useState<OrderLine[]>([])

  useEffect(() => {
    setLines((editing as (PurchaseOrder & { lines?: OrderLine[] }) | null)?.lines ?? [])
  }, [editing])

  const { data, isLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ['purchase-orders'],
    queryFn: () => purchasingApi.listOrders().then(r => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) =>
      editing ? purchasingApi.updateOrder(editing.id, d) : purchasingApi.createOrder(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] })
      close()
    },
  })

  const rowActions: RowAction<PurchaseOrder>[] = [
    { key: 'edit', label: 'Edit', onClick: openEdit },
  ]

  const computedLines = lines.map(l => ({
    ...l,
    subtotal: (l.quantity ?? 0) * (l.unit_price ?? 0),
  }))

  return (
    <PageTemplate
      title="Purchase Orders"
      breadcrumbs={[{ label: 'Purchasing' }, { label: 'Orders' }]}
      actions={[{
        key: 'new',
        label: 'New PO',
        icon: <Plus size={14} />,
        variant: 'primary',
        onClick: () => openNew(),
      }]}
      loading={isLoading}
    >
      <TableCard
        mobile={
          <ResponsiveTable<PurchaseOrder>
            columns={[
              { key: 'reference',   label: 'Reference' },
              { key: 'vendor_name', label: 'Vendor' },
            ]}
            data={data ?? []}
            rowKey="id"
            loading={isLoading}
            buildRowActions={(r) => [{ key: 'edit', label: 'Edit', onClick: () => openEdit(r) }]}
            onRowClick={openEdit}
            mobileStatusRender={(r) => (
              <Badge color={STATUS_COLOR[r.status] ?? 'gray'} size="xs">
                {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
              </Badge>
            )}
            emptyTitle="No purchase orders yet"
            emptyText="Create your first purchase order."
          />
        }
        desktop={
          <AdvancedTable<PurchaseOrder>
            columns={COLUMNS}
            data={data ?? []}
            rowKey="id"
            rowActions={rowActions}
            searchPlaceholder="Search purchase orders..."
            exportFilename="purchase-orders"
            emptyText="No purchase orders found"
          />
        }
      />

      <Modal
        open={open}
        onClose={close}
        title={editing ? `Edit — ${editing.reference}` : 'New Purchase Order'}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={close}>Cancel</Button>
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
