import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { PageTemplate }  from '@/components/layout/PageTemplate'
import { AdvancedTable } from '@/components/table/AdvancedTable'
import { ResponsiveTable } from '@/components/views/ResponsiveTable'
import { TableCard }     from '@/components/views/TableCard'
import { Modal }         from '@/components/ui/Modal'
import { Button }        from '@/components/ui/Button'
import { StatusBadge }   from '@/components/ui/StatusBadge'
import { FormView }      from '@/components/form/FormView'
import { useEditForm }   from '@/hooks/useEditForm'
import { medicalApi }    from '@/api/client'
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
    render: (row: Patient) => <StatusBadge active={row.is_active} size="sm" />,
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
  const { open, editing, formData, setFormData, openNew, openEdit, close } = useEditForm<Patient>()

  const { data, isLoading } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: () => medicalApi.listPatients().then(r => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) =>
      editing ? medicalApi.updatePatient(editing.id, d) : medicalApi.createPatient(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients'] })
      close()
    },
  })

  const rowActions: RowAction<Patient>[] = [
    {
      key: 'edit',
      label: 'Edit',
      onClick: openEdit,
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
        onClick: () => openNew(),
      }]}
      loading={isLoading}
    >
      <TableCard
        mobile={
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
            buildRowActions={(r) => [{ key: 'edit', label: 'Edit', onClick: () => openEdit(r) }]}
            onRowClick={openEdit}
            mobileStatusRender={(r) => <StatusBadge active={r.is_active} />}
            emptyTitle="No patients yet"
            emptyText="Register your first patient."
          />
        }
        desktop={
          <AdvancedTable<Patient>
            columns={COLUMNS}
            data={data ?? []}
            rowKey="id"
            rowActions={rowActions}
            searchPlaceholder="Search patients..."
            exportFilename="patients"
            emptyText="No patients found"
          />
        }
      />

      <Modal
        open={open}
        onClose={close}
        title={editing ? `Edit — ${editing.first_name} ${editing.last_name}` : 'New Patient'}
        size="lg"
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
