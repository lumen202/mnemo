'use client'
import { useRouter } from 'next/navigation'
import { formatRelativeTime } from '@/utils/formatters'
import type { ChatMessage } from '@/types'

interface AssistantMessageProps {
  message: ChatMessage
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function inlineFormat(text: string): string {
  return escHtml(text)
    .replace(/`([^`]+)`/g, '<code class="bg-white/10 rounded px-1 py-0.5 text-xs font-mono text-indigo-300">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em class="text-foreground/80">$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, linkText, href) => {
      const safe = href.startsWith('/') || href.startsWith('https://')
      if (!safe) return `[${linkText}](${href})`
      return `<a href="${href}" class="inline-flex items-center gap-1 font-semibold text-indigo-400 bg-indigo-500/15 border border-indigo-500/30 rounded-lg px-2.5 py-1 text-xs hover:bg-indigo-500/25 hover:text-indigo-300 transition-colors">${linkText}</a>`
    })
}

function renderMarkdown(text: string): string {
  const lines = text.split('\n')
  const result: string[] = []
  let inCodeBlock = false
  let codeLines: string[] = []

  const flushCode = () => {
    result.push(
      `<pre class="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 my-2 overflow-x-auto text-xs font-mono text-foreground/80 whitespace-pre">${escHtml(codeLines.join('\n'))}</pre>`
    )
    codeLines = []
  }

  for (const line of lines) {
    const fenceMatch = line.match(/^```(\w*)/)
    if (fenceMatch) {
      if (inCodeBlock) {
        flushCode()
        inCodeBlock = false
      } else {
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeLines.push(line)
      continue
    }

    // Headers
    const h3 = line.match(/^### (.+)/)
    const h2 = line.match(/^## (.+)/)
    const h1 = line.match(/^# (.+)/)
    if (h3) { result.push(`<h3 class="font-semibold text-foreground mt-3 mb-1 text-sm">${inlineFormat(h3[1])}</h3>`); continue }
    if (h2) { result.push(`<h2 class="font-semibold text-foreground mt-4 mb-1">${inlineFormat(h2[1])}</h2>`); continue }
    if (h1) { result.push(`<h1 class="font-bold text-foreground mt-4 mb-2 text-base">${inlineFormat(h1[1])}</h1>`); continue }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      result.push('<hr class="border-white/10 my-3" />')
      continue
    }

    // Unordered list
    const ulMatch = line.match(/^[-*+] (.+)/)
    if (ulMatch) { result.push(`<li class="ml-5 mb-0.5 text-sm leading-relaxed list-disc">${inlineFormat(ulMatch[1])}</li>`); continue }

    // Ordered list
    const olMatch = line.match(/^\d+\. (.+)/)
    if (olMatch) { result.push(`<li class="ml-5 mb-0.5 text-sm leading-relaxed list-decimal">${inlineFormat(olMatch[1])}</li>`); continue }

    // Blockquote
    const bqMatch = line.match(/^> (.+)/)
    if (bqMatch) {
      result.push(`<blockquote class="border-l-2 border-indigo-500/40 pl-3 text-foreground/70 italic text-sm my-1">${inlineFormat(bqMatch[1])}</blockquote>`)
      continue
    }

    // Empty line → spacing
    if (line.trim() === '') {
      result.push('<div class="h-1.5"></div>')
      continue
    }

    result.push(`<p class="text-sm leading-relaxed">${inlineFormat(line)}</p>`)
  }

  // Flush any unclosed code block (common during streaming)
  if (inCodeBlock && codeLines.length > 0) flushCode()

  return result.join('')
}

export function AssistantMessage({ message }: AssistantMessageProps) {
  const router = useRouter()
  const isUser = message.role === 'user'

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const anchor = (e.target as HTMLElement).closest('a')
    if (!anchor) return
    const href = anchor.getAttribute('href')
    if (href?.startsWith('/')) {
      e.preventDefault()
      router.push(href)
    }
  }

  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="max-w-[78%]">
          <div className="bg-indigo-500/20 border border-indigo-500/30 rounded-2xl rounded-tr-sm px-4 py-3">
            <p className="text-sm text-foreground leading-relaxed">{message.content}</p>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 text-right" suppressHydrationWarning>
            {formatRelativeTime(message.timestamp)}
          </p>
        </div>
      </div>
    )
  }

  const isEmpty = !message.content || message.content === '…'

  return (
    <div className="flex items-start gap-3 animate-fade-in">
      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500/40 to-violet-600/40 flex items-center justify-center shrink-0 border border-indigo-500/30 mt-0.5">
        <span className="text-xs">✦</span>
      </div>
      <div className="flex-1 max-w-[85%]">
        <div className="glass border border-white/[0.07] rounded-2xl rounded-tl-sm px-4 py-3">
          {isEmpty ? (
            <span className="inline-flex gap-1 items-center text-muted-foreground text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:300ms]" />
            </span>
          ) : (
            <div
              className="text-sm text-foreground/90 leading-relaxed prose-invert"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
              onClick={handleContentClick}
            />
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1" suppressHydrationWarning>
          Mnemo · {formatRelativeTime(message.timestamp)}
        </p>
      </div>
    </div>
  )
}
