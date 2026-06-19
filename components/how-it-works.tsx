import { Button } from "@/components/ui/button"
import { Search, BarChart3, Rocket } from "lucide-react"

const steps = [
  {
    icon: Search,
    step: "1",
    title: "Discovery",
    body: "We get a clear picture of your current contact center setup, systems, and goals.",
  },
  {
    icon: BarChart3,
    step: "2",
    title: "Analysis",
    body: "AI-powered analysis surfaces gaps and quantifies every opportunity by business impact and ROI.",
  },
  {
    icon: Rocket,
    step: "3",
    title: "Roadmap Delivery",
    body: "You receive a prioritized action plan with clear next steps—ready to execute immediately.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-secondary/60 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">How It Works</p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            From Audit to Action Plan — Fast
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            A straightforward process designed to deliver clarity and results with minimal disruption to your team.
          </p>
        </div>

        <ol className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map(({ icon: Icon, step, title, body }) => (
            <li key={step} className="relative flex flex-col rounded-2xl border border-border bg-card p-8 shadow-sm">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {step}
                </span>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
              <h3 className="mt-5 text-xl font-bold text-foreground">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 text-center">
          <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
            <a href="#book-audit">Book Your Free Audit</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
