import CustomerSidebar from "@/components/customer-sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <CustomerSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
