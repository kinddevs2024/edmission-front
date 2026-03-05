import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd, Pagination } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageTitle } from '@/components/ui/PageTitle'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { createUser, getUsers, suspendUser, unsuspendUser, deleteUser } from '@/services/admin'
import { formatDate } from '@/utils/format'
import type { AdminUser } from '@/services/admin'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'

export function UserManagement() {
  const { t } = useTranslation(['common', 'admin'])
  const ROLE_OPTIONS = [
    { value: '', label: t('admin:allRoles') },
    { value: 'student', label: t('auth:student') },
    { value: 'university', label: t('auth:university') },
    { value: 'admin', label: t('common:admin') },
  ]
  const STATUS_OPTIONS = [
    { value: '', label: t('admin:allStatuses') },
    { value: 'active', label: t('admin:active') },
    { value: 'suspended', label: t('admin:suspended') },
  ]
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionUserId, setActionUserId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createRole, setCreateRole] = useState<'student' | 'university' | 'admin'>('student')
  const [createEmail, setCreateEmail] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createName, setCreateName] = useState('')
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const limit = 20

  useEffect(() => {
    setLoading(true)
    getUsers({
      page,
      limit,
      role: roleFilter || undefined,
      status: statusFilter || undefined,
    })
      .then((res) => {
        setUsers(res.data ?? [])
        setTotal(res.total ?? 0)
      })
      .catch(() => {
        setUsers([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [page, roleFilter, statusFilter])

  const handleSuspend = (userId: string) => {
    setActionUserId(userId)
    suspendUser(userId)
      .then(() => setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: 'suspended' as const } : u))))
      .catch(() => {})
      .finally(() => setActionUserId(null))
  }

  const handleUnsuspend = (userId: string) => {
    setActionUserId(userId)
    unsuspendUser(userId)
      .then(() => setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: 'active' as const } : u))))
      .catch(() => {})
      .finally(() => setActionUserId(null))
  }

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    setDeleteSubmitting(true)
    deleteUser(deleteTarget.id)
      .then(() => {
        setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id))
        setTotal((x) => Math.max(0, x - 1))
        setDeleteTarget(null)
      })
      .catch(() => {})
      .finally(() => setDeleteSubmitting(false))
  }

  return (
    <div className="space-y-4">
      <PageTitle title={t('admin:users')} icon="Users" />

      <Card>
        <div className="flex justify-end mb-3">
          <Button onClick={() => setCreateOpen(true)}>{t('common:create')}</Button>
        </div>
        <div className="flex flex-wrap gap-4 mb-4">
          <Select
            label={t('common:role')}
            options={ROLE_OPTIONS}
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
          />
          <Select
            label={t('admin:statusLabel')}
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          />
        </div>
        <CardTitle className="mb-2">{t('admin:users')}</CardTitle>
        {loading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : users.length === 0 ? (
          <EmptyState title={t('admin:noUsersFound')} description={t('admin:tryChangingFilters')} />
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableTh>Email</TableTh>
                  <TableTh>Name</TableTh>
                  <TableTh>Role</TableTh>
                  <TableTh>Registered</TableTh>
                  <TableTh>Status</TableTh>
                  <TableTh>Actions</TableTh>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableTd>{u.email}</TableTd>
                    <TableTd>{u.name ?? '—'}</TableTd>
                    <TableTd>{u.role}</TableTd>
                    <TableTd>{formatDate(u.createdAt)}</TableTd>
                    <TableTd>
                      <span className={u.status === 'active' ? 'text-[#22C55E]' : 'text-red-500'}>
                        {u.status === 'active' ? t('admin:active') : t('admin:suspended')}
                      </span>
                    </TableTd>
                    <TableTd>
                      <div className="flex gap-2 flex-wrap">
                        {u.status === 'active' ? (
                          <Button variant="danger" size="sm" onClick={() => handleSuspend(u.id)} disabled={!!actionUserId} loading={actionUserId === u.id}>{t('admin:suspend')}</Button>
                        ) : (
                          <Button variant="secondary" size="sm" onClick={() => handleUnsuspend(u.id)} disabled={!!actionUserId} loading={actionUserId === u.id}>{t('admin:unsuspend')}</Button>
                        )}
                        {u.role !== 'admin' && (
                          <Button variant="danger" size="sm" onClick={() => setDeleteTarget(u)} disabled={!!actionUserId}>{t('admin:delete')}</Button>
                        )}
                      </div>
                    </TableTd>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
          </>
        )}
      </Card>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={t('admin:createUser', 'Create user')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>{t('common:cancel')}</Button>
            <Button
              onClick={() => {
                setCreateSubmitting(true)
                createUser({ role: createRole, email: createEmail, password: createPassword, name: createName || undefined })
                  .then((newUser) => {
                    setUsers((prev) => [newUser, ...prev])
                    setTotal((x) => x + 1)
                    setCreateOpen(false)
                    setCreateEmail('')
                    setCreatePassword('')
                    setCreateName('')
                    setCreateRole('student')
                  })
                  .catch(() => {})
                  .finally(() => setCreateSubmitting(false))
              }}
              disabled={createSubmitting || !createEmail.trim() || !createPassword.trim()}
              loading={createSubmitting}
            >
              {t('common:create')}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Select
            label={t('common:role')}
            options={[
              { value: 'student', label: t('auth:student') },
              { value: 'university', label: t('auth:university') },
              { value: 'admin', label: t('common:admin') },
            ]}
            value={createRole}
            onChange={(e) => setCreateRole(e.target.value as 'student' | 'university' | 'admin')}
          />
          <Input label={t('common:email')} value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} />
          <Input label={t('auth:password')} type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} />
          <Input label={t('common:name')} value={createName} onChange={(e) => setCreateName(e.target.value)} />
          <p className="text-xs text-[var(--color-text-muted)]">
            {t('admin:createUserHint', 'Users created by admin are verified by default.')}
          </p>
        </div>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t('admin:deleteUser', 'Delete user')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>{t('common:cancel')}</Button>
            <Button variant="danger" onClick={handleDeleteConfirm} disabled={deleteSubmitting} loading={deleteSubmitting}>
              {t('admin:delete')}
            </Button>
          </>
        }
      >
        {deleteTarget && (
          <p className="text-[var(--color-text)]">
            {t('admin:deleteUserConfirm', 'Permanently delete this account and all related data?')} <strong>{deleteTarget.email}</strong> ({deleteTarget.role})
          </p>
        )}
      </Modal>
    </div>
  )
}
