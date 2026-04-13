import { SettingsTabProps } from "@/components/helpers/settings"
import { AcademyDetails } from "./academy-parts/academy-details"
import { AcademyFields } from "./academy-parts/academy-fields"
import { AcademyStructure } from "./academy-parts/academy-structure"
import { Badge } from "@/components/ui/badge"
import { IconBuildingArch, IconForms, IconHelp, IconHierarchy2, IconInfoSquareRounded, IconQuestionMark } from "@tabler/icons-react"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function HelperTooltip({ text }: { text: string }) {
  return (
    <Tooltip delayDuration={500}>
      <TooltipTrigger asChild>
        <IconInfoSquareRounded className="size-4 text-muted-foreground hover:text-foreground" />
      </TooltipTrigger>
      <TooltipContent>
        <p>{text}</p>
      </TooltipContent>
    </Tooltip>
  )
}

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


  // return (
  //   <>
  //     <Sidebar>
  //       <SidebarMenu>
  //         {
  //           tabs.map((tab) => (
  //             <SidebarMenuButton key={tab}>
  //               {tab}
  //             </SidebarMenuButton>
  //           ))
  //         }
  //       </SidebarMenu>
  //     </Sidebar>
  //     <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
  //       <div>
  //         <p className="text-base font-semibold">Academy Workspace</p>
  //         <p className="text-sm text-muted-foreground">Manage identity, structure, and student schema.</p>
  //       </div>
  //       {disabled && <Badge variant="outline">View Only</Badge>}
  //     </div>

  //     <div className="flex items-center gap-2 px-4 text-xs text-muted-foreground">
  //       <IconBuildingArch className="size-3.5" />
  //       Details
  //     </div>
  //     <AcademyDetails disabled={disabled} academyId={academyId} />
  //     <Separator className="max-w-2xl mx-auto" />

  //     <AcademyStructure disabled={disabled} academyId={academyId} title={
  //       <div className="flex items-center gap-2 text-xl font-semibold pl-1">
  //         <IconHierarchy2 className="size-4.5" />
  //         Structure
  //         <HelperTooltip text={`This is your academy levels, the higher the level the hierarchy the students that are in the same academic year should be all included in their corresponding "Level"`} />
  //       </div>
  //     } />
  //     <Separator className="max-w-2xl mx-auto" />

  //     <AcademyFields disabled={disabled} academyId={academyId} title={
  //       <div className="flex items-center gap-2 text-xl font-semibold pl-1">
  //         <IconForms className="size-4.5" />
  //         Fields
  //         <HelperTooltip text="Custom fields let you collect additional information from each student, such as birthday, parent contact, or any other data your academy needs." />
  //       </div>
  //     } />
  //   </>
  // )
}