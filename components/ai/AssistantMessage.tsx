import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/utils/formatters'
import type { ChatMessage } from '@/types'

interface AssistantMessageProps {
  message: ChatMessage
}

function renderMarkdown(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, '<br />')
}

export function AssistantMessage({ message }: AssistantMessageProps) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="max-w-[78%]">
          <div className="bg-indigo-500/20 border border-indigo-500/30 rounded-2xl rounded-tr-sm px-4 py-3">
            <p className="text-sm text-foreground leading-relaxed">{message.content}</p>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 text-right">
            {formatRelativeTime(message.timestamp)}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 animate-fade-in">
      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500/40 to-violet-600/40 flex items-center justify-center shrink-0 border border-indigo-500/30 mt-0.5">
        <span className="text-xs">✦</span>
      </div>
      <div className="flex-1 max-w-[85%]">
        <div className="glass border border-white/[0.07] rounded-2xl rounded-tl-sm px-4 py-3">
          <p
            className="text-sm text-foreground/90 leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: `<p>${renderMarkdown(message.content)}</p>`,
            }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          Mnemo · {formatRelativeTime(message.timestamp)}
        </p>
      </div>
    </div>
  )
}
