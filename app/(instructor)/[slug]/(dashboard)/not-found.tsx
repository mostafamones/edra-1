"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { resolveAcademyBasePath } from "@/components/helpers/sidebar"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"

export default function DashboardNotFound() {
  const pathname = usePathname()
  const base = resolveAcademyBasePath(pathname)
  const dashboardHref = base ? `${base}/dashboard` : "/"

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Page not found</EmptyTitle>
          <EmptyDescription>This dashboard page does not exist or was removed.</EmptyDescription>
        </EmptyHeader>
        <Button asChild variant="outline">
          <Link href={dashboardHref}>Back to dashboard</Link>
        </Button>
      </Empty>
    </div>
  )
}
