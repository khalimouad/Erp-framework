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
    render: (row: BOM) => <StatusBadge active={row.is_active} size="sm" />,
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
  const { open, editing, formData, setFormData, openNew, openEdit, close } = useEditForm<BOM>()

  const { data, isLoading } = useQuery<BOM[]>({
    queryKey: ['boms'],
    queryFn: () => manufacturingApi.listBoms().then(r => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) =>
      editing ? manufacturingApi.updateBom(editing.id, d) : manufacturingApi.createBom(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['boms'] })
      close()
    },
  })

  const rowActions: RowAction<BOM>[] = [
    {
      key: 'edit',
      label: 'Edit',
      onClick: openEdit,
    },
  ]

  return (
    <PageTemplate
      title="Bill of Materials"
      breadcrumbs={[{ label: 'Manufacturing' }, { label: 'Bill of Materials' }]}
      actions={[{
        key: 'new',
        label: 'New BOM',
        icon: <Plus size={14} />,
        variant: 'primary',
        onClick: () => openNew({ is_active: true, quantity: 1 }),
      }]}
      loading={isLoading}
    >
      <TableCard
        mobile={
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
            mobileStatusRender={(r) => <StatusBadge active={r.is_active} />}
            emptyTitle="No BOMs yet"
            emptyText="Create a bill of materials to define product recipes."
          />
        }
        desktop={
          <AdvancedTable<BOM>
            columns={COLUMNS}
            data={data ?? []}
            rowKey="id"
            rowActions={rowActions}
            searchPlaceholder="Search BOMs..."
            exportFilename="bill-of-materials"
            emptyText="No bills of materials found"
          />
        }
      />

      <Modal
        open={open}
        onClose={close}
        title={editing ? `Edit — BOM #${editing.id}` : 'New Bill of Materials'}
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
