import { Skeleton, SkeletonList } from "@/components/ui/skeleton";

export default function InboxLoading() {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <SkeletonList rows={6} />
    </div>
  );
}
