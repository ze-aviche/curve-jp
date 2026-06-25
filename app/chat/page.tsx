"use client"

import { useEffect, useRef, useState } from "react"
import { Send, MessageSquare, FileText, Loader2, ShieldCheck, ShieldAlert } from "lucide-react"
import CustomerSidebar from "@/components/customer-sidebar"
import { api } from "@/lib/api"

type Source = { source: string; distance: number }
type Guardrail = { score?: number; blocked?: boolean; grounded?: boolean } | null
type Msg = {
  role: "user" | "assistant"
  content: string
  sources?: Source[]
  grounded?: boolean
  guardrail?: Guardrail
}

const SUGGESTIONS = [
  "How many days a week can agents work from home?",
  "What is the policy on logging handle time?",
  "Summarize the remote work policy.",
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  async function send(question: string) {
    const q = question.trim()
    if (!q || loading) return
    setError(null)
    setInput("")

    // History = the conversation so far (before this question).
    const history = messages.map((m) => ({ role: m.role, content: m.content }))
    setMessages((prev) => [...prev, { role: "user", content: q }])
    setLoading(true)

    try {
      const res = await api.chat.ask(q, history)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.answer,
          sources: res.sources,
          grounded: res.grounded,
          guardrail: res.guardrail as Guardrail,
        },
      ])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <CustomerSidebar />

      <main className="flex-1 flex flex-col h-screen">
        {/* Header */}
        <header className="border-b border-slate-200 bg-white px-8 py-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0a1628] flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#0a1628]">Policy Chat</h1>
              <p className="text-sm text-slate-500">
                Grounded answers from your ingested policy documents
              </p>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-3xl mx-auto space-y-5">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-500 mb-5">Ask a question about your company policies.</p>
                <div className="flex flex-col items-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-sm text-[#0a1628] bg-white border border-slate-200 rounded-full px-4 py-2 hover:border-blue-400 hover:bg-blue-50 transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    m.role === "user"
                      ? "bg-[#0a1628] text-white"
                      : "bg-white border border-slate-200 text-slate-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>

                  {m.role === "assistant" && m.guardrail && (
                    <div className="mt-2.5">
                      {m.guardrail.blocked ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-md px-2 py-1">
                          <ShieldAlert className="w-3 h-3" />
                          Guardrail: blocked ungrounded answer
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md px-2 py-1">
                          <ShieldCheck className="w-3 h-3" />
                          Grounded
                          {typeof m.guardrail.score === "number"
                            ? ` (${Math.round(m.guardrail.score * 100)}%)`
                            : ""}
                        </span>
                      )}
                    </div>
                  )}

                  {m.role === "assistant" && m.sources && m.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-xs font-semibold text-slate-400 mb-1.5">Sources</p>
                      <div className="flex flex-wrap gap-1.5">
                        {m.sources.map((s) => (
                          <span
                            key={s.source}
                            title={`cosine distance ${s.distance}`}
                            className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 rounded-md px-2 py-1"
                          >
                            <FileText className="w-3 h-3" />
                            {s.source}
                            <span className="text-slate-400">{s.distance}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-2 text-slate-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching policy documents…
                </div>
              </div>
            )}

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <div ref={endRef} />
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-slate-200 bg-white px-8 py-4 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
            className="max-w-3xl mx-auto flex items-center gap-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a company policy…"
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm text-[#0a1628] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-xl bg-[#0a1628] text-white px-5 py-3 flex items-center gap-2 text-sm font-semibold disabled:opacity-40 hover:bg-[#0a1628]/90 transition-all"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
