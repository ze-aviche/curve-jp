"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { TrendingUp, ArrowRight, ShieldCheck, Clock, DollarSign } from "lucide-react"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => setLoading(false), 1500)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <aside className="hidden lg:flex flex-col w-[420px] xl:w-[480px] bg-[#0a1628] text-white p-12 sticky top-0 h-screen">
        <Link href="/" className="flex items-center gap-3 mb-16">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl">Optimize<span className="text-blue-400">CC</span></span>
        </Link>

        <div className="flex-1">
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Your contact center<br />audit portal
          </h2>
          <p className="text-white/60 text-lg leading-relaxed mb-12">
            Sign in to track your audit progress, review identified gaps, and access your improvement roadmap.
          </p>

          <div className="space-y-5">
            {[
              { icon: ShieldCheck, title: "SOC 2 Type II Certified", desc: "Enterprise-grade security for your data" },
              { icon: Clock, title: "Quick turnaround", desc: "Receive your audit report fast" },
              { icon: DollarSign, title: "$500K–$2M opportunity", desc: "Average savings identified per audit" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">{title}</p>
                  <p className="text-white/50 text-sm mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/20 text-sm">© 2025 OptimizeCC. All rights reserved.</p>
      </aside>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-10">
            <div className="w-10 h-10 bg-[#0a1628] rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-2xl text-slate-900">Optimize<span className="text-blue-600">CC</span></span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h1>
            <p className="text-slate-500 text-base">Sign in to your audit portal</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email address</label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-700">Password</label>
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Forgot password?</a>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#0a1628] hover:bg-[#0a1628]/90 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors text-base mt-2"
              >
                {loading
                  ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><span>Sign In</span><ArrowRight className="w-5 h-5" /></>}
              </motion.button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              <p className="text-base text-slate-500">
                New client?{" "}
                <Link href="/onboarding" className="text-blue-600 hover:text-blue-700 font-semibold">Start onboarding →</Link>
              </p>
            </div>
          </div>

          <p className="text-center text-slate-400 text-sm mt-6">
            Protected by enterprise-grade encryption · SOC 2 Type II
          </p>
        </motion.div>
      </div>
    </div>
  )
}
