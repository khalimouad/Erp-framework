import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { PageTemplate }  from '@/components/layout/PageTemplate'
import { AdvancedTable } from '@/components/table/AdvancedTable'
import { Modal }         from '@/components/ui/Modal'
import { Button }        from '@/components/ui/Button'
import { Badge }         from '@/components/ui/Badge'
import { FormView }      from '@/components/form/FormView'
import { accountingApi }  from '@/api/client'
import { ResponsiveTable } from '@/components/views/ResponsiveTable'
import type { Invoice }    from '@/types'
import type { ColumnDef, RowAction, FormFieldDef } from '@/types/ui'

const INVOICE_TYPE_COLOR: Record<string, string> = { customer: 'blue', supplier: 'orange' }
const STATUS_COLOR: Record<string, string> = {
  draft: 'gray', sent: 'blue', paid: 'green', overdue: 'red', cancelled: 'gray',
}

const COLUMNS: ColumnDef<Invoice>[] = [
  { key: 'reference', label: 'Reference', searchable: true },
  {
    key: 'invoice_type',
    label: 'Type',
    render: (row: Invoice) => (
      <Badge color={INVOICE_TYPE_COLOR[row.invoice_type] ?? 'gray'}>
        {row.invoice_type.charAt(0).toUpperCase() + row.invoice_type.slice(1)}
      </Badge>
    ),
  },
  { key: 'partner_name', label: 'Partner',    searchable: true },
  { key: 'issue_date',   label: 'Issue Date', type: 'date' },
  { key: 'due_date',     label: 'Due Date',   type: 'date' },
  { key: 'total_amount', label: 'Total',      type: 'currency' },
  { key: 'amount_paid',  label: 'Paid',       type: 'currency' },
  {
    key: 'status',
    label: 'Status',
    render: (row: Invoice) => (
      <Badge color={STATUS_COLOR[row.status] ?? 'gray'}>
        {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
      </Badge>
    ),
  },
]

const FIELDS: FormFieldDef[] = [
  {
    key: 'invoice_type',
    label: 'Invoice Type',
    type: 'select',
    options: [
      { value: 'customer', label: 'Customer' },
      { value: 'supplier', label: 'Supplier' },
    ],
  },
  { key: 'partner_name', label: 'Partner Name', type: 'text',     required: true },
  { key: 'issue_date',   label: 'Issue Date',   type: 'date',     required: true },
  { key: 'due_date',     label: 'Due Date',     type: 'date' },
  { key: 'notes',        label: 'Notes',        type: 'textarea', span: 2 },
]

const PAYMENT_FIELDS: FormFieldDef[] = [
  { key: 'amount_paid', label: 'Amount Paid', type: 'currency', required: true },
]

export default function Invoices() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<Record<string, unknown>>({})

  const [paymentOpen, setPaymentOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [paymentData, setPaymentData] = useState<Record<string, unknown>>({ amount_paid: 0 })

  const { data, isLoading } = useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: () => accountingApi.listInvoices().then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => accountingApi.createInvoice(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      setOpen(false)
    },
  })

  const paymentMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => accountingApi.addPayment(selectedId!, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      setPaymentOpen(false)
    },
  })

  const rowActions: RowAction<Invoice>[] = [
    {
      key: 'payment',
      label: 'Record Payment',
      onClick: (r) => {
        setSelectedId(r.id)
        setPaymentData({ amount_paid: 0 })
        setPaymentOpen(true)
      },
    },
  ]

  return (
    <PageTemplate
      title="Invoices"
      breadcrumbs={[{ label: 'Accounting' }, { label: 'Invoices' }]}
      actions={[{
        key: 'new',
        label: 'New Invoice',
        icon: <Plus size={14} />,
        variant: 'primary',
        onClick: () => { setFormData({}); setOpen(true) },
      }]}
      loading={isLoading}
    >
      <div className="p-4 sm:p-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="sm:hidden">
            <ResponsiveTable<Invoice>
              columns={[
                {
                  key: 'reference',
                  label: 'Invoice',
                  render: r => (
                    <div>
                      <div className="font-medium">{r.reference}</div>
                      <div className="text-xs text-gray-400">{r.partner_name}</div>
                    </div>
                  ),
                },
                { key: 'total_amount', label: 'Total', render: r => `$${r.total_amount.toFixed(2)}` },
              ]}
              data={data ?? []}
              rowKey="id"
              loading={isLoading}
              buildRowActions={(r) => rowActions.map(a => ({ key: a.key, label: a.label as string, onClick: () => a.onClick(r) }))}
              mobileStatusRender={(r) => (
                <Badge color={STATUS_COLOR[r.status] ?? 'gray'} size="xs">
                  {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                </Badge>
              )}
              emptyTitle="No invoices yet"
              emptyText="Create your first invoice."
            />
          </div>
          <div className="hidden sm:block">
            <AdvancedTable<Invoice>
              columns={COLUMNS}
              data={data ?? []}
              rowKey="id"
              rowActions={rowActions}
              searchPlaceholder="Search invoices..."
              emptyText="No invoices found"
            />
          </div>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New Invoice"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              loading={createMutation.isPending}
              onClick={() => createMutation.mutate(formData)}
            >
              Save
            </Button>
          </div>
        }
      >
        <FormView fields={FIELDS} data={formData} onChange={setFormData} readOnly={false} />
      </Modal>

      <Modal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        title="Record Payment"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPaymentOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              loading={paymentMutation.isPending}
              onClick={() => paymentMutation.mutate(paymentData)}
            >
              Confirm
            </Button>
          </div>
        }
      >
        <FormView fields={PAYMENT_FIELDS} data={paymentData} onChange={setPaymentData} readOnly={false} />
      </Modal>
    </PageTemplate>
  )
}
