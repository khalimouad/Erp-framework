/**
 * Users management page.
 *
 * Features:
 *  - AdvancedTable with all users, status badge, superadmin indicator
 *  - Create / Edit modal (PageTemplate form)
 *  - Role assignment panel: lists all available roles grouped by module,
 *    shows which are currently assigned, toggle with a checkbox click
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, ShieldCheck, UserCog } from 'lucide-react'
import clsx from 'clsx'

import { PageTemplate }    from '@/components/layout/PageTemplate'
import { AdvancedTable }   from '@/components/table/AdvancedTable'
import { ResponsiveTable } from '@/components/views/ResponsiveTable'
import { Modal }           from '@/components/ui/Modal'
import { Badge }           from '@/components/ui/Badge'
import { Button }          from '@/components/ui/Button'
import { FormView }        from '@/components/form/FormView'
import { usersApi, baseApi } from '@/api/client'

import type { ColumnDef, RowAction, ActionDef, FormFieldDef } from '@/types/ui'

// ── types ────────────────────────────────────────────────────────────────────

interface IrRole {
  id: number
  name: string
  label: string
  module: string
  description: string | null
}

interface UserRoleEntry {
  id: number
  role_id: number
  role: IrRole
}

interface AppUser {
  id: number
  email: string
  full_name: string
  is_active: boolean
  is_superadmin: boolean
  company_id: number | null
  created_at: string
  ir_user_roles: UserRoleEntry[]
}

// ── table columns ─────────────────────────────────────────────────────────────

const COLUMNS: ColumnDef<AppUser>[] = [
  {
    key: 'full_name',
    label: 'Name',
    sortable: true,
    searchable: true,
    render: (row) => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
          {row.full_name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="font-medium text-gray-900 flex items-center gap-1.5">
            {row.full_name}
            {row.is_superadmin && (
              <ShieldCheck size={13} className="text-purple-500" title="Superadmin" />
            )}
          </div>
          <div className="text-xs text-gray-400">{row.email}</div>
        </div>
      </div>
    ),
  },
  {
    key: 'email',
    label: 'Email',
    searchable: true,
    hidden: true,   // used for search only — display is in the Name column above
  },
  {
    key: 'is_active',
    label: 'Status',
    type: 'badge',
    sortable: true,
    badgeMap: {
      true:  { label: 'Active',   color: 'green' },
      false: { label: 'Inactive', color: 'gray'  },
    },
    render: (row) => (
      <Badge color={row.is_active ? 'green' : 'gray'} dot size="sm">
        {row.is_active ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
  {
    key: 'ir_user_roles',
    label: 'Roles',
    render: (row) => (
      <div className="flex flex-wrap gap-1">
        {row.ir_user_roles.length === 0 ? (
          <span className="text-xs text-gray-400 italic">No roles</span>
        ) : (
          row.ir_user_roles.slice(0, 3).map((ur) => (
            <Badge key={ur.id} color="blue" size="xs">{ur.role.label}</Badge>
          ))
        )}
        {row.ir_user_roles.length > 3 && (
          <Badge color="gray" size="xs">+{row.ir_user_roles.length - 3}</Badge>
        )}
      </div>
    ),
  },
  { key: 'created_at', label: 'Created', type: 'date', sortable: true },
]

// ── form fields ───────────────────────────────────────────────────────────────

const CREATE_FIELDS: FormFieldDef[] = [
  { key: 'full_name',     label: 'Full Name', type: 'text',  required: true },
  { key: 'email',         label: 'Email',     type: 'email', required: true },
  { key: 'password',      label: 'Password',  type: 'text',  required: true, placeholder: 'Min. 8 characters' },
  {
    key: 'is_superadmin',
    label: 'Superadmin',
    type: 'boolean',
    description: 'Superadmins bypass all permission checks',
  } as FormFieldDef,
]

const EDIT_FIELDS: FormFieldDef[] = [
  { key: 'full_name',     label: 'Full Name', type: 'text'    },
  { key: 'is_active',     label: 'Active',    type: 'boolean' },
  { key: 'is_superadmin', label: 'Superadmin', type: 'boolean' } as FormFieldDef,
]

// ── role panel ────────────────────────────────────────────────────────────────

function RolePanel({ user }: { user: AppUser }) {
  const qc = useQueryClient()

  const { data: allRoles = [] } = useQuery<IrRole[]>({
    queryKey: ['base-roles'],
    queryFn: () => baseApi.listRoles().then(r => r.data),
  })

  const assignedIds = new Set(user.ir_user_roles.map(ur => ur.role_id))

  const assignMutation = useMutation({
    mutationFn: (roleId: number) => usersApi.assignRole(user.id, roleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  const revokeMutation = useMutation({
    mutationFn: (roleId: number) => usersApi.revokeRole(user.id, roleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  const toggle = (roleId: number) => {
    if (assignedIds.has(roleId)) {
      revokeMutation.mutate(roleId)
    } else {
      assignMutation.mutate(roleId)
    }
  }

  // Group roles by module
  const byModule = allRoles.reduce<Record<string, IrRole[]>>((acc, r) => {
    if (!acc[r.module]) acc[r.module] = []
    acc[r.module].push(r)
    return acc
  }, {})

  if (user.is_superadmin) {
    return (
      <div className="p-4 rounded-xl border border-purple-200 bg-purple-50 flex items-start gap-3">
        <ShieldCheck size={18} className="text-purple-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-purple-800">Superadmin</p>
          <p className="text-xs text-purple-600 mt-0.5">
            Superadmins bypass all role checks and have full access to the entire system.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {Object.entries(byModule).sort(([a], [b]) => a.localeCompare(b)).map(([module, roles]) => (
        <div key={module}>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 capitalize">
            {module}
          </h4>
          <div className="space-y-1.5">
            {roles.map(role => {
              const isAssigned = assignedIds.has(role.id)
              const isPending =
                (assignMutation.isPending && assignMutation.variables === role.id) ||
                (revokeMutation.isPending && revokeMutation.variables === role.id)

              return (
                <label
                  key={role.id}
                  className={clsx(
                    'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    isAssigned
                      ? 'border-primary-200 bg-primary-50'
                      : 'border-gray-200 bg-white hover:border-gray-300',
                    isPending && 'opacity-60 cursor-not-allowed',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isAssigned}
                    disabled={isPending}
                    onChange={() => toggle(role.id)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{role.label}</span>
                      <code className="text-xs text-gray-400">{role.name}</code>
                    </div>
                    {role.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{role.description}</p>
                    )}
                  </div>
                </label>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────

export default function Users() {
  const qc = useQueryClient()

  const [creating, setCreating]     = useState(false)
  const [editUser, setEditUser]     = useState<AppUser | null>(null)
  const [rolesUser, setRolesUser]   = useState<AppUser | null>(null)
  const [formData, setFormData]     = useState<Record<string, unknown>>({})

  const { data: users = [], isLoading } = useQuery<AppUser[]>({
    queryKey: ['users'],
    queryFn: () => usersApi.list().then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => usersApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setCreating(false) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, d }: { id: number; d: Record<string, unknown> }) => usersApi.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setEditUser(null) },
  })

  // ── row actions ────────────────────────────────────────────────────────────
  const rowActions: RowAction<AppUser>[] = [
    {
      key: 'roles',
      label: 'Manage Roles',
      icon: <ShieldCheck size={14} />,
      onClick: (row) => setRolesUser(row),
    },
    {
      key: 'edit',
      label: 'Edit',
      onClick: (row) => { setEditUser(row); setFormData({ ...row }) },
    },
    {
      key: 'deactivate',
      label: (row) => row.is_active ? 'Deactivate' : 'Activate',
      variant: 'danger',
      separator: true,
      onClick: (row) => updateMutation.mutate({ id: row.id, d: { is_active: !row.is_active } }),
    },
  ]

  // ── page actions ───────────────────────────────────────────────────────────
  const actions: ActionDef[] = [
    {
      key: 'new',
      label: 'New User',
      icon: <Plus size={14} />,
      variant: 'primary',
      onClick: () => { setFormData({}); setCreating(true) },
    },
  ]

  return (
    <PageTemplate
      title="Users"
      subtitle="Manage user accounts and role assignments"
      breadcrumbs={[{ label: 'Settings', href: '/settings' }, { label: 'Users' }]}
      actions={actions}
      loading={isLoading}
    >
      <div className="p-4 sm:p-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="sm:hidden">
            <ResponsiveTable<AppUser>
              columns={[
                {
                  key: 'full_name',
                  label: 'User',
                  render: r => (
                    <div>
                      <div className="font-medium flex items-center gap-1">
                        {r.full_name}
                        {r.is_superadmin && <ShieldCheck size={12} className="text-purple-500" />}
                      </div>
                      <div className="text-xs text-gray-400">{r.email}</div>
                    </div>
                  ),
                },
              ]}
              data={users}
              rowKey="id"
              loading={isLoading}
              buildRowActions={(r) => [
                { key: 'roles', label: 'Manage Roles', onClick: () => setRolesUser(r) },
                { key: 'edit',  label: 'Edit',         onClick: () => { setEditUser(r); setFormData({ ...r }) } },
                {
                  key: 'deactivate',
                  label: r.is_active ? 'Deactivate' : 'Activate',
                  variant: 'danger' as const,
                  separator: true,
                  onClick: () => updateMutation.mutate({ id: r.id, d: { is_active: !r.is_active } }),
                },
              ]}
              mobileStatusRender={(r) => (
                <Badge color={r.is_active ? 'green' : 'gray'} size="xs" dot>
                  {r.is_active ? 'Active' : 'Inactive'}
                </Badge>
              )}
              emptyTitle="No users yet"
              emptyText="Create your first user."
            />
          </div>
          <div className="hidden sm:block">
            <AdvancedTable<AppUser>
              columns={COLUMNS}
              data={users}
              rowKey="id"
              rowActions={rowActions}
              searchPlaceholder="Search users…"
              exportFilename="users"
              emptyText="No users found"
            />
          </div>
        </div>
      </div>

      {/* ── Create user modal ─────────────────────────────────────── */}
      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Create User"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
            <Button
              variant="primary"
              loading={createMutation.isPending}
              onClick={() => createMutation.mutate(formData)}
            >
              Create
            </Button>
          </div>
        }
      >
        <FormView
          fields={CREATE_FIELDS}
          data={formData}
          onChange={setFormData}
          readOnly={false}
        />
      </Modal>

      {/* ── Edit user modal ───────────────────────────────────────── */}
      <Modal
        open={!!editUser}
        onClose={() => setEditUser(null)}
        title={`Edit — ${editUser?.full_name}`}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button
              variant="primary"
              loading={updateMutation.isPending}
              onClick={() => updateMutation.mutate({ id: editUser!.id, d: formData })}
            >
              Save
            </Button>
          </div>
        }
      >
        <FormView
          fields={EDIT_FIELDS}
          data={formData}
          onChange={setFormData}
          readOnly={false}
        />
      </Modal>

      {/* ── Role assignment side panel ────────────────────────────── */}
      <Modal
        open={!!rolesUser}
        onClose={() => setRolesUser(null)}
        title={
          <div className="flex items-center gap-2">
            <UserCog size={18} />
            <span>Roles — {rolesUser?.full_name}</span>
          </div>
        }
        size="lg"
        footer={
          <Button variant="primary" onClick={() => setRolesUser(null)}>Done</Button>
        }
      >
        {rolesUser && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Check a role to grant it. Uncheck to revoke. Changes are applied immediately.
              Roles are defined by installed modules.
            </p>
            <RolePanel user={rolesUser} />
          </div>
        )}
      </Modal>
    </PageTemplate>
  )
}
