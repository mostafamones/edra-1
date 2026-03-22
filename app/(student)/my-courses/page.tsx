import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="flex h-svh w-svw items-center justify-center">
      <div className="flex flex-col text-sm leading-loose items-center justify-center">
        <h1 className="font-semibold text-lg">This is your courses</h1>
        <p className="text-muted-foreground">This portal is still under construction.</p>
        <Button asChild variant="link">
          <a href="/app">Go back to the main Page</a>
        </Button>
      </div>
    </div>
  )
}
