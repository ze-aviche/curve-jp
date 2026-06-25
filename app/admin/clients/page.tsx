"use client"

import { useCallback, useEffect, useState } from "react"
import { motion } from "framer-motion"
import AdminSidebar from "@/components/admin-sidebar"
import {
  Search,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Download,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { api } from "@/lib/api"

type Client = {
  thread_id: string
  client_name: string
  status: string
  gap_count: number
  seq: number
  platform?: string | null
  industry?: string | null
}

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  complete: { label: "Approved", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle2 },
  awaiting_approval: { label: "Awaiting Approval", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", icon: Clock },
  rejected: { label: "Rejected", color: "text-red-700", bg: "bg-red-50", border: "border-red-200", icon: XCircle },
}

const filterLabels: Record<string, string> = {
  All: "All",
  awaiting_approval: "Awaiting Approval",
  complete: "Approved",
  rejected: "Rejected",
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?"
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("All")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await api.audit.hitlPending()
      setClients(res.pending)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load clients")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = clients.filter(
    (c) =>
      (filter === "All" || c.status === filter) &&
      (c.client_name.toLowerCase().includes(search.toLowerCase()) ||
        (c.industry || "").toLowerCase().includes(search.toLowerCase())),
  )
  const active = clients.filter((c) => c.status === "awaiting_approval").length

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <main className="flex-1 p-8 lg:p-10 overflow-auto">
        <div className="max-w-6xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div>
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-1">Admin Console</p>
              <h1 className="text-3xl font-bold text-slate-900">Clients</h1>
              <p className="text-slate-500 text-base mt-1">
                {clients.length} total · {active} awaiting approval
              </p>
            </div>
            <Link href="/onboarding">
              <button className="flex items-center gap-2 px-6 py-3 bg-[#0a1628] hover:bg-[#0a1628]/90 text-white text-sm font-semibold rounded-xl transition-colors shadow-md">
                <Plus className="w-4 h-4" /> Add Client
              </button>
            </Link>
          </div>

          {/* Search + filters */}
          <div className="flex flex-wrap gap-3 mb-8">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search clients..."
                className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-xl text-sm focus:outline-none focus:border-slate-400 transition-all"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {Object.keys(filterLabels).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`h-11 px-4 rounded-xl text-sm font-semibold transition-all ${
                    filter === s
                      ? "bg-[#0a1628] text-white"
                      : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-800"
                  }`}
                >
                  {filterLabels[s]}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 text-slate-500 py-16 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading clients…
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center text-slate-400 py-16 bg-white border border-slate-200 rounded-2xl">
              No clients yet. Submit an{" "}
              <Link href="/onboarding" className="text-blue-600 font-semibold">
                onboarding form
              </Link>{" "}
              to create one.
            </div>
          )}

          {/* Client grid */}
          <div className="grid lg:grid-cols-2 gap-5">
            {filtered.map((client, i) => {
              const sc = statusConfig[client.status] || statusConfig.awaiting_approval
              const Icon = sc.icon
              const isComplete = client.status === "complete"
              return (
                <motion.div
                  key={client.thread_id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white border-2 border-slate-100 hover:border-slate-200 rounded-2xl p-6 transition-all shadow-sm"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-[#0a1628] rounded-xl flex items-center justify-center font-black text-white text-base shrink-0">
                        {initials(client.client_name)}
                      </div>
                      <div>
                        <h3 className="text-slate-900 font-bold text-lg">{client.client_name}</h3>
                        <p className="text-slate-400 text-sm mt-0.5">
                          {client.industry || "—"} · {client.platform || "—"}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 border text-xs font-bold px-3 py-1.5 rounded-full ${sc.bg} ${sc.border} ${sc.color}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {sc.label}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="text-center bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <p className="font-bold text-sm text-slate-900">{client.gap_count}</p>
                      <p className="text-slate-400 text-xs mt-1">Gaps Identified</p>
                    </div>
                    <div className="text-center bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <p className={`font-bold text-sm ${isComplete ? "text-emerald-600" : "text-slate-300"}`}>
                        {isComplete ? "Ready" : "Pending"}
                      </p>
                      <p className="text-slate-400 text-xs mt-1">Final Report</p>
                    </div>
                  </div>

                  {/* Document downloads */}
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                    <a
                      href={api.audit.onboardingPdfUrl(client.thread_id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-[#0a1628] transition-colors"
                    >
                      <FileText className="w-4 h-4" /> Onboarding PDF
                    </a>
                    {isComplete ? (
                      <a
                        href={api.audit.reportPdfUrl(client.thread_id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors ml-auto"
                      >
                        <Download className="w-4 h-4" /> Audit Report PDF
                      </a>
                    ) : (
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-300 ml-auto cursor-not-allowed">
                        <Download className="w-4 h-4" /> Report pending approval
                      </span>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
