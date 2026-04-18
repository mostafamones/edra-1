import { AcademySubNav } from "@/components/settings/academy-sub-nav"
import { Card, CardContent } from "@/components/ui/card"

type AcademySettingsShellProps = {
  children: React.ReactNode
}

/**
 * Two-column academy settings layout: sub-nav + main surface as a Card.
 */
export function AcademySettingsShell({ children }: AcademySettingsShellProps) {
  return (
    <div className="flex h-full gap-8 py-10">
      <AcademySubNav />
      <Card className="min-w-0 flex-1 border-none bg-input/10 shadow-xl">
        <CardContent className="p-4 pb-8">{children}</CardContent>
      </Card>
    </div>
  )
}
