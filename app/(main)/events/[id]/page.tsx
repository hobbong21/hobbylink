import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Calendar, Clock, MapPin, Users, ArrowLeft, User as UserIcon } from "lucide-react"
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

  const spotsLeft =
    e.max_participants !== null
      ? Math.max(0, e.max_participants - (e.current_participants ?? 0))
      : null

  return (
    <main className="pb-24 md:pb-8">
      {/* Hero ----------------------------------------------------------- */}
      <section className="relative">
        {e.image_url ? (
          <div className="relative h-56 sm:h-72 md:h-96 w-full bg-muted overflow-hidden">
            <Image
              src={e.image_url}
              alt={e.title}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"
            />
          </div>
        ) : (
          <div className="relative h-40 sm:h-56 w-full bg-gradient-to-br from-primary-muted via-muted to-secondary overflow-hidden">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-grid-pattern opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]"
            />
          </div>
        )}
        <div className="container mx-auto px-4">
          <Link
            href="/events"
            className="absolute top-4 left-4 sm:top-6 sm:left-auto sm:container sm:mx-auto inline-flex items-center gap-1 text-sm text-foreground/90 bg-card/85 backdrop-blur-sm border border-border/60 rounded-md px-2.5 py-1.5 shadow-sm hover:bg-card transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            목록
          </Link>
        </div>
      </section>

      {/* Content -------------------------------------------------------- */}
      <div className="container mx-auto px-4 -mt-10 sm:-mt-16 md:-mt-20 relative">
        <div className="grid lg:grid-cols-[1fr,320px] gap-6 max-w-6xl mx-auto">
          {/* Main column */}
          <div className="min-w-0 space-y-6">
            <Card className="border-border/80">
              <CardHeader className="pb-4">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {e.hobbies?.category && (
                    <Badge variant="secondary">{e.hobbies.category}</Badge>
                  )}
                  {e.recurrence_frequency && (
                    <Badge variant="outline" className="gap-1">
                      {e.recurrence_frequency === "weekly"
                        ? "매주"
                        : e.recurrence_frequency === "biweekly"
                          ? "격주"
                          : "매월"}{" "}
                      반복
                    </Badge>
                  )}
                  {isFull && !isJoined && (
                    <Badge variant="destructive">마감</Badge>
                  )}
                </div>
                <CardTitle className="text-2xl md:text-3xl font-semibold tracking-tight leading-tight">
                  {e.title}
                </CardTitle>
                {e.profiles?.display_name && (
                  <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
                    <UserIcon aria-hidden="true" className="w-3.5 h-3.5" />
                    주최: {e.profiles.display_name}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Fact grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-sm">
                  <Fact
                    icon={<Calendar aria-hidden="true" className="w-4 h-4" />}
                    label="날짜"
                    value={
                      <time dateTime={e.event_date}>
                        {date.toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          weekday: "long",
                        })}
                      </time>
                    }
                  />
                  <Fact
                    icon={<Clock aria-hidden="true" className="w-4 h-4" />}
                    label="시간"
                    value={date.toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  />
                  {e.location && (
                    <Fact
                      icon={<MapPin aria-hidden="true" className="w-4 h-4" />}
                      label="장소"
                      value={e.location}
                      className="sm:col-span-2"
                    />
                  )}
                  <Fact
                    icon={<Users aria-hidden="true" className="w-4 h-4" />}
                    label="참가자"
                    value={`${e.current_participants ?? 0}${
                      e.max_participants ? ` / ${e.max_participants}` : ""
                    }명`}
                  />
                </div>

                {e.description && (
                  <div className="pt-5 border-t border-border/60">
                    <p className="whitespace-pre-line leading-relaxed text-[15px] text-foreground/90">
                      {e.description}
                    </p>
                  </div>
                )}

                {e.latitude !== null && e.longitude !== null && (
                  <div className="pt-5 border-t border-border/60">
                    <MapView lat={e.latitude} lng={e.longitude} title={e.title} />
                  </div>
                )}
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

          {/* Side rail (desktop) ------------------------------------- */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-4">
              <Card className="border-border/80 ring-brand">
                <CardContent className="p-5 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
                      지금 참가 가능
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-semibold tracking-tight tabular-nums">
                        {spotsLeft ?? "∞"}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {spotsLeft === null ? "제한 없음" : "자리 남음"}
                      </span>
                    </div>
                  </div>
                  <JoinButton
                    eventId={e.id}
                    isAuthenticated={!!user}
                    isJoined={isJoined}
                    isFull={isFull && !isJoined}
                    isWaitlisted={isWaitlisted}
                  />
                  <div className="flex flex-wrap items-center gap-1 pt-3 border-t border-border/60">
                    {user && (
                      <BookmarkButton
                        targetType="event"
                        targetId={e.id}
                        initialSaved={initialSaved}
                      />
                    )}
                    <a
                      href={`/api/calendar/${e.id}`}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 h-8 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      download
                    >
                      .ics 캘린더
                    </a>
                    <ReportDialog targetType="event" targetId={e.id} />
                  </div>
                  {user?.id === e.organizer_id && (
                    <div className="flex items-center gap-1 pt-3 border-t border-border/60">
                      <InviteButton eventId={e.id} />
                      <CancelEventButton
                        eventId={e.id}
                        isSeriesInstance={!!e.series_id}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </div>

      {/* Sticky CTA (mobile/tablet) ------------------------------------- */}
      <div
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <div className="min-w-0 flex-shrink-0 hidden sm:block">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              참가 인원
            </p>
            <p className="text-sm font-semibold tabular-nums">
              {e.current_participants ?? 0}
              {e.max_participants ? ` / ${e.max_participants}` : ""}명
            </p>
          </div>
          <div className="flex-1 min-w-0">
            <JoinButton
              eventId={e.id}
              isAuthenticated={!!user}
              isJoined={isJoined}
              isFull={isFull && !isJoined}
              isWaitlisted={isWaitlisted}
            />
          </div>
          {user && (
            <BookmarkButton
              targetType="event"
              targetId={e.id}
              initialSaved={initialSaved}
            />
          )}
        </div>
      </div>
    </main>
  )
}

/**
 * Tiny label/value helper for the facts grid on the detail card.
 */
function Fact({
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <p className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
        <span className="text-muted-foreground/70">{icon}</span>
        {label}
      </p>
      <p className="mt-0.5 font-medium">{value}</p>
    </div>
  )
}
