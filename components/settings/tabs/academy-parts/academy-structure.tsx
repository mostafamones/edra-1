"use client"

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  IconBuildingArch,
  IconChevronDown,
  IconChevronRight,
  IconEdit,
  IconCheck,
  IconPlus,
  IconTrash,
  IconX,
  IconEye,
  IconGitBranch,
  IconSchool,
  IconBlocks,
} from "@tabler/icons-react";
import type { Level, Branch } from "@/lib";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type LevelWithBranches = Level & {
  branches: Branch[];
};

export function AcademyStructure({
  disabled,
  instructorId,
}: {
  disabled?: boolean;
  instructorId?: string;
}) {
  const [levels, setLevels] = useState<LevelWithBranches[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set());

  // Inline editing
  const [editingLevelId, setEditingLevelId] = useState<number | null>(null);
  const [editingLevelName, setEditingLevelName] = useState("");
  const [editingBranchId, setEditingBranchId] = useState<number | null>(null);
  const [editingBranchName, setEditingBranchName] = useState("");

  // Adding new
  const [addingLevelName, setAddingLevelName] = useState("");
  const [showAddLevel, setShowAddLevel] = useState(false);
  const [addingBranchToLevel, setAddingBranchToLevel] = useState<number | null>(null);
  const [addingBranchName, setAddingBranchName] = useState("");

  // Saving / deleting
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "level" | "branch"; id: number; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Academy ID resolved server-side
  const [academyId, setAcademyId] = useState<string | null>(null);

  const fetchStructure = useCallback(async () => {
    if (!instructorId) return;
    setLoading(true);
    try {
      setAcademyId(instructorId);

      // Fetch levels and branches in parallel
      const [levelsRes, branchesRes] = await Promise.all([
        fetch(`/api/levels?academyId=${instructorId}`),
        fetch(`/api/branches?academyId=${instructorId}`),
      ]);

      if (!levelsRes.ok) {
        const err = await levelsRes.json();
        throw new Error(err.details || err.error || "Failed to fetch levels");
      }
      if (!branchesRes.ok) {
        const err = await branchesRes.json();
        throw new Error(err.details || err.error || "Failed to fetch branches");
      }

      const levelsData: Level[] = await levelsRes.json();
      const branchesData: Branch[] = await branchesRes.json();

      // Group branches by level
      const levelsWithBranches: LevelWithBranches[] = levelsData.map((level) => ({
        ...level,
        branches: branchesData.filter((b) => b.level_id === level.id),
      }));

      setLevels(levelsWithBranches);
    } catch (err: any) {
      console.error("Error fetching structure:", err);
      toast.error(`Unable to load academic structure: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [instructorId]);

  useEffect(() => {
    if (instructorId) {
      fetchStructure();
    }
  }, [instructorId, fetchStructure]);

  const toggleLevel = (levelId: number) => {
    setExpandedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(levelId)) {
        next.delete(levelId);
      } else {
        next.add(levelId);
      }
      return next;
    });
  };

  // ── Level CRUD ──

  const handleAddLevel = async () => {
    if (!academyId || !addingLevelName.trim()) return;
    setSavingId("add-level");
    try {
      const res = await fetch("/api/levels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ academy_id: academyId, name: addingLevelName.trim() }),
      });
      if (!res.ok) throw new Error("Failed to create");
      const newLevel: Level = await res.json();
      setLevels((prev) => [{ ...newLevel, branches: [] }, ...prev]);
      setAddingLevelName("");
      setShowAddLevel(false);
      toast.success("Level created successfully.");
    } catch (err) {
      console.error("Error creating level:", err);
      toast.error("Could not create level.");
    } finally {
      setSavingId(null);
    }
  };

  const handleUpdateLevel = async (levelId: number) => {
    if (!editingLevelName.trim()) return;
    setSavingId(`level-${levelId}`);
    try {
      const res = await fetch(`/api/levels/${levelId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingLevelName.trim() }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setLevels((prev) =>
        prev.map((l) => (l.id === levelId ? { ...l, name: editingLevelName.trim() } : l))
      );
      setEditingLevelId(null);
      toast.success("Level updated.");
    } catch (err) {
      console.error("Error updating level:", err);
      toast.error("Could not update level.");
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteLevel = async () => {
    if (!deleteTarget || deleteTarget.type !== "level") return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/levels/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setLevels((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Level deleted.");
    } catch (err) {
      console.error("Error deleting level:", err);
      toast.error("Could not delete level.");
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Branch CRUD ──

  const handleAddBranch = async (levelId: number) => {
    if (!academyId || !addingBranchName.trim()) return;
    setSavingId(`add-branch-${levelId}`);
    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academy_id: academyId,
          level_id: levelId,
          name: addingBranchName.trim(),
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      const newBranch: Branch = await res.json();
      setLevels((prev) =>
        prev.map((l) =>
          l.id === levelId ? { ...l, branches: [...l.branches, newBranch] } : l
        )
      );
      setAddingBranchName("");
      setAddingBranchToLevel(null);
      // Auto-expand to show the new branch
      setExpandedLevels((prev) => new Set(prev).add(levelId));
      toast.success("Branch created.");
    } catch (err) {
      console.error("Error creating branch:", err);
      toast.error("Could not create branch.");
    } finally {
      setSavingId(null);
    }
  };

  const handleUpdateBranch = async (branchId: number) => {
    if (!editingBranchName.trim()) return;
    setSavingId(`branch-${branchId}`);
    try {
      const res = await fetch("/api/branches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: branchId, name: editingBranchName.trim() }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setLevels((prev) =>
        prev.map((l) => ({
          ...l,
          branches: l.branches.map((b) =>
            b.id === branchId ? { ...b, name: editingBranchName.trim() } : b
          ),
        }))
      );
      setEditingBranchId(null);
      toast.success("Branch updated.");
    } catch (err) {
      console.error("Error updating branch:", err);
      toast.error("Could not update branch.");
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteBranch = async () => {
    if (!deleteTarget || deleteTarget.type !== "branch") return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/branches?id=${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setLevels((prev) =>
        prev.map((l) => ({
          ...l,
          branches: l.branches.filter((b) => b.id !== deleteTarget.id),
        }))
      );
      setDeleteTarget(null);
      toast.success("Branch deleted.");
    } catch (err) {
      console.error("Error deleting branch:", err);
      toast.error("Could not delete branch.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-24" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
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
          <CardTitle className="text-lg">Academic Structure</CardTitle>
          <CardDescription>
            {levels.length} level{levels.length !== 1 ? "s" : ""} · {levels.reduce((sum, l) => sum + l.branches.length, 0)} branch{levels.reduce((sum, l) => sum + l.branches.length, 0) !== 1 ? "es" : ""}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {!disabled && (
            <Button
              variant="outline"
              onClick={() => {
                setShowAddLevel(true);
                setAddingLevelName("");
              }}
              className="gap-1.5"
            >
              <IconPlus className="size-4" />
              Add Level
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
        {/* Add Level Inline */}
        {showAddLevel && (
          <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 py-4.5 px-3">
            <IconSchool className="size-5 w-7 text-primary shrink-0" />
            <Input
              value={addingLevelName}
              onChange={(e) => setAddingLevelName(e.target.value)}
              placeholder="Enter level name..."
              className="h-10 flex-1 items-center"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddLevel();
                if (e.key === "Escape") setShowAddLevel(false);
              }}
            />
            <Button
              size="sm"
              className="h-10 gap-1 w-20"
              onClick={handleAddLevel}
              disabled={!addingLevelName.trim() || savingId === "add-level"}
            >
              <IconCheck className="size-3.5" />
              {savingId === "add-level" ? "Adding..." : "Add"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0"
              onClick={() => setShowAddLevel(false)}
            >
              <IconX className="size-4.5" />
            </Button>
          </div>
        )}

        {/* Levels List */}
        <div className="flex flex-col gap-3">
          {levels.map((level) => {
            const isExpanded = expandedLevels.has(level.id);
            const isEditingThis = editingLevelId === level.id;
            const isSaving = savingId === `level-${level.id}`;
            const isAddingBranch = addingBranchToLevel === level.id;

            return (
              <div
                key={level.id}
                className="rounded-lg border border-input bg-muted/20 overflow-hidden transition-colors hover:bg-muted/30"
              >
                {/* Level Header */}
                <div className="flex items-center gap-3 p-4">
                  {/* Expand/Collapse */}
                  <button
                    onClick={() => toggleLevel(level.id)}
                    className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isExpanded ? (
                      <IconChevronDown className="size-5" />
                    ) : (
                      <IconChevronRight className="size-5" />
                    )}
                  </button>

                  {/* Level name / Edit */}
                  {isEditingThis ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editingLevelName}
                        onChange={(e) => setEditingLevelName(e.target.value)}
                        className="h-8 flex-1 items-center"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleUpdateLevel(level.id);
                          if (e.key === "Escape") setEditingLevelId(null);
                        }}
                      />
                      <Button
                        size="sm"
                        className="h-8 w-8 gap-1"
                        onClick={() => handleUpdateLevel(level.id)}
                        disabled={!editingLevelName.trim() || isSaving || level.name === editingLevelName}
                      >
                        <IconCheck className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setEditingLevelId(null)}
                      >
                        <IconX className="size-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="flex-1 flex items-center gap-2 h-8"
                      onClick={() => toggleLevel(level.id)}
                    >
                      <p className="text-sm font-medium">{level.name}</p>
                      {level.branches.length > 0 && <Tooltip>
                        <TooltipTrigger className="flex items-center">
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {level.branches.length} branch{level.branches.length !== 1 ? "es" : ""}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="flex flex-col">
                            {level.branches.map((branch) => (
                              <p key={branch.id}>{branch.name}</p>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>}
                    </div>
                  )}

                  {/* Level Actions */}
                  {!disabled && !isEditingThis && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setAddingBranchToLevel(level.id);
                          setAddingBranchName("");
                          setExpandedLevels((prev) => new Set(prev).add(level.id));
                        }}
                        title="Add branch"
                      >
                        <IconPlus className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setEditingLevelId(level.id);
                          setEditingLevelName(level.name);
                        }}
                        title="Rename level"
                      >
                        <IconEdit className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget({ type: "level", id: level.id, name: level.name })}
                        title="Delete level"
                      >
                        <IconTrash className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Branches (expandable) */}
                {isExpanded && (
                  <div className="border-t border-input/50 bg-muted/10">
                    {level.branches.length === 0 && !isAddingBranch && (
                      <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
                        <IconGitBranch className="size-3.5 opacity-50" />
                        No branches yet
                        {!disabled && (
                          <>
                            <span>·</span>
                            <button
                              className="text-primary hover:underline"
                              onClick={() => {
                                setAddingBranchToLevel(level.id);
                                setAddingBranchName("");
                              }}
                            >
                              Add one
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {level.branches.map((branch) => {
                      const isEditingBranch = editingBranchId === branch.id;
                      const isSavingBranch = savingId === `branch-${branch.id}`;

                      return (
                        <div
                          key={branch.id}
                          className="flex items-center justify-between gap-3 px-4 py-2.5 pl-12 border-t border-input/30 first:border-t-0 hover:bg-muted/20 transition-colors"
                        >
                          <IconGitBranch className="size-3.5 text-muted-foreground shrink-0" />

                          {isEditingBranch ? (
                            <div className="flex items-center gap-1 flex-1">
                              <Input
                                value={editingBranchName}
                                onChange={(e) => setEditingBranchName(e.target.value)}
                                className="h-7 text-sm flex-1"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleUpdateBranch(branch.id);
                                  if (e.key === "Escape") setEditingBranchId(null);
                                }}
                              />
                              <Button
                                size="sm"
                                className="h-7 w-7 p-0 ml-1 text-xs"
                                onClick={() => handleUpdateBranch(branch.id)}
                                disabled={!editingBranchName.trim() || isSavingBranch || branch.name === editingBranchName}
                              >
                                <IconCheck className="size-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => setEditingBranchId(null)}
                              >
                                <IconX className="size-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center h-7 justify-between w-full">
                              <p className="text-sm flex-1">{branch.name}</p>
                              {!disabled && (
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                    onClick={() => {
                                      setEditingBranchId(branch.id);
                                      setEditingBranchName(branch.name);
                                    }}
                                  >
                                    <IconEdit className="size-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                    onClick={() => setDeleteTarget({ type: "branch", id: branch.id, name: branch.name })}
                                  >
                                    <IconTrash className="size-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Add Branch Inline */}
                    {isAddingBranch && (
                      <div className="flex items-center gap-2 px-4 py-4 pl-12 border-t border-primary/20 bg-primary/5">
                        <IconGitBranch className="size-3.5 text-primary shrink-0" />
                        <Input
                          value={addingBranchName}
                          onChange={(e) => setAddingBranchName(e.target.value)}
                          placeholder="Branch name..."
                          className="h-7 text-sm flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddBranch(level.id);
                            if (e.key === "Escape") setAddingBranchToLevel(null);
                          }}
                        />
                        <Button
                          size="sm"
                          className="h-7 gap-1 text-xs"
                          onClick={() => handleAddBranch(level.id)}
                          disabled={!addingBranchName.trim() || savingId === `add-branch-${level.id}`}
                        >
                          <IconCheck className="size-3" />
                          {savingId === `add-branch-${level.id}` ? "Adding..." : "Add"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => setAddingBranchToLevel(null)}
                        >
                          <IconX className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                )
                }
              </div>
            );
          })}

          {levels.length === 0 && !showAddLevel && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
              <IconBlocks className="size-10 opacity-40" />
              <p className="text-sm">No levels defined yet.</p>
              {!disabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAddLevel(true);
                    setAddingLevelName("");
                  }}
                >
                  <IconPlus className="size-4 mr-1" />
                  Create your first level
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Summary Footer */}
        <Separator />
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2.5 rounded-lg border border-input bg-muted/20 px-3 py-2.5">
            <IconSchool className="size-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Levels</p>
              <p className="text-sm font-semibold">{levels.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-lg border border-input bg-muted/20 px-3 py-2.5">
            <IconGitBranch className="size-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Branches</p>
              <p className="text-sm font-semibold">{levels.reduce((sum, l) => sum + l.branches.length, 0)}</p>
            </div>
          </div>
        </div>

        {/* Delete Confirmation */}
        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={(open: boolean) => !open && setDeleteTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete {deleteTarget?.type === "level" ? "Level" : "Branch"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{" "}
                <span className="font-medium text-foreground">
                  {deleteTarget?.name}
                </span>
                ?
                {deleteTarget?.type === "level" && (
                  <> This will also delete all branches within this level.</>
                )}
                {" "}This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-2 justify-end">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={deleteTarget?.type === "level" ? handleDeleteLevel : handleDeleteBranch}
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
