"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  IconChevronLeft,
  IconChevronRight,
  IconCheck,
  IconSchool,
  IconBuilding,
  IconBlocks,
  IconUsers,
  IconForms,
  IconSparkles,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { ACADEMY_ICONS } from "@/lib/constants"
import { cn } from "@/lib/utils"

import { StepOneBasics } from "./step-one-basics"
import { StepTwoStructure } from "./step-two-structure"
import { StepThreeFields } from "./step-three-fields"
import { StepFourFinalize } from "./step-four-finalize"

// ── Constants ─────────────────────────────────────────────────────────────────

const DRAFT_STORAGE_KEY = "edra_academy_draft_v1"

type AcademyDraftLevel = {
  id: string
  name: string
  color?: string | null
  groups: Array<{ id: string; name: string }>
}

const DEFAULT_STRUCTURE_LEVELS: AcademyDraftLevel[] = [
  { id: "level-ref-1", name: "Level 1", color: "sky", groups: [] },
  {
    id: "level-ref-2",
    name: "Level 2",
    color: "violet",
    groups: [
      { id: "group-ref-a", name: "Section A" },
      { id: "group-ref-b", name: "Section B" },
    ],
  },
]

const STEPS = [
  { id: 1, title: "Basics" },
  { id: 2, title: "Structure" },
  { id: 3, title: "Fields" },
  { id: 4, title: "Finalize" },
]

// ── Creation progress step definitions ───────────────────────────────────────

const CREATION_STEPS = [
  { id: "academy",    label: "Creating your academy workspace",  icon: IconBuilding,  durationMs: 600  },
  { id: "structure",  label: "Building level structure",         icon: IconBlocks,    durationMs: 700  },
  { id: "groups",     label: "Setting up groups",                icon: IconUsers,     durationMs: 500  },
  { id: "fields",     label: "Configuring custom fields",        icon: IconForms,     durationMs: 600  },
  { id: "done",       label: "Finalizing everything",            icon: IconSparkles,  durationMs: 400  },
]

// ── AcademyData type ──────────────────────────────────────────────────────────

type AcademyData = {
  name: string
  slug: string
  icon: string
  subject: string
  levels: AcademyDraftLevel[]
  fields: Array<{
    id: string
    name: string
    field_type: "text" | "number" | "date" | "boolean" | "phone" | "select"
    is_required: boolean
    options?: string[]
  }>
}

const DEFAULT_ACADEMY_DATA: AcademyData = {
  name: "",
  slug: "",
  icon: "school",
  subject: "",
  levels: DEFAULT_STRUCTURE_LEVELS,
  fields: [],
}

// ── Creation progress overlay ─────────────────────────────────────────────────

function CreationOverlay({
  academyName,
  completedSteps,
  isDone,
}: {
  academyName: string
  completedSteps: Set<string>
  isDone: boolean
}) {
  return (
    <motion.div
      key="creating"
      initial={{ opacity: 0, filter: "blur(8px)", scale: 0.97 }}
      animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
      exit={{ opacity: 0, filter: "blur(8px)", scale: 0.97 }}
      transition={{ duration: 0.45 }}
      className="flex h-full w-full flex-col items-center justify-center gap-8"
    >
      {/* Header */}
      <div className="text-center space-y-1">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-2xl font-semibold tracking-tight"
        >
          {isDone ? "Your academy is ready!" : "Setting things up…"}
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-sm text-muted-foreground"
        >
          {isDone
            ? `Welcome to ${academyName || "your new academy"}`
            : "This only takes a moment"}
        </motion.p>
      </div>

      {/* Steps */}
      <div className="flex flex-col gap-3 w-72">
        {CREATION_STEPS.map((step, idx) => {
          const done = completedSteps.has(step.id)
          const active =
            !done &&
            !completedSteps.has(CREATION_STEPS[idx + 1]?.id ?? "") &&
            Array.from(completedSteps).length === idx

          const StepIcon = step.icon

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: done || active ? 1 : 0.3, x: 0 }}
              transition={{ delay: 0.1 + idx * 0.07, duration: 0.3 }}
              className="flex items-center gap-3"
            >
              {/* Icon / spinner / check */}
              <div className="relative size-8 shrink-0 flex items-center justify-center">
                <div
                  className={cn(
                    "size-8 rounded-full flex items-center justify-center transition-all duration-500",
                    done
                      ? "bg-primary text-primary-foreground"
                      : active
                      ? "bg-muted/50 text-foreground"
                      : "bg-muted/20 text-muted-foreground/40"
                  )}
                >
                  {done ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      <IconCheck className="size-4" />
                    </motion.div>
                  ) : (
                    <StepIcon className="size-4" />
                  )}
                </div>

                {/* Spinning ring for active step */}
                {active && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
                  />
                )}
              </div>

              <span
                className={cn(
                  "text-sm transition-colors duration-300",
                  done
                    ? "text-foreground font-medium"
                    : active
                    ? "text-foreground"
                    : "text-muted-foreground/40"
                )}
              >
                {step.label}
              </span>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ── Main Stepper ──────────────────────────────────────────────────────────────

export function CreateAcademyStepper() {
  const router = useRouter()
  const [[page, direction], setPage] = useState([1, 0])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [completedCreationSteps, setCompletedCreationSteps] = useState<Set<string>>(new Set())
  const [isDone, setIsDone] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const currentStep = page
  const structureAutoExpandConsumedRef = useRef(false)

  // ── Draft persistence ────────────────────────────────────────────────────

  const [academyData, setAcademyDataRaw] = useState<AcademyData>(DEFAULT_ACADEMY_DATA)

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as AcademyData
        setAcademyDataRaw(parsed)
      }
    } catch {
      // Corrupted draft — ignore
    }
  }, [])

  // Save to localStorage whenever data changes
  const setAcademyData = (next: AcademyData) => {
    setAcademyDataRaw(next)
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Storage unavailable — non-critical
    }
  }

  // Prefetch dashboard early so the redirect is instant
  useEffect(() => {
    router.prefetch("/dashboard")
  }, [router])

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  // ── Navigation ───────────────────────────────────────────────────────────

  const nextStep = () => setPage((prev) => [Math.min(prev[0] + 1, STEPS.length), 1])
  const prevStep = () => setPage((prev) => [Math.max(prev[0] - 1, 1), -1])

  const isCurrentStepValid = () => {
    if (currentStep === 1) return academyData.name.trim().length > 0
    if (currentStep === 2)
      return academyData.levels.length > 0 && academyData.levels.every((l) => l.name.trim().length > 0)
    return true
  }

  // ── Creation ─────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    setSubmitError(null)
    setIsCreating(true) // triggers overlay via AnimatePresence
    setCompletedCreationSteps(new Set())
    setIsDone(false)

    // Animate steps in parallel while waiting for the API
    const stepTimings = CREATION_STEPS.reduce<number[]>((acc, step) => {
      const prev = acc[acc.length - 1] ?? 0
      acc.push(prev + step.durationMs)
      return acc
    }, [])

    const stepTimers = CREATION_STEPS.map((step, i) =>
      setTimeout(() => {
        setCompletedCreationSteps((prev) => new Set([...prev, step.id]))
      }, stepTimings[i])
    )

    const totalAnimationMs = stepTimings[stepTimings.length - 1] + 300

    try {
      const [res] = await Promise.all([
        fetch("/api/academy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(academyData),
        }),
        // Ensure the progress animation plays for at least the total animation time
        new Promise((r) => setTimeout(r, totalAnimationMs)),
      ])

      const json = await res.json()

      if (!res.ok) {
        // Cancel step timers
        stepTimers.forEach(clearTimeout)
        setIsCreating(false)
        setSubmitError(json.error || "Something went wrong. Please try again.")
        return
      }

      // Show "done" state briefly, then redirect
      setIsDone(true)

      // Clear the draft
      try { localStorage.removeItem(DRAFT_STORAGE_KEY) } catch { /* ignore */ }

      // Brief "done" display, then seamless navigation with cross-page fade
      await new Promise((r) => setTimeout(r, 900))

      const destination = json.redirectTo || (json.slug ? `/${json.slug}/dashboard` : "/dashboard")
      try { localStorage.setItem("edra_last_academy_id", json.id) } catch { /* ignore */ }
      
      if (typeof document !== "undefined" && "startViewTransition" in document) {
        (document as any).startViewTransition(() => router.push(destination))
      } else {
        router.push(destination)
      }

    } catch {
      stepTimers.forEach(clearTimeout)
      setIsCreating(false)
      setSubmitError("Network error. Please check your connection and try again.")
    }
  }

  // ── Variants ─────────────────────────────────────────────────────────────

  const stepVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 30 : -30,
      opacity: 0,
      position: "absolute" as const,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      position: "relative" as const,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 30 : -30,
      opacity: 0,
      position: "absolute" as const,
    }),
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AnimatePresence mode="wait">

      {/* ── Initial loading screen ── */}
      {loading ? (
        <motion.div
          key="loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(4px)", scale: 0.98 }}
          transition={{ duration: 0.4 }}
          className="flex h-full w-full flex-col items-center justify-center"
        >
          <div className="flex items-center justify-center animate-pulse text-muted-foreground font-medium text-2xl">
            Getting your academy setup ready...
          </div>
        </motion.div>

      ) : isCreating ? (
        /* ── Creation progress screen ── */
        <CreationOverlay
          academyName={academyData.name}
          completedSteps={completedCreationSteps}
          isDone={isDone}
        />

      ) : (
        /* ── Wizard UI ── */
        <motion.div
          key="content"
          initial={{ opacity: 0, filter: "blur(4px)", scale: 0.98 }}
          animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
          exit={{ opacity: 0, filter: "blur(4px)", scale: 0.98 }}
          transition={{ duration: 0.45 }}
          className="min-w-xl mx-auto flex flex-col justify-center items-center h-full my-auto"
        >

          {/* Step 2+ Academy Header Banner */}
          <div
            className={cn(
              "flex items-center gap-3 justify-center transition-all duration-500 ease-in-out overflow-hidden",
              currentStep >= 2
                ? "max-h-20 opacity-100 mb-0 -translate-y-10"
                : "max-h-0 opacity-0 mb-0 -translate-y-8 pointer-events-none"
            )}
          >
            <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md shrink-0">
              {(() => {
                const IconComponent = ACADEMY_ICONS.find((i) => i.id === academyData.icon)?.icon || IconSchool
                return <IconComponent className="size-4.5" />
              })()}
            </div>
            <h1 className="text-xl font-semibold tracking-tight truncate">{academyData.name || "Academy Name"}</h1>
          </div>

          {/* Progress Indicator */}
          <div className="mb-16 relative flex items-center w-xl justify-between">
            {STEPS.map((step) => {
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id
              return (
                <div key={step.id} className="flex flex-col items-center relative z-10">
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-semibold transition-colors duration-300",
                      isActive || isCompleted
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted bg-background text-muted-foreground"
                    )}
                  >
                    {isCompleted ? <IconCheck className="size-5" /> : step.id}
                  </div>
                  <span
                    className={cn(
                      "absolute top-12 text-sm whitespace-nowrap font-medium transition-colors",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </span>
                </div>
              )
            })}
            <div className="absolute top-5 left-0 right-0 h-[2px] bg-muted -z-10" />
            <div
              className="absolute top-5 left-0 h-[2px] bg-primary -z-10 transition-all duration-500 ease-in-out"
              style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
            />
          </div>

          {/* Dynamic Step Content */}
          <motion.div
            layout
            className="min-w-xl rounded-xl border bg-card text-card-foreground shadow p-2 py-6 flex flex-col relative overflow-y-auto min-h-[500px] max-h-[650px]"
          >
            <div className="relative h-full">
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "tween", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 },
                    layout: { type: "spring", stiffness: 300, damping: 30 },
                  }}
                  className="w-full h-full"
                >
                  {currentStep === 1 && (
                    <StepOneBasics
                      initialData={{ name: academyData.name, slug: academyData.slug, icon: academyData.icon, subject: academyData.subject }}
                      onUpdate={(data) => setAcademyData({ ...academyData, ...data })}
                    />
                  )}
                  {currentStep === 2 && (
                    <StepTwoStructure
                      initialData={{ levels: academyData.levels }}
                      onUpdate={(data) => setAcademyData({ ...academyData, ...data })}
                      autoExpandOnMount={!structureAutoExpandConsumedRef.current}
                      onAutoExpandConsumed={() => { structureAutoExpandConsumedRef.current = true }}
                    />
                  )}
                  {currentStep === 3 && (
                    <StepThreeFields
                      initialData={{ fields: academyData.fields }}
                      onUpdate={(data) => setAcademyData({ ...academyData, ...data })}
                    />
                  )}
                  {currentStep === 4 && (
                    <StepFourFinalize academyData={academyData} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Stepper Navigation Footer */}
            <motion.div
              layout
              className="flex items-center justify-between px-4 mt-auto pt-4 relative z-10 w-full"
              transition={{ layout: { type: "spring", stiffness: 300, damping: 30 } }}
            >
              <Button
                variant="outline"
                onClick={currentStep === 1 ? () => router.push("/") : prevStep}
              >
                <IconChevronLeft className="size-4" />
                {currentStep === 1 ? "Home" : "Back"}
              </Button>

              {currentStep < STEPS.length ? (
                <Button onClick={nextStep} disabled={!isCurrentStepValid()} className="hover:bg-primary/80">
                  Next step
                  <IconChevronRight className="size-4" />
                </Button>
              ) : (
                <div className="flex flex-col items-end gap-1.5">
                  {submitError && (
                    <p className="text-xs text-destructive max-w-[260px] text-right">{submitError}</p>
                  )}
                  <Button onClick={handleCreate}>
                    Create Academy
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
