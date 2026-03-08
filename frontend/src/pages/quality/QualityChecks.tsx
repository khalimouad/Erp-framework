import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'

import { PageTemplate }  from '@/components/layout/PageTemplate'
import { AdvancedTable } from '@/components/table/AdvancedTable'
import { Modal }         from '@/components/ui/Modal'
import { Button }        from '@/components/ui/Button'
import { Badge }         from '@/components/ui/Badge'
import { FormView }      from '@/components/form/FormView'
import { qualityApi }       from '@/api/client'
import { ResponsiveTable }  from '@/components/views/ResponsiveTable'
import type { QualityCheck } from '@/types'
import type { ColumnDef, RowAction, FormFieldDef, BadgeColor } from '@/types/ui'

const RESULT_COLOR: Record<string, BadgeColor> = {
  pass: 'green', fail: 'red', on_hold: 'yellow',
}

const COLUMNS: ColumnDef<QualityCheck>[] = [
  { key: 'reference',    label: 'Reference',  sortable: true, searchable: true },
  { key: 'check_type',   label: 'Type',       sortable: true, searchable: true },
  { key: 'product_id',   label: 'Product ID' },
  { key: 'work_order_id',label: 'Work Order'  },
  {
    key: 'result', label: 'Result', sortable: true,
    render: (r) => r.result
      ? <Badge color={RESULT_COLOR[r.result] ?? 'gray'} dot size="sm">{r.result.replace('_', ' ')}</Badge>
      : <span className="text-xs text-gray-400 italic">Pending</span>,
  },
  { key: 'checked_at', label: 'Checked At', type: 'datetime' },
  { key: 'created_at', label: 'Created',    type: 'date',     sortable: true },
]

const FIELDS: FormFieldDef[] = [
  { key: 'product_id',    label: 'Product ID',    type: 'number' },
  { key: 'work_order_id', label: 'Work Order ID', type: 'number' },
  {
    key: 'check_type', label: 'Check Type', type: 'select', required: true,
    options: [
      { value: 'incoming',    label: 'Incoming Inspection' },
      { value: 'in_process',  label: 'In-Process' },
      { value: 'final',       label: 'Final Inspection' },
      { value: 'periodic',    label: 'Periodic' },
    ],
  },
  {
    key: 'result', label: 'Result', type: 'select',
    options: [
      { value: 'pass',    label: 'Pass',    color: 'green'  },
      { value: 'fail',    label: 'Fail',    color: 'red'    },
      { value: 'on_hold', label: 'On Hold', color: 'yellow' },
    ],
  },
  { key: 'notes', label: 'Notes', type: 'textarea', span: 2, rows: 3 },
]

export default function QualityChecks() {
  const qc = useQueryClient()
  const [open,     setOpen]     = useState(false)
  const [editing,  setEditing]  = useState<QualityCheck | null>(null)
  const [formData, setFormData] = useState<Record<string, unknown>>({})

  const { data, isLoading } = useQuery<QualityCheck[]>({
    queryKey: ['quality-checks'],
    queryFn: () => qualityApi.listQcs().then((r: { data: QualityCheck[] }) => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) =>
      editing ? qualityApi.updateQc(editing.id, d) : qualityApi.createQc(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quality-checks'] }); setOpen(false); setEditing(null) },
  })

  const rowActions: RowAction<QualityCheck>[] = [
    { key: 'edit', label: 'Record Result', onClick: (r) => { setEditing(r); setFormData({ ...r }); setOpen(true) } },
  ]

  return (
    <PageTemplate
      title="Quality Control"
      breadcrumbs={[{ label: 'Quality', href: '/quality' }, { label: 'Checks' }]}
      actions={[{ key: 'new', label: 'New Check', icon: <Plus size={14} />, variant: 'primary',
        onClick: () => { setEditing(null); setFormData({}); setOpen(true) } }]}
      loading={isLoading}
    >
      <div className="p-4 sm:p-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="sm:hidden">
            <ResponsiveTable<QualityCheck>
              columns={[
                { key: 'reference',  label: 'Reference' },
                { key: 'check_type', label: 'Type' },
              ]}
              data={data ?? []}
              rowKey="id"
              loading={isLoading}
              buildRowActions={(r) => [{ key: 'edit', label: 'Record Result', onClick: () => { setEditing(r); setFormData({ ...r }); setOpen(true) } }]}
              onRowClick={(r) => { setEditing(r); setFormData({ ...r }); setOpen(true) }}
              mobileStatusRender={(r) => r.result
                ? <Badge color={RESULT_COLOR[r.result] ?? 'gray'} size="xs" dot>{r.result.replace('_', ' ')}</Badge>
                : <span className="text-xs text-gray-400 italic">Pending</span>
              }
              emptyTitle="No quality checks yet"
              emptyText="Create your first quality check."
            />
          </div>
          <div className="hidden sm:block">
            <AdvancedTable<QualityCheck>
              columns={COLUMNS} data={data ?? []} rowKey="id"
              rowActions={rowActions} searchPlaceholder="Search quality checks…"
              emptyText="No quality checks yet"
            />
          </div>
        </div>
      </div>

      <Modal
        open={open} onClose={() => setOpen(false)}
        title={editing ? `Edit Check — ${editing.reference}` : 'New Quality Check'} size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={saveMutation.isPending}
              onClick={() => saveMutation.mutate(formData)}>Save</Button>
          </div>
        }
      >
        <FormView fields={FIELDS} data={formData} onChange={setFormData} readOnly={false} />
      </Modal>
    </PageTemplate>
  )
}
