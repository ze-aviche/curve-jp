"use client"

import { motion } from "framer-motion"
import { TrendingUp, AlertTriangle, CheckCircle2, Clock, DollarSign, ArrowRight, Bell } from "lucide-react"
import Link from "next/link"
import { categories } from "@/lib/data"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

const recentActivity = [
  { text: "Platform API connected successfully", time: "2 hours ago", icon: CheckCircle2, iconBg: "bg-emerald-50 border-emerald-200", iconColor: "text-emerald-600" },
  { text: "Call recordings sample received (72 files)", time: "5 hours ago", icon: CheckCircle2, iconBg: "bg-emerald-50 border-emerald-200", iconColor: "text-emerald-600" },
  { text: "Stakeholder interviews scheduled", time: "1 day ago", icon: Clock, iconBg: "bg-blue-50 border-blue-200", iconColor: "text-blue-600" },
  { text: "Compliance review flagged 3 issues", time: "2 days ago", icon: AlertTriangle, iconBg: "bg-amber-50 border-amber-200", iconColor: "text-amber-600" },
]

const phases = [
  { label: "Discovery", done: true },
  { label: "Data Collection", done: true },
  { label: "Analysis", done: false, active: true },
  { label: "Report Delivery", done: false },
]

const kpis = [
  { label: "Capability Score", value: "38/100", sub: "Industry avg: 55", icon: TrendingUp, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", iconColor: "text-red-500" },
  { label: "Gaps Found", value: "28", sub: "5 critical priority", icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", iconColor: "text-orange-500" },
  { label: "Est. Annual Savings", value: "$1.2M", sub: "Identified so far", icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", iconColor: "text-emerald-500" },
  { label: "Days to Delivery", value: "18", sub: "On schedule", icon: Clock, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", iconColor: "text-blue-500" },
]

const gapSummary = [
  { label: "Critical", count: 5, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  { label: "High", count: 8, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
  { label: "Medium", count: 10, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  { label: "Low", count: 5, color: "text-slate-400", bg: "bg-slate-50", border: "border-slate-200" },
]

export default function CustomerDashboard() {
  return (
    <div className="p-8 lg:p-10 max-w-7xl">

      {/* Page header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-1">Meridian Bank</p>
          <h1 className="text-3xl font-bold text-slate-900">Audit Dashboard</h1>
          <p className="text-slate-500 text-base mt-1">Audit started Jun 2, 2024</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative w-11 h-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 shadow-sm transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#0a1628] rounded-full text-white text-xs flex items-center justify-center font-bold">3</span>
          </button>
          <Link href="/audit">
            <button className="flex items-center gap-2 px-6 py-3 bg-[#0a1628] hover:bg-[#0a1628]/90 text-white text-sm font-semibold rounded-xl transition-all shadow-md">
              View Full Report <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>

      {/* Audit progress */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-200 bg-white p-7 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Audit Progress</h2>
            <p className="text-slate-500 text-sm mt-0.5">On track for delivery</p>
          </div>
          <span className="text-3xl font-black text-[#0a1628]">48%</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-6">
          <div className="h-full bg-[#0a1628] rounded-full transition-all" style={{ width: "48%" }} />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {phases.map((phase) => (
            <div key={phase.label} className={`text-center p-4 rounded-xl border-2 transition-all ${
              phase.done ? "bg-emerald-50 border-emerald-300"
              : phase.active ? "bg-orange-50 border-orange-300"
              : "bg-white border-slate-200"
            }`}>
              <div className="flex justify-center mb-2">
                {phase.done
                  ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  : phase.active
                  ? <div className="w-5 h-5 border-2 border-orange-500 rounded-full animate-pulse" />
                  : <div className="w-5 h-5 border-2 border-slate-300 rounded-full" />}
              </div>
              <p className={`text-sm font-semibold ${
                phase.done ? "text-emerald-700"
                : phase.active ? "text-orange-700"
                : "text-slate-400"
              }`}>{phase.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {kpis.map((card, i) => {
          const Icon = card.icon
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className={`${card.bg} border-2 ${card.border} rounded-2xl p-6`}>
              <div className={`w-10 h-10 rounded-xl ${card.bg} border ${card.border} flex items-center justify-center mb-4`}>
                <Icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              <p className={`text-3xl font-black ${card.color} mb-1`}>{card.value}</p>
              <p className="text-sm font-semibold text-slate-600">{card.label}</p>
              <p className="text-xs text-slate-400 mt-1">{card.sub}</p>
            </motion.div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Bar chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Score by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categories} layout="vertical" margin={{ left: 0 }} barCategoryGap="35%">
              <XAxis type="number" domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} width={150} />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 13 }}
                formatter={(v) => [`${v}/100`, "Score"]}
              />
              <Bar dataKey="score" fill="#93c5fd" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gap priorities — keep severity colors here, it's semantically meaningful */}
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-5">Gap Priorities</h3>
          <div className="space-y-3 mb-6">
            {gapSummary.map((g) => (
              <div key={g.label} className={`${g.bg} border-2 ${g.border} rounded-xl px-4 py-3 flex items-center justify-between`}>
                <span className={`text-sm font-semibold ${g.color}`}>{g.label}</span>
                <span className={`text-2xl font-black ${g.color}`}>{g.count}</span>
              </div>
            ))}
          </div>
          <Link href="/audit">
            <button className="w-full py-3 border-2 border-slate-200 hover:border-[#0a1628] hover:bg-slate-50 text-slate-500 hover:text-[#0a1628] text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2">
              View All Gaps <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-5">Recent Activity</h3>
        <div className="divide-y divide-slate-100">
          {recentActivity.map((item, i) => {
            const Icon = item.icon
            return (
              <div key={i} className="flex items-center gap-4 py-4">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${item.iconBg}`}>
                  <Icon className={`w-4 h-4 ${item.iconColor}`} />
                </div>
                <span className="text-sm font-medium text-slate-700 flex-1">{item.text}</span>
                <span className="text-xs text-slate-400 shrink-0">{item.time}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
