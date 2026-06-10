import { Skeleton } from "@/components/ui/skeleton";

export function PropertyCardSkeleton() {
  return (
    <article aria-hidden="true">
      <Skeleton className="mb-5 aspect-[3/4] w-full rounded-sm border border-border" />
      <div className="flex justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3 w-28 rounded-sm" />
          <Skeleton className="h-5 w-4/5 rounded-sm" />
          <Skeleton className="h-4 w-2/3 rounded-sm" />
        </div>
        <div className="w-20 space-y-2">
          <Skeleton className="ml-auto h-5 w-20 rounded-sm" />
          <Skeleton className="ml-auto h-3 w-12 rounded-sm" />
          <Skeleton className="ml-auto h-4 w-10 rounded-sm" />
        </div>
      </div>
    </article>
  );
}

export function PropertyGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <PropertyCardSkeleton key={index} />
      ))}
    </div>
  );
}
