"use client"

import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import {
  type ColumnDef,
  type ColumnOrderState,
  type ColumnSizingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  type VisibilityState,
  useReactTable,
  type RowSelectionState,
} from "@tanstack/react-table"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
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
  IconChevronLeft,
  IconChevronRight,
  IconSearch,
  IconX,
} from "@tabler/icons-react"

import type { SessionWithSchedule } from "@/lib/types"

export interface SessionDataTableProps {
  data: SessionWithSchedule[]
  columns: ColumnDef<SessionWithSchedule>[]
  searchable?: boolean
  searchPlaceholder?: string
  searchFn?: (session: SessionWithSchedule, query: string) => boolean
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
  onRowClick?: (session: SessionWithSchedule) => void
}

export function SessionDataTable({
  data,
  columns,
  searchable = false,
  searchPlaceholder = "Search sessions...",
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
  emptyMessage = "No sessions found",
  toolbar,
  searchRight,
  onRowClick,
}: SessionDataTableProps) {
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
    searchTimeoutRef.current = setTimeout(() => setDebouncedSearchQuery(v), 250)
  }, [])

  const [internalVisibility, setInternalVisibility] = useState<VisibilityState>({})
  const [internalOrder, setInternalOrder] = useState<ColumnOrderState>([])
  const [internalSelection, setInternalSelection] = useState<RowSelectionState>({})

  const COLUMN_WIDTHS_KEY = "edra-sessions-column-widths"
  const [internalColumnSizing, setInternalColumnSizing] = useState<ColumnSizingState>(() => {
    if (typeof window === "undefined") return {}
    try {
      const saved = localStorage.getItem(COLUMN_WIDTHS_KEY)
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(COLUMN_WIDTHS_KEY, JSON.stringify(internalColumnSizing))
    } catch {
      // ignore
    }
  }, [internalColumnSizing])

  const visibility = externalVisibility ?? internalVisibility
  const setVisibility = onColumnVisibilityChange ?? setInternalVisibility
  const order = externalOrder ?? internalOrder
  const setOrder = onColumnOrderChange ?? setInternalOrder
  const selection = externalSelection ?? internalSelection
  const setSelection = onRowSelectionChange ?? setInternalSelection

  const filteredData = useMemo(() => {
    if (!searchable || !debouncedSearchQuery.trim()) return data
    const q = debouncedSearchQuery.trim()
    if (searchFn) return data.filter((s) => searchFn(s, q))

    const lower = q.toLowerCase()
    return data.filter((s) => {
      const scheduleName = s.schedule?.name?.toLowerCase() || ""
      const sessionName = s.name?.toLowerCase() || ""
      const date = s.session_date ? format(new Date(s.session_date), "yyyy-MM-dd") : ""
      return scheduleName.includes(lower) || sessionName.includes(lower) || date.includes(lower)
    })
  }, [data, searchable, debouncedSearchQuery, searchFn])

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnVisibility: visibility,
      columnOrder: order,
      rowSelection: selection,
      pagination: { pageIndex, pageSize },
      columnSizing: internalColumnSizing,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: (updater) => {
      const next = typeof updater === "function" ? (updater as (old: VisibilityState) => VisibilityState)(visibility) : updater
      setVisibility(next)
    },
    onColumnOrderChange: (updater) => {
      const next = typeof updater === "function" ? (updater as (old: ColumnOrderState) => ColumnOrderState)(order) : updater
      setOrder(next)
    },
    onRowSelectionChange: (updater) => {
      const next = typeof updater === "function" ? (updater as (old: RowSelectionState) => RowSelectionState)(selection) : updater
      setSelection(next)
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater({ pageIndex, pageSize }) : updater
      setPageIndex(next.pageIndex)
      setPageSize(next.pageSize)
    },
    onColumnSizingChange: setInternalColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: _selectable,
    columnResizeMode: "onChange",
  })

  const rows = paginated ? table.getRowModel().rows : table.getRowModel().rows
  const pageCount = table.getPageCount()

  return (
    <div className="w-full space-y-3">
      {(searchable || toolbar || searchRight) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 flex items-center gap-2">
            {searchable && (
              <InputGroup className="max-w-xl">
                <InputGroupAddon>
                  <IconSearch className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="px-2 text-muted-foreground hover:text-foreground"
                    onClick={() => handleSearchChange("")}
                  >
                    <IconX className="size-4" />
                  </button>
                )}
              </InputGroup>
            )}
            {toolbar}
          </div>
          <div className="flex items-center justify-end gap-2">
            {searchRight}
          </div>
        </div>
      )}

      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="relative"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanResize() && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none bg-transparent hover:bg-muted/60"
                      />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  className={onRowClick ? "cursor-pointer" : undefined}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {paginated && pageCount > 1 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Page {pageIndex + 1} of {pageCount}
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v))
                setPageIndex(0)
              }}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 50].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <IconChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.nextPage()}
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

