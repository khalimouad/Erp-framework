import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import Header from '@/components/Layout/Header'
import DataTable from '@/components/common/DataTable'
import { manufacturingApi } from '@/api/client'
import type { WorkOrder } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  confirmed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  done: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function WorkOrders() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ bom_id: '', quantity_planned: 1, scheduled_start: '', scheduled_end: '', notes: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['work-orders'],
    queryFn: () => manufacturingApi.listWorkOrders(),
  })

  const createMutation = useMutation({
    mutationFn: () => manufacturingApi.createWorkOrder({ ...form, bom_id: Number(form.bom_id) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['work-orders'] })
      setShowForm(false)
    },
  })

  const columns = [
    { key: 'reference', label: 'Reference' },
    { key: 'bom_id', label: 'BOM ID' },
    { key: 'quantity_planned', label: 'Planned Qty' },
    { key: 'quantity_produced', label: 'Produced' },
    {
      key: 'status', label: 'Status',
      render: (row: WorkOrder) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[row.status]}`}>{row.status.replace('_', ' ')}</span>
      ),
    },
    { key: 'scheduled_start', label: 'Start', render: (row: WorkOrder) => row.scheduled_start ? new Date(row.scheduled_start).toLocaleDateString() : '-' },
  ]

  return (
    <div>
      <Header title="Manufacturing — Work Orders" />
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-gray-500 text-sm">{data?.data?.length ?? 0} work orders</p>
          <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> New Work Order</button>
        </div>

        {showForm && (
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold">New Work Order</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">BOM ID *</label><input className="input" type="number" value={form.bom_id} onChange={e => setForm({ ...form, bom_id: e.target.value })} /></div>
              <div><label className="label">Quantity to Produce *</label><input className="input" type="number" value={form.quantity_planned} onChange={e => setForm({ ...form, quantity_planned: Number(e.target.value) })} /></div>
              <div><label className="label">Scheduled Start</label><input className="input" type="datetime-local" value={form.scheduled_start} onChange={e => setForm({ ...form, scheduled_start: e.target.value })} /></div>
              <div><label className="label">Scheduled End</label><input className="input" type="datetime-local" value={form.scheduled_end} onChange={e => setForm({ ...form, scheduled_end: e.target.value })} /></div>
              <div className="col-span-2"><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary" onClick={() => createMutation.mutate()} disabled={!form.bom_id}>Save</button>
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="card">
          <DataTable<WorkOrder> columns={columns} data={data?.data ?? []} loading={isLoading} />
        </div>
      </div>
    </div>
  )
}
