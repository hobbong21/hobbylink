import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function CommunityLoading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="space-y-2 text-center">
          <Skeleton className="h-12 w-40 mx-auto" />
          <Skeleton className="h-4 w-80 mx-auto" />
        </div>
        <div className="space-y-4 max-w-2xl mx-auto">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-3 w-1/4 mt-3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}
