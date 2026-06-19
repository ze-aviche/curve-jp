"use client"

import { useState } from "react"
import { Menu, X, ChevronDown, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"

const navItems = [
  {
    label: "Product",
    children: ["How It Works", "Features", "ROI Calculator"],
  },
  {
    label: "Solutions",
    children: ["For Genesys Users", "For Amazon Connect Users", "For Five9 Users", "For Enterprise"],
  },
  { label: "Case Studies", href: "#case-studies" },
  { label: "Pricing", href: "#pricing" },
  { label: "Blog", href: "#" },
  { label: "Docs", href: "#" },
]

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-bold tracking-tight text-foreground">
            Optimize<span className="text-primary">CC</span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {navItems.map((item) =>
            item.children ? (
              <div key={item.label} className="group relative">
                <button className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground">
                  {item.label}
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                </button>
                <div className="invisible absolute left-0 top-full w-56 translate-y-1 rounded-xl border border-border bg-card p-2 opacity-0 shadow-lg transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  {item.children.map((child) => (
                    <a
                      key={child}
                      href="#"
                      className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      {child}
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              <a
                key={item.label}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
              >
                {item.label}
              </a>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a href="/login" className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground">
            Sign In
          </a>
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
            <a href="/onboarding">Book Audit</a>
          </Button>
        </div>

        <button
          className="inline-flex items-center justify-center rounded-md p-2 text-foreground lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4" aria-label="Mobile">
            {navItems.map((item) => (
              <div key={item.label}>
                <a
                  href={item.href ?? "#"}
                  className="block rounded-md px-3 py-3 text-base font-medium text-foreground hover:bg-secondary"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </a>
              </div>
            ))}
            <Button asChild className="mt-2 bg-accent text-accent-foreground hover:bg-accent/90">
              <a href="#book-audit" onClick={() => setMobileOpen(false)}>
                Book Audit
              </a>
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}
