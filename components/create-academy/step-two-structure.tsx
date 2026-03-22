"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  IconChevronDown,
  IconChevronRight,
  IconEdit,
  IconCheck,
  IconPlus,
  IconTrash,
  IconX,
  IconBlocks,
  IconUsers,
} from "@tabler/icons-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface Group {
  id: string;
  name: string;
}

interface Level {
  id: string;
  name: string;
  groups: Group[];
}

interface StepTwoStructureProps {
  initialData: {
    levels: Level[];
  };
  onUpdate: (data: { levels: Level[] }) => void;
}

function ColorSelector() {
  return (
    <Popover>
      <PopoverTrigger>
      </PopoverTrigger>
      <PopoverContent>

      </PopoverContent>
    </Popover>
  )
}

export function StepTwoStructure({ initialData, onUpdate }: StepTwoStructureProps) {
  const [levels, setLevels] = useState<Level[]>(initialData.levels || []);
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());

  // Inline editing
  const [editingLevelId, setEditingLevelId] = useState<string | null>(null);
  const [editingLevelName, setEditingLevelName] = useState("");
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState("");

  // Adding new
  const [addingLevelName, setAddingLevelName] = useState("");
  const [showAddLevel, setShowAddLevel] = useState(false);
  const [addingGroupToLevel, setAddingGroupToLevel] = useState<string | null>(null);
  const [addingGroupName, setAddingGroupName] = useState("");

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "level" | "group";
    levelId: string;
    id: string;
    name: string;
  } | null>(null);

  // ── Helpers ──

  const updateLevels = (newLevels: Level[]) => {
    setLevels(newLevels);
    onUpdate({ levels: newLevels });
  };

  const toggleLevel = (levelId: string) => {
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

  const handleAddLevel = () => {
    if (!addingLevelName.trim()) return;
    const newLevel: Level = {
      id: `level-${Date.now()}`,
      name: addingLevelName.trim(),
      groups: [],
    };
    const newLevels = [newLevel, ...levels];
    updateLevels(newLevels);
    setAddingLevelName("");
    setShowAddLevel(false);
  };

  const handleUpdateLevel = (levelId: string) => {
    if (!editingLevelName.trim()) return;
    const newLevels = levels.map((l) =>
      l.id === levelId ? { ...l, name: editingLevelName.trim() } : l
    );
    updateLevels(newLevels);
    setEditingLevelId(null);
  };

  const handleDeleteLevel = () => {
    if (!deleteTarget || deleteTarget.type !== "level") return;
    const newLevels = levels.filter((l) => l.id !== deleteTarget.id);
    updateLevels(newLevels);
    setDeleteTarget(null);
  };

  // ── Group CRUD ──

  const handleAddGroup = (levelId: string) => {
    if (!addingGroupName.trim()) return;
    const newGroup: Group = {
      id: `group-${Date.now()}`,
      name: addingGroupName.trim(),
    };
    const newLevels = levels.map((l) =>
      l.id === levelId ? { ...l, groups: [...l.groups, newGroup] } : l
    );
    updateLevels(newLevels);
    setAddingGroupName("");
    setAddingGroupToLevel(null);
    setExpandedLevels((prev) => new Set(prev).add(levelId));
  };

  const handleUpdateGroup = (levelId: string, groupId: string) => {
    if (!editingGroupName.trim()) return;
    const newLevels = levels.map((l) =>
      l.id === levelId
        ? {
          ...l,
          groups: l.groups.map((g) =>
            g.id === groupId ? { ...g, name: editingGroupName.trim() } : g
          ),
        }
        : l
    );
    updateLevels(newLevels);
    setEditingGroupId(null);
  };

  const handleDeleteGroup = () => {
    if (!deleteTarget || deleteTarget.type !== "group") return;
    const newLevels = levels.map((l) =>
      l.id === deleteTarget.levelId
        ? { ...l, groups: l.groups.filter((g) => g.id !== deleteTarget.id) }
        : l
    );
    updateLevels(newLevels);
    setDeleteTarget(null);
  };

  const totalGroups = levels.reduce((sum, l) => sum + l.groups.length, 0);

  return (
    <div className="h-[100%] flex flex-col">
      {/* Header */}
      <CardHeader className="text-left mb-4">
        <CardTitle className="text-2xl font-semibold">Academy Structure</CardTitle>
        <CardDescription className="text-sm -mt-1">
          Specify your levels and group names!
        </CardDescription>
      </CardHeader>

      {/* Levels List */}
      <CardContent className="space-y-2 h-full flex flex-col" >
        {/* Add Level Inline */}
        {showAddLevel ? (
          <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 h-15 px-3">
            <Button variant={"outline"} size={"icon-lg"}>
              <div className="size-2.5 bg-red-500 rounded-full" />
            </Button>
            <Input
              value={addingLevelName}
              onChange={(e) => setAddingLevelName(e.target.value)}
              placeholder="Enter level name..."
              className="h-9 flex-1 items-center"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddLevel();
                if (e.key === "Escape") setShowAddLevel(false);
              }}
            />
            <div className="flex gap-0.5">
              <Button
                size="icon-lg"
                onClick={handleAddLevel}
                disabled={!addingLevelName.trim()}
              >
                <IconCheck className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-lg"
                onClick={() => setShowAddLevel(false)}
              >
                <IconX className="size-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => {
              setShowAddLevel(true);
              setAddingLevelName("");
            }}
            className="gap-1.5 h-10 w-full"
          >
            <IconPlus className="size-5" />
            Add Level
          </Button>
        )}

        <div className="flex flex-col gap-3">
          {levels.map((level) => {
            const isExpanded = expandedLevels.has(level.id);
            const isEditingThis = editingLevelId === level.id;
            const isAddingGroup = addingGroupToLevel === level.id;

            return (
              <div
                key={level.id}
                className="rounded-lg border border-input bg-muted/20 overflow-hidden transition-colors hover:bg-muted/30"
              >
                {/* Level Header */}
                <div className="flex items-center gap-3 h-15 px-3">
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
                        disabled={
                          !editingLevelName.trim() ||
                          level.name === editingLevelName
                        }
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
                      className="flex-1 flex items-center gap-2 h-8 cursor-pointer"
                      onClick={() => toggleLevel(level.id)}
                    >
                      <p className="text-sm font-medium">{level.name}</p>
                      {level.groups.length > 0 && (
                        <Tooltip>
                          <TooltipTrigger className="flex items-center">
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0"
                            >
                              {level.groups.length} group
                              {level.groups.length !== 1 ? "s" : ""}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="flex flex-col">
                              {level.groups.map((group) => (
                                <p key={group.id}>{group.name}</p>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  )}

                  {/* Level Actions */}
                  {!isEditingThis && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setAddingGroupToLevel(level.id);
                          setAddingGroupName("");
                          setExpandedLevels((prev) =>
                            new Set(prev).add(level.id)
                          );
                        }}
                        title="Add group"
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
                        onClick={() =>
                          setDeleteTarget({
                            type: "level",
                            levelId: level.id,
                            id: level.id,
                            name: level.name,
                          })
                        }
                        title="Delete level"
                      >
                        <IconTrash className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Groups (expandable) */}
                {isExpanded && (
                  <div className="border-t border-input/50 bg-muted/10">
                    {level.groups.length === 0 && !isAddingGroup && (
                      <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
                        <IconUsers className="size-3.5 opacity-50" />
                        No groups yet
                        <>
                          <span>·</span>
                          <button
                            className="text-primary hover:underline"
                            onClick={() => {
                              setAddingGroupToLevel(level.id);
                              setAddingGroupName("");
                            }}
                          >
                            Add one
                          </button>
                        </>
                      </div>
                    )}

                    {level.groups.map((group) => {
                      const isEditingGroup = editingGroupId === group.id;

                      return (
                        <div
                          key={group.id}
                          className="flex items-center justify-between gap-3 px-4 py-2.5 pl-12 border-t border-input/30 first:border-t-0 hover:bg-muted/20 transition-colors"
                        >
                          <IconUsers className="size-3.5 text-muted-foreground shrink-0" />

                          {isEditingGroup ? (
                            <div className="flex items-center gap-1 flex-1">
                              <Input
                                value={editingGroupName}
                                onChange={(e) =>
                                  setEditingGroupName(e.target.value)
                                }
                                className="h-7 text-sm flex-1"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    handleUpdateGroup(level.id, group.id);
                                  if (e.key === "Escape")
                                    setEditingGroupId(null);
                                }}
                              />
                              <Button
                                size="sm"
                                className="h-7 w-7 p-0 ml-1 text-xs"
                                onClick={() =>
                                  handleUpdateGroup(level.id, group.id)
                                }
                                disabled={
                                  !editingGroupName.trim() ||
                                  group.name === editingGroupName
                                }
                              >
                                <IconCheck className="size-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => setEditingGroupId(null)}
                              >
                                <IconX className="size-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center h-7 justify-between w-full">
                              <p className="text-sm flex-1">{group.name}</p>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                  onClick={() => {
                                    setEditingGroupId(group.id);
                                    setEditingGroupName(group.name);
                                  }}
                                >
                                  <IconEdit className="size-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                  onClick={() => {
                                    setDeleteTarget({
                                      type: "group",
                                      levelId: level.id,
                                      id: group.id,
                                      name: group.name,
                                    })
                                  }}
                                >
                                  <IconTrash className="size-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Add Group Inline */}
                    {isAddingGroup && (
                      <div className="flex items-center gap-2 px-4 py-4 pl-12 border-t border-primary/20 bg-primary/5">
                        <IconUsers className="size-3.5 text-primary shrink-0" />
                        <Input
                          value={addingGroupName}
                          onChange={(e) => setAddingGroupName(e.target.value)}
                          placeholder="Group name..."
                          className="h-7 text-sm flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddGroup(level.id);
                            if (e.key === "Escape") setAddingGroupToLevel(null);
                          }}
                        />
                        <Button
                          size="sm"
                          className="h-7 gap-1 text-xs"
                          onClick={() => handleAddGroup(level.id)}
                          disabled={!addingGroupName.trim()}
                        >
                          <IconCheck className="size-3" />
                          Add
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => setAddingGroupToLevel(null)}
                        >
                          <IconX className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {levels.length === 0 && !showAddLevel && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
              <IconBlocks className="size-10 opacity-40" />
              <p className="text-sm">No levels defined yet.</p>
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
            </div>
          )}
        </div>
      </CardContent>
    </div>
  );
}
