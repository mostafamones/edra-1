"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// ============================================================================
// TYPES
// ============================================================================

export type ConfirmDialogVariant = "delete" | "archive" | "default"

export interface ConfirmDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  entity?: string
  targetIdentifier?: string
  title?: React.ReactNode
  description?: React.ReactNode
  titleKey?: string
  descriptionKey?: string
  confirmLabel?: React.ReactNode
  confirmLabelKey?: string
  cancelLabel?: React.ReactNode
  variant?: ConfirmDialogVariant
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
  loading?: boolean
  disabled?: boolean
  confirmButtonVariant?: "destructive" | "default"
  buttonSize?: "default" | "sm"
  className?: string
  children?: React.ReactNode
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * ConfirmDialog - A standardized confirmation component
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  entity,
  targetIdentifier,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = "default",
  onConfirm,
  onCancel,
  loading = false,
  disabled = false,
  confirmButtonVariant,
  buttonSize = "default",
  className,
  children,
}: ConfirmDialogProps) {
  const getDialogTitle = (): React.ReactNode => {
    if (title) return title
    if (variant === "delete") {
      const label = entity ? entity.charAt(0).toUpperCase() + entity.slice(1) : "Item"
      return `Delete ${label}`
    }
    return "Confirm"
  }

  const getDescription = (): React.ReactNode => {
    if (description) return description
    if (variant === "delete" && targetIdentifier) {
      return (
        <>
          Are you sure you want to delete{" "}
          <strong className="font-semibold text-foreground">{targetIdentifier}</strong>
          ? This cannot be undone.
        </>
      )
    }
    return null
  }

  const getConfirmLabel = (): React.ReactNode => {
    if (confirmLabel) return confirmLabel
    if (variant === "delete") return "Delete"
    if (variant === "archive") return "Archive"
    return "Confirm"
  }

  const getCancelLabel = (): React.ReactNode => {
    if (cancelLabel) return cancelLabel
    return "Cancel"
  }

  const getConfirmButtonVariant = (): "destructive" | "default" => {
    if (confirmButtonVariant) return confirmButtonVariant
    return variant === "delete" ? "destructive" : "default"
  }

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm()
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
    if (onOpenChange) {
      onOpenChange(false)
    }
  }

  const desc = getDescription()

  const content = (
    <AlertDialogContent className={className}>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {getDialogTitle()}
        </AlertDialogTitle>
        {desc && (
          <AlertDialogDescription>
            {desc}
          </AlertDialogDescription>
        )}
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={handleCancel}>{getCancelLabel()}</AlertDialogCancel>
        <AlertDialogAction onClick={handleConfirm} variant={getConfirmButtonVariant()} size={buttonSize} disabled={loading || disabled}>
          {getConfirmLabel()}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  )

  if (children) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        {children}
        {content}
      </AlertDialog>
    )
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {content}
    </AlertDialog>
  )
}
