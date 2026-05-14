import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getProfile as getUniversityProfile, updateProfile as updateUniversityProfile } from '@/services/university'
import { useAuth } from '@/hooks/useAuth'
import { getProfile, updateProfile, getApiError, logout as logoutApi, changePassword, startLinkEmail, verifyLinkEmail } from '@/services/auth'
import { useAuthStore } from '@/store/authStore'
import { setup2FA, verifyAndEnable2FA, disable2FA } from '@/services/twoFactor'
import { PageTitle } from '@/components/ui/PageTitle'
import { Card, CardTitle } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { LanguageMenu } from '@/components/layout/LanguageMenu'
import { ThemeSwitch } from '@/components/ui/ThemeSwitch'
import { AdminUniversityOfferModal } from '@/components/admin/AdminUniversityOfferModal'
import { toastApiError } from '@/utils/toastError'
import { getFormSubmitErrorMessage } from '@/utils/apiErrorI18n'
import { newPasswordValueSchema } from '@/utils/authPasswordZod'
import { notifySuccess } from '@/utils/notify'
import { cn } from '@/utils/cn'
import type { NotificationPreferences } from '@/types/user'
import { FileUpload } from '@/components/ui/FileUpload'
import { Checkbox } from '@/components/ui/Checkbox'
import { setActAsUniversityUserId } from '@/constants/actAsUniversity'
import { CheckCircle, ChevronDown, CircleAlert, Lock } from 'lucide-react'
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

  const prefs = user?.notificationPreferences ?? { emailApplicationUpdates: true, emailTrialReminder: true, smsApplicationUpdates: false }

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
  const [openSocialLink, setOpenSocialLink] = useState<'telegram' | 'instagram' | 'linkedin' | 'facebook' | 'whatsapp' | null>('telegram')
  const [accountSaving, setAccountSaving] = useState(false)
  const [emailLinkStep, setEmailLinkStep] = useState<'input' | 'code'>('input')
  const [emailLinkValue, setEmailLinkValue] = useState('')
  const [emailLinkCode, setEmailLinkCode] = useState('')
  const [emailLinkError, setEmailLinkError] = useState('')
  const [emailLinkLoading, setEmailLinkLoading] = useState(false)
  const [studentProfileVisibility, setStudentProfileVisibility] = useState<'private' | 'public' | null>(null)
  const [multiManagerOfferUniversityId, setMultiManagerOfferUniversityId] = useState(user?.managedUniversities?.[0]?.userId ?? '')
  const [multiManagerOfferOpen, setMultiManagerOfferOpen] = useState(false)

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

  useEffect(() => {
    if (user?.role !== 'university_multi_manager' && user?.role !== 'multi_university_admin') {
      setMultiManagerOfferUniversityId('')
      return
    }
    setMultiManagerOfferUniversityId((current) => {
      if (current && user.managedUniversities?.some((u) => u.userId === current)) return current
      return user.managedUniversities?.[0]?.userId ?? ''
    })
  }, [user?.managedUniversities, user?.role])

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

  const publicEmail = useMemo(() => {
    const email = (user?.email ?? '').trim()
    if (!email || email.endsWith('.local') || email.includes('@telegram.local') || email.includes('@phone.local')) return ''
    return email
  }, [user?.email])
  const emailConnected = Boolean(publicEmail)

  useEffect(() => {
    if (!emailConnected) return
    setEmailLinkStep('input')
    setEmailLinkValue('')
    setEmailLinkCode('')
    setEmailLinkError('')
  }, [emailConnected])

  const handleStartEmailLink = async () => {
    const nextEmail = emailLinkValue.trim()
    if (!nextEmail) {
      setEmailLinkError(t('auth:invalidEmail', 'Enter a valid email'))
      return
    }
    setEmailLinkError('')
    setEmailLinkLoading(true)
    try {
      await startLinkEmail(nextEmail)
      setEmailLinkValue(nextEmail)
      setEmailLinkCode('')
      setEmailLinkStep('code')
      notifySuccess(t('auth:verificationCodeSentShort', 'Verification code sent'))
    } catch (err) {
      setEmailLinkError(getApiError(err).message || t('errors:unknown'))
    } finally {
      setEmailLinkLoading(false)
    }
  }

  const handleVerifyEmailLink = async () => {
    const code = emailLinkCode.trim().replace(/\D/g, '').slice(0, 6)
    if (code.length !== 6) {
      setEmailLinkError(t('auth:enterCode', 'Enter code'))
      return
    }
    setEmailLinkError('')
    setEmailLinkLoading(true)
    try {
      await verifyLinkEmail({ email: emailLinkValue.trim(), code })
      await getProfile()
      setEmailLinkStep('input')
      setEmailLinkCode('')
      notifySuccess(t('auth:emailConnected', 'Email connected'))
    } catch (err) {
      setEmailLinkError(getApiError(err).message || t('errors:unknown'))
    } finally {
      setEmailLinkLoading(false)
    }
  }

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

  const loginMethods = useMemo(
    () => [
      { key: 'email', label: t('auth:email', 'Email'), connected: user?.linkedProviders?.email ?? Boolean(publicEmail) },
      { key: 'phone', label: t('auth:phone', 'Phone'), connected: user?.linkedProviders?.phone ?? Boolean(user?.phone) },
      { key: 'telegram', label: 'Telegram', connected: user?.linkedProviders?.telegram ?? Boolean(user?.socialLinks?.telegram) },
      { key: 'google', label: 'Google', connected: Boolean(user?.linkedProviders?.google) },
      { key: 'apple', label: 'Apple', connected: Boolean(user?.linkedProviders?.apple) },
      { key: 'yandex', label: 'Yandex', connected: Boolean(user?.linkedProviders?.yandex) },
    ],
    [t, publicEmail, user?.linkedProviders?.apple, user?.linkedProviders?.email, user?.linkedProviders?.google, user?.linkedProviders?.phone, user?.linkedProviders?.telegram, user?.linkedProviders?.yandex, user?.phone, user?.socialLinks?.telegram]
  )
  const shouldShowLoginMethods = loginMethods.filter((item) => item.connected).length < 2
  const socialAccounts = [
    {
      key: 'telegram' as const,
      label: 'Telegram',
      value: telegram,
      setValue: setTelegram,
      placeholder: '@username',
      verified: Boolean(user?.linkedProviders?.telegram),
    },
    {
      key: 'instagram' as const,
      label: 'Instagram',
      value: instagram,
      setValue: setInstagram,
      placeholder: 'instagram.com/username',
      verified: false,
    },
    {
      key: 'linkedin' as const,
      label: 'LinkedIn',
      value: linkedin,
      setValue: setLinkedin,
      placeholder: 'linkedin.com/in/username',
      verified: false,
    },
    {
      key: 'facebook' as const,
      label: 'Facebook',
      value: facebook,
      setValue: setFacebook,
      placeholder: 'facebook.com/username',
      verified: false,
    },
    {
      key: 'whatsapp' as const,
      label: 'WhatsApp',
      value: whatsapp,
      setValue: setWhatsapp,
      placeholder: '+998 90 123 45 67',
      verified: Boolean(user?.linkedProviders?.phone),
    },
  ]

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
              accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,image/avif,image/jfif,image/heic,image/heif,image/heic-sequence,image/heif-sequence,.heic,.heics,.heif,.heifs"
              hint={t('university:uploadLogoOrUrl', 'Upload a logo or set the full URL on the university profile page')}
            />
          </div>
        )}
        <dl className="grid grid-cols-1 gap-2 mt-4">
          <dt className="text-[var(--color-text-muted)]">{t('email')}</dt>
          <dd className="min-w-0">
            {emailConnected ? (
              <span className="break-all">{publicEmail}</span>
            ) : (
              <div className="space-y-3 rounded-card border border-[var(--color-border)] bg-[var(--color-bg)]/55 p-3">
                <p className="text-sm text-[var(--color-text-muted)]">{t('auth:noEmailConnected', 'No email connected')}</p>
                <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                  <Input
                    label={t('auth:connectEmail', 'Connect email')}
                    type="email"
                    autoComplete="email"
                    value={emailLinkValue}
                    onChange={(e) => {
                      setEmailLinkValue(e.target.value)
                      setEmailLinkError('')
                    }}
                    placeholder={t('auth:emailPlaceholder', 'you@example.com')}
                    disabled={emailLinkLoading || emailLinkStep === 'code'}
                  />
                  <Button type="button" onClick={handleStartEmailLink} loading={emailLinkLoading && emailLinkStep === 'input'} disabled={emailLinkLoading}>
                    {t('auth:confirm', 'Confirm')}
                  </Button>
                </div>
                {emailLinkStep === 'code' ? (
                  <div className="grid gap-2 md:grid-cols-[minmax(0,180px)_auto] md:items-end">
                    <Input
                      label={t('auth:enterCode', 'Enter code')}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={emailLinkCode}
                      onChange={(e) => {
                        setEmailLinkCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                        setEmailLinkError('')
                      }}
                      placeholder={t('auth:codePlaceholder', '000000')}
                    />
                    <Button type="button" onClick={handleVerifyEmailLink} loading={emailLinkLoading && emailLinkStep === 'code'} disabled={emailLinkLoading}>
                      {t('auth:verifyAndContinue', 'Verify')}
                    </Button>
                  </div>
                ) : null}
                {emailLinkError ? <p className="text-sm text-red-500">{emailLinkError}</p> : null}
              </div>
            )}
          </dd>
          <dt className="text-[var(--color-text-muted)]">{t('phone', 'Phone')}</dt>
          <dd>{user?.phone || '-'}</dd>
          <dt className="text-[var(--color-text-muted)]">{t('name')}</dt>
          <dd>{user?.name ?? '—'}</dd>
        </dl>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Input label={t('name')} value={name} onChange={(e) => setName(e.target.value)} />
          <Input label={t('phone', 'Phone')} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" />
        </div>
        <div className="mt-4 rounded-card border border-[var(--color-border)] bg-[var(--color-bg)]/55">
          {socialAccounts.map((account, index) => {
            const open = openSocialLink === account.key
            const connected = Boolean(account.value.trim())
            return (
              <div key={account.key} className={cn(index > 0 && 'border-t border-[var(--color-border)]')}>
                <button
                  type="button"
                  onClick={() => setOpenSocialLink(open ? null : account.key)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
                  aria-expanded={open}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-[var(--color-text)]">{account.label}</span>
                    <span className="mt-0.5 block text-xs text-[var(--color-text-muted)]">
                      {account.verified
                        ? t('auth:connected', 'Connected')
                        : connected
                          ? t('common:filled', 'Filled')
                          : t('auth:notConnected', 'Not connected')}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {account.verified ? <CheckCircle className="h-4 w-4 text-green-600" aria-hidden /> : null}
                    <ChevronDown className={cn('h-4 w-4 text-[var(--color-text-muted)] transition-transform', open && 'rotate-180')} aria-hidden />
                  </span>
                </button>
                {open ? (
                  <div className="px-3 pb-3">
                    <Input
                      label={account.label}
                      value={account.value}
                      onChange={(e) => account.setValue(e.target.value)}
                      placeholder={account.placeholder}
                      hint={
                        account.verified
                          ? t('auth:connectedLoginMethodsHint', 'Verified through a connected login method.')
                          : t('common:optional', 'optional')
                      }
                    />
                  </div>
                ) : null}
              </div>
            )
          })}
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

      {(user?.role === 'university_multi_manager' || user?.role === 'multi_university_admin') ? (
        <Card>
          <CardTitle>{t('university:sendOfferAsManagedUniversity', 'Send offer as a university')}</CardTitle>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {t('university:multiManagerOfferHint', 'Choose one of your assigned universities, then choose any student and send an offer.')}
          </p>
          {user.role !== 'multi_university_admin' && user.universityMultiManagerApproved !== true ? (
            <p className="mt-3 rounded-input border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
              {t('university:multiManagerPendingApproval', 'Your access is not approved yet. An administrator must confirm your assignment before you can open a university.')}
            </p>
          ) : null}
          <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <Select
              label={t('common:university', 'University')}
              value={multiManagerOfferUniversityId}
              onChange={(e) => setMultiManagerOfferUniversityId(e.target.value)}
              options={[
                { value: '', label: t('university:selectUniversity', 'Select university') },
                ...(user.managedUniversities ?? []).map((u) => ({
                  value: u.userId,
                  label: u.universityName || u.userId,
                })),
              ]}
            />
            <Button
              type="button"
              disabled={(user.role !== 'multi_university_admin' && user.universityMultiManagerApproved !== true) || !multiManagerOfferUniversityId}
              onClick={() => {
                setActAsUniversityUserId(multiManagerOfferUniversityId)
                setMultiManagerOfferOpen(true)
              }}
            >
              {t('common:send', 'Send')}
            </Button>
          </div>
          {multiManagerOfferUniversityId ? (
            <AdminUniversityOfferModal
              open={multiManagerOfferOpen}
              onClose={() => setMultiManagerOfferOpen(false)}
              universityUserId={multiManagerOfferUniversityId}
              apiMode="delegated"
            />
          ) : null}
        </Card>
      ) : null}

      {shouldShowLoginMethods ? (
        <Card>
          <CardTitle>{t('auth:connectedLoginMethods', 'Connected login methods')}</CardTitle>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {t('auth:connectedLoginMethodsHint', 'Keep at least two methods connected so you never lose access.')}
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {loginMethods.map((item) => (
              <div key={item.key} className="flex min-h-[56px] items-center justify-between gap-3 rounded-card border border-[var(--color-border)] px-3 py-2">
                <span className="text-sm font-medium text-[var(--color-text)]">{item.label}</span>
                {item.connected ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                    <CheckCircle className="h-4 w-4" aria-hidden />
                    {t('auth:connected', 'Connected')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-text-muted)]">
                    <CircleAlert className="h-4 w-4" aria-hidden />
                    {t('auth:notConnected', 'Not connected')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      ) : null}

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
          <Checkbox
            checked={!!prefs.smsApplicationUpdates}
            onChange={(e) => handlePrefChange('smsApplicationUpdates', e.target.checked)}
            disabled={!user?.phone}
            label={t('smsApplicationUpdates', 'Send important updates to my phone')}
            aria-label={t('smsApplicationUpdates', 'Send important updates to my phone')}
          />
          {!user?.phone && (
            <p className="-mt-3 text-xs text-[var(--color-text-muted)]">
              {t('smsApplicationUpdatesPhoneHint', 'Add your phone number above to enable phone notifications.')}
            </p>
          )}
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
