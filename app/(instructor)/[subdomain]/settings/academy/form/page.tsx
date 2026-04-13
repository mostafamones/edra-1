"use client"

import { RequireAcademy } from "@/components/settings/settings-section"
import { AcademyFields } from "@/components/settings/tabs/academy-parts/academy-fields"

export default function AcademyFormPage() {
  return (
    <RequireAcademy>
      {(academyId) => (
        <AcademyFields
          disabled={false}
          academyId={academyId}
          title={<div className="text-lg font-medium">Custom Fields</div>}
        />
      )}
    </RequireAcademy>
  )
}
