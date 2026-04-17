import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star } from "lucide-react"
import { ReviewForm } from "./review-form"
import type { Tables } from "@/lib/database.types"

interface ReviewsProps {
  eventId: string
  eventDate: string
  currentUserId: string | null
}

export async function Reviews({ eventId, eventDate, currentUserId }: ReviewsProps) {
  const supabase = await createClient()

  const { data: reviewsData } = await supabase
    .from("event_reviews")
    .select("*, profiles:author_id(display_name, avatar_url)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })

  type ReviewRow = Tables<"event_reviews"> & {
    profiles: Pick<Tables<"profiles">, "display_name" | "avatar_url"> | null
  }
  const reviews = (reviewsData ?? []) as ReviewRow[]

  const isPastEvent = new Date(eventDate).getTime() < Date.now()

  let canWrite = false
  let myReview: ReviewRow | null = null
  if (currentUserId && isPastEvent) {
    const { data: myRow } = await supabase
      .from("event_participants")
      .select("status")
      .eq("event_id", eventId)
      .eq("user_id", currentUserId)
      .maybeSingle()
    canWrite = myRow?.status === "registered" || myRow?.status === "attended"
    myReview = reviews.find((r) => r.author_id === currentUserId) ?? null
  }

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>후기 ({reviews.length})</CardTitle>
          {averageRating !== null && (
            <div className="flex items-center gap-1 text-sm">
              <Star
                aria-hidden="true"
                className="w-4 h-4 fill-yellow-400 text-yellow-400"
              />
              <span className="font-medium">{averageRating.toFixed(1)}</span>
              <span className="text-muted-foreground">/ 5.0</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {canWrite && <ReviewForm eventId={eventId} existingReview={myReview} />}
        {!canWrite && isPastEvent && currentUserId && (
          <p className="text-sm text-muted-foreground">
            참가한 분만 후기를 작성할 수 있습니다.
          </p>
        )}

        {reviews.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            아직 작성된 후기가 없습니다.
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="flex gap-3">
                <Avatar>
                  <AvatarImage
                    src={r.profiles?.avatar_url ?? "/placeholder-user.jpg"}
                    alt={`${r.profiles?.display_name ?? "사용자"}의 프로필 사진`}
                  />
                  <AvatarFallback>
                    {r.profiles?.display_name?.[0] ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">
                      {r.profiles?.display_name ?? "사용자"}
                    </p>
                    <div
                      className="flex items-center gap-0.5"
                      aria-label={`별점 ${r.rating}점`}
                    >
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          aria-hidden="true"
                          className={
                            i < r.rating
                              ? "w-3 h-3 fill-yellow-400 text-yellow-400"
                              : "w-3 h-3 text-muted-foreground"
                          }
                        />
                      ))}
                    </div>
                    <time
                      dateTime={r.created_at}
                      className="text-xs text-muted-foreground ml-auto"
                    >
                      {new Date(r.created_at).toLocaleDateString("ko-KR")}
                    </time>
                  </div>
                  {r.comment && (
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                      {r.comment}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
