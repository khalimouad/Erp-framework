import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { PageTemplate }  from '@/components/layout/PageTemplate'
import { AdvancedTable } from '@/components/table/AdvancedTable'
import { Modal }         from '@/components/ui/Modal'
import { Button }        from '@/components/ui/Button'
import { Badge }         from '@/components/ui/Badge'
import { FormView }      from '@/components/form/FormView'
import { medicalApi }    from '@/api/client'
import { ResponsiveTable } from '@/components/views/ResponsiveTable'
import type { Patient }  from '@/types'
import type { ColumnDef, RowAction, FormFieldDef } from '@/types/ui'

const COLUMNS: ColumnDef<Patient>[] = [
  { key: 'patient_code', label: 'Code', searchable: true },
  {
    key: 'name',
    label: 'Name',
    render: (row: Patient) => `${row.first_name} ${row.last_name}`,
  },
  { key: 'gender',     label: 'Gender' },
  { key: 'blood_type', label: 'Blood Type' },
  { key: 'phone',      label: 'Phone', searchable: true },
  {
    key: 'is_active',
    label: 'Status',
    render: (row: Patient) => (
      <Badge color={row.is_active ? 'green' : 'gray'} dot>
        {row.is_active ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
]

const FIELDS: FormFieldDef[] = [
  { key: 'first_name',          label: 'First Name',          type: 'text',     required: true },
  { key: 'last_name',           label: 'Last Name',           type: 'text',     required: true },
  { key: 'date_of_birth',       label: 'Date of Birth',       type: 'date' },
  {
    key: 'gender',
    label: 'Gender',
    type: 'select',
    options: [
      { value: 'male',   label: 'Male' },
      { value: 'female', label: 'Female' },
      { value: 'other',  label: 'Other' },
    ],
  },
  { key: 'blood_type',          label: 'Blood Type',          type: 'text',     placeholder: 'A+, B-, O+' },
  { key: 'phone',               label: 'Phone',               type: 'phone' },
  { key: 'email',               label: 'Email',               type: 'email' },
  { key: 'insurance_provider',  label: 'Insurance Provider',  type: 'text' },
  { key: 'allergies',           label: 'Allergies',           type: 'textarea', span: 2 },
  { key: 'chronic_conditions',  label: 'Chronic Conditions',  type: 'textarea', span: 2 },
]

export default function Patients() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Patient | null>(null)
  const [formData, setFormData] = useState<Record<string, unknown>>({})

  const { data, isLoading } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: () => medicalApi.listPatients().then(r => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) =>
      editing ? medicalApi.updatePatient(editing.id, d) : medicalApi.createPatient(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients'] })
      setOpen(false)
      setEditing(null)
    },
  })

  const rowActions: RowAction<Patient>[] = [
    {
      key: 'edit',
      label: 'Edit',
      onClick: (r) => { setEditing(r); setFormData({ ...r }); setOpen(true) },
    },
  ]

  return (
    <PageTemplate
      title="Patients"
      breadcrumbs={[{ label: 'Medical' }, { label: 'Patients' }]}
      actions={[{
        key: 'new',
        label: 'New Patient',
        icon: <Plus size={14} />,
        variant: 'primary',
        onClick: () => { setEditing(null); setFormData({}); setOpen(true) },
      }]}
      loading={isLoading}
    >
      <div className="p-4 sm:p-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="sm:hidden">
            <ResponsiveTable<Patient>
              columns={[
                {
                  key: 'name',
                  label: 'Patient',
                  render: r => (
                    <div>
                      <div className="font-medium">{r.first_name} {r.last_name}</div>
                      <div className="text-xs text-gray-400">{r.patient_code}</div>
                    </div>
                  ),
                },
                { key: 'phone', label: 'Phone' },
              ]}
              data={data ?? []}
              rowKey="id"
              loading={isLoading}
              buildRowActions={(r) => [{ key: 'edit', label: 'Edit', onClick: () => { setEditing(r); setFormData({ ...r }); setOpen(true) } }]}
              onRowClick={(r) => { setEditing(r); setFormData({ ...r }); setOpen(true) }}
              mobileStatusRender={(r) => (
                <Badge color={r.is_active ? 'green' : 'gray'} size="xs" dot>
                  {r.is_active ? 'Active' : 'Inactive'}
                </Badge>
              )}
              emptyTitle="No patients yet"
              emptyText="Register your first patient."
            />
          </div>
          <div className="hidden sm:block">
            <AdvancedTable<Patient>
              columns={COLUMNS}
              data={data ?? []}
              rowKey="id"
              rowActions={rowActions}
              searchPlaceholder="Search patients..."
              emptyText="No patients found"
            />
          </div>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Edit — ${editing.first_name} ${editing.last_name}` : 'New Patient'}
        size="lg"
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
