"use client"

import { RequireAcademy } from "@/components/settings/settings-section"
import { AccountSettings } from "@/components/settings/tabs"

export default function AccountPage() {
  return (
    <div className="py-10">
      <RequireAcademy>
        {(academyId) => <AccountSettings disabled={false} academyId={academyId} />}
      </RequireAcademy>
    </div>
  )
}
