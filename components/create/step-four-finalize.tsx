"use client"

import {
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ACADEMY_ICONS } from "@/lib/constants"
import {
  IconSchool,
  IconBlocks,
  IconUsers,
  IconForms,
  IconCursorText,
  IconHash,
  IconCalendar,
  IconToggleLeft,
  IconPhone,
  IconList,
  IconAsterisk,
  IconChevronRight,
  IconLayoutGrid,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"

// ── Types (mirrors stepper academyData shape) ─────────────────────────────────

type FieldType = "text" | "number" | "date" | "boolean" | "phone" | "select"

interface Group {
  id: string
  name: string
}

interface Level {
  id: string
  name: string
  color?: string | null
  groups: Group[]
}

interface CustomField {
  id: string
  name: string
  field_type: FieldType
  is_required: boolean
  options?: string[]
}

interface StepFourFinalizeProps {
  academyData: {
    name: string
    slug: string
    icon: string
    subject: string
    levels: Level[]
    fields: CustomField[]
  }
}

// ── Color swatch map (matches step-two-structure) ─────────────────────────────

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

function swatchClass(colorId?: string | null) {
  return colorId ? (COLOR_SWATCH[colorId] ?? "bg-sky-500") : "bg-sky-500"
}

// ── Field type icon map ───────────────────────────────────────────────────────

const FIELD_TYPE_ICON: Record<FieldType, typeof IconCursorText> = {
  text: IconCursorText,
  number: IconHash,
  date: IconCalendar,
  boolean: IconToggleLeft,
  phone: IconPhone,
  select: IconList,
}

const FIELD_TYPE_LABEL: Record<FieldType, string> = {
  text: "Text",
  number: "Number",
  date: "Date",
  boolean: "Yes / No",
  phone: "Phone",
  select: "Select",
}

// ── Section header ────────────────────────────────────────────────────────────

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
    <div className="flex items-center gap-2 mb-3">
      <div className="flex items-center justify-center size-6 rounded-md bg-muted/60 shrink-0">
        <Icon className="size-3.5 text-muted-foreground" />
      </div>
      <p className="text-sm font-semibold">{title}</p>
      {count !== undefined && (
        <Badge variant="secondary" className="text-[12px] px-1.5 py-0 ml-auto">
          {count}
        </Badge>
      )}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StepFourFinalize({ academyData }: StepFourFinalizeProps) {
  const AcademyIcon =
    ACADEMY_ICONS.find((i) => i.id === academyData.icon)?.icon ?? IconSchool

  const totalGroups = academyData.levels.reduce(
    (acc, l) => acc + l.groups.length,
    0
  )

  return (
    <div className="flex flex-col w-3xl">
      <CardHeader className="text-left mb-4">
        <CardTitle className="text-2xl font-semibold">Almost there!</CardTitle>
        <CardDescription className="text-sm -mt-1">
          Review your academy before creating it.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">

        {/* ── Identity ── */}
        <div className="rounded-lg border border-input bg-muted/20 p-4">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-lg shrink-0 shadow-sm">
              <AcademyIcon className="size-5" />
            </div>

            {/* Name + subdomain + subject */}
            <div className="flex flex-col min-w-0 flex-1">
              <p className="text-base font-semibold truncate leading-tight">
                {academyData.name || <span className="text-muted-foreground italic">Unnamed Academy</span>}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                edra.academy/
                <span className="font-medium text-foreground">{academyData.slug || "—"}</span>
              </p>
            </div>

            {academyData.subject && (
              <Badge variant="secondary" className="shrink-0 text-xs">
                {academyData.subject}
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          {/* ── Structure ── */}
          <div>
            <SectionHeader
              icon={IconBlocks}
              title="Structure"
              count={academyData.levels.length}
            />

            {academyData.levels.length === 0 ? (
              <p className="text-xs text-muted-foreground pl-8">No levels defined.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {academyData.levels.map((level) => (
                  <div
                    key={level.id}
                    className="rounded-lg border border-input bg-muted/10 overflow-hidden"
                  >
                    {/* Level row */}
                    <div className="flex items-center gap-3 px-4 h-11">
                      <span
                        className={cn("size-2 shrink-0 rounded-full", swatchClass(level.color))}
                      />
                      <p className="text-sm font-medium flex-1 truncate">{level.name}</p>
                      {level.groups.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                          <IconUsers className="size-3.5" />
                          {level.groups.length} group{level.groups.length !== 1 ? "s" : ""}
                        </div>
                      )}
                    </div>

                    {/* Groups */}
                    {level.groups.length > 0 && (
                      <div className="border-t border-input/50 bg-muted/5 flex flex-wrap gap-1.5 px-3 py-2">
                        {level.groups.map((group) => (
                          <Badge key={group.id} variant="secondary" className="text-xs gap-1">
                            <IconUsers className="size-2.5" />
                            {group.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Custom Fields ── */}
          <div>
            <SectionHeader
              icon={IconForms}
              title="Custom Fields"
              count={academyData.fields.length}
            />

            {academyData.fields.length === 0 ? (
              <p className="text-xs text-muted-foreground pl-8">No custom fields.</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {academyData.fields.map((field) => {
                  const FieldIcon = FIELD_TYPE_ICON[field.field_type] ?? IconCursorText
                  const isSelect = field.field_type === "select"

                  return (
                    <div
                      key={field.id}
                      className="rounded-lg border border-input bg-muted/10 overflow-hidden"
                    >
                      <div className="flex items-center gap-2 px-3 h-11">
                        <div className="flex items-center justify-center size-6 rounded-md shrink-0">
                          <FieldIcon className="size-3.5 text-muted-foreground" />
                        </div>

                        <p className="text-sm font-medium flex-1 truncate">{field.name}</p>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isSelect && (field.options?.length ?? 0) > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                              {field.options!.length} options
                            </span>
                          )}

                          {field.is_required && (
                            <Badge variant="destructive" className="text-[10px] px-1 py-0 gap-0.5">
                              <IconAsterisk className="size-2.5" />
                            </Badge>
                          )}

                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {FIELD_TYPE_LABEL[field.field_type]}
                          </Badge>

                        </div>
                      </div>

                      {/* Select options preview */}
                      {isSelect && (field.options?.length ?? 0) > 0 && (
                        <div className="border-t border-input/50 bg-muted/5 flex flex-wrap gap-1.5 px-3 py-2">
                          {field.options!.map((opt, i) => (
                            <Badge key={i} variant="secondary" className="text-[11px] font-normal">
                              {opt}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── URL preview pill ── */}
        {academyData.slug && (
          <>
            <div className="flex items-center gap-2 rounded-lg bg-muted/30 border border-input px-3 py-2.5 my-1">
              <IconLayoutGrid className="size-4 text-muted-foreground shrink-0" />
              <div className="flex items-center gap-1 text-sm min-w-0 flex-1 truncate">
                <span className="text-muted-foreground">Your academy will be live at</span>
                <IconChevronRight className="size-3.5 text-muted-foreground/50 shrink-0" />
                <span className="font-medium text-primary truncate">
                  {academyData.slug}.edra.academy
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </div>
  )
}
