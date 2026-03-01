import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import Header from '@/components/Layout/Header'
import DataTable from '@/components/common/DataTable'
import { inventoryApi } from '@/api/client'
import type { Product } from '@/types'

export default function Products() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ sku: '', name: '', unit_price: 0, cost_price: 0, unit_of_measure: 'unit' })

  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => inventoryApi.listProducts(),
  })

  const createMutation = useMutation({
    mutationFn: () => inventoryApi.createProduct(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      setShowForm(false)
      setForm({ sku: '', name: '', unit_price: 0, cost_price: 0, unit_of_measure: 'unit' })
    },
  })

  const columns = [
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Product Name' },
    { key: 'unit_of_measure', label: 'UOM' },
    { key: 'unit_price', label: 'Sale Price', render: (row: Product) => `$${row.unit_price.toFixed(2)}` },
    { key: 'cost_price', label: 'Cost', render: (row: Product) => `$${row.cost_price.toFixed(2)}` },
    {
      key: 'is_active',
      label: 'Status',
      render: (row: Product) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ]

  return (
    <div>
      <Header title="Inventory — Products" />
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-gray-500 text-sm">{data?.data?.length ?? 0} products</p>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> New Product
          </button>
        </div>

        {showForm && (
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold">New Product</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">SKU *</label>
                <input className="input" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} />
              </div>
              <div>
                <label className="label">Name *</label>
                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Sale Price</label>
                <input className="input" type="number" value={form.unit_price} onChange={e => setForm({ ...form, unit_price: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">Cost Price</label>
                <input className="input" type="number" value={form.cost_price} onChange={e => setForm({ ...form, cost_price: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">Unit of Measure</label>
                <input className="input" value={form.unit_of_measure} onChange={e => setForm({ ...form, unit_of_measure: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary" onClick={() => createMutation.mutate()} disabled={!form.sku || !form.name}>Save</button>
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="card">
          <DataTable<Product> columns={columns} data={data?.data ?? []} loading={isLoading} />
        </div>
      </div>
    </div>
  )
}
