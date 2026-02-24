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
    api.get<{ data?: PipelineStudent[] }>('/university/pipeline')
      .then((res) => {
        const list = res.data?.data ?? []
        const next = COLUMNS.reduce((acc, { id }) => ({ ...acc, [id]: list.filter((s) => s.stage === id) }), {} as Record<PipelineStage, PipelineStudent[]>);
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
