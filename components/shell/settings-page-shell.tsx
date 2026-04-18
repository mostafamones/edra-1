import { SiteHeader } from "@/components/site-header"
import { ScrollArea } from "@/components/ui/scroll-area"

type SettingsPageShellProps = {
  children: React.ReactNode
  topNav: React.ReactNode
}

/**
 * Settings chrome inside SidebarInset: header stays fixed while content owns the scroll area.
 */
export function SettingsPageShell({ children, topNav }: SettingsPageShellProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SiteHeader title="Settings" />
      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto max-w-5xl px-10 pt-2 pb-10 lg:max-w-6xl lg:px-12">
          {topNav}
          {children}
        </div>
      </ScrollArea>
    </div>
  )
}
