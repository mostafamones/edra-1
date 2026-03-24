import { SiteHeader } from "@/components/site-header"
import { SettingsWrapper } from "@/components/settings/settings"

export default async function SettingsPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden">
      <SiteHeader title="Settings" />
      <main className="flex-1 overflow-y-auto px-4 pb-4 lg:px-6 lg:pb-6">
        <SettingsWrapper defaultValue={tab} />
      </main>
    </div>
  )
}