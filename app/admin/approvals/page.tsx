"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  ClipboardCheck,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  FileText,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import AdminSidebar from "@/components/admin-sidebar"
import { api, type Roadmap } from "@/lib/api"

type Pending = { thread_id: string; client_name: string; status: string; gap_count: number; seq: number }
type Gap = {
  feature_name: string
  category: string
  severity: string
  business_impact: string
  estimated_annual_roi: number
}

const SEV_COLOR: Record<string, string> = {
  Critical: "bg-red-100 text-red-700",
  High: "bg-orange-100 text-orange-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-slate-100 text-slate-600",
}
const POLL_MS = 6000

export default function ApprovalsPage() {
  const [pending, setPending] = useState<Pending[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [gaps, setGaps] = useState<Gap[]>([])
  const [findings, setFindings] = useState("")
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null)
  const [status, setStatus] = useState<string>("")
  const [dropped, setDropped] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const selectedRef = useRef<string | null>(null)
  selectedRef.current = selected

  const loadPending = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    try {
      const res = await api.audit.hitlPending()
      setPending(res.pending)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load queue")
    } finally {
      if (manual) setRefreshing(false)
    }
  }, [])

  // Auto-poll the queue so newly-submitted/finished audits appear without a manual
  // refresh. Pause while the tab is hidden so a backgrounded tab doesn't hammer the
  // server (and flood its logs).
  useEffect(() => {
    loadPending()
    let id: ReturnType<typeof setInterval> | null = null
    const start = () => {
      if (id == null) id = setInterval(() => loadPending(), POLL_MS)
    }
    const stop = () => {
      if (id != null) {
        clearInterval(id)
        id = null
      }
    }
    const onVisibility = () => (document.visibilityState === "visible" ? start() : stop())
    start()
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      stop()
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [loadPending])

  async function openAudit(threadId: string) {
    setSelected(threadId)
    setLoading(true)
    setDropped(new Set())
    setRoadmap(null)
    setError(null)
    try {
      const res = await api.audit.hitlState(threadId)
      setGaps(res.gaps || [])
      setFindings(res.tool_findings || "")
      setRoadmap(res.roadmap || null)
      setStatus(res.status || "")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load audit")
    } finally {
      setLoading(false)
    }
  }

  function toggleDrop(name: string) {
    setDropped((prev) => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  async function decide(approved: boolean) {
    if (!selected) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await api.audit.hitlApprove({
        thread_id: selected,
        approved,
        drop_gaps: Array.from(dropped),
      })
      if (approved && res.roadmap) {
        setRoadmap(res.roadmap)
        setStatus("complete")
      } else {
        setSelected(null)
      }
      await loadPending()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed")
    } finally {
      setSubmitting(false)
    }
  }

  const awaiting = pending.filter((p) => p.status === "awaiting_approval")
  const selectedMeta = pending.find((p) => p.thread_id === selected)
  const showReport = roadmap && (status === "complete" || selectedMeta?.status === "complete")

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <main className="flex-1 px-8 py-7">
        <header className="mb-7 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0a1628] flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#0a1628]">Audit Approvals</h1>
              <p className="text-sm text-slate-500">
                Review AI-generated gaps before the roadmap is released to the customer
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live · auto-refresh
            </span>
            <button
              onClick={() => loadPending(true)}
              className="flex items-center gap-2 text-sm font-semibold text-[#0a1628] bg-white border border-slate-200 rounded-xl px-3.5 py-2 hover:border-blue-400 hover:bg-blue-50 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </header>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Queue */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <h2 className="text-sm font-bold text-[#0a1628] mb-3">
                Queue · {awaiting.length} awaiting
              </h2>
              {pending.length === 0 && (
                <p className="text-sm text-slate-400 py-6 text-center">
                  No audits yet. Submit an onboarding form to start one — it appears here
                  automatically.
                </p>
              )}
              <div className="space-y-2">
                {pending.map((p) => (
                  <button
                    key={p.thread_id}
                    onClick={() => openAudit(p.thread_id)}
                    className={`w-full text-left rounded-xl border px-3 py-2.5 transition-all ${
                      selected === p.thread_id
                        ? "border-blue-400 bg-blue-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#0a1628] text-sm truncate">
                        {p.client_name}
                      </span>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{p.gap_count} gaps identified</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Review / Report panel */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 min-h-[300px]">
              {!selected && (
                <div className="text-center text-slate-400 py-16">
                  Select an audit from the queue to review its gaps.
                </div>
              )}

              {selected && loading && (
                <div className="flex items-center gap-2 text-slate-500 py-16 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading audit…
                </div>
              )}

              {selected && !loading && showReport && (
                <ReportView name={selectedMeta?.client_name} roadmap={roadmap!} />
              )}

              {selected && !loading && !showReport && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-[#0a1628]">{selectedMeta?.client_name}</h2>
                      <p className="text-xs text-slate-400">
                        Uncheck any gap the AI got wrong before approving.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-5">
                    {gaps.map((g) => {
                      const isDropped = dropped.has(g.feature_name)
                      return (
                        <label
                          key={g.feature_name}
                          className={`flex items-start gap-3 rounded-xl border px-3 py-3 cursor-pointer transition-all ${
                            isDropped ? "border-slate-200 bg-slate-50 opacity-50" : "border-slate-200"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={!isDropped}
                            onChange={() => toggleDrop(g.feature_name)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-[#0a1628]">
                                {g.feature_name}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  SEV_COLOR[g.severity] || "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {g.severity}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {g.category} · ROI ~${Math.round(g.estimated_annual_roi).toLocaleString()}/yr
                            </p>
                            <p className="text-xs text-slate-400 mt-1">{g.business_impact}</p>
                          </div>
                        </label>
                      )
                    })}
                  </div>

                  {findings && (
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 mb-5">
                      <p className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Tool agent ROI validation
                      </p>
                      <p className="text-xs text-slate-600 whitespace-pre-wrap">{findings}</p>
                    </div>
                  )}

                  {selectedMeta?.status === "awaiting_approval" && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => decide(true)}
                        disabled={submitting}
                        className="rounded-xl bg-[#0a1628] text-white px-5 py-2.5 flex items-center gap-2 text-sm font-semibold disabled:opacity-40 hover:bg-[#0a1628]/90"
                      >
                        {submitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        {submitting ? "Generating roadmap…" : "Approve & Generate Roadmap"}
                        {!submitting && dropped.size > 0 ? ` (drop ${dropped.size})` : ""}
                      </button>
                      <button
                        onClick={() => decide(false)}
                        disabled={submitting}
                        className="rounded-xl border border-slate-200 text-slate-600 px-4 py-2.5 flex items-center gap-2 text-sm font-semibold disabled:opacity-40 hover:bg-slate-50"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function ReportView({ name, roadmap }: { name?: string; roadmap: Roadmap }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-5 h-5 text-emerald-500" />
        <h2 className="text-lg font-bold text-[#0a1628]">{name} — Approved Roadmap</h2>
      </div>
      <p className="text-xs text-slate-400 mb-4 flex items-center gap-1">
        <FileText className="w-3 h-3" /> This is the final report released to the customer.
      </p>

      <div className="rounded-xl bg-[#0a1628] text-white p-4 mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-white/50 font-semibold">Total Estimated Annual ROI</p>
          <p className="text-2xl font-bold">
            ${Math.round(roadmap.total_estimated_roi).toLocaleString()}
          </p>
        </div>
        <TrendingUp className="w-8 h-8 text-blue-400" />
      </div>

      <p className="text-sm text-slate-600 mb-5 leading-relaxed">{roadmap.executive_summary}</p>

      <div className="space-y-3">
        {roadmap.phases.map((ph) => (
          <div key={ph.phase} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-[#0a1628] text-sm">
                Phase {ph.phase}: {ph.name}
              </h3>
              <span className="text-xs font-semibold text-emerald-600">
                ~${Math.round(ph.expected_roi).toLocaleString()}/yr
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-2">{ph.duration}</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {ph.gaps_addressed.map((g) => (
                <span key={g} className="text-[10px] bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">
                  {g}
                </span>
              ))}
            </div>
            <p className="text-xs text-slate-500">{ph.rationale}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    awaiting_approval: "bg-amber-100 text-amber-700",
    complete: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
  }
  const label: Record<string, string> = {
    awaiting_approval: "Pending",
    complete: "Approved",
    rejected: "Rejected",
  }
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${map[status] || "bg-slate-100 text-slate-600"}`}>
      {label[status] || status}
    </span>
  )
}
