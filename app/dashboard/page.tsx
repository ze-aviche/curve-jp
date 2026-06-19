"use client"

import { motion } from "framer-motion"
import { TrendingUp, AlertTriangle, CheckCircle2, Clock, DollarSign, ArrowRight, Bell } from "lucide-react"
import Link from "next/link"
import { categories } from "@/lib/data"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

const gapSummary = [
  { label: "Critical", count: 5, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  { label: "High", count: 8, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
  { label: "Medium", count: 10, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  { label: "Low", count: 5, color: "text-slate-400", bg: "bg-slate-50", border: "border-slate-200" },
]

const recentActivity = [
  { text: "Platform API connected successfully", time: "2 hours ago", icon: CheckCircle2, color: "text-emerald-500" },
  { text: "Call recordings sample received (72 files)", time: "5 hours ago", icon: CheckCircle2, color: "text-emerald-500" },
  { text: "Stakeholder interviews scheduled", time: "1 day ago", icon: Clock, color: "text-sky-500" },
  { text: "Compliance review flagged 3 issues", time: "2 days ago", icon: AlertTriangle, color: "text-amber-500" },
]

export default function CustomerDashboard() {
  return (
    <div className="p-8 max-w-7xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-slate-900 text-2xl font-bold">Your Audit Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Meridian Bank · Audit started Jun 2, 2024</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full text-white text-xs flex items-center justify-center">3</span>
          </button>
          <Link href="/audit">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-[#0a1628] hover:bg-[#0a1628]/90 text-white text-sm font-semibold rounded-xl transition-all shadow-md">
              View Full Report <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>
      </div>

      {/* Audit progress */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 bg-white p-6 mb-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-slate-900 font-semibold">Audit Progress</h2>
            <p className="text-slate-400 text-sm">On track for delivery</p>
          </div>
          <span className="text-2xl font-black text-blue-600">48%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-blue-600 rounded-full" style={{ width: "48%" }} />
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Discovery", done: true },
            { label: "Data Collection", done: true },
            { label: "Analysis", done: false, active: true },
            { label: "Report Delivery", done: false },
          ].map((phase) => (
            <div key={phase.label} className={`text-center p-3 rounded-xl border ${phase.done ? "bg-emerald-50 border-emerald-200" : phase.active ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-200"}`}>
              {phase.done
                ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                : phase.active
                ? <div className="w-4 h-4 border-2 border-blue-600 rounded-full mx-auto mb-1 animate-pulse" />
                : <div className="w-4 h-4 border border-slate-200 rounded-full mx-auto mb-1" />}
              <p className={`text-xs font-medium ${phase.done ? "text-emerald-600" : phase.active ? "text-blue-600" : "text-slate-300"}`}>{phase.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          { label: "Capability Score", value: "38/100", sub: "Industry avg: 55", icon: TrendingUp, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
          { label: "Gaps Found", value: "28", sub: "5 critical priority", icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
          { label: "Est. Annual Savings", value: "$1.2M", sub: "Identified so far", icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
          { label: "Days to Delivery", value: "18", sub: "On schedule", icon: Clock, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
        ].map((card, i) => {
          const Icon = card.icon
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className={`${card.bg} border ${card.border} rounded-2xl p-5`}>
              <Icon className={`w-5 h-5 ${card.color} mb-3`} />
              <p className={`text-2xl font-black ${card.color} mb-0.5`}>{card.value}</p>
              <p className="text-xs text-slate-500">{card.label}</p>
              <p className="text-xs text-slate-400 mt-1">{card.sub}</p>
            </motion.div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        {/* Bar chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-slate-900 font-semibold mb-4">Score by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categories} layout="vertical" margin={{ left: 0 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} width={145} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8 }} formatter={(v) => [`${v}/100`, "Score"]} />
              <Bar dataKey="score" fill="#0a1628" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gap priorities */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-slate-900 font-semibold mb-4">Gap Priorities</h3>
          <div className="space-y-2.5 mb-5">
            {gapSummary.map((g) => (
              <div key={g.label} className={`${g.bg} border ${g.border} rounded-xl p-3 flex items-center justify-between`}>
                <span className={`text-sm font-medium ${g.color}`}>{g.label}</span>
                <span className={`text-2xl font-black ${g.color}`}>{g.count}</span>
              </div>
            ))}
          </div>
          <Link href="/audit">
            <button className="w-full py-2.5 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-400 hover:text-blue-600 text-sm rounded-xl transition-all flex items-center justify-center gap-2">
              View All Gaps <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-slate-900 font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentActivity.map((item, i) => {
            const Icon = item.icon
            return (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
                <Icon className={`w-4 h-4 flex-shrink-0 ${item.color}`} />
                <span className="text-sm text-slate-600 flex-1">{item.text}</span>
                <span className="text-xs text-slate-300">{item.time}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
