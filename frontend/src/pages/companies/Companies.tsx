import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'

import { PageTemplate }  from '@/components/layout/PageTemplate'
import { AdvancedTable } from '@/components/table/AdvancedTable'
import { Modal }         from '@/components/ui/Modal'
import { Button }        from '@/components/ui/Button'
import { Badge }         from '@/components/ui/Badge'
import { FormView }      from '@/components/form/FormView'
import { companiesApi }  from '@/api/client'
import { ResponsiveTable } from '@/components/views/ResponsiveTable'
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
    render: (r) => <Badge color={r.is_active ? 'green' : 'gray'} dot size="sm">{r.is_active ? 'Active' : 'Inactive'}</Badge>,
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
  const [open,     setOpen]     = useState(false)
  const [editing,  setEditing]  = useState<Company | null>(null)
  const [formData, setFormData] = useState<Record<string, unknown>>({})

  const { data, isLoading } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: () => companiesApi.list().then(r => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) =>
      editing ? companiesApi.update(editing.id, d) : companiesApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['companies'] }); setOpen(false); setEditing(null) },
  })

  const rowActions: RowAction<Company>[] = [
    { key: 'edit', label: 'Edit', onClick: (r) => { setEditing(r); setFormData({ ...r }); setOpen(true) } },
  ]

  return (
    <PageTemplate
      title="Companies"
      breadcrumbs={[{ label: 'Companies' }]}
      actions={[{ key: 'new', label: 'New Company', icon: <Plus size={14} />, variant: 'primary',
        onClick: () => { setEditing(null); setFormData({ currency: 'USD', is_active: true }); setOpen(true) } }]}
      loading={isLoading}
    >
      <div className="p-4 sm:p-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="sm:hidden">
            <ResponsiveTable<Company>
              columns={[
                { key: 'name',    label: 'Company' },
                { key: 'country', label: 'Country' },
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
              emptyTitle="No companies yet"
              emptyText="Add your first company."
            />
          </div>
          <div className="hidden sm:block">
            <AdvancedTable<Company>
              columns={COLUMNS} data={data ?? []} rowKey="id"
              rowActions={rowActions} searchPlaceholder="Search companies…"
              exportFilename="companies"
              emptyText="No companies yet"
            />
          </div>
        </div>
      </div>

      <Modal
        open={open} onClose={() => setOpen(false)}
        title={editing ? `Edit — ${editing.name}` : 'New Company'} size="lg"
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
