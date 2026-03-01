import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import Header from '@/components/Layout/Header'
import DataTable from '@/components/common/DataTable'
import { crmApi } from '@/api/client'
import type { Lead } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  qualified: 'bg-yellow-100 text-yellow-700',
  proposition: 'bg-purple-100 text-purple-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
}

export default function Leads() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', contact_name: '', email: '', expected_revenue: 0 })

  const { data, isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => crmApi.listLeads(),
  })

  const createMutation = useMutation({
    mutationFn: () => crmApi.createLead(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      setShowForm(false)
      setForm({ name: '', contact_name: '', email: '', expected_revenue: 0 })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => crmApi.deleteLead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  })

  const columns = [
    { key: 'name', label: 'Lead Name' },
    { key: 'contact_name', label: 'Contact' },
    { key: 'email', label: 'Email' },
    {
      key: 'status',
      label: 'Status',
      render: (row: Lead) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[row.status]}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'expected_revenue',
      label: 'Revenue',
      render: (row: Lead) => `$${row.expected_revenue.toLocaleString()}`,
    },
    {
      key: 'actions',
      label: '',
      render: (row: Lead) => (
        <button
          onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(row.id) }}
          className="text-red-500 hover:text-red-700 p-1"
        >
          <Trash2 size={16} />
        </button>
      ),
    },
  ]

  return (
    <div>
      <Header title="CRM — Leads" />
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-gray-500 text-sm">{data?.data?.length ?? 0} leads</p>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> New Lead
          </button>
        </div>

        {showForm && (
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold">New Lead</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Lead Name *</label>
                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Contact Name</label>
                <input className="input" value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="label">Expected Revenue</label>
                <input className="input" type="number" value={form.expected_revenue} onChange={e => setForm({ ...form, expected_revenue: Number(e.target.value) })} />
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary" onClick={() => createMutation.mutate()} disabled={!form.name}>
                Save
              </button>
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="card">
          <DataTable<Lead> columns={columns} data={data?.data ?? []} loading={isLoading} />
        </div>
      </div>
    </div>
  )
}
