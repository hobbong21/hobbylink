"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { postDiscussionMessage } from "./discussion-actions"
import { Send } from "lucide-react"

export interface DiscussionMessage {
  id: string
  author_id: string
  content: string
  created_at: string
  author_name: string
  author_avatar: string | null
}

interface DiscussionClientProps {
  eventId: string
  currentUserId: string
  initialMessages: DiscussionMessage[]
}

export function DiscussionClient({
  eventId,
  currentUserId,
  initialMessages,
}: DiscussionClientProps) {
  const [messages, setMessages] = useState<DiscussionMessage[]>(initialMessages)
  const [draft, setDraft] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`event-discussion:${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "event_messages",
          filter: `event_id=eq.${eventId}`,
        },
        async (payload) => {
          const row = payload.new as { id: string; author_id: string; content: string; created_at: string }
          if (row.author_id === currentUserId) return // already appended optimistically
          // Hydrate author profile.
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, avatar_url")
            .eq("id", row.author_id)
            .maybeSingle()
          setMessages((prev) =>
            prev.some((m) => m.id === row.id)
              ? prev
              : [
                  ...prev,
                  {
                    id: row.id,
                    author_id: row.author_id,
                    content: row.content,
                    created_at: row.created_at,
                    author_name: profile?.display_name ?? "사용자",
                    author_avatar: profile?.avatar_url ?? null,
                  },
                ],
          )
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId, currentUserId])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const content = draft.trim()
    if (!content) return
    setError(null)
    const optimistic: DiscussionMessage = {
      id: `opt-${Date.now()}`,
      author_id: currentUserId,
      content,
      created_at: new Date().toISOString(),
      author_name: "나",
      author_avatar: null,
    }
    setMessages((prev) => [...prev, optimistic])
    setDraft("")
    startTransition(async () => {
      const fd = new FormData()
      fd.set("event_id", eventId)
      fd.set("content", content)
      const result = await postDiscussionMessage(fd)
      if (!result.ok) {
        setError(result.message)
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
      }
    })
  }

  return (
    <div className="flex flex-col h-[28rem]">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">
            첫 메시지를 남겨보세요.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.author_id === currentUserId
            return (
              <div key={m.id} className={mine ? "flex gap-2 justify-end" : "flex gap-2"}>
                {!mine && (
                  <Link href={`/profile/${m.author_id}`} className="flex-shrink-0">
                    <Avatar className="w-8 h-8">
                      <AvatarImage
                        src={m.author_avatar ?? "/placeholder-user.jpg"}
                        alt={`${m.author_name}의 프로필 사진`}
                      />
                      <AvatarFallback>{m.author_name[0]}</AvatarFallback>
                    </Avatar>
                  </Link>
                )}
                <div className={mine ? "max-w-[75%]" : "max-w-[75%]"}>
                  {!mine && (
                    <p className="text-[11px] text-muted-foreground mb-0.5">
                      {m.author_name}
                    </p>
                  )}
                  <div
                    className={
                      mine
                        ? "rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-3 py-2 text-sm"
                        : "rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm"
                    }
                  >
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  </div>
                  <p
                    className={
                      mine
                        ? "text-[10px] text-muted-foreground mt-0.5 text-right"
                        : "text-[10px] text-muted-foreground mt-0.5"
                    }
                  >
                    {new Date(m.created_at).toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      <form onSubmit={onSubmit} className="border-t p-3 space-y-2">
        {error && (
          <div role="alert" className="text-xs text-red-600">
            {error}
          </div>
        )}
        <div className="flex gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                ;(e.currentTarget.form as HTMLFormElement)?.requestSubmit()
              }
            }}
            placeholder="모임 관련 이야기를 나누세요 (Enter 전송)"
            rows={2}
            maxLength={2000}
            className="resize-none"
            aria-label="메시지 입력"
          />
          <Button type="submit" size="sm" disabled={isPending || !draft.trim()}>
            <Send aria-hidden="true" className="w-4 h-4" />
            <span className="sr-only">전송</span>
          </Button>
        </div>
      </form>
    </div>
  )
}
