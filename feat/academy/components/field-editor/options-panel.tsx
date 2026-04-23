import { OptionsPanelProps, OptionRowProps, SelectOption } from "./types"
import { useState, useRef } from "react"
import { useFieldTypes } from "./context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { IconX } from "@tabler/icons-react"

export function makeOptionId() {
  return `opt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function nextOptionLabel(existing: SelectOption[]): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  for (const letter of letters) {
    const candidate = `Option ${letter}`
    if (!existing.some((o) => o.label === candidate)) return candidate
  }
  return `Option ${existing.length + 1}`
}

export function OptionsPanel({
  options,
  onOptionsChange,
  fieldType,
  className,
}: OptionsPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState("")
  const pendingRef = useRef<Set<string>>(new Set())
  const fieldTypes = useFieldTypes()

  // Only render for types that declare options
  if (!fieldTypes[fieldType]?.hasOptions) return null

  const commitEdit = (id: string) => {
    const trimmed = editingValue.trim()
    if (!trimmed) {
      if (pendingRef.current.has(id)) {
        pendingRef.current.delete(id)
        onOptionsChange(options.filter((o) => o.id !== id))
      }
      setEditingId(null)
      return
    }
    pendingRef.current.delete(id)
    onOptionsChange(options.map((o) => (o.id === id ? { ...o, label: trimmed } : o)))
    setEditingId(null)
  }

  const commitAndSpawnNext = (id: string) => {
    const trimmed = editingValue.trim()
    pendingRef.current.delete(id)
    const savedOptions = trimmed
      ? options.map((o) => (o.id === id ? { ...o, label: trimmed } : o))
      : options.filter((o) => o.id !== id)
    const newId = makeOptionId()
    const newLabel = nextOptionLabel(savedOptions)
    pendingRef.current.add(newId)
    onOptionsChange([...savedOptions, { id: newId, label: newLabel }])
    setEditingId(newId)
    setEditingValue(newLabel)
  }

  const cancelEdit = (id: string) => {
    if (pendingRef.current.has(id)) {
      pendingRef.current.delete(id)
      onOptionsChange(options.filter((o) => o.id !== id))
    }
    setEditingId(null)
  }

  const addOption = () => {
    if (editingId) commitEdit(editingId)
    const newId = makeOptionId()
    const newLabel = nextOptionLabel(options)
    pendingRef.current.add(newId)
    onOptionsChange([...options, { id: newId, label: newLabel }])
    setEditingId(newId)
    setEditingValue(newLabel)
  }

  const removeOption = (id: string) => {
    pendingRef.current.delete(id)
    if (editingId === id) setEditingId(null)
    onOptionsChange(options.filter((o) => o.id !== id))
  }

  return (
    <div className={cn("border-t border-input/50 bg-muted/10", className)}>
      {options.map((opt) => {
        const isEditingThis = editingId === opt.id
        return (
          <OptionRow
            key={opt.id}
            option={opt}
            isEditing={isEditingThis}
            editingValue={editingValue}
            onEditingValueChange={setEditingValue}
            onStartEdit={() => {
              setEditingId(opt.id)
              setEditingValue(opt.label)
            }}
            onCommitEdit={() => commitEdit(opt.id)}
            onCommitAndNext={() => commitAndSpawnNext(opt.id)}
            onCancelEdit={() => cancelEdit(opt.id)}
            onRemove={() => removeOption(opt.id)}
          />
        )
      })}
      <OptionAddRow onAdd={addOption} />
    </div>
  )
}

// ── OptionRow: single option line ─────────────────────────────────────────────

export function OptionRow({
  option,
  isEditing,
  editingValue,
  onEditingValueChange,
  onStartEdit,
  onCommitEdit,
  onCommitAndNext,
  onCancelEdit,
  onRemove,
}: OptionRowProps) {
  return (
    <div className="flex items-center gap-4 px-3 pl-10 h-12 border-t border-input/30 first:border-t-0 group hover:bg-muted/20 transition-colors">
      <Bullet />
      {isEditing ? (
        <input
          className="flex-1 bg-transparent text-sm outline-none border-b border-primary/50 focus:border-primary py-0.5 transition-colors"
          value={editingValue}
          onChange={(e) => onEditingValueChange(e.target.value)}
          autoFocus
          onFocus={(e) => e.currentTarget.select()}
          onBlur={onCommitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              onCommitAndNext()
            }
            if (e.key === "Escape") {
              e.preventDefault()
              onCancelEdit()
            }
          }}
        />
      ) : (
        <div className="hover:border-b border-b-white/10 w-full h-6 flex items-center">
          <p className="flex-1 text-sm cursor-text" onClick={onStartEdit}>
            {option.label}
          </p>
        </div>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="size-7 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0"
        onClick={onRemove}
      >
        <IconX className="size-3.5" />
      </Button>
    </div>
  )
}

// ── OptionAddRow: bottom "Add option / Add Other" row ─────────────────────────

export function OptionAddRow({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex items-center gap-4 px-3 pl-10 h-12 border-t border-input/30 group hover:bg-muted/20 transition-colors">
      <Bullet />
      <Button
        variant="link"
        onClick={onAdd}
        className="text-muted-foreground hover:text-foreground justify-start px-0 font-normal"
      >
        Add option
      </Button>
      {/* <p className="text-sm text-muted-foreground -mx-1">or</p>
      <Button
        variant="link"
        onClick={onAdd}
        className="text-primary hover:text-primary/80 justify-start px-0 font-normal"
      >
        Add &quot;Other&quot;
      </Button> */}
    </div>
  )
}

export function Bullet() {
  return <div className="size-2 rounded-full bg-muted-foreground/60 shrink-0" />
}