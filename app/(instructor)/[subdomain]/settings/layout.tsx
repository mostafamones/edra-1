import { SiteHeader } from "@/components/site-header"
import { SettingsTopNav } from "@/components/settings/settings-top-nav"

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden">
      <SiteHeader title="Settings" />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-10 lg:px-12 lg:max-w-6xl pt-2">
          <SettingsTopNav />
          {children}
        </div>
      </main>
    </div>
  )
}
