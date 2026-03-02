import { Card, CardTitle } from '@/components/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from 'react-i18next'
import { ShieldCheck, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'

export function UniversityPendingVerification() {
  useTranslation(['common', 'university'])
  const { user } = useAuth()
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bg)]">
      <Card className="max-w-md w-full p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-primary-accent/20 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-7 h-7 text-primary-accent" aria-hidden />
        </div>
        <CardTitle className="mb-2">Account under review</CardTitle>
        <p className="text-[var(--color-text-muted)] text-sm mb-6">
          Thank you for registering. Your university account will be verified and approved by our team. You will be notified once your account is active. Until then, you cannot access the platform.
        </p>
        {user?.email && (
          <p className="text-xs text-[var(--color-text-muted)] mb-4">
            Registered as: {user.email}
          </p>
        )}
        <Button variant="secondary" onClick={handleLogout} icon={<LogOut className="w-4 h-4" />}>
          Sign out
        </Button>
      </Card>
    </div>
  )
}
