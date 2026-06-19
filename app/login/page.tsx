"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { TrendingUp, ArrowRight } from "lucide-react"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => setLoading(false), 1500)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-5">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-100/60 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 bg-[#0a1628] rounded-2xl flex items-center justify-center shadow-md">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-slate-900 font-bold text-2xl">
              Optimize<span className="text-blue-600">CC</span>
            </span>
          </Link>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Welcome back</h1>
          <p className="text-slate-400">Sign in to your audit portal</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
              <input
                type="email"
                placeholder="you@company.com"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <a href="#" className="text-sm text-blue-600 hover:text-blue-700">Forgot password?</a>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#0a1628] hover:bg-[#0a1628]/90 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg text-base"
            >
              {loading
                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>}
            </motion.button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-400">
              New client?{" "}
              <Link href="/onboarding" className="text-blue-600 hover:text-blue-700 font-semibold">Start onboarding →</Link>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-300 text-xs mt-5">
          Protected by enterprise-grade encryption · SOC 2 Type II
        </p>
      </motion.div>
    </div>
  )
}
