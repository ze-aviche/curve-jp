import { SiteHeader } from "@/components/site-header"
import { Hero } from "@/components/hero"
import { ProblemStats } from "@/components/problem-stats"
import { Solution } from "@/components/solution"
import { HowItWorks } from "@/components/how-it-works"
import { Framework } from "@/components/framework"
import { CaseStudies } from "@/components/case-studies"
import { RoiCalculator } from "@/components/roi-calculator"
import { Testimonials } from "@/components/testimonials"
import { Pricing } from "@/components/pricing"
import { Comparison } from "@/components/comparison"
import { About } from "@/components/about"
import { CtaForm } from "@/components/cta-form"
import { SiteFooter } from "@/components/site-footer"

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <ProblemStats />
        <Solution />
        <HowItWorks />
        <Framework />
        <CaseStudies />
        <RoiCalculator />
        <Testimonials />
        <Pricing />
        <Comparison />
        <About />
        <CtaForm />
      </main>
      <SiteFooter />
    </>
  )
}
