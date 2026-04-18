"use client"

import { RequireAcademy } from "@/components/settings/settings-section"
import { IntegrationSettings } from "@/components/settings/tabs"

export default function IntegrationsPage() {
  return (
    <div className="py-10">
      <RequireAcademy>
        {(academyId) => <IntegrationSettings disabled={false} academyId={academyId} />}
      </RequireAcademy>
    </div>
  )
}
