"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import CustomerSidebar from "@/components/customer-sidebar"
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, ChevronDown, DollarSign, TrendingUp } from "lucide-react"

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

const severityConfig: Record<string, { color: string; bg: string; border: string; icon: React.ComponentType<{ className?: string }> }> = {
  Critical: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", icon: AlertTriangle },
  High: { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", icon: AlertTriangle },
  Medium: { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", icon: Clock },
  Low: { color: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/20", icon: CheckCircle2 },
}

export default function AuditPage() {
  const [selectedCat, setSelectedCat] = useState("All")
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = selectedCat === "All" ? gaps : gaps.filter(g => g.category === selectedCat)

  return (
    <div className="flex min-h-screen bg-[#0a1628]">
      <CustomerSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-5xl">
          <div className="mb-8">
            <h1 className="text-white text-2xl font-bold">Audit Report</h1>
            <p className="text-gray-400 text-sm mt-1">28 gaps identified across 8 categories · $1.2M annual improvement opportunity</p>
          </div>

          {/* Executive summary */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-600/10 to-blue-600/5 border border-blue-600/20 rounded-2xl p-6 mb-6">
            <div className="grid grid-cols-4 gap-6">
              {[
                { label: "Overall Score", value: "38/100", sub: "Below industry avg (55)" },
                { label: "Total Gaps", value: "28", sub: "5 critical, 8 high" },
                { label: "Annual Opportunity", value: "$1.2M", sub: "Conservative estimate" },
                { label: "Impl. Cost", value: "$150K", sub: "Quick wins only" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl font-black text-white mb-0.5">{s.value}</p>
                  <p className="text-xs font-semibold text-blue-400">{s.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Category filter */}
          <div className="flex gap-2 flex-wrap mb-6">
            <button onClick={() => setSelectedCat("All")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedCat === "All" ? "bg-blue-600 text-white" : "bg-white/5 text-gray-400 hover:text-white border border-white/10"}`}>
              All ({gaps.length})
            </button>
            {[...new Set(gaps.map(g => g.category))].map(cat => (
              <button key={cat} onClick={() => setSelectedCat(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedCat === cat ? "bg-blue-600 text-white" : "bg-white/5 text-gray-400 hover:text-white border border-white/10"}`}>
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
                <motion.div key={gap.feature} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className={`bg-white/5 border ${isOpen ? "border-white/20" : "border-white/10 hover:border-white/15"} rounded-2xl overflow-hidden transition-all`}>
                  <button className="w-full flex items-center gap-4 p-5 text-left" onClick={() => setExpanded(isOpen ? null : gap.feature)}>
                    <div className={`w-8 h-8 ${cfg.bg} border ${cfg.border} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-white font-semibold text-sm">{gap.feature}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{gap.severity}</span>
                      </div>
                      <p className="text-gray-500 text-xs">{gap.category} · Fix difficulty: {gap.difficulty}</p>
                    </div>
                    <div className="text-right mr-3">
                      <p className="text-green-400 font-bold text-sm">{gap.roi}</p>
                      <p className="text-gray-600 text-xs">annual ROI</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-white/10 px-5 pb-5">
                      <div className="grid lg:grid-cols-2 gap-6 mt-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Current State</p>
                          <p className="text-gray-300 text-sm bg-red-500/5 border border-red-500/10 rounded-xl p-3">{gap.current}</p>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mt-4 mb-2">Ideal State</p>
                          <p className="text-gray-300 text-sm bg-green-500/5 border border-green-500/10 rounded-xl p-3">{gap.ideal}</p>
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
                              <div key={item.label} className="flex items-start gap-3 p-3 bg-white/3 rounded-xl">
                                <I className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-xs text-gray-500">{item.label}</p>
                                  <p className="text-sm text-white font-medium">{item.value}</p>
                                </div>
                              </div>
                            )
                          })}
                          <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/30 text-blue-400 text-sm font-semibold rounded-xl transition-colors">
                            View Solution Design<ArrowRight className="w-3.5 h-3.5" />
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
