import { ArrowLeft } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

export function ListingDetailSkeleton() {
  return (
    <div className="animate-fade-in pb-24 lg:pb-0">
      <div className="border-b border-border">
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">All listings</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-8 w-24 rounded-sm" />
            <Skeleton className="size-8 rounded-sm" />
            <Skeleton className="size-8 rounded-sm" />
          </div>
        </div>
      </div>
      <header className="mx-auto max-w-7xl px-4 pb-6 pt-8 sm:px-6">
        <Skeleton className="mb-4 h-3 w-44 rounded-sm" />
        <Skeleton className="mb-4 h-14 w-full max-w-3xl rounded-sm sm:h-16" />
        <div className="mb-6 flex flex-wrap gap-3">
          <Skeleton className="h-4 w-36 rounded-sm" />
          <Skeleton className="h-4 w-28 rounded-sm" />
          <Skeleton className="h-4 w-32 rounded-sm" />
        </div>
        <div className="grid gap-2 rounded-sm border border-border bg-surface p-2 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center">
          <div className="space-y-2 px-2 py-1">
            <Skeleton className="h-4 w-52 rounded-sm" />
            <Skeleton className="h-3 w-72 max-w-full rounded-sm" />
          </div>
          <Skeleton className="h-11 rounded-sm" />
          <Skeleton className="h-11 rounded-sm" />
          <Skeleton className="h-11 rounded-sm" />
        </div>
      </header>
      <section className="mx-auto mb-10 max-w-7xl px-4 sm:px-6">
        <div className="hidden h-[480px] grid-cols-4 grid-rows-2 gap-2 lg:grid">
          <Skeleton className="col-span-2 row-span-2 rounded-sm border border-border" />
          <Skeleton className="rounded-sm border border-border" />
          <Skeleton className="rounded-sm border border-border" />
          <Skeleton className="rounded-sm border border-border" />
          <Skeleton className="rounded-sm border border-border" />
        </div>
        <Skeleton className="aspect-[4/3] w-full rounded-sm border border-border lg:hidden" />
      </section>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_360px]">
        <main className="space-y-10">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-20 rounded-sm border border-border" />
            ))}
          </div>
          <div className="space-y-3">
            <Skeleton className="h-7 w-44 rounded-sm" />
            <Skeleton className="h-4 w-full rounded-sm" />
            <Skeleton className="h-4 w-11/12 rounded-sm" />
            <Skeleton className="h-4 w-3/4 rounded-sm" />
          </div>
        </main>
        <aside>
          <Skeleton className="h-96 rounded-sm border border-border" />
        </aside>
      </div>
    </div>
  );
}
