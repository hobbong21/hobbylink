import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Users } from "lucide-react"
import { JoinButton } from "./join-button"
import { Reviews } from "./reviews"
import { PhotoGallery } from "./photo-gallery"
import { Participants } from "./participants"
import { Discussion } from "./discussion"
import { MapView } from "@/components/kakao-map/map-view"
import { BookmarkButton } from "@/components/bookmark-button"
import { ReportDialog } from "@/components/moderation/report-dialog"
import { CancelEventButton } from "./cancel-event-button"
import { InviteButton } from "./invite-button"
import type { Tables } from "@/lib/database.types"

interface EventDetailProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: EventDetailProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: event } = await supabase
    .from("events")
    .select("title, description")
    .eq("id", id)
    .maybeSingle()
  if (!event) return {}

  const desc = event.description?.slice(0, 140) ?? "HobbyLink 오프라인 모임"
  return {
    title: event.title,
    description: desc,
    openGraph: {
      title: event.title,
      description: desc,
      type: "article",
    },
  }
}

export default async function EventDetailPage({ params }: EventDetailProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from("events")
    .select("*, hobbies(name, category), profiles!events_organizer_id_fkey(display_name)")
    .eq("id", id)
    .single()

  if (!event) notFound()

  type EventRow = Tables<"events"> & {
    hobbies: Pick<Tables<"hobbies">, "name" | "category"> | null
    profiles: Pick<Tables<"profiles">, "display_name"> | null
  }
  const e = event as EventRow

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let myStatus:
    | "registered"
    | "attended"
    | "cancelled"
    | "waitlisted"
    | null = null
  let initialSaved = false
  if (user) {
    const [{ data: myRow }, { data: bm }] = await Promise.all([
      supabase
        .from("event_participants")
        .select("status")
        .eq("event_id", id)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("bookmarks")
        .select("id")
        .eq("user_id", user.id)
        .eq("target_type", "event")
        .eq("target_id", id)
        .maybeSingle(),
    ])
    myStatus = (myRow?.status as typeof myStatus) ?? null
    initialSaved = !!bm
  }

  const isFull =
    e.max_participants !== null && (e.current_participants ?? 0) >= e.max_participants
  const date = new Date(e.event_date)
  const isJoined = myStatus === "registered" || myStatus === "attended"
  const isWaitlisted = myStatus === "waitlisted"

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {e.image_url && (
          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
            <Image src={e.image_url} alt={e.title} fill className="object-cover" priority />
          </div>
        )}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-2xl md:text-3xl">{e.title}</CardTitle>
              <div className="flex flex-wrap gap-1">
                {e.hobbies?.category && (
                  <Badge variant="secondary">{e.hobbies.category}</Badge>
                )}
                {e.recurrence_frequency && (
                  <Badge variant="outline">
                    {e.recurrence_frequency === "weekly"
                      ? "매주"
                      : e.recurrence_frequency === "biweekly"
                        ? "격주"
                        : "매월"}{" "}
                    반복
                  </Badge>
                )}
              </div>
            </div>
            {e.profiles?.display_name && (
              <p className="text-sm text-muted-foreground">
                주최: {e.profiles.display_name}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {e.description && (
              <p className="whitespace-pre-line leading-relaxed">{e.description}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar aria-hidden="true" className="w-4 h-4 text-muted-foreground" />
                <time dateTime={e.event_date}>
                  {date.toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    weekday: "long",
                  })}
                </time>
              </div>
              <div className="flex items-center gap-2">
                <Clock aria-hidden="true" className="w-4 h-4 text-muted-foreground" />
                {date.toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              {e.location && (
                <div className="flex items-center gap-2 sm:col-span-2">
                  <MapPin aria-hidden="true" className="w-4 h-4 text-muted-foreground" />
                  {e.location}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Users aria-hidden="true" className="w-4 h-4 text-muted-foreground" />
                {e.current_participants ?? 0}
                {e.max_participants ? ` / ${e.max_participants}` : ""}명
              </div>
            </div>

            {e.latitude !== null && e.longitude !== null && (
              <MapView lat={e.latitude} lng={e.longitude} title={e.title} />
            )}

            <JoinButton
              eventId={e.id}
              isAuthenticated={!!user}
              isJoined={isJoined}
              isFull={isFull && !isJoined}
              isWaitlisted={isWaitlisted}
            />

            <div className="flex flex-wrap items-center gap-1 pt-2 border-t">
              {user && (
                <BookmarkButton
                  targetType="event"
                  targetId={e.id}
                  initialSaved={initialSaved}
                />
              )}
              <a
                href={`/api/calendar/${e.id}`}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground px-2 h-8 rounded"
                download
              >
                캘린더에 추가 (.ics)
              </a>
              <ReportDialog targetType="event" targetId={e.id} />
              {user?.id === e.organizer_id && (
                <div className="ml-auto flex items-center gap-1">
                  <InviteButton eventId={e.id} />
                  <CancelEventButton
                    eventId={e.id}
                    isSeriesInstance={!!e.series_id}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Participants eventId={e.id} />

        <Discussion
          eventId={e.id}
          organizerId={e.organizer_id}
          currentUserId={user?.id ?? null}
        />

        <PhotoGallery
          eventId={e.id}
          eventDate={e.event_date}
          organizerId={e.organizer_id}
          currentUserId={user?.id ?? null}
        />

        <Reviews
          eventId={e.id}
          eventDate={e.event_date}
          currentUserId={user?.id ?? null}
        />
      </div>
    </main>
  )
}
