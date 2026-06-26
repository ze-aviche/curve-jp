"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Clock, CheckCircle2, XCircle, ArrowRight, Download, Loader2 } from "lucide-react"
import { api } from "@/lib/api"

export type MyAudit = {
  thread_id: string
  status: string
  client_name: string
  roadmap: unknown | null
}

/** Reads the customer's audit thread_id (saved at onboarding) and its live state. */
export function useMyAudit(pollMs = 8000) {
  const [audit, setAudit] = useState<MyAudit | null>(null)
  const [loading, setLoading] = useState(true)
  const [threadId, setThreadId] = useState<string | null>(null)

  useEffect(() => {
    const id = typeof window !== "undefined" ? localStorage.getItem("auditThreadId") : null
    setThreadId(id)
    if (!id) {
      setLoading(false)
      return
    }
    let alive = true
    const fetchState = async () => {
      try {
        const s = await api.audit.hitlState(id)
        if (alive) setAudit(s as MyAudit)
      } catch {
        /* not ready yet */
      } finally {
        if (alive) setLoading(false)
      }
    }
    fetchState()
    // Poll while the audit is still in review, so "ready" appears automatically.
    const t = setInterval(fetchState, pollMs)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [pollMs])

  return { audit, loading, threadId }
}

/** Banner shown on the customer dashboard + audit pages. `variant` tweaks the CTA. */
export default function AuditStatusBanner({ variant = "dashboard" }: { variant?: "dashboard" | "audit" }) {
  const { audit, loading, threadId } = useMyAudit()

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-sm bg-white border border-slate-200 rounded-2xl px-5 py-4 mb-6">
        <Loader2 className="w-4 h-4 animate-spin" /> Checking your audit status…
      </div>
    )
  }

  if (!threadId || !audit) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 mb-6 flex items-center justify-between">
        <p className="text-sm text-slate-500">No audit in progress yet.</p>
        <Link href="/onboarding" className="text-sm font-semibold text-blue-600 flex items-center gap-1">
          Start an audit <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  if (audit.status === "complete") {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-semibold text-emerald-800 text-sm">Your audit report is ready</p>
            <p className="text-emerald-700/70 text-xs">{audit.client_name} · reviewed and approved by our team</p>
          </div>
        </div>
        {variant === "dashboard" ? (
          <Link
            href="/audit"
            className="text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl px-4 py-2 flex items-center gap-1.5"
          >
            View Report <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <a
            href={api.audit.reportPdfUrl(audit.thread_id)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl px-4 py-2 flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Download PDF
          </a>
        )}
      </div>
    )
  }

  if (audit.status === "rejected") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 mb-6 flex items-center gap-3">
        <XCircle className="w-5 h-5 text-red-600 shrink-0" />
        <div>
          <p className="font-semibold text-red-800 text-sm">Audit needs revision</p>
          <p className="text-red-700/70 text-xs">Our team will reach out about next steps.</p>
        </div>
      </div>
    )
  }

  // awaiting_approval (or anything in-flight)
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6 flex items-center gap-3">
      <Clock className="w-5 h-5 text-amber-600 shrink-0" />
      <div>
        <p className="font-semibold text-amber-800 text-sm">Audit in review</p>
        <p className="text-amber-700/70 text-xs">
          Our analysts are reviewing your results before your roadmap is finalized. This updates automatically.
        </p>
      </div>
    </div>
  )
}
