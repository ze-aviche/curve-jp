import { Check, Star } from "lucide-react"
import { Button } from "@/components/ui/button"

const tiers = [
  {
    name: "Audit Only",
    price: "$50K",
    note: "6-week timeline",
    bestFor: "Exploratory analysis, budget planning",
    features: [
      "Comprehensive 100-feature audit",
      "Gap analysis & ROI calculations",
      "50+ page audit report",
      "Executive presentation",
    ],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Audit + Quick Wins",
    price: "$150K–$200K",
    note: "12-week timeline",
    bestFor: "Action-oriented teams wanting fast ROI",
    features: [
      "Everything in Audit",
      "Implementation of 3–5 quick wins",
      "Results tracking",
      "Savings identified: $500K–$1M",
      "Typical payback: 2–3 months",
    ],
    cta: "Get Started",
    highlight: true,
  },
  {
    name: "Full Implementation",
    price: "$400K–$650K",
    note: "12-month timeline",
    bestFor: "Transformation mindset, full optimization",
    features: [
      "Everything in Tiers 1 & 2",
      "All prioritized solutions implemented",
      "Ongoing optimization (6 months)",
      "Change management support",
      "Savings identified: $1M–$2M / year",
    ],
    cta: "Schedule Consultation",
    highlight: false,
  },
]

const faqs = [
  {
    q: "Can I scale from Audit to Implementation?",
    a: "Yes. Every engagement starts with the audit, and you can upgrade to Quick Wins or Full Implementation at any point—your audit investment carries over.",
  },
  {
    q: "Are there additional fees?",
    a: "Pricing is transparent with no hidden fees. Some AI-powered features (e.g. NLU IVR) carry ongoing platform costs, which we disclose up front in your roadmap.",
  },
  {
    q: "What's included in the audit timeline?",
    a: "Discovery, automated and manual data collection, AI-powered analysis against the 100-feature framework, ROI scoring, and an executive presentation of findings—all within 6 weeks.",
  },
  {
    q: "What if I want different options?",
    a: "Pricing is modular. We tailor scope to your contact center size, platform, and goals during the initial consultation.",
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="bg-secondary/60 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Pricing</p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Transparent Pricing. No Surprises.
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            Priced around ROI, not cost—10x cheaper than big consulting firms.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl border bg-card p-7 shadow-sm ${
                tier.highlight ? "border-primary ring-2 ring-primary lg:-mt-4 lg:pb-11" : "border-border"
              }`}
            >
              {tier.highlight && (
                <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                  <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                  Most Popular
                </span>
              )}
              <h3 className="text-lg font-bold text-foreground">{tier.name}</h3>
              <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">{tier.price}</p>
              <p className="text-sm text-muted-foreground">{tier.note}</p>
              <p className="mt-4 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Best for:</span> {tier.bestFor}
              </p>
              <ul className="mt-5 flex-1 space-y-3 border-t border-border pt-5">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground/85">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className={`mt-7 w-full ${
                  tier.highlight
                    ? "bg-accent text-accent-foreground hover:bg-accent/90"
                    : ""
                }`}
                variant={tier.highlight ? "default" : "outline"}
              >
                <a href="#book-audit">{tier.cta}</a>
              </Button>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-16 max-w-3xl">
          <h3 className="text-center text-xl font-bold text-foreground">Frequently asked questions</h3>
          <div className="mt-6 space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-xl border border-border bg-card p-5">
                <summary className="flex cursor-pointer items-center justify-between font-semibold text-foreground marker:content-['']">
                  {faq.q}
                  <span className="ml-4 text-muted-foreground transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
