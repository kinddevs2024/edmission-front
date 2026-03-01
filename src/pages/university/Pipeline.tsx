import { useCallback, useEffect, useState } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { api } from '@/services/api'
import { getScholarships, createOffer, updateInterestStatus } from '@/services/university'
import { PageTitle } from '@/components/ui/PageTitle'
import { MessageCircle, Send, UserCheck, ArrowRight, User } from 'lucide-react'
import type { PipelineStage } from '@/types/university'
import type { Scholarship } from '@/types/university'

const COLUMNS: { id: PipelineStage; title: string }[] = [
  { id: 'interested', title: 'Interested' },
  { id: 'contacted', title: 'Contacted' },
  { id: 'evaluating', title: 'Evaluating' },
  { id: 'offer_sent', title: 'Offer Sent' },
  { id: 'accepted', title: 'Accepted' },
  { id: 'rejected', title: 'Rejected' },
]

const STAGE_TO_STATUS: Record<PipelineStage, 'interested' | 'under_review' | 'chat_opened' | 'offer_sent' | 'accepted' | 'rejected'> = {
  interested: 'interested',
  contacted: 'chat_opened',
  evaluating: 'under_review',
  offer_sent: 'offer_sent',
  accepted: 'accepted',
  rejected: 'rejected',
}

interface PipelineStudent {
  id: string
  name: string
  applicationId: string
  stage: PipelineStage
  updatedAt: string
}

function fetchPipeline(): Promise<PipelineStudent[]> {
  return api
    .get<Array<{ id: string; status: string; student?: { firstName?: string; lastName?: string; _id?: unknown }; updatedAt?: string }>>('/university/pipeline')
    .then((res) => {
      const raw = Array.isArray(res.data) ? res.data : []
      const statusToStage: Record<string, PipelineStage> = {
        interested: 'interested',
        under_review: 'evaluating',
        chat_opened: 'contacted',
        offer_sent: 'offer_sent',
        accepted: 'accepted',
        rejected: 'rejected',
      }
      return raw.map((i) => {
        const st = i.student as { firstName?: string; lastName?: string } | undefined
        const name = st ? [st.firstName, st.lastName].filter(Boolean).join(' ') || 'Student' : 'Student'
        return {
          id: String(i.student?._id ?? i.id),
          name,
          applicationId: i.id,
          stage: statusToStage[i.status] ?? 'interested',
          updatedAt: i.updatedAt ?? new Date().toISOString(),
        }
      })
    })
}

export function Pipeline() {
  const [byStage, setByStage] = useState<Record<PipelineStage, PipelineStudent[]>>(() =>
    COLUMNS.reduce((acc, { id }) => ({ ...acc, [id]: [] }), {} as Record<PipelineStage, PipelineStudent[]>)
  )
  const [offerModal, setOfferModal] = useState<{ student: PipelineStudent } | null>(null)
  const [scholarships, setScholarships] = useState<Scholarship[]>([])
  const [offerForm, setOfferForm] = useState({ scholarshipId: '', coveragePercent: 50, deadline: '' })
  const [offerSubmitting, setOfferSubmitting] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null)

  const loadPipeline = useCallback(() => {
    fetchPipeline()
      .then((list) => {
        const next = COLUMNS.reduce(
          (acc, { id }) => ({ ...acc, [id]: list.filter((s) => s.stage === id) }),
          {} as Record<PipelineStage, PipelineStudent[]>
        )
        setByStage(next)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    loadPipeline()
  }, [loadPipeline])

  useEffect(() => {
    if (offerModal) {
      getScholarships()
        .then((res) => {
          const list = Array.isArray(res) ? res : (res as { data?: Scholarship[] })?.data ?? []
          setScholarships(list)
        })
        .catch(() => setScholarships([]))
      setOfferForm({ scholarshipId: '', coveragePercent: 50, deadline: '' })
    }
  }, [offerModal])

  const handleSendOffer = () => {
    if (!offerModal) return
    setOfferSubmitting(true)
    createOffer({
      studentId: offerModal.student.id,
      scholarshipId: offerForm.scholarshipId || undefined,
      coveragePercent: offerForm.coveragePercent,
      deadline: offerForm.deadline || undefined,
    })
      .then(() => {
        setOfferModal(null)
        loadPipeline()
      })
      .catch(() => {})
      .finally(() => setOfferSubmitting(false))
  }

  const handleStatusChange = (applicationId: string, newStage: PipelineStage) => {
    const status = STAGE_TO_STATUS[newStage]
    if (!status) return
    setStatusUpdating(applicationId)
    updateInterestStatus(applicationId, status)
      .then(() => loadPipeline())
      .catch(() => {})
      .finally(() => setStatusUpdating(null))
  }

  return (
    <div className="space-y-4">
      <PageTitle title="Pipeline" icon="GitBranch" />
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[320px]">
        {COLUMNS.map(({ id, title }) => (
          <Card key={id} className="min-w-[240px] sm:min-w-[260px] flex-shrink-0 flex flex-col">
            <CardTitle className="flex justify-between items-center">
              <span>{title}</span>
              <span className="text-sm font-normal text-[var(--color-text-muted)]">{byStage[id]?.length ?? 0}</span>
            </CardTitle>
            <div className="flex-1 space-y-2 mt-2 overflow-y-auto">
              {(byStage[id] ?? []).length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">No students</p>
              ) : (
                (byStage[id] ?? []).map((s) => (
                  <div key={s.id} className="p-2 rounded-input bg-[var(--color-border)]/20 text-sm">
                    <p className="font-medium truncate">{s.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{new Date(s.updatedAt).toLocaleDateString()}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Button to={`/university/students/${encodeURIComponent(s.id)}`} variant="ghost" size="sm" icon={<User size={16} />}>
                        View profile
                      </Button>
                      <Button to={`/university/chat?studentId=${encodeURIComponent(s.id)}`} variant="ghost" size="sm" icon={<MessageCircle size={16} />}>
                        Open chat
                      </Button>
                      {s.stage !== 'offer_sent' && s.stage !== 'accepted' && s.stage !== 'rejected' && (
                        <Button variant="ghost" size="sm" onClick={() => setOfferModal({ student: s })} icon={<Send size={16} />}>
                          Send offer
                        </Button>
                      )}
                      {s.stage === 'interested' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={statusUpdating === s.applicationId}
                          onClick={() => handleStatusChange(s.applicationId, 'contacted')}
                          icon={<UserCheck size={16} />}
                        >
                          Mark contacted
                        </Button>
                      )}
                      {s.stage === 'contacted' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={statusUpdating === s.applicationId}
                          onClick={() => handleStatusChange(s.applicationId, 'evaluating')}
                          icon={<ArrowRight size={16} />}
                        >
                          To evaluating
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        ))}
      </div>

      <Modal
        open={!!offerModal}
        onClose={() => setOfferModal(null)}
        title={offerModal ? `Send offer to ${offerModal.student.name}` : ''}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOfferModal(null)}>
              Cancel
            </Button>
            <Button onClick={handleSendOffer} disabled={offerSubmitting} loading={offerSubmitting} icon={<Send size={16} />}>
              Send offer
            </Button>
          </>
        }
      >
        {offerModal && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Scholarship (optional)</label>
              <select
                className="w-full rounded-input border border-[var(--color-border)] bg-[var(--color-input)] px-3 py-2"
                value={offerForm.scholarshipId}
                onChange={(e) => setOfferForm((f) => ({ ...f, scholarshipId: e.target.value }))}
              >
                <option value="">None</option>
                {scholarships.map((sch) => (
                  <option key={sch.id} value={sch.id}>
                    {sch.name} ({sch.coveragePercent}%, {sch.remainingSlots ?? (sch.maxSlots - (sch.usedSlots ?? 0))} left)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Coverage %</label>
              <input
                type="number"
                min={0}
                max={100}
                className="w-full rounded-input border border-[var(--color-border)] bg-[var(--color-input)] px-3 py-2"
                value={offerForm.coveragePercent}
                onChange={(e) => setOfferForm((f) => ({ ...f, coveragePercent: Number(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Deadline (optional)</label>
              <input
                type="date"
                className="w-full rounded-input border border-[var(--color-border)] bg-[var(--color-input)] px-3 py-2"
                value={offerForm.deadline}
                onChange={(e) => setOfferForm((f) => ({ ...f, deadline: e.target.value }))}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
