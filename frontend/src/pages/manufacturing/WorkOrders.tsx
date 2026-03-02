import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { PageTemplate }    from '@/components/layout/PageTemplate'
import { AdvancedTable }   from '@/components/table/AdvancedTable'
import { Modal }           from '@/components/ui/Modal'
import { Button }          from '@/components/ui/Button'
import { Badge }           from '@/components/ui/Badge'
import { FormView }        from '@/components/form/FormView'
import { manufacturingApi } from '@/api/client'
import type { WorkOrder }  from '@/types'
import type { ColumnDef, RowAction, FormFieldDef } from '@/types/ui'

const STATUS_COLOR: Record<string, string> = {
  draft: 'gray', confirmed: 'blue', in_progress: 'yellow', done: 'green', cancelled: 'red',
}

const COLUMNS: ColumnDef<WorkOrder>[] = [
  { key: 'reference',        label: 'Reference',   searchable: true },
  { key: 'bom_id',           label: 'BOM ID' },
  { key: 'quantity_planned', label: 'Planned Qty', type: 'number' },
  { key: 'quantity_produced', label: 'Produced',   type: 'number' },
  {
    key: 'status',
    label: 'Status',
    render: (row: WorkOrder) => (
      <Badge color={STATUS_COLOR[row.status] ?? 'gray'}>
        {row.status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
      </Badge>
    ),
  },
  { key: 'scheduled_start', label: 'Start', type: 'date' },
]

const FIELDS: FormFieldDef[] = [
  { key: 'bom_id',           label: 'BOM ID',             type: 'number',   required: true },
  { key: 'quantity_planned', label: 'Quantity to Produce', type: 'number',   required: true },
  { key: 'scheduled_start',  label: 'Scheduled Start',    type: 'datetime' },
  { key: 'scheduled_end',    label: 'Scheduled End',      type: 'datetime' },
  { key: 'notes',            label: 'Notes',              type: 'textarea', span: 2 },
]

export default function WorkOrders() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<WorkOrder | null>(null)
  const [formData, setFormData] = useState<Record<string, unknown>>({})

  const { data, isLoading } = useQuery<WorkOrder[]>({
    queryKey: ['work-orders'],
    queryFn: () => manufacturingApi.listWorkOrders().then(r => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) =>
      editing ? manufacturingApi.updateWorkOrder(editing.id, d) : manufacturingApi.createWorkOrder(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['work-orders'] })
      setOpen(false)
      setEditing(null)
    },
  })

  const rowActions: RowAction<WorkOrder>[] = [
    {
      key: 'edit',
      label: 'Edit',
      onClick: (r) => { setEditing(r); setFormData({ ...r }); setOpen(true) },
    },
  ]

  return (
    <PageTemplate
      title="Work Orders"
      breadcrumbs={[{ label: 'Manufacturing' }, { label: 'Work Orders' }]}
      actions={[{
        key: 'new',
        label: 'New Work Order',
        icon: <Plus size={14} />,
        variant: 'primary',
        onClick: () => { setEditing(null); setFormData({}); setOpen(true) },
      }]}
      loading={isLoading}
    >
      <div className="p-6">
        <AdvancedTable<WorkOrder>
          columns={COLUMNS}
          data={data ?? []}
          rowKey="id"
          rowActions={rowActions}
          searchPlaceholder="Search work orders..."
          emptyText="No work orders found"
        />
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Edit — ${editing.reference}` : 'New Work Order'}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              loading={saveMutation.isPending}
              onClick={() => saveMutation.mutate(formData)}
            >
              Save
            </Button>
          </div>
        }
      >
        <FormView fields={FIELDS} data={formData} onChange={setFormData} readOnly={false} />
      </Modal>
    </PageTemplate>
  )
}
