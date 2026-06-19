import { Activity, Globe, AtSign } from "lucide-react"

const columns = [
  { title: "Company", links: ["About", "Team", "Careers", "Contact"] },
  { title: "Resources", links: ["Audit Guide", "Webinars", "Benchmarks", "Templates"] },
  { title: "Legal", links: ["Privacy", "Terms", "Security", "Compliance"] },
  { title: "Connect", links: ["LinkedIn", "Twitter", "Newsletter", "Support"] },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-6">
          <div className="col-span-2">
            <a href="#top" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Activity className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-lg font-bold tracking-tight text-foreground">
                Optimize<span className="text-primary">CC</span>
              </span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              AI-powered contact center optimization. We identify and quantify every opportunity—then help you capture
              it.
            </p>
            <div className="mt-5 flex gap-3">
              <a
                href="#"
                aria-label="LinkedIn"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Globe className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <AtSign className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} OptimizeCC. All rights reserved.</p>
          <p>SOC 2 Type II · HIPAA &amp; GLBA Compliant</p>
        </div>
      </div>
    </footer>
  )
}
