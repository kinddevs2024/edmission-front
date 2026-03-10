import { useEffect, useState } from 'react'
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
  generateTempPassword,
  type CounsellorStudent,
  type CreateStudentResult,
} from '@/services/counsellor'
import { toastApiError } from '@/utils/toastError'

export function CounsellorStudents() {
  const { t } = useTranslation(['common', 'admin'])
  const [list, setList] = useState<CounsellorStudent[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editingStudent, setEditingStudent] = useState<CounsellorStudent | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [addEmail, setAddEmail] = useState('')
  const [addName, setAddName] = useState('')
  const [addFirstName, setAddFirstName] = useState('')
  const [addLastName, setAddLastName] = useState('')
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [editFirstName, setEditFirstName] = useState('')
  const [editLastName, setEditLastName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<CounsellorStudent | null>(null)
  const [passwordModal, setPasswordModal] = useState<{ student: CounsellorStudent; password: string } | null>(null)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const limit = 20

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

  const openAdd = () => {
    setAddEmail('')
    setAddName('')
    setAddFirstName('')
    setAddLastName('')
    setTempPassword(null)
    setModal('add')
  }

  const handleAdd = () => {
    if (!addEmail.trim()) return
    setSubmitting(true)
    createStudent({
      email: addEmail.trim(),
      name: addName.trim() || undefined,
      firstName: addFirstName.trim() || undefined,
      lastName: addLastName.trim() || undefined,
    })
      .then((res: CreateStudentResult) => {
        setTempPassword(res.temporaryPassword)
        load()
        setAddEmail('')
        setAddName('')
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

  const handleGetPassword = (s: CounsellorStudent) => {
    if (!s.mustChangePassword) return
    setPasswordLoading(true)
    generateTempPassword(s.userId)
      .then((res) => setPasswordModal({ student: s, password: res.temporaryPassword }))
      .catch(toastApiError)
      .finally(() => setPasswordLoading(false))
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

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="space-y-4">
      <PageTitle title={t('admin:myStudents', 'My students')} icon="Users">
        <Button size="sm" onClick={openAdd}>{t('admin:addStudent', 'Add student')}</Button>
      </PageTitle>

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
                    <th className="text-right py-2 font-medium">{t('common:actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((s) => (
                    <tr key={s.userId} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="py-3">{s.email}</td>
                      <td className="py-3">{s.name || [s.firstName, s.lastName].filter(Boolean).join(' ') || '—'}</td>
                      <td className="py-3 text-right space-x-1">
                        <Link to={`/school/students/${s.userId}/profile`}>
                          <Button size="sm" variant="ghost">{t('admin:editProfile', 'Edit profile')}</Button>
                        </Link>
                        {s.mustChangePassword && (
                          <Button size="sm" variant="ghost" onClick={() => handleGetPassword(s)} disabled={passwordLoading}>
                            {t('admin:getPassword', 'Get password')}
                          </Button>
                        )}
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
        onClose={() => { setModal(null); setTempPassword(null) }}
        title={t('admin:addStudent', 'Add student')}
        footer={
          tempPassword ? (
            <Button onClick={() => { setModal(null); setTempPassword(null) }}>{t('common:close')}</Button>
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
            </div>
          ) : (
            <>
              <Input label={t('common:email')} type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} required />
              <Input label={t('common:name')} value={addName} onChange={(e) => setAddName(e.target.value)} />
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

      {/* Temp password modal */}
      <Modal
        open={!!passwordModal}
        onClose={() => setPasswordModal(null)}
        title={t('admin:tempPasswordTitle', 'Temporary password')}
        footer={<Button onClick={() => setPasswordModal(null)}>{t('common:close')}</Button>}
      >
        {passwordModal && (
          <div className="space-y-3">
            <p className="text-sm text-[var(--color-text-muted)]">
              {t('admin:tempPasswordFor', 'Password for')} {passwordModal.student.email}
            </p>
            <div className="rounded-lg bg-[var(--color-border)] p-4">
              <p className="font-mono text-lg break-all">{passwordModal.password}</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-2">{t('admin:tempPasswordHint', 'Student must change it on first login.')}</p>
            </div>
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
