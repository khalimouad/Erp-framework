import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import Header from '@/components/Layout/Header'
import DataTable from '@/components/common/DataTable'
import { hrApi } from '@/api/client'
import type { Employee } from '@/types'

export default function Employees() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ first_name: '', last_name: '', job_title: '', work_email: '', salary: 0 })

  const { data, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => hrApi.listEmployees(),
  })

  const createMutation = useMutation({
    mutationFn: () => hrApi.createEmployee(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] })
      setShowForm(false)
      setForm({ first_name: '', last_name: '', job_title: '', work_email: '', salary: 0 })
    },
  })

  const columns = [
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'job_title', label: 'Job Title' },
    { key: 'work_email', label: 'Email' },
    { key: 'salary', label: 'Salary', render: (row: Employee) => `$${row.salary.toLocaleString()}` },
    {
      key: 'is_active',
      label: 'Status',
      render: (row: Employee) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ]

  return (
    <div>
      <Header title="HR — Employees" />
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-gray-500 text-sm">{data?.data?.length ?? 0} employees</p>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> New Employee
          </button>
        </div>

        {showForm && (
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold">New Employee</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">First Name *</label>
                <input className="input" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} />
              </div>
              <div>
                <label className="label">Last Name *</label>
                <input className="input" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
              </div>
              <div>
                <label className="label">Job Title</label>
                <input className="input" value={form.job_title} onChange={e => setForm({ ...form, job_title: e.target.value })} />
              </div>
              <div>
                <label className="label">Work Email</label>
                <input className="input" type="email" value={form.work_email} onChange={e => setForm({ ...form, work_email: e.target.value })} />
              </div>
              <div>
                <label className="label">Salary</label>
                <input className="input" type="number" value={form.salary} onChange={e => setForm({ ...form, salary: Number(e.target.value) })} />
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary" onClick={() => createMutation.mutate()} disabled={!form.first_name || !form.last_name}>Save</button>
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="card">
          <DataTable<Employee> columns={columns} data={data?.data ?? []} loading={isLoading} />
        </div>
      </div>
    </div>
  )
}
