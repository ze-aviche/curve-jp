"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, Map, MessageSquare, Phone, TrendingUp, LogOut } from "lucide-react"

const links = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/audit", icon: FileText, label: "Audit Report" },
  { href: "/roadmap", icon: Map, label: "Roadmap" },
  { href: "/chat", icon: MessageSquare, label: "Policy Chat" },
  { href: "/voice-analytics", icon: Phone, label: "Voice Analytics" },
]

export default function CustomerSidebar() {
  const path = usePathname()
  return (
    <aside className="hidden lg:flex w-64 flex-col min-h-screen bg-[#0a1628] shrink-0">
      <Link href="/" className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <span className="text-white font-bold text-lg">Optimize<span className="text-blue-400">CC</span></span>
      </Link>

      <div className="flex-1 px-4 py-6 space-y-1">
        {links.map(({ href, icon: Icon, label }) => {
          const active = path === href || path.startsWith(href + "/")
          return (
            <Link key={href} href={href}>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                active
                  ? "bg-white/15 text-white border border-white/20"
                  : "text-white/50 hover:text-white hover:bg-white/8"
              }`}>
                <Icon className="w-5 h-5 shrink-0" />
                {label}
              </div>
            </Link>
          )
        })}
      </div>

      <div className="px-4 pb-6 border-t border-white/10 pt-5">
        <div className="px-4 py-3 mb-2 bg-white/8 rounded-xl">
          <p className="text-sm font-semibold text-white">Meridian Bank</p>
          <p className="text-xs text-white/40 mt-0.5">Audit in progress</p>
        </div>
        <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white/40 hover:text-white hover:bg-white/8 transition-all w-full">
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
