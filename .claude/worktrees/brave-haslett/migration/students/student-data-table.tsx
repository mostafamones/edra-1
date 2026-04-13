"use client"

import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import {
  ColumnDef,
  ColumnOrderState,
  ColumnSizingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  VisibilityState,
  useReactTable,
  RowSelectionState,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  IconSearch,
  IconUsers,
  IconChevronLeft,
  IconChevronRight,
  IconX,
} from "@tabler/icons-react"
import type { StudentWithLevelRating } from "@/lib"
import { InputGroup, InputGroupAddon, InputGroupInput } from "../ui/input-group"

// ─── Types ────────────────────────────────────────────────────

export interface StudentDataTableProps {
  /** Student data to display */
  data: StudentWithLevelRating[]
  /** Column definitions */
  columns: ColumnDef<StudentWithLevelRating>[]

  // ── Optional features ──────────────────────────────────────

  /** Show search bar (searches using the provided searchFn) */
  searchable?: boolean
  /** Search placeholder text */
  searchPlaceholder?: string
  /** Custom search function — return true to INCLUDE the row */
  searchFn?: (student: StudentWithLevelRating, query: string) => boolean
  /** Show pagination controls */
  paginated?: boolean
  /** Initial page size (default 20) */
  defaultPageSize?: number
  /** Enable row selection checkboxes (columns must include select column) */
  selectable?: boolean
  /** Column visibility state (controlled externally) */
  columnVisibility?: VisibilityState
  /** Column visibility change handler */
  onColumnVisibilityChange?: (vis: VisibilityState) => void
  /** Column order state (controlled externally) */
  columnOrder?: ColumnOrderState
  /** Column order change handler */
  onColumnOrderChange?: (order: ColumnOrderState) => void
  /** Row selection state (controlled externally) */
  rowSelection?: RowSelectionState
  /** Row selection change handler */
  onRowSelectionChange?: (selection: RowSelectionState) => void
  /** Custom empty state message */
  emptyMessage?: string
  /** Content rendered between the search bar and table (e.g., filter chips, bulk bar) */
  toolbar?: React.ReactNode
  /** Content rendered to the right of the search bar */
  searchRight?: React.ReactNode
}

// ─── Component ───────────────────────────────────────────────

export function StudentDataTable({
  data,
  columns,
  searchable = false,
  searchPlaceholder = "Search students...",
  searchFn,
  paginated = false,
  defaultPageSize = 20,
  selectable: _selectable = false,
  columnVisibility: externalVisibility,
  onColumnVisibilityChange,
  columnOrder: externalOrder,
  onColumnOrderChange,
  rowSelection: externalSelection,
  onRowSelectionChange,
  emptyMessage = "No students found",
  toolbar,
  searchRight,
}: StudentDataTableProps) {
  // ── Internal state ────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [sorting, setSorting] = useState<SortingState>([])
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(defaultPageSize)

  // Debounce search query to avoid excessive filtering
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const handleSearchChange = useCallback((v: string) => {
    setSearchQuery(v)
    setPageIndex(0) // Reset to first page when searching
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(v)
    }, 300) // 300ms debounce
  }, [])

  // Internal fallbacks for optional controlled state
  const [internalVisibility, setInternalVisibility] = useState<VisibilityState>({})
  const [internalOrder, setInternalOrder] = useState<ColumnOrderState>([])
  const [internalSelection, setInternalSelection] = useState<RowSelectionState>({})

  // Store column widths in localStorage
  const COLUMN_WIDTHS_KEY = "edra-students-column-widths"

  const [internalColumnSizing, setInternalColumnSizing] = useState<ColumnSizingState>(() => {
    if (typeof window === "undefined") return {}
    try {
      const saved = localStorage.getItem(COLUMN_WIDTHS_KEY)
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  const visibility = externalVisibility ?? internalVisibility
  const setVisibility = onColumnVisibilityChange ?? setInternalVisibility
  const order = externalOrder ?? internalOrder
  const setOrder = onColumnOrderChange ?? setInternalOrder
  const selection = externalSelection ?? internalSelection
  const setSelection = onRowSelectionChange ?? setInternalSelection
  const columnSizing = externalVisibility !== undefined ? internalColumnSizing : {} // Only use internal when not externally controlled
  const setColumnSizing = onColumnVisibilityChange !== undefined ? setInternalColumnSizing : (() => { }) // Use noop when external

  // Store column widths in localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && Object.keys(internalColumnSizing).length > 0) {
      localStorage.setItem(COLUMN_WIDTHS_KEY, JSON.stringify(internalColumnSizing))
    }
  }, [internalColumnSizing])

  // ── Filter data ───────────────────────────────────────────
  // Only search if query has at least 2 characters to avoid performance issues
  const filteredData = useMemo(() => {
    if (!debouncedSearchQuery || debouncedSearchQuery.length < 2 || !searchFn) {
      return data
    }
    return data.filter((s) => searchFn(s, debouncedSearchQuery))
  }, [data, debouncedSearchQuery, searchFn])

  // ── Table instance ────────────────────────────────────────
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: "onChange",
    columnResizeDirection: "ltr",
    ...(paginated ? { getPaginationRowModel: getPaginationRowModel() } : {}),
    onSortingChange: setSorting,
    onRowSelectionChange: (updater) => {
      const next = typeof updater === "function" ? updater(selection) : updater
      setSelection(next)
    },
    onColumnVisibilityChange: (updater) => {
      const next = typeof updater === "function" ? updater(visibility) : updater
      setVisibility(next)
    },
    onColumnOrderChange: (updater) => {
      const next = typeof updater === "function" ? updater(order) : updater
      setOrder(next)
    },
    onColumnSizingChange: (updater) => {
      const next = typeof updater === "function" ? updater(internalColumnSizing) : updater
      setInternalColumnSizing(next)
    },
    state: {
      sorting,
      rowSelection: selection,
      columnVisibility: visibility,
      columnOrder: order,
      columnSizing: internalColumnSizing,
      ...(paginated ? { pagination: { pageIndex, pageSize } } : {}),
    },
  })

  const totalCount = filteredData.length

  // ─── Render ───────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* Search bar */}
      {searchable && (
        <div className="flex flex-row items-center gap-3">
          <InputGroup className="w-full h-10">
            <InputGroupInput
              placeholder={searchPlaceholder}
              value={searchQuery}
              className="text-lg"
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            <InputGroupAddon align={"inline-end"}>
              <Button variant={"ghost"} size={"icon-xs"} onClick={() => handleSearchChange("")}>
                <IconX className="size-4" />
              </Button>
            </InputGroupAddon>
            <InputGroupAddon align={"inline-start"}>
              <IconSearch className="size-4" />
            </InputGroupAddon>
          </InputGroup>
          {searchRight}
        </div>
      )}

      {/* Optional toolbar (filters, chips, bulk bar, etc.) */}
      {toolbar}

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-b bg-muted/30">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    className="h-12 text-left align-middle text-sm font-[Outfit] font-medium text-muted-foreground uppercase relative"
                    key={header.id}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="data-[state=selected]:bg-primary/5 transition-colors cursor-pointer hover:bg-muted/40"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="py-3 align-middle"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <IconUsers className="size-10 opacity-20" />
                    <p className="text-sm">{emptyMessage}</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {paginated && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Rows per page</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(v) => {
                setPageSize(parseInt(v))
                setPageIndex(0)
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground ml-2">
              {totalCount} result{totalCount !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-2">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount() || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              disabled={!table.getCanPreviousPage()}
            >
              <IconChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setPageIndex((p) => p + 1)}
              disabled={!table.getCanNextPage()}
            >
              <IconChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
