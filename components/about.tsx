import { Award, ShieldCheck, Lock, BadgeCheck } from "lucide-react"

const credentials = [
  "18+ years in contact center technology",
  "Former VP of AI Product at JPMorgan Chase",
  "Expert in Genesys, Amazon Connect & CC architecture",
  "Led platform migrations & AI integration at scale",
]

const trust = [
  { icon: ShieldCheck, label: "SOC 2 Type II Certified" },
  { icon: Lock, label: "HIPAA & GLBA Compliant" },
  { icon: BadgeCheck, label: "Zero access to customer PII" },
  { icon: Award, label: "End-to-end encryption" },
]

export function About() {
  return (
    <section className="bg-secondary/60 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">About Us</p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Built by Contact Center Experts
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div className="flex flex-col items-start gap-6 sm:flex-row">
            <img
              src="/images/founder.png"
              alt="Avinash Chennamadhav, Founder and CEO of OptimizeCC"
              className="h-40 w-40 shrink-0 rounded-2xl object-cover shadow-md"
            />
            <div>
              <h3 className="text-xl font-bold text-foreground">Avinash Chennamadhav</h3>
              <p className="text-sm font-medium text-primary">Founder &amp; CEO</p>
              <ul className="mt-4 space-y-2">
                {credentials.map((c) => (
                  <li key={c} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <blockquote className="rounded-2xl border border-border bg-card p-7 text-pretty leading-relaxed text-foreground/85 shadow-sm">
            &ldquo;I spent years consulting with banks and enterprises on contact center optimization. The work was
            repetitive but valuable. I realized this can be systematized with AI. Now we deliver the same insights at 10x
            speed and 1/10th the cost. Contact center leaders finally have a clear path to excellence.&rdquo;
            <footer className="mt-4 text-sm font-semibold text-muted-foreground">— Avinash, on why he built OptimizeCC</footer>
          </blockquote>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {trust.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-4 shadow-sm"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-sm font-medium text-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
