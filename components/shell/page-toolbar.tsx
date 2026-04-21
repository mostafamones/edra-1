"use client"

import { IconSearch, IconX } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { cn } from "@/lib/utils"

export function PageToolbar({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-col gap-2 lg:flex-row lg:items-center",
        className
      )}
      {...props}
    />
  )
}

export function PageToolbarSearch({
  className,
  inputClassName,
  value,
  onValueChange,
  placeholder = "Search...",
  disabled = false,
}: {
  className?: string
  inputClassName?: string
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <InputGroup className={cn("h-8 w-full min-w-0 flex-1 bg-background dark:bg-input/30", className)}>
      <InputGroupInput
        placeholder={placeholder}
        value={value}
        className={cn("text-base", inputClassName)}
        disabled={disabled}
        onChange={(e) => onValueChange(e.target.value)}
      />
      <InputGroupAddon align="inline-end">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onValueChange("")}
          disabled={disabled || value.length === 0}
        >
          <IconX className="size-4" />
        </Button>
      </InputGroupAddon>
      <InputGroupAddon align="inline-start">
        <IconSearch className="size-4" />
      </InputGroupAddon>
    </InputGroup>
  )
}

export function PageToolbarActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex w-full flex-wrap items-center gap-2 lg:ml-auto lg:w-auto lg:justify-end",
        className
      )}
      {...props}
    />
  )
}

export function PageToolbarGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <ButtonGroup
      className={cn("shrink-0", className)}
      {...props}
    />
  )
}
