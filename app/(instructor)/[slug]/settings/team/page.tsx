"use client"

import { RequireAcademy } from "@/components/settings/settings-section"
import { TeamSettings } from "@/components/settings/tabs"

export default function TeamPage() {
  return (
    <div className="py-10">
      <RequireAcademy>
        {(academyId) => <TeamSettings disabled={false} academyId={academyId} />}
      </RequireAcademy>
    </div>
  )
}
