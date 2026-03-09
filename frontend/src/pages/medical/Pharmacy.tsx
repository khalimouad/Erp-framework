import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, AlertTriangle } from 'lucide-react'
import { PageTemplate }  from '@/components/layout/PageTemplate'
import { AdvancedTable } from '@/components/table/AdvancedTable'
import { Modal }         from '@/components/ui/Modal'
import { Button }        from '@/components/ui/Button'
import { FormView }      from '@/components/form/FormView'
import { medicalApi }    from '@/api/client'
import { ResponsiveTable } from '@/components/views/ResponsiveTable'
import type { PharmacyItem } from '@/types'
import type { ColumnDef, RowAction, FormFieldDef } from '@/types/ui'

const COLUMNS: ColumnDef<PharmacyItem>[] = [
  { key: 'drug_name',    label: 'Drug Name', searchable: true },
  { key: 'generic_name', label: 'Generic' },
  { key: 'dosage_form',  label: 'Form' },
  { key: 'strength',     label: 'Strength' },
  {
    key: 'quantity_on_hand',
    label: 'In Stock',
    render: (row: PharmacyItem) => (
      <span className={row.quantity_on_hand <= row.reorder_level ? 'text-red-600 font-medium' : ''}>
        {row.quantity_on_hand}
      </span>
    ),
  },
  { key: 'expiry_date', label: 'Expiry',    type: 'date' },
  { key: 'unit_price',  label: 'Unit Price', type: 'currency' },
]

const FIELDS: FormFieldDef[] = [
  { key: 'drug_name',       label: 'Drug Name',    type: 'text',     required: true },
  { key: 'generic_name',    label: 'Generic Name', type: 'text' },
  {
    key: 'dosage_form',
    label: 'Dosage Form',
    type: 'select',
    options: [
      { value: 'tablet',    label: 'Tablet' },
      { value: 'capsule',   label: 'Capsule' },
      { value: 'syrup',     label: 'Syrup' },
      { value: 'injection', label: 'Injection' },
      { value: 'cream',     label: 'Cream' },
      { value: 'drops',     label: 'Drops' },
    ],
  },
  { key: 'strength',         label: 'Strength',       type: 'text',     placeholder: '500mg' },
  { key: 'quantity_on_hand', label: 'Qty in Stock',   type: 'number' },
  { key: 'reorder_level',    label: 'Reorder Level',  type: 'number' },
  { key: 'unit_price',       label: 'Unit Price',     type: 'currency', placeholder: '$' },
  { key: 'expiry_date',      label: 'Expiry Date',    type: 'date' },
]

export default function Pharmacy() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<PharmacyItem | null>(null)
  const [formData, setFormData] = useState<Record<string, unknown>>({})

  const { data, isLoading } = useQuery<PharmacyItem[]>({
    queryKey: ['pharmacy'],
    queryFn: () => medicalApi.listPharmacy().then(r => r.data),
  })

  const { data: lowStock } = useQuery<PharmacyItem[]>({
    queryKey: ['pharmacy-low'],
    queryFn: () => medicalApi.lowStock().then(r => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) =>
      editing
        ? medicalApi.updatePharmacyItem(editing.id, d)
        : medicalApi.createPharmacyItem(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pharmacy'] })
      qc.invalidateQueries({ queryKey: ['pharmacy-low'] })
      setOpen(false)
      setEditing(null)
    },
  })

  const rowActions: RowAction<PharmacyItem>[] = [
    {
      key: 'edit',
      label: 'Edit',
      onClick: (r) => { setEditing(r); setFormData({ ...r }); setOpen(true) },
    },
  ]

  const lowStockCount = lowStock?.length ?? 0

  return (
    <PageTemplate
      title="Pharmacy"
      breadcrumbs={[{ label: 'Medical' }, { label: 'Pharmacy' }]}
      actions={[{
        key: 'new',
        label: 'Add Drug',
        icon: <Plus size={14} />,
        variant: 'primary',
        onClick: () => { setEditing(null); setFormData({}); setOpen(true) },
      }]}
      loading={isLoading}
    >
      <div className="p-6 space-y-4">
        {lowStockCount > 0 && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <AlertTriangle size={16} />
            <span>{lowStockCount} drug(s) are below reorder level</span>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="sm:hidden">
            <ResponsiveTable<PharmacyItem>
              columns={[
                {
                  key: 'drug_name',
                  label: 'Drug',
                  render: r => (
                    <div>
                      <div className="font-medium">{r.drug_name}</div>
                      <div className="text-xs text-gray-400">{r.dosage_form} {r.strength}</div>
                    </div>
                  ),
                },
                {
                  key: 'quantity_on_hand',
                  label: 'In Stock',
                  render: r => (
                    <span className={r.quantity_on_hand <= r.reorder_level ? 'text-red-600 font-medium' : ''}>
                      {r.quantity_on_hand}
                    </span>
                  ),
                },
              ]}
              data={data ?? []}
              rowKey="id"
              loading={isLoading}
              buildRowActions={(r) => [{ key: 'edit', label: 'Edit', onClick: () => { setEditing(r); setFormData({ ...r }); setOpen(true) } }]}
              onRowClick={(r) => { setEditing(r); setFormData({ ...r }); setOpen(true) }}
              emptyTitle="No drugs yet"
              emptyText="Add your first pharmacy item."
            />
          </div>
          <div className="hidden sm:block">
            <AdvancedTable<PharmacyItem>
              columns={COLUMNS}
              data={data ?? []}
              rowKey="id"
              rowActions={rowActions}
              searchPlaceholder="Search drugs..."
              exportFilename="pharmacy"
              emptyText="No pharmacy items found"
            />
          </div>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Edit — ${editing.drug_name}` : 'Add Drug'}
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
