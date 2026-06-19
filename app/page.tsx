import { SiteHeader } from "@/components/site-header"
import { Hero } from "@/components/hero"
import { ProblemStats } from "@/components/problem-stats"
import { Solution } from "@/components/solution"
import { HowItWorks } from "@/components/how-it-works"
import { CaseStudies } from "@/components/case-studies"
import { RoiCalculator } from "@/components/roi-calculator"
import { Testimonials } from "@/components/testimonials"
import { Comparison } from "@/components/comparison"
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
        <CaseStudies />
        <RoiCalculator />
        <Testimonials />
        <Comparison />
        <CtaForm />
      </main>
      <SiteFooter />
    </>
  )
}
