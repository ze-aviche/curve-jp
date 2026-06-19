import { Button } from "@/components/ui/button"

const timeline = [
  {
    week: "Week 1–2",
    title: "Discovery",
    status: "Understanding your current state",
    points: [
      "You answer a detailed questionnaire (4–6 hours)",
      "We get secure, read-only system access",
      "We review your documentation",
    ],
  },
  {
    week: "Week 3",
    title: "Data Collection & Analysis",
    status: "Building a comprehensive data picture",
    points: [
      "Automated collection from your systems via APIs",
      "Simple manual export templates",
      "Key stakeholder interviews",
    ],
  },
  {
    week: "Week 4–5",
    title: "Analysis & Reporting",
    status: "Generating your detailed audit report",
    points: [
      "AI-powered analysis against the 100-feature framework",
      "Gap scoring and ROI calculation",
      "Solution design for each gap",
    ],
  },
  {
    week: "Week 6",
    title: "Presentation & Next Steps",
    status: "Ready to implement (optional)",
    points: [
      "Audit report delivery (50+ pages)",
      "Executive presentation of findings",
      "Recommended implementation roadmap",
    ],
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-secondary/60 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">How It Works</p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            From Audit to Implementation in 6 Weeks
          </h2>
        </div>

        <ol className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {timeline.map((step, i) => (
            <li key={step.week} className="relative flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-accent">{step.week}</span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-foreground">{step.title}</h3>
              <ul className="mt-3 flex-1 space-y-2">
                {step.points.map((p) => (
                  <li key={p} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-info" aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
              <p className="mt-4 rounded-lg bg-info/10 px-3 py-2 text-xs font-medium text-info">{step.status}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 text-center">
          <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
            <a href="#book-audit">See What&apos;s In the Audit Report</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
