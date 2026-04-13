import { SiteHeader } from "@/components/site-header"

export default function Page() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <SiteHeader title="Dashboard" />
      <main className="flex-1 overflow-auto px-4 pb-4 lg:px-6 lg:pb-6">
        <div className="grid grid-rows-2 gap-3 lg:gap-3 h-full">
          {/* Big Box - Top Half */}
          <div className="group rounded-xl border shadow-sm transition-all hover:shadow-md flex flex-col">
          </div>

          {/* Lower Half - Two Quarters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-3">
            <div className="group rounded-xl border shadow-sm transition-all hover:shadow-md flex flex-col">
            </div>

            <div className="group rounded-xl border shadow-sm transition-all hover:shadow-md flex flex-col">
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
