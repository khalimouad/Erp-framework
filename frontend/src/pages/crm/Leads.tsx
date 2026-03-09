/**
 * CRM Leads — showcases the full UI system:
 *  List view   → AdvancedTable (desktop) / ResponsiveTable (mobile-friendly)
 *  Card view   → CardView grid
 *  Kanban view → KanbanView with drag-and-drop stage movement
 *  FilterPills → stage filter bar
 *  Toggle      → archived toggle
 */

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Pencil, Trash2, Copy, Download, Upload,
  TrendingUp, CheckCircle, XCircle, Archive,
  LayoutList, LayoutGrid, Kanban,
} from 'lucide-react'

import { PageTemplate }   from '@/components/layout/PageTemplate'
import { AdvancedTable }  from '@/components/table/AdvancedTable'
import { FormView }       from '@/components/form/FormView'
import { Modal }          from '@/components/ui/Modal'
import { Button }         from '@/components/ui/Button'
import { Badge }          from '@/components/ui/Badge'
import { Toggle }         from '@/components/ui/Toggle'
import { FilterPills }    from '@/components/ui/Pills'
import { CardView }       from '@/components/views/CardView'
import { KanbanView }     from '@/components/views/KanbanView'
import { ResponsiveTable } from '@/components/views/ResponsiveTable'

import { useEditForm }   from '@/hooks/useEditForm'
import { crmApi } from '@/api/client'
import type { Lead } from '@/types'
import type { ColumnDef, RowAction, BulkAction, FormFieldDef, BadgeColor } from '@/types/ui'

// ─── Config ───────────────────────────────────────────────────────────────────

type ViewMode = 'list' | 'card' | 'kanban'

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

const KANBAN_COLS = [
  { key: 'new',         label: 'New',         color: 'bg-blue-400' },
  { key: 'qualified',   label: 'Qualified',   color: 'bg-yellow-400' },
  { key: 'proposition', label: 'Proposition', color: 'bg-purple-400' },
  { key: 'won',         label: 'Won',         color: 'bg-green-500' },
  { key: 'lost',        label: 'Lost',        color: 'bg-red-400' },
]

const EMPTY: Record<string, unknown> = {
  name: '', contact_name: '', email: '', phone: '',
  status: 'new', expected_revenue: 0, description: '',
}

const TABLE_COLUMNS: ColumnDef<Lead>[] = [
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
  { key: 'name',                label: 'Lead Name',        type: 'text',     required: true, span: 2 },
  { key: 'contact_name',        label: 'Contact Name',     type: 'text' },
  { key: 'email',               label: 'Email',            type: 'email' },
  { key: 'phone',               label: 'Phone',            type: 'phone' },
  { key: 'status',              label: 'Stage',            type: 'select',
    options: STATUS_STAGES.map(s => ({ value: s.key, label: s.label, color: s.color })) },
  { key: 'expected_revenue',    label: 'Expected Revenue', type: 'currency', prefix: '$' },
  { key: 'expected_close_date', label: 'Close Date',       type: 'date' },
  { key: 'description',         label: 'Description',      type: 'textarea', span: 2, rows: 3 },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function Leads() {
  const qc = useQueryClient()

  const [view,     setView]     = useState<ViewMode>('list')
  const [filter,   setFilter]   = useState<string | null>(null)
  const [showLost, setShowLost] = useState(false)
  const { open, editing, formData, setFormData, openNew, openEdit, close } = useEditForm<Lead>()

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => crmApi.listLeads(0, 500),
    select: res => res.data as Lead[],
  })

  const createMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => crmApi.createLead(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads'] }); close() },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, d }: { id: number; d: Record<string, unknown> }) => crmApi.updateLead(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads'] }); close() },
  })
  const deleteMutation = useMutation({
    mutationFn: (id: number) => crmApi.deleteLead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  })

  // ── Helpers ────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!editing) createMutation.mutate(formData)
    else          updateMutation.mutate({ id: editing.id, d: formData })
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  const buildRowActions = useCallback((r: Lead) => [
    { key: 'edit',      label: 'Edit',          icon: <Pencil size={14} />,      onClick: () => openEdit(r) },
    { key: 'open',      label: 'Open form',     icon: <TrendingUp size={14} />,  onClick: () => {} },
    { key: 'duplicate', label: 'Duplicate',     icon: <Copy size={14} />,
      onClick: () => {
        const { id: _i, created_at: _c, updated_at: _u, ...rest } = r
        createMutation.mutate({ ...rest, name: `${r.name} (copy)` })
      } },
    { key: 'won',  label: 'Mark as Won',  icon: <CheckCircle size={14} />, hidden: (row) => row.status === 'won',
      onClick: () => updateMutation.mutate({ id: r.id, d: { status: 'won' } }) },
    { key: 'lost', label: 'Mark as Lost', icon: <XCircle size={14} />,    hidden: (row) => row.status === 'lost',
      onClick: () => updateMutation.mutate({ id: r.id, d: { status: 'lost' } }) },
    { key: 'delete', label: 'Delete', icon: <Trash2 size={14} />, variant: 'danger' as const, separator: true,
      onClick: () => { if (confirm(`Delete "${r.name}"?`)) deleteMutation.mutate(r.id) } },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [createMutation, updateMutation, deleteMutation, openEdit])

  const bulkActions: BulkAction<Lead>[] = [
    { key: 'bulk_won',    label: 'Mark Won',   icon: <CheckCircle size={14} />,
      onClick: rows => rows.forEach(r => updateMutation.mutate({ id: r.id, d: { status: 'won' } })) },
    { key: 'bulk_arch',   label: 'Archive',    icon: <Archive size={14} />,
      onClick: rows => { if (confirm(`Archive ${rows.length} lead(s)? They will be marked as lost.`)) rows.forEach(r => updateMutation.mutate({ id: r.id, d: { status: 'lost' } })) } },
    { key: 'bulk_delete', label: 'Delete',     icon: <Trash2 size={14} />, variant: 'danger' as const,
      onClick: rows => { if (confirm(`Delete ${rows.length} lead(s)?`)) rows.forEach(r => deleteMutation.mutate(r.id)) } },
  ]

  // ── Data ───────────────────────────────────────────────────────────────────
  const allLeads = data ?? []
  const leads = allLeads
    .filter(l => showLost || l.status !== 'lost')
    .filter(l => !filter || l.status === filter)

  const summary = STATUS_STAGES.map(s => ({
    ...s,
    count:   allLeads.filter(l => l.status === s.key).length,
    revenue: allLeads.filter(l => l.status === s.key).reduce((sum, l) => sum + l.expected_revenue, 0),
  }))

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <PageTemplate
        title="Leads & Opportunities"
        subtitle="Track your sales pipeline"
        breadcrumbs={[{ label: 'CRM', href: '/crm' }, { label: 'Leads' }]}
        actions={[
          { key: 'new', label: 'New Lead', icon: <Plus size={15} />, variant: 'primary', onClick: () => openNew({ ...EMPTY }) },
        ]}
        moreActions={[
          { key: 'import', label: 'Import CSV', icon: <Upload size={14} />,   onClick: () => alert('Import coming soon') },
          { key: 'export', label: 'Export CSV', icon: <Download size={14} />, onClick: () => alert('Export all') },
        ]}
        loading={isLoading}
      >
        <div className="p-3 sm:p-4 space-y-4">

          {/* ── Pipeline summary ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            {summary.map(s => (
              <button
                key={s.key}
                onClick={() => setFilter(filter === s.key ? null : s.key)}
                className={[
                  'bg-white rounded-xl border px-3 py-3 text-left transition-all',
                  filter === s.key
                    ? 'border-primary-400 ring-2 ring-primary-100 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300',
                ].join(' ')}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Badge color={s.color} size="xs" dot>{s.label}</Badge>
                  <span className="text-xs font-bold text-gray-500">{s.count}</span>
                </div>
                <p className="text-base sm:text-lg font-bold text-gray-800 tabular-nums">
                  ${s.revenue.toLocaleString()}
                </p>
              </button>
            ))}
          </div>

          {/* ── Toolbar ──────────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter pills */}
            <FilterPills
              options={STATUS_STAGES.map(s => ({ value: s.key, label: s.label, color: s.color, count: allLeads.filter(l => l.status === s.key).length }))}
              value={filter as string | null}
              onChange={v => setFilter(v)}
              allLabel="All stages"
            />

            <div className="ml-auto flex items-center gap-3">
              {/* Show lost toggle */}
              <Toggle
                checked={showLost}
                onChange={setShowLost}
                label="Show lost"
                size="sm"
                color="red"
              />

              {/* View switcher */}
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
                {([
                  { mode: 'list',   icon: <LayoutList size={15} />,  title: 'List view' },
                  { mode: 'card',   icon: <LayoutGrid size={15} />,  title: 'Card view' },
                  { mode: 'kanban', icon: <Kanban size={15} />,      title: 'Kanban view' },
                ] as const).map(({ mode, icon, title }) => (
                  <button
                    key={mode}
                    title={title}
                    onClick={() => setView(mode)}
                    className={[
                      'p-1.5 rounded-md transition-all',
                      view === mode
                        ? 'bg-white text-primary-700 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700',
                    ].join(' ')}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── List view ────────────────────────────────────────────────── */}
          {view === 'list' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Mobile-only responsive table */}
              <div className="sm:hidden">
                <ResponsiveTable<Lead>
                  columns={[
                    { key: 'name',             label: 'Lead',    render: r => <div><div className="font-medium">{r.name}</div><div className="text-xs text-gray-400">{r.contact_name}</div></div> },
                    { key: 'expected_revenue', label: 'Revenue', render: r => `$${(r.expected_revenue ?? 0).toLocaleString()}` },
                    { key: 'email',            label: 'Email',   hideMobile: false },
                  ]}
                  data={leads}
                  rowKey="id"
                  loading={isLoading}
                  buildRowActions={buildRowActions}
                  onRowClick={openEdit}
                  mobileStatusRender={r => <Badge color={STATUS_COLOR[r.status] ?? 'gray'} size="xs" dot>{r.status}</Badge>}
                  emptyTitle="No leads yet"
                  emptyText="Create your first lead to start tracking your pipeline."
                />
              </div>
              {/* Desktop advanced table */}
              <div className="hidden sm:block">
                <AdvancedTable<Lead>
                  columns={TABLE_COLUMNS}
                  data={leads}
                  rowKey="id"
                  loading={isLoading}
                  rowActions={buildRowActions}
                  bulkActions={bulkActions}
                  onRowClick={openEdit}
                  emptyTitle="No leads yet"
                  emptyText="Create your first lead to start tracking your pipeline."
                  exportFilename="leads"
                />
              </div>
            </div>
          )}

          {/* ── Card view ────────────────────────────────────────────────── */}
          {view === 'card' && (
            <CardView<Lead>
              data={leads}
              rowKey="id"
              loading={isLoading}
              cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              renderHeader={r => (
                <div>
                  <p className="text-sm font-semibold text-gray-900 truncate">{r.name}</p>
                  {r.contact_name && <p className="text-xs text-gray-400 mt-0.5 truncate">{r.contact_name}</p>}
                </div>
              )}
              renderAvatar={r => (
                <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold shrink-0">
                  {r.name.charAt(0).toUpperCase()}
                </div>
              )}
              fields={[
                { key: 'email', label: 'Email' },
                { key: 'phone', label: 'Phone' },
                { key: 'expected_revenue', label: 'Revenue', render: r => `$${(r.expected_revenue ?? 0).toLocaleString()}` },
                { key: 'status', label: 'Stage', footer: true, render: r => <Badge color={STATUS_COLOR[r.status] ?? 'gray'} size="xs" dot>{r.status}</Badge> },
              ]}
              buildRowActions={buildRowActions}
              onCardClick={openEdit}
              emptyTitle="No leads yet"
              emptyText="Create your first lead to start tracking your pipeline."
            />
          )}

          {/* ── Kanban view ──────────────────────────────────────────────── */}
          {view === 'kanban' && (
            <KanbanView<Lead, string>
              data={leads}
              rowKey="id"
              statusKey="status"
              columns={KANBAN_COLS}
              loading={isLoading}
              onStatusChange={(r, newStatus) => updateMutation.mutate({ id: r.id, d: { status: newStatus } })}
              onAddCard={status => openNew({ ...EMPTY, status })}
              card={{
                renderTitle:    r => r.name,
                renderSubtitle: r => r.contact_name ?? r.email ?? '',
                renderValue:    r => r.expected_revenue ? `$${r.expected_revenue.toLocaleString()}` : null,
                renderMeta:     r => (
                  <div className="flex items-center justify-between">
                    <Badge color={STATUS_COLOR[r.status] ?? 'gray'} size="xs" dot>{r.status}</Badge>
                    {r.email && <span className="text-[11px] text-gray-400 truncate ml-2 max-w-[120px]">{r.email}</span>}
                  </div>
                ),
                buildRowActions,
                onCardClick: openEdit,
              }}
            />
          )}
        </div>
      </PageTemplate>

      {/* Create / Edit modal */}
      <Modal
        open={open}
        onClose={close}
        title={!editing ? 'New Lead' : 'Edit Lead'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={close}>Cancel</Button>
            <Button
              variant="primary" size="sm"
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!formData.name}
              onClick={handleSave}
            >
              {!editing ? 'Create Lead' : 'Save Changes'}
            </Button>
          </>
        }
      >
        <FormView fields={LEAD_FIELDS} data={formData} onChange={setFormData} />
      </Modal>
    </>
  )
}
