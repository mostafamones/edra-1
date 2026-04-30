"use client"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function Page() {
  const router = useRouter()
  const { activeAcademy } = useAuth()
  
  return (
    <div className="flex h-svh w-svw items-center justify-center">
      <div className="flex flex-col text-sm leading-loose items-center justify-center">
        <h1 className="font-semibold text-lg">Signed Up Successfully</h1>
        <p className="text-muted-foreground">You can now create your first academy.</p>
        <div className="flex gap-2 mt-4">
          <Button onClick={() => router.push("/onboarding")}>Create Academy</Button>
          <Button onClick={() => router.push(`/${activeAcademy?.slug}/dashboard`)}>Go to Dashboard</Button>
        </div>
      </div>
    </div>
  )
}
