"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getErrorMessage } from "@/lib/get-error-message"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Dashboard segment error:", error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>{getErrorMessage(error)}</CardDescription>
        </CardHeader>
        <CardContent>
          {error.digest ? (
            <p className="text-muted-foreground text-xs">Reference: {error.digest}</p>
          ) : null}
        </CardContent>
        <CardFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => reset()}>
            Try again
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
