import { ChatView } from '@/components/chat/ChatView'

export function StudentChat() {
  return (
    <div className="h-full min-h-[320px] overflow-hidden -m-2 sm:-m-4 flex flex-col">
      <ChatView />
    </div>
  )
}
