"use client"

import { useState } from "react"
import { Phone, ShieldCheck, BarChart3, Database, Bot, Heart, Headset, Building2, ChevronDown } from "lucide-react"

const categories = [
  {
    icon: Phone,
    name: "Inbound Call Handling",
    count: 15,
    examples: ["Intelligent routing", "AI-powered IVR", "Real-time coaching", "Skills-based distribution", "Callback queuing"],
  },
  {
    icon: ShieldCheck,
    name: "Compliance & Risk",
    count: 12,
    examples: ["Recording compliance", "Fraud detection", "Audit trails", "PCI redaction", "Consent management"],
  },
  {
    icon: BarChart3,
    name: "Analytics & Insights",
    count: 15,
    examples: ["Live dashboards", "Predictive analytics", "Churn prediction", "Sentiment analysis", "Custom reporting"],
  },
  {
    icon: Database,
    name: "Integration & Data",
    count: 12,
    examples: ["CRM integration", "Unified data model", "API orchestration", "Data warehousing", "Event streaming"],
  },
  {
    icon: Bot,
    name: "Automation & AI",
    count: 15,
    examples: ["Virtual agents", "Agent assist", "Auto-summaries", "Workflow automation", "Generative responses"],
  },
  {
    icon: Heart,
    name: "Customer Experience",
    count: 13,
    examples: ["Omnichannel", "Proactive outreach", "Self-service portal", "Personalization", "CSAT capture"],
  },
  {
    icon: Headset,
    name: "Agent Experience",
    count: 10,
    examples: ["Unified desktop", "Knowledge base", "Gamification", "Scheduling", "Performance coaching"],
  },
  {
    icon: Building2,
    name: "Business Operations",
    count: 8,
    examples: ["WFM forecasting", "Capacity planning", "Cost analytics", "SLA management"],
  },
]

export function Framework() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">The 100-Feature Framework</p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Our Framework Covers Every Aspect of Excellence
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            100 features that define best-in-class contact centers, organized across 8 functional areas—each one
            measurable and prioritized.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2">
          {categories.map(({ icon: Icon, name, count, examples }, i) => {
            const isOpen = open === i
            return (
              <div key={name} className="rounded-2xl border border-border bg-card shadow-sm">
                <button
                  className="flex w-full items-center gap-4 p-5 text-left"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-semibold text-foreground">{name}</span>
                    <span className="text-sm text-muted-foreground">{count} features covered</span>
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <ul className="flex flex-wrap gap-2 border-t border-border px-5 py-4">
                    {examples.map((ex) => (
                      <li
                        key={ex}
                        className="rounded-full bg-secondary px-3 py-1 text-sm text-foreground/80"
                      >
                        {ex}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>

        <p className="mt-8 text-center text-sm font-medium text-muted-foreground">
          <span className="font-bold text-foreground">100 features</span> across all categories — a clear standard for
          what &ldquo;excellent&rdquo; looks like.
        </p>
      </div>
    </section>
  )
}
