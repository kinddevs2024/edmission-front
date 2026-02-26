import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { BackendStatus } from '@/components/BackendStatus'

export function Landing() {
  const { t } = useTranslation(['common', 'auth'])

  return (
    <div className="max-w-lg mx-auto space-y-6 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">
          {t('common:appName')}
        </h1>
        <p className="text-[var(--color-text-muted)]">
          Платформа для поступления в вузы
        </p>
      </div>

      <Card className="p-6">
        <CardTitle className="mb-4">Главная</CardTitle>
        <p className="text-[var(--color-text-muted)] mb-6">
          Вы можете войти в аккаунт или зарегистрироваться. Состояние бэкенда отображается ниже.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button to="/login" variant="primary" className="flex-1">
            {t('common:login')}
          </Button>
          <Button to="/register" variant="secondary" className="flex-1">
            {t('common:register')}
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold text-[var(--color-text)] mb-2">Состояние API</h3>
        <BackendStatus />
      </Card>
    </div>
  )
}
