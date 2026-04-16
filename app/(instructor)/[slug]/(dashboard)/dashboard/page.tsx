import { SiteHeader } from "@/components/site-header"
import { Card } from "@/components/ui/card"

export default function Page() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <SiteHeader title="Dashboard" />
      <main className="flex-1 overflow-auto px-4 pb-4 lg:px-6 lg:pb-6">
        <div className="grid grid-rows-2 gap-3 lg:gap-3 h-full">
          {/* Big Box - Top Half */}
          <Card className="group bg-card/50 transition-all hover:bg-card flex flex-col">
          </Card>

          {/* Lower Half - Two Quarters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-3">
            <Card className="group bg-card/50 transition-all hover:bg-card flex flex-col">
            </Card>

            <Card className="group bg-card/50 transition-all hover:bg-card flex flex-col">
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
