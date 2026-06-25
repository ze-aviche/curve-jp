"use client"

import { useEffect, useState, type ReactNode } from "react"
import { Phone, PhoneForwarded, Clock, DollarSign, TrendingUp, Loader2 } from "lucide-react"
import CustomerSidebar from "@/components/customer-sidebar"
import { api } from "@/lib/api"

type Analytics = Awaited<ReturnType<typeof api.voice.analytics>>
type Intents = Awaited<ReturnType<typeof api.voice.intents>>

function pct(n: number) {
  return `${Math.round(n * 100)}%`
}

export default function VoiceAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null)
  const [intents, setIntents] = useState<Intents | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([api.voice.analytics(), api.voice.intents(false)])
      .then(([a, i]) => {
        setData(a)
        setIntents(i)
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
  }, [])

  return (
    <div className="flex min-h-screen bg-slate-50">
      <CustomerSidebar />
      <main className="flex-1 px-8 py-7">
        <header className="mb-7">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0a1628] flex items-center justify-center">
              <Phone className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#0a1628]">Voice / IVR Analytics</h1>
              <p className="text-sm text-slate-500">
                Containment, deflection, and intent across automated voice calls
              </p>
            </div>
          </div>
        </header>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6">
            {error} — is the backend running and the voice DB reachable?
          </div>
        )}

        {!data && !error && (
          <div className="flex items-center gap-2 text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading analytics…
          </div>
        )}

        {data && (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
              <KpiCard
                icon={<TrendingUp className="w-5 h-5" />}
                label="Containment Rate"
                value={pct(data.containment_rate)}
                sub={`${data.contained_calls}/${data.total_calls} calls self-served`}
                accent
              />
              <KpiCard
                icon={<PhoneForwarded className="w-5 h-5" />}
                label="Escalated to Agent"
                value={String(data.escalated_calls)}
                sub={`of ${data.total_calls} total calls`}
              />
              <KpiCard
                icon={<Clock className="w-5 h-5" />}
                label="Avg Handle Time"
                value={`${data.avg_handle_secs}s`}
                sub="per voice call"
              />
              <KpiCard
                icon={<DollarSign className="w-5 h-5" />}
                label="Est. Savings"
                value={`$${data.estimated_savings_usd.toLocaleString()}`}
                sub={`${data.agent_minutes_deflected} agent-min deflected`}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Per-tenant */}
              <Panel title="Containment by Tenant">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-100">
                      <th className="py-2 font-semibold">Tenant</th>
                      <th className="py-2 font-semibold">Calls</th>
                      <th className="py-2 font-semibold">Containment</th>
                      <th className="py-2 font-semibold">AHT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.by_tenant.map((t) => (
                      <tr key={t.tenant} className="border-b border-slate-50">
                        <td className="py-2.5 font-medium text-[#0a1628]">{t.tenant}</td>
                        <td className="py-2.5 text-slate-600">{t.total_calls}</td>
                        <td className="py-2.5">
                          <Bar value={t.containment_rate} />
                        </td>
                        <td className="py-2.5 text-slate-600">{t.avg_handle_secs}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Panel>

              {/* Intents */}
              <Panel title={`Containment by Intent (${intents?.classifier ?? "…"})`}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-100">
                      <th className="py-2 font-semibold">Intent</th>
                      <th className="py-2 font-semibold">Calls</th>
                      <th className="py-2 font-semibold">Containment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {intents?.by_intent.map((r) => (
                      <tr key={r.intent} className="border-b border-slate-50">
                        <td className="py-2.5 font-medium text-[#0a1628]">
                          {r.intent.replace(/_/g, " ")}
                        </td>
                        <td className="py-2.5 text-slate-600">{r.total_calls}</td>
                        <td className="py-2.5">
                          <Bar value={r.containment_rate} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Panel>

              {/* Outcomes */}
              <Panel title="Call Outcomes">
                <div className="flex flex-wrap gap-3">
                  {Object.entries(data.outcomes).map(([k, v]) => (
                    <div
                      key={k}
                      className="rounded-xl border border-slate-100 px-4 py-3 min-w-[110px]"
                    >
                      <p className="text-2xl font-bold text-[#0a1628]">{v}</p>
                      <p className="text-xs text-slate-500 capitalize">{k}</p>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: ReactNode
  label: string
  value: string
  sub: string
  accent?: boolean
}) {
  return (
    <div
      className={`rounded-2xl p-5 border ${
        accent ? "bg-[#0a1628] border-[#0a1628] text-white" : "bg-white border-slate-200"
      }`}
    >
      <div className={`mb-3 ${accent ? "text-blue-400" : "text-slate-400"}`}>{icon}</div>
      <p className={`text-3xl font-bold ${accent ? "text-white" : "text-[#0a1628]"}`}>{value}</p>
      <p className={`text-xs mt-1 font-semibold ${accent ? "text-white/70" : "text-slate-500"}`}>
        {label}
      </p>
      <p className={`text-xs mt-0.5 ${accent ? "text-white/40" : "text-slate-400"}`}>{sub}</p>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <h2 className="text-sm font-bold text-[#0a1628] mb-4">{title}</h2>
      {children}
    </div>
  )
}

function Bar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${value * 100}%` }} />
      </div>
      <span className="text-slate-600 text-xs tabular-nums">{Math.round(value * 100)}%</span>
    </div>
  )
}
