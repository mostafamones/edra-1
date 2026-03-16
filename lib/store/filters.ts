import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { DateRange } from 'react-day-picker'

// ─────────────────────────────────────────────────────────────────────────────
// Student Filters Store
// ─────────────────────────────────────────────────────────────────────────────

export interface StudentFiltersState {
  levelFilter: string
  branchFilter: string
  scheduleFilter: string
  showArchived: boolean
  // Custom field filters - can be strings or date ranges
  customFieldFilters: Record<string, string | DateRange | undefined>
  setLevelFilter: (level: string) => void
  setBranchFilter: (branch: string) => void
  setScheduleFilter: (schedule: string) => void
  setShowArchived: (show: boolean) => void
  setCustomFieldFilter: (fieldId: string, value: string | DateRange | undefined) => void
  resetFilters: () => void
}

export const useStudentFilters = create<StudentFiltersState>()(
  persist(
    (set) => ({
      levelFilter: 'all',
      branchFilter: 'all',
      scheduleFilter: 'all',
      showArchived: false,
      customFieldFilters: {},
      setLevelFilter: (level) => set({ levelFilter: level }),
      setBranchFilter: (branch) => set({ branchFilter: branch }),
      setScheduleFilter: (schedule) => set({ scheduleFilter: schedule }),
      setShowArchived: (show) => set({ showArchived: show }),
      setCustomFieldFilter: (fieldId, value) =>
        set((state) => ({
          customFieldFilters: { ...state.customFieldFilters, [fieldId]: value }
        })),
      resetFilters: () => set({
        levelFilter: 'all',
        branchFilter: 'all',
        scheduleFilter: 'all',
        showArchived: false,
        customFieldFilters: {},
      }),
    }),
    {
      name: 'edra-student-filters',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)

// ─────────────────────────────────────────────────────────────────────────────
// Session Filters Store
// ─────────────────────────────────────────────────────────────────────────────

export interface SessionFiltersState {
  levelFilter: string
  branchFilter: string
  scheduleFilter: string
  dateRange: DateRange | undefined
  searchQuery: string
  showArchived: boolean
  setLevelFilter: (level: string) => void
  setBranchFilter: (branch: string) => void
  setScheduleFilter: (schedule: string) => void
  setDateRange: (dateRange: DateRange | undefined) => void
  setSearchQuery: (query: string) => void
  setShowArchived: (show: boolean) => void
  resetFilters: () => void
}

export const useSessionFilters = create<SessionFiltersState>()(
  persist(
    (set) => ({
      levelFilter: 'all',
      branchFilter: 'all',
      scheduleFilter: 'all',
      dateRange: undefined,
      searchQuery: '',
      showArchived: false,
      setLevelFilter: (level) => set({ levelFilter: level }),
      setBranchFilter: (branch) => set({ branchFilter: branch }),
      setScheduleFilter: (schedule) => set({ scheduleFilter: schedule }),
      setDateRange: (dateRange) => set({ dateRange }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setShowArchived: (show) => set({ showArchived: show }),
      resetFilters: () => set({
        levelFilter: 'all',
        branchFilter: 'all',
        scheduleFilter: 'all',
        dateRange: undefined,
        searchQuery: '',
        showArchived: false,
      }),
    }),
    {
      name: 'edra-session-filters',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
