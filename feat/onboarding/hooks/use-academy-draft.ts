"use client"

import { useCallback, useEffect, useState } from "react"

import { DEFAULT_ACADEMY_DRAFT, DRAFT_STORAGE_KEY } from "../context"
import type { AcademyCreateDraft } from "../types"

export function useAcademyDraft() {
  const [draft, setDraftState] = useState<AcademyCreateDraft>(DEFAULT_ACADEMY_DRAFT)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY)
      if (savedDraft) {
        const parsedDraft = JSON.parse(savedDraft) as AcademyCreateDraft
        setDraftState(parsedDraft)
      }
    } catch {
      // Ignore unreadable drafts and fall back to defaults.
    } finally {
      setIsHydrated(true)
    }
  }, [])

  const setDraft = useCallback((nextDraft: AcademyCreateDraft) => {
    setDraftState(nextDraft)

    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(nextDraft))
    } catch {
      // Storage is a convenience only.
    }
  }, [])

  const updateDraft = useCallback(
    (nextPartial: Partial<AcademyCreateDraft>) => {
      setDraft({
        ...draft,
        ...nextPartial,
      })
    },
    [draft, setDraft]
  )

  const clearDraft = useCallback(() => {
    setDraftState(DEFAULT_ACADEMY_DRAFT)

    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY)
    } catch {
      // Storage is a convenience only.
    }
  }, [])

  return {
    draft,
    isHydrated,
    setDraft,
    updateDraft,
    clearDraft,
  }
}
