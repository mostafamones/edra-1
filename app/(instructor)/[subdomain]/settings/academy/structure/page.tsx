"use client"

import { RequireAcademy } from "@/components/settings/settings-section"
import { AcademyStructure } from "@/components/settings/tabs/academy-parts/academy-structure"

export default function AcademyStructurePage() {
  return (
    <RequireAcademy>
      {(academyId) => (
        <AcademyStructure
          disabled={false}
          academyId={academyId}
          title={<div className="text-lg font-medium">Levels</div>}
        />
      )}
    </RequireAcademy>
  )
}
