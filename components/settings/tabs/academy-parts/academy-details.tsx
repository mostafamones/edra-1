"use client"

import { useEffect, useState } from "react";
import { useAcademy } from "@/lib/hooks/use-data";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  IconSchool,
  IconUserStar,
  IconCalendar,
  IconUsers,
  IconEdit,
  IconDeviceFloppy,
  IconX,
  IconCopy,
  IconCheck,
  IconEye,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function AcademyDetails({
  disabled,
  academyId,
}: {
  disabled?: boolean;
  academyId?: string;
}) {
  const { data: academy, loading, setData: setAcademy, refresh } = useAcademy(academyId || null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form state
  const [editName, setEditName] = useState("");

  // Track if changes were made
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (academy) {
      setEditName(academy.name);
    }
  }, [academy]);

  useEffect(() => {
    if (academy) {
      setHasChanges(editName !== academy.name);
    }
  }, [editName, academy]);

  const handleEdit = () => {
    if (disabled) return;
    setIsEditing(true);
    setEditName(academy?.name || "");
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditName(academy?.name || "");
    setHasChanges(false);
  };

  const handleSave = async () => {
    if (!academy || !hasChanges) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/academy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: academy.id, name: editName.trim() }),
      });

      if (!res.ok) throw new Error("Failed to update");

      const updated = await res.json();
      setAcademy((prev) => (prev ? { ...prev, ...updated } : prev));
      setIsEditing(false);
      setHasChanges(false);
      toast.success("Academy settings saved successfully.");
    } catch (err) {
      console.error("Error saving academy:", err);
      toast.error("Could not save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-24" />
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-5">
            {[1, 2].map((i) => (
              <div key={i} className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-9 w-full" />
                </div>
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>
            ))}
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
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
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(academy.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <Card>
      {/* Header */}
      <CardHeader className="flex flex-row justify-between items-start pt-6 mb-4">
        <div>
          <CardTitle className="text-lg">Academy Details</CardTitle>
          <CardDescription>View and manage your academy information</CardDescription>
        </div>
        {!disabled && !isEditing && (
          <Button
            type="button"
            variant="outline"
            onClick={handleEdit}
            className="gap-1.5 h-9"
          >
            <IconEdit className="size-4" />
            Edit
          </Button>
        )}
        {disabled && (
          <Badge variant="outline" className="text-xs gap-1.5 h-9">
            <IconEye className="h-4 w-4" />
            View Only
          </Badge>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-6 w-full">
        {/* Form Fields */}
        <div className="grid gap-5">
          <div className="grid grid-cols-2 gap-4">
            {/* Academy Name */}
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="academy-name"
                className="flex items-center gap-1.5 text-muted-foreground"
              >
                <IconSchool className="size-3.5" />
                Academy Name
              </Label>
              {isEditing ? (
                <Input
                  id="academy-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter academy name"
                  autoFocus
                />
              ) : (
                <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted/40 px-3 text-sm">
                  {academy.name}
                </div>
              )}
            </div>

            {/* Owner */}
            <div className="flex flex-col gap-2">
              <Label className="flex items-center gap-1.5 text-muted-foreground">
                <IconUserStar className="size-3.5" />
                Owner
              </Label>
              <div className="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-sm">
                <span>{academy.owner_email || "—"}</span>
                <Badge variant="destructive" className="ml-auto text-[10px] px-1.5 py-0">
                  Owner
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Created Date */}
            <div className="flex flex-col gap-2">
              <Label className="flex items-center gap-1.5 text-muted-foreground">
                <IconCalendar className="size-3.5" />
                Created On
              </Label>
              <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted/40 px-3 text-sm">
                {formatDate(academy.created_at)}
              </div>
            </div>

            {/* Instructor Count */}
            <div className="flex flex-col gap-2">
              <Label className="flex items-center gap-1.5 text-muted-foreground">
                <IconUsers className="size-3.5" />
                Active Instructors
              </Label>
              <div className="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-sm">
                <span>{academy.instructor_count}</span>
                <Badge
                  variant="secondary"
                  className="ml-auto text-[10px] px-1.5 py-0"
                >
                  {academy.instructor_count === 1 ? "Member" : "Members"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Academy ID (read-only, always) */}
          <div className="flex flex-col gap-2">
            <Label className="flex items-center gap-1.5 text-muted-foreground text-xs">
              Academy ID
            </Label>
            <div className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground font-mono select-all">
              {academy.id}
              {!disabled && <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                disabled={copied}
                className="h-6 px-1.5 gap-1"
              >
                {copied ? (
                  <>
                    <IconCheck className="size-3" />
                    <span className="text-xs">Copied</span>
                  </>
                ) : (
                  <>
                    <IconCopy className="size-3" />
                    <span className="text-xs">Copy</span>
                  </>
                )}
              </Button>}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex items-center justify-end gap-2 pt-2 border-t mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              size="sm"
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
    </Card>
  );
}
