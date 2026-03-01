import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-primary-dark p-3 sm:p-4 safe-area-pb">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  )
}
