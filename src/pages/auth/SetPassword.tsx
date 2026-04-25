import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { setPassword, getProfile } from '@/services/auth'
import { useAuth } from '@/hooks/useAuth'
import { navigateAfterLogin } from '@/utils/navigateAfterAuth'
import { getFormSubmitErrorMessage } from '@/utils/apiErrorI18n'
import { newPasswordValueSchema } from '@/utils/authPasswordZod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardTitle } from '@/components/ui/Card'

type FormData = { newPassword: string; confirmPassword: string }

export function SetPassword() {
  const { t } = useTranslation(['common', 'auth', 'errors'])
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    if (user.mustChangePassword || user.mustSetLocalPassword) return
    navigateAfterLogin(navigate, user)
  }, [user, navigate])
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const schema = useMemo(
    () =>
      z
        .object({
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

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setSubmitError('')
    setLoading(true)
    try {
      await setPassword(data.newPassword)
      const nextUser = await getProfile()
      if (nextUser.role === 'student') navigate('/student/dashboard', { replace: true })
      else if (nextUser.role === 'university') {
        const up = nextUser.universityProfile
        if (!up?.id) navigate('/university/select', { replace: true })
        else navigate(up.verified ? '/university/dashboard' : '/university/pending', { replace: true })
      } else if (nextUser.role === 'university_multi_manager') {
        navigate('/university-multi-manager', { replace: true })
      } else if (nextUser.role === 'school_counsellor') navigate('/school/dashboard', { replace: true })
      else navigate('/admin', { replace: true })
    } catch (err) {
      setSubmitError(getFormSubmitErrorMessage(err, t))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6 pb-page-bottom-cta">
      <CardTitle className="mb-4">{t('auth:setPassword')}</CardTitle>
      <p className="text-sm text-[var(--color-text-muted)] mb-4">
        {user?.mustSetLocalPassword
          ? t('auth:oauthSetPasswordPageHint')
          : t('auth:setPasswordHint')}
      </p>
      {user?.mustChangePassword && user.temporaryPassword ? (
        <div className="mb-4 rounded-card border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
          <p className="text-sm font-medium text-[var(--color-text)]">
            {t('auth:updatePasswordRequired', 'Update your password')}
          </p>
          <div className="mt-2 grid gap-2 text-sm">
            <div>
              <span className="text-[var(--color-text-muted)]">{t('auth:generatedEmail', 'Generated email')}: </span>
              <span className="font-mono break-all">{user.email}</span>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)]">{t('auth:temporaryPassword', 'Temporary password')}: </span>
              <span className="font-mono break-all">{user.temporaryPassword}</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            {t('auth:temporaryPasswordWillHide', 'This password is visible to administration only until you save a new password.')}
          </p>
        </div>
      ) : null}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label={t('auth:newPassword')}
          type="password"
          autoComplete="new-password"
          hint={t('auth:passwordRequirements')}
          error={errors.newPassword?.message}
          passwordVisible={showPassword}
          onPasswordVisibilityToggle={() => setShowPassword((v) => !v)}
          showPasswordToggle
          {...register('newPassword')}
        />
        <Input
          label={t('auth:confirmPassword')}
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          passwordVisible={showPassword}
          onPasswordVisibilityToggle={() => setShowPassword((v) => !v)}
          showPasswordToggle
          {...register('confirmPassword')}
        />
        {submitError && <p className="text-sm text-red-500">{submitError}</p>}
        <Button type="submit" className="w-full" loading={loading} disabled={loading}>
          {t('common:save', 'Save')}
        </Button>
      </form>
    </Card>
  )
}
