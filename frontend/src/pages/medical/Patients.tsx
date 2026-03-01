import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import Header from '@/components/Layout/Header'
import DataTable from '@/components/common/DataTable'
import { medicalApi } from '@/api/client'
import type { Patient } from '@/types'

export default function Patients() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '', email: '',
    date_of_birth: '', gender: '', blood_type: '',
    allergies: '', chronic_conditions: '',
    insurance_provider: '', insurance_number: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: () => medicalApi.listPatients(),
  })

  const createMutation = useMutation({
    mutationFn: () => medicalApi.createPatient(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients'] })
      setShowForm(false)
    },
  })

  const columns = [
    { key: 'patient_code', label: 'Code' },
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'gender', label: 'Gender' },
    { key: 'blood_type', label: 'Blood Type' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'is_active', label: 'Status',
      render: (row: Patient) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ]

  return (
    <div>
      <Header title="Medical — Patients" />
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-gray-500 text-sm">{data?.data?.length ?? 0} patients</p>
          <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> New Patient</button>
        </div>

        {showForm && (
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold">New Patient</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">First Name *</label><input className="input" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} /></div>
              <div><label className="label">Last Name *</label><input className="input" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} /></div>
              <div><label className="label">Date of Birth</label><input className="input" type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} /></div>
              <div>
                <label className="label">Gender</label>
                <select className="input" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div><label className="label">Blood Type</label><input className="input" placeholder="A+, B-, O+" value={form.blood_type} onChange={e => setForm({ ...form, blood_type: e.target.value })} /></div>
              <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div><label className="label">Insurance Provider</label><input className="input" value={form.insurance_provider} onChange={e => setForm({ ...form, insurance_provider: e.target.value })} /></div>
              <div className="col-span-2"><label className="label">Allergies</label><textarea className="input" rows={2} value={form.allergies} onChange={e => setForm({ ...form, allergies: e.target.value })} /></div>
              <div className="col-span-2"><label className="label">Chronic Conditions</label><textarea className="input" rows={2} value={form.chronic_conditions} onChange={e => setForm({ ...form, chronic_conditions: e.target.value })} /></div>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary" onClick={() => createMutation.mutate()} disabled={!form.first_name || !form.last_name}>Save</button>
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="card">
          <DataTable<Patient> columns={columns} data={data?.data ?? []} loading={isLoading} />
        </div>
      </div>
    </div>
  )
}
