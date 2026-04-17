import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function MatchingLoading() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Card className="overflow-hidden">
          <Skeleton className="h-16 w-full rounded-none" />
          <Skeleton className="aspect-[3/4] w-full rounded-none" />
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-7 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-16 rounded-full" />
              ))}
            </div>
            <div className="flex gap-4 pt-4">
              <Skeleton className="h-14 flex-1" />
              <Skeleton className="h-14 flex-1" />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
