"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { sendMessage } from "../actions"
import { Send } from "lucide-react"

interface ThreadMessage {
  id: string
  sender_id: string
  content: string
  created_at: string
  is_read?: boolean
}

interface ThreadClientProps {
  currentUserId: string
  peerId: string
  initialMessages: ThreadMessage[]
  showReadReceipts?: boolean
}

export function ThreadClient({
  currentUserId,
  peerId,
  initialMessages,
  showReadReceipts = false,
}: ThreadClientProps) {
  const [messages, setMessages] = useState<ThreadMessage[]>(initialMessages)
  const [draft, setDraft] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  // Supabase Realtime: subscribe to INSERTs where (sender=peer, receiver=me)
  // so live messages from the peer show up without a manual refresh.
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`messages:${currentUserId}:${peerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${peerId}`,
        },
        (payload) => {
          const row = payload.new as ThreadMessage & { receiver_id: string }
          if (row.receiver_id !== currentUserId) return
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev
            return [...prev, { id: row.id, sender_id: row.sender_id, content: row.content, created_at: row.created_at }]
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, peerId])

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const content = draft.trim()
    if (!content) return

    setError(null)
    const optimistic: ThreadMessage = {
      id: `optimistic-${Date.now()}`,
      sender_id: currentUserId,
      content,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])
    setDraft("")

    startTransition(async () => {
      const fd = new FormData()
      fd.set("receiver_id", peerId)
      fd.set("content", content)
      const result = await sendMessage(fd)
      if (!result.ok) {
        setError(result.message)
        // Remove the optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
      }
    })
  }

  return (
    <div className="flex flex-col h-full">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            첫 메시지를 보내보세요.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === currentUserId
            return (
              <div
                key={m.id}
                className={mine ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={
                    mine
                      ? "max-w-[75%] rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-4 py-2"
                      : "max-w-[75%] rounded-2xl rounded-bl-sm bg-muted px-4 py-2"
                  }
                >
                  <p className="whitespace-pre-wrap break-words text-sm">{m.content}</p>
                  <div
                    className={
                      mine
                        ? "flex items-center justify-end gap-1 text-[10px] opacity-70 mt-1"
                        : "text-[10px] opacity-70 mt-1"
                    }
                  >
                    <time dateTime={m.created_at}>
                      {new Date(m.created_at).toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                    {mine && showReadReceipts && (
                      <span aria-label={m.is_read ? "읽음" : "전송됨"}>
                        {m.is_read ? "· 읽음" : "· 전송됨"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <form onSubmit={onSubmit} className="border-t p-3 space-y-2">
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="p-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md"
          >
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
            placeholder="메시지를 입력하세요 (Enter: 전송, Shift+Enter: 줄바꿈)"
            rows={2}
            maxLength={2000}
            className="resize-none"
            aria-label="메시지 입력"
          />
          <Button type="submit" disabled={isPending || !draft.trim()}>
            <Send aria-hidden="true" className="w-4 h-4" />
            <span className="sr-only">전송</span>
          </Button>
        </div>
      </form>
    </div>
  )
}
