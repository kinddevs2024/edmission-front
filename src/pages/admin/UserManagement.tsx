import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd, Pagination } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageTitle } from '@/components/ui/PageTitle'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { getUsers, suspendUser, unsuspendUser } from '@/services/admin'
import { formatDate } from '@/utils/format'
import type { AdminUser } from '@/services/admin'

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

  return (
    <div className="space-y-4">
      <PageTitle title={t('admin:users')} icon="Users" />

      <Card>
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
                      {u.status === 'active' ? (
                        <Button variant="danger" size="sm" onClick={() => handleSuspend(u.id)} disabled={!!actionUserId} loading={actionUserId === u.id}>{t('admin:suspend')}</Button>
                      ) : (
                        <Button variant="secondary" size="sm" onClick={() => handleUnsuspend(u.id)} disabled={!!actionUserId} loading={actionUserId === u.id}>{t('admin:unsuspend')}</Button>
                      )}
                    </TableTd>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
          </>
        )}
      </Card>
    </div>
  )
}
