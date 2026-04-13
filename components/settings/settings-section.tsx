"use client"

import { useAuth } from "@/components/auth-provider"

interface RequireAcademyProps {
  children: (academyId: string) => React.ReactNode
}

export function RequireAcademy({ children }: RequireAcademyProps) {
  const { activeAcademy, academiesLoading } = useAuth()
  if (academiesLoading || !activeAcademy) return null
  return <>{children(activeAcademy.id)}</>
}
