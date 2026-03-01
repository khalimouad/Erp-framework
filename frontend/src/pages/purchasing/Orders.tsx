import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import Header from '@/components/Layout/Header'
import DataTable from '@/components/common/DataTable'
import { purchasingApi } from '@/api/client'
import type { PurchaseOrder } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  received: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function PurchaseOrders() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ vendor_name: '', vendor_email: '', lines: [] as { description: string; quantity: number; unit_price: number }[] })
  const [line, setLine] = useState({ description: '', quantity: 1, unit_price: 0 })

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: () => purchasingApi.listOrders(),
  })

  const createMutation = useMutation({
    mutationFn: () => purchasingApi.createOrder(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] })
      setShowForm(false)
      setForm({ vendor_name: '', vendor_email: '', lines: [] })
    },
  })

  const addLine = () => {
    if (!line.description) return
    setForm({ ...form, lines: [...form.lines, { ...line }] })
    setLine({ description: '', quantity: 1, unit_price: 0 })
  }

  const columns = [
    { key: 'reference', label: 'Reference' },
    { key: 'vendor_name', label: 'Vendor' },
    {
      key: 'status', label: 'Status',
      render: (row: PurchaseOrder) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[row.status]}`}>{row.status}</span>
      ),
    },
    { key: 'total_amount', label: 'Total', render: (row: PurchaseOrder) => `$${row.total_amount.toLocaleString()}` },
    { key: 'created_at', label: 'Date', render: (row: PurchaseOrder) => new Date(row.created_at).toLocaleDateString() },
  ]

  return (
    <div>
      <Header title="Purchasing — Orders" />
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-gray-500 text-sm">{data?.data?.length ?? 0} orders</p>
          <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> New PO</button>
        </div>

        {showForm && (
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold">New Purchase Order</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Vendor Name *</label>
                <input className="input" value={form.vendor_name} onChange={e => setForm({ ...form, vendor_name: e.target.value })} />
              </div>
              <div>
                <label className="label">Vendor Email</label>
                <input className="input" type="email" value={form.vendor_email} onChange={e => setForm({ ...form, vendor_email: e.target.value })} />
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-medium">Order Lines</h4>
              {form.lines.map((l, i) => (
                <div key={i} className="text-sm text-gray-600 flex gap-4">
                  <span className="flex-1">{l.description}</span>
                  <span>qty: {l.quantity}</span>
                  <span className="font-medium">${(l.quantity * l.unit_price).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex gap-2">
                <input className="input flex-1" placeholder="Description" value={line.description} onChange={e => setLine({ ...line, description: e.target.value })} />
                <input className="input w-24" type="number" placeholder="Qty" value={line.quantity} onChange={e => setLine({ ...line, quantity: Number(e.target.value) })} />
                <input className="input w-28" type="number" placeholder="Price" value={line.unit_price} onChange={e => setLine({ ...line, unit_price: Number(e.target.value) })} />
                <button className="btn-secondary" onClick={addLine}>Add</button>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="btn-primary" onClick={() => createMutation.mutate()} disabled={!form.vendor_name}>Save</button>
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="card">
          <DataTable<PurchaseOrder> columns={columns} data={data?.data ?? []} loading={isLoading} />
        </div>
      </div>
    </div>
  )
}
