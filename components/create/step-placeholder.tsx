import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function StepPlaceholder({ stepNumber }: { stepNumber: number }) {
  return (
    <div className="h-full">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl">Step {stepNumber} Content</CardTitle>
        <CardDescription>
          This is a blank canvas for step {stepNumber}. We will build this out later.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-full flex items-center justify-center border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground text-sm">Future configuration options will go here...</p>
      </CardContent>
    </div>
  )
}
