import { Skeleton } from "@/components/ui/skeleton"

export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Skeleton className="h-32 w-full max-w-md" />
    </div>
  )
}
