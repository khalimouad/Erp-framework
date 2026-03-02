import { useState, useRef, useEffect } from 'react'
import { Sparkles, X, Send, Bot, User, Loader2 } from 'lucide-react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { aiApi } from '@/api/client'

interface Message {
  role: 'user' | 'ai'
  text: string
}

const SUGGESTIONS = [
  'How do I create a sales order?',
  'Where can I manage employees?',
  'How does role-based access work?',
  'What is the Ctrl+K shortcut?',
]

export function AiChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: "Hi! I'm your NextERP assistant. Ask me anything about the system — navigation, modules, features, or workflows." },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const send = async (text: string = input) => {
    const q = text.trim()
    if (!q || loading) return
    setInput('')
    setMessages(m => [...m, { role: 'user', text: q }])
    setLoading(true)
    try {
      const res = await aiApi.ask(q)
      setMessages(m => [...m, { role: 'ai', text: res.data.answer }])
    } catch {
      setMessages(m => [...m, { role: 'ai', text: 'Sorry, I could not reach the AI service. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return createPortal(
    <>
      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-[55] w-80 sm:w-96 flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-gray-200 bg-white"
          style={{ maxHeight: 'calc(100vh - 120px)' }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-none">NextERP Assistant</p>
              <p className="text-[11px] text-white/70 mt-0.5">Powered by AI</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={clsx('flex gap-2', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                {/* Avatar */}
                <div className={clsx(
                  'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                  msg.role === 'ai'
                    ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-600',
                )}>
                  {msg.role === 'ai' ? <Bot size={14} /> : <User size={14} />}
                </div>

                {/* Bubble */}
                <div className={clsx(
                  'max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                  msg.role === 'ai'
                    ? 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm'
                    : 'bg-indigo-600 text-white rounded-tr-sm',
                )}>
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Loading dots */}
            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Bot size={14} />
                </div>
                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Suggestions (shown only on first load with just the welcome message) */}
          {messages.length === 1 && !loading && (
            <div className="px-3 pb-2 bg-gray-50 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-end gap-2 px-3 py-3 border-t border-gray-100 bg-white shrink-0">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything..."
              className="flex-1 resize-none text-sm text-gray-800 placeholder-gray-400 outline-none rounded-xl border border-gray-200 px-3 py-2 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all max-h-28 overflow-y-auto"
              style={{ minHeight: '40px' }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className={clsx(
                'p-2.5 rounded-xl transition-all shrink-0',
                input.trim() && !loading
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed',
              )}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={clsx(
          'fixed bottom-6 right-6 z-[55] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 group',
          open
            ? 'bg-indigo-700 text-white rotate-12 scale-95'
            : 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white hover:scale-110 hover:shadow-indigo-300/60 hover:shadow-xl',
        )}
        title="AI Assistant"
      >
        {open ? <X size={22} /> : <Sparkles size={22} />}

        {/* Pulse ring (when closed) */}
        {!open && (
          <span className="absolute inset-0 rounded-full animate-ping bg-indigo-400 opacity-20 pointer-events-none" />
        )}
      </button>
    </>,
    document.body,
  )
}
