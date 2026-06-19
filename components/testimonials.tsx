import { Star, Quote } from "lucide-react"

const testimonials = [
  {
    quote:
      "OptimizeCC identified gaps we didn't even know we had. The audit was thorough, the recommendations were specific, and the ROI was clear. By month 2, we were already seeing results.",
    name: "John Smith",
    title: "VP Operations",
    company: "Regional Bank, $10B+ assets",
  },
  {
    quote:
      "We've worked with big consulting firms. OptimizeCC was faster, cheaper, and more actionable. The 100-feature framework is brilliant—finally, a clear standard for what 'excellent' looks like.",
    name: "Sarah Johnson",
    title: "Director of Technology",
    company: "MidState Insurance",
  },
  {
    quote:
      "The implementation support made all the difference. We didn't have to figure it out ourselves—they helped us execute quickly.",
    name: "Michael Chen",
    title: "Operations Manager",
    company: "Helios Tech",
  },
]

export function Testimonials() {
  return (
    <section className="bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Testimonials</p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Trusted by Contact Center Leaders
          </h2>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-warning text-warning" aria-hidden="true" />
              ))}
            </span>
            4.9 / 5.0 average across Google, G2 &amp; Capterra
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.name} className="flex flex-col rounded-2xl border border-border bg-card p-7 shadow-sm">
              <Quote className="h-8 w-8 text-primary/20" aria-hidden="true" />
              <blockquote className="mt-4 flex-1 text-pretty leading-relaxed text-foreground/85">
                {t.quote}
              </blockquote>
              <figcaption className="mt-6 border-t border-border pt-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {t.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.company}</p>
                  </div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
