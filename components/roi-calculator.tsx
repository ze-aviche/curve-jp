"use client"

import { useMemo, useState } from "react"
import { Calculator, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const sizeOptions = [
  { label: "25–50", value: 38, base: 600_000 },
  { label: "50–100", value: 75, base: 900_000 },
  { label: "100–300", value: 200, base: 1_400_000 },
  { label: "300–500", value: 400, base: 2_000_000 },
  { label: "500+", value: 650, base: 2_800_000 },
]

const challenges = [
  "Long average handle time (AHT)",
  "Low first contact resolution (FCR)",
  "Low customer satisfaction (CSAT)",
  "High agent turnover",
  "Poor integration between systems",
  "Manual processes taking too much time",
  "Low IVR deflection rate",
  "Compliance / quality gaps",
]

const platforms = ["Genesys", "Amazon Connect", "Five9", "Other"]

function formatK(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  return `$${Math.round(n / 1000)}K`
}

export function RoiCalculator() {
  const [sizeIdx, setSizeIdx] = useState(2)
  const [selected, setSelected] = useState<number[]>([0, 1, 5])
  const [platform, setPlatform] = useState("Genesys")

  const toggle = (i: number) =>
    setSelected((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]))

  const result = useMemo(() => {
    const base = sizeOptions[sizeIdx].base
    const factor = 0.35 + selected.length * 0.08
    const low = base * factor
    const high = base * (factor + 0.18)
    const mid = (low + high) / 2
    return {
      low,
      high,
      productivity: mid * 0.4,
      automation: mid * 0.28,
      turnover: mid * 0.18,
      quality: mid * 0.14,
    }
  }, [sizeIdx, selected])

  return (
    <section id="roi-calculator" className="bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">ROI Calculator</p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Calculate Your Potential Savings
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            Most contact centers we audit find $500K–$2M in annual improvement opportunity. Estimate yours in seconds.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Inputs */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-3">
            <fieldset>
              <legend className="text-sm font-semibold text-foreground">How many agents do you have?</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {sizeOptions.map((opt, i) => (
                  <button
                    key={opt.label}
                    onClick={() => setSizeIdx(i)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      sizeIdx === i
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground/80 hover:border-primary/40"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-7">
              <legend className="text-sm font-semibold text-foreground">
                Current challenges <span className="font-normal text-muted-foreground">(check all that apply)</span>
              </legend>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {challenges.map((c, i) => {
                  const active = selected.includes(i)
                  return (
                    <label
                      key={c}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                        active ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => toggle(i)}
                        className="h-4 w-4 accent-[oklch(0.5_0.18_258)]"
                      />
                      <span className="text-foreground/80">{c}</span>
                    </label>
                  )
                })}
              </div>
            </fieldset>

            <fieldset className="mt-7">
              <legend className="text-sm font-semibold text-foreground">Current platform</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {platforms.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      platform === p
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground/80 hover:border-primary/40"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          {/* Results */}
          <div className="flex flex-col rounded-2xl border border-primary/20 bg-[#0a1628] p-6 text-white shadow-lg lg:col-span-2">
            <div className="flex items-center gap-2 text-white/70">
              <Calculator className="h-5 w-5" aria-hidden="true" />
              <span className="text-sm font-semibold uppercase tracking-wider">Your opportunity</span>
            </div>

            <p className="mt-4 text-sm text-white/60">Annual savings potential</p>
            <p className="text-4xl font-bold tracking-tight text-success">
              {formatK(result.low)} – {formatK(result.high)}
            </p>

            <dl className="mt-6 space-y-3 border-t border-white/10 pt-5 text-sm">
              {[
                ["Productivity improvement", result.productivity],
                ["Automation value", result.automation],
                ["Turnover reduction", result.turnover],
                ["Quality / compliance", result.quality],
              ].map(([label, val]) => (
                <div key={label as string} className="flex items-center justify-between">
                  <dt className="text-white/60">{label as string}</dt>
                  <dd className="font-semibold text-white">{formatK(val as number)}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 text-sm">
              <div>
                <p className="text-white/50">Implementation cost</p>
                <p className="font-semibold text-white">$150K–$200K</p>
              </div>
              <div>
                <p className="text-white/50">Payback period</p>
                <p className="font-semibold text-white">2–3 months</p>
              </div>
            </div>

            <Button asChild className="mt-6 w-full bg-accent text-accent-foreground hover:bg-accent/90">
              <a href="#book-audit" className="flex items-center justify-center gap-2">
                Book Your Custom Audit
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
            <p className="mt-3 text-center text-xs text-white/40">
              Estimate based on {sizeOptions[sizeIdx].label} agents on {platform}. Your audit refines this.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
