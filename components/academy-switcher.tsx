"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ACADEMY_ICONS } from "@/lib/constants"
import { useAuth, AcademyEntry } from "@/components/auth-provider"
import {
  IconSelector,
  IconPlus,
  IconCheck,
  IconSchool,
  IconLoader2,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { Kbd, KbdGroup } from "./ui/kbd"

// ── Icon resolver ─────────────────────────────────────────────────────────────

function AcademyIcon({ iconId, className }: { iconId: string | null; className?: string }) {
  const Icon = ACADEMY_ICONS.find((i) => i.id === iconId)?.icon ?? IconSchool
  return <Icon className={cn("size-4", className)} />
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AcademySwitcher() {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const { academies, activeAcademy, setActiveAcademy, academyDetails } = useAuth()
  const [open, setOpen] = React.useState(false)

  const handleSwitch = (academy: AcademyEntry) => {
    if (academy.id === activeAcademy?.id) return
    setActiveAcademy(academy)
    setOpen(false)
  }

  React.useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.metaKey) return
      if (e.altKey || e.ctrlKey || e.shiftKey) return

      const k = e.key
      if (!/^[1-9]$/.test(k)) return

      const index = Number(k) - 1
      const academy = academies[index]
      if (!academy) return
      if (academy.id === activeAcademy?.id) return

      e.preventDefault()
      setActiveAcademy(academy)
      setOpen(false)
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, academies, activeAcademy?.id, setActiveAcademy])

  const subtitle = activeAcademy?.slug
    ? `${activeAcademy.slug}@edra.academy`
    : academyDetails?.instructor_count != null
      ? `${academyDetails.instructor_count} instructor${academyDetails.instructor_count !== 1 ? "s" : ""}`
      : "edra.academy"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground w-full"
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
                <AcademyIcon iconId={activeAcademy?.icon ?? null} />
              </div>

              <div className="grid flex-1 text-left text-base">
                <span className="truncate font-medium">
                  {activeAcademy?.name ?? "No academy"}
                </span>
              </div>
              <IconSelector className="ml-auto size-5 shrink-0 opacity-60 mr-1" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-70 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-2">
              Your academies
            </DropdownMenuLabel>

            {academies.length === 0 && (
              <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                No academies yet
              </div>
            )}

            {academies.map((academy, index) => {
              const isActive = academy.id === activeAcademy?.id
              return (
                <DropdownMenuItem
                  key={academy.id}
                  onClick={() => handleSwitch(academy)}
                  className={`gap-2 p-1.5 ${isActive ? "bg-white/2.5" : ""}`}
                >
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-md border rounded-none text-primary-foreground">
                    <AcademyIcon iconId={academy.icon} className="size-3.5" />
                  </div>

                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm truncate">{academy.name}</span>
                  </div>

                  {isActive ? <IconCheck className="ml-auto size-3.5 shrink-0 mr-1" /> : <Kbd>⌘ {index + 1}</Kbd> }
                </DropdownMenuItem>
              )
            })}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="gap-2 p-1.5 cursor-pointer"
              onClick={() => router.push("/create")}
            >
              <div className="flex size-7 shrink-0 items-center justify-center rounded-md border rounded-none bg-transparent">
                <IconPlus className="size-3.5" />
              </div>
              <span className="text-xs text-muted-foreground">Create new academy</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
