import { SettingsTabProps } from "@/components/helpers/settings"
import { AcademyDetails } from "./academy-parts/academy-details"
import { AcademyFields } from "./academy-parts/academy-fields"
import { AcademyStructure } from "./academy-parts/academy-structure"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const tabs = ["general", "structure", "form"]
const Title = ({ children }: { children: React.ReactNode }) => (
  <div className="text-lg font-medium">{children}</div>
)

export function AcademySettings({ disabled, academyId }: SettingsTabProps) {
  return (
    <div className="flex gap-8 h-full py-10">
      <Tabs defaultValue="general" orientation="vertical" className="flex gap-4 w-full">
        <TabsList className="flex flex-col h-fit w-44 shrink-0 bg-transparent p-0">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="w-full justify-start text-base border-none px-3 py-1.5 data-[state=active]:shadow-none"
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1 min-w-0 p-4 pb-8 bg-input/10 rounded-xl shadow-xl shadow-offset-t-2">
          <TabsContent value="general">
            <AcademyDetails disabled={disabled} academyId={academyId} />
          </TabsContent>
          <TabsContent value="structure">
            <AcademyStructure disabled={disabled} academyId={academyId} title={(<Title>Levels</Title>)} />
          </TabsContent>
          <TabsContent value="form">
            <AcademyFields disabled={disabled} academyId={academyId} title={(<Title>Custom Fields</Title>)} />
          </TabsContent>
        </div>

      </Tabs>
    </div>
  )
}