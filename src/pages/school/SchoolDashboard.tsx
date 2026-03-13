import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardTitle } from '@/components/ui/Card'
import { PageTitle } from '@/components/ui/PageTitle'
import { getCounsellorProfile, listMyStudents, listJoinRequests } from '@/services/counsellor'
import { toastApiError } from '@/utils/toastError'
import { Users, UserPlus, Building2, Inbox, ChevronRight, Mail, BarChart3 } from 'lucide-react'

export function SchoolDashboard() {
  const { t } = useTranslation('school')
  const navigate = useNavigate()
  const [schoolName, setSchoolName] = useState('')
  const [studentsTotal, setStudentsTotal] = useState(0)
  const [pendingTotal, setPendingTotal] = useState(0)
  const [recentStudents, setRecentStudents] = useState<{ userId: string; name: string; email: string }[]>([])
  const [recentRequests, setRecentRequests] = useState<{ id: string; studentName: string; studentEmail: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getCounsellorProfile(),
      listMyStudents({ page: 1, limit: 5 }),
      listJoinRequests({ status: 'pending', page: 1, limit: 5 }),
      listJoinRequests({ status: 'pending', page: 1, limit: 1 }),
    ])
      .then(([profile, studentsRes, requestsRes, pendingCountRes]) => {
        setSchoolName(profile.schoolName || '')
        setStudentsTotal(studentsRes.total ?? 0)
        setPendingTotal(pendingCountRes.total ?? 0)
        setRecentStudents(
          (studentsRes.data ?? []).map((s) => ({
            userId: s.userId,
            name: [s.firstName, s.lastName].filter(Boolean).join(' ') || s.name || s.email || '—',
            email: s.email ?? '',
          }))
        )
        setRecentRequests(
          (requestsRes.data ?? []).map((r) => ({
            id: r.id,
            studentName: r.studentName || '—',
            studentEmail: r.studentEmail || '',
          }))
        )
      })
      .catch((e) => {
        toastApiError(e)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <PageTitle title={t('dashboard')} icon="LayoutDashboard" />
        {schoolName && (
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {schoolName}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/school/my-students">
          <Card className="h-full cursor-pointer hover:border-primary-accent transition-colors border-primary-accent/20 bg-primary-accent/5" interactive>
            <CardTitle className="flex items-center gap-2">
              <Users size={20} className="text-primary-accent" />
              {t('statsStudents')}
            </CardTitle>
            <p className="text-3xl font-bold mt-1">{loading ? '—' : studentsTotal}</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
              {t('myStudents')}
            </p>
            <span className="inline-flex items-center gap-1 mt-3 px-3 py-1.5 text-sm font-medium rounded-input border-2 border-[var(--color-border)]">
              {t('viewAll')} <ChevronRight size={14} />
            </span>
          </Card>
        </Link>
        <Link to="/school/join-requests">
          <Card className={`h-full cursor-pointer hover:border-primary-accent transition-colors ${pendingTotal > 0 ? 'border-amber-500/30 bg-amber-500/5' : ''}`} interactive>
            <CardTitle className="flex items-center gap-2">
              <Inbox size={20} className={pendingTotal > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--color-text-muted)]'} />
              {t('statsPending')}
            </CardTitle>
            <p className="text-3xl font-bold mt-1">{loading ? '—' : pendingTotal}</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
              {t('joinRequests')}
            </p>
            <span className="inline-flex items-center gap-1 mt-3 px-3 py-1.5 text-sm font-medium rounded-input border-2 border-[var(--color-border)]">
              {t('viewAll')} <ChevronRight size={14} />
            </span>
          </Card>
        </Link>
        <Link to="/school/my-school">
          <Card className="h-full hover:border-primary-accent transition-colors cursor-pointer border-dashed">
            <CardTitle className="flex items-center gap-2">
              <Building2 size={20} className="text-[var(--color-text-muted)]" />
              {t('mySchool')}
            </CardTitle>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">{t('mySchoolHint')}</p>
          </Card>
        </Link>
      </div>

      <Card>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 size={18} />
          {t('statsOverview', 'Overview')}
        </CardTitle>
        <div className="h-48 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { label: t('statsStudents'), value: loading ? 0 : studentsTotal },
                { label: t('statsPending'), value: loading ? 0 : pendingTotal },
              ]}
              margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="label" stroke="var(--color-text-muted)" tick={{ fontSize: 11 }} />
              <YAxis stroke="var(--color-text-muted)" allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                <Cell fill="var(--color-primary-accent)" />
                <Cell fill="#f59e0b" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Link to="/school/join-requests">
          <Card className="h-full cursor-pointer hover:border-primary-accent transition-colors" interactive>
            <CardTitle className="flex items-center gap-2">
              <UserPlus size={18} />
              {t('recentRequests')}
            </CardTitle>
          {loading ? (
            <p className="text-[var(--color-text-muted)] py-4 text-sm">{t('common:loading', 'Loading...')}</p>
          ) : recentRequests.length === 0 ? (
            <p className="text-[var(--color-text-muted)] py-4 text-sm">{t('noPendingRequests')}</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {recentRequests.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--color-text)] truncate">{r.studentName}</p>
                    {r.studentEmail && (
                      <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 truncate">
                        <Mail size={12} /> {r.studentEmail}
                      </p>
                    )}
                  </div>
                  <button type="button" className="text-sm text-primary-accent hover:underline shrink-0">{t('viewAll')}</button>
                </li>
              ))}
            </ul>
          )}
          <span className="inline-block mt-4 px-3 py-1.5 text-sm font-medium rounded-input border-2 border-[var(--color-border)]">
            {t('viewAll')} {t('joinRequests')}
          </span>
          </Card>
        </Link>

        <Link to="/school/my-students">
          <Card className="h-full cursor-pointer hover:border-primary-accent transition-colors" interactive>
          <CardTitle className="flex items-center gap-2">
            <Users size={18} />
            {t('recentStudents')}
          </CardTitle>
          {loading ? (
            <p className="text-[var(--color-text-muted)] py-4 text-sm">{t('common:loading', 'Loading...')}</p>
          ) : recentStudents.length === 0 ? (
            <p className="text-[var(--color-text-muted)] py-4 text-sm">{t('noStudentsYet')}</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {recentStudents.map((s) => (
                <li
                  key={s.userId}
                  className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--color-text)] truncate">{s.name}</p>
                    {s.email && (
                      <p className="text-xs text-[var(--color-text-muted)] truncate">{s.email}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/school/students/${s.userId}/profile`) }}
                    className="text-sm text-primary-accent hover:underline shrink-0"
                  >
                    {t('profile')}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <span className="inline-block mt-4 px-3 py-1.5 text-sm font-medium rounded-input border-2 border-[var(--color-border)]">
            {t('viewAll')} {t('myStudents')}
          </span>
          </Card>
        </Link>
      </div>

      <Card className="border-[var(--color-border)]">
        <CardTitle>{t('quickActions')}</CardTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <Link to="/school/my-school">
            <div className="p-4 rounded-xl border-2 border-[var(--color-border)] hover:border-primary-accent hover:bg-primary-accent/5 transition-colors">
              <Building2 size={24} className="text-[var(--color-text-muted)] mb-2" />
              <p className="font-medium text-[var(--color-text)]">{t('mySchool')}</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{t('mySchoolHint')}</p>
            </div>
          </Link>
          <Link to="/school/my-students">
            <div className="p-4 rounded-xl border-2 border-[var(--color-border)] hover:border-primary-accent hover:bg-primary-accent/5 transition-colors">
              <Users size={24} className="text-[var(--color-text-muted)] mb-2" />
              <p className="font-medium text-[var(--color-text)]">{t('myStudents')}</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{t('myStudentsHint')}</p>
            </div>
          </Link>
          <Link to="/school/join-requests">
            <div className="p-4 rounded-xl border-2 border-[var(--color-border)] hover:border-primary-accent hover:bg-primary-accent/5 transition-colors">
              <Inbox size={24} className="text-[var(--color-text-muted)] mb-2" />
              <p className="font-medium text-[var(--color-text)]">{t('joinRequests')}</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{t('joinRequestsHint')}</p>
            </div>
          </Link>
        </div>
      </Card>
    </div>
  )
}
