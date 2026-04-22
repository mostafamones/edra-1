import { useState } from "react"
import { useFieldTypes, resolveFieldType } from "./context"
import { FieldTypePopoverProps, FieldRowProps } from "./types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { IconCheck, IconX, IconAsterisk } from "@tabler/icons-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group"
import { Toggle } from "@/components/ui/toggle"

// ═══════════════════════════════════════════════════════════════════════════
// FieldTypePopover — private subcomponent
// ═══════════════════════════════════════════════════════════════════════════

export function FieldTypePopover({ value, onChange, className }: FieldTypePopoverProps) {
  const [open, setOpen] = useState(false)
  const fieldTypes = useFieldTypes()
  const current = resolveFieldType(fieldTypes, value)
  const CurrentIcon = current.icon

  return (
    <Tooltip delayDuration={1000}>
      <Popover open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              className={cn(
                "shrink-0 size-9 rounded-lg bg-muted/20 border-input",
                className
              )}
              aria-label={`Field type: ${current.label}`}
            >
              <CurrentIcon className="size-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>

        <PopoverContent className="w-[175px] p-1" align="start" sideOffset={6}>
          <div className="flex flex-col gap-0.5">
            {Object.entries(fieldTypes).map(([type, config]) => {
              const TypeIcon = config.icon
              const isSelected = value === type
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    onChange(type)
                    setOpen(false)
                  }}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors text-left w-full",
                    isSelected
                      ? "bg-white/10 text-primary-foreground"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  <TypeIcon className="size-4 shrink-0" />
                  <span>{config.label}</span>
                  {isSelected && <IconCheck className="size-3.5 ml-auto" />}
                </button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
      <TooltipContent side="bottom">{current.label}</TooltipContent>
    </Tooltip>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// FieldRow — the inline add/edit form
// ═══════════════════════════════════════════════════════════════════════════

export function FieldRow({
  name,
  onNameChange,
  fieldType,
  onTypeChange,
  isRequired,
  onRequiredChange,
  onConfirm,
  onCancel,
  confirmDisabled,
  confirmTooltip,
  autoFocus = true,
  className,
}: FieldRowProps) {
  const confirmBtn = (
    <Button size="icon-lg" onClick={onConfirm} disabled={confirmDisabled}>
      <IconCheck className="size-4" />
    </Button>
  )

  return (
    <div className={cn("flex items-center gap-2 w-full", className)}>
      <FieldTypePopover value={fieldType} onChange={onTypeChange} />

      <InputGroup className="h-9 w-full flex-1">
        <InputGroupInput
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Field name..."
          className="h-9 text-base"
          autoFocus={autoFocus}
          onKeyDown={(e) => {
            if (e.key === "Enter") onConfirm()
            if (e.key === "Escape") onCancel()
          }}
        />
        <InputGroupAddon align="inline-end">
          <Toggle
            pressed={isRequired}
            onPressedChange={onRequiredChange}
            className="size-5 p-0 transition-all"
            aria-label="Toggle required"
          >
            <IconAsterisk className="size-3.5 group-data-[state=on]/toggle:text-destructive" />
          </Toggle>
        </InputGroupAddon>
      </InputGroup>

      <div className="flex gap-0.5 shrink-0">
        {confirmDisabled && confirmTooltip ? (
          <Tooltip delayDuration={600}>
            <TooltipTrigger asChild>
              <span tabIndex={0}>{confirmBtn}</span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[200px] text-center">
              {confirmTooltip}
            </TooltipContent>
          </Tooltip>
        ) : (
          confirmBtn
        )}
        <Button variant="ghost" size="icon-lg" onClick={onCancel}>
          <IconX className="size-4" />
        </Button>
      </div>
    </div>
  )
}