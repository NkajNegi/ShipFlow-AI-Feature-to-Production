import { Skeleton, SkeletonPanels } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <SkeletonPanels count={3} />
      <SkeletonPanels count={2} />
    </div>
  );
}
