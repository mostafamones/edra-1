import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover"
import { ACADEMY_ICONS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { IconSchool } from "@tabler/icons-react"
import { useState } from "react"

interface IconHolderProps {
  selectedIconId: string
  onIconSelect?: (iconId: string) => void
  selector?: boolean
  className?: string
  size?: "sm" | "md" | "lg" | "xl" | "2xl"
}

export function IconHolder({ selectedIconId, onIconSelect, selector = false, className, size = "md" }: IconHolderProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  const IconComponent = ACADEMY_ICONS.find((icon) => icon.id === selectedIconId)?.icon ?? IconSchool

  return (
    <Popover open={isPopoverOpen && selector} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button size="icon" className={cn(`size-${size === "sm" ? 6 : size === "md" ? 7 : size === "lg" ? 8 : size === "xl" ? 9 : 10} shrink-0`, className)}>
          <IconComponent className={cn(`size-${size === "sm" ? 3.5 : size === "md" ? 4 : size === "lg" ? 4.5 : size === "xl" ? 5 : 6}`)} />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-3" align="start">
        <PopoverHeader className="px-1 py-1">
          <PopoverTitle className="text-sm font-medium">Academy Icon</PopoverTitle>
        </PopoverHeader>

        <div className="grid grid-cols-5 gap-2">
          {ACADEMY_ICONS.map((iconData) => {
            const IconComponent = iconData.icon
            const isSelected = selectedIconId === iconData.id

            return (
              <Button
                key={iconData.id}
                variant={isSelected ? "default" : "ghost"}
                size="icon"
                className="size-10"
                onClick={() => onIconSelect?.(iconData.id)}
              >
                <IconComponent className="size-5" />
              </Button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}