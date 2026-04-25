import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { PageTitle } from '@/components/ui/PageTitle'
import { Link } from 'react-router-dom'
import {
  listMyStudents,
  createStudent,
  updateMyStudent,
  deleteMyStudent,
  searchStudentsForInvite,
  inviteStudent,
  listMyInvitations,
  cancelInvitation,
  downloadCounsellorStudentsExcel,
  downloadCounsellorStudentsTemplate,
  uploadCounsellorStudentsExcel,
  type CounsellorStudent,
  type CreateStudentResult,
  type CounsellorInvitationItem,
  type CounsellorStudentsImportResult,
} from '@/services/counsellor'
import { toast } from 'sonner'
import { toastApiError } from '@/utils/toastError'
import { Download, Upload } from 'lucide-react'

export function CounsellorStudents() {
  const { t } = useTranslation(['common', 'admin'])
  const [list, setList] = useState<CounsellorStudent[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'edit' | 'invite' | null>(null)
  const [inviteSearch, setInviteSearch] = useState('')
  const [inviteResults, setInviteResults] = useState<Array<{ id: string; email: string; name: string }>>([])
  const [inviteSearching, setInviteSearching] = useState(false)
  const [invitingId, setInvitingId] = useState<string | null>(null)
  const [editingStudent, setEditingStudent] = useState<CounsellorStudent | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [addEmail, setAddEmail] = useState('')
  const [addFirstName, setAddFirstName] = useState('')
  const [addLastName, setAddLastName] = useState('')
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [createdStudentId, setCreatedStudentId] = useState<string | null>(null)
  const [editFirstName, setEditFirstName] = useState('')
  const [editLastName, setEditLastName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<CounsellorStudent | null>(null)
  const [pendingInvitations, setPendingInvitations] = useState<CounsellorInvitationItem[]>([])
  const [cancellingInvitationId, setCancellingInvitationId] = useState<string | null>(null)
  const [importingExcel, setImportingExcel] = useState(false)
  const [importResult, setImportResult] = useState<CounsellorStudentsImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const limit = 20

  const loadPendingInvitations = () => {
    listMyInvitations({ status: 'pending', limit: 50 })
      .then((res) => setPendingInvitations(res.data ?? []))
      .catch(() => setPendingInvitations([]))
  }

  const handleCancelInvitation = (invitationId: string) => {
    setCancellingInvitationId(invitationId)
    cancelInvitation(invitationId)
      .then(() => {
        toast.success(t('admin:invitationCancelled', 'Invitation cancelled.'))
        setPendingInvitations((prev) => prev.filter((i) => i.id !== invitationId))
      })
      .catch(toastApiError)
      .finally(() => setCancellingInvitationId(null))
  }

  const load = () => {
    setLoading(true)
    listMyStudents({ page, limit, search: search.trim() || undefined })
      .then((res) => {
        setList(res.data)
        setTotal(res.total)
      })
      .catch((e) => {
        toastApiError(e)
        setList([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [page, search])

  useEffect(() => {
    loadPendingInvitations()
  }, [])

  const openAdd = () => {
    setAddEmail('')
    setAddFirstName('')
    setAddLastName('')
    setTempPassword(null)
    setModal('add')
  }

  const doInviteSearch = () => {
    const q = inviteSearch.trim()
    if (q.length < 2) { setInviteResults([]); return }
    setInviteSearching(true)
    searchStudentsForInvite({ search: q })
      .then((res) => setInviteResults(res.data ?? []))
      .catch((e) => { toastApiError(e); setInviteResults([]) })
      .finally(() => setInviteSearching(false))
  }

  const handleInvite = (userId: string) => {
    setInvitingId(userId)
    inviteStudent(userId)
      .then((res) => {
        toast.success(res.message || t('admin:invitationSent', 'Invitation sent.'))
        load()
        loadPendingInvitations()
        setInviteResults((prev) => prev.filter((r) => r.id !== userId))
      })
      .catch(toastApiError)
      .finally(() => setInvitingId(null))
  }

  const handleAdd = () => {
    if (!addEmail.trim()) return
    setSubmitting(true)
    createStudent({
      email: addEmail.trim(),
      firstName: addFirstName.trim() || undefined,
      lastName: addLastName.trim() || undefined,
    })
      .then((res: CreateStudentResult) => {
        setTempPassword(res.temporaryPassword)
        setCreatedStudentId(res.user?.id ?? null)
        load()
        setAddEmail('')
        setAddFirstName('')
        setAddLastName('')
      })
      .catch(toastApiError)
      .finally(() => setSubmitting(false))
  }

  const openEdit = (s: CounsellorStudent) => {
    setEditingStudent(s)
    setEditFirstName(s.firstName ?? '')
    setEditLastName(s.lastName ?? '')
    setModal('edit')
  }

  const handleEditSave = () => {
    if (!editingStudent) return
    setSubmitting(true)
    updateMyStudent(editingStudent.userId, { firstName: editFirstName.trim() || undefined, lastName: editLastName.trim() || undefined })
      .then(() => {
        setModal(null)
        setEditingStudent(null)
        load()
      })
      .catch(toastApiError)
      .finally(() => setSubmitting(false))
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    setSubmitting(true)
    deleteMyStudent(deleteTarget.userId)
      .then(() => {
        setDeleteTarget(null)
        load()
      })
      .catch(toastApiError)
      .finally(() => setSubmitting(false))
  }

  const handleExcelSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setImportingExcel(true)
    uploadCounsellorStudentsExcel(file)
      .then((res) => {
        setImportResult(res)
        if (res.created > 0 || res.updated > 0) {
          load()
        }
        toast.success(t('admin:studentsImportFinished', 'Import finished. Created: {{created}}, updated: {{updated}}.', {
          created: res.created,
          updated: res.updated,
        }))
      })
      .catch(toastApiError)
      .finally(() => setImportingExcel(false))
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const showOneTimePasswordColumn = list.some((student) => Boolean(student.temporaryPassword))

  return (
    <div className="space-y-4">
      <PageTitle title={t('admin:myStudents', 'My students')} icon="Users">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => downloadCounsellorStudentsExcel().catch(toastApiError)} icon={<Download size={16} />}>
            {t('admin:downloadAllUsersData', 'Download all data')}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => downloadCounsellorStudentsTemplate().catch(toastApiError)} icon={<Download size={16} />}>
            {t('admin:downloadTemplate', 'Download template')}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={handleExcelSelected}
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            loading={importingExcel}
            disabled={importingExcel}
            icon={<Upload size={16} />}
          >
            {t('admin:uploadExcel', 'Upload Excel')}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => { setModal('invite'); setInviteSearch(''); setInviteResults([]) }}>
            {t('admin:inviteStudent', 'Invite student')}
          </Button>
          <Button size="sm" onClick={openAdd}>{t('admin:addStudent', 'Add student')}</Button>
        </div>
      </PageTitle>

      {pendingInvitations.length > 0 && (
        <Card>
          <CardTitle>{t('admin:pendingInvitations', 'Pending invitations')}</CardTitle>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {t('admin:pendingInvitationsHint', 'Students you invited. You cannot edit their data until they accept.')}
          </p>
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left py-2 font-medium">Email</th>
                  <th className="text-left py-2 font-medium">{t('common:name')}</th>
                  <th className="text-left py-2 font-medium">{t('admin:statusLabel')}</th>
                  <th className="text-right py-2 font-medium">{t('common:actions')}</th>
                </tr>
              </thead>
              <tbody>
                {pendingInvitations.map((inv) => (
                  <tr key={inv.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="py-3">{inv.studentEmail}</td>
                    <td className="py-3">{inv.studentName || '—'}</td>
                    <td className="py-3 text-[var(--color-text-muted)]">{t('admin:awaitingResponse', 'Awaiting response')}</td>
                    <td className="py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500"
                        onClick={() => handleCancelInvitation(inv.id)}
                        disabled={cancellingInvitationId === inv.id}
                        loading={cancellingInvitationId === inv.id}
                      >
                        {t('admin:cancelInvitation', 'Cancel invitation')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Input placeholder={t('common:search', 'Search')} value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        </div>
        <CardTitle>{t('admin:studentsList', 'Students')}</CardTitle>
        {loading ? (
          <p className="text-[var(--color-text-muted)] py-6">{t('common:loading', 'Loading...')}</p>
        ) : list.length === 0 ? (
          <p className="text-[var(--color-text-muted)] py-8 text-center">{t('admin:noStudents', 'No students yet.')}</p>
        ) : (
          <>
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="text-left py-2 font-medium">Email</th>
                    <th className="text-left py-2 font-medium">{t('common:name')}</th>
                    {showOneTimePasswordColumn && (
                      <th className="text-left py-2 font-medium">{t('admin:oneTimePassword', 'One-time password')}</th>
                    )}
                    <th className="text-right py-2 font-medium">{t('common:actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((s) => (
                    <tr key={s.userId} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="py-3">{s.email}</td>
                      <td className="py-3">{s.name || [s.firstName, s.lastName].filter(Boolean).join(' ') || '—'}</td>
                      {showOneTimePasswordColumn && (
                        <td className="py-3">
                          {s.temporaryPassword ? (
                            <span className="font-mono text-xs">{s.temporaryPassword}</span>
                          ) : (
                            <span className="text-[var(--color-text-muted)]">-</span>
                          )}
                        </td>
                      )}
                      <td className="py-3 text-right space-x-1">
                        <Link to={`/school/students/${s.userId}/profile`}>
                          <Button size="sm" variant="ghost">{t('admin:editProfile', 'Edit profile')}</Button>
                        </Link>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>{t('common:edit')}</Button>
                        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => setDeleteTarget(s)}>{t('common:delete')}</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{t('common:prev')}</Button>
                <span className="flex items-center px-2 text-[var(--color-text-muted)]">{page} / {totalPages}</span>
                <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>{t('common:next')}</Button>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Add student modal */}
      <Modal
        open={modal === 'add'}
        onClose={() => { setModal(null); setTempPassword(null); setCreatedStudentId(null) }}
        title={t('admin:addStudent', 'Add student')}
        footer={
          tempPassword ? (
            <>
              {createdStudentId && (
                <Link to={`/school/students/${createdStudentId}/profile`}>
                  <Button variant="secondary">{t('admin:editFullProfile', 'Edit full profile')}</Button>
                </Link>
              )}
              <Button onClick={() => { setModal(null); setTempPassword(null); setCreatedStudentId(null) }}>{t('common:close')}</Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setModal(null)}>{t('common:cancel')}</Button>
              <Button onClick={handleAdd} disabled={submitting || !addEmail.trim()} loading={submitting}>{t('common:create')}</Button>
            </>
          )
        }
      >
        <div className="space-y-3">
          {tempPassword ? (
            <div className="rounded-lg bg-[var(--color-border)] p-4">
              <p className="text-sm font-medium text-[var(--color-text)] mb-2">{t('admin:tempPasswordTitle', 'Temporary password (show to student once)')}</p>
              <p className="font-mono text-lg break-all">{tempPassword}</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-2">{t('admin:tempPasswordHint', 'Student must change it on first login.')}</p>
              <p className="text-sm text-[var(--color-text-muted)] mt-3">{t('admin:editFullProfileHint', 'You can fill in all student data (profile, documents) on the profile page.')}</p>
            </div>
          ) : (
            <>
              <Input label={t('common:email')} type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} required />
              <Input label={t('admin:firstName', 'First name')} value={addFirstName} onChange={(e) => setAddFirstName(e.target.value)} />
              <Input label={t('admin:lastName', 'Last name')} value={addLastName} onChange={(e) => setAddLastName(e.target.value)} />
            </>
          )}
        </div>
      </Modal>

      {/* Edit student modal */}
      <Modal
        open={modal === 'edit'}
        onClose={() => { setModal(null); setEditingStudent(null) }}
        title={t('common:edit')}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setModal(null); setEditingStudent(null) }}>{t('common:cancel')}</Button>
            <Button onClick={handleEditSave} disabled={submitting} loading={submitting}>{t('common:save')}</Button>
          </>
        }
      >
        {editingStudent && (
          <div className="space-y-3">
            <p className="text-sm text-[var(--color-text-muted)]">{editingStudent.email}</p>
            <Input label={t('admin:firstName', 'First name')} value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} />
            <Input label={t('admin:lastName', 'Last name')} value={editLastName} onChange={(e) => setEditLastName(e.target.value)} />
          </div>
        )}
      </Modal>

      {/* Invite existing student modal */}
      <Modal
        open={modal === 'invite'}
        onClose={() => { setModal(null); setInviteSearch(''); setInviteResults([]) }}
        title={t('admin:inviteStudent', 'Invite student')}
        footer={<Button onClick={() => setModal(null)}>{t('common:close')}</Button>}
      >
        <div className="space-y-3">
          <p className="text-sm text-[var(--color-text-muted)]">{t('admin:inviteStudentHint', 'Search for a student by email or name (already registered on the platform) and invite them to your school.')}</p>
          <div className="flex gap-2">
            <Input
              placeholder={t('common:search', 'Search') + ' (email, name)'}
              value={inviteSearch}
              onChange={(e) => setInviteSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doInviteSearch()}
              className="flex-1"
            />
            <Button size="sm" onClick={doInviteSearch} disabled={inviteSearching || inviteSearch.trim().length < 2} loading={inviteSearching}>{t('common:search')}</Button>
          </div>
          {inviteResults.length > 0 && (
            <ul className="border border-[var(--color-border)] rounded-lg divide-y divide-[var(--color-border)] max-h-60 overflow-y-auto">
              {inviteResults.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 px-3 py-2">
                  <div>
                    <span className="font-medium">{r.email}</span>
                    {r.name && <span className="text-[var(--color-text-muted)] ml-2">({r.name})</span>}
                  </div>
                  <Button size="sm" onClick={() => handleInvite(r.id)} disabled={!!invitingId} loading={invitingId === r.id}>{t('admin:invite', 'Invite')}</Button>
                </li>
              ))}
            </ul>
          )}
          {inviteSearch.trim().length >= 2 && !inviteSearching && inviteResults.length === 0 && (
            <p className="text-sm text-[var(--color-text-muted)]">{t('admin:noStudentsToInvite', 'No students found or they are already in your school.')}</p>
          )}
        </div>
      </Modal>

      {/* Excel import result */}
      <Modal
        open={!!importResult}
        onClose={() => setImportResult(null)}
        title={t('admin:excelImportResult', 'Excel import result')}
        footer={<Button onClick={() => setImportResult(null)}>{t('common:close')}</Button>}
      >
        {importResult && (
          <div className="space-y-3 text-sm">
            <p>
              {t('admin:studentsImportFinished', 'Import finished. Created: {{created}}, updated: {{updated}}.', {
                created: importResult.created,
                updated: importResult.updated,
              })}
            </p>
            {importResult.errors.length > 0 && (
              <div>
                <p className="font-medium text-red-500 mb-2">
                  {t('admin:importErrors', 'Errors')}: {importResult.errors.length}
                </p>
                <ul className="max-h-64 overflow-y-auto space-y-1 text-[var(--color-text-muted)]">
                  {importResult.errors.slice(0, 20).map((error, index) => (
                    <li key={`${error.row}-${index}`}>
                      {t('admin:row', 'Row')} {error.row}: {error.name ? `${error.name} - ` : ''}{error.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t('common:delete')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>{t('common:cancel')}</Button>
            <Button variant="danger" onClick={handleDelete} disabled={submitting} loading={submitting}>{t('common:delete')}</Button>
          </>
        }
      >
        {deleteTarget && (
          <p className="text-[var(--color-text)]">
            {t('admin:deleteStudentConfirm', 'Delete this student?')} {deleteTarget.email}
          </p>
        )}
      </Modal>
    </div>
  )
}
