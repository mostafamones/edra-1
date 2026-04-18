"use client"

import { useEffect, useState } from "react"
import { useAcademy } from "@/lib/hooks/use-data"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  IconBuildingArch,
  IconCheck,
  IconCopy,
  IconDeviceFloppy,
  IconEdit,
  IconEye,
  IconSchool,
  IconUserStar,
  IconUsers,
  IconX,
} from "@tabler/icons-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"

export function AcademyDetails({
  disabled,
  academyId,
}: {
  disabled?: boolean
  academyId?: string
}) {
  const { data: academy, loading, setData: setAcademy, refresh } = useAcademy(academyId || null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const [editName, setEditName] = useState("")
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (academy) {
      setEditName(academy.name)
    }
  }, [academy])

  useEffect(() => {
    if (academy) {
      setHasChanges(editName !== academy.name)
    }
  }, [editName, academy])

  const handleEdit = () => {
    if (disabled) return
    setIsEditing(true)
    setEditName(academy?.name || "")
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditName(academy?.name || "")
    setHasChanges(false)
  }

  const handleSave = async () => {
    if (!academy || !hasChanges) return
    setIsSaving(true)
    try {
      const res = await fetch("/api/academy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: academy.id, name: editName.trim() }),
      })

      if (!res.ok) throw new Error("Failed to update")

      const updated = await res.json()
      setAcademy((prev) => (prev ? { ...prev, ...updated } : prev))
      setIsEditing(false)
      setHasChanges(false)
      toast.success("Academy settings saved successfully.")
    } catch (err) {
      console.error("Error saving academy:", err)
      toast.error("Could not save changes. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const formatDateTime = (dateStr: string | null) =>
    dateStr ? new Date(dateStr).toLocaleString("en-US") : "—"

  if (loading) {
    return (
      <Card className="border-input/70">
        <CardHeader className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!academy) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
          <IconSchool className="size-10 opacity-40" />
          <p className="text-sm">Unable to load academy details.</p>
          <Button variant="outline" size="sm" onClick={refresh}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(academy.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div className="border-input/70">
      <CardHeader className="pb-2 text-left">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-2xl font-semibold">Academy Details</CardTitle>
            <CardDescription className="mt-1 text-sm">
              Update identity and review your workspace metadata.
            </CardDescription>
          </div>
          {disabled ? (
            <Badge variant="outline" className="gap-1.5">
              <IconEye className="size-3.5" />
              View Only
            </Badge>
          ) : !isEditing ? (
            <Button type="button" variant="outline" onClick={handleEdit} className="gap-1.5">
              <IconEdit className="size-4" />
              Edit
            </Button>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="academy-name" className="text-muted-foreground">
              <IconSchool className="size-3.5" />
              Academy Name
            </FieldLabel>
            {isEditing ? (
              <Input
                id="academy-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter academy name"
                autoFocus
              />
            ) : (
              <Input value={academy.name} readOnly className="bg-muted/30" />
            )}
          </Field>

          <FieldSeparator>Organization</FieldSeparator>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel className="text-muted-foreground">
                <IconUserStar className="size-3.5" />
                Owner
              </FieldLabel>
              <InputGroup>
                <InputGroupInput value={academy.owner_email || "—"} readOnly />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>
                    <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">
                      Owner
                    </Badge>
                  </InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </Field>

            <Field>
              <FieldLabel className="text-muted-foreground">
                <IconUsers className="size-3.5" />
                Active Instructors
              </FieldLabel>
              <InputGroup>
                <InputGroupInput value={String(academy.instructor_count ?? 0)} readOnly />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>
                    {academy.instructor_count === 1 ? "Member" : "Members"}
                  </InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </Field>
          </div>

          <Field>
            <FieldLabel className="text-muted-foreground">
              <IconBuildingArch className="size-3.5" />
              Academy ID
            </FieldLabel>
            <InputGroup>
              <InputGroupInput value={academy.id} readOnly className="font-mono text-xs" />
              {!disabled && (
                <InputGroupAddon align="inline-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    disabled={copied}
                    className="h-7 gap-1 px-2"
                  >
                    {copied ? (
                      <>
                        <IconCheck className="size-3.5" />
                        Copied
                      </>
                    ) : (
                      <>
                        <IconCopy className="size-3.5" />
                        Copy
                      </>
                    )}
                  </Button>
                </InputGroupAddon>
              )}
            </InputGroup>
            <FieldDescription>Created: {formatDateTime(academy.created_at)}</FieldDescription>
          </Field>
        </FieldGroup>

        {isEditing && (
          <div className="mt-2 flex items-center justify-end gap-2 border-t pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <IconX className="size-4" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving || !editName.trim()}
              className="gap-1.5"
            >
              <IconDeviceFloppy className="size-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </CardContent>
    </div>
  )
}
