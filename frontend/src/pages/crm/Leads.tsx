/**
 * CRM Leads — reference page showcasing the full design system.
 *
 * Demonstrates:
 *  • PageTemplate   — breadcrumbs, primary actions, more-actions dropdown, view tabs
 *  • AdvancedTable  — sort, filter, search, select, bulk-actions, row-actions, pagination, export
 *  • Modal          — create / quick-edit form
 *  • FormView       — 2-column form with select, email, textarea, currency, date
 *  • Badge + StatusBar — pipeline summary cards
 */

import { useState }                          from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate }                        from 'react-router-dom'
import {
  Plus, Pencil, Trash2, Copy, Download, Upload,
  TrendingUp, CheckCircle, XCircle, Archive,
} from 'lucide-react'

import { PageTemplate }  from '@/components/layout/PageTemplate'
import { AdvancedTable } from '@/components/table/AdvancedTable'
import { FormView }      from '@/components/form/FormView'
import { Modal }         from '@/components/ui/Modal'
import { Button }        from '@/components/ui/Button'
import { Badge }         from '@/components/ui/Badge'

import { crmApi }        from '@/api/client'
import type { Lead }     from '@/types'
import type { ColumnDef, RowAction, BulkAction, FormFieldDef, BadgeColor } from '@/types/ui'

// ─── config ───────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, BadgeColor> = {
  new: 'blue', qualified: 'yellow', proposition: 'purple', won: 'green', lost: 'red',
}

const STATUS_STAGES = [
  { key: 'new',         label: 'New',         color: 'blue'   as BadgeColor },
  { key: 'qualified',   label: 'Qualified',   color: 'yellow' as BadgeColor },
  { key: 'proposition', label: 'Proposition', color: 'purple' as BadgeColor },
  { key: 'won',         label: 'Won',         color: 'green'  as BadgeColor },
  { key: 'lost',        label: 'Lost',        color: 'red'    as BadgeColor },
]

const EMPTY: Record<string, unknown> = {
  name: '', contact_name: '', email: '', phone: '',
  status: 'new', expected_revenue: 0, description: '',
}

const COLUMNS: ColumnDef<Lead>[] = [
  {
    key: 'name', label: 'Lead / Opportunity', sortable: true, searchable: true, minWidth: '200px',
    render: row => (
      <div>
        <div className="font-medium text-gray-900">{row.name}</div>
        {row.contact_name && <div className="text-xs text-gray-400 mt-0.5">{row.contact_name}</div>}
      </div>
    ),
  },
  { key: 'email',            label: 'Email',            sortable: true, searchable: true },
  { key: 'phone',            label: 'Phone' },
  { key: 'status',           label: 'Stage',            type: 'badge', sortable: true, filterable: true, badgeMap: STATUS_COLOR, width: '130px' },
  { key: 'expected_revenue', label: 'Expected Revenue', type: 'currency', sortable: true, align: 'right', width: '160px' },
  { key: 'created_at',       label: 'Created',          type: 'date', sortable: true, width: '110px' },
]

const LEAD_FIELDS: FormFieldDef[] = [
  { key: 'name',                label: 'Lead Name',       type: 'text',     required: true, span: 2 },
  { key: 'contact_name',        label: 'Contact Name',    type: 'text' },
  { key: 'email',               label: 'Email',           type: 'email' },
  { key: 'phone',               label: 'Phone',           type: 'phone' },
  { key: 'status',              label: 'Stage',           type: 'select',
    options: STATUS_STAGES.map(s => ({ value: s.key, label: s.label, color: s.color })) },
  { key: 'expected_revenue',    label: 'Expected Revenue', type: 'currency', prefix: '$' },
  { key: 'expected_close_date', label: 'Close Date',      type: 'date' },
  { key: 'description',         label: 'Description',     type: 'textarea', span: 2, rows: 3 },
]

// ─── component ────────────────────────────────────────────────────────────────

export default function Leads() {
  const qc       = useQueryClient()
  const navigate = useNavigate()

  const [modal,    setModal]    = useState<'create' | 'edit' | null>(null)
  const [formData, setFormData] = useState<Record<string, unknown>>(EMPTY)
  const [editId,   setEditId]   = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => crmApi.listLeads(0, 500),
    select: res => res.data as Lead[],
  })

  const createMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => crmApi.createLead(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads'] }); close_() },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, d }: { id: number; d: Record<string, unknown> }) => crmApi.updateLead(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads'] }); close_() },
  })
  const deleteMutation = useMutation({
    mutationFn: (id: number) => crmApi.deleteLead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  })

  const open_  = (mode: 'create' | 'edit', lead?: Lead) => {
    setFormData(lead ? { ...lead } : { ...EMPTY })
    setEditId(lead?.id ?? null)
    setModal(mode)
  }
  const close_ = () => { setModal(null); setFormData({ ...EMPTY }); setEditId(null) }

  const handleSave = () => {
    if (modal === 'create') createMutation.mutate(formData)
    else if (editId)        updateMutation.mutate({ id: editId, d: formData })
  }

  const rowActions: RowAction<Lead>[] = [
    { key: 'edit',      label: 'Edit',        icon: <Pencil size={14} />,      onClick: r => open_('edit', r) },
    { key: 'open',      label: 'Open form',   icon: <TrendingUp size={14} />,  onClick: r => navigate(`/crm/leads/${r.id}`) },
    { key: 'duplicate', label: 'Duplicate',   icon: <Copy size={14} />,
      onClick: r => {
        const { id: _i, created_at: _c, updated_at: _u, ...rest } = r
        createMutation.mutate({ ...rest, name: `${r.name} (copy)` })
      },
    },
    { key: 'won',  label: 'Mark as Won',  icon: <CheckCircle size={14} />, hidden: r => r.status === 'won',
      onClick: r => updateMutation.mutate({ id: r.id, d: { status: 'won' } }) },
    { key: 'lost', label: 'Mark as Lost', icon: <XCircle size={14} />,    hidden: r => r.status === 'lost',
      onClick: r => updateMutation.mutate({ id: r.id, d: { status: 'lost' } }) },
    { key: 'delete', label: 'Delete', icon: <Trash2 size={14} />, variant: 'danger', separator: true,
      onClick: r => { if (confirm(`Delete "${r.name}"?`)) deleteMutation.mutate(r.id) } },
  ]

  const bulkActions: BulkAction<Lead>[] = [
    { key: 'bulk_won',    label: 'Mark Won',  icon: <CheckCircle size={14} />,
      onClick: rows => rows.forEach(r => updateMutation.mutate({ id: r.id, d: { status: 'won' } })) },
    { key: 'bulk_arch',   label: 'Archive',   icon: <Archive size={14} />,
      onClick: rows => console.log('archive', rows.length) },
    { key: 'bulk_delete', label: 'Delete',    icon: <Trash2 size={14} />, variant: 'danger',
      onClick: rows => { if (confirm(`Delete ${rows.length} lead(s)?`)) rows.forEach(r => deleteMutation.mutate(r.id)) } },
  ]

  const leads   = data ?? []
  const summary = STATUS_STAGES.map(s => ({
    ...s,
    count:   leads.filter(l => l.status === s.key).length,
    revenue: leads.filter(l => l.status === s.key).reduce((sum, l) => sum + l.expected_revenue, 0),
  }))

  return (
    <>
      <PageTemplate
        title="Leads & Opportunities"
        subtitle="Track your sales pipeline"
        breadcrumbs={[{ label: 'CRM', href: '/crm' }, { label: 'Leads' }]}
        actions={[
          { key: 'new', label: 'New Lead', icon: <Plus size={15} />, variant: 'primary', onClick: () => open_('create') },
        ]}
        moreActions={[
          { key: 'import', label: 'Import CSV', icon: <Upload size={14} />,   onClick: () => alert('Import coming soon') },
          { key: 'export', label: 'Export CSV', icon: <Download size={14} />, onClick: () => alert('Export all') },
        ]}
        availableViews={['list', 'kanban']}
        activeView="list"
        loading={isLoading}
      >
        <div className="p-4 space-y-4">
          {/* Pipeline summary */}
          <div className="grid grid-cols-5 gap-3">
            {summary.map(s => (
              <div key={s.key} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <Badge color={s.color} size="xs" dot>{s.label}</Badge>
                  <span className="text-xs font-medium text-gray-400">{s.count}</span>
                </div>
                <p className="text-lg font-bold text-gray-800">
                  ${s.revenue.toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* Data table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <AdvancedTable<Lead>
              columns={COLUMNS}
              data={leads}
              rowKey="id"
              loading={isLoading}
              rowActions={rowActions}
              bulkActions={bulkActions}
              onRowClick={row => open_('edit', row)}
              emptyTitle="No leads yet"
              emptyText="Create your first lead to start tracking your pipeline."
              exportFilename="leads"
            />
          </div>
        </div>
      </PageTemplate>

      {/* Create / Edit modal */}
      <Modal
        open={modal !== null}
        onClose={close_}
        title={modal === 'create' ? 'New Lead' : 'Edit Lead'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={close_}>Cancel</Button>
            <Button
              variant="primary" size="sm"
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!formData.name}
              onClick={handleSave}
            >
              {modal === 'create' ? 'Create Lead' : 'Save Changes'}
            </Button>
          </>
        }
      >
        <FormView fields={LEAD_FIELDS} data={formData} onChange={setFormData} />
      </Modal>
    </>
  )
}
