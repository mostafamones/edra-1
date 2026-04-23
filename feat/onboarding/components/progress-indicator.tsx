import { WIZARD_STEPS } from "../context"
import { cn } from "@/lib/utils"

export function ProgressIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="relative flex items-center justify-between flex-col gap-2">
      <div className="text-sm text-muted-foreground">{WIZARD_STEPS[currentStep - 1].title}</div>
      <div className="flex items-center justify-between gap-2">
        {WIZARD_STEPS.map((step) => {
          const isActive = currentStep === step.id
          const isCompleted = currentStep > step.id
          return (
            <div key={step.id} className="flex flex-col items-center relative gap-2">
              <div className={cn("size-2 rounded-full shrink-0", isActive || isCompleted ? "bg-primary" : "bg-muted-foreground/60")} />
            </div>
          )
        })}
      </div>
    </div>
  )
}