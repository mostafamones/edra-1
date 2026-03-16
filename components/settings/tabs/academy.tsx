import { SettingsTabProps } from "@/components/helpers/settings"
import { AcademyDetails } from "./academy-parts/academy-details"
import { AcademyFields } from "./academy-parts/academy-fields"
import { AcademyStructure } from "./academy-parts/academy-structure"

export function AcademySettings({ disabled, academyId }: SettingsTabProps) {
  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      <AcademyDetails disabled={disabled} academyId={academyId} />
      <AcademyStructure disabled={disabled} instructorId={academyId} />
      <AcademyFields disabled={disabled} instructorId={academyId} />
    </div>
  )
}