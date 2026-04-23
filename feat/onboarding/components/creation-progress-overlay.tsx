"use client"

import { IconCheck } from "@tabler/icons-react"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

import { CREATION_STEPS } from "../context"

interface CreationProgressOverlayProps {
  academyName: string
  completedSteps: Set<string>
  isDone: boolean
}

export function CreationProgressOverlay({
  academyName,
  completedSteps,
  isDone,
}: CreationProgressOverlayProps) {
  return (
    <motion.div
      key="creating"
      initial={{ opacity: 0, filter: "blur(8px)", scale: 0.97 }}
      animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
      exit={{ opacity: 0, filter: "blur(8px)", scale: 0.97 }}
      transition={{ duration: 0.45 }}
      className="flex h-full w-full flex-col items-center justify-center gap-8"
    >
      <div className="space-y-1 text-center">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-2xl font-semibold tracking-tight"
        >
          {isDone ? "Your academy is ready!" : "Setting things up..."}
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-sm text-muted-foreground"
        >
          {isDone ? `Welcome to ${academyName || "your new academy"}` : "This only takes a moment"}
        </motion.p>
      </div>

      <div className="flex w-72 flex-col gap-3">
        {CREATION_STEPS.map((step, index) => {
          const done = completedSteps.has(step.id)
          const active =
            !done &&
            !completedSteps.has(CREATION_STEPS[index + 1]?.id ?? "") &&
            completedSteps.size === index

          const StepIcon = step.icon

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: done || active ? 1 : 0.3, x: 0 }}
              transition={{ delay: 0.1 + index * 0.07, duration: 0.3 }}
              className="flex items-center gap-3"
            >
              <div className="relative flex size-8 shrink-0 items-center justify-center">
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full transition-all duration-500",
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
                    ? "font-medium text-foreground"
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
