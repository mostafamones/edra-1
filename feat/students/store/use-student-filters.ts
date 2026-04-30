"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export interface StudentFiltersState {
  levelFilter: string
  groupFilter: string
  scheduleFilter: string
  showArchived: boolean
  setLevelFilter: (level: string) => void
  setGroupFilter: (group: string) => void
  setScheduleFilter: (schedule: string) => void
  setShowArchived: (show: boolean) => void
  resetFilters: () => void
}

export const useStudentFilters = create<StudentFiltersState>()(
  persist(
    (set) => ({
      levelFilter: "all",
      groupFilter: "all",
      scheduleFilter: "all",
      showArchived: false,
      setLevelFilter: (level) => set({ levelFilter: level }),
      setGroupFilter: (group) => set({ groupFilter: group }),
      setScheduleFilter: (schedule) => set({ scheduleFilter: schedule }),
      setShowArchived: (show) => set({ showArchived: show }),
      resetFilters: () =>
        set({
          levelFilter: "all",
          groupFilter: "all",
          scheduleFilter: "all",
          showArchived: false,
        }),
    }),
    {
      name: "edra-student-filters",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)

