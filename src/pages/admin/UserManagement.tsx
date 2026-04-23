import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd, Pagination } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageTitle } from '@/components/ui/PageTitle'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { createUser, getUsers, getAdminUser, updateUser, suspendUser, unsuspendUser, deleteUser, resetUserPassword } from '@/services/admin'
import { formatDate } from '@/utils/format'
import type { AdminUser } from '@/services/admin'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { toastApiError } from '@/utils/toastError'
import { useAuth } from '@/hooks/useAuth'
import type { Role } from '@/types/user'

export function UserManagement() {
  const { t } = useTranslation(['common', 'admin'])
  const navigate = useNavigate()
  const { role } = useAuth()
  const isAdmin = role === 'admin'
  const isManager = role === 'manager'
  const isCoordinator = role === 'counsellor_coordinator'
  const canManageUsers = isAdmin || isManager || isCoordinator

  const roleLabels = useMemo(() => ({
    student: t('auth:student'),
    university: t('auth:university'),
    university_multi_manager: t('admin:universityMultiManagerRole', 'Multi-university manager'),
    admin: t('common:admin'),
    manager: t('admin:managerRole', 'Manager'),
    counsellor_coordinator: t('admin:counsellorCoordinator', 'Counsellor coordinator'),
    school_counsellor: t('admin:schoolCounsellor', 'School counsellor'),
  }), [t])

  const assignableRoles = useMemo<Role[]>(() => {
    if (isAdmin) return ['student', 'university', 'university_multi_manager', 'admin', 'manager', 'counsellor_coordinator', 'school_counsellor']
    if (isManager) return ['counsellor_coordinator', 'school_counsellor']
    if (isCoordinator) return ['school_counsellor']
    return []
  }, [isAdmin, isCoordinator, isManager])

  const canManageUserRole = (targetRole: string) => {
    if (isAdmin) return true
    if (isManager) return targetRole === 'counsellor_coordinator' || targetRole === 'school_counsellor'
    if (isCoordinator) return targetRole === 'school_counsellor'
    return false
  }

  const canViewStudentProfile = (targetRole: string) => {
    if (targetRole !== 'student') return false
    return isAdmin || isManager || isCoordinator
  }

  const ROLE_OPTIONS = useMemo(() => {
    const scoped =
      isAdmin
        ? ['student', 'university', 'university_multi_manager', 'admin', 'manager', 'counsellor_coordinator', 'school_counsellor']
        : isManager
          ? ['counsellor_coordinator', 'school_counsellor']
          : isCoordinator
            ? ['school_counsellor']
            : ['school_counsellor']
    return [
      { value: '', label: t('admin:allRoles') },
      ...scoped.map((r) => ({ value: r, label: roleLabels[r as keyof typeof roleLabels] })),
    ]
  }, [isAdmin, isCoordinator, isManager, roleLabels, t])

  const assignableRoleOptions = useMemo(
    () => assignableRoles.map((r) => ({ value: r, label: roleLabels[r] })),
    [assignableRoles, roleLabels]
  )

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
  const [createRole, setCreateRole] = useState<Role>('student')
  const [createEmail, setCreateEmail] = useState('')
  const [createName, setCreateName] = useState('')
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null)
  const [resetPassword, setResetPassword] = useState('')
  const [resetSubmitting, setResetSubmitting] = useState(false)
  const [editUserTarget, setEditUserTarget] = useState<AdminUser | null>(null)
  const [editUserRole, setEditUserRole] = useState<Role>('student')
  const [editUserName, setEditUserName] = useState('')
  const [editUserSaving, setEditUserSaving] = useState(false)
  const [editManagerUniversityIdsText, setEditManagerUniversityIdsText] = useState('')
  const [editManagerApproved, setEditManagerApproved] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const limit = 20

  useEffect(() => {
    if (assignableRoles.length === 0) return
    if (!assignableRoles.includes(createRole)) setCreateRole(assignableRoles[0])
  }, [assignableRoles, createRole])

  useEffect(() => {
    const id = window.setTimeout(() => {
      const next = searchInput.trim()
      setAppliedSearch((prev) => {
        if (prev !== next) {
          setPage(1)
        }
        return next
      })
    }, 400)
    return () => window.clearTimeout(id)
  }, [searchInput])

  useEffect(() => {
    setLoading(true)
    getUsers({
      page,
      limit,
      role: roleFilter || undefined,
      status: statusFilter || undefined,
      search: appliedSearch || undefined,
    })
      .then((res) => {
        setUsers(res.data ?? [])
        setTotal(res.total ?? 0)
      })
      .catch((e) => {
        toastApiError(e)
        setUsers([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [page, roleFilter, statusFilter, appliedSearch])

  const handleSuspend = (userId: string) => {
    setActionUserId(userId)
    suspendUser(userId)
      .then(() => setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: 'suspended' as const } : u))))
      .catch(toastApiError)
      .finally(() => setActionUserId(null))
  }

  const handleUnsuspend = (userId: string) => {
    setActionUserId(userId)
    unsuspendUser(userId)
      .then(() => setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: 'active' as const } : u))))
      .catch(toastApiError)
      .finally(() => setActionUserId(null))
  }

  const handleResetPasswordConfirm = () => {
    if (!resetTarget || !resetPassword.trim()) return
    setResetSubmitting(true)
    resetUserPassword(resetTarget.id, resetPassword)
      .then(() => {
        setResetTarget(null)
        setResetPassword('')
      })
      .catch(toastApiError)
      .finally(() => setResetSubmitting(false))
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
      .catch(toastApiError)
      .finally(() => setDeleteSubmitting(false))
  }

  const openEditUser = (user: AdminUser) => {
    if (!canManageUserRole(user.role)) return
    setEditUserTarget(user)
    setEditUserRole((user.role as Role) || 'student')
    setEditUserName(user.name ?? '')
    setEditManagerUniversityIdsText('')
    setEditManagerApproved(false)
    if (isAdmin) {
      getAdminUser(user.id)
        .then((raw) => {
          if (String(raw.role ?? '') !== 'university_multi_manager') return
          const ids = (raw.managedUniversityUserIds as unknown[] | undefined) ?? []
          setEditManagerUniversityIdsText(ids.map((x) => String(x)).filter(Boolean).join('\n'))
          setEditManagerApproved(Boolean(raw.universityMultiManagerApproved))
        })
        .catch(() => {})
    }
  }

  const handleEditUserSave = () => {
    if (!editUserTarget) return
    setEditUserSaving(true)
    const payload: Parameters<typeof updateUser>[1] = { role: editUserRole, name: editUserName.trim() || undefined }
    if (isAdmin && editUserRole === 'university_multi_manager') {
      const ids = editManagerUniversityIdsText
        .split(/[\n,;\s]+/)
        .map((x) => x.trim())
        .filter(Boolean)
      payload.managedUniversityUserIds = [...new Set(ids)]
      payload.universityMultiManagerApproved = editManagerApproved
    }
    updateUser(editUserTarget.id, payload)
      .then((updated) => {
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
        setEditUserTarget(null)
      })
      .catch(toastApiError)
      .finally(() => setEditUserSaving(false))
  }

  return (
    <div className="space-y-4">
      <PageTitle title={t('admin:users')} icon="Users" />

      <Card>
        <div className="mb-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-0 flex-1">
              <Input
                label={t('admin:userSearchLabel', 'Search')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t(
                  'admin:userSearchPlaceholder',
                  'Email, name, or student first/last name…'
                )}
              />
            </div>
            {canManageUsers && assignableRoleOptions.length > 0 && (
              <Button className="shrink-0" onClick={() => setCreateOpen(true)}>
                {t('common:create')}
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-end gap-4">
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
                  <TableTh>{t('common:email')}</TableTh>
                  <TableTh>{t('common:name')}</TableTh>
                  <TableTh>{t('common:role')}</TableTh>
                  <TableTh>{t('admin:registered')}</TableTh>
                  <TableTh>{t('admin:statusLabel')}</TableTh>
                  <TableTh>{t('common:actions')}</TableTh>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableTd>{u.email}</TableTd>
                    <TableTd>{u.name ?? '—'}</TableTd>
                    <TableTd>{roleLabels[u.role as keyof typeof roleLabels] ?? u.role}</TableTd>
                    <TableTd>{formatDate(u.createdAt)}</TableTd>
                    <TableTd>
                      <span className={u.status === 'active' ? 'text-[#22C55E]' : 'text-red-500'}>
                        {u.status === 'active' ? t('admin:active') : t('admin:suspended')}
                      </span>
                    </TableTd>
                    <TableTd>
                      {!canManageUserRole(u.role) && !canViewStudentProfile(u.role) ? (
                        <span className="text-[var(--color-text-muted)]">—</span>
                      ) : (
                        <div className="flex gap-2 flex-wrap">
                          {canViewStudentProfile(u.role) && (
                            <Button
                              variant="secondary"
                              size="sm"
                              type="button"
                              disabled={!!actionUserId}
                              onClick={() => navigate(`/admin/users/${u.id}/student-profile`)}
                            >
                              {t('admin:viewProfile', 'View profile')}
                            </Button>
                          )}
                          {canManageUserRole(u.role) && (
                            <>
                              <Button variant="secondary" size="sm" onClick={() => openEditUser(u)} disabled={!!actionUserId}>
                                {t('admin:changeRole', 'Change role')}
                              </Button>
                              {u.status === 'active' ? (
                                <Button variant="danger" size="sm" onClick={() => handleSuspend(u.id)} disabled={!!actionUserId} loading={actionUserId === u.id}>{t('admin:suspend')}</Button>
                              ) : (
                                <Button variant="secondary" size="sm" onClick={() => handleUnsuspend(u.id)} disabled={!!actionUserId} loading={actionUserId === u.id}>{t('admin:unsuspend')}</Button>
                              )}
                              {isAdmin && u.role === 'university' && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  type="button"
                                  disabled={!!actionUserId}
                                  onClick={() => navigate(`/admin/users/${u.id}/university-profile`)}
                                >
                                  {t('admin:editProfile', 'Edit profile')}
                                </Button>
                              )}
                              <Button variant="secondary" size="sm" onClick={() => { setResetTarget(u); setResetPassword('') }} disabled={!!actionUserId}>
                                {t('admin:resetPassword', 'Reset password')}
                              </Button>
                              {u.role !== 'admin' && (
                                <Button variant="danger" size="sm" onClick={() => setDeleteTarget(u)} disabled={!!actionUserId}>{t('admin:delete')}</Button>
                              )}
                            </>
                          )}
                        </div>
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
                createUser({ role: createRole, email: createEmail, name: createName || undefined })
                  .then((newUser) => {
                    setUsers((prev) => [newUser, ...prev])
                    setTotal((x) => x + 1)
                    setCreateOpen(false)
                    setCreateEmail('')
                    setCreateName('')
                    setCreateRole(assignableRoles[0] ?? 'student')
                  })
                  .catch(toastApiError)
                  .finally(() => setCreateSubmitting(false))
              }}
              disabled={createSubmitting || !createEmail.trim()}
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
            options={assignableRoleOptions}
            value={createRole}
            onChange={(e) => setCreateRole(e.target.value as Role)}
          />
          <Input label={t('common:email')} value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} />
          <Input label={t('common:name')} value={createName} onChange={(e) => setCreateName(e.target.value)} />
          <p className="text-xs text-[var(--color-text-muted)]">
            {t('admin:createUserInviteHint', 'User will receive an email with a link to set their password.')}
          </p>
        </div>
      </Modal>

      <Modal
        open={!!editUserTarget}
        onClose={() => setEditUserTarget(null)}
        title={t('admin:changeRole', 'Change role')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditUserTarget(null)} disabled={editUserSaving}>{t('common:cancel')}</Button>
            <Button onClick={handleEditUserSave} disabled={editUserSaving} loading={editUserSaving}>{t('common:save', 'Save')}</Button>
          </>
        }
      >
        <div className="space-y-3">
          {editUserTarget && (
            <>
              <p className="text-sm text-[var(--color-text-muted)]">{t('admin:userEmail', 'User')}: {editUserTarget.email}</p>
              <Select
                label={t('common:role')}
                options={assignableRoleOptions}
                value={editUserRole}
                onChange={(e) => setEditUserRole(e.target.value as Role)}
              />
              <Input label={t('common:name')} value={editUserName} onChange={(e) => setEditUserName(e.target.value)} />
              {isAdmin && editUserRole === 'university_multi_manager' ? (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[var(--color-text)]">
                    {t('admin:managedUniversityUserIds', 'Managed university account IDs (one User id per line)')}
                  </label>
                  <textarea
                    className="w-full min-h-[100px] rounded-input border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm"
                    value={editManagerUniversityIdsText}
                    onChange={(e) => setEditManagerUniversityIdsText(e.target.value)}
                    spellCheck={false}
                  />
                  <Checkbox
                    checked={editManagerApproved}
                    onChange={(e) => setEditManagerApproved(e.target.checked)}
                    label={t('admin:universityMultiManagerApproved', 'Approved to impersonate assigned universities')}
                  />
                </div>
              ) : null}
              <p className="text-xs text-[var(--color-text-muted)]">
                {t('admin:changeRoleHint', 'Assign and manage accounts based on your role scope.')}
              </p>
            </>
          )}
        </div>
      </Modal>

      <Modal
        open={!!resetTarget}
        onClose={() => { setResetTarget(null); setResetPassword('') }}
        title={t('admin:resetPassword', 'Reset password')}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setResetTarget(null); setResetPassword('') }} disabled={resetSubmitting}>{t('common:cancel')}</Button>
            <Button onClick={handleResetPasswordConfirm} disabled={resetSubmitting || !resetPassword.trim()} loading={resetSubmitting}>
              {t('admin:resetPassword', 'Reset password')}
            </Button>
          </>
        }
      >
        {resetTarget && (
          <div className="space-y-3">
            <p className="text-sm text-[var(--color-text)]">
              {t('admin:resetPasswordConfirm', 'Set a new password for')} <strong>{resetTarget.email}</strong>
            </p>
            <Input
              label={t('auth:password')}
              type="password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              placeholder={t('auth:passwordRequirements', '8+ chars, uppercase, lowercase, number')}
            />
          </div>
        )}
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
