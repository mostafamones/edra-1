"use client"

import { RequireAcademy } from "@/components/settings/settings-section"
import { AcademyDetails } from "@/components/settings/tabs/academy-parts/academy-details"

export default function AcademyGeneralPage() {
  return (
    <RequireAcademy>
      {(academyId) => <AcademyDetails academyId={academyId} />}
    </RequireAcademy>
  )
}
