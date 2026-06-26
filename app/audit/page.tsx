"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import CustomerSidebar from "@/components/customer-sidebar"
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, ChevronDown, DollarSign, TrendingUp, Sparkles, Download } from "lucide-react"
import AuditStatusBanner, { useMyAudit } from "@/components/audit-status-banner"
import { api, type Roadmap } from "@/lib/api"

const gaps = [
  {
    feature: "IVR Self-Service",
    category: "Inbound Call Handling",
    severity: "Critical",
    current: "Basic menu-based IVR — 18% deflection rate",
    ideal: "AI-powered NLU IVR with 40%+ deflection and backend integration",
    impact: "$500K/year in missed automation potential",
    cost: "$100K implementation + $5K/month",
    timeline: "12 weeks",
    roi: "$300K/year",
    difficulty: "Hard",
  },
  {
    feature: "Real-Time Agent Assistance",
    category: "Inbound Call Handling",
    severity: "Critical",
    current: "No real-time coaching — post-call QA only",
    ideal: "Real-time sentiment detection, suggestions, compliance monitoring",
    impact: "AHT 15–20% higher than optimal; quality inconsistent",
    cost: "$75K implementation",
    timeline: "10 weeks",
    roi: "$180K/year",
    difficulty: "Hard",
  },
  {
    feature: "Speech Analytics",
    category: "Inbound Call Handling",
    severity: "High",
    current: "No voice-level analytics in place",
    ideal: "Keyword detection, emotion detection, call driver analysis",
    impact: "Blind to what customers are actually saying across 50K monthly calls",
    cost: "$40K implementation",
    timeline: "6 weeks",
    roi: "$120K/year",
    difficulty: "Medium",
  },
  {
    feature: "Regulatory Compliance Monitoring",
    category: "Compliance & Risk",
    severity: "Critical",
    current: "Manual post-call review of <2% of calls",
    ideal: "AI detects violations in real-time, prevents regulatory exposure",
    impact: "Potential regulatory fines of $50K–$500K per incident",
    cost: "$60K implementation",
    timeline: "8 weeks",
    roi: "$200K/year (risk reduction)",
    difficulty: "Hard",
  },
  {
    feature: "Predictive Analytics",
    category: "Analytics & Insights",
    severity: "High",
    current: "Historical dashboards only — no forward-looking analytics",
    ideal: "Predict future volume, agent performance, customer churn",
    impact: "Reactive staffing costing $150K+ in annual overtime",
    cost: "$50K implementation",
    timeline: "8 weeks",
    roi: "$200K/year",
    difficulty: "Hard",
  },
  {
    feature: "CRM Integration",
    category: "Integration & Data",
    severity: "High",
    current: "Manual data entry between CC platform and Salesforce",
    ideal: "Real-time bidirectional sync with Salesforce",
    impact: "Agents spend avg 4 min/call on manual lookups",
    cost: "$35K implementation",
    timeline: "5 weeks",
    roi: "$160K/year (productivity)",
    difficulty: "Medium",
  },
  {
    feature: "Callback Management",
    category: "Inbound Call Handling",
    severity: "Medium",
    current: "Manual callback requests, ~10% adoption",
    ideal: "Automated callback with 50%+ adoption and context preservation",
    impact: "High abandon rate during peak hours",
    cost: "$20K implementation",
    timeline: "3 weeks",
    roi: "$80K/year",
    difficulty: "Medium",
  },
  {
    feature: "Quality Assurance Automation",
    category: "Compliance & Risk",
    severity: "Medium",
    current: "Manual QA on 1–2% of calls",
    ideal: "100% automated QA with AI scoring",
    impact: "Poor quality escaping review — CSAT underperforming",
    cost: "$45K implementation",
    timeline: "6 weeks",
    roi: "$130K/year",
    difficulty: "Medium",
  },
]

const severityConfig: Record<string, { color: string; bg: string; border: string; badge: string; iconBg: string; icon: React.ComponentType<{ className?: string }> }> = {
  Critical: { color: "text-red-600", bg: "bg-red-50", border: "border-red-200", badge: "bg-red-50 text-red-600 border-red-200", iconBg: "bg-red-50 border-red-200", icon: AlertTriangle },
  High:     { color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", badge: "bg-orange-50 text-orange-600 border-orange-200", iconBg: "bg-orange-50 border-orange-200", icon: AlertTriangle },
  Medium:   { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-50 text-amber-600 border-amber-200", iconBg: "bg-amber-50 border-amber-200", icon: Clock },
  Low:      { color: "text-slate-400", bg: "bg-slate-50", border: "border-slate-200", badge: "bg-slate-50 text-slate-400 border-slate-200", iconBg: "bg-slate-50 border-slate-200", icon: CheckCircle2 },
}

export default function AuditPage() {
  const [selectedCat, setSelectedCat] = useState("All")
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = selectedCat === "All" ? gaps : gaps.filter(g => g.category === selectedCat)

  return (
    <div className="flex min-h-screen bg-slate-50">
      <CustomerSidebar />
      <main className="flex-1 p-8 lg:p-10 overflow-auto">
        <div className="max-w-5xl">

          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900">Audit Report</h1>
            <p className="text-slate-500 text-base mt-1">Your prioritized contact center improvement roadmap</p>
          </div>

          {/* Live status + real roadmap (from the customer's submitted audit) */}
          <AuditStatusBanner variant="audit" />
          <MyRoadmap />

          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 mt-10">
            Example framework detail
          </div>

          {/* Executive summary */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-4 gap-px bg-slate-200 border border-slate-200 rounded-2xl overflow-hidden mb-8 shadow-sm">
            {[
              { label: "Overall Score", value: "38/100", sub: "Industry avg: 55", color: "text-red-600" },
              { label: "Total Gaps", value: "28", sub: "5 critical, 8 high", color: "text-orange-600" },
              { label: "Annual Opportunity", value: "$1.2M", sub: "Conservative estimate", color: "text-emerald-600" },
              { label: "Impl. Cost", value: "$150K", sub: "Quick wins only", color: "text-blue-600" },
            ].map((s) => (
              <div key={s.label} className="bg-white px-6 py-6 text-center">
                <p className={`text-3xl font-black mb-1 ${s.color}`}>{s.value}</p>
                <p className="text-sm font-semibold text-slate-600 mb-0.5">{s.label}</p>
                <p className="text-xs text-slate-400">{s.sub}</p>
              </div>
            ))}
          </motion.div>

          {/* Category filter */}
          <div className="flex gap-2 flex-wrap mb-7">
            <button onClick={() => setSelectedCat("All")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                selectedCat === "All" ? "bg-[#0a1628] text-white" : "bg-white text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300"
              }`}>
              All ({gaps.length})
            </button>
            {[...new Set(gaps.map(g => g.category))].map(cat => (
              <button key={cat} onClick={() => setSelectedCat(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  selectedCat === cat ? "bg-[#0a1628] text-white" : "bg-white text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300"
                }`}>
                {cat} ({gaps.filter(g => g.category === cat).length})
              </button>
            ))}
          </div>

          {/* Gaps list */}
          <div className="space-y-3">
            {filtered.map((gap, i) => {
              const cfg = severityConfig[gap.severity]
              const Icon = cfg.icon
              const isOpen = expanded === gap.feature

              return (
                <motion.div key={gap.feature} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className={`bg-white border-2 rounded-2xl overflow-hidden transition-all shadow-sm ${
                    isOpen ? "border-slate-300" : "border-slate-100 hover:border-slate-200"
                  }`}>
                  <button className="w-full flex items-center gap-5 p-6 text-left" onClick={() => setExpanded(isOpen ? null : gap.feature)}>
                    <div className={`w-10 h-10 ${cfg.iconBg} border rounded-xl flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-slate-900 font-semibold text-base">{gap.feature}</span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${cfg.badge}`}>{gap.severity}</span>
                      </div>
                      <p className="text-slate-400 text-sm">{gap.category} · Difficulty: {gap.difficulty}</p>
                    </div>
                    <div className="text-right mr-2 shrink-0">
                      <p className="text-emerald-600 font-bold text-base">{gap.roi}</p>
                      <p className="text-slate-400 text-xs mt-0.5">annual ROI</p>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-slate-300 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="border-t border-slate-100 px-6 pb-6 pt-5">
                      <div className="grid lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Current State</p>
                            <p className="text-slate-600 text-sm leading-relaxed bg-red-50 border border-red-100 rounded-xl p-4">{gap.current}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Ideal State</p>
                            <p className="text-slate-600 text-sm leading-relaxed bg-emerald-50 border border-emerald-100 rounded-xl p-4">{gap.ideal}</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {[
                            { label: "Business Impact", value: gap.impact, icon: TrendingUp },
                            { label: "Implementation Cost", value: gap.cost, icon: DollarSign },
                            { label: "Timeline", value: gap.timeline, icon: Clock },
                            { label: "Expected Annual ROI", value: gap.roi, icon: CheckCircle2 },
                          ].map((item) => {
                            const I = item.icon
                            return (
                              <div key={item.label} className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                <I className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{item.label}</p>
                                  <p className="text-sm text-slate-800 font-semibold">{item.value}</p>
                                </div>
                              </div>
                            )
                          })}
                          <button className="w-full flex items-center justify-center gap-2 py-3 bg-[#0a1628] hover:bg-[#0a1628]/90 text-white text-sm font-semibold rounded-xl transition-colors">
                            View Solution Design <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}

/** Renders the customer's REAL approved roadmap (or a waiting state). */
function MyRoadmap() {
  const { audit, loading } = useMyAudit()
  if (loading || !audit || audit.status !== "complete") return null
  const roadmap = audit.roadmap as Roadmap | null
  if (!roadmap) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-2xl p-7 mb-4 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg font-bold text-slate-900">{audit.client_name} — Your Roadmap</h2>
        </div>
        <a
          href={api.audit.reportPdfUrl(audit.thread_id)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm font-semibold text-white bg-[#0a1628] hover:bg-[#0a1628]/90 rounded-xl px-4 py-2"
        >
          <Download className="w-4 h-4" /> Download PDF
        </a>
      </div>

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
              <h3 className="font-bold text-slate-900 text-sm">
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
    </motion.div>
  )
}
