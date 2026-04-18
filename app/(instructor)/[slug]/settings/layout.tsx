import { SettingsPageShell } from "@/components/shell/settings-page-shell"
import { SettingsTopNav } from "@/components/settings/settings-top-nav"

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <SettingsPageShell topNav={<SettingsTopNav />}>{children}</SettingsPageShell>
}
