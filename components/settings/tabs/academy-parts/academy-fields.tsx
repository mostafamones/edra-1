"use client"

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  IconForms,
  IconCheck,
  IconPlus,
  IconTrash,
  IconX,
  IconEye,
  IconEdit,
  IconAbc,
  IconHash,
  IconCalendar,
  IconToggleLeft,
  IconAsterisk,
  IconCursorText,
  IconPhone,
} from "@tabler/icons-react";
import type { StudentField } from "@/lib";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type FieldType = "text" | "number" | "date" | "boolean" | "phone";

const fieldTypeConfig: Record<FieldType, { label: string; icon: typeof IconAbc }> = {
  text: {
    label: "Text",
    icon: IconCursorText,
  },
  number: {
    label: "Number",
    icon: IconHash,
  },
  date: {
    label: "Date",
    icon: IconCalendar,
  },
  boolean: {
    label: "Yes / No",
    icon: IconToggleLeft,
  },
  phone: {
    label: "Phone",
    icon: IconPhone,
  },
};

export function AcademyFields({
  disabled,
  instructorId,
}: {
  disabled?: boolean;
  instructorId?: string;
}) {
  const [fields, setFields] = useState<StudentField[]>([]);
  const [loading, setLoading] = useState(true);

  // Inline editing
  const [editingFieldId, setEditingFieldId] = useState<number | null>(null);
  const [editingFieldName, setEditingFieldName] = useState("");
  const [editingFieldType, setEditingFieldType] = useState<FieldType>("text");
  const [editingFieldRequired, setEditingFieldRequired] = useState(false);

  // Adding new
  const [showAddField, setShowAddField] = useState(false);
  const [addingFieldName, setAddingFieldName] = useState("");
  const [addingFieldType, setAddingFieldType] = useState<FieldType>("text");
  const [addingFieldRequired, setAddingFieldRequired] = useState(false);

  // Saving / deleting
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentField | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchFields = useCallback(async () => {
    if (!instructorId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/fields?academyId=${instructorId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data: StudentField[] = await res.json();
      setFields(data);
    } catch (err) {
      console.error("Error fetching fields:", err);
      toast.error("Unable to load custom fields.");
    } finally {
      setLoading(false);
    }
  }, [instructorId]);

  useEffect(() => {
    if (instructorId) {
      fetchFields();
    }
  }, [instructorId, fetchFields]);

  // ── CRUD ──

  const handleAddField = async () => {
    if (!addingFieldName.trim()) return;
    setSavingId("add-field");
    try {
      const res = await fetch(`/api/fields?academyId=${instructorId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addingFieldName.trim(),
          field_type: addingFieldType,
          is_required: addingFieldRequired,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      const newField: StudentField = await res.json();
      setFields((prev) => [...prev, newField]);
      setAddingFieldName("");
      setAddingFieldType("text");
      setAddingFieldRequired(false);
      setShowAddField(false);
      toast.success("Field created successfully.");
    } catch (err) {
      console.error("Error creating field:", err);
      toast.error("Could not create field.");
    } finally {
      setSavingId(null);
    }
  };

  const handleUpdateField = async (fieldId: number) => {
    if (!editingFieldName.trim()) return;
    setSavingId(`field-${fieldId}`);
    try {
      const res = await fetch(`/api/fields/${fieldId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingFieldName.trim(),
          field_type: editingFieldType,
          is_required: editingFieldRequired,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated: StudentField = await res.json();
      setFields((prev) => prev.map((f) => (f.id === fieldId ? updated : f)));
      setEditingFieldId(null);
      toast.success("Field updated.");
    } catch (err) {
      console.error("Error updating field:", err);
      toast.error("Could not update field.");
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteField = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/fields/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setFields((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Field deleted.");
    } catch (err) {
      console.error("Error deleting field:", err);
      toast.error("Could not delete field.");
    } finally {
      setIsDeleting(false);
    }
  };

  const startEditing = (field: StudentField) => {
    setEditingFieldId(field.id);
    setEditingFieldName(field.name);
    setEditingFieldType(field.field_type as FieldType);
    setEditingFieldRequired(field.is_required === true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-24" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-input bg-muted/20 p-4"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="size-5" />
                <Skeleton className="h-5 w-48" />
                <div className="ml-auto flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-6" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {/* Header */}
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-lg">Custom Form Fields</CardTitle>
          <CardDescription>
            {fields.length} field{fields.length !== 1 ? "s" : ""} · {fields.filter((f) => f.is_required).length} required
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {!disabled && (
            <Button
              variant="outline"
              onClick={() => {
                setShowAddField(true);
                setAddingFieldName("");
                setAddingFieldType("text");
                setAddingFieldRequired(false);
              }}
              className="gap-1.5"
            >
              <IconPlus className="size-4" />
              Add Field
            </Button>
          )}
          {disabled && (
            <Badge variant="outline" className="text-xs gap-1.5 h-9 px-3">
              <IconEye className="h-4 w-4" />
              View Only
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {/* Add Field Inline */}
        {showAddField && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-2">
              <IconForms className="size-5 w-7 text-primary shrink-0" />
              <Input
                value={addingFieldName}
                onChange={(e) => setAddingFieldName(e.target.value)}
                placeholder="Field name..."
                className="h-10 flex-1 items-center"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddField();
                  if (e.key === "Escape") setShowAddField(false);
                }}
              />
            </div>
            <div className="flex items-center gap-2 mt-3 ml-9">
              <Select
                value={addingFieldType}
                onValueChange={(value) => setAddingFieldType(value as FieldType)}
              >
                <SelectTrigger className="h-9 w-[130px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(fieldTypeConfig) as [FieldType, typeof fieldTypeConfig.text][]).map(
                    ([type, config]) => {
                      const TypeIcon = config.icon;
                      return (
                        <SelectItem key={type} value={type}>
                          <div className="flex items-center gap-2">
                            <TypeIcon className={`size-3.5`} />
                            <span>{config.label}</span>
                          </div>
                        </SelectItem>
                      );
                    }
                  )}
                </SelectContent>
              </Select>

              <Button
                variant={addingFieldRequired ? "default" : "outline"}
                size="sm"
                className="h-9 gap-1.5 text-xs"
                onClick={() => setAddingFieldRequired(!addingFieldRequired)}
              >
                <IconAsterisk className="size-3" />
                {addingFieldRequired ? "Required" : "Optional"}
              </Button>

              <div className="flex-1" />

              <Button
                size="sm"
                className="h-9 gap-1 w-20"
                onClick={handleAddField}
                disabled={!addingFieldName.trim() || savingId === "add-field"}
              >
                <IconCheck className="size-3.5" />
                {savingId === "add-field" ? "Adding..." : "Add"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={() => setShowAddField(false)}
              >
                <IconX className="size-4.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Fields List */}
        <div className="flex flex-col gap-3">
          {fields.map((field) => {
            const config = fieldTypeConfig[field.field_type as FieldType] ?? fieldTypeConfig.text;
            const TypeIcon = config.icon;
            const isEditingThis = editingFieldId === field.id;
            const isSaving = savingId === `field-${field.id}`;

            return (
              <div
                key={field.id}
                className="rounded-lg border border-input bg-muted/20 overflow-hidden transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center gap-3 p-4">
                  {/* Type Icon */}
                  <div className="flex items-center justify-center size-8 rounded-md bg-muted/40 shrink-0">
                    <TypeIcon className={`size-4`} />
                  </div>

                  {isEditingThis ? (
                    /* ── Editing Mode ── */
                    <div className="flex-1 flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <Input
                          value={editingFieldName}
                          onChange={(e) => setEditingFieldName(e.target.value)}
                          className="h-8 flex-1 items-center"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdateField(field.id);
                            if (e.key === "Escape") setEditingFieldId(null);
                          }}
                        />
                        <Button
                          size="sm"
                          className="h-8 w-8 gap-1"
                          onClick={() => handleUpdateField(field.id)}
                          disabled={
                            !editingFieldName.trim() ||
                            isSaving ||
                            (field.name === editingFieldName &&
                              field.field_type === editingFieldType &&
                              (field.is_required === true) === editingFieldRequired)
                          }
                        >
                          <IconCheck className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setEditingFieldId(null)}
                        >
                          <IconX className="size-3.5" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={editingFieldType}
                          onValueChange={(value) => setEditingFieldType(value as FieldType)}
                        >
                          <SelectTrigger className="h-10 w-[150px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.entries(fieldTypeConfig) as [FieldType, typeof fieldTypeConfig.text][]).map(
                              ([type, cfg]) => {
                                const TIcon = cfg.icon;
                                return (
                                  <SelectItem key={type} value={type}>
                                    <div className="flex items-center gap-2">
                                      <TIcon className={`size-3.5`} />
                                      <span>{cfg.label}</span>
                                    </div>
                                  </SelectItem>
                                );
                              }
                            )}
                          </SelectContent>
                        </Select>

                        <Button
                          variant={editingFieldRequired ? "destructive" : "outline"}
                          size="sm"
                          className="h-9 gap-1.5 text-xs px-20"
                          onClick={() => setEditingFieldRequired(!editingFieldRequired)}
                        >
                          <IconAsterisk className="size-3" />
                          {editingFieldRequired ? "Required" : "Optional"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* ── Display Mode ── */
                    <>
                      <div className="flex-1 flex items-center gap-2 h-8">
                        <p className="text-sm font-medium">{field.name}</p>

                        <Tooltip>
                          <TooltipTrigger className="flex items-center">
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                              {config.label}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            Field type: {config.label}
                          </TooltipContent>
                        </Tooltip>

                        {field.is_required && (
                          <Tooltip>
                            <TooltipTrigger className="flex items-center">
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-0.5">
                                <IconAsterisk className="size-2.5" />
                                Required
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              This field is required on the student form
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>

                      {/* Actions */}
                      {!disabled && (
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => startEditing(field)}
                            title="Edit field"
                          >
                            <IconEdit className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteTarget(field)}
                            title="Delete field"
                          >
                            <IconTrash className="size-3.5" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {fields.length === 0 && !showAddField && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
              <IconForms className="size-10 opacity-40" />
              <p className="text-sm">No custom fields yet.</p>
              {!disabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAddField(true);
                    setAddingFieldName("");
                  }}
                >
                  <IconPlus className="size-4 mr-1" />
                  Create your first field
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Delete Confirmation */}
        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={(open: boolean) => !open && setDeleteTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Field</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{" "}
                <span className="font-medium text-foreground">
                  {deleteTarget?.name}
                </span>
                ? All student data collected through this field will be permanently lost. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-2 justify-end">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteField}
                disabled={isDeleting}
                variant="destructive"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
