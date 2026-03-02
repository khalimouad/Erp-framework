import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { PageTemplate }   from '@/components/layout/PageTemplate'
import { AdvancedTable }  from '@/components/table/AdvancedTable'
import { Modal }          from '@/components/ui/Modal'
import { Button }         from '@/components/ui/Button'
import { Badge }          from '@/components/ui/Badge'
import { FormView }       from '@/components/form/FormView'
import { medicalApi }     from '@/api/client'
import type { Appointment } from '@/types'
import type { ColumnDef, RowAction, FormFieldDef } from '@/types/ui'

const STATUS_COLOR: Record<string, string> = {
  scheduled: 'blue', confirmed: 'indigo', in_progress: 'yellow',
  completed: 'green', cancelled: 'red', no_show: 'gray',
}

const COLUMNS: ColumnDef<Appointment>[] = [
  { key: 'id',               label: '#' },
  { key: 'patient_id',       label: 'Patient ID' },
  { key: 'appointment_type', label: 'Type', searchable: true },
  { key: 'appointment_date', label: 'Date & Time', type: 'datetime' },
  {
    key: 'duration_minutes',
    label: 'Duration',
    render: (row: Appointment) => `${row.duration_minutes} min`,
  },
  {
    key: 'status',
    label: 'Status',
    render: (row: Appointment) => (
      <Badge color={STATUS_COLOR[row.status] ?? 'gray'}>
        {row.status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
      </Badge>
    ),
  },
]

const FIELDS: FormFieldDef[] = [
  { key: 'patient_id',       label: 'Patient ID',       type: 'number',   required: true },
  { key: 'appointment_date', label: 'Date & Time',      type: 'datetime', required: true },
  {
    key: 'appointment_type',
    label: 'Appointment Type',
    type: 'select',
    options: [
      { value: 'consultation', label: 'Consultation' },
      { value: 'follow-up',    label: 'Follow-up' },
      { value: 'emergency',    label: 'Emergency' },
      { value: 'checkup',      label: 'Checkup' },
      { value: 'procedure',    label: 'Procedure' },
    ],
  },
  { key: 'duration_minutes', label: 'Duration (min)', type: 'number' },
  { key: 'notes',            label: 'Notes',          type: 'textarea', span: 2 },
]

export default function Appointments() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Appointment | null>(null)
  const [formData, setFormData] = useState<Record<string, unknown>>({})

  const { data, isLoading } = useQuery<Appointment[]>({
    queryKey: ['appointments'],
    queryFn: () => medicalApi.listAppointments().then(r => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) =>
      editing ? medicalApi.updateAppointment(editing.id, d) : medicalApi.createAppointment(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      setOpen(false)
      setEditing(null)
    },
  })

  const rowActions: RowAction<Appointment>[] = [
    {
      key: 'edit',
      label: 'Edit',
      onClick: (r) => { setEditing(r); setFormData({ ...r }); setOpen(true) },
    },
  ]

  return (
    <PageTemplate
      title="Appointments"
      breadcrumbs={[{ label: 'Medical' }, { label: 'Appointments' }]}
      actions={[{
        key: 'new',
        label: 'New Appointment',
        icon: <Plus size={14} />,
        variant: 'primary',
        onClick: () => { setEditing(null); setFormData({}); setOpen(true) },
      }]}
      loading={isLoading}
    >
      <div className="p-6">
        <AdvancedTable<Appointment>
          columns={COLUMNS}
          data={data ?? []}
          rowKey="id"
          rowActions={rowActions}
          searchPlaceholder="Search appointments..."
          emptyText="No appointments found"
        />
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Edit — Appointment #${editing.id}` : 'New Appointment'}
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
