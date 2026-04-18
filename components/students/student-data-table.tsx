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
import type { StudentWithLevelRating } from "@/lib/types"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"

// ─── Types ────────────────────────────────────────────────────

export interface StudentDataTableProps<TRow extends StudentWithLevelRating = StudentWithLevelRating> {
  data: TRow[]
  columns: ColumnDef<TRow>[]
  searchable?: boolean
  searchPlaceholder?: string
  searchFn?: (student: TRow, query: string) => boolean
  paginated?: boolean
  defaultPageSize?: number
  selectable?: boolean
  columnVisibility?: VisibilityState
  onColumnVisibilityChange?: (vis: VisibilityState) => void
  columnOrder?: ColumnOrderState
  onColumnOrderChange?: (order: ColumnOrderState) => void
  rowSelection?: RowSelectionState
  onRowSelectionChange?: (selection: RowSelectionState) => void
  emptyMessage?: string
  toolbar?: React.ReactNode
  searchRight?: React.ReactNode
}

// ─── Component ───────────────────────────────────────────────

export function StudentDataTable<TRow extends StudentWithLevelRating = StudentWithLevelRating>({
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
}: StudentDataTableProps<TRow>) {
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [sorting, setSorting] = useState<SortingState>([])
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(defaultPageSize)

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const handleSearchChange = useCallback((v: string) => {
    setSearchQuery(v)
    setPageIndex(0)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => setDebouncedSearchQuery(v), 300)
  }, [])

  const [internalVisibility, setInternalVisibility] = useState<VisibilityState>({})
  const [internalOrder, setInternalOrder] = useState<ColumnOrderState>([])
  const [internalSelection, setInternalSelection] = useState<RowSelectionState>({})

  const COLUMN_WIDTHS_KEY = "edra-students-column-widths"
  const [internalColumnSizing, setInternalColumnSizing] = useState<ColumnSizingState>(() => {
    if (typeof window === "undefined") return {}
    try {
      const saved = localStorage.getItem(COLUMN_WIDTHS_KEY)
      return saved ? JSON.parse(saved) : {}
    } catch { return {} }
  })

  const visibility = externalVisibility ?? internalVisibility
  const setVisibility = onColumnVisibilityChange ?? setInternalVisibility
  const order = externalOrder ?? internalOrder
  const setOrder = onColumnOrderChange ?? setInternalOrder
  const selection = externalSelection ?? internalSelection
  const setSelection = onRowSelectionChange ?? setInternalSelection

  useEffect(() => {
    if (typeof window !== "undefined" && Object.keys(internalColumnSizing).length > 0) {
      localStorage.setItem(COLUMN_WIDTHS_KEY, JSON.stringify(internalColumnSizing))
    }
  }, [internalColumnSizing])

  const filteredData = useMemo(() => {
    if (!debouncedSearchQuery || debouncedSearchQuery.length < 2 || !searchFn) return data
    return data.filter((s) => searchFn(s, debouncedSearchQuery))
  }, [data, debouncedSearchQuery, searchFn])

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

  return (
    <div className="space-y-3">
      {searchable && (
        <div className="flex flex-row items-center gap-3">
          <InputGroup className="w-full h-10">
            <InputGroupInput
              placeholder={searchPlaceholder}
              value={searchQuery}
              className="text-lg"
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            <InputGroupAddon align="inline-end">
              <Button variant="ghost" size="icon-xs" onClick={() => handleSearchChange("")}>
                <IconX className="size-4" />
              </Button>
            </InputGroupAddon>
            <InputGroupAddon align="inline-start">
              <IconSearch className="size-4" />
            </InputGroupAddon>
          </InputGroup>
          {searchRight}
        </div>
      )}

      {toolbar}

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
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                    <TableCell key={cell.id} className="py-3 align-middle">
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

      {paginated && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Rows per page</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(v) => { setPageSize(parseInt(v)); setPageIndex(0) }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((size) => (
                  <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground ml-2">
              {totalCount} result{totalCount !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-2">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
            </span>
            <Button
              variant="outline" size="sm" className="h-8 w-8 p-0"
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              disabled={!table.getCanPreviousPage()}
            >
              <IconChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline" size="sm" className="h-8 w-8 p-0"
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
