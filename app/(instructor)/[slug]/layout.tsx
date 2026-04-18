import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { cookies } from "next/headers"

export default async function AcademySlugLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false"

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 64)",
          "--header-height": "calc(var(--spacing) * 16)",
        } as React.CSSProperties
      }
      defaultOpen={defaultOpen}
    >
      <AppSidebar variant="sidebar" />
      <SidebarInset className="overflow-auto">{children}</SidebarInset>
    </SidebarProvider>
  )
}
