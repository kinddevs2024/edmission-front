import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { PageTitle } from '@/components/ui/PageTitle'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { getFaculties, getProfile, createFaculty, updateFaculty, deleteFaculty, updateProfile } from '@/services/university'
import type { Faculty } from '@/types/university'
import { FIELD_OF_STUDY } from '@/constants/fieldOfStudy'
import { toastApiError } from '@/utils/toastError'
import { Pencil, Trash2, Plus, ChevronDown } from 'lucide-react'

export function Faculties() {
  const { t } = useTranslation(['common', 'university'])
  const [profileFacultyCodes, setProfileFacultyCodes] = useState<string[]>([])
  const [profileFacultyItems, setProfileFacultyItems] = useState<Record<string, string[]>>({})
  const [list, setList] = useState<Faculty[]>([])
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; faculty?: Faculty } | null>(null)
  const [addCategoryModal, setAddCategoryModal] = useState(false)
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null)
  const [addItemInput, setAddItemInput] = useState<Record<string, string>>({})
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([getProfile(), getFaculties()])
      .then(([profile, faculties]) => {
        setProfileFacultyCodes(profile.facultyCodes ?? [])
        setProfileFacultyItems(profile.facultyItems ?? {})
        setList((faculties ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)))
      })
      .catch((e) => {
        toastApiError(e)
        setProfileFacultyCodes([])
        setProfileFacultyItems({})
        setList([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const saveProfileFaculties = (codes: string[], items: Record<string, string[]>) => {
    setSavingProfile(true)
    updateProfile({ facultyCodes: codes, facultyItems: items })
      .then(() => {
        setProfileFacultyCodes(codes)
        setProfileFacultyItems(items)
      })
      .catch(toastApiError)
      .finally(() => setSavingProfile(false))
  }

  const handleRemoveCategory = (catId: string) => {
    if (!confirm(t('university:removeFacultyConfirm', 'Remove this faculty category?'))) return
    const nextCodes = profileFacultyCodes.filter((c) => c !== catId)
    const { [catId]: _, ...restItems } = profileFacultyItems
    saveProfileFaculties(nextCodes, restItems)
  }

  const handleToggleItem = (catId: string, item: string, included: boolean) => {
    const cat = FIELD_OF_STUDY.find((c) => c.id === catId)
    if (!cat) return
    const current = profileFacultyItems[catId] ?? cat.items
    const next = included ? current.filter((x) => x !== item) : [...current, item]
    const nextItems = { ...profileFacultyItems, [catId]: next }
    saveProfileFaculties(profileFacultyCodes, nextItems)
  }

  const handleAddCustomItem = (catId: string) => {
    const val = addItemInput[catId]?.trim()
    if (!val) return
    const cat = FIELD_OF_STUDY.find((c) => c.id === catId)
    if (!cat) return
    const current = profileFacultyItems[catId] ?? cat.items
    if (current.includes(val)) return
    const next = [...current, val]
    const nextItems = { ...profileFacultyItems, [catId]: next }
    saveProfileFaculties(profileFacultyCodes, nextItems)
    setAddItemInput((prev) => ({ ...prev, [catId]: '' }))
  }

  const handleRemoveItem = (catId: string, item: string) => {
    const cat = FIELD_OF_STUDY.find((c) => c.id === catId)
    if (!cat) return
    const current = profileFacultyItems[catId] ?? cat.items
    const next = current.filter((x) => x !== item)
    const nextItems = { ...profileFacultyItems, [catId]: next }
    saveProfileFaculties(profileFacultyCodes, nextItems)
  }

  const handleAddCategory = (catId: string) => {
    if (profileFacultyCodes.includes(catId)) return
    const nextCodes = [...profileFacultyCodes, catId].slice(0, 50)
    saveProfileFaculties(nextCodes, profileFacultyItems)
    setAddCategoryModal(false)
  }

  const openCreate = () => {
    setName('')
    setDescription('')
    setModal({ mode: 'create' })
  }

  const openEdit = (f: Faculty) => {
    setName(f.name ?? '')
    setDescription(f.description ?? '')
    setModal({ mode: 'edit', faculty: f })
  }

  const handleSubmit = () => {
    if (!modal) return
    setSubmitting(true)
    const req =
      modal.mode === 'create'
        ? createFaculty({ name: name.trim(), description: description.trim() })
        : updateFaculty(modal.faculty!.id, { name: name.trim(), description: description.trim() })
    req
      .then(() => {
        setModal(null)
        load()
      })
      .catch(toastApiError)
      .finally(() => setSubmitting(false))
  }

  const handleDelete = (f: Faculty) => {
    if (!confirm(t('common:confirmDelete', 'Delete?'))) return
    deleteFaculty(f.id)
      .then(() => setList((prev) => prev.filter((x) => x.id !== f.id)))
      .catch(toastApiError)
  }

  const availableToAdd = FIELD_OF_STUDY.filter((c) => !profileFacultyCodes.includes(c.id))

  return (
    <div className="space-y-4">
      <PageTitle title={t('university:facultiesListTitle')} icon="Building2">
        <Button onClick={openCreate} icon={<Plus size={16} />} variant="secondary">
          {t('university:addCustomFaculty', 'Add custom')}
        </Button>
      </PageTitle>

      <Card>
        <CardTitle className="flex items-center justify-between gap-2">
          <span>{t('university:facultiesFromProfile', 'Faculties from catalog')}</span>
          <Button
            size="sm"
            onClick={() => setAddCategoryModal(true)}
            disabled={availableToAdd.length === 0 || savingProfile}
            icon={<Plus size={14} />}
          >
            {t('university:addFaculty', 'Add faculty')}
          </Button>
        </CardTitle>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          {t('university:facultiesFromProfileHint', 'Select faculties and customize which programs you offer. Add or remove items, delete categories.')}
        </p>
        {loading ? (
          <p className="text-[var(--color-text-muted)] py-4">{t('common:loading', 'Loading...')}</p>
        ) : profileFacultyCodes.length === 0 ? (
          <div className="py-6">
            <p className="text-[var(--color-text-muted)] mb-3">
              {t('university:noFacultiesInProfile', 'No faculties selected. Add from the catalog.')}
            </p>
            <Button size="sm" onClick={() => setAddCategoryModal(true)} icon={<Plus size={14} />}>
              {t('university:addFaculty', 'Add faculty')}
            </Button>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--color-border)]">
            {profileFacultyCodes.map((catId) => {
              const cat = FIELD_OF_STUDY.find((c) => c.id === catId)
              if (!cat) return null
              const open = openCategoryId === catId
              const items = profileFacultyItems[catId] ?? cat.items
              return (
                <li key={catId} className="py-3 first:pt-0">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setOpenCategoryId(open ? null : catId)}
                      className="flex items-center gap-2 flex-1 text-left min-w-0"
                    >
                      <ChevronDown
                        size={18}
                        className={`shrink-0 text-[var(--color-text-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
                      />
                      <span className="font-medium truncate">{t(cat.titleKey)}</span>
                      <span className="text-xs text-[var(--color-text-muted)] shrink-0">
                        ({items.length} {t('university:items', 'items')})
                      </span>
                    </button>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveCategory(catId)}
                        disabled={savingProfile}
                        icon={<Trash2 size={14} />}
                      >
                        {t('common:delete')}
                      </Button>
                    </div>
                  </div>
                  {open && (
                    <div className="mt-2 pl-6 space-y-1.5 max-h-64 overflow-y-auto">
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {t('university:customizeItemsHint', 'Check programs you offer. Uncheck to hide. Add custom items below.')}
                      </p>
                      {[...cat.items, ...(items.filter((x) => !cat.items.includes(x)))].map((it) => {
                        const included = items.includes(it)
                        return (
                          <div key={it} className="flex items-center gap-2 group">
                            <label className="flex items-center gap-2 cursor-pointer text-sm py-0.5 flex-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={included}
                                onChange={() => handleToggleItem(catId, it, included)}
                                disabled={savingProfile}
                                className="rounded border-[var(--color-border)]"
                              />
                              <span className={included ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}>
                                {it}
                              </span>
                            </label>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(catId, it)}
                              disabled={savingProfile}
                              className="opacity-0 group-hover:opacity-100 shrink-0 p-1 rounded text-[var(--color-text-muted)] hover:bg-red-500/20 hover:text-red-500"
                              title={t('common:delete')}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )
                      })}
                      <div className="flex gap-2 pt-2 border-t border-[var(--color-border)]">
                        <Input
                          placeholder={t('university:addCustomItem', 'Add custom program...')}
                          className="flex-1 text-sm"
                          value={addItemInput[catId] ?? ''}
                          onChange={(e) => setAddItemInput((prev) => ({ ...prev, [catId]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddCustomItem(catId)
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleAddCustomItem(catId)}
                          disabled={savingProfile || !(addItemInput[catId]?.trim())}
                          icon={<Plus size={14} />}
                        >
                          {t('university:add', 'Add')}
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle>{t('university:additionalFaculties', 'Custom faculties')}</CardTitle>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          {t('university:additionalFacultiesHint', 'Add your own faculty names and descriptions.')}
        </p>
        {loading ? (
          <p className="text-[var(--color-text-muted)] py-6">{t('common:loading', 'Loading...')}</p>
        ) : list.length === 0 ? (
          <EmptyState title={t('university:noFacultiesYet')} />
        ) : (
          <ul className="mt-3 divide-y divide-[var(--color-border)]">
            {list.map((f) => (
              <li key={f.id} className="py-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium truncate">{f.name}</p>
                  {f.description && (
                    <p className="text-sm text-[var(--color-text-muted)] mt-1 line-clamp-2">
                      {f.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openEdit(f)}
                    icon={<Pencil size={16} />}
                  >
                    {t('university:editFaculty')}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(f)}
                    icon={<Trash2 size={16} />}
                  >
                    {t('common:delete')}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {!loading && (
          <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
            <Button size="sm" onClick={openCreate} icon={<Plus size={16} />}>
              {t('university:addCustomFaculty', 'Add custom faculty')}
            </Button>
          </div>
        )}
      </Card>

      <Modal
        open={addCategoryModal}
        onClose={() => setAddCategoryModal(false)}
        title={t('university:addFaculty', 'Add faculty')}
        footer={
          <Button variant="secondary" onClick={() => setAddCategoryModal(false)}>
            {t('common:close', 'Close')}
          </Button>
        }
      >
        <p className="text-sm text-[var(--color-text-muted)] mb-3">
          {t('university:selectFacultyToAdd', 'Select a faculty category to add.')}
        </p>
        {availableToAdd.length === 0 ? (
          <p className="text-[var(--color-text-muted)] py-4">{t('university:allFacultiesAdded', 'All faculties already added.')}</p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {availableToAdd.map((cat) => (
              <li key={cat.id}>
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => handleAddCategory(cat.id)}
                  disabled={savingProfile}
                >
                  {t(cat.titleKey)}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? t('university:editFaculty') : t('university:addFaculty')}
        footer={
          modal ? (
            <>
              <Button variant="secondary" onClick={() => setModal(null)}>
                {t('common:cancel')}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !name.trim()}
                loading={submitting}
              >
                {t('common:save', 'Save')}
              </Button>
            </>
          ) : undefined
        }
      >
        <div className="space-y-3">
          <Input
            label={t('university:facultyName')}
            placeholder={t('university:facultyNamePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label={t('university:facultyDescription')}
            placeholder={t('university:facultyDescriptionPlaceholder')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  )
}
