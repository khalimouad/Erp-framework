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
    render: (row: Product) => <StatusBadge active={row.is_active} size="sm" />,
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
  const { open, editing, formData, setFormData, openNew, openEdit, close } = useEditForm<Product>()

  const { data, isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => inventoryApi.listProducts().then(r => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) =>
      editing ? inventoryApi.updateProduct(editing.id, d) : inventoryApi.createProduct(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      close()
    },
  })

  const rowActions: RowAction<Product>[] = [
    {
      key: 'edit',
      label: 'Edit',
      onClick: openEdit,
    },
  ]

  return (
    <PageTemplate
      title="Products"
      breadcrumbs={[{ label: 'Inventory' }, { label: 'Products' }]}
      actions={[{
        key: 'new',
        label: 'New Product',
        icon: <Plus size={14} />,
        variant: 'primary',
        onClick: () => openNew({ is_active: true }),
      }]}
      loading={isLoading}
    >
      <TableCard
        mobile={
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
            mobileStatusRender={(r) => <StatusBadge active={r.is_active} />}
            emptyTitle="No products yet"
            emptyText="Add your first product to get started."
          />
        }
        desktop={
          <AdvancedTable<Product>
            columns={COLUMNS}
            data={data ?? []}
            rowKey="id"
            rowActions={rowActions}
            searchPlaceholder="Search products..."
            exportFilename="products"
            emptyText="No products found"
          />
        }
      />

      <Modal
        open={open}
        onClose={close}
        title={editing ? `Edit — ${editing.name}` : 'New Product'}
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
