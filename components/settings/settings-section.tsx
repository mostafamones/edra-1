"use client"

import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface RequireAcademyProps {
  children: (academyId: string) => React.ReactNode
}

function AcademyLoadingSkeleton() {
  return (
    <Card className="border-none bg-transparent shadow-none">
      <CardHeader className="space-y-2 px-0 pt-6">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-full max-w-md" />
      </CardHeader>
      <CardContent className="space-y-3 px-0 pb-8">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </CardContent>
    </Card>
  )
}

export function RequireAcademy({ children }: RequireAcademyProps) {
  const { activeAcademy, academiesLoading } = useAuth()
  if (academiesLoading) return <AcademyLoadingSkeleton />
  if (!activeAcademy) return null
  return <>{children(activeAcademy.id)}</>
}
