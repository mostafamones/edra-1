import { AcademySubNav } from "@/components/settings/academy-sub-nav"

export default function AcademySettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-8 h-full py-10">
      <AcademySubNav />
      <div className="flex-1 min-w-0 p-4 pb-8 bg-input/10 rounded-xl shadow-xl">
        {children}
      </div>
    </div>
  )
}
