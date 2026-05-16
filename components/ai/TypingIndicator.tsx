export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 animate-fade-in">
      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500/40 to-violet-600/40 flex items-center justify-center shrink-0 border border-indigo-500/30">
        <span className="text-xs">✦</span>
      </div>
      <div className="glass border border-white/[0.07] rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}
