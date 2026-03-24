"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  IconChevronDown,
  IconChevronRight,
  IconEdit,
  IconCheck,
  IconPlus,
  IconTrash,
  IconX,
  IconBlocks,
  IconUsers,
} from "@tabler/icons-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { cn } from "@/lib/utils"

interface Group {
  id: string
  name: string
}

interface Level {
  id: string
  name: string
  groups: Group[]
  color?: string
}

interface StepTwoStructureProps {
  initialData: {
    levels: Level[]
  }
  onUpdate: (data: { levels: Level[] }) => void
  /** When true (first visit to this step in the wizard), expand up to MAX levels that have groups. */
  autoExpandOnMount?: boolean
  /** Called once after auto-expand is applied so the parent can skip auto-expand on later visits. */
  onAutoExpandConsumed?: () => void
}

const LEVEL_COLOR_PRESETS = [
  { id: "rose", swatchClass: "bg-rose-500" },
  { id: "orange", swatchClass: "bg-orange-500" },
  { id: "amber", swatchClass: "bg-amber-500" },
  { id: "lime", swatchClass: "bg-lime-500" },
  { id: "emerald", swatchClass: "bg-emerald-500" },
  { id: "sky", swatchClass: "bg-sky-500" },
  { id: "blue", swatchClass: "bg-blue-500" },
  { id: "violet", swatchClass: "bg-violet-500" },
  { id: "fuchsia", swatchClass: "bg-fuchsia-500" },
] as const

const DEFAULT_LEVEL_COLOR_ID = LEVEL_COLOR_PRESETS[5].id

function swatchClassForColorId(colorId: string | undefined) {
  return (
    LEVEL_COLOR_PRESETS.find((p) => p.id === colorId)?.swatchClass ??
    LEVEL_COLOR_PRESETS.find((p) => p.id === DEFAULT_LEVEL_COLOR_ID)!.swatchClass
  )
}

function ColorSelector({
  value,
  onChange,
  align = "start",
  compact = false,
}: {
  value: string
  onChange: (colorId: string) => void
  align?: "start" | "center" | "end"
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  const swatchClass = swatchClassForColorId(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={compact ? "ghost" : "outline"}
          size={compact ? "icon-sm" : "icon-lg"}
          title="Level color"
        >
          <span
            className={cn(
              "rounded-full",
              compact ? "size-2" : "size-2.75",
              swatchClass
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align={align}>
        <PopoverHeader className="px-1 py-1">
          <PopoverTitle className="text-sm font-medium">Level color</PopoverTitle>
        </PopoverHeader>
        <div className="grid grid-cols-9 gap-2">
          {LEVEL_COLOR_PRESETS.map((preset) => {
            const selected = value === preset.id
            return (
              <Button
                key={preset.id}
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 rounded-full p-0 hover:bg-muted"
                onClick={() => {
                  onChange(preset.id)
                  setOpen(false)
                }}
                disabled={selected}
              >
                <span
                  className={cn(
                    "size-3 rounded-full ring-2 ring-offset-2 ring-offset-background",
                    preset.swatchClass,
                    selected ? "ring-primary" : "ring-transparent"
                  )}
                />
              </Button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

const MAX_EXPANDED_LEVELS = 2

/** Add levelId to expanded set; if more than max, drop oldest-opened (Set insertion order). */
function expandLevelWithCap(prev: Set<string>, levelId: string): Set<string> {
  const next = new Set(prev)
  if (next.has(levelId)) return next
  next.add(levelId)
  while (next.size > MAX_EXPANDED_LEVELS) {
    const oldest = next.keys().next().value
    if (oldest === undefined) break
    next.delete(oldest)
  }
  return next
}

function initialExpandedFromLevels(
  levels: Level[],
  autoExpand: boolean
): Set<string> {
  if (!autoExpand) return new Set()
  const ids = levels
    .filter((l) => l.groups.length > 0)
    .map((l) => l.id)
  return new Set(ids.slice(0, MAX_EXPANDED_LEVELS))
}

export function StepTwoStructure({
  initialData,
  onUpdate,
  autoExpandOnMount = true,
  onAutoExpandConsumed,
}: StepTwoStructureProps) {
  const [levels, setLevels] = useState<Level[]>(initialData.levels || [])
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(() =>
    initialExpandedFromLevels(initialData.levels || [], autoExpandOnMount)
  )

  useEffect(() => {
    if (autoExpandOnMount) {
      onAutoExpandConsumed?.()
    }
    // Only on mount: prop reflects whether this visit is the first time opening Structure.
  }, [])

  const [editingLevelId, setEditingLevelId] = useState<string | null>(null)
  const [editingLevelName, setEditingLevelName] = useState("")
  const [editingLevelColor, setEditingLevelColor] = useState<string>(DEFAULT_LEVEL_COLOR_ID)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editingGroupName, setEditingGroupName] = useState("")

  const [addingLevelName, setAddingLevelName] = useState("")
  const [addingLevelColor, setAddingLevelColor] = useState<string>(DEFAULT_LEVEL_COLOR_ID)
  const [showAddLevel, setShowAddLevel] = useState(false)
  const [addingGroupToLevel, setAddingGroupToLevel] = useState<string | null>(null)
  const [addingGroupName, setAddingGroupName] = useState("")

  const updateLevels = (newLevels: Level[]) => {
    setLevels(newLevels)
    onUpdate({ levels: newLevels })
  }

  const closeAddLevelInline = () => {
    setShowAddLevel(false)
    setAddingLevelName("")
    setAddingLevelColor(DEFAULT_LEVEL_COLOR_ID)
  }

  const beginEditLevel = (level: Level) => {
    closeAddLevelInline()
    setEditingLevelId(level.id)
    setEditingLevelName(level.name)
    setEditingLevelColor(level.color ?? DEFAULT_LEVEL_COLOR_ID)
  }

  const toggleLevel = (levelId: string) => {
    setExpandedLevels((prev) => {
      const next = new Set(prev)
      if (next.has(levelId)) {
        next.delete(levelId)
      } else {
        return expandLevelWithCap(prev, levelId)
      }
      return next
    })
  }

  const removeLevel = (levelId: string) => {
    updateLevels(levels.filter((l) => l.id !== levelId))
    setExpandedLevels((prev) => {
      const next = new Set(prev)
      next.delete(levelId)
      return next
    })
    if (editingLevelId === levelId) setEditingLevelId(null)
    if (addingGroupToLevel === levelId) setAddingGroupToLevel(null)
  }

  const removeGroup = (levelId: string, groupId: string) => {
    updateLevels(
      levels.map((l) =>
        l.id === levelId ? { ...l, groups: l.groups.filter((g) => g.id !== groupId) } : l
      )
    )
    if (editingGroupId === groupId) setEditingGroupId(null)
  }

  const handleAddLevel = () => {
    if (!addingLevelName.trim()) return
    const newLevel: Level = {
      id: `level-${Date.now()}`,
      name: addingLevelName.trim(),
      groups: [],
      color: addingLevelColor,
    }
    const newLevels = [newLevel, ...levels]
    updateLevels(newLevels)
    setAddingLevelName("")
    setAddingLevelColor(DEFAULT_LEVEL_COLOR_ID)
    setShowAddLevel(false)
  }

  const handleUpdateLevel = (levelId: string) => {
    if (!editingLevelName.trim()) return
    const newLevels = levels.map((l) =>
      l.id === levelId
        ? { ...l, name: editingLevelName.trim(), color: editingLevelColor }
        : l
    )
    updateLevels(newLevels)
    setEditingLevelId(null)
  }

  const handleAddGroup = (levelId: string) => {
    if (!addingGroupName.trim()) return
    const newGroup: Group = {
      id: `group-${Date.now()}`,
      name: addingGroupName.trim(),
    }
    const newLevels = levels.map((l) =>
      l.id === levelId ? { ...l, groups: [...l.groups, newGroup] } : l
    )
    updateLevels(newLevels)
    setAddingGroupName("")
    setAddingGroupToLevel(null)
    setExpandedLevels((prev) => expandLevelWithCap(prev, levelId))
  }

  const handleUpdateGroup = (levelId: string, groupId: string) => {
    if (!editingGroupName.trim()) return
    const newLevels = levels.map((l) =>
      l.id === levelId
        ? {
            ...l,
            groups: l.groups.map((g) =>
              g.id === groupId ? { ...g, name: editingGroupName.trim() } : g
            ),
          }
        : l
    )
    updateLevels(newLevels)
    setEditingGroupId(null)
  }

  return (
    <div className="flex flex-col">
      <CardHeader className="text-left mb-4">
        <CardTitle className="text-2xl font-semibold">Academy Structure</CardTitle>
        <CardDescription className="text-sm -mt-1">
          Specify your levels and group names!
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-2 h-full flex flex-col">
        {showAddLevel ? (
          <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 h-15 px-3">
            <ColorSelector value={addingLevelColor} onChange={setAddingLevelColor} />
            <Input
              value={addingLevelName}
              onChange={(e) => setAddingLevelName(e.target.value)}
              placeholder="Enter level name..."
              className="h-9 flex-1 items-center"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddLevel()
                if (e.key === "Escape") setShowAddLevel(false)
              }}
            />
            <div className="flex gap-0.5">
              <Button
                size="icon-lg"
                onClick={handleAddLevel}
                disabled={!addingLevelName.trim()}
              >
                <IconCheck className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-lg"
                onClick={() => setShowAddLevel(false)}
              >
                <IconX className="size-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-15">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddLevel(true)
                setAddingLevelName("")
                setAddingLevelColor(DEFAULT_LEVEL_COLOR_ID)
              }}
              className="gap-1.5 h-10 w-full"
            >
              <IconPlus className="size-5" />
              Add Level
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {levels.map((level) => {
            const isExpanded = expandedLevels.has(level.id)
            const isEditingThis = editingLevelId === level.id
            const isAddingGroup = addingGroupToLevel === level.id

            return (
              <div
                key={level.id}
                className="rounded-lg border border-input bg-muted/20 overflow-hidden transition-colors"
              >
                <div className="flex items-center gap-3 h-15 px-3 hover:bg-muted/30">
                  <button
                    type="button"
                    onClick={() => toggleLevel(level.id)}
                    className="shrink-0 size-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isExpanded ? (
                      <IconChevronDown className="size-5" />
                    ) : (
                      <IconChevronRight className="size-5" />
                    )}
                  </button>

                  {isEditingThis ? (
                    <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
                      <InputGroup className="h-9 min-w-0 flex-1">
                        <InputGroupAddon
                          align="inline-start"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ColorSelector
                            value={editingLevelColor}
                            onChange={setEditingLevelColor}
                            align="start"
                            compact
                          />
                        </InputGroupAddon>
                        <InputGroupInput
                          value={editingLevelName}
                          onChange={(e) => setEditingLevelName(e.target.value)}
                          className="h-9 min-w-0 text-sm font-medium"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdateLevel(level.id)
                            if (e.key === "Escape") setEditingLevelId(null)
                          }}
                        />
                      </InputGroup>
                      <div className="flex gap-0.5">
                        <Button
                          size="sm"
                          className="size-9 shrink-0 gap-1"
                          onClick={() => handleUpdateLevel(level.id)}
                          disabled={
                            !editingLevelName.trim() ||
                            (level.name === editingLevelName.trim() &&
                              (level.color ?? DEFAULT_LEVEL_COLOR_ID) ===
                                editingLevelColor)
                          }
                        >
                          <IconCheck className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-9 shrink-0 p-0"
                          onClick={() => setEditingLevelId(null)}
                        >
                          <IconX className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="flex h-8 min-w-0 flex-1 cursor-pointer items-center gap-3"
                      onClick={() => toggleLevel(level.id)}
                    >
                      <span
                        className={cn(
                          "size-2 shrink-0 rounded-full",
                          swatchClassForColorId(level.color)
                        )}
                        aria-hidden
                      />
                      <p className="min-w-0 truncate text-[15px] font-medium">
                        {level.name}
                      </p>
                      {level.groups.length > 0 && (
                        <Tooltip>
                          <TooltipTrigger
                            className="flex shrink-0 items-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Badge
                              variant="secondary"
                              className="text-[11px]"
                            >
                              {level.groups.length} Group
                              {level.groups.length !== 1 ? "s" : ""}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="flex flex-col">
                              {level.groups.map((group) => (
                                <p key={group.id}>{group.name}</p>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  )}

                  {/* Add group and edit level buttons */}
                  {!isEditingThis && (
                    <div className="flex shrink-0 items-center gap-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-9 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setAddingGroupToLevel(level.id)
                          setAddingGroupName("")
                          setExpandedLevels((prev) => expandLevelWithCap(prev, level.id))
                        }}
                        title="Add group"
                      >
                        <IconPlus className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-9 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => beginEditLevel(level)}
                        title="Rename level"
                      >
                        <IconEdit className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-9 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeLevel(level.id)}
                        title="Delete level"
                      >
                        <IconTrash className="size-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="border-t border-input/50 bg-muted/10">
                    {level.groups.length === 0 && !isAddingGroup && (
                      <div className="flex items-center justify-center h-15 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <IconUsers className="size-3.5 opacity-50" />
                          No groups yet
                        </div>
                        <Button
                          variant="link"
                          size="sm"
                          className="text-primary hover:underline"
                          onClick={() => {
                            setAddingGroupToLevel(level.id)
                            setAddingGroupName("")
                          }}
                        >
                          Add one
                        </Button>
                      </div>
                    )}

                    {level.groups.map((group) => {
                      const isEditingGroup = editingGroupId === group.id

                      return (
                        <div
                          key={group.id}
                          className="flex items-center justify-between gap-3 px-3 pl-6 h-15 border-t border-input/30 first:border-t-0 hover:bg-muted/20 transition-colors"
                        >
                          <div className="size-9 flex items-center justify-center">
                            <IconUsers className="size-4 text-muted-foreground" />
                          </div>
                          {isEditingGroup ? (
                            <div className="flex items-center gap-1 w-full min-w-0">
                              <Input
                                value={editingGroupName}
                                onChange={(e) => setEditingGroupName(e.target.value)}
                                className="h-9 text-base flex-1"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    handleUpdateGroup(level.id, group.id)
                                  if (e.key === "Escape") setEditingGroupId(null)
                                }}
                              />
                              <div className="flex gap-0">
                                <Button
                                  size="sm"
                                  className="size-9 p-0 ml-1 text-xs"
                                  onClick={() => handleUpdateGroup(level.id, group.id)}
                                  disabled={
                                    !editingGroupName.trim() ||
                                    group.name === editingGroupName
                                  }
                                >
                                  <IconCheck className="size-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="size-9 p-0"
                                  onClick={() => setEditingGroupId(null)}
                                >
                                  <IconX className="size-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center h-7 justify-between w-full">
                              <p className="text-sm">{group.name}</p>
                              <div className="flex items-center gap-0 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="size-9 p-0 text-muted-foreground hover:text-foreground"
                                  onClick={() => {
                                    setEditingGroupId(group.id)
                                    setEditingGroupName(group.name)
                                  }}
                                >
                                  <IconEdit className="size-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="size-9 p-0 text-muted-foreground hover:text-destructive"
                                  onClick={() => removeGroup(level.id, group.id)}
                                >
                                  <IconTrash className="size-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {isAddingGroup && (
                      <div className="flex items-center gap-2 px-3 pl-6 h-15 border-t border-primary/20 bg-primary/5">
                        <div className="size-9 w-8 flex items-center justify-center">
                          <IconUsers className="size-4 text-primary" />
                        </div>
                        <Input
                          value={addingGroupName}
                          onChange={(e) => setAddingGroupName(e.target.value)}
                          placeholder="Group name..."
                          className="h-9 text-sm flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddGroup(level.id)
                            if (e.key === "Escape") setAddingGroupToLevel(null)
                          }}
                        />
                        <div className="flex gap-0.5">
                          <Button
                            size="sm"
                            className="size-9 gap-1 text-xs"
                            onClick={() => handleAddGroup(level.id)}
                            disabled={!addingGroupName.trim()}
                          >
                            <IconCheck className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-9 p-0"
                            onClick={() => setAddingGroupToLevel(null)}
                          >
                            <IconX className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {levels.length === 0 && !showAddLevel && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
              <IconBlocks className="size-10 opacity-40" />
              <p className="text-sm">No levels defined yet.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAddLevel(true)
                  setAddingLevelName("")
                  setAddingLevelColor(DEFAULT_LEVEL_COLOR_ID)
                }}
              >
                <IconPlus className="size-4 mr-1" />
                Create your first level
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </div>
  )
}
