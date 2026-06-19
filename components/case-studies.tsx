import { ArrowRight, Landmark, ShieldCheck, Cpu } from "lucide-react"

const cases = [
  {
    icon: Landmark,
    company: "Regional Bank",
    meta: "$10B+ assets · 200-person contact center",
    challenge: "Low loan approval efficiency and manual processes",
    metrics: [
      { label: "Loan processing", value: "10 days → 2 days" },
      { label: "Approval automation", value: "20% → 75%" },
      { label: "CSAT", value: "3.2 → 4.5 ★" },
      { label: "Cost per approval", value: "$150 → $45" },
    ],
    savings: "$1.2M",
    payback: "1.5 months",
  },
  {
    icon: ShieldCheck,
    company: "Insurance Company",
    meta: "150-person claims processing center",
    challenge: "High processing times and low first-contact resolution",
    metrics: [
      { label: "Processing time", value: "30 days → 5 days" },
      { label: "First-contact resolution", value: "60% → 85%" },
      { label: "Agent productivity", value: "+40%" },
    ],
    savings: "$800K",
    payback: "2 months",
  },
  {
    icon: Cpu,
    company: "Enterprise Tech Company",
    meta: "300-person support center",
    challenge: "Poor tool integration and agent frustration",
    metrics: [
      { label: "Agent satisfaction", value: "+35%" },
      { label: "Attrition", value: "25% → 12%" },
      { label: "CSAT", value: "4.1 → 4.6" },
    ],
    savings: "$2M",
    payback: "3 months",
  },
]

export function CaseStudies() {
  return (
    <section id="case-studies" className="bg-secondary/60 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Real Results</p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            See the Impact We&apos;ve Delivered
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {cases.map(({ icon: Icon, company, meta, challenge, metrics, savings, payback }) => (
            <article key={company} className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-bold text-foreground">{company}</h3>
                  <p className="text-xs text-muted-foreground">{meta}</p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">Challenge:</span> {challenge}
              </p>

              <dl className="mt-4 space-y-2 border-t border-border pt-4">
                {metrics.map((m) => (
                  <div key={m.label} className="flex items-center justify-between gap-3 text-sm">
                    <dt className="text-muted-foreground">{m.label}</dt>
                    <dd className="text-right font-semibold text-foreground">{m.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-5 flex items-center justify-between rounded-xl bg-success/10 px-4 py-3">
                <div>
                  <p className="text-xs text-success/80">Annual savings</p>
                  <p className="text-xl font-bold text-success">{savings}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Payback</p>
                  <p className="text-sm font-semibold text-foreground">{payback}</p>
                </div>
              </div>

              <a
                href="#book-audit"
                className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                Read full case study
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
