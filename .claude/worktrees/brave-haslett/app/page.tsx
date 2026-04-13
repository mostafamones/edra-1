"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function Page() {
  const router = useRouter()
  return (
    <div className="flex h-svh w-svw items-center justify-center">
      <div className="flex flex-col text-sm leading-loose items-center justify-center">
        <h1 className="font-semibold text-lg">Signed Up Successfully</h1>
        <p className="text-muted-foreground">You can now create your first academy.</p>
        <Button className="mt-4" onClick={() => router.push("/create")}>Create Academy</Button>
      </div>
    </div>
  )
}
