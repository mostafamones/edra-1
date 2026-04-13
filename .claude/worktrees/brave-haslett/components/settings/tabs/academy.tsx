import { SettingsTabProps } from "@/components/helpers/settings"
import { AcademyDetails } from "./academy-parts/academy-details"
import { AcademyFields } from "./academy-parts/academy-fields"
import { AcademyStructure } from "./academy-parts/academy-structure"
import { Badge } from "@/components/ui/badge"
import { IconBuildingArch, IconForms, IconHierarchy2 } from "@tabler/icons-react"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export function AcademySettings({ disabled, academyId }: SettingsTabProps) {
  return (
    <Card className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-10">
      <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
        <div>
          <p className="text-base font-semibold">Academy Workspace</p>
          <p className="text-sm text-muted-foreground">Manage identity, structure, and student schema.</p>
        </div>
        {disabled && <Badge variant="outline">View Only</Badge>}
      </div>

      <div className="flex items-center gap-2 px-4 text-xs text-muted-foreground">
        <IconBuildingArch className="size-3.5" />
        Details
      </div>
      <AcademyDetails disabled={disabled} academyId={academyId} />
      <Separator className="max-w-2xl mx-auto" />

      <div className="flex items-center gap-2 px-4 text-xs text-muted-foreground">
        <IconHierarchy2 className="size-3.5" />
        Structure
      </div>
      <AcademyStructure disabled={disabled} academyId={academyId} />
      <Separator className="max-w-2xl mx-auto" />

      <div className="flex items-center gap-2 px-4 text-xs text-muted-foreground">
        <IconForms className="size-3.5" />
        Fields
      </div>
      <AcademyFields disabled={disabled} academyId={academyId} />
    </Card>
  )
}