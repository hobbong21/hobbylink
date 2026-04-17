import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AddHobbyButton } from "../../explore/add-hobby-button"
import { Calendar, MapPin, Users } from "lucide-react"
import type { Tables } from "@/lib/database.types"

interface HobbyDetailProps {
  params: Promise<{ id: string }>
}

export default async function HobbyDetailPage({ params }: HobbyDetailProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: hobby } = await supabase
    .from("hobbies")
    .select("*")
    .eq("id", id)
    .maybeSingle<Tables<"hobbies">>()
  if (!hobby) notFound()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let added = false
  if (user) {
    const { data: row } = await supabase
      .from("user_hobbies")
      .select("hobby_id")
      .eq("user_id", user.id)
      .eq("hobby_id", id)
      .maybeSingle()
    added = !!row
  }

  // Related events (via event.hobby_id + upcoming)
  const { data: events } = await supabase
    .from("events")
    .select("id, title, event_date, location, current_participants")
    .eq("hobby_id", id)
    .gte("event_date", new Date().toISOString())
    .order("event_date", { ascending: true })
    .limit(10)

  // Recent members (most recent user_hobbies rows for this hobby)
  const { data: recentMembers } = await supabase
    .from("user_hobbies")
    .select("user_id, profiles:user_id(id, display_name, avatar_url, is_suspended)")
    .eq("hobby_id", id)
    .order("created_at", { ascending: false })
    .limit(12)

  type MemberRow = { user_id: string; profiles: Pick<Tables<"profiles">, "id" | "display_name" | "avatar_url" | "is_suspended"> | null }
  const members = ((recentMembers ?? []) as MemberRow[]).filter(
    (m) => m.profiles && !m.profiles.is_suspended,
  )

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="overflow-hidden">
          {hobby.image_url && (
            <div className="relative aspect-[21/9] bg-muted">
              <Image
                src={hobby.image_url}
                alt={hobby.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 1024px"
                priority
              />
            </div>
          )}
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-3xl font-bold">{hobby.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{hobby.category}</Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users aria-hidden="true" className="w-3 h-3" />
                    {hobby.member_count.toLocaleString()}명
                  </span>
                </div>
              </div>
              <AddHobbyButton hobbyId={id} initialAdded={added} disabled={!user} />
            </div>
            {hobby.description && (
              <p className="text-muted-foreground whitespace-pre-line">
                {hobby.description}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>다가오는 모임 ({(events ?? []).length})</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {(events ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                이 취미의 예정 모임이 아직 없습니다.
              </p>
            ) : (
              (events ?? []).map((e) => (
                <Link
                  key={e.id}
                  href={`/events/${e.id}`}
                  className="flex items-center justify-between py-3 gap-3 hover:bg-muted/40 px-2 rounded transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{e.title}</p>
                    <p className="flex gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar aria-hidden="true" className="w-3 h-3" />
                        {new Date(e.event_date).toLocaleDateString("ko-KR")}
                      </span>
                      {e.location && (
                        <span className="flex items-center gap-1">
                          <MapPin aria-hidden="true" className="w-3 h-3" />
                          {e.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users aria-hidden="true" className="w-3 h-3" />
                        {e.current_participants ?? 0}
                      </span>
                    </p>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>최근 참여 사용자</CardTitle>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                아직 참여한 사용자가 없습니다.
              </p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <li key={m.user_id}>
                    <Link
                      href={`/profile/${m.user_id}`}
                      className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-muted transition-colors"
                    >
                      <Avatar className="w-7 h-7">
                        <AvatarImage
                          src={m.profiles?.avatar_url ?? "/placeholder-user.jpg"}
                          alt={`${m.profiles?.display_name ?? "사용자"}의 프로필 사진`}
                        />
                        <AvatarFallback>
                          {m.profiles?.display_name?.[0] ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {m.profiles?.display_name ?? "사용자"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
