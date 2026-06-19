"use client"

import { useState } from "react"
import { CheckCircle2, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

const platforms = ["Genesys", "Amazon Connect", "Five9", "Other"]
const sizes = ["25–50", "50–100", "100–300", "300–500", "500+"]
const painPoints = [
  "Long handle time (AHT)",
  "Low first contact resolution",
  "Low customer satisfaction",
  "High agent turnover",
  "Poor system integration",
  "Compliance / quality gaps",
]

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"

export function CtaForm() {
  const [submitted, setSubmitted] = useState(false)

  return (
    <section id="book-audit" className="bg-[#0a1628] py-20 text-white sm:py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Book Your Audit</p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            See Your Opportunities in 6 Weeks
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-white/70">
            Most contact centers find $500K–$2M in annual improvement opportunity. Let&apos;s find yours—with zero
            implementation risk.
          </p>
          <ul className="mt-8 space-y-3">
            {[
              "Comprehensive 100-feature audit",
              "Prioritized roadmap with clear ROI",
              "Executive presentation of findings",
              "Money-back guarantee if you're not satisfied",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-white/80">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:p-8">
          {submitted ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-14 w-14 text-success" aria-hidden="true" />
              <h3 className="mt-4 text-xl font-bold">Thank you!</h3>
              <p className="mt-2 max-w-sm text-white/70">
                We&apos;ll contact you within 24 hours to discuss next steps. Your information is secure and
                confidential.
              </p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setSubmitted(true)
              }}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              <div className="sm:col-span-2">
                <label htmlFor="company" className="text-sm font-medium text-white/80">
                  Company name
                </label>
                <input id="company" name="company" required className={fieldClass} placeholder="Acme Financial" />
              </div>
              <div>
                <label htmlFor="name" className="text-sm font-medium text-white/80">
                  Name
                </label>
                <input id="name" name="name" required className={fieldClass} placeholder="Jane Doe" />
              </div>
              <div>
                <label htmlFor="email" className="text-sm font-medium text-white/80">
                  Work email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className={fieldClass}
                  placeholder="jane@company.com"
                />
              </div>
              <div>
                <label htmlFor="phone" className="text-sm font-medium text-white/80">
                  Phone
                </label>
                <input id="phone" name="phone" type="tel" className={fieldClass} placeholder="(555) 000-0000" />
              </div>
              <div>
                <label htmlFor="platform" className="text-sm font-medium text-white/80">
                  Current platform
                </label>
                <select id="platform" name="platform" className={fieldClass} defaultValue="">
                  <option value="" disabled>
                    Select
                  </option>
                  {platforms.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="agents" className="text-sm font-medium text-white/80">
                  Number of agents
                </label>
                <select id="agents" name="agents" className={fieldClass} defaultValue="">
                  <option value="" disabled>
                    Select
                  </option>
                  {sizes.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="pain" className="text-sm font-medium text-white/80">
                  Top pain point
                </label>
                <select id="pain" name="pain" className={fieldClass} defaultValue="">
                  <option value="" disabled>
                    Select
                  </option>
                  {painPoints.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-start gap-2 text-sm text-white/70 sm:col-span-2">
                <input type="checkbox" defaultChecked className="mt-0.5 h-4 w-4 accent-[oklch(0.7_0.19_38)]" />
                I&apos;d like to hear about implementation options
              </label>
              <label className="flex items-start gap-2 text-sm text-white/70 sm:col-span-2">
                <input type="checkbox" defaultChecked className="mt-0.5 h-4 w-4 accent-[oklch(0.7_0.19_38)]" />
                Send me industry insights &amp; benchmarks
              </label>

              <Button
                type="submit"
                size="lg"
                className="mt-2 w-full bg-accent text-accent-foreground hover:bg-accent/90 sm:col-span-2"
              >
                Book Your Audit
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-center text-xs text-white/50 sm:col-span-2">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                We&apos;ll contact you within 24 hours. Your information is secure and confidential.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
