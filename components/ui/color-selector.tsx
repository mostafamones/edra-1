"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { LEVEL_COLOR_PRESETS } from "@/lib/constants"
import { swatchClassForColorId } from "@/components/helpers/academy-utils"

export function ColorSelector({
  value,
  onChange,
  align = "start",
  compact = false,
  locked = false,
}: {
  value: string
  onChange: (colorId: string) => void
  align?: "start" | "center" | "end"
  compact?: boolean
  locked?: boolean
}) {
  const [open, setOpen] = useState(false)
  const swatchClass = swatchClassForColorId(value)

  return locked ? (
    <span className={cn("rounded-full", compact ? "size-2" : "size-2.75", swatchClass)} />
  ) : (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={compact ? "ghost" : "outline"}
          size={compact ? "icon-sm" : "icon-lg"}
          title="Level color"
        >
          <span className={cn("rounded-full", compact ? "size-2" : "size-2.75", swatchClass)} />
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
