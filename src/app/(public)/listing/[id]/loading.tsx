import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <div className="fixed inset-0 -z-10 bg-surface pointer-events-none" aria-hidden="true" />
      <div className="mx-auto max-w-[1440px] pt-4 lg:pt-8 pb-16 animate-pulse">
      <div className="grid gap-8 lg:grid-cols-[11fr_9fr] xl:gap-14 items-start">
        {/* Left: Image Gallery Skeleton */}
        <div className="flex flex-col gap-3">
          <Skeleton className="aspect-[4/5] w-full rounded-card" />
          <div className="flex gap-2">
             <Skeleton className="h-16 w-14 rounded-card" />
             <Skeleton className="h-16 w-14 rounded-card" />
             <Skeleton className="h-16 w-14 rounded-card" />
          </div>
        </div>

        {/* Right: Info Panel Skeleton */}
        <div className="flex flex-col gap-5 pt-2">
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Skeleton className="h-8 w-32" />
          </div>

          <div className="flex gap-3">
            <Skeleton className="h-8 w-24 rounded-pill" />
            <Skeleton className="h-8 w-20 rounded-pill" />
            <Skeleton className="h-8 w-24 rounded-pill" />
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <Skeleton className="h-[52px] w-full rounded-pill" />
            <Skeleton className="h-[52px] w-full rounded-pill" />
          </div>

          <Skeleton className="h-20 w-full rounded-[12px] mt-4" />
          
          <Skeleton className="h-32 w-full rounded-[12px] mt-4" />
        </div>
      </div>
    </div>
    </>
  );
}
