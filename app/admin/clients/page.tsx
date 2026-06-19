"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import AdminSidebar from "@/components/admin-sidebar"
import { Search, Plus, ArrowRight, CheckCircle2, Clock, AlertTriangle } from "lucide-react"
import Link from "next/link"

const allClients = [
  { id: 1, name: "Meridian Bank", logo: "MB", industry: "Financial Services", size: "250 agents", platform: "Genesys Cloud", status: "in_progress", score: 38, opportunity: "$1.2M", since: "Jun 2024" },
  { id: 2, name: "Pinnacle Insurance", logo: "PI", industry: "Insurance", size: "150 agents", platform: "Amazon Connect", status: "data_collection", score: null, opportunity: "TBD", since: "Jun 2024" },
  { id: 3, name: "NovaTech Solutions", logo: "NT", industry: "Technology", size: "300 agents", platform: "Five9", status: "completed", score: 79, opportunity: "$2M", since: "Apr 2024" },
  { id: 4, name: "Coastal Credit Union", logo: "CC", industry: "Financial Services", size: "80 agents", platform: "NICE CXone", status: "pending", score: null, opportunity: "TBD", since: "Jul 2024" },
]

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ComponentType<{ className?: string }> }> = {
  completed:       { label: "Completed",         color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle2 },
  in_progress:     { label: "Audit In Progress", color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200",    icon: Clock },
  data_collection: { label: "Data Collection",   color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   icon: AlertTriangle },
  pending:         { label: "Not Started",        color: "text-slate-500",   bg: "bg-slate-50",   border: "border-slate-200",   icon: Clock },
}

const filterLabels: Record<string, string> = {
  All: "All",
  in_progress: "In Progress",
  data_collection: "Data Collection",
  completed: "Completed",
  pending: "Not Started",
}

export default function ClientsPage() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("All")

  const filtered = allClients.filter(c =>
    (filter === "All" || c.status === filter) &&
    (c.name.toLowerCase().includes(search.toLowerCase()) || c.industry.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <main className="flex-1 p-8 lg:p-10 overflow-auto">
        <div className="max-w-6xl">

          {/* Page header */}
          <div className="flex items-center justify-between mb-10">
            <div>
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-1">Admin Console</p>
              <h1 className="text-3xl font-bold text-slate-900">Clients</h1>
              <p className="text-slate-500 text-base mt-1">
                {allClients.length} total · {allClients.filter(c => c.status === "in_progress" || c.status === "data_collection").length} active
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
                onChange={e => setSearch(e.target.value)}
                placeholder="Search clients..."
                className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-xl text-sm focus:outline-none focus:border-slate-400 transition-all"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {Object.keys(filterLabels).map(s => (
                <button key={s} onClick={() => setFilter(s)}
                  className={`h-11 px-4 rounded-xl text-sm font-semibold transition-all ${
                    filter === s ? "bg-[#0a1628] text-white" : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-800"
                  }`}>
                  {filterLabels[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Client grid */}
          <div className="grid lg:grid-cols-2 gap-5">
            {filtered.map((client, i) => {
              const sc = statusConfig[client.status]
              const Icon = sc.icon
              return (
                <motion.div key={client.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="bg-white border-2 border-slate-100 hover:border-slate-200 rounded-2xl p-6 transition-all shadow-sm">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-[#0a1628] rounded-xl flex items-center justify-center font-black text-white text-base shrink-0">
                        {client.logo}
                      </div>
                      <div>
                        <h3 className="text-slate-900 font-bold text-lg">{client.name}</h3>
                        <p className="text-slate-400 text-sm mt-0.5">{client.industry} · {client.size}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 border text-xs font-bold px-3 py-1.5 rounded-full ${sc.bg} ${sc.border} ${sc.color}`}>
                      <Icon className="w-3.5 h-3.5" />{sc.label}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-5">
                    {[
                      { label: "Platform", value: client.platform, highlight: false },
                      { label: "Score", value: client.score ? `${client.score}/100` : "Pending", highlight: !!client.score },
                      { label: "Savings / yr", value: client.opportunity, highlight: client.opportunity !== "TBD" },
                    ].map(({ label, value, highlight }) => (
                      <div key={label} className="text-center bg-slate-50 border border-slate-100 rounded-xl p-3">
                        <p className={`font-bold text-sm ${highlight ? "text-slate-900" : "text-slate-300"}`}>{value}</p>
                        <p className="text-slate-400 text-xs mt-1">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <span className="text-slate-400 text-sm">Since {client.since}</span>
                    <Link href="/admin/dashboard" className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                      View Audit <ArrowRight className="w-4 h-4" />
                    </Link>
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
