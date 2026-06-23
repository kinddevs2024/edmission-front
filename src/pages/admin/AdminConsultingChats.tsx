import { ChatView } from '@/components/chat/ChatView'

export function AdminConsultingChats() {
  return (
    <div className="flex h-[calc(100dvh-5rem)] min-h-0 flex-1 flex-col overflow-hidden sm:h-[calc(100dvh-5.5rem)]">
      <ChatView supportOnly />
    </div>
  )
}
