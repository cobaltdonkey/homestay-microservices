import { Skeleton } from "@/components/ui/skeleton";

const ListingCardSkeleton = () => (
  <div className="overflow-hidden rounded-xl">
    <Skeleton className="aspect-[4/3] w-full" />
    <div className="p-3 space-y-2">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-8" />
      </div>
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-4 w-20" />
    </div>
  </div>
);

export default ListingCardSkeleton;
