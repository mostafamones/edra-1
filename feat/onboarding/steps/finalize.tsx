"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  IconAsterisk,
  IconBlocks,
  IconCalendar,
  IconCursorText,
  IconForms,
  IconHash,
  IconList,
  IconPhone,
  IconSchool,
  IconToggleLeft,
  IconUsers,
} from "@tabler/icons-react"

import type { AcademyCreateDraft, AcademyFieldType } from "../types"
import { IconHolder } from "../components/icon-holder"
import { ColorSelector } from "@/components/ui/color-selector"

const COLOR_SWATCH: Record<string, string> = {
  rose: "bg-rose-500",
  orange: "bg-orange-500",
  amber: "bg-amber-500",
  lime: "bg-lime-500",
  emerald: "bg-emerald-500",
  sky: "bg-sky-500",
  blue: "bg-blue-500",
  violet: "bg-violet-500",
  fuchsia: "bg-fuchsia-500",
}

const FIELD_TYPE_ICON: Record<AcademyFieldType, typeof IconCursorText> = {
  text: IconCursorText,
  number: IconHash,
  date: IconCalendar,
  boolean: IconToggleLeft,
  phone: IconPhone,
  select: IconList,
}

const FIELD_TYPE_LABEL: Record<AcademyFieldType, string> = {
  text: "Text",
  number: "Number",
  date: "Date",
  boolean: "Yes / No",
  phone: "Phone",
  select: "Select",
}

function swatchClass(colorId?: string | null) {
  return colorId ? (COLOR_SWATCH[colorId] ?? "bg-sky-500") : "bg-sky-500"
}

function SectionHeader({
  icon: Icon,
  title,
  count,
}: {
  icon: typeof IconSchool
  title: string
  count?: number
}) {
  return (
    <div className="mb-3 flex items-center gap-2 pl-1">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <p className="text-sm font-medium">{title}</p>
      {count !== undefined && (
        <Badge variant="secondary" className="ml-auto px-1.5 py-0 text-[12px]">
          {count}
        </Badge>
      )}
    </div>
  )
}

export function FinalizeStep({ academyData }: { academyData: AcademyCreateDraft }) {
  return (
    <div className="flex w-3xl flex-col">
      <CardHeader className="mb-4 text-left">
        <CardTitle className="text-2xl font-semibold">Almost there!</CardTitle>
        <CardDescription className="text-sm -mt-1">
          Review your academy before creating it.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <Card>
          <CardContent className="flex items-center gap-2">
            <IconHolder selectedIconId={academyData.icon ?? ""} size="2xl" />
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="truncate text-base font-semibold leading-tight">
                {academyData.name || (
                  <span className="italic text-muted-foreground">Unnamed Academy</span>
                )}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                edra.academy/
                <span className="font-medium text-foreground">{academyData.slug || "—"}</span>
              </p>
            </div>

            {academyData.subject && (
              <Badge variant="secondary" className="shrink-0 text-xs">
                {academyData.subject}
              </Badge>
            )}
          </CardContent>
        </Card>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <SectionHeader
              icon={IconBlocks}
              title="Structure"
              count={academyData.levels.length}
            />

            {academyData.levels.length === 0 ? (
              <p className="pl-8 text-xs text-muted-foreground">No levels defined.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {academyData.levels.map((level) => (
                  <Card
                    key={level.id}
                    className="overflow-hidden rounded-lg p-0 gap-0"
                  >
                    <div className="flex h-11 items-center gap-2.5 px-4">
                      <ColorSelector value={level.color ?? ""} onChange={() => {}} locked compact />
                      <p className="flex-1 truncate text-sm font-medium">{level.name}</p>
                      {level.groups.length > 0 && (
                        <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                          <IconUsers className="size-2.5" />
                          {level.groups.length} group{level.groups.length !== 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>

                    {level.groups.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 border-t border-input/50 bg-background/20 px-3 py-3">
                        {level.groups.map((group) => (
                          <Badge key={group.id} variant="secondary" className="gap-1 text-[11px]">
                            {group.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <SectionHeader
              icon={IconForms}
              title="Custom Fields"
              count={academyData.fields.length}
            />

            {academyData.fields.length === 0 ? (
              <p className="pl-8 text-xs text-muted-foreground">No custom fields.</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {academyData.fields.map((field) => {
                  const FieldIcon = FIELD_TYPE_ICON[field.field_type] ?? IconCursorText
                  const isSelect = field.field_type === "select"

                  return (
                    <Card
                      key={field.id}
                      className="overflow-hidden rounded-lg p-0 gap-0"
                    >
                      <div className="flex h-11 items-center gap-2 px-3">
                        <div className="flex size-6 shrink-0 items-center justify-center rounded-md">
                          <FieldIcon className="size-3.5 text-muted-foreground" />
                        </div>

                        <p className="flex-1 truncate text-sm font-medium">{field.name}</p>

                        <div className="flex shrink-0 items-center gap-1.5">
                          {field.is_required && (
                            <Badge variant="destructive" className="gap-0.5 px-1 py-0 text-[10px]">
                              <IconAsterisk className="size-2.5" />
                            </Badge>
                          )}

                          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                            {FIELD_TYPE_LABEL[field.field_type]}
                          </Badge>
                        </div>
                      </div>

                      {isSelect && (field.options?.length ?? 0) > 0 && (
                        <div className="flex items-center gap-1.5 border-t border-input/50 bg-background/20 px-4 py-3">
                          <div className="text-[11px] text-muted-foreground">Options:</div>
                          <div className="flex flex-wrap gap-1.5">
                            {field.options!.map((option, index) => (
                              <Badge key={`${field.id}-${index}`} variant="secondary" className="text-[11px] font-normal">
                                {option}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </div>
  )
}
