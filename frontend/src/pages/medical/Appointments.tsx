import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import Header from '@/components/Layout/Header'
import DataTable from '@/components/common/DataTable'
import { medicalApi } from '@/api/client'
import type { Appointment } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-gray-100 text-gray-600',
}

export default function Appointments() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    patient_id: '',
    appointment_date: '',
    duration_minutes: 30,
    appointment_type: '',
    notes: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => medicalApi.listAppointments(),
  })

  const createMutation = useMutation({
    mutationFn: () => medicalApi.createAppointment({ ...form, patient_id: Number(form.patient_id) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      setShowForm(false)
    },
  })

  const columns = [
    { key: 'id', label: '#' },
    { key: 'patient_id', label: 'Patient ID' },
    { key: 'appointment_type', label: 'Type' },
    {
      key: 'appointment_date', label: 'Date & Time',
      render: (row: Appointment) => new Date(row.appointment_date).toLocaleString(),
    },
    { key: 'duration_minutes', label: 'Duration', render: (row: Appointment) => `${row.duration_minutes} min` },
    {
      key: 'status', label: 'Status',
      render: (row: Appointment) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[row.status]}`}>{row.status.replace('_', ' ')}</span>
      ),
    },
  ]

  return (
    <div>
      <Header title="Medical — Appointments" />
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-gray-500 text-sm">{data?.data?.length ?? 0} appointments</p>
          <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> New Appointment</button>
        </div>

        {showForm && (
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold">New Appointment</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Patient ID *</label><input className="input" type="number" value={form.patient_id} onChange={e => setForm({ ...form, patient_id: e.target.value })} /></div>
              <div><label className="label">Date & Time *</label><input className="input" type="datetime-local" value={form.appointment_date} onChange={e => setForm({ ...form, appointment_date: e.target.value })} /></div>
              <div>
                <label className="label">Appointment Type</label>
                <select className="input" value={form.appointment_type} onChange={e => setForm({ ...form, appointment_type: e.target.value })}>
                  <option value="">Select...</option>
                  <option value="consultation">Consultation</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="emergency">Emergency</option>
                  <option value="checkup">Checkup</option>
                  <option value="procedure">Procedure</option>
                </select>
              </div>
              <div><label className="label">Duration (min)</label><input className="input" type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: Number(e.target.value) })} /></div>
              <div className="col-span-2"><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary" onClick={() => createMutation.mutate()} disabled={!form.patient_id || !form.appointment_date}>Save</button>
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="card">
          <DataTable<Appointment> columns={columns} data={data?.data ?? []} loading={isLoading} />
        </div>
      </div>
    </div>
  )
}
