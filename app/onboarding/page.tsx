"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { TrendingUp, CheckCircle2, ArrowRight, ArrowLeft, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"

const STEPS = ["Company Profile", "Platform & Tech", "Operations Data", "Team & Org", "Goals & Timeline", "Data Access"]

const inputCls = "border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-blue-400"
const selectCls = "w-full border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-sm outline-none bg-white focus:border-blue-400"
const checkboxItemCls = "flex items-center gap-2 text-sm text-slate-600 cursor-pointer p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
const labelCls = "text-xs font-medium text-slate-600 mb-1.5 block"

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-8">
      <div className="flex justify-between text-xs text-slate-400 mb-2">
        <span>Step {current + 1} of {total}</span>
        <span>{STEPS[current]}</span>
      </div>
      <Progress value={((current + 1) / total) * 100} className="h-1.5" />
      <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <div key={s} className={`flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border transition-all ${
            i < current ? "border-green-200 bg-green-50 text-green-700"
            : i === current ? "border-blue-200 bg-blue-50 text-blue-700"
            : "border-slate-200 text-slate-400"
          }`}>
            {i < current && <CheckCircle2 className="w-3 h-3" />}
            {s}
          </div>
        ))}
      </div>
    </div>
  )
}

function Step0() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Company Name *</label>
          <Input placeholder="Acme Corporation" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Industry Vertical *</label>
          <select className={selectCls}>
            <option value="">Select industry</option>
            {["Financial Services", "Insurance", "Healthcare", "Retail / E-commerce", "Telecom", "Technology", "Government", "Utilities", "Travel & Hospitality", "Other"].map(i => (
              <option key={i}>{i}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Company Revenue Range</label>
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
        <div className="grid grid-cols-3 gap-2">
          {["United States", "Canada", "LATAM", "EMEA", "APAC", "Global"].map(g => (
            <label key={g} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" className="accent-blue-600" />{g}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className={labelCls}>Brief Company Description</label>
        <Textarea placeholder="Describe your business and what your contact center supports..." className={`${inputCls} resize-none`} rows={3} />
      </div>
    </div>
  )
}

function Step1() {
  return (
    <div className="space-y-5">
      <div>
        <label className={`${labelCls} font-semibold`}>Primary Contact Center Platform *</label>
        <div className="grid grid-cols-2 gap-2">
          {["Genesys Cloud CX", "Amazon Connect", "Five9", "NICE CXone", "Talkdesk", "Twilio Flex", "Avaya OneCloud", "Cisco Webex CC", "RingCentral CC", "Other"].map(p => (
            <label key={p} className={checkboxItemCls}>
              <input type="radio" name="platform" value={p} className="accent-blue-600" />{p}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className={labelCls}>CRM System</label>
        <div className="grid grid-cols-3 gap-2">
          {["Salesforce", "HubSpot", "Microsoft Dynamics", "ServiceNow", "Zendesk", "None / Other"].map(c => (
            <label key={c} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50">
              <input type="checkbox" className="accent-blue-600" />{c}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className={labelCls}>WFM / Workforce Management Tool</label>
        <div className="grid grid-cols-3 gap-2">
          {["NICE WFM", "Verint WFM", "Calabrio", "Aspect", "Genesys WFM", "Spreadsheet / Manual"].map(w => (
            <label key={w} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50">
              <input type="checkbox" className="accent-blue-600" />{w}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className={labelCls}>Analytics / QA Tools</label>
        <div className="grid grid-cols-3 gap-2">
          {["Verint Analytics", "NICE Enlighten", "Observe.AI", "Calabrio Analytics", "Balto", "None"].map(a => (
            <label key={a} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50">
              <input type="checkbox" className="accent-blue-600" />{a}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function Step2() {
  return (
    <div className="space-y-5">
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-slate-600">
        Provide your best estimates. These help us calculate your baseline and identify improvement opportunities.
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Total Agents (FTE)", placeholder: "e.g. 150" },
          { label: "Monthly Call Volume", placeholder: "e.g. 50,000" },
          { label: "Average Handle Time (seconds)", placeholder: "e.g. 320" },
          { label: "First Contact Resolution %", placeholder: "e.g. 72" },
          { label: "IVR Deflection Rate %", placeholder: "e.g. 22" },
          { label: "Customer Satisfaction (CSAT) %", placeholder: "e.g. 81" },
          { label: "Agent Attrition Rate % (annual)", placeholder: "e.g. 28" },
          { label: "Cost Per Call ($)", placeholder: "e.g. 8.50" },
        ].map(f => (
          <div key={f.label}>
            <label className={labelCls}>{f.label}</label>
            <Input placeholder={f.placeholder} className={inputCls} />
          </div>
        ))}
      </div>
      <div>
        <label className={labelCls}>Channels Handled (select all)</label>
        <div className="flex flex-wrap gap-2">
          {["Voice / Phone", "Email", "Live Chat", "SMS / Text", "Social Media", "Messaging Apps", "Video"].map(ch => (
            <label key={ch} className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50">
              <input type="checkbox" className="accent-blue-600" />{ch}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function Step3() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div><label className={labelCls}>Contact Center Director / VP Name</label><Input placeholder="Jane Smith" className={inputCls} /></div>
        <div><label className={labelCls}>Their Email</label><Input placeholder="jane@company.com" type="email" className={inputCls} /></div>
        <div><label className={labelCls}>IT / Platform Owner Name</label><Input placeholder="John Doe" className={inputCls} /></div>
        <div><label className={labelCls}>Their Email</label><Input placeholder="john@company.com" type="email" className={inputCls} /></div>
      </div>
      <div>
        <label className={labelCls}>Number of Supervisors</label>
        <Input placeholder="e.g. 12" className={`${inputCls} w-40`} />
      </div>
      <div>
        <label className={labelCls}>Reporting Structure (who does CC Director report to?)</label>
        <div className="grid grid-cols-2 gap-2">
          {["Chief Operating Officer", "Chief Customer Officer", "Chief Technology Officer", "VP Operations", "Other"].map(r => (
            <label key={r} className={checkboxItemCls}><input type="radio" name="reporting" className="accent-blue-600" />{r}</label>
          ))}
        </div>
      </div>
      <div>
        <label className={labelCls}>Is the contact center in-house or outsourced?</label>
        <div className="flex gap-3">
          {["Fully In-House", "Fully Outsourced (BPO)", "Hybrid"].map(opt => (
            <label key={opt} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer px-4 py-2 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50">
              <input type="radio" name="insource" className="accent-blue-600" />{opt}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function Step4() {
  return (
    <div className="space-y-5">
      <div>
        <label className={`${labelCls} font-semibold`}>Top Pain Points (select your top 3)</label>
        <div className="space-y-2">
          {[
            "High average handle time / inefficiency",
            "Low first contact resolution",
            "High agent attrition / retention",
            "Low customer satisfaction (CSAT / NPS)",
            "Compliance and regulatory risk",
            "Poor integrations between systems",
            "Insufficient analytics / reporting",
            "Low IVR/chatbot deflection",
            "High cost per call",
            "Agent burnout and stress",
          ].map(p => (
            <label key={p} className={checkboxItemCls}>
              <input type="checkbox" className="accent-blue-600 w-4 h-4" />{p}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className={labelCls}>Preferred audit start date</label>
        <Input type="date" className={`${inputCls} w-48`} />
      </div>
      <div>
        <label className={labelCls}>Budget range for optimization initiatives</label>
        <select className={selectCls}>
          <option>Select range</option>
          {["$50K–$100K", "$100K–$250K", "$250K–$500K", "$500K–$1M", "$1M+", "TBD / Flexible"].map(b => <option key={b}>{b}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls}>Any specific initiatives already planned?</label>
        <Textarea placeholder="e.g. We're planning a Genesys → Amazon Connect migration in Q3..." className={`${inputCls} resize-none`} rows={3} />
      </div>
    </div>
  )
}

function Step5() {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-slate-600">
        <p className="text-blue-700 font-semibold mb-1">Secure Data Sharing</p>
        Data collection requires read-only access only. All data is encrypted and covered under our NDA. You can revoke access at any time.
      </div>
      {[
        {
          title: "Platform API Access (Read-Only)",
          desc: "Allow us to read your contact center platform configuration, routing rules, and usage metrics.",
          options: ["Genesys OAuth token", "AWS IAM read-only role", "Five9 API credentials", "Other — we'll guide you"],
        },
        { title: "Call Recording Sample", desc: "Upload or share a secure link to 50–100 recent call recordings (last 30 days). Used for transcript analysis only.", isUpload: true },
        { title: "Historical Metrics Export", desc: "Export your operational data (last 90 days) from your platform's reporting module. CSV or Excel format accepted.", isUpload: true },
      ].map((section, i) => (
        <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <h4 className="text-slate-900 font-semibold text-sm mb-1">{section.title}</h4>
          <p className="text-slate-500 text-xs mb-4">{section.desc}</p>
          {section.isUpload ? (
            <label className="flex flex-col items-center gap-2 border-2 border-dashed border-slate-200 rounded-xl p-6 cursor-pointer hover:border-slate-300 hover:bg-white transition-colors">
              <Upload className="w-6 h-6 text-slate-400" />
              <span className="text-sm text-slate-500">Click to upload or drag & drop</span>
              <span className="text-xs text-slate-400">CSV, XLS, MP3, MP4 up to 500MB</span>
              <input type="file" className="hidden" multiple />
            </label>
          ) : (
            <div className="space-y-2">
              {section.options?.map(opt => (
                <label key={opt} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input type="radio" name={`section-${i}`} className="accent-blue-600" />{opt}
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
      <label className="flex items-start gap-2.5 text-sm text-slate-600 cursor-pointer">
        <input type="checkbox" className="accent-blue-600 mt-0.5" required />
        I confirm this data sharing is authorized by my organization and covered by the signed NDA.
      </label>
    </div>
  )
}

const stepComponents = [Step0, Step1, Step2, Step3, Step4, Step5]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)
  const StepComp = stepComponents[step]
  const isLast = step === STEPS.length - 1

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-[#0a1628] rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <span className="text-slate-900 font-bold text-xl">Optimize<span className="text-blue-600">CC</span></span>
        </Link>

        {!done ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <div className="mb-6">
              <h1 className="text-slate-900 text-2xl font-bold">Audit Onboarding</h1>
              <p className="text-slate-500 text-sm mt-1">Help us understand your contact center so we can deliver the most accurate audit possible.</p>
            </div>
            <StepIndicator current={step} total={STEPS.length} />
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-slate-900 font-semibold text-lg mb-5">{STEPS[step]}</h2>
                <StepComp />
              </motion.div>
            </AnimatePresence>
            <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setStep(s => s - 1)} disabled={step === 0} className="text-slate-500 hover:text-slate-900 gap-2 disabled:opacity-30">
                <ArrowLeft className="w-4 h-4" />Back
              </Button>
              <Button onClick={() => isLast ? setDone(true) : setStep(s => s + 1)} className="bg-[#0a1628] hover:bg-[#0a1628]/90 text-white px-8 rounded-xl gap-2 shadow-sm">
                {isLast ? "Submit & Start Audit" : "Continue"}<ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-green-200 rounded-2xl p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-slate-900 text-2xl font-bold mb-3">Onboarding Complete!</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              Your audit has been initiated. Our team will review your submission and reach out within 24 hours with next steps.
            </p>
            <Link href="/dashboard">
              <Button className="bg-[#0a1628] hover:bg-[#0a1628]/90 text-white px-8 rounded-xl gap-2 shadow-sm">
                Go to Dashboard<ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
