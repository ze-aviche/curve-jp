import { Check, X } from "lucide-react"

const rows = [
  { label: "Speed", cc: "6 weeks", consulting: "3–4 months", inhouse: "6–12 months" },
  { label: "Cost", cc: "$50K–$650K", consulting: "$500K–$2M", inhouse: "$1M+" },
  { label: "Expertise focus", cc: "CC-focused", consulting: "Generalist", inhouse: "Limited" },
  { label: "Framework", cc: "100-feature", consulting: "Generic", inhouse: "Ad-hoc" },
  { label: "ROI clarity", cc: "Very clear", consulting: "Vague", inhouse: "Unknown" },
  { label: "Implementation", cc: "Guided", consulting: "Hands-off", inhouse: "DIY" },
  { label: "Results certainty", cc: "High", consulting: "Medium", inhouse: "Low" },
]

export function Comparison() {
  return (
    <section className="bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Why OptimizeCC</p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Why OptimizeCC Wins
          </h2>
        </div>

        <div className="mt-12 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-4 font-semibold text-muted-foreground" scope="col"></th>
                  <th className="bg-primary/5 px-5 py-4 text-center font-bold text-primary" scope="col">
                    OptimizeCC
                  </th>
                  <th className="px-5 py-4 text-center font-semibold text-foreground" scope="col">
                    Big Consulting Firms
                  </th>
                  <th className="px-5 py-4 text-center font-semibold text-foreground" scope="col">
                    In-House Build
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.label} className={i % 2 ? "bg-secondary/40" : ""}>
                    <th scope="row" className="px-5 py-4 font-medium text-foreground">
                      {row.label}
                    </th>
                    <td className="bg-primary/5 px-5 py-4 text-center font-semibold text-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Check className="h-4 w-4 text-success" aria-hidden="true" />
                        {row.cc}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center text-muted-foreground">{row.consulting}</td>
                    <td className="px-5 py-4 text-center text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <X className="h-4 w-4 text-destructive/60" aria-hidden="true" />
                        {row.inhouse}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          We <span className="font-semibold text-foreground">only</span> do contact center optimization—18+ years of deep,
          specialized expertise.
        </p>
      </div>
    </section>
  )
}
