import { Skeleton } from '@/components/ui/skeleton'

export default function ConversationSkeleton() {
  return (
    <div className="p-4 rounded-lg bg-white/10 border border-white/20 drop-shadow-lg">
      <div className="flex items-start justify-between gap-3.5">
        <div className="flex-1">
          <Skeleton className="h-7 w-3/4 mb-2 bg-white/10" />
          <Skeleton className="h-5 w-1/2 bg-white/10" />
        </div>
        <Skeleton className="size-7 rounded-full bg-white/10" />
      </div>
    </div>
  )
}
