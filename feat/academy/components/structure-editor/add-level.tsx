"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ColorSelector } from "@/components/ui/color-selector"
import { IconCheck, IconPlus, IconX } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import type { AddLevelState, AddLevelHandlers } from "./types"

// ═══════════════════════════════════════════════════════════════════════════
// StructureAddLevelForm — the inline add-level form (private)
// ═══════════════════════════════════════════════════════════════════════════

interface StructureAddLevelFormProps {
  state: AddLevelState
  handlers: AddLevelHandlers
  confirmDisabled?: boolean
  className?: string
}

function StructureAddLevelForm({
  state,
  handlers,
  confirmDisabled = false,
  className,
}: StructureAddLevelFormProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 h-15 px-3",
        className
      )}
    >
      <ColorSelector value={state.color} onChange={handlers.onColorChange} />
      <Input
        value={state.name}
        onChange={(e) => handlers.onNameChange(e.target.value)}
        placeholder="Enter level name..."
        className="h-9 flex-1 items-center"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handlers.onConfirm()
          if (e.key === "Escape") handlers.onClose()
        }}
      />
      <div className="flex gap-0.5">
        <Button size="icon-lg" onClick={handlers.onConfirm} disabled={confirmDisabled}>
          <IconCheck className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-lg" onClick={handlers.onClose}>
          <IconX className="size-4" />
        </Button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// StructureAddLevelSection — inline form + full-width CTA button
// ═══════════════════════════════════════════════════════════════════════════

interface StructureAddLevelSectionProps {
  state: AddLevelState
  handlers: AddLevelHandlers
  confirmDisabled?: boolean
  canShowCta: boolean
  className?: string
}

export function StructureAddLevelSection({
  state,
  handlers,
  confirmDisabled,
  canShowCta,
  className,
}: StructureAddLevelSectionProps) {
  if (state.isOpen) {
    return (
      <StructureAddLevelForm
        state={state}
        handlers={handlers}
        confirmDisabled={confirmDisabled}
        className={className}
      />
    )
  }

  if (!canShowCta) return null
  return (
    <div className={cn("flex items-center justify-center h-15", className)}>
      <Button variant="outline" onClick={handlers.onOpen} className="gap-1.5 h-10 w-full">
        <IconPlus className="size-5" />
        Add Level
      </Button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// StructureAddLevelButton — compact toolbar variant
// ═══════════════════════════════════════════════════════════════════════════

interface StructureAddLevelButtonProps {
  state: AddLevelState
  handlers: AddLevelHandlers
  confirmDisabled?: boolean
  disabled?: boolean
  className?: string
}

export function StructureAddLevelButton({
  state,
  handlers,
  confirmDisabled,
  disabled = false,
  className,
}: StructureAddLevelButtonProps) {
  if (state.isOpen) {
    return (
      <StructureAddLevelForm
        state={state}
        handlers={handlers}
        confirmDisabled={confirmDisabled}
      />
    )
  }

  return (
    <Button
      variant="outline"
      className={cn("gap-1 h-8 px-3 text-sm", className)}
      onClick={handlers.onOpen}
      disabled={disabled}
    >
      <IconPlus className="size-3.5" />
      Add Level
    </Button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// StructureEmptyState
// ═══════════════════════════════════════════════════════════════════════════

interface StructureEmptyStateProps {
  showCta: boolean
  onOpenAddLevel: () => void
  className?: string
}

export function StructureEmptyState({
  showCta,
  onOpenAddLevel,
  className,
}: StructureEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground",
        className
      )}
    >
      <IconPlus className="size-10 opacity-40" />
      <p className="text-sm">No levels defined yet.</p>
      {showCta && (
        <Button variant="outline" size="sm" onClick={onOpenAddLevel}>
          <IconPlus className="size-4 mr-1" />
          Create your first level
        </Button>
      )}
    </div>
  )
}
