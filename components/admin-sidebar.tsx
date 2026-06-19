"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, TrendingUp, LogOut } from "lucide-react"

const links = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/admin/clients", icon: Users, label: "Clients" },
]

export default function AdminSidebar() {
  const path = usePathname()
  return (
    <aside className="hidden lg:flex w-60 flex-col min-h-screen bg-white border-r border-slate-200">
      <Link href="/" className="flex items-center gap-2.5 px-5 h-16 border-b border-slate-100">
        <div className="w-7 h-7 bg-[#0a1628] rounded-lg flex items-center justify-center">
          <TrendingUp className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-slate-900 font-bold text-lg">Optimize<span className="text-blue-600">CC</span></span>
      </Link>

      <div className="px-3 py-4 border-b border-slate-100">
        <p className="px-3 text-xs text-slate-400 uppercase tracking-widest font-semibold">Admin Console</p>
      </div>

      <div className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ href, icon: Icon, label }) => {
          const active = path === href || path.startsWith(href + "/")
          return (
            <Link key={href} href={href}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-blue-50 text-blue-600 border border-blue-200"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}>
                <Icon className="w-4 h-4" />
                {label}
              </div>
            </Link>
          )
        })}
      </div>

      <div className="px-3 pb-5 border-t border-slate-100 pt-4">
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all w-full">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
