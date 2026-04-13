import { Skeleton } from "@/components/ui/skeleton";

export default function AcademySkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4">
      <div className="flex items-center justify-between">
        <Skeleton className="w-40 h-9" />
        <Skeleton className="w-28 h-8" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="w-full h-15" />
        <Skeleton className="w-full h-15" />
        <Skeleton className="w-full h-15" />
      </div>
    </div>
  )
}