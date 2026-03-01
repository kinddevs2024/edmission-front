import { ChatView } from '@/components/chat/ChatView'
import { PageTitle } from '@/components/ui/PageTitle'

export function StudentChat() {
  return (
    <div className="space-y-4">
      <PageTitle title="Chat" icon="MessageCircle" />
      <ChatView />
    </div>
  )
}
