import { ClipboardCheck, LineChart, Wrench, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

const columns = [
  {
    icon: ClipboardCheck,
    phase: "Audit",
    title: "Comprehensive Framework Audit",
    body: "We conduct a thorough analysis of your contact center platform, processes, and technology stack.",
    items: ["Routing", "IVR", "Analytics", "Integrations", "Automation", "Compliance", "Agent Tools", "Operations"],
  },
  {
    icon: LineChart,
    phase: "Analyze",
    title: "Prioritized Gap Analysis",
    body: "Every gap is scored by business impact, implementation difficulty, and ROI potential.",
    items: ["Business impact", "Implementation difficulty", "ROI potential", "Prioritized roadmap—not a feature list"],
  },
  {
    icon: Wrench,
    phase: "Implement",
    title: "Guided Implementation",
    body: "Optionally, we help you implement fixes using autonomous agents.",
    items: ["Code changes", "Configuration", "Integration", "Optimization"],
  },
]

export function Solution() {
  return (
    <section className="bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Our Solution</p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            We Identify and Quantify Every Opportunity
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            See your contact center against a concrete framework for excellence—not a vague benchmark.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {columns.map(({ icon: Icon, phase, title, body, items }, i) => (
            <div
              key={phase}
              className="relative flex flex-col rounded-2xl border border-border bg-card p-7 shadow-sm"
            >
              <span className="absolute right-6 top-6 text-5xl font-bold text-secondary">{i + 1}</span>
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-accent">{phase}</p>
              <h3 className="mt-1 text-xl font-bold text-foreground">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
              <ul className="mt-5 grid grid-cols-2 gap-2 border-t border-border pt-5">
                {items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-foreground/80">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button asChild variant="outline" size="lg">
            <a href="#how-it-works">Learn More About Each Phase</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
