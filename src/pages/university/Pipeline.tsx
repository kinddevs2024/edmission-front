import { useEffect, useState } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { api } from '@/services/api'
import type { PipelineStage } from '@/types/university'

const COLUMNS: { id: PipelineStage; title: string }[] = [
  { id: 'interested', title: 'Interested' },
  { id: 'contacted', title: 'Contacted' },
  { id: 'evaluating', title: 'Evaluating' },
  { id: 'offer_sent', title: 'Offer Sent' },
  { id: 'accepted', title: 'Accepted' },
  { id: 'rejected', title: 'Rejected' },
]

interface PipelineStudent {
  id: string
  name: string
  applicationId: string
  stage: PipelineStage
  updatedAt: string
}

export function Pipeline() {
  const [byStage, setByStage] = useState<Record<PipelineStage, PipelineStudent[]>>(() =>
    COLUMNS.reduce((acc, { id }) => ({ ...acc, [id]: [] }), {} as Record<PipelineStage, PipelineStudent[]>)
  )

  useEffect(() => {
    api.get<Array<{ id: string; status: string; student?: { firstName?: string; lastName?: string; _id?: unknown }; updatedAt?: string }>>('/university/pipeline')
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
        const list: PipelineStudent[] = raw.map((i) => {
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
        const next = COLUMNS.reduce((acc, { id }) => ({ ...acc, [id]: list.filter((s) => s.stage === id) }), {} as Record<PipelineStage, PipelineStudent[]>)
        setByStage(next)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-4">
      <h1 className="text-h1">Pipeline</h1>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[320px]">
        {COLUMNS.map(({ id, title }) => (
          <Card key={id} className="min-w-[260px] flex-shrink-0 flex flex-col">
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
                    <Button to="/university/chat" variant="ghost" size="sm" className="mt-1">Open chat</Button>
                  </div>
                ))
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
