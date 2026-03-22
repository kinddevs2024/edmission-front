import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { PageTitle } from '@/components/ui/PageTitle'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { Checkbox } from '@/components/ui/Checkbox'
import { getFaculties, getGlobalFaculties, getProfile, createFaculty, updateFaculty, deleteFaculty, updateProfile } from '@/services/university'
import type { Faculty, GlobalFaculty } from '@/types/university'
import { FIELD_OF_STUDY } from '@/constants/fieldOfStudy'
import { toastApiError } from '@/utils/toastError'
import { Pencil, Trash2, Plus, ChevronDown } from 'lucide-react'

type FacultyCatalogCategory = {
  id: string
  items: string[]
  titleKey?: string
  name?: string
}

export function Faculties() {
  const { t } = useTranslation(['common', 'university'])
  const [profileFacultyCodes, setProfileFacultyCodes] = useState<string[]>([])
  const [profileFacultyItems, setProfileFacultyItems] = useState<Record<string, string[]>>({})
  const [list, setList] = useState<Faculty[]>([])
  const [globalCatalog, setGlobalCatalog] = useState<GlobalFaculty[]>([])
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; faculty?: Faculty } | null>(null)
  const [addCategoryModal, setAddCategoryModal] = useState(false)
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null)
  const [addItemInput, setAddItemInput] = useState<Record<string, string>>({})
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [customItems, setCustomItems] = useState<string[]>([''])
  const [submitting, setSubmitting] = useState(false)

  const facultyCatalog = useMemo<FacultyCatalogCategory[]>(
    () => [
      ...FIELD_OF_STUDY.map((cat) => ({ id: cat.id, items: cat.items, titleKey: cat.titleKey })),
      ...globalCatalog
        .filter((cat) => !FIELD_OF_STUDY.some((base) => base.id === cat.code))
        .map((cat) => ({ id: cat.code, items: cat.items ?? [], name: cat.name })),
    ],
    [globalCatalog]
  )

  const getCategoryLabel = (cat: FacultyCatalogCategory) => cat.titleKey ? t(cat.titleKey) : (cat.name ?? cat.id)

  const load = () => {
    setLoading(true)
    Promise.all([getProfile(), getFaculties(), getGlobalFaculties()])
      .then(([profile, faculties, globals]) => {
        setProfileFacultyCodes(profile.facultyCodes ?? [])
        setProfileFacultyItems(profile.facultyItems ?? {})
        setList((faculties ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)))
        setGlobalCatalog(globals ?? [])
      })
      .catch((e) => {
        toastApiError(e)
        setProfileFacultyCodes([])
        setProfileFacultyItems({})
        setList([])
        setGlobalCatalog([])
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
    const cat = facultyCatalog.find((c) => c.id === catId)
    if (!cat) return
    const current = profileFacultyItems[catId] ?? cat.items
    const next = included ? current.filter((x) => x !== item) : [...current, item]
    const nextItems = { ...profileFacultyItems, [catId]: next }
    saveProfileFaculties(profileFacultyCodes, nextItems)
  }

  const handleAddCustomItem = (catId: string) => {
    const val = addItemInput[catId]?.trim()
    if (!val) return
    const cat = facultyCatalog.find((c) => c.id === catId)
    if (!cat) return
    const current = profileFacultyItems[catId] ?? cat.items
    if (current.includes(val)) return
    const next = [...current, val]
    const nextItems = { ...profileFacultyItems, [catId]: next }
    saveProfileFaculties(profileFacultyCodes, nextItems)
    setAddItemInput((prev) => ({ ...prev, [catId]: '' }))
  }

  const handleRemoveItem = (catId: string, item: string) => {
    const cat = facultyCatalog.find((c) => c.id === catId)
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
    setCustomItems([''])
    setModal({ mode: 'create' })
  }

  const openEdit = (f: Faculty) => {
    setName(f.name ?? '')
    setDescription(f.description ?? '')
    setCustomItems((f.items ?? []).length > 0 ? (f.items ?? []) : [''])
    setModal({ mode: 'edit', faculty: f })
  }

  const handleCustomItemChange = (index: number, value: string) => {
    setCustomItems((prev) => prev.map((item, currentIndex) => (currentIndex === index ? value : item)))
  }

  const handleAddCustomProgram = () => {
    setCustomItems((prev) => [...prev, ''])
  }

  const handleRemoveCustomProgram = (index: number) => {
    setCustomItems((prev) => {
      if (prev.length === 1) return ['']
      return prev.filter((_, currentIndex) => currentIndex !== index)
    })
  }

  const handleSubmit = () => {
    if (!modal) return
    setSubmitting(true)
    const items = customItems.map((item) => item.trim()).filter(Boolean)
    const req =
      modal.mode === 'create'
        ? createFaculty({ name: name.trim(), description: description.trim(), items })
        : updateFaculty(modal.faculty!.id, { name: name.trim(), description: description.trim(), items })
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

  const availableToAdd = facultyCatalog.filter((c) => !profileFacultyCodes.includes(c.id))

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
              const cat = facultyCatalog.find((c) => c.id === catId)
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
                      <span className="font-medium truncate">{getCategoryLabel(cat)}</span>
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
                            <Checkbox
                              checked={included}
                              onChange={() => handleToggleItem(catId, it, included)}
                              disabled={savingProfile}
                              label={
                                <span className={included ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}>
                                  {it}
                                </span>
                              }
                              className="flex-1 min-w-0"
                            />
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
                  {(f.items ?? []).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(f.items ?? []).map((item) => (
                        <span
                          key={`${f.id}-${item}`}
                          className="rounded-full bg-[var(--color-bg)] px-2.5 py-1 text-xs text-[var(--color-text-muted)]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
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
                  {getCategoryLabel(cat)}
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
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">
                  {t('university:facultyProgramsLabel', 'Programs / directions')}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {t('university:facultyProgramsHint', 'Add each program separately so you can edit or remove it later.')}
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={handleAddCustomProgram} icon={<Plus size={14} />}>
                {t('university:addProgram', 'Add program')}
              </Button>
            </div>
            <div className="space-y-2">
              {customItems.map((item, index) => (
                <div key={`${modal?.faculty?.id ?? 'new'}-${index}`} className="flex items-start gap-2">
                  <Input
                    value={item}
                    onChange={(e) => handleCustomItemChange(index, e.target.value)}
                    placeholder={t('university:facultyProgramsPlaceholder', 'Program name')}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => handleRemoveCustomProgram(index)}
                    icon={<Trash2 size={14} />}
                  >
                    {t('common:delete')}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
