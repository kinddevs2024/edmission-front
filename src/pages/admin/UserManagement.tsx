import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd, Pagination } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageTitle } from '@/components/ui/PageTitle'
import { TableSkeleton } from '@/components/ui/Skeleton'
import {
  createUser,
  getUsers,
  getAdminUser,
  updateUser,
  suspendUser,
  unsuspendUser,
  deleteUser,
  resetUserPassword,
  downloadAllUsersExcel,
  downloadUsersTemplate,
  previewUsersExcel,
  uploadUsersExcel,
  type UsersImportPreviewResult,
} from '@/services/admin'
import { formatDate } from '@/utils/format'
import type { AdminUser } from '@/services/admin'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { toastApiError } from '@/utils/toastError'
import { useAuth } from '@/hooks/useAuth'
import type { Role } from '@/types/user'
import { Ban, Eye, KeyRound, ShieldCheck, Trash2, Upload, UserCog, Download } from 'lucide-react'
import { toast } from 'sonner'

function formatPreviewValue(value: unknown): string {
  if (value == null || value === '') return '--'
  if (Array.isArray(value)) {
    return value.length ? value.map((item) => formatPreviewValue(item)).join(', ') : '--'
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

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
  const [editManagerUniversityIds, setEditManagerUniversityIds] = useState<string[]>([])
  const [universityPickerSearch, setUniversityPickerSearch] = useState('')
  const [universityPickerLoading, setUniversityPickerLoading] = useState(false)
  const [universityPickerOptions, setUniversityPickerOptions] = useState<AdminUser[]>([])
  const [editManagerApproved, setEditManagerApproved] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [importingExcel, setImportingExcel] = useState(false)
  const [confirmingImport, setConfirmingImport] = useState(false)
  const [importPreview, setImportPreview] = useState<UsersImportPreviewResult | null>(null)
  const [importPreviewFile, setImportPreviewFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const limit = 20
  const hasVisibleValue = (value: unknown) => String(value ?? '').trim().length > 0
  const showNameColumn = users.some((user) => hasVisibleValue(user.name))
  const showPhoneColumn = users.some((user) => hasVisibleValue(user.phone))
  const showOneTimePasswordColumn = users.some((user) => Boolean(user.temporaryPassword))

  useEffect(() => {
    if (assignableRoles.length === 0) return
    if (!assignableRoles.includes(createRole)) setCreateRole(assignableRoles[0])
  }, [assignableRoles, createRole])

  useEffect(() => {
    if (!editUserTarget || editUserRole !== 'university_multi_manager' || !isAdmin) return
    const handle = window.setTimeout(() => {
      setUniversityPickerLoading(true)
      getUsers({
        role: 'university',
        search: universityPickerSearch.trim() || undefined,
        page: 1,
        limit: 50,
      })
        .then((res) => {
          setUniversityPickerOptions((prev) => {
            const byId = new Map<string, AdminUser>()
            for (const row of prev) if (editManagerUniversityIds.includes(row.id)) byId.set(row.id, row)
            for (const row of res.data ?? []) byId.set(row.id, row)
            return [...byId.values()]
          })
        })
        .catch(() => setUniversityPickerOptions([]))
        .finally(() => setUniversityPickerLoading(false))
    }, 250)
    return () => window.clearTimeout(handle)
  }, [editUserTarget, editUserRole, editManagerUniversityIds, isAdmin, universityPickerSearch])

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
    setEditManagerUniversityIds([])
    setUniversityPickerSearch('')
    setUniversityPickerOptions([])
    setEditManagerApproved(false)
    if (isAdmin) {
      getAdminUser(user.id)
        .then((raw) => {
          if (String(raw.role ?? '') !== 'university_multi_manager') return
          const ids = (raw.managedUniversityUserIds as unknown[] | undefined) ?? []
          setEditManagerUniversityIds(ids.map((x) => String(x)).filter(Boolean))
          const managed = (raw.managedUniversities as Array<{ userId?: unknown; universityName?: unknown }> | undefined) ?? []
          setUniversityPickerOptions((prev) => {
            const byId = new Map(prev.map((row) => [row.id, row]))
            for (const uni of managed) {
              const id = String(uni.userId ?? '').trim()
              if (!id) continue
              byId.set(id, {
                id,
                email: id,
                role: 'university',
                name: typeof uni.universityName === 'string' ? uni.universityName : undefined,
                createdAt: '',
                status: 'active',
              })
            }
            return [...byId.values()]
          })
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
      payload.managedUniversityUserIds = [...new Set(editManagerUniversityIds)]
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

  const reloadUsers = () => {
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
  }

  const closeImportPreview = () => {
    setImportPreview(null)
    setImportPreviewFile(null)
  }

  const handleExcelSelected = (file: File) => {
    setImportingExcel(true)
    previewUsersExcel(file)
      .then((res) => {
        setImportPreviewFile(file)
        setImportPreview(res)
      })
      .catch(toastApiError)
      .finally(() => setImportingExcel(false))
  }

  const handleConfirmExcelImport = () => {
    if (!importPreviewFile) return
    setConfirmingImport(true)
    uploadUsersExcel(importPreviewFile)
      .then((res) => {
        if (res.created > 0 || res.updated > 0) {
          reloadUsers()
          toast.success(
            t('admin:importSuccessDetailed', '{{created}} created, {{updated}} updated.', {
              created: res.created,
              updated: res.updated,
            })
          )
        }
        if (res.errors.length > 0) {
          toast.error(
            t('admin:importErrors', '{{count}} row(s) failed.', { count: res.errors.length }) +
              ' ' +
              res.errors.slice(0, 3).map((x) => `${x.name}: ${x.message}`).join('; ')
          )
        } else {
          closeImportPreview()
        }
      })
      .catch(toastApiError)
      .finally(() => setConfirmingImport(false))
  }

  return (
    <div className="space-y-4">
      <PageTitle title={t('admin:users')} icon="Users">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => downloadAllUsersExcel().catch(toastApiError)} icon={<Download size={16} />}>
            {t('admin:downloadAllUsersData', 'Download all data')}
          </Button>
          {canManageUsers && (
            <>
              <Button size="sm" variant="secondary" onClick={() => downloadUsersTemplate().catch(toastApiError)} icon={<Download size={16} />}>
                {t('admin:downloadTemplate', 'Download template')}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  e.target.value = ''
                  handleExcelSelected(file)
                }}
              />
              <Button
                size="sm"
                variant="secondary"
                disabled={importingExcel}
                onClick={() => fileInputRef.current?.click()}
                icon={<Upload size={16} />}
              >
                {importingExcel ? t('common:loading', 'Loading...') : t('admin:uploadExcel', 'Upload Excel')}
              </Button>
            </>
          )}
        </div>
      </PageTitle>

      <Card>
        <CardTitle className="mb-2">{t('admin:users')}</CardTitle>
        <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-[minmax(260px,1fr)_180px_180px_auto] md:items-end">
          <Input
            label={t('admin:userSearchLabel', 'Search')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            name="admin-users-search"
            autoComplete="off"
            className="min-h-10 py-2"
            placeholder={t(
              'admin:userSearchPlaceholder',
              'Email, name, or student first/last nameвЂ¦'
            )}
          />
          <Select
            label={t('common:role')}
            options={ROLE_OPTIONS}
            value={roleFilter}
            className="min-h-10 py-2"
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
          />
          <Select
            label={t('admin:statusLabel')}
            options={STATUS_OPTIONS}
            value={statusFilter}
            className="min-h-10 py-2"
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          />
          {canManageUsers && assignableRoleOptions.length > 0 && (
            <Button className="h-10 shrink-0 px-4" onClick={() => setCreateOpen(true)}>
              {t('common:create')}
            </Button>
          )}
        </div>
        {loading ? (
          <TableSkeleton rows={8} cols={8} />
        ) : users.length === 0 ? (
          <EmptyState title={t('admin:noUsersFound')} description={t('admin:tryChangingFilters')} />
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableTh>{t('common:email')}</TableTh>
                  {showNameColumn && <TableTh>{t('common:name')}</TableTh>}
                  {showPhoneColumn && <TableTh>{t('admin:phone', 'Phone')}</TableTh>}
                  <TableTh>{t('common:role')}</TableTh>
                  <TableTh>{t('admin:registered')}</TableTh>
                  {showOneTimePasswordColumn && (
                    <TableTh>{t('admin:oneTimePassword', 'One-time password')}</TableTh>
                  )}
                  <TableTh>{t('admin:statusLabel')}</TableTh>
                  <TableTh>{t('common:actions')}</TableTh>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableTd>{u.email}</TableTd>
                    {showNameColumn && <TableTd>{u.name ?? '--'}</TableTd>}
                    {showPhoneColumn && <TableTd>{u.phone || '-'}</TableTd>}
                    <TableTd>{roleLabels[u.role as keyof typeof roleLabels] ?? u.role}</TableTd>
                    <TableTd>{formatDate(u.createdAt)}</TableTd>
                    {showOneTimePasswordColumn && (
                      <TableTd>
                        {u.temporaryPassword ? (
                        <span className="font-mono text-xs">{u.temporaryPassword}</span>
                        ) : (
                          <span className="text-[var(--color-text-muted)]">-</span>
                        )}
                      </TableTd>
                    )}
                    <TableTd>
                      <span className={u.status === 'active' ? 'text-[#22C55E]' : 'text-red-500'}>
                        {u.status === 'active' ? t('admin:active') : t('admin:suspended')}
                      </span>
                    </TableTd>
                    <TableTd>
                      {!canManageUserRole(u.role) && !canViewStudentProfile(u.role) ? (
                        <span className="text-[var(--color-text-muted)]">--</span>
                      ) : (
                        <div className="flex gap-2 flex-wrap">
                          {canViewStudentProfile(u.role) && (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-8 w-8 p-0"
                              type="button"
                              icon={<Eye />}
                              aria-label={t('admin:viewProfile', 'View profile')}
                              title={t('admin:viewProfile', 'View profile')}
                              disabled={!!actionUserId}
                              onClick={() => navigate(`/admin/users/${u.id}/student-profile`)}
                            />
                          )}
                          {canManageUserRole(u.role) && (
                            <>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-8 w-8 p-0"
                                icon={<UserCog />}
                                aria-label={t('admin:changeRole', 'Change role')}
                                title={t('admin:changeRole', 'Change role')}
                                onClick={() => openEditUser(u)}
                                disabled={!!actionUserId}
                              />
                              {u.status === 'active' ? (
                                <Button
                                  variant="danger"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  icon={<Ban />}
                                  aria-label={t('admin:suspend')}
                                  title={t('admin:suspend')}
                                  onClick={() => handleSuspend(u.id)}
                                  disabled={!!actionUserId}
                                  loading={actionUserId === u.id}
                                />
                              ) : (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  icon={<ShieldCheck />}
                                  aria-label={t('admin:unsuspend')}
                                  title={t('admin:unsuspend')}
                                  onClick={() => handleUnsuspend(u.id)}
                                  disabled={!!actionUserId}
                                  loading={actionUserId === u.id}
                                />
                              )}
                              {isAdmin && u.role === 'university' && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  type="button"
                                  icon={<Eye />}
                                  aria-label={t('admin:editProfile', 'Edit profile')}
                                  title={t('admin:editProfile', 'Edit profile')}
                                  disabled={!!actionUserId}
                                  onClick={() => navigate(`/admin/users/${u.id}/university-profile`)}
                                />
                              )}
                              {canManageUserRole(u.role) && u.role === 'school_counsellor' && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  type="button"
                                  icon={<Eye />}
                                  aria-label={t('admin:editProfile', 'Edit profile')}
                                  title={t('admin:editProfile', 'Edit profile')}
                                  disabled={!!actionUserId}
                                  onClick={() => navigate(`/admin/users/${u.id}/counsellor-profile`)}
                                />
                              )}
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-8 w-8 p-0"
                                icon={<KeyRound />}
                                aria-label={t('admin:resetPassword', 'Reset password')}
                                title={t('admin:resetPassword', 'Reset password')}
                                onClick={() => { setResetTarget(u); setResetPassword('') }}
                                disabled={!!actionUserId}
                              />
                              {u.role !== 'admin' && (
                                <Button
                                  variant="danger"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  icon={<Trash2 />}
                                  aria-label={t('admin:delete')}
                                  title={t('admin:delete')}
                                  onClick={() => setDeleteTarget(u)}
                                  disabled={!!actionUserId}
                                />
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
        open={importPreview !== null}
        onClose={closeImportPreview}
        title={t('admin:importPreviewTitle', 'Confirm Excel import')}
        panelClassName="max-w-5xl"
        contentClassName="space-y-4"
        footer={
          <>
            <Button variant="secondary" onClick={closeImportPreview} disabled={confirmingImport}>
              {t('common:cancel')}
            </Button>
            <Button
              onClick={handleConfirmExcelImport}
              disabled={confirmingImport || !importPreview || importPreview.summary.total === 0 || importPreview.errors.length > 0}
              loading={confirmingImport}
            >
              {t('admin:confirmImport', 'Confirm import')}
            </Button>
          </>
        }
      >
        {importPreview && (
          <>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-lg border border-[var(--color-border)] p-3">
                <p className="text-xs text-[var(--color-text-muted)]">{t('admin:rowsToImport', 'Rows to import')}</p>
                <p className="mt-1 text-xl font-semibold">{importPreview.summary.total}</p>
              </div>
              <div className="rounded-lg border border-[var(--color-border)] p-3">
                <p className="text-xs text-[var(--color-text-muted)]">{t('admin:newUsers', 'New')}</p>
                <p className="mt-1 text-xl font-semibold">{importPreview.summary.creates}</p>
              </div>
              <div className="rounded-lg border border-[var(--color-border)] p-3">
                <p className="text-xs text-[var(--color-text-muted)]">{t('admin:updatedUsers', 'Updates')}</p>
                <p className="mt-1 text-xl font-semibold">{importPreview.summary.updates}</p>
              </div>
              <div className="rounded-lg border border-[var(--color-border)] p-3">
                <p className="text-xs text-[var(--color-text-muted)]">{t('admin:errors', 'Errors')}</p>
                <p className="mt-1 text-xl font-semibold">{importPreview.summary.errors}</p>
              </div>
            </div>

            {importPreview.errors.length > 0 && (
              <Card className="border border-red-200 bg-red-50/60 dark:border-red-900 dark:bg-red-950/20">
                <p className="font-medium text-red-700 dark:text-red-300">
                  {t('admin:fixImportErrorsBeforeConfirm', 'Fix import errors before confirming.')}
                </p>
                <div className="mt-2 space-y-1 text-sm text-red-700 dark:text-red-300">
                  {importPreview.errors.map((error, index) => (
                    <p key={`${error.row}-${index}`}>
                      #{error.row} {error.name ? `${error.name}: ` : ''}{error.message}
                    </p>
                  ))}
                </div>
              </Card>
            )}

            <div className="space-y-3">
              {importPreview.items.map((item, index) => (
                <details
                  key={`${item.sourceId ?? item.email}-${index}`}
                  open={index === 0}
                  className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]"
                >
                  <summary className="cursor-pointer list-none px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold">{item.name || item.email}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {t('admin:excelRowLabel', 'Excel row')} #{item.row}
                          {item.sourceId ? ` вЂў ID: ${item.sourceId}` : ''}
                          {item.existingId ? ` вЂў Existing: ${item.existingId}` : ''}
                        </p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${item.action === 'create' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'}`}>
                        {item.action === 'create' ? t('admin:newUsers', 'New') : t('admin:updatedUsers', 'Updates')}
                      </span>
                    </div>
                  </summary>
                  <div className="border-t border-[var(--color-border)] px-4 py-3 space-y-4">
                    {item.incoming.generatedEmail && (
                      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
                        {t('admin:generatedEmailNotice', 'No email was provided, so a generated email will be used: {{email}}', { email: item.incoming.email })}
                      </p>
                    )}
                    {item.changes.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text)] mb-2">
                          {t('admin:changedFields', 'Changed fields')}
                        </p>
                        <div className="space-y-2">
                          {item.changes.map((change) => (
                            <div key={`${item.row}-${change.field}`} className="rounded-lg border border-[var(--color-border)] p-2 text-sm">
                              <p className="font-medium">{change.field}</p>
                              <p className="text-[var(--color-text-muted)]">
                                {formatPreviewValue(change.before)} {' -> '} {formatPreviewValue(change.after)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 text-sm">
                      <div className="rounded-lg border border-[var(--color-border)] p-3">
                        <p className="font-medium">{t('common:email')}</p>
                        <p className="text-[var(--color-text-muted)]">{formatPreviewValue(item.incoming.email)}</p>
                      </div>
                      <div className="rounded-lg border border-[var(--color-border)] p-3">
                        <p className="font-medium">{t('common:name')}</p>
                        <p className="text-[var(--color-text-muted)]">{formatPreviewValue(item.incoming.name)}</p>
                      </div>
                      <div className="rounded-lg border border-[var(--color-border)] p-3">
                        <p className="font-medium">{t('common:role')}</p>
                        <p className="text-[var(--color-text-muted)]">{formatPreviewValue(item.incoming.role)}</p>
                      </div>
                      <div className="rounded-lg border border-[var(--color-border)] p-3">
                        <p className="font-medium">{t('admin:phone', 'Phone')}</p>
                        <p className="text-[var(--color-text-muted)]">{formatPreviewValue(item.incoming.phone)}</p>
                      </div>
                      <div className="rounded-lg border border-[var(--color-border)] p-3">
                        <p className="font-medium">{t('admin:location', 'Location')}</p>
                        <p className="text-[var(--color-text-muted)]">{[item.incoming.country, item.incoming.city].filter(Boolean).join(', ') || '--'}</p>
                      </div>
                      <div className="rounded-lg border border-[var(--color-border)] p-3">
                        <p className="font-medium">{t('admin:school', 'School')}</p>
                        <p className="text-[var(--color-text-muted)]">{formatPreviewValue(item.incoming.schoolName)}</p>
                      </div>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </>
        )}
      </Modal>

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
                <div className="space-y-3 rounded-card border border-[var(--color-border)] p-3">
                  <Input
                    label={t('admin:managedUniversities', 'Managed universities')}
                    value={universityPickerSearch}
                    onChange={(e) => setUniversityPickerSearch(e.target.value)}
                    placeholder={t('admin:searchUniversities', 'Search university account')}
                  />
                  <div className="max-h-52 space-y-2 overflow-y-auto rounded-input border border-[var(--color-border)] p-2">
                    {universityPickerLoading ? (
                      <p className="text-xs text-[var(--color-text-muted)]">{t('common:loading', 'Loading...')}</p>
                    ) : null}
                    {universityPickerOptions.length === 0 && !universityPickerLoading ? (
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {t('admin:noUniversitiesFound', 'No university accounts found.')}
                      </p>
                    ) : null}
                    {universityPickerOptions.map((uni) => {
                      const checked = editManagerUniversityIds.includes(uni.id)
                      return (
                        <label
                          key={uni.id}
                          className="flex cursor-pointer items-start gap-2 rounded-input px-2 py-1.5 text-sm hover:bg-[var(--color-border)]/50"
                        >
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={checked}
                            onChange={(e) => {
                              setEditManagerUniversityIds((prev) =>
                                e.target.checked ? [...new Set([...prev, uni.id])] : prev.filter((id) => id !== uni.id)
                              )
                            }}
                          />
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{uni.name || uni.email}</span>
                            <span className="block truncate text-xs text-[var(--color-text-muted)]">{uni.email}</span>
                          </span>
                        </label>
                      )
                    })}
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {t('admin:selectedUniversitiesCount', '{{count}} selected', { count: editManagerUniversityIds.length })}
                  </p>
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
              name="admin-reset-user-password"
              autoComplete="new-password"
              autoFocus
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
