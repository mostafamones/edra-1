"use client"

import { RequireAcademy } from "@/components/settings/settings-section"
import { IntegerationSettings } from "@/components/settings/tabs"

export default function IntegrationsPage() {
  return (
    <div className="py-10">
      <RequireAcademy>
        {(academyId) => <IntegerationSettings disabled={false} academyId={academyId} />}
      </RequireAcademy>
    </div>
  )
}
