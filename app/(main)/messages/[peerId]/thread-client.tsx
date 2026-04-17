"use client"

import Image from "next/image"
import { useEffect, useRef, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { sendMessage } from "../actions"
import { Send, ImageIcon, X } from "lucide-react"

interface ThreadMessage {
  id: string
  sender_id: string
  content: string
  created_at: string
  is_read?: boolean
  image_url?: string | null
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
  const [attachment, setAttachment] = useState<{
    url: string
    path: string
  } | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)
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

  const onPickImage = () => fileRef.current?.click()

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("JPG, PNG, WebP만 업로드할 수 있습니다.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("이미지는 5MB 이하여야 합니다.")
      return
    }
    setIsUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
      const path = `${currentUserId}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from("message-images")
        .upload(path, file, { cacheControl: "3600", upsert: false })
      if (upErr) throw upErr
      const { data } = supabase.storage.from("message-images").getPublicUrl(path)
      setAttachment({ url: data.publicUrl, path })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "업로드 실패")
    } finally {
      setIsUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const removeAttachment = async () => {
    if (!attachment) return
    const supabase = createClient()
    await supabase.storage.from("message-images").remove([attachment.path])
    setAttachment(null)
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const content = draft.trim()
    if (!content && !attachment) return

    setError(null)
    const optimistic: ThreadMessage = {
      id: `optimistic-${Date.now()}`,
      sender_id: currentUserId,
      content,
      image_url: attachment?.url ?? null,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])
    const attached = attachment
    setDraft("")
    setAttachment(null)

    startTransition(async () => {
      const fd = new FormData()
      fd.set("receiver_id", peerId)
      fd.set("content", content)
      if (attached) {
        fd.set("image_url", attached.url)
        fd.set("image_path", attached.path)
      }
      const result = await sendMessage(fd)
      if (!result.ok) {
        setError(result.message)
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
                      ? "max-w-[75%] rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-4 py-2 space-y-2"
                      : "max-w-[75%] rounded-2xl rounded-bl-sm bg-muted px-4 py-2 space-y-2"
                  }
                >
                  {m.image_url && (
                    <a
                      href={m.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block relative w-full max-w-xs aspect-video rounded-md overflow-hidden bg-black/10"
                    >
                      <Image
                        src={m.image_url}
                        alt="첨부 이미지"
                        fill
                        className="object-cover"
                        sizes="280px"
                      />
                    </a>
                  )}
                  {m.content && (
                    <p className="whitespace-pre-wrap break-words text-sm">
                      {m.content}
                    </p>
                  )}
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

        {attachment && (
          <div className="relative w-24 h-24 rounded overflow-hidden bg-muted">
            <Image
              src={attachment.url}
              alt="첨부 이미지 미리보기"
              fill
              className="object-cover"
              sizes="96px"
            />
            <button
              type="button"
              onClick={removeAttachment}
              className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
              aria-label="첨부 제거"
            >
              <X aria-hidden="true" className="w-3 h-3" />
            </button>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onFile}
          aria-label="이미지 첨부"
        />

        <div className="flex gap-2 items-end">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onPickImage}
            disabled={isUploading || !!attachment}
            aria-label="이미지 첨부"
            className="flex-shrink-0"
          >
            <ImageIcon aria-hidden="true" className="w-4 h-4" />
          </Button>
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
          <Button
            type="submit"
            disabled={isPending || (!draft.trim() && !attachment)}
          >
            <Send aria-hidden="true" className="w-4 h-4" />
            <span className="sr-only">전송</span>
          </Button>
        </div>
      </form>
    </div>
  )
}
