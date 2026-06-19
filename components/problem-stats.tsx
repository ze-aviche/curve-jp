import { TrendingDown, Clock, Users, BarChart3 } from "lucide-react"

const stats = [
  {
    icon: TrendingDown,
    stat: "60%",
    label: "of contact centers",
    detail: "are missing critical features that would improve efficiency",
    source: "Industry benchmarking study",
  },
  {
    icon: Clock,
    stat: "$500K–$2M",
    label: "per year",
    detail: "in untapped improvement opportunity for typical mid-size centers",
    source: "Our 100+ customer analysis",
  },
  {
    icon: Users,
    stat: "42 / 100",
    label: "average maturity score",
    detail: "Most centers operate at only 42 out of 100 ideal features",
    source: "OptimizeCC audit framework",
  },
  {
    icon: BarChart3,
    stat: "3–5 years",
    label: "to self-diagnose",
    detail: "to identify and implement improvements without expert guidance",
    source: "Industry practice patterns",
  },
]

export function ProblemStats() {
  return (
    <section className="bg-secondary/60 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">The Problem</p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Contact Centers Are Operating Below Capacity
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            Your contact center wasn&apos;t built all at once. It evolved—a patchwork of platforms, integrations, and
            manual processes. The result is siloed systems and untapped potential.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ icon: Icon, stat, label, detail, source }) => (
            <div
              key={label}
              className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="mt-5 text-3xl font-bold tracking-tight text-foreground">{stat}</p>
              <p className="text-sm font-semibold text-foreground/80">{label}</p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{detail}</p>
              <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground/80">{source}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
