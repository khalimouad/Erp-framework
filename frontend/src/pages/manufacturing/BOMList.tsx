import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { PageTemplate }    from '@/components/layout/PageTemplate'
import { AdvancedTable }   from '@/components/table/AdvancedTable'
import { ResponsiveTable } from '@/components/views/ResponsiveTable'
import { Modal }           from '@/components/ui/Modal'
import { Button }          from '@/components/ui/Button'
import { Badge }           from '@/components/ui/Badge'
import { FormView }        from '@/components/form/FormView'
import { manufacturingApi } from '@/api/client'
import type { BOM }        from '@/types'
import type { ColumnDef, RowAction, FormFieldDef } from '@/types/ui'

const COLUMNS: ColumnDef<BOM>[] = [
  { key: 'id',         label: '#' },
  { key: 'product_id', label: 'Product ID' },
  { key: 'reference',  label: 'Reference', searchable: true, sortable: true },
  { key: 'quantity',   label: 'Output Qty', type: 'number' },
  {
    key: 'is_active',
    label: 'Status',
    render: (row: BOM) => (
      <Badge color={row.is_active ? 'green' : 'gray'} dot>
        {row.is_active ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
  { key: 'created_at', label: 'Created', type: 'date', sortable: true },
]

const FIELDS: FormFieldDef[] = [
  { key: 'product_id', label: 'Product ID', type: 'number', required: true },
  { key: 'reference',  label: 'Reference',  type: 'text' },
  { key: 'quantity',   label: 'Output Qty', type: 'number', required: true },
  { key: 'is_active',  label: 'Active',     type: 'boolean' },
]

export default function BOMList() {
  const qc = useQueryClient()
  const [open,     setOpen]     = useState(false)
  const [editing,  setEditing]  = useState<BOM | null>(null)
  const [formData, setFormData] = useState<Record<string, unknown>>({})

  const { data, isLoading } = useQuery<BOM[]>({
    queryKey: ['boms'],
    queryFn: () => manufacturingApi.listBoms().then(r => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) =>
      editing ? manufacturingApi.updateBom(editing.id, d) : manufacturingApi.createBom(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['boms'] })
      setOpen(false)
      setEditing(null)
    },
  })

  const rowActions: RowAction<BOM>[] = [
    {
      key: 'edit',
      label: 'Edit',
      onClick: (r) => { setEditing(r); setFormData({ ...r }); setOpen(true) },
    },
  ]

  const openEdit = (r: BOM) => { setEditing(r); setFormData({ ...r }); setOpen(true) }

  return (
    <PageTemplate
      title="Bill of Materials"
      breadcrumbs={[{ label: 'Manufacturing' }, { label: 'Bill of Materials' }]}
      actions={[{
        key: 'new',
        label: 'New BOM',
        icon: <Plus size={14} />,
        variant: 'primary',
        onClick: () => { setEditing(null); setFormData({ is_active: true, quantity: 1 }); setOpen(true) },
      }]}
      loading={isLoading}
    >
      <div className="p-4 sm:p-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="sm:hidden">
            <ResponsiveTable<BOM>
              columns={[
                { key: 'reference', label: 'Reference', render: r => r.reference ?? `BOM #${r.id}` },
                { key: 'quantity',  label: 'Qty',       render: r => String(r.quantity) },
              ]}
              data={data ?? []}
              rowKey="id"
              loading={isLoading}
              buildRowActions={(r) => [{ key: 'edit', label: 'Edit', onClick: () => openEdit(r) }]}
              onRowClick={openEdit}
              mobileStatusRender={(r) => (
                <Badge color={r.is_active ? 'green' : 'gray'} size="xs" dot>
                  {r.is_active ? 'Active' : 'Inactive'}
                </Badge>
              )}
              emptyTitle="No BOMs yet"
              emptyText="Create a bill of materials to define product recipes."
            />
          </div>
          <div className="hidden sm:block">
            <AdvancedTable<BOM>
              columns={COLUMNS}
              data={data ?? []}
              rowKey="id"
              rowActions={rowActions}
              searchPlaceholder="Search BOMs..."
              exportFilename="bill-of-materials"
              emptyText="No bills of materials found"
            />
          </div>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Edit — BOM #${editing.id}` : 'New Bill of Materials'}
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
