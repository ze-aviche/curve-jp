"use client"

import { motion } from "framer-motion"
import AdminSidebar from "@/components/admin-sidebar"
import { Users, Database, DollarSign, AlertCircle, CheckCircle2, Clock, ArrowRight, Plus } from "lucide-react"
import Link from "next/link"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

const clientAudits = [
  {
    id: 1, name: "Meridian Bank", logo: "MB", status: "in_progress", progress: 48, dataCollected: 72, phase: "Analysis", start: "Jun 2", due: "Jun 30", alerts: 1,
    dataItems: [{ label: "Platform API", s: "done" }, { label: "Call Recordings", s: "done" }, { label: "Metrics Export", s: "done" }, { label: "IVR Config", s: "done" }, { label: "QA Reports", s: "partial" }, { label: "WFM Data", s: "pending" }, { label: "CRM Access", s: "pending" }],
  },
  {
    id: 2, name: "Pinnacle Insurance", logo: "PI", status: "data_collection", progress: 25, dataCollected: 35, phase: "Data Collection", start: "Jun 10", due: "Jul 22", alerts: 3,
    dataItems: [{ label: "Platform API", s: "done" }, { label: "Call Recordings", s: "partial" }, { label: "Metrics Export", s: "pending" }, { label: "IVR Config", s: "pending" }, { label: "QA Reports", s: "pending" }, { label: "WFM Data", s: "pending" }, { label: "CRM Access", s: "pending" }],
  },
  {
    id: 3, name: "NovaTech Solutions", logo: "NT", status: "completed", progress: 100, dataCollected: 100, phase: "Report Delivered", start: "Apr 15", due: "May 27", alerts: 0,
    dataItems: [{ label: "Platform API", s: "done" }, { label: "Call Recordings", s: "done" }, { label: "Metrics Export", s: "done" }, { label: "IVR Config", s: "done" }, { label: "QA Reports", s: "done" }, { label: "WFM Data", s: "done" }, { label: "CRM Access", s: "done" }],
  },
  {
    id: 4, name: "Coastal Credit Union", logo: "CC", status: "pending", progress: 0, dataCollected: 0, phase: "Not Started", start: "Jul 1", due: "Aug 12", alerts: 0,
    dataItems: [{ label: "Platform API", s: "pending" }, { label: "Call Recordings", s: "pending" }, { label: "Metrics Export", s: "pending" }, { label: "IVR Config", s: "pending" }, { label: "QA Reports", s: "pending" }, { label: "WFM Data", s: "pending" }, { label: "CRM Access", s: "pending" }],
  },
]

const monthlyRevenue = [
  { month: "Jan", revenue: 50 }, { month: "Feb", revenue: 50 }, { month: "Mar", revenue: 120 },
  { month: "Apr", revenue: 170 }, { month: "May", revenue: 220 }, { month: "Jun", revenue: 285 },
]

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  completed: { label: "Completed", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  in_progress: { label: "In Progress", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  data_collection: { label: "Data Collection", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  pending: { label: "Not Started", color: "text-slate-400", bg: "bg-slate-50", border: "border-slate-200" },
}

const dotColor: Record<string, string> = { done: "bg-emerald-500", partial: "bg-amber-400", pending: "bg-slate-200" }

export default function AdminDashboard() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-slate-900 text-2xl font-bold">Admin Overview</h1>
              <p className="text-slate-400 text-sm mt-1">Monitor all active audits and data collection progress</p>
            </div>
            <Link href="/admin/clients">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-[#0a1628] hover:bg-[#0a1628]/90 text-white text-sm font-semibold rounded-xl transition-all shadow-md">
                <Plus className="w-4 h-4" /> New Client
              </button>
            </Link>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Active Clients", value: "4", sub: "2 audits in progress", icon: Users, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
              { label: "Data Readiness", value: "54%", sub: "Avg across all", icon: Database, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
              { label: "Revenue (YTD)", value: "$285K", sub: "+65% vs last year", icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
              { label: "Open Alerts", value: "4", sub: "Need attention", icon: AlertCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
            ].map((card, i) => {
              const Icon = card.icon
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className={`${card.bg} border ${card.border} rounded-2xl p-5`}>
                  <Icon className={`w-5 h-5 ${card.color} mb-3`} />
                  <p className={`text-2xl font-black ${card.color}`}>{card.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{card.label}</p>
                  <p className="text-xs text-slate-300 mt-1">{card.sub}</p>
                </motion.div>
              )
            })}
          </div>

          {/* Data collection table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-slate-900 font-bold text-lg">Data Collection Status</h2>
              <span className="text-xs text-slate-300">Live · Updated now</span>
            </div>
            <div className="space-y-4">
              {clientAudits.map((client) => {
                const sc = statusConfig[client.status]
                return (
                  <motion.div key={client.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="border border-slate-100 rounded-xl p-5 hover:border-slate-200 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#0a1628] rounded-xl flex items-center justify-center font-bold text-white text-sm">{client.logo}</div>
                        <div>
                          <h3 className="text-slate-900 font-semibold">{client.name}</h3>
                          <p className="text-slate-400 text-xs">Phase: {client.phase} · Start: {client.start}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {client.alerts > 0 && <span className="bg-red-50 border border-red-200 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full">{client.alerts} alert{client.alerts > 1 ? "s" : ""}</span>}
                        <span className={`border text-xs font-semibold px-2.5 py-1 rounded-full ${sc.bg} ${sc.border} ${sc.color}`}>{sc.label}</span>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-400">Audit Progress</span>
                        <span className="text-slate-600 font-semibold">{client.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#0a1628] rounded-full" style={{ width: `${client.progress}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-xs text-slate-400">Data Collection ({client.dataCollected}%)</p>
                        {client.dataCollected >= 70
                          ? <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="w-3 h-3" />Ready</span>
                          : <span className="flex items-center gap-1 text-xs text-amber-500"><Clock className="w-3 h-3" />Awaiting data</span>}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {client.dataItems.map((item) => (
                          <div key={item.label} className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor[item.s]}`} />
                            {item.label}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
                      <p className="text-xs text-slate-300">Due: {client.due}</p>
                      <button className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold">View Details <ArrowRight className="w-3 h-3" /></button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-slate-900 font-semibold mb-4">Revenue (YTD, $K)</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={monthlyRevenue}>
                  <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, color: "#0f172a" }} />
                  <Line type="monotone" dataKey="revenue" stroke="#0a1628" strokeWidth={2} dot={{ fill: "#0a1628" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-slate-900 font-semibold mb-4">Alerts Requiring Action</h3>
              <div className="space-y-2.5">
                {[
                  { client: "Pinnacle Insurance", msg: "Call recordings access expired", severity: "high" },
                  { client: "Pinnacle Insurance", msg: "Metrics export missing WFM data", severity: "medium" },
                  { client: "Pinnacle Insurance", msg: "Stakeholder interview not scheduled", severity: "low" },
                  { client: "Meridian Bank", msg: "QA reports partially received", severity: "medium" },
                ].map((alert, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${alert.severity === "high" ? "bg-red-50 border-red-200" : alert.severity === "medium" ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200"}`}>
                    <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${alert.severity === "high" ? "text-red-500" : alert.severity === "medium" ? "text-amber-500" : "text-slate-400"}`} />
                    <div>
                      <p className="text-xs font-semibold text-slate-700">{alert.client}</p>
                      <p className="text-xs text-slate-500">{alert.msg}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
