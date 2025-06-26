import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

// Specialized skeleton components for common use cases
function WorkoutCardSkeleton() {
  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-14" />
      </div>
    </div>
  );
}

function UserProfileSkeleton() {
  return (
    <div className="flex items-center space-x-3 p-3">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

function ExerciseListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-3 border rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="p-2 bg-gray-50 rounded space-y-1">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ChatMessageSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

function FeedPostSkeleton() {
  return (
    <div className="p-4 border rounded-lg space-y-3">
      {/* User info */}
      <div className="flex items-center space-x-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>

      {/* Media placeholder */}
      <Skeleton className="h-48 w-full rounded-lg" />

      {/* Interaction buttons */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-14" />
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

function MuscleMapSkeleton() {
  return (
    <div className="relative">
      <Skeleton className="h-64 w-full rounded-lg" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-2">
          <Skeleton className="h-4 w-32 mx-auto" />
          <Skeleton className="h-3 w-24 mx-auto" />
        </div>
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="h-48 flex items-end justify-between gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            className="w-8"
            style={{ height: `${Math.random() * 80 + 20}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-6" />
        ))}
      </div>
    </div>
  );
}

export {
  Skeleton,
  WorkoutCardSkeleton,
  UserProfileSkeleton,
  ExerciseListSkeleton,
  ChatMessageSkeleton,
  FeedPostSkeleton,
  StatCardSkeleton,
  MuscleMapSkeleton,
  ChartSkeleton
}
