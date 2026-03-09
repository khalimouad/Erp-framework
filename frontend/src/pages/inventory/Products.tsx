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
import { inventoryApi }   from '@/api/client'
import type { Product }    from '@/types'
import type { ColumnDef, RowAction, FormFieldDef } from '@/types/ui'

const COLUMNS: ColumnDef<Product>[] = [
  { key: 'sku',             label: 'SKU',          searchable: true },
  { key: 'name',            label: 'Product Name', searchable: true, sortable: true },
  { key: 'unit_of_measure', label: 'UOM' },
  { key: 'unit_price',      label: 'Sale Price',   type: 'currency', sortable: true, align: 'right' },
  { key: 'cost_price',      label: 'Cost',         type: 'currency', sortable: true, align: 'right' },
  {
    key: 'is_active',
    label: 'Status',
    render: (row: Product) => (
      <Badge color={row.is_active ? 'green' : 'gray'} dot>
        {row.is_active ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
]

const FIELDS: FormFieldDef[] = [
  { key: 'sku',             label: 'SKU',             type: 'text',     required: true },
  { key: 'name',            label: 'Product Name',    type: 'text',     required: true },
  { key: 'unit_of_measure', label: 'Unit of Measure', type: 'text',     placeholder: 'unit, kg, l…' },
  { key: 'unit_price',      label: 'Sale Price',      type: 'currency' },
  { key: 'cost_price',      label: 'Cost Price',      type: 'currency' },
  { key: 'description',     label: 'Description',     type: 'textarea', span: 2 },
  { key: 'is_active',       label: 'Active',          type: 'boolean' },
]

export default function Products() {
  const qc = useQueryClient()
  const [open,     setOpen]     = useState(false)
  const [editing,  setEditing]  = useState<Product | null>(null)
  const [formData, setFormData] = useState<Record<string, unknown>>({})

  const { data, isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => inventoryApi.listProducts().then(r => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) =>
      editing ? inventoryApi.updateProduct(editing.id, d) : inventoryApi.createProduct(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      setOpen(false)
      setEditing(null)
    },
  })

  const rowActions: RowAction<Product>[] = [
    {
      key: 'edit',
      label: 'Edit',
      onClick: (r) => { setEditing(r); setFormData({ ...r }); setOpen(true) },
    },
  ]

  const openEdit = (r: Product) => { setEditing(r); setFormData({ ...r }); setOpen(true) }

  return (
    <PageTemplate
      title="Products"
      breadcrumbs={[{ label: 'Inventory' }, { label: 'Products' }]}
      actions={[{
        key: 'new',
        label: 'New Product',
        icon: <Plus size={14} />,
        variant: 'primary',
        onClick: () => { setEditing(null); setFormData({ is_active: true }); setOpen(true) },
      }]}
      loading={isLoading}
    >
      <div className="p-4 sm:p-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="sm:hidden">
            <ResponsiveTable<Product>
              columns={[
                {
                  key: 'name',
                  label: 'Product',
                  render: r => (
                    <div>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-gray-400">{r.sku}</div>
                    </div>
                  ),
                },
                { key: 'unit_price', label: 'Price', render: r => `$${r.unit_price.toFixed(2)}` },
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
              emptyTitle="No products yet"
              emptyText="Add your first product to get started."
            />
          </div>
          <div className="hidden sm:block">
            <AdvancedTable<Product>
              columns={COLUMNS}
              data={data ?? []}
              rowKey="id"
              rowActions={rowActions}
              searchPlaceholder="Search products..."
              exportFilename="products"
              emptyText="No products found"
            />
          </div>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Edit — ${editing.name}` : 'New Product'}
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
