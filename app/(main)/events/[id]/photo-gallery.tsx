import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PhotoUploader } from "./photo-uploader"
import { DeletePhotoButton } from "./delete-photo-button"
import type { Tables } from "@/lib/database.types"

interface PhotoGalleryProps {
  eventId: string
  eventDate: string
  organizerId: string
  currentUserId: string | null
}

export async function PhotoGallery({
  eventId,
  eventDate,
  organizerId,
  currentUserId,
}: PhotoGalleryProps) {
  const supabase = await createClient()

  const { data: photos } = await supabase
    .from("event_photos")
    .select("*, profiles:uploader_id(display_name)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true })

  type PhotoRow = Tables<"event_photos"> & {
    profiles: Pick<Tables<"profiles">, "display_name"> | null
  }
  const rows = (photos ?? []) as PhotoRow[]

  // Who may upload: organizer or accepted participant.
  let canUpload = false
  if (currentUserId) {
    if (currentUserId === organizerId) {
      canUpload = true
    } else {
      const { data: part } = await supabase
        .from("event_participants")
        .select("status")
        .eq("event_id", eventId)
        .eq("user_id", currentUserId)
        .maybeSingle()
      canUpload = part?.status === "registered" || part?.status === "attended"
    }
  }

  // Allow uploads until 30 days after the event to capture post-meetup photos.
  const cutoff = new Date(eventDate).getTime() + 30 * 24 * 60 * 60 * 1000
  if (Date.now() > cutoff) canUpload = false

  return (
    <Card>
      <CardHeader>
        <CardTitle>사진 ({rows.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {canUpload && currentUserId && (
          <PhotoUploader eventId={eventId} userId={currentUserId} />
        )}

        {rows.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            아직 등록된 사진이 없습니다.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {rows.map((p) => (
              <figure
                key={p.id}
                className="relative aspect-square rounded-md overflow-hidden bg-muted group"
              >
                <Image
                  src={p.thumb_url ?? p.url}
                  alt={p.caption ?? "이벤트 사진"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                {p.caption && (
                  <figcaption className="absolute bottom-0 left-0 right-0 p-1 bg-black/50 text-white text-[10px] truncate">
                    {p.caption}
                  </figcaption>
                )}
                {currentUserId === p.uploader_id && (
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DeletePhotoButton
                      photoId={p.id}
                      storagePath={p.storage_path}
                    />
                  </div>
                )}
              </figure>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
