'use client'
import { useState, useRef, useEffect } from 'react'
import { Send, RefreshCw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AssistantMessage } from './AssistantMessage'
import { TypingIndicator } from './TypingIndicator'
import { useAIStore } from '@/store'
import { SUGGESTED_QUESTIONS } from '@/data/mockData'
import { cn } from '@/lib/utils'
import type { TutorResponse } from '@/services/ai/types'

// Remove <think>...</think> blocks that Qwen3 models emit.
// Strips complete blocks and hides any in-progress (unclosed) block during streaming.
function stripThinking(text: string): string {
  let out = text.replace(/<think>[\s\S]*?<\/think>/g, '')
  const openIdx = out.lastIndexOf('<think>')
  if (openIdx !== -1) out = out.slice(0, openIdx)
  return out.trim()
}

export function ChatInterface() {
  const { messages, isTyping, addMessage, updateMessage, setTyping, clearChat } = useAIStore()
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages, isTyping])

  const sendMessage = async (content: string) => {
    if (!content.trim() || isTyping || isStreaming) return

    addMessage({
      id: `msg_${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    })
    setInput('')
    setTyping(true)

    const assistantId = `msg_${Date.now() + 1}`

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content.trim() }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const contentType = res.headers.get('content-type') ?? ''

      if (contentType.includes('text/plain') && res.body) {
        // Streaming mode — add placeholder message and stream tokens into it
        addMessage({ id: assistantId, role: 'assistant', content: '', timestamp: new Date().toISOString() })
        setTyping(false)
        setIsStreaming(true)

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let raw = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          raw += decoder.decode(value, { stream: true })
          const display = stripThinking(raw)
          updateMessage(assistantId, display || '…')
        }

        const final = stripThinking(raw)
        updateMessage(
          assistantId,
          final || 'I had trouble generating a response. Please try again.'
        )
      } else {
        // JSON mode (mock / fallback)
        const data: TutorResponse | { error: string } = await res.json()
        const responseContent =
          'error' in data ? 'Sorry, I ran into an error. Please try again.' : data.content
        addMessage({ id: assistantId, role: 'assistant', content: responseContent, timestamp: new Date().toISOString() })
        setTyping(false)
      }
    } catch {
      if (messages.find((m) => m.id === assistantId)) {
        updateMessage(assistantId, 'Connection issue — please check your network and try again.')
      } else {
        addMessage({
          id: assistantId,
          role: 'assistant',
          content: 'Connection issue — please check your network and try again.',
          timestamp: new Date().toISOString(),
        })
      }
      setTyping(false)
    } finally {
      setIsStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const isBusy = isTyping || isStreaming

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef as React.Ref<HTMLDivElement>}>
        <div className="py-4 space-y-4 max-w-3xl mx-auto">
          {messages.map((msg) => (
            <AssistantMessage key={msg.id} message={msg} />
          ))}
          {isTyping && !isStreaming && <TypingIndicator />}
        </div>
      </ScrollArea>

      {/* Suggested questions */}
      {messages.length <= 1 && !isBusy && (
        <div className="px-4 pb-2">
          <p className="text-xs text-muted-foreground mb-2 text-center">Try asking...</p>
          <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
            {SUGGESTED_QUESTIONS.slice(0, 4).map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className={cn(
                  'text-xs glass border border-white/[0.07] rounded-full px-3 py-1.5',
                  'text-muted-foreground hover:text-foreground hover:border-indigo-500/40 transition-all duration-200',
                  'hover:bg-indigo-500/10'
                )}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2 items-end glass border border-white/[0.07] rounded-2xl p-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your AI tutor anything — explain a concept, generate a quiz, create flashcards..."
              className="flex-1 min-h-[44px] max-h-32 border-0 bg-transparent focus-visible:ring-0 resize-none py-2 px-2 text-sm"
              rows={1}
            />
            <div className="flex gap-1.5 pb-1 shrink-0">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={clearChat}
                disabled={isBusy}
                className="text-muted-foreground hover:text-foreground"
                title="Clear chat"
              >
                <RefreshCw size={14} />
              </Button>
              <Button
                size="icon-sm"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isBusy}
                className="rounded-xl"
              >
                <Send size={14} />
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
            <Sparkles size={10} className="text-indigo-400" />
            Powered by AI · Personalized to your study context
          </p>
        </div>
      </div>
    </div>
  )
}
