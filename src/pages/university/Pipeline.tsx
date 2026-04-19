import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageTitle } from '@/components/ui/PageTitle'
import { SendDocumentModal } from '@/components/documents/SendDocumentModal'
import { getPipeline, updateInterestStatus } from '@/services/university'
import type { PipelineItem } from '@/services/university'
import type { PipelineStage } from '@/types/university'
import { toastApiError } from '@/utils/toastError'
import { pickStudentProfileId } from '@/utils/mongoId'
import { getStudentContactEmail, getStudentDisplayName } from '@/utils/studentDisplay'
import { CheckCircle2, ChevronRight, Clock3, FileCheck2, MessageCircle, Send, User, UserCheck, XCircle } from 'lucide-react'

const PIPELINE_STAGES: PipelineStage[] = ['interested', 'contacted', 'evaluating', 'offer_sent', 'accepted', 'rejected']

const STAGE_TO_STATUS: Record<PipelineStage, 'interested' | 'under_review' | 'chat_opened' | 'offer_sent' | 'accepted' | 'rejected'> = {
  interested: 'interested',
  contacted: 'chat_opened',
  evaluating: 'under_review',
  offer_sent: 'offer_sent',
  accepted: 'accepted',
  rejected: 'rejected',
}

const STATUS_TO_STAGE: Record<string, PipelineStage> = {
  interested: 'interested',
  under_review: 'evaluating',
  chat_opened: 'contacted',
  offer_sent: 'offer_sent',
  accepted: 'accepted',
  rejected: 'rejected',
}

const STAGE_BADGE_CLASS: Record<PipelineStage, string> = {
  interested: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
  contacted: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  evaluating: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20',
  offer_sent: 'bg-primary-accent/15 text-primary-accent border-primary-accent/20',
  accepted: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  rejected: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
}

type StageFilter = PipelineStage | 'all'

interface PipelineStudent {
  id: string
  name: string
  email?: string
  applicationId: string
  stage: PipelineStage
  updatedAt: string
}

function mapPipelineItem(item: PipelineItem, t: (key: string, defaultValue?: string) => string): PipelineStudent {
  const student = item.student
  return {
    id: pickStudentProfileId(item),
    name: getStudentDisplayName(
      student,
      student?.profileVisibility === 'private'
        ? t('university:privateStudentCardName', 'Private student')
        : t('university:studentLabel', 'Student')
    ),
    email: getStudentContactEmail(student),
    applicationId: item.id,
    stage: STATUS_TO_STAGE[item.status] ?? 'interested',
    updatedAt: item.updatedAt ?? new Date().toISOString(),
  }
}

function getStageIndex(stage: PipelineStage) {
  return PIPELINE_STAGES.indexOf(stage)
}

export function Pipeline() {
  const { t } = useTranslation(['university', 'common'])
  const [students, setStudents] = useState<PipelineStudent[]>([])
  const [activeStage, setActiveStage] = useState<StageFilter>('all')
  const [sendDocumentStudent, setSendDocumentStudent] = useState<PipelineStudent | null>(null)
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null)

  const loadPipeline = useCallback(() => {
    getPipeline()
      .then((items) => setStudents(items.map((item) => mapPipelineItem(item, t))))
      .catch((error) => {
        toastApiError(error)
        setStudents([])
      })
  }, [t])

  useEffect(() => {
    loadPipeline()
  }, [loadPipeline])

  const counts = useMemo(
    () =>
      PIPELINE_STAGES.reduce(
        (acc, stage) => ({ ...acc, [stage]: students.filter((student) => student.stage === stage).length }),
        {} as Record<PipelineStage, number>
      ),
    [students]
  )

  const visibleStudents = useMemo(
    () => (activeStage === 'all' ? students : students.filter((student) => student.stage === activeStage)),
    [activeStage, students]
  )

  const handleStatusChange = (applicationId: string, newStage: PipelineStage) => {
    const status = STAGE_TO_STATUS[newStage]
    if (!status || status === 'interested') return

    setStatusUpdating(applicationId)
    updateInterestStatus(applicationId, status)
      .then(() => loadPipeline())
      .catch(toastApiError)
      .finally(() => setStatusUpdating(null))
  }

  const getStageLabel = (stage: PipelineStage) => {
    switch (stage) {
      case 'interested':
        return t('university:pipelineInterested', 'Interested')
      case 'contacted':
        return t('university:pipelineContacted', 'Contacted')
      case 'evaluating':
        return t('university:pipelineEvaluating', 'Evaluating')
      case 'offer_sent':
        return t('university:pipelineOfferSent', 'Offer sent')
      case 'accepted':
        return t('university:pipelineAccepted', 'Accepted')
      case 'rejected':
        return t('university:pipelineRejected', 'Rejected')
      default:
        return stage
    }
  }

  const selectedStageLabel = activeStage === 'all' ? t('university:allStudents', 'All students') : getStageLabel(activeStage)

  return (
    <div className="space-y-4">
      <div data-onboarding="university-pipeline-overview">
        <PageTitle title={t('university:navPipeline')} icon="GitBranch" />
      </div>

      <Card className="space-y-4 border border-[var(--color-border)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Stage-based workflow</h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              Move students through the pipeline step by step. Pick a stage to focus the list below.
            </p>
          </div>
          <Button variant={activeStage === 'all' ? 'primary' : 'secondary'} size="sm" onClick={() => setActiveStage('all')}>
            {t('university:allStudents', 'All students')} ({students.length})
          </Button>
        </div>

        <div className="overflow-x-auto pb-1">
          <div className="flex min-w-[980px] items-center gap-2">
            {PIPELINE_STAGES.map((stage, index) => {
              const isActive = activeStage === stage
              return (
                <Fragment key={stage}>
                  <button
                    type="button"
                    onClick={() => setActiveStage(stage)}
                    className={`flex min-w-[150px] flex-1 items-center gap-3 rounded-[22px] border px-4 py-3 text-left transition ${
                      isActive
                        ? 'border-primary-accent bg-primary-accent/10 shadow-[var(--shadow-card)]'
                        : 'border-[var(--color-border)] bg-[var(--color-card)] hover:border-primary-accent/40'
                    }`}
                  >
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                      isActive ? 'bg-primary-accent text-primary-dark' : 'bg-[var(--color-border)] text-[var(--color-text)]'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{getStageLabel(stage)}</span>
                      <span className="block text-xs text-[var(--color-text-muted)]">{counts[stage] ?? 0} students</span>
                    </span>
                  </button>
                  {index < PIPELINE_STAGES.length - 1 ? (
                    <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
                  ) : null}
                </Fragment>
              )
            })}
          </div>
        </div>
      </Card>

      <Card className="space-y-4 border border-[var(--color-border)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{selectedStageLabel}</h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              {visibleStudents.length} {visibleStudents.length === 1 ? 'student' : 'students'} in this view
            </p>
          </div>
        </div>

        {visibleStudents.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-text-muted)]">
            {t('university:noStudents')}
          </div>
        ) : (
          <div className="space-y-4">
            {visibleStudents.map((student) => {
              const stageIndex = getStageIndex(student.stage)
              const canSendDocument = student.stage === 'interested' || student.stage === 'contacted' || student.stage === 'evaluating'
              const canReject = student.stage !== 'accepted' && student.stage !== 'rejected'
              const isUpdating = statusUpdating === student.applicationId

              return (
                <div key={student.applicationId} className="rounded-[24px] border border-[var(--color-border)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold">{student.name}</p>
                      {student.email && student.email !== student.name ? (
                        <p className="text-xs text-[var(--color-text-muted)]">{student.email}</p>
                      ) : null}
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Updated {new Date(student.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${STAGE_BADGE_CLASS[student.stage]}`}>
                      {getStageLabel(student.stage)}
                    </span>
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <div className="flex min-w-[760px] items-center gap-2">
                      {PIPELINE_STAGES.map((stage, index) => {
                        const completed = index < stageIndex
                        const current = index === stageIndex
                        const connectorDone = index < stageIndex

                        return (
                          <Fragment key={`${student.applicationId}-${stage}`}>
                            <div className="min-w-[112px] flex-1">
                              <div className="flex items-center gap-2">
                                {completed ? (
                                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                ) : current ? (
                                  <Clock3 className="h-5 w-5 text-primary-accent" />
                                ) : (
                                  <div className="h-5 w-5 rounded-full border border-[var(--color-border)] bg-[var(--color-card)]" />
                                )}
                                <span className={`text-sm ${current ? 'font-semibold text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}`}>
                                  {getStageLabel(stage)}
                                </span>
                              </div>
                            </div>
                            {index < PIPELINE_STAGES.length - 1 ? (
                              <div className={`h-[2px] w-10 rounded-full ${connectorDone ? 'bg-emerald-500' : 'bg-[var(--color-border)]'}`} />
                            ) : null}
                          </Fragment>
                        )
                      })}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button to={`/university/students/${encodeURIComponent(student.id)}`} variant="secondary" size="sm" icon={<User size={16} />}>
                      {t('university:viewProfile')}
                    </Button>
                    <Button to={`/university/chat?studentId=${encodeURIComponent(student.id)}`} variant="ghost" size="sm" icon={<MessageCircle size={16} />}>
                      {t('common:openChat')}
                    </Button>

                    {canSendDocument ? (
                      <Button variant="ghost" size="sm" onClick={() => setSendDocumentStudent(student)} icon={<Send size={16} />}>
                        Send document
                      </Button>
                    ) : null}

                    {student.stage === 'interested' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={isUpdating}
                        loading={isUpdating}
                        onClick={() => handleStatusChange(student.applicationId, 'contacted')}
                        icon={<UserCheck size={16} />}
                      >
                        {t('university:markContacted', 'Mark contacted')}
                      </Button>
                    ) : null}

                    {student.stage === 'contacted' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={isUpdating}
                        loading={isUpdating}
                        onClick={() => handleStatusChange(student.applicationId, 'evaluating')}
                        icon={<FileCheck2 size={16} />}
                      >
                        {t('university:toEvaluating', 'Move to evaluating')}
                      </Button>
                    ) : null}

                    {student.stage === 'offer_sent' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={isUpdating}
                        loading={isUpdating}
                        onClick={() => handleStatusChange(student.applicationId, 'accepted')}
                        icon={<CheckCircle2 size={16} />}
                      >
                        {t('university:markAccepted', 'Mark accepted')}
                      </Button>
                    ) : null}

                    {canReject ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isUpdating}
                        loading={isUpdating}
                        onClick={() => handleStatusChange(student.applicationId, 'rejected')}
                        icon={<XCircle size={16} />}
                        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/20"
                      >
                        {t('university:markRejected', 'Reject')}
                      </Button>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {sendDocumentStudent ? (
        <SendDocumentModal
          open={Boolean(sendDocumentStudent)}
          studentId={sendDocumentStudent.id}
          studentName={sendDocumentStudent.name}
          onClose={() => setSendDocumentStudent(null)}
          onSent={() => {
            setSendDocumentStudent(null)
            loadPipeline()
          }}
        />
      ) : null}
    </div>
  )
}
