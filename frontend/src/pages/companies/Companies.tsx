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
import { companiesApi }  from '@/api/client'
import type { Company }  from '@/types'
import type { ColumnDef, RowAction, FormFieldDef } from '@/types/ui'

const COLUMNS: ColumnDef<Company>[] = [
  { key: 'name',    label: 'Company',  sortable: true, searchable: true },
  { key: 'tax_id',  label: 'Tax ID',   searchable: true },
  { key: 'email',   label: 'Email',    searchable: true },
  { key: 'phone',   label: 'Phone' },
  { key: 'country', label: 'Country',  sortable: true, searchable: true },
  { key: 'currency',label: 'Currency', sortable: true },
  {
    key: 'is_active', label: 'Status', sortable: true,
    render: (r) => <StatusBadge active={r.is_active} size="sm" />,
  },
]

const FIELDS: FormFieldDef[] = [
  { key: 'name',     label: 'Company Name', type: 'text',  required: true, span: 2 },
  { key: 'tax_id',   label: 'Tax ID / VAT', type: 'text' },
  { key: 'currency', label: 'Currency',     type: 'text',  placeholder: 'USD, EUR, GBP…' },
  { key: 'email',    label: 'Email',        type: 'email' },
  { key: 'phone',    label: 'Phone',        type: 'phone' },
  { key: 'country',  label: 'Country',      type: 'text' },
  { key: 'address',  label: 'Address',      type: 'textarea', span: 2 },
  { key: 'is_active',label: 'Active',       type: 'boolean' },
]

export default function Companies() {
  const qc = useQueryClient()
  const { open, editing, formData, setFormData, openNew, openEdit, close } = useEditForm<Company>()

  const { data, isLoading } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: () => companiesApi.list().then(r => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) =>
      editing ? companiesApi.update(editing.id, d) : companiesApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['companies'] }); close() },
  })

  const rowActions: RowAction<Company>[] = [
    { key: 'edit', label: 'Edit', onClick: openEdit },
  ]

  return (
    <PageTemplate
      title="Companies"
      breadcrumbs={[{ label: 'Companies' }]}
      actions={[{ key: 'new', label: 'New Company', icon: <Plus size={14} />, variant: 'primary',
        onClick: () => openNew({ currency: 'USD', is_active: true }) }]}
      loading={isLoading}
    >
      <TableCard
        mobile={
          <ResponsiveTable<Company>
            columns={[
              { key: 'name',    label: 'Company' },
              { key: 'country', label: 'Country' },
            ]}
            data={data ?? []}
            rowKey="id"
            loading={isLoading}
            buildRowActions={(r) => [{ key: 'edit', label: 'Edit', onClick: () => openEdit(r) }]}
            onRowClick={openEdit}
            mobileStatusRender={(r) => <StatusBadge active={r.is_active} />}
            emptyTitle="No companies yet"
            emptyText="Add your first company."
          />
        }
        desktop={
          <AdvancedTable<Company>
            columns={COLUMNS} data={data ?? []} rowKey="id"
            rowActions={rowActions} searchPlaceholder="Search companies…"
            exportFilename="companies"
            emptyText="No companies yet"
          />
        }
      />

      <Modal
        open={open} onClose={close}
        title={editing ? `Edit — ${editing.name}` : 'New Company'} size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={close}>Cancel</Button>
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
