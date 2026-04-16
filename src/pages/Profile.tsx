import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getProfile as getUniversityProfile, updateProfile as updateUniversityProfile } from '@/services/university'
import { useAuth } from '@/hooks/useAuth'
import { getProfile, updateProfile, getApiError, logout as logoutApi, changePassword } from '@/services/auth'
import { useAuthStore } from '@/store/authStore'
import { setup2FA, verifyAndEnable2FA, disable2FA } from '@/services/twoFactor'
import { PageTitle } from '@/components/ui/PageTitle'
import { Card, CardTitle } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LanguageMenu } from '@/components/layout/LanguageMenu'
import { ThemeSwitch } from '@/components/ui/ThemeSwitch'
import { toastApiError } from '@/utils/toastError'
import { getFormSubmitErrorMessage } from '@/utils/apiErrorI18n'
import { newPasswordValueSchema } from '@/utils/authPasswordZod'
import { notifySuccess } from '@/utils/notify'
import type { NotificationPreferences } from '@/types/user'
import { FileUpload } from '@/components/ui/FileUpload'
import { Checkbox } from '@/components/ui/Checkbox'
import { Lock } from 'lucide-react'
import { getStudentProfile, updateStudentProfile } from '@/services/student'

type ChangePasswordForm = { currentPassword: string; newPassword: string; confirmPassword: string }

export function Profile() {
  const { t } = useTranslation(['common', 'university', 'auth', 'errors', 'student'])
  const { user } = useAuth()
  const [avatarUrl, setAvatarUrl] = useState<string>(user?.avatar ?? '')
  const [universityLogoUrl, setUniversityLogoUrl] = useState('')
  useEffect(() => {
    if (user?.avatar !== undefined) setAvatarUrl(user.avatar ?? '')
  }, [user?.avatar])

  useEffect(() => {
    if (user?.role !== 'university') {
      setUniversityLogoUrl('')
      return
    }
    const fromSession = (user?.avatar ?? '').trim()
    if (fromSession) {
      setUniversityLogoUrl(fromSession)
      return
    }
    getUniversityProfile()
      .then((p) => setUniversityLogoUrl((p.logo ?? p.logoUrl ?? '').trim()))
      .catch(() => setUniversityLogoUrl(''))
  }, [user?.role, user?.avatar])

  const prefs = user?.notificationPreferences ?? { emailApplicationUpdates: true, emailTrialReminder: true }

  const handlePrefChange = (key: keyof NotificationPreferences, value: boolean) => {
    const next = { ...prefs, [key]: value }
    updateProfile({ notificationPreferences: next })
      .then(() => getProfile())
      .catch(toastApiError)
  }

  const [browserNotifStatus, setBrowserNotifStatus] = useState<'default' | 'granted' | 'denied'>(() =>
    typeof window !== 'undefined' && 'Notification' in window ? (Notification.permission as 'default' | 'granted' | 'denied') : 'denied'
  )
  const [twoFaStep, setTwoFaStep] = useState<'idle' | 'setup' | 'verify' | 'disable'>('idle')
  const [twoFaSecret, setTwoFaSecret] = useState<{ secret: string; qrUrl: string } | null>(null)
  const [twoFaCode, setTwoFaCode] = useState('')
  const [twoFaError, setTwoFaError] = useState('')
  const [twoFaLoading, setTwoFaLoading] = useState(false)
  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [telegram, setTelegram] = useState(user?.socialLinks?.telegram ?? '')
  const [instagram, setInstagram] = useState(user?.socialLinks?.instagram ?? '')
  const [linkedin, setLinkedin] = useState(user?.socialLinks?.linkedin ?? '')
  const [facebook, setFacebook] = useState(user?.socialLinks?.facebook ?? '')
  const [whatsapp, setWhatsapp] = useState(user?.socialLinks?.whatsapp ?? '')
  const [accountSaving, setAccountSaving] = useState(false)
  const [studentProfileVisibility, setStudentProfileVisibility] = useState<'private' | 'public' | null>(null)

  useEffect(() => {
    if (user?.role !== 'student') {
      setStudentProfileVisibility(null)
      return
    }
    getStudentProfile()
      .then((p) => setStudentProfileVisibility(p.profileVisibility === 'public' ? 'public' : 'private'))
      .catch(() => setStudentProfileVisibility('private'))
  }, [user?.role])

  useEffect(() => {
    setName(user?.name ?? '')
    setPhone(user?.phone ?? '')
    setTelegram(user?.socialLinks?.telegram ?? '')
    setInstagram(user?.socialLinks?.instagram ?? '')
    setLinkedin(user?.socialLinks?.linkedin ?? '')
    setFacebook(user?.socialLinks?.facebook ?? '')
    setWhatsapp(user?.socialLinks?.whatsapp ?? '')
  }, [user?.name, user?.phone, user?.socialLinks?.telegram, user?.socialLinks?.instagram, user?.socialLinks?.linkedin, user?.socialLinks?.facebook, user?.socialLinks?.whatsapp])

  const handleSetup2FA = () => {
    setTwoFaError('')
    setTwoFaLoading(true)
    setup2FA()
      .then((r) => { setTwoFaSecret(r); setTwoFaStep('setup') })
      .catch((e) => setTwoFaError(getApiError(e).message))
      .finally(() => setTwoFaLoading(false))
  }

  const handleVerify2FA = () => {
    if (!twoFaCode.trim()) return
    setTwoFaError('')
    setTwoFaLoading(true)
    verifyAndEnable2FA(twoFaCode.trim())
      .then(() => { setTwoFaStep('idle'); setTwoFaSecret(null); setTwoFaCode(''); getProfile() })
      .catch((e) => setTwoFaError(getApiError(e).message))
      .finally(() => setTwoFaLoading(false))
  }

  const handleDisable2FA = () => {
    if (!twoFaCode.trim()) return
    setTwoFaError('')
    setTwoFaLoading(true)
    disable2FA(twoFaCode.trim())
      .then(() => { setTwoFaStep('idle'); setTwoFaCode(''); getProfile() })
      .catch((e) => setTwoFaError(getApiError(e).message))
      .finally(() => setTwoFaLoading(false))
  }

  const totpEnabled = !!user?.totpEnabled

  const handleAvatarChange = (url: string) => {
    if (user?.role !== 'student') return
    setAvatarUrl(url)
    updateStudentProfile({ avatarUrl: url })
      .then(async () => {
        const u = await getProfile()
        useAuthStore.getState().setUser({ ...u, avatar: url || u.avatar })
      })
      .catch(toastApiError)
  }

  const handleUniversityLogoChange = (url: string) => {
    if (user?.role !== 'university') return
    setUniversityLogoUrl(url)
    updateUniversityProfile({ logo: url })
      .then(() => getProfile())
      .catch(toastApiError)
  }

  const handleAccountSave = () => {
    setAccountSaving(true)
    updateProfile({
      name,
      phone,
      socialLinks: { telegram, instagram, linkedin, facebook, whatsapp },
    })
      .then(() => getProfile())
      .catch(toastApiError)
      .finally(() => setAccountSaving(false))
  }

  const accountDirty =
    (name ?? '') !== (user?.name ?? '') ||
    (phone ?? '') !== (user?.phone ?? '') ||
    (telegram ?? '') !== (user?.socialLinks?.telegram ?? '') ||
    (instagram ?? '') !== (user?.socialLinks?.instagram ?? '') ||
    (linkedin ?? '') !== (user?.socialLinks?.linkedin ?? '') ||
    (facebook ?? '') !== (user?.socialLinks?.facebook ?? '') ||
    (whatsapp ?? '') !== (user?.socialLinks?.whatsapp ?? '')

  const canChangePassword = user?.localPasswordConfigured !== false
  const changePasswordSchema = useMemo(
    () =>
      z
        .object({
          currentPassword: z.string().min(1, t('auth:currentPasswordRequired')),
          newPassword: newPasswordValueSchema({
            min: t('auth:passwordMinLength'),
            uppercase: t('auth:passwordUppercase'),
            lowercase: t('auth:passwordLowercase'),
            number: t('auth:passwordNumber'),
          }),
          confirmPassword: z.string(),
        })
        .refine((d) => d.newPassword === d.confirmPassword, {
          message: t('auth:passwordsMustMatch'),
          path: ['confirmPassword'],
        }),
    [t]
  )
  const {
    register: registerPw,
    handleSubmit: handleSubmitPw,
    reset: resetPw,
    formState: { errors: pwErrors },
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })
  const [pwSubmitError, setPwSubmitError] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [showPwFields, setShowPwFields] = useState(false)
  const [pwModalOpen, setPwModalOpen] = useState(false)

  useEffect(() => {
    if (!pwModalOpen) {
      resetPw()
      setPwSubmitError('')
    }
  }, [pwModalOpen, resetPw])

  const onChangePasswordSubmit = async (data: ChangePasswordForm) => {
    setPwSubmitError('')
    setPwLoading(true)
    try {
      await changePassword(data.currentPassword, data.newPassword)
      resetPw()
      await getProfile()
      notifySuccess(t('auth:passwordChangedSuccess'))
      setPwModalOpen(false)
    } catch (err) {
      setPwSubmitError(getFormSubmitErrorMessage(err, t))
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <div className="w-full space-y-4 pb-page-bottom-cta">
      <PageTitle title={t('profile')} icon="Settings" />
      <Card>
        <CardTitle>{t('profile')}</CardTitle>
        {user?.role === 'student' && (
          <div className="mt-4">
            <FileUpload
              label={t('common:avatar')}
              variant="avatar"
              value={avatarUrl || user?.avatar}
              onChange={handleAvatarChange}
              hint={t('common:uploadPhotoOrLink')}
            />
          </div>
        )}
        {user?.role === 'university' && (
          <div className="mt-4">
            <FileUpload
              label={t('university:logo', 'University logo')}
              variant="avatar"
              value={universityLogoUrl || user?.avatar}
              onChange={handleUniversityLogoChange}
              accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
              hint={t('university:uploadLogoOrUrl', 'Upload a logo or set the full URL on the university profile page')}
            />
          </div>
        )}
        <dl className="grid grid-cols-1 gap-2 mt-4">
          <dt className="text-[var(--color-text-muted)]">{t('email')}</dt>
          <dd>{user?.email}</dd>
          <dt className="text-[var(--color-text-muted)]">{t('name')}</dt>
          <dd>{user?.name ?? '—'}</dd>
        </dl>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Input label={t('name')} value={name} onChange={(e) => setName(e.target.value)} />
          <Input label={t('phone', 'Phone')} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" />
          <Input label="Telegram" value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="@username" />
          <Input label="Instagram" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="instagram.com/username" />
          <Input label="LinkedIn" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="linkedin.com/in/username" />
          <Input label="Facebook" value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="facebook.com/username" />
          <Input label="WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+998 90 123 45 67" />
        </div>
        <div className="mt-4 flex w-full min-w-0 items-center justify-between gap-3">
          {canChangePassword ? (
            <Button type="button" variant="secondary" onClick={() => setPwModalOpen(true)}>
              {t('auth:changePassword')}
            </Button>
          ) : (
            <Button variant="secondary" to="/set-password">
              {t('auth:goToSetPassword')}
            </Button>
          )}
          <Button onClick={handleAccountSave} disabled={!accountDirty || accountSaving} loading={accountSaving}>
            {t('save', 'Save')}
          </Button>
        </div>
      </Card>

      {user?.role === 'student' && studentProfileVisibility != null && (
        <Card>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[var(--color-text-muted)] shrink-0" aria-hidden />
            {t('student:stepPrivacy', 'Profile privacy')}
          </CardTitle>
          <p className="text-sm font-medium text-[var(--color-text)] mt-3">{t('student:profileVisibilityTitle')}</p>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mt-1">{t('student:profileVisibilityHint')}</p>
          <div className="mt-4 space-y-3">
            <label className="flex gap-3 items-start cursor-pointer rounded-card border border-[var(--color-border)] p-3 has-[:checked]:border-primary-accent/50 has-[:checked]:bg-primary-accent/5">
              <input
                type="radio"
                name="account-student-visibility"
                value="private"
                className="mt-1"
                checked={studentProfileVisibility === 'private'}
                onChange={() => {
                  if (studentProfileVisibility === 'private') return
                  setStudentProfileVisibility('private')
                  updateStudentProfile({ profileVisibility: 'private' })
                    .then(() => {
                      getProfile().catch(toastApiError)
                      notifySuccess(t('common:saved', 'Saved'))
                    })
                    .catch((e) => {
                      getStudentProfile()
                        .then((p) => setStudentProfileVisibility(p.profileVisibility === 'public' ? 'public' : 'private'))
                        .catch(() => {})
                      toastApiError(e)
                    })
                }}
              />
              <span>
                <span className="font-medium text-[var(--color-text)] block">{t('student:profileVisibilityPrivate')}</span>
                <span className="text-sm text-[var(--color-text-muted)]">{t('student:profileVisibilityPrivateLong')}</span>
              </span>
            </label>
            <label className="flex gap-3 items-start cursor-pointer rounded-card border border-[var(--color-border)] p-3 has-[:checked]:border-primary-accent/50 has-[:checked]:bg-primary-accent/5">
              <input
                type="radio"
                name="account-student-visibility"
                value="public"
                className="mt-1"
                checked={studentProfileVisibility === 'public'}
                onChange={() => {
                  if (studentProfileVisibility === 'public') return
                  setStudentProfileVisibility('public')
                  updateStudentProfile({ profileVisibility: 'public' })
                    .then(() => {
                      getProfile().catch(toastApiError)
                      notifySuccess(t('common:saved', 'Saved'))
                    })
                    .catch((e) => {
                      getStudentProfile()
                        .then((p) => setStudentProfileVisibility(p.profileVisibility === 'public' ? 'public' : 'private'))
                        .catch(() => {})
                      toastApiError(e)
                    })
                }}
              />
              <span>
                <span className="font-medium text-[var(--color-text)] block">{t('student:profileVisibilityPublic')}</span>
                <span className="text-sm text-[var(--color-text-muted)]">{t('student:profileVisibilityPublicLong')}</span>
              </span>
            </label>
          </div>
        </Card>
      )}

      <Modal
        open={pwModalOpen && canChangePassword}
        onClose={() => setPwModalOpen(false)}
        title={t('auth:changePassword')}
        contentClassName="pb-4"
      >
        <p className="text-sm text-[var(--color-text-muted)] mb-4">{t('auth:changePasswordProfileHint')}</p>
        <form onSubmit={handleSubmitPw(onChangePasswordSubmit)} className="space-y-3">
          <Input
            label={t('auth:currentPassword')}
            type="password"
            autoComplete="current-password"
            error={pwErrors.currentPassword?.message}
            passwordVisible={showPwFields}
            onPasswordVisibilityToggle={() => setShowPwFields((v) => !v)}
            showPasswordToggle
            {...registerPw('currentPassword')}
          />
          <Input
            label={t('auth:newPassword')}
            type="password"
            autoComplete="new-password"
            hint={t('auth:passwordRequirements')}
            error={pwErrors.newPassword?.message}
            passwordVisible={showPwFields}
            onPasswordVisibilityToggle={() => setShowPwFields((v) => !v)}
            showPasswordToggle
            {...registerPw('newPassword')}
          />
          <Input
            label={t('auth:confirmPassword')}
            type="password"
            autoComplete="new-password"
            error={pwErrors.confirmPassword?.message}
            passwordVisible={showPwFields}
            onPasswordVisibilityToggle={() => setShowPwFields((v) => !v)}
            showPasswordToggle
            {...registerPw('confirmPassword')}
          />
          {pwSubmitError && <p className="text-sm text-red-500">{pwSubmitError}</p>}
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setPwModalOpen(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" loading={pwLoading} disabled={pwLoading}>
              {t('auth:changePassword')}
            </Button>
          </div>
        </form>
      </Modal>

      <Card>
        <CardTitle>{t('settings')}</CardTitle>
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-[var(--color-text-muted)]">{t('language')}</span>
            <LanguageMenu />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-[var(--color-text-muted)]">{t('theme')}</span>
            <ThemeSwitch />
          </div>
          <div className="pt-2 border-t border-[var(--color-border)]">
            <Button variant="secondary" onClick={() => logoutApi().catch(toastApiError)}>
              {t('logout')}
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>{t('notificationPreferences')}</CardTitle>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">{t('notificationPreferencesHint')}</p>
        <div className="mt-4 flex flex-col gap-5">
          <Checkbox
            checked={!!prefs.emailApplicationUpdates}
            onChange={(e) => handlePrefChange('emailApplicationUpdates', e.target.checked)}
            label={t('emailApplicationUpdates')}
            aria-label={t('emailApplicationUpdates')}
          />
          <Checkbox
            checked={!!prefs.emailTrialReminder}
            onChange={(e) => handlePrefChange('emailTrialReminder', e.target.checked)}
            label={t('emailTrialReminder')}
            aria-label={t('emailTrialReminder')}
          />
          {typeof window !== 'undefined' && 'Notification' in window && (
            <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between gap-2">
              <span className="text-sm text-[var(--color-text-muted)]">
                {browserNotifStatus === 'granted'
                  ? t('browserNotificationsGranted')
                  : browserNotifStatus === 'denied'
                    ? t('browserNotificationsDenied')
                    : t('browserNotificationsPrompt')}
              </span>
              {browserNotifStatus !== 'granted' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    Notification.requestPermission().then((p) =>
                      setBrowserNotifStatus(p as 'default' | 'granted' | 'denied')
                    )
                  }
                  disabled={browserNotifStatus === 'denied'}
                >
                  {t('enable')}
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardTitle>{t('twoFactorTitle')}</CardTitle>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          {t('twoFactorHint')}
        </p>
        {twoFaError && <p className="text-sm text-red-500 mt-2">{twoFaError}</p>}
        {twoFaStep === 'idle' && (
          <div className="mt-4">
            {totpEnabled ? (
              <>
                <p className="text-sm text-green-600 dark:text-green-400 mb-2">{t('twoFaEnabled')}</p>
                <Button size="sm" variant="secondary" onClick={() => { setTwoFaStep('disable'); setTwoFaCode('') }}>
                  {t('disable2FA')}
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={handleSetup2FA} loading={twoFaLoading}>
                {t('enable2FA')}
              </Button>
            )}
          </div>
        )}
        {twoFaStep === 'setup' && twoFaSecret && (
          <div className="mt-4 space-y-3">
            <p className="text-sm">{t('twoFaScanHint')}</p>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(twoFaSecret.qrUrl)}`}
              alt="QR code for 2FA"
              width={200}
              height={200}
              className="border border-[var(--color-border)] rounded"
            />
            <p className="text-xs font-mono text-[var(--color-text-muted)] break-all">{twoFaSecret.secret}</p>
            <div className="flex gap-2 items-end">
              <Input
                label={t('verificationCode')}
                value={twoFaCode}
                onChange={(e) => setTwoFaCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                className="w-32"
              />
              <Button size="sm" onClick={handleVerify2FA} disabled={twoFaCode.length < 6} loading={twoFaLoading}>
                {t('verifyAndEnable')}
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setTwoFaStep('idle'); setTwoFaSecret(null); setTwoFaCode('') }}>
              {t('cancel')}
            </Button>
          </div>
        )}
        {twoFaStep === 'disable' && (
          <div className="mt-4 space-y-3">
            <Input
              label={t('enter2FAToDisable')}
              value={twoFaCode}
              onChange={(e) => setTwoFaCode(e.target.value)}
              placeholder="000000"
              maxLength={6}
              className="w-32"
            />
            <div className="flex gap-2">
              <Button size="sm" variant="danger" onClick={handleDisable2FA} disabled={twoFaCode.length < 6} loading={twoFaLoading}>
                {t('disable2FA')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setTwoFaStep('idle'); setTwoFaCode('') }}>
                {t('cancel')}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
