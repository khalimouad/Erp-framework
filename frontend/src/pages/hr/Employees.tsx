import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { PageTemplate }    from '@/components/layout/PageTemplate'
import { AdvancedTable }   from '@/components/table/AdvancedTable'
import { ResponsiveTable } from '@/components/views/ResponsiveTable'
import { TableCard }       from '@/components/views/TableCard'
import { Modal }           from '@/components/ui/Modal'
import { Button }          from '@/components/ui/Button'
import { StatusBadge }     from '@/components/ui/StatusBadge'
import { FormView }        from '@/components/form/FormView'
import { useEditForm }     from '@/hooks/useEditForm'
import { hrApi }           from '@/api/client'
import type { Employee }   from '@/types'
import type { ColumnDef, RowAction, FormFieldDef } from '@/types/ui'

const COLUMNS: ColumnDef<Employee>[] = [
  {
    key: 'name',
    label: 'Name',
    render: (row: Employee) => `${row.first_name} ${row.last_name}`,
  },
  { key: 'job_title',  label: 'Job Title' },
  { key: 'work_email', label: 'Email', type: 'email', searchable: true },
  { key: 'salary',     label: 'Salary', type: 'currency' },
  {
    key: 'is_active',
    label: 'Status',
    render: (row: Employee) => <StatusBadge active={row.is_active} size="sm" />,
  },
]

const FIELDS: FormFieldDef[] = [
  { key: 'first_name', label: 'First Name', type: 'text',     required: true },
  { key: 'last_name',  label: 'Last Name',  type: 'text',     required: true },
  { key: 'job_title',  label: 'Job Title',  type: 'text' },
  { key: 'work_email', label: 'Work Email', type: 'email' },
  { key: 'salary',     label: 'Salary',     type: 'currency', placeholder: '$' },
  { key: 'is_active',  label: 'Active',     type: 'boolean' },
]

export default function Employees() {
  const qc = useQueryClient()
  const { open, editing, formData, setFormData, openNew, openEdit, close } = useEditForm<Employee>()

  const { data, isLoading } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: () => hrApi.listEmployees().then(r => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) =>
      editing ? hrApi.updateEmployee(editing.id, d) : hrApi.createEmployee(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] })
      close()
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: (r: Employee) => hrApi.updateEmployee(r.id, { is_active: !r.is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  })

  const rowActions: RowAction<Employee>[] = [
    {
      key: 'edit',
      label: 'Edit',
      onClick: openEdit,
    },
    {
      key: 'deactivate',
      label: (r) => r.is_active ? 'Deactivate' : 'Activate',
      variant: 'danger',
      separator: true,
      onClick: (r) => toggleActiveMutation.mutate(r),
    },
  ]

  return (
    <PageTemplate
      title="Employees"
      breadcrumbs={[{ label: 'HR' }, { label: 'Employees' }]}
      actions={[{
        key: 'new',
        label: 'New Employee',
        icon: <Plus size={14} />,
        variant: 'primary',
        onClick: () => openNew(),
      }]}
      loading={isLoading}
    >
      <TableCard
        mobile={
          <ResponsiveTable<Employee>
            columns={[
              {
                key: 'name',
                label: 'Employee',
                render: r => (
                  <div>
                    <div className="font-medium">{r.first_name} {r.last_name}</div>
                    <div className="text-xs text-gray-400">{r.job_title ?? 'No title'}</div>
                  </div>
                ),
              },
              { key: 'work_email', label: 'Email' },
            ]}
            data={data ?? []}
            rowKey="id"
            loading={isLoading}
            buildRowActions={(r) => [
              { key: 'edit', label: 'Edit', onClick: () => openEdit(r) },
              {
                key: 'deactivate',
                label: r.is_active ? 'Deactivate' : 'Activate',
                variant: 'danger' as const,
                separator: true,
                onClick: () => toggleActiveMutation.mutate(r),
              },
            ]}
            onRowClick={openEdit}
            mobileStatusRender={(r) => <StatusBadge active={r.is_active} />}
            emptyTitle="No employees yet"
            emptyText="Add your first employee to get started."
          />
        }
        desktop={
          <AdvancedTable<Employee>
            columns={COLUMNS}
            data={data ?? []}
            rowKey="id"
            rowActions={rowActions}
            searchPlaceholder="Search employees..."
            exportFilename="employees"
            emptyText="No employees found"
          />
        }
      />

      <Modal
        open={open}
        onClose={close}
        title={editing ? `Edit — ${editing.first_name} ${editing.last_name}` : 'New Employee'}
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
