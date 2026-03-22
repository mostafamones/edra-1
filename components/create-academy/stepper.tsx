"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { IconChevronLeft, IconChevronRight, IconCheck, IconSchool } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { StepOneBasics } from "./step-one-basics"
import { StepTwoStructure } from "./step-two-structure"
import { ACADEMY_ICONS } from "@/lib/constants"
import { StepPlaceholder } from "./step-placeholder"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

const STEPS = [
  { id: 1, title: "Basics" },
  { id: 2, title: "Structure" },
  { id: 3, title: "Fields" },
  { id: 4, title: "Finalize" }
]

export function CreateAcademyStepper() {
  const router = useRouter()
  const [[page, direction], setPage] = useState([1, 0])
  const [loading, setLoading] = useState(true);
  const currentStep = page

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);


  // Shared global state for all steps before final submission
  const [academyData, setAcademyData] = useState({
    name: "",
    subdomain: "",
    icon: "school",
    subject: "",
    levels: [] as Array<{ id: string; name: string; groups: Array<{ id: string; name: string }> }>,
  })

  // Handlers for navigating the wizard
  const nextStep = () => setPage((prev) => [Math.min(prev[0] + 1, STEPS.length), 1])
  const prevStep = () => setPage((prev) => [Math.max(prev[0] - 1, 1), -1])

  // Determine if the current step is valid and the user can proceed
  const isCurrentStepValid = () => {
    if (currentStep === 1) {
      return academyData.name.trim().length > 0
    }
    if (currentStep === 2) {
      return academyData.levels.length > 0 && academyData.levels.every(l => l.name.trim().length > 0)
    }
    // Assume placeholders are always valid for now
    return true
  }

  // Final submission wrapper
  const handleCreate = async () => {
    // We'll implement real Supabase inserts later
    console.log("Creating Academy with payload:", academyData)
    // router.push("/dashboard")
  }

  const variants = {
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
    })
  }


  return (
    <AnimatePresence mode="wait">
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
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, filter: "blur(4px)", scale: 0.98 }}
          animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-xl mx-auto flex flex-col h-full my-auto"
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
                const IconComponent = ACADEMY_ICONS.find(i => i.id === academyData.icon)?.icon || IconSchool
                return <IconComponent className="size-4.5" />
              })()}
            </div>
            <h1 className="text-xl font-semibold tracking-tight truncate">{academyData.name || "Academy Name"}</h1>
          </div>

          {/* Progress Indicator */}
          <div className="mb-16 relative flex items-center justify-between">
            {STEPS.map((step) => {
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id

              return (
                <div key={step.id} className="flex flex-col items-center relative z-10">
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-semibold transition-colors duration-300",
                      isActive ? "border-primary bg-primary text-primary-foreground" :
                        isCompleted ? "border-primary bg-primary text-primary-foreground" :
                          "border-muted bg-background text-muted-foreground"
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
            {/* Connecting Lines Behind Indicators */}
            <div className="absolute top-5 left-0 right-0 h-[2px] bg-muted -z-10" />
            <div
              className="absolute top-5 left-0 h-[2px] bg-primary -z-10 transition-all duration-500 ease-in-out"
              style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
            />
          </div>

          {/* Dynamic Step Content */}
          <motion.div
            layout
            className="rounded-xl border bg-card text-card-foreground shadow p-2 py-6 flex flex-col relative overflow-hidden h-[500px]"
          >
            <div className="relative h-full">
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "tween", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 },
                    layout: { type: "spring", stiffness: 300, damping: 30 }
                  }}
                  className="w-full h-full"
                >
                  {currentStep === 1 && (
                    <StepOneBasics
                      initialData={{ name: academyData.name, subdomain: academyData.subdomain, icon: academyData.icon, subject: academyData.subject }}
                      onUpdate={(data) => setAcademyData({ ...academyData, ...data })}
                    />
                  )}
                  {currentStep === 2 && (
                    <StepTwoStructure
                      initialData={{ levels: academyData.levels }}
                      onUpdate={(data) => setAcademyData({ ...academyData, ...data })}
                    />
                  )}
                  {currentStep === 3 && <StepPlaceholder stepNumber={3} />}
                  {currentStep === 4 && <StepPlaceholder stepNumber={4} />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Stepper Navigation Footer */}
            <motion.div layout className="flex items-center justify-between px-4 mt-auto pt-4 relative z-10 w-full"
              transition={{ layout: { type: "spring", stiffness: 300, damping: 30 } }}>
              <Button
                variant="outline"
                onClick={currentStep === 1 ? () => router.push("/") : prevStep}
              >
                <IconChevronLeft className="size-4" />
                {currentStep === 1 ? "Home" : "Back"}
              </Button>

              {currentStep < STEPS.length ? (
                <Button onClick={nextStep} disabled={!isCurrentStepValid()} className="hover:bg-primary/80" >
                  Next step
                  <IconChevronRight className=" size-4" />
                </Button>
              ) : (
                <Button onClick={handleCreate}>
                  Create Academy
                </Button>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
