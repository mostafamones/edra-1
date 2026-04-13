"use client"

import { RequireAcademy } from "@/components/settings/settings-section"
import { NotificationsSettings } from "@/components/settings/tabs"

export default function NotificationsPage() {
  return (
    <div className="py-10">
      <RequireAcademy>
        {(academyId) => <NotificationsSettings disabled={false} academyId={academyId} />}
      </RequireAcademy>
    </div>
  )
}
