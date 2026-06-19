"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import AdminSidebar from "@/components/admin-sidebar"
import { Search, Plus, ArrowRight, CheckCircle2, Clock, AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"

const allClients = [
  { id: 1, name: "Meridian Bank", logo: "MB", industry: "Financial Services", size: "250 agents", platform: "Genesys Cloud", status: "in_progress", score: 38, opportunity: "$1.2M", since: "Jun 2024" },
  { id: 2, name: "Pinnacle Insurance", logo: "PI", industry: "Insurance", size: "150 agents", platform: "Amazon Connect", status: "data_collection", score: null, opportunity: "TBD", since: "Jun 2024" },
  { id: 3, name: "NovaTech Solutions", logo: "NT", industry: "Technology", size: "300 agents", platform: "Five9", status: "completed", score: 79, opportunity: "$2M", since: "Apr 2024" },
  { id: 4, name: "Coastal Credit Union", logo: "CC", industry: "Financial Services", size: "80 agents", platform: "NICE CXone", status: "pending", score: null, opportunity: "TBD", since: "Jul 2024" },
]

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  completed: { label: "Completed", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20", icon: CheckCircle2 },
  in_progress: { label: "Audit In Progress", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", icon: Clock },
  data_collection: { label: "Data Collection", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", icon: AlertTriangle },
  pending: { label: "Not Started", color: "text-gray-500", bg: "bg-gray-500/10 border-gray-500/20", icon: Clock },
}

export default function ClientsPage() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("All")

  const filtered = allClients.filter(c =>
    (filter === "All" || c.status === filter) &&
    (c.name.toLowerCase().includes(search.toLowerCase()) || c.industry.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="flex min-h-screen bg-[#0a1628]">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-white text-2xl font-bold">Clients</h1>
              <p className="text-gray-400 text-sm mt-1">{allClients.length} total clients · {allClients.filter(c => c.status === "in_progress" || c.status === "data_collection").length} active</p>
            </div>
            <Link href="/onboarding">
              <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors">
                <Plus className="w-4 h-4" />Add Client
              </button>
            </Link>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients..."
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl" />
            </div>
            <div className="flex gap-2">
              {["All", "in_progress", "data_collection", "completed", "pending"].map(s => (
                <button key={s} onClick={() => setFilter(s)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${filter === s ? "bg-blue-600 text-white" : "bg-white/5 text-gray-400 border border-white/10 hover:border-white/20"}`}>
                  {s === "All" ? "All" : statusConfig[s]?.label}
                </button>
              ))}
            </div>
          </div>

          {/* Client grid */}
          <div className="grid lg:grid-cols-2 gap-4">
            {filtered.map((client, i) => {
              const sc = statusConfig[client.status]
              const Icon = sc.icon
              return (
                <motion.div key={client.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white">{client.logo}</div>
                      <div>
                        <h3 className="text-white font-bold">{client.name}</h3>
                        <p className="text-gray-500 text-xs">{client.industry} · {client.size}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 border text-xs font-semibold px-2.5 py-1 rounded-full ${sc.bg} ${sc.color}`}>
                      <Icon className="w-3 h-3" />{sc.label}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center bg-white/3 rounded-xl p-2.5">
                      <p className="text-white font-bold text-sm">{client.platform}</p>
                      <p className="text-gray-600 text-xs">Platform</p>
                    </div>
                    <div className="text-center bg-white/3 rounded-xl p-2.5">
                      <p className={`font-bold text-sm ${client.score ? "text-white" : "text-gray-600"}`}>
                        {client.score ? `${client.score}/100` : "Pending"}
                      </p>
                      <p className="text-gray-600 text-xs">Score</p>
                    </div>
                    <div className="text-center bg-white/3 rounded-xl p-2.5">
                      <p className={`font-bold text-sm ${client.opportunity !== "TBD" ? "text-green-400" : "text-gray-600"}`}>
                        {client.opportunity}
                      </p>
                      <p className="text-gray-600 text-xs">Savings / yr</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Since {client.since}</span>
                    <Link href="/admin/dashboard" className="flex items-center gap-1.5 text-blue-400 font-semibold hover:text-blue-300">
                      View Audit<ArrowRight className="w-3 h-3" />
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
