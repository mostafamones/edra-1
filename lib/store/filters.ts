import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { DateRange } from 'react-day-picker'

// ─────────────────────────────────────────────────────────────────────────────
// Session Filters Store
// ─────────────────────────────────────────────────────────────────────────────

export interface SessionFiltersState {
  levelFilter: string
  groupFilter: string
  scheduleFilter: string
  dateRange: DateRange | undefined
  searchQuery: string
  showArchived: boolean
  setLevelFilter: (level: string) => void
  setGroupFilter: (group: string) => void
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
      groupFilter: 'all',
      scheduleFilter: 'all',
      dateRange: undefined,
      searchQuery: '',
      showArchived: false,
      setLevelFilter: (level) => set({ levelFilter: level }),
      setGroupFilter: (group) => set({ groupFilter: group }),
      setScheduleFilter: (schedule) => set({ scheduleFilter: schedule }),
      setDateRange: (dateRange) => set({ dateRange }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setShowArchived: (show) => set({ showArchived: show }),
      resetFilters: () => set({
        levelFilter: 'all',
        groupFilter: 'all',
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
