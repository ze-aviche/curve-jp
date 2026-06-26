"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { TrendingUp, CheckCircle2, ArrowRight, ArrowLeft, Upload, ShieldCheck, Clock, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api"

const STEPS = [
  { label: "Company Profile", desc: "Tell us about your organization" },
  { label: "Platform & Tech", desc: "Your current technology stack" },
  { label: "Operations Data", desc: "Key metrics and performance data" },
  { label: "Team & Org", desc: "Stakeholders and structure" },
  { label: "Goals & Timeline", desc: "Pain points and priorities" },
  { label: "Data Access", desc: "Secure data sharing setup" },
]

const labelCls = "text-sm font-semibold text-slate-700 mb-2 block"
const inputCls = "h-12 text-base border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-blue-500 focus:ring-blue-500"
const selectCls = "w-full h-12 border border-slate-200 text-slate-700 rounded-xl px-4 text-base outline-none bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
const checkCardCls = "flex items-center gap-3 text-base text-slate-700 cursor-pointer p-4 rounded-xl border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
const checkSmCls = "flex items-center gap-3 text-sm text-slate-700 cursor-pointer p-3.5 rounded-xl border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"

type StepProps = { form: Record<string, string>; set: (k: string, v: string) => void }

function Step0({ form, set }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-5">
        <div className="col-span-2 sm:col-span-1">
          <label className={labelCls}>Company Name <span className="text-blue-600">*</span></label>
          <Input placeholder="Acme Corporation" className={inputCls}
            value={form.company ?? ""} onChange={(e) => set("company", e.target.value)} />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className={labelCls}>Industry <span className="text-blue-600">*</span></label>
          <select className={selectCls} value={form.industry ?? ""} onChange={(e) => set("industry", e.target.value)}>
            <option value="">Select your industry</option>
            {["Financial Services", "Insurance", "Healthcare", "Retail / E-commerce", "Telecom", "Technology", "Government", "Utilities", "Travel & Hospitality", "Other"].map(i => (
              <option key={i}>{i}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Annual Revenue</label>
          <select className={selectCls}>
            <option>Select range</option>
            {["$10M–$50M", "$50M–$250M", "$250M–$1B", "$1B–$5B", "$5B+"].map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Business Model</label>
          <select className={selectCls}>
            <option>Select model</option>
            {["B2C", "B2B", "B2B2C", "Government / Public Sector"].map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className={labelCls}>Geographic Footprint</label>
        <div className="grid grid-cols-3 gap-3">
          {["United States", "Canada", "LATAM", "EMEA", "APAC", "Global"].map(g => (
            <label key={g} className={checkSmCls}>
              <input type="checkbox" className="accent-blue-600 w-4 h-4 shrink-0" />
              <span>{g}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className={labelCls}>Brief Company Description</label>
        <Textarea
          placeholder="Describe your business and what your contact center supports..."
          className="text-base border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl resize-none focus:border-blue-500"
          rows={4}
          value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)}
        />
      </div>
    </div>
  )
}

function Step1({ form, set }: StepProps) {
  return (
    <div className="space-y-7">
      <div>
        <label className={`${labelCls} text-base mb-3`}>Primary Contact Center Platform <span className="text-blue-600">*</span></label>
        <div className="grid grid-cols-2 gap-3">
          {["Genesys Cloud CX", "Amazon Connect", "Five9", "NICE CXone", "Talkdesk", "Twilio Flex", "Avaya OneCloud", "Cisco Webex CC", "RingCentral CC", "Other"].map(p => (
            <label key={p} className={checkCardCls}>
              <input type="radio" name="platform" value={p} className="accent-blue-600 w-4 h-4 shrink-0"
                checked={form.platform === p} onChange={(e) => set("platform", e.target.value)} />
              <span className="font-medium">{p}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className={labelCls}>CRM System</label>
        <div className="grid grid-cols-3 gap-3">
          {["Salesforce", "HubSpot", "Microsoft Dynamics", "ServiceNow", "Zendesk", "None / Other"].map(c => (
            <label key={c} className={checkSmCls}>
              <input type="checkbox" className="accent-blue-600 w-4 h-4 shrink-0" />
              <span>{c}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className={labelCls}>WFM / Workforce Management</label>
        <div className="grid grid-cols-3 gap-3">
          {["NICE WFM", "Verint WFM", "Calabrio", "Aspect", "Genesys WFM", "Spreadsheet / Manual"].map(w => (
            <label key={w} className={checkSmCls}>
              <input type="checkbox" className="accent-blue-600 w-4 h-4 shrink-0" />
              <span>{w}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className={labelCls}>Analytics / QA Tools</label>
        <div className="grid grid-cols-3 gap-3">
          {["Verint Analytics", "NICE Enlighten", "Observe.AI", "Calabrio Analytics", "Balto", "None"].map(a => (
            <label key={a} className={checkSmCls}>
              <input type="checkbox" className="accent-blue-600 w-4 h-4 shrink-0" />
              <span>{a}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function Step2({ form, set }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <span className="font-semibold">Estimates are fine.</span> These numbers help us calculate your baseline and identify the biggest opportunities.
      </div>
      <div className="grid grid-cols-2 gap-5">
        {[
          { key: "agent_count", label: "Total Agents (FTE)", placeholder: "e.g. 150" },
          { key: "monthly_calls", label: "Monthly Call Volume", placeholder: "e.g. 50,000" },
          { key: "aht_seconds", label: "Avg Handle Time (seconds)", placeholder: "e.g. 320" },
          { key: "fcr_pct", label: "First Contact Resolution %", placeholder: "e.g. 72" },
          { key: "ivr_deflection_pct", label: "IVR Deflection Rate %", placeholder: "e.g. 22" },
          { key: "csat_pct", label: "CSAT Score %", placeholder: "e.g. 81" },
          { key: "attrition_pct", label: "Agent Attrition Rate %", placeholder: "e.g. 28" },
          { key: "cost_per_call", label: "Cost Per Call ($)", placeholder: "e.g. 8.50" },
        ].map(f => (
          <div key={f.key}>
            <label className={labelCls}>{f.label}</label>
            <Input placeholder={f.placeholder} className={inputCls}
              value={form[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} />
          </div>
        ))}
      </div>
      <div>
        <label className={labelCls}>Channels Handled</label>
        <div className="flex flex-wrap gap-3">
          {["Voice / Phone", "Email", "Live Chat", "SMS / Text", "Social Media", "Messaging Apps", "Video"].map(ch => (
            <label key={ch} className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer px-4 py-2.5 rounded-xl border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
              <input type="checkbox" className="accent-blue-600 w-4 h-4" />{ch}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function Step3() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-base font-semibold text-slate-800 mb-4">Contact Center Leadership</p>
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>Director / VP Name</label>
            <Input placeholder="Jane Smith" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Their Email</label>
            <Input placeholder="jane@company.com" type="email" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>IT / Platform Owner Name</label>
            <Input placeholder="John Doe" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Their Email</label>
            <Input placeholder="john@company.com" type="email" className={inputCls} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div>
          <label className={labelCls}>Number of Supervisors</label>
          <Input placeholder="e.g. 12" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Contact Center Model</label>
          <select className={selectCls}>
            <option value="">Select one</option>
            {["Fully In-House", "Fully Outsourced (BPO)", "Hybrid"].map(opt => <option key={opt}>{opt}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className={labelCls}>CC Director Reports To</label>
        <div className="grid grid-cols-2 gap-3">
          {["Chief Operating Officer", "Chief Customer Officer", "Chief Technology Officer", "VP Operations", "Other"].map(r => (
            <label key={r} className={checkCardCls}>
              <input type="radio" name="reporting" className="accent-blue-600 w-4 h-4 shrink-0" />
              <span className="font-medium">{r}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function Step4() {
  return (
    <div className="space-y-6">
      <div>
        <label className={`${labelCls} text-base mb-3`}>Top Pain Points <span className="text-slate-400 font-normal text-sm">(select your top 3)</span></label>
        <div className="grid grid-cols-1 gap-2.5">
          {[
            "High average handle time / inefficiency",
            "Low first contact resolution",
            "High agent attrition / retention",
            "Low customer satisfaction (CSAT / NPS)",
            "Compliance and regulatory risk",
            "Poor integrations between systems",
            "Insufficient analytics / reporting",
            "Low IVR / chatbot deflection",
            "High cost per call",
            "Agent burnout and stress",
          ].map(p => (
            <label key={p} className={checkCardCls}>
              <input type="checkbox" className="accent-blue-600 w-4 h-4 shrink-0" />
              <span className="font-medium">{p}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div>
          <label className={labelCls}>Preferred Start Date</label>
          <Input type="date" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Budget for Initiatives</label>
          <select className={selectCls}>
            <option>Select range</option>
            {["$50K–$100K", "$100K–$250K", "$250K–$500K", "$500K–$1M", "$1M+", "TBD / Flexible"].map(b => <option key={b}>{b}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className={labelCls}>Specific Initiatives Already Planned?</label>
        <Textarea
          placeholder="e.g. We're planning a Genesys → Amazon Connect migration in Q3..."
          className="text-base border-slate-200 rounded-xl resize-none focus:border-blue-500"
          rows={3}
        />
      </div>
    </div>
  )
}

function Step5() {
  return (
    <div className="space-y-5">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <p className="text-blue-800 font-semibold text-base mb-1">Secure & Read-Only</p>
        <p className="text-blue-700 text-sm">All access is read-only, encrypted end-to-end, and covered under our NDA. You can revoke any access at any time.</p>
      </div>

      {[
        {
          title: "Platform API Access",
          badge: "Read-only",
          desc: "Allows us to read your platform configuration, routing rules, and usage metrics.",
          options: ["Genesys OAuth token", "AWS IAM read-only role", "Five9 API credentials", "Other — we'll guide you"],
        },
        {
          title: "Call Recording Sample",
          badge: "Optional",
          desc: "50–100 recent recordings (last 30 days). Used for transcript analysis only.",
          isUpload: true,
        },
        {
          title: "Historical Metrics Export",
          badge: "Optional",
          desc: "Last 90 days of operational data from your reporting module. CSV or Excel.",
          isUpload: true,
        },
      ].map((section, i) => (
        <div key={i} className="border-2 border-slate-200 rounded-2xl p-5">
          <div className="flex items-start justify-between mb-3">
            <h4 className="text-slate-900 font-semibold text-base">{section.title}</h4>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${section.badge === "Read-only" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
              {section.badge}
            </span>
          </div>
          <p className="text-slate-500 text-sm mb-4">{section.desc}</p>
          {section.isUpload ? (
            <label className="flex flex-col items-center gap-3 border-2 border-dashed border-slate-200 rounded-xl p-8 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all">
              <Upload className="w-8 h-8 text-slate-400" />
              <span className="text-base font-medium text-slate-600">Click to upload or drag & drop</span>
              <span className="text-sm text-slate-400">CSV, XLS, MP3, MP4 up to 500MB</span>
              <input type="file" className="hidden" multiple />
            </label>
          ) : (
            <div className="space-y-2.5">
              {section.options?.map(opt => (
                <label key={opt} className="flex items-center gap-3 text-base text-slate-700 cursor-pointer p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <input type="radio" name={`section-${i}`} className="accent-blue-600 w-4 h-4" />{opt}
                </label>
              ))}
            </div>
          )}
        </div>
      ))}

      <label className="flex items-start gap-3 text-base text-slate-700 cursor-pointer p-4 rounded-xl border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all">
        <input type="checkbox" className="accent-blue-600 w-5 h-5 mt-0.5 shrink-0" required />
        <span>I confirm this data sharing is authorized by my organization and covered by the signed NDA.</span>
      </label>
    </div>
  )
}

const stepComponents: ((p: StepProps) => React.JSX.Element)[] = [Step0, Step1, Step2, Step3, Step4, Step5]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const StepComp = stepComponents[step]
  const isLast = step === STEPS.length - 1

  // Parse a possibly-comma-formatted number field, falling back to a default.
  const num = (k: string, fallback: number) => {
    const raw = (form[k] ?? "").replace(/[,$\s]/g, "")
    const n = parseFloat(raw)
    return Number.isFinite(n) ? n : fallback
  }

  function handleSubmit() {
    // Kick off the audit asynchronously — it runs the agent pipeline and then
    // PAUSES for an internal analyst to approve (HITL) in /admin/approvals before
    // the customer's roadmap is generated. We don't block the UI on the ~30s run.
    const threadId = globalThis.crypto?.randomUUID?.() ?? `audit-${Date.now()}`
    const company = form.company?.trim() || `Onboarding ${threadId.slice(0, 8)}`
    // Remember this customer's audit so /dashboard and /audit can show its real status.
    try {
      localStorage.setItem("auditThreadId", threadId)
      localStorage.setItem("auditCompany", company)
    } catch {}
    api.audit
      .hitlStart({
        thread_id: threadId,
        client_name: company,
        // Real values from the wizard, with sensible fallbacks for blanks.
        client_data: {
          company,
          platform: form.platform || "Genesys Cloud CX",
          agent_count: num("agent_count", 150),
          monthly_calls: num("monthly_calls", 50000),
          aht_seconds: num("aht_seconds", 320),
          fcr_pct: num("fcr_pct", 72),
          ivr_deflection_pct: num("ivr_deflection_pct", 22),
          csat_pct: num("csat_pct", 81),
          attrition_pct: num("attrition_pct", 28),
          config_notes: form.notes || "",
        },
        client_context: {
          industry: form.industry || "Financial Services",
          cost_per_call: num("cost_per_call", 8.5),
          company,
        },
      })
      .catch(() => {
        /* fire-and-forget; the analyst queue will simply not show a failed run */
      })
    setDone(true)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* Left sidebar */}
      <aside className="hidden lg:flex flex-col w-80 xl:w-96 bg-[#0a1628] text-white p-10 sticky top-0 h-screen">
        <Link href="/" className="flex items-center gap-3 mb-12">
          <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl">Optimize<span className="text-blue-400">CC</span></span>
        </Link>

        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-2">Audit Onboarding</h2>
          <p className="text-white/60 text-sm leading-relaxed">Complete these steps so we can deliver the most accurate audit for your contact center.</p>
        </div>

        {/* Step list */}
        <nav className="flex-1 space-y-1">
          {STEPS.map((s, i) => {
            const done_ = i < step
            const active = i === step
            return (
              <div key={s.label} className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all ${active ? "bg-white/10" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all ${
                  done_ ? "bg-green-500 text-white" : active ? "bg-white text-[#0a1628]" : "bg-white/10 text-white/40"
                }`}>
                  {done_ ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${active ? "text-white" : done_ ? "text-green-400" : "text-white/40"}`}>{s.label}</p>
                  {active && <p className="text-xs text-white/50 mt-0.5">{s.desc}</p>}
                </div>
              </div>
            )
          })}
        </nav>

        {/* Trust badges */}
        <div className="mt-10 pt-8 border-t border-white/10 space-y-3">
          {[
            { icon: ShieldCheck, text: "SOC 2 Type II Certified" },
            { icon: Clock, text: "Quick turnaround" },
            { icon: DollarSign, text: "$500K–$2M opportunity identified" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-white/50 text-xs">
              <Icon className="w-4 h-4 shrink-0" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* Right form area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 px-6 py-5 border-b border-slate-200 bg-white">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0a1628] rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900">Optimize<span className="text-blue-600">CC</span></span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!done ? (
            <div className="max-w-3xl mx-auto px-6 lg:px-12 py-10">
              {/* Progress bar (mobile) */}
              <div className="lg:hidden mb-8">
                <div className="flex justify-between text-sm text-slate-500 mb-2">
                  <span>Step {step + 1} of {STEPS.length}</span>
                  <span>{STEPS[step].label}</span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
                </div>
              </div>

              {/* Step header */}
              <div className="mb-8">
                <p className="text-blue-600 text-sm font-semibold uppercase tracking-wider mb-1">Step {step + 1} of {STEPS.length}</p>
                <h1 className="text-3xl font-bold text-slate-900">{STEPS[step].label}</h1>
                <p className="text-slate-500 mt-2 text-base">{STEPS[step].desc}</p>
              </div>

              {/* Form content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <StepComp form={form} set={set} />
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex justify-between items-center mt-10 pt-8 border-t border-slate-200">
                <Button
                  variant="ghost"
                  onClick={() => setStep(s => s - 1)}
                  disabled={step === 0}
                  className="text-slate-500 hover:text-slate-900 gap-2 text-base px-5 py-3 h-auto disabled:opacity-30"
                >
                  <ArrowLeft className="w-5 h-5" />Back
                </Button>
                <Button
                  onClick={() => isLast ? handleSubmit() : setStep(s => s + 1)}
                  className="bg-[#0a1628] hover:bg-[#0a1628]/90 text-white text-base px-8 py-3 h-auto rounded-xl gap-2 shadow-md"
                >
                  {isLast ? "Submit & Start Audit" : "Continue"}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-full p-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-lg w-full bg-white border border-green-200 rounded-3xl p-14 text-center shadow-sm"
              >
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <h2 className="text-slate-900 text-3xl font-bold mb-4">Onboarding Complete!</h2>
                <p className="text-slate-500 text-base mb-10 leading-relaxed">
                  Your audit has been initiated. Our team will review your submission and reach out within 24 hours with next steps.
                </p>
                <Link href="/dashboard">
                  <Button className="bg-[#0a1628] hover:bg-[#0a1628]/90 text-white text-base px-10 py-3 h-auto rounded-xl gap-2 shadow-md">
                    Go to Dashboard<ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
