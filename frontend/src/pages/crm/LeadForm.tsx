/**
 * LeadForm — single-record form page.
 *
 * Demonstrates:
 *  • PageTemplate with StatusBar (pipeline stages)
 *  • Read / Edit mode toggle
 *  • FormSection (collapsible sections)
 *  • FormView (2-col layout)
 *  • LinesTable (activities log as example lines)
 *  • Full action bar: Edit, Save, Discard, Duplicate, Delete, Print
 */

import { useState, useEffect }   from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Save, X, Copy, Trash2, Printer, ArrowLeft } from 'lucide-react'

import { PageTemplate }  from '@/components/layout/PageTemplate'
import { FormSection }   from '@/components/form/FormSection'
import { FormView }      from '@/components/form/FormView'
import { LinesTable }    from '@/components/form/LinesTable'
import { Badge }         from '@/components/ui/Badge'
import { Button }        from '@/components/ui/Button'

import { crmApi }        from '@/api/client'
import type { Lead }     from '@/types'
import type { FormFieldDef, LineColumnDef, StatusStage, BadgeColor } from '@/types/ui'

// ─── config ───────────────────────────────────────────────────────────────────

const STATUS_STAGES: StatusStage[] = [
  { key: 'new',         label: 'New',         color: 'blue'   },
  { key: 'qualified',   label: 'Qualified',   color: 'yellow' },
  { key: 'proposition', label: 'Proposition', color: 'purple' },
  { key: 'won',         label: 'Won',         color: 'green'  },
  { key: 'lost',        label: 'Lost',        color: 'red'    },
]

const STATUS_COLOR: Record<string, BadgeColor> = {
  new: 'blue', qualified: 'yellow', proposition: 'purple', won: 'green', lost: 'red',
}

// ─── field definitions ────────────────────────────────────────────────────────

const BASIC_FIELDS: FormFieldDef[] = [
  { key: 'name',             label: 'Lead Name',       type: 'text',     required: true, span: 2 },
  { key: 'contact_name',     label: 'Contact Name',    type: 'text' },
  { key: 'email',            label: 'Email',           type: 'email' },
  { key: 'phone',            label: 'Phone',           type: 'phone' },
  {
    key: 'status', label: 'Stage', type: 'select',
    options: STATUS_STAGES.map(s => ({ value: s.key, label: s.label, color: s.color })),
  },
  { key: 'expected_revenue',    label: 'Expected Revenue',  type: 'currency', prefix: '$' },
  { key: 'expected_close_date', label: 'Expected Close',    type: 'date' },
]

const EXTRA_FIELDS: FormFieldDef[] = [
  { key: 'description', label: 'Description / Notes', type: 'textarea', span: 2, rows: 5 },
]

// Activities lines (log of follow-up actions on this lead)
const ACTIVITY_COLUMNS: LineColumnDef[] = [
  { key: 'activity_type', label: 'Type',    type: 'select', editable: true, width: '150px',
    options: [
      { value: 'call',    label: 'Phone Call' },
      { value: 'email',   label: 'Email' },
      { value: 'meeting', label: 'Meeting' },
      { value: 'note',    label: 'Note' },
    ],
  },
  { key: 'summary', label: 'Summary', type: 'text', editable: true },
  { key: 'date',    label: 'Date',    type: 'date', editable: true, width: '140px' },
]

// ─── component ────────────────────────────────────────────────────────────────

export default function LeadForm() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc       = useQueryClient()

  const isNew = !id || id === 'new'

  const [editing,    setEditing]    = useState(isNew)
  const [formData,   setFormData]   = useState<Record<string, unknown>>({})
  const [activities, setActivities] = useState<Record<string, unknown>[]>([])
  const [dirty,      setDirty]      = useState(false)

  // ── query ─────────────────────────────────────────────────────────────────
  const { isLoading, data: leadData } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => crmApi.getLead(Number(id)),
    enabled: !isNew,
    select: (res: { data: Lead }) => res.data,
  })

  useEffect(() => {
    if (leadData) {
      setFormData({ ...(leadData as Record<string, unknown>) })
    }
  }, [leadData])

  const updateMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) =>
      isNew
        ? crmApi.createLead(d)
        : crmApi.updateLead(Number(id), d),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: ['lead', id] })
      setDirty(false)
      setEditing(false)
      if (isNew) navigate(`/crm/leads/${(res.data as Lead).id}`, { replace: true })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => crmApi.deleteLead(Number(id)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads'] }); navigate('/crm') },
  })

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleChange = (d: Record<string, unknown>) => {
    setFormData(d); setDirty(true)
  }

  const handleSave = () => updateMutation.mutate(formData)

  const handleDiscard = () => {
    if (isNew) { navigate('/crm'); return }
    setEditing(false); setDirty(false)
    qc.invalidateQueries({ queryKey: ['lead', id] })
  }

  const handleStatusChange = (key: string) => {
    handleChange({ ...formData, status: key })
    if (!isNew) updateMutation.mutate({ ...formData, status: key })
  }

  const leadName = String(formData.name || (isNew ? 'New Lead' : '…'))
  const status   = String(formData.status ?? 'new')

  return (
    <PageTemplate
      title={leadName}
      subtitle={isNew ? 'Creating new lead' : undefined}
      breadcrumbs={[
        { label: 'CRM', href: '/crm' },
        { label: 'Leads', href: '/crm' },
        { label: leadName },
      ]}
      statusStages={STATUS_STAGES}
      currentStatus={status}
      onStatusChange={editing ? handleStatusChange : undefined}
      loading={isLoading}
      actions={[
        // Edit mode: Save + Discard
        ...(editing ? [
          {
            key: 'save', label: 'Save', icon: <Save size={14} />, variant: 'primary' as const,
            loading: updateMutation.isPending, disabled: !dirty && !isNew,
            onClick: handleSave,
          },
          {
            key: 'discard', label: 'Discard', icon: <X size={14} />, variant: 'secondary' as const,
            onClick: handleDiscard,
          },
        ] : [
          // Read mode: Edit button
          {
            key: 'edit', label: 'Edit', icon: <Pencil size={14} />, variant: 'primary' as const,
            onClick: () => setEditing(true),
          },
          {
            key: 'back', label: 'Back', icon: <ArrowLeft size={14} />, variant: 'ghost' as const,
            onClick: () => navigate('/crm'),
          },
        ]),
      ]}
      moreActions={[
        {
          key: 'duplicate', label: 'Duplicate', icon: <Copy size={14} />,
          onClick: () => {
            const { id: _i, created_at: _c, updated_at: _u, ...rest } = formData
            navigate('/crm/leads/new')
            setFormData({ ...rest, name: `${formData.name} (copy)` })
            setEditing(true)
          },
        },
        {
          key: 'print', label: 'Print', icon: <Printer size={14} />,
          onClick: () => window.print(),
        },
        {
          key: 'delete', label: 'Delete', icon: <Trash2 size={14} />, variant: 'danger',
          separator: true, hidden: isNew,
          onClick: () => {
            if (confirm(`Delete "${formData.name}"?`)) deleteMutation.mutate()
          },
        },
      ]}
    >
      <div className="p-6 space-y-4 max-w-5xl">
        {/* Header info row */}
        {!isNew && !editing && (
          <div className="flex items-center gap-3">
            <Badge color={STATUS_COLOR[status] ?? 'gray'} size="md" dot>
              {STATUS_STAGES.find(s => s.key === status)?.label ?? status}
            </Badge>
            {formData.expected_revenue != null && (
              <span className="text-sm text-gray-500">
                Expected revenue:{' '}
                <span className="font-semibold text-gray-800">
                  ${Number(formData.expected_revenue).toLocaleString()}
                </span>
              </span>
            )}
          </div>
        )}

        {/* ── Basic info ──────────────────────────────────── */}
        <FormSection title="Lead Information" subtitle="Contact & opportunity details">
          <FormView
            fields={BASIC_FIELDS}
            data={formData}
            onChange={handleChange}
            readOnly={!editing}
          />
        </FormSection>

        {/* ── Notes ──────────────────────────────────────── */}
        <FormSection title="Description & Notes" collapsible defaultOpen>
          <FormView
            fields={EXTRA_FIELDS}
            data={formData}
            onChange={handleChange}
            readOnly={!editing}
          />
        </FormSection>

        {/* ── Activities log (inline lines) ──────────────── */}
        <FormSection
          title="Activities"
          subtitle="Track all interactions with this lead"
          collapsible
          defaultOpen
        >
          <LinesTable
            columns={ACTIVITY_COLUMNS}
            rows={activities}
            onChange={setActivities}
            readOnly={!editing}
            addLabel="Log activity"
            sortable
          />
        </FormSection>
      </div>
    </PageTemplate>
  )
}
