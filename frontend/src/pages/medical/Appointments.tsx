import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { PageTemplate }   from '@/components/layout/PageTemplate'
import { AdvancedTable }  from '@/components/table/AdvancedTable'
import { ResponsiveTable } from '@/components/views/ResponsiveTable'
import { TableCard }      from '@/components/views/TableCard'
import { Modal }          from '@/components/ui/Modal'
import { Button }         from '@/components/ui/Button'
import { Badge }          from '@/components/ui/Badge'
import { FormView }       from '@/components/form/FormView'
import { useEditForm }    from '@/hooks/useEditForm'
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
  const { open, editing, formData, setFormData, openNew, openEdit, close } = useEditForm<Appointment>()

  const { data, isLoading } = useQuery<Appointment[]>({
    queryKey: ['appointments'],
    queryFn: () => medicalApi.listAppointments().then(r => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) =>
      editing ? medicalApi.updateAppointment(editing.id, d) : medicalApi.createAppointment(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      close()
    },
  })

  const rowActions: RowAction<Appointment>[] = [
    {
      key: 'edit',
      label: 'Edit',
      onClick: openEdit,
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
        onClick: () => openNew(),
      }]}
      loading={isLoading}
    >
      <TableCard
        mobile={
          <ResponsiveTable<Appointment>
            columns={[
              {
                key: 'appointment_type',
                label: 'Appointment',
                render: r => (
                  <div>
                    <div className="font-medium capitalize">{r.appointment_type ?? 'Consultation'}</div>
                    <div className="text-xs text-gray-400">Patient #{r.patient_id}</div>
                  </div>
                ),
              },
              { key: 'appointment_date', label: 'Date', render: r => new Date(r.appointment_date).toLocaleDateString() },
            ]}
            data={data ?? []}
            rowKey="id"
            loading={isLoading}
            buildRowActions={(r) => [{ key: 'edit', label: 'Edit', onClick: () => openEdit(r) }]}
            onRowClick={openEdit}
            mobileStatusRender={(r) => (
              <Badge color={STATUS_COLOR[r.status] ?? 'gray'} size="xs">
                {r.status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </Badge>
            )}
            emptyTitle="No appointments yet"
            emptyText="Schedule your first appointment."
          />
        }
        desktop={
          <AdvancedTable<Appointment>
            columns={COLUMNS}
            data={data ?? []}
            rowKey="id"
            rowActions={rowActions}
            searchPlaceholder="Search appointments..."
            exportFilename="appointments"
            emptyText="No appointments found"
          />
        }
      />

      <Modal
        open={open}
        onClose={close}
        title={editing ? `Edit — Appointment #${editing.id}` : 'New Appointment'}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={close}>Cancel</Button>
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
