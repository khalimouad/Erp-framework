import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, AlertTriangle } from 'lucide-react'
import Header from '@/components/Layout/Header'
import DataTable from '@/components/common/DataTable'
import { medicalApi } from '@/api/client'
import type { PharmacyItem } from '@/types'

export default function Pharmacy() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    drug_name: '', generic_name: '', dosage_form: '', strength: '',
    quantity_on_hand: 0, reorder_level: 10, unit_cost: 0, unit_price: 0, expiry_date: '',
  })

  const { data, isLoading } = useQuery({ queryKey: ['pharmacy'], queryFn: () => medicalApi.listPharmacy() })
  const { data: lowStock } = useQuery({ queryKey: ['pharmacy-low'], queryFn: () => medicalApi.lowStock() })

  const createMutation = useMutation({
    mutationFn: () => medicalApi.createPharmacyItem(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pharmacy'] })
      qc.invalidateQueries({ queryKey: ['pharmacy-low'] })
      setShowForm(false)
    },
  })

  const columns = [
    { key: 'drug_name', label: 'Drug Name' },
    { key: 'generic_name', label: 'Generic' },
    { key: 'dosage_form', label: 'Form' },
    { key: 'strength', label: 'Strength' },
    {
      key: 'quantity_on_hand', label: 'In Stock',
      render: (row: PharmacyItem) => (
        <span className={row.quantity_on_hand <= row.reorder_level ? 'text-red-600 font-medium' : ''}>
          {row.quantity_on_hand}
        </span>
      ),
    },
    { key: 'expiry_date', label: 'Expiry' },
    { key: 'unit_price', label: 'Price', render: (row: PharmacyItem) => `$${row.unit_price.toFixed(2)}` },
  ]

  return (
    <div>
      <Header title="Medical — Pharmacy" />
      <div className="p-6 space-y-4">
        {(lowStock?.data?.length ?? 0) > 0 && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <AlertTriangle size={16} />
            <span>{lowStock?.data?.length} drug(s) are below reorder level</span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <p className="text-gray-500 text-sm">{data?.data?.length ?? 0} items</p>
          <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Add Drug</button>
        </div>

        {showForm && (
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold">New Pharmacy Item</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Drug Name *</label><input className="input" value={form.drug_name} onChange={e => setForm({ ...form, drug_name: e.target.value })} /></div>
              <div><label className="label">Generic Name</label><input className="input" value={form.generic_name} onChange={e => setForm({ ...form, generic_name: e.target.value })} /></div>
              <div>
                <label className="label">Dosage Form</label>
                <select className="input" value={form.dosage_form} onChange={e => setForm({ ...form, dosage_form: e.target.value })}>
                  <option value="">Select...</option>
                  <option value="tablet">Tablet</option>
                  <option value="capsule">Capsule</option>
                  <option value="syrup">Syrup</option>
                  <option value="injection">Injection</option>
                  <option value="cream">Cream/Ointment</option>
                  <option value="drops">Drops</option>
                </select>
              </div>
              <div><label className="label">Strength</label><input className="input" placeholder="500mg, 10mg/5ml" value={form.strength} onChange={e => setForm({ ...form, strength: e.target.value })} /></div>
              <div><label className="label">Quantity in Stock</label><input className="input" type="number" value={form.quantity_on_hand} onChange={e => setForm({ ...form, quantity_on_hand: Number(e.target.value) })} /></div>
              <div><label className="label">Reorder Level</label><input className="input" type="number" value={form.reorder_level} onChange={e => setForm({ ...form, reorder_level: Number(e.target.value) })} /></div>
              <div><label className="label">Unit Price</label><input className="input" type="number" value={form.unit_price} onChange={e => setForm({ ...form, unit_price: Number(e.target.value) })} /></div>
              <div><label className="label">Expiry Date</label><input className="input" type="date" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} /></div>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary" onClick={() => createMutation.mutate()} disabled={!form.drug_name}>Save</button>
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="card">
          <DataTable<PharmacyItem> columns={columns} data={data?.data ?? []} loading={isLoading} />
        </div>
      </div>
    </div>
  )
}
