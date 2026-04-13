"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { withAcademyPath } from "@/components/helpers/sidebar"

export default function EditStudentRedirectPage() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    router.replace(withAcademyPath(pathname, "/students"))
  }, [router, pathname])

  return null
}
