"use client"

import { useEffect, useRef, useState } from "react"

import {
  IconChevronLeft,
  IconChevronRight,
  IconSchool,
  IconArrowRight,
  IconArrowLeft,
} from "@tabler/icons-react"
import { AnimatePresence, motion } from "framer-motion"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { ACADEMY_ICONS } from "@/lib/constants"
import { cn } from "@/lib/utils"

import { WIZARD_STEPS, CREATION_STEPS } from "../context"
import { useAcademyDraft } from "../hooks/use-academy-draft"
import { BasicsStep } from "../steps/basics"
import { FieldsStep } from "../steps/fields"
import { FinalizeStep } from "../steps/finalize"
import { StructureStep } from "../steps/structure"
import { CreationProgressOverlay } from "./creation-progress-overlay"
import { ProgressIndicator } from "./progress-indicator"
import { IconHolder } from "./icon-holder"

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

export function CreateAcademyWizard() {
  const router = useRouter()
  const [[page, direction], setPage] = useState([1, 0])
  const [isCreating, setIsCreating] = useState(false)
  const [completedCreationSteps, setCompletedCreationSteps] = useState<Set<string>>(new Set())
  const [isDone, setIsDone] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const structureAutoExpandConsumedRef = useRef(false)

  const { clearDraft, draft, isHydrated, setDraft } = useAcademyDraft()

  const currentStep = page

  useEffect(() => {
    router.prefetch("/dashboard")
  }, [router])

  const nextStep = () => {
    setPage((previous) => [Math.min(previous[0] + 1, WIZARD_STEPS.length), 1])
  }

  const prevStep = () => {
    setPage((previous) => [Math.max(previous[0] - 1, 1), -1])
  }

  const isCurrentStepValid = () => {
    if (currentStep === 1) return draft.name.trim().length > 0
    if (currentStep === 2) {
      return draft.levels.length > 0 && draft.levels.every((level) => level.name.trim().length > 0)
    }
    return true
  }

  const handleCreate = async () => {
    setSubmitError(null)
    setIsCreating(true)
    setCompletedCreationSteps(new Set())
    setIsDone(false)

    const stepTimings = CREATION_STEPS.reduce<number[]>((timings, step) => {
      const previousDuration = timings[timings.length - 1] ?? 0
      timings.push(previousDuration + step.durationMs)
      return timings
    }, [])

    const stepTimers = CREATION_STEPS.map((step, index) =>
      window.setTimeout(() => {
        setCompletedCreationSteps((previous) => new Set([...previous, step.id]))
      }, stepTimings[index])
    )

    const totalAnimationMs = stepTimings[stepTimings.length - 1] + 300

    try {
      const [response] = await Promise.all([
        fetch("/api/academy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        }),
        new Promise((resolve) => setTimeout(resolve, totalAnimationMs)),
      ])

      const json = await response.json()

      if (!response.ok) {
        stepTimers.forEach(clearTimeout)
        setIsCreating(false)
        setSubmitError(json.error || "Something went wrong. Please try again.")
        return
      }

      setIsDone(true)
      await new Promise((resolve) => setTimeout(resolve, 900))

      const destination =
        json.redirectTo || (json.slug ? `/${json.slug}/dashboard` : "/dashboard")

      try {
        localStorage.setItem("edra_last_academy_id", json.id)
      } catch {
        // Convenience only.
      }

      clearDraft()

      if (typeof document !== "undefined" && "startViewTransition" in document) {
        ;(document as Document & {
          startViewTransition?: (callback: () => void) => void
        }).startViewTransition?.(() => router.push(destination))
      } else {
        router.push(destination)
      }
    } catch {
      stepTimers.forEach(clearTimeout)
      setIsCreating(false)
      setSubmitError("Network error. Please check your connection and try again.")
    }
  }

  if (!isHydrated) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="animate-pulse text-2xl font-medium text-muted-foreground">
          Loading your academy draft...
        </div>
      </div>
    )
  }

  return (
    <>
    <AnimatePresence mode="wait">
      {isCreating ? (
        <CreationProgressOverlay
          academyName={draft.name}
          completedSteps={completedCreationSteps}
          isDone={isDone}
        />
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, filter: "blur(4px)", scale: 0.98 }}
          animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
          exit={{ opacity: 0, filter: "blur(4px)", scale: 0.98 }}
          transition={{ duration: 0.45 }}
          className="mx-auto my-auto flex h-full min-w-xl flex-col items-center justify-center"
        >
          <div
            className={cn(
              "flex items-center justify-center gap-2 overflow-hidden transition-all duration-500 ease-in-out",
              currentStep >= 2
                ? "mb-0 max-h-20 -translate-y-10 opacity-100"
                : "mb-0 max-h-0 -translate-y-8 opacity-0 pointer-events-none"
            )}
          >
            <IconHolder selectedIconId={draft.icon ?? ""} size="xl" />
            <h1 className="truncate text-xl font-semibold tracking-tight">
              {draft.name || "Academy Name"}
            </h1>
          </div>


          <motion.div
            layout
            className="relative flex min-h-[475px] min-w-xl flex-col overflow-y-auto rounded-xl bg-card/30 p-2 py-6 text-card-foreground shadow max-h-[650px]"
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
                  className="h-full w-full"
                >
                  {currentStep === 1 && (
                    <BasicsStep
                      initialData={{
                        name: draft.name,
                        slug: draft.slug,
                        icon: draft.icon,
                        subject: draft.subject,
                      }}
                      onUpdate={(data) => setDraft({ ...draft, ...data })}
                    />
                  )}

                  {currentStep === 2 && (
                    <StructureStep
                      initialData={{ levels: draft.levels }}
                      onUpdate={(data) => setDraft({ ...draft, ...data })}
                      autoExpandOnMount={!structureAutoExpandConsumedRef.current}
                      onAutoExpandConsumed={() => {
                        structureAutoExpandConsumedRef.current = true
                      }}
                    />
                  )}

                  {currentStep === 3 && (
                    <FieldsStep
                      initialData={{ fields: draft.fields }}
                      onUpdate={(data) => setDraft({ ...draft, ...data })}
                    />
                  )}

                  {currentStep === 4 && <FinalizeStep academyData={draft} />}
                </motion.div>
              </AnimatePresence>
            </div>

            <motion.div
              layout
              className="relative z-10 mt-auto flex w-full items-center justify-between px-4 pt-4"
              transition={{ layout: { type: "spring", stiffness: 300, damping: 30 } }}
            >
              <Button
                variant="outline"
                onClick={currentStep === 1 ? () => router.push("/") : prevStep}
                className="gap-1.5 pl-2"
              >
                <IconArrowLeft className="size-4" />
                {currentStep === 1 ? "Home" : "Back"}
              </Button>

              {currentStep < WIZARD_STEPS.length ? (
                <Button onClick={nextStep} disabled={!isCurrentStepValid()} className="hover:bg-primary/80 gap-1.5 pr-2">
                  Next step
                  <IconArrowRight className="size-4" />
                </Button>
              ) : (
                <div className="flex flex-col items-end gap-1.5">
                  {submitError && (
                    <p className="max-w-[260px] text-right text-xs text-destructive">{submitError}</p>
                  )}

                  <Button onClick={handleCreate}>Create Academy</Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}


    </AnimatePresence>
      <div className="absolute bottom-4 w-full left-0 right-0 flex justify-center">
        <ProgressIndicator currentStep={currentStep} />
      </div>
    </>
  )
}

export function CreateAcademyStepper() {
  return <CreateAcademyWizard />
}
