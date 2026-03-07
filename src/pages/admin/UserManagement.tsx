import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd, Pagination } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageTitle } from '@/components/ui/PageTitle'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { createUser, getUsers, suspendUser, unsuspendUser, deleteUser, getUniversityProfileByUser, updateUniversityProfileByUser } from '@/services/admin'
import { formatDate } from '@/utils/format'
import type { AdminUser } from '@/services/admin'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { ChipSelect } from '@/components/ui/ChipSelect'
import { FIELD_OF_STUDY } from '@/constants/fieldOfStudy'
import { toastApiError } from '@/utils/toastError'

const COUNTRY_CODE_OPTIONS = [
  { code: 'UZ', label: 'Uzbekistan' },
  { code: 'KZ', label: 'Kazakhstan' },
  { code: 'TJ', label: 'Tajikistan' },
  { code: 'KG', label: 'Kyrgyzstan' },
  { code: 'TM', label: 'Turkmenistan' },
  { code: 'TR', label: 'Turkey' },
  { code: 'AE', label: 'UAE' },
  { code: 'CN', label: 'China' },
] as const

const COUNTRY_OPTIONS = [
  { value: '', label: 'Select country' },
  ...COUNTRY_CODE_OPTIONS.map((c) => ({ value: c.label, label: c.label })),
]

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
  const [editUniTarget, setEditUniTarget] = useState<AdminUser | null>(null)
  const [editUniLoading, setEditUniLoading] = useState(false)
  const [editUniSaving, setEditUniSaving] = useState(false)
  const [editUniError, setEditUniError] = useState('')
  const [uniName, setUniName] = useState('')
  const [uniTagline, setUniTagline] = useState('')
  const [uniEstablishedYear, setUniEstablishedYear] = useState('')
  const [uniStudentCount, setUniStudentCount] = useState('')
  const [uniCountry, setUniCountry] = useState('')
  const [uniCity, setUniCity] = useState('')
  const [uniDescription, setUniDescription] = useState('')
  const [uniLogoUrl, setUniLogoUrl] = useState('')
  const [uniFacultyCodes, setUniFacultyCodes] = useState<string[]>([])
  const [uniFacultyItems, setUniFacultyItems] = useState<Record<string, string[]>>({})
  const [uniOpenFacultyId, setUniOpenFacultyId] = useState<string | null>(null)
  const [uniTargetCountries, setUniTargetCountries] = useState<string[]>([])
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
      .catch((e) => {
        toastApiError(e)
        setUsers([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [page, roleFilter, statusFilter])

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

  const openUniversityEditor = (user: AdminUser) => {
    setEditUniTarget(user)
    setEditUniError('')
    setEditUniLoading(true)
    getUniversityProfileByUser(user.id)
      .then((p) => {
        setUniName(p.universityName ?? '')
        setUniTagline(p.tagline ?? '')
        setUniEstablishedYear(p.establishedYear != null ? String(p.establishedYear) : '')
        setUniStudentCount(p.studentCount != null ? String(p.studentCount) : '')
        setUniCountry(p.country ?? '')
        setUniCity(p.city ?? '')
        setUniDescription(p.description ?? '')
        setUniLogoUrl(p.logoUrl ?? '')
        setUniFacultyCodes(p.facultyCodes ?? [])
        setUniFacultyItems((p as { facultyItems?: Record<string, string[]> }).facultyItems ?? {})
        setUniTargetCountries(p.targetStudentCountries ?? [])
      })
      .catch((e) => {
        toastApiError(e)
        setEditUniError(t('common:error', 'Error'))
      })
      .finally(() => setEditUniLoading(false))
  }

  const closeUniversityEditor = () => {
    if (editUniSaving) return
    setEditUniTarget(null)
    setEditUniError('')
    setUniName('')
    setUniTagline('')
    setUniEstablishedYear('')
    setUniStudentCount('')
    setUniCountry('')
    setUniCity('')
    setUniDescription('')
    setUniLogoUrl('')
    setUniFacultyCodes([])
    setUniFacultyItems({})
    setUniOpenFacultyId(null)
    setUniTargetCountries([])
  }

  const handleUniversitySave = () => {
    if (!editUniTarget || !uniName.trim()) return
    setEditUniSaving(true)
    setEditUniError('')
    updateUniversityProfileByUser(editUniTarget.id, {
      universityName: uniName.trim(),
      tagline: uniTagline.trim() || undefined,
      establishedYear: uniEstablishedYear.trim() ? Number(uniEstablishedYear) : undefined,
      studentCount: uniStudentCount.trim() ? Number(uniStudentCount) : undefined,
      country: uniCountry || undefined,
      city: uniCity.trim() || undefined,
      description: uniDescription.trim() || undefined,
      logoUrl: uniLogoUrl.trim() || undefined,
      facultyCodes: uniFacultyCodes,
      facultyItems: Object.keys(uniFacultyItems).length ? uniFacultyItems : undefined,
      targetStudentCountries: uniTargetCountries,
    })
      .then(() => {
        closeUniversityEditor()
      })
      .catch((e) => { toastApiError(e); setEditUniError(t('common:error', 'Error')) })
      .finally(() => setEditUniSaving(false))
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
                        {u.role === 'university' && (
                          <Button variant="secondary" size="sm" onClick={() => openUniversityEditor(u)} disabled={!!actionUserId}>
                            {t('admin:editUniversityProfile', 'Edit profile')}
                          </Button>
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
                  .catch(toastApiError)
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
        open={!!editUniTarget}
        onClose={closeUniversityEditor}
        title={t('admin:editUniversityProfile', 'Edit university profile')}
        footer={
          <>
            <Button variant="secondary" onClick={closeUniversityEditor} disabled={editUniSaving}>{t('common:cancel')}</Button>
            <Button onClick={handleUniversitySave} disabled={editUniSaving || !uniName.trim()} loading={editUniSaving}>
              {t('common:save')}
            </Button>
          </>
        }
      >
        {editUniLoading ? (
          <p className="text-[var(--color-text-muted)]">{t('common:loading', 'Loading...')}</p>
        ) : (
          <div className="space-y-3">
            {editUniError && <p className="text-sm text-red-500">{editUniError}</p>}
            <Input label={t('university:universityName', 'University name')} value={uniName} onChange={(e) => setUniName(e.target.value)} />
            <Input label={t('university:slogan', 'Slogan')} value={uniTagline} onChange={(e) => setUniTagline(e.target.value)} />
            <Input label={t('university:foundedYear', 'Founded year')} type="number" value={uniEstablishedYear} onChange={(e) => setUniEstablishedYear(e.target.value)} />
            <Input label={t('university:studentCount', 'Student count')} type="number" value={uniStudentCount} onChange={(e) => setUniStudentCount(e.target.value)} />
            <Select
              label={t('university:country', 'Country')}
              options={COUNTRY_OPTIONS}
              value={uniCountry}
              onChange={(e) => setUniCountry(e.target.value)}
            />
            <Input label={t('university:city', 'City')} value={uniCity} onChange={(e) => setUniCity(e.target.value)} />
            <Input label={t('university:logoUrl', 'Logo URL')} value={uniLogoUrl} onChange={(e) => setUniLogoUrl(e.target.value)} />
            <label className="block">
              <span className="block text-sm font-medium mb-1">{t('university:description', 'Description')}</span>
              <textarea
                rows={4}
                value={uniDescription}
                onChange={(e) => setUniDescription(e.target.value)}
                className="w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
              />
            </label>
            <div>
              <p className="mb-2 text-sm font-medium text-[var(--color-text)]">
                {t('university:facultiesListTitle', 'Faculties')}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mb-2">{t('university:facultiesHint', 'Select faculties. Expand to customize items.')}</p>
              <div className="grid gap-2 sm:grid-cols-2 max-h-48 overflow-y-auto">
                {FIELD_OF_STUDY.map((cat) => {
                  const selected = uniFacultyCodes.includes(cat.id)
                  const open = uniOpenFacultyId === cat.id
                  const items = uniFacultyItems[cat.id] ?? cat.items
                  return (
                    <div
                      key={cat.id}
                      className={`rounded-lg border-2 p-2 transition-all ${selected ? 'border-primary-accent' : 'border-[var(--color-border)]'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...uniFacultyCodes, cat.id].slice(0, 50)
                                : uniFacultyCodes.filter((x) => x !== cat.id)
                              setUniFacultyCodes(next)
                              if (!e.target.checked) {
                                const { [cat.id]: _, ...rest } = uniFacultyItems
                                setUniFacultyItems(rest)
                              }
                            }}
                            className="rounded border-[var(--color-border)]"
                          />
                          <span className="text-sm truncate">{t(cat.titleKey)}</span>
                        </label>
                        {selected && (
                          <button
                            type="button"
                            onClick={() => setUniOpenFacultyId(open ? null : cat.id)}
                            className="p-1 rounded text-[var(--color-text-muted)] hover:bg-[var(--color-border)]"
                            aria-expanded={open}
                          >
                            <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                      </div>
                      {open && selected && (
                        <div className="mt-2 pt-2 border-t border-[var(--color-border)] space-y-1 max-h-32 overflow-y-auto">
                          {cat.items.map((it) => {
                            const inc = items.includes(it)
                            return (
                              <label key={it} className="flex items-center gap-2 cursor-pointer text-xs">
                                <input
                                  type="checkbox"
                                  checked={inc}
                                  onChange={() => {
                                    const list = uniFacultyItems[cat.id] ?? cat.items
                                    const next = inc ? list.filter((x) => x !== it) : [...list, it]
                                    setUniFacultyItems({ ...uniFacultyItems, [cat.id]: next })
                                  }}
                                  className="rounded border-[var(--color-border)]"
                                />
                                <span className={inc ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}>{it}</span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-[var(--color-text)]">
                {t('university:targetStudentCountries', 'Preferred student countries')}
              </p>
              <ChipSelect
                options={COUNTRY_CODE_OPTIONS.map((c) => c.label)}
                value={uniTargetCountries.map((code) => COUNTRY_CODE_OPTIONS.find((c) => c.code === code)?.label ?? code)}
                onChange={(labels) => {
                  const codes = labels
                    .map((label) => COUNTRY_CODE_OPTIONS.find((c) => c.label === label)?.code)
                    .filter((v): v is NonNullable<typeof v> => Boolean(v))
                    .map((v) => String(v))
                  setUniTargetCountries(codes)
                }}
                max={10}
                placeholder={t('university:targetStudentCountriesPlaceholder', 'Select countries')}
              />
            </div>
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
