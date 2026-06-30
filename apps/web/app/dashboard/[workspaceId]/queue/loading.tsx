import { Skeleton, SkeletonList } from "@/components/ui/skeleton";

export default function QueueLoading() {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-60" />
      </div>
      <SkeletonList rows={5} />
    </div>
  );
}
