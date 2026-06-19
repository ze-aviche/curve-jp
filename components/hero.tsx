import { Play, ShieldCheck, Clock, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-[#0a1628] text-white">
      {/* subtle deep-blue layered background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-info/20 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium text-white/80">
            <span className="h-2 w-2 rounded-full bg-success" aria-hidden="true" />
            AI-powered contact center audits
          </span>

          <h1 className="mt-6 text-pretty text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Unlock Hidden Potential in Your Contact Center
          </h1>

          <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-white/70">
            Our AI-powered audit identifies <span className="font-semibold text-white">$500K–$2M</span> in untapped
            improvement opportunities. Get a detailed roadmap quickly—with zero implementation risk.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <a href="#book-audit">Book Your Free Audit</a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <a href="#how-it-works" className="flex items-center gap-2">
                <Play className="h-4 w-4" aria-hidden="true" />
                Watch Demo
              </a>
            </Button>
          </div>

          <div className="mt-10">
            <p className="text-xs font-medium uppercase tracking-wider text-white/50">
              Trusted by 50+ mid-market &amp; enterprise contact centers
            </p>
            <div className="relative mt-4 overflow-hidden">
              <div className="flex animate-marquee gap-x-10 text-sm font-semibold text-white/40 whitespace-nowrap">
                <span>Regional Bank Group</span>
                <span>·</span>
                <span>MidState Insurance</span>
                <span>·</span>
                <span>Helios Tech</span>
                <span>·</span>
                <span>Northwind Financial</span>
                <span>·</span>
                <span>Summit Credit Union</span>
                <span>·</span>
                <span>Apex Telecom</span>
                <span>·</span>
                <span>Regional Bank Group</span>
                <span>·</span>
                <span>MidState Insurance</span>
                <span>·</span>
                <span>Helios Tech</span>
                <span>·</span>
                <span>Northwind Financial</span>
                <span>·</span>
                <span>Summit Credit Union</span>
                <span>·</span>
                <span>Apex Telecom</span>
                <span>·</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl ring-1 ring-white/10">
            <img
              src="/images/audit-dashboard.png"
              alt="OptimizeCC audit dashboard showing a 42 out of 100 capability score, gap analysis by category, and ROI projections"
              className="h-auto w-full"
            />
          </div>

          <div className="absolute -bottom-5 -left-4 hidden rounded-xl border border-white/10 bg-card p-4 text-card-foreground shadow-xl sm:block">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/15 text-success">
                <TrendingUp className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold">$1.2M+ savings</p>
                <p className="text-xs text-muted-foreground">identified per audit</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* trust strip */}
      <div className="relative border-t border-white/10 bg-black/20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-px px-4 py-6 sm:grid-cols-3 sm:px-6 lg:px-8">
          {[
            { icon: Clock, label: "Quick audit turnaround" },
            { icon: ShieldCheck, label: "SOC 2 Type II · zero PII access" },
            { icon: TrendingUp, label: "2–3 month typical payback" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center justify-center gap-2 text-sm text-white/70">
              <Icon className="h-4 w-4 text-success" aria-hidden="true" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
