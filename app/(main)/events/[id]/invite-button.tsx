"use client"

import { useEffect, useState, useTransition } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserPlus, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { inviteUsersToEvent } from "../actions"

interface Candidate {
  id: string
  display_name: string
  avatar_url: string | null
}

interface InviteButtonProps {
  eventId: string
}

/**
 * Organizer-only "invite matched users" dialog. Loads the organizer's
 * accepted matches + followers as invite candidates.
 */
export function InviteButton({ eventId }: InviteButtonProps) {
  const [open, setOpen] = useState(false)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "ok"; count: number } | { kind: "error"; message: string }
  >({ kind: "idle" })
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        // Union of accepted matches (either direction) + follows (I follow).
        const [matches, follows] = await Promise.all([
          supabase
            .from("matches")
            .select("user_id, matched_user_id")
            .eq("status", "accepted")
            .or(`user_id.eq.${user.id},matched_user_id.eq.${user.id}`),
          supabase.from("follows").select("followed_id").eq("follower_id", user.id),
        ])

        const peerIds = new Set<string>()
        for (const m of matches.data ?? []) {
          peerIds.add(m.user_id === user.id ? m.matched_user_id : m.user_id)
        }
        for (const f of follows.data ?? []) peerIds.add(f.followed_id)
        peerIds.delete(user.id)

        if (peerIds.size === 0) {
          if (!cancelled) setCandidates([])
          return
        }
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url, is_suspended")
          .in("id", Array.from(peerIds))
        if (!cancelled) {
          setCandidates(
            (profiles ?? [])
              .filter((p) => !p.is_suspended)
              .map((p) => ({ id: p.id, display_name: p.display_name, avatar_url: p.avatar_url })),
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open])

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const filtered = query
    ? candidates.filter((c) =>
        c.display_name.toLowerCase().includes(query.toLowerCase()),
      )
    : candidates

  const onSend = () => {
    setStatus({ kind: "idle" })
    startTransition(async () => {
      const r = await inviteUsersToEvent(eventId, Array.from(selected))
      if (r.ok) {
        setStatus({ kind: "ok", count: r.count })
        setSelected(new Set())
      } else {
        setStatus({ kind: "error", message: r.message })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <UserPlus aria-hidden="true" className="w-4 h-4" />
          초대하기
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>모임에 초대</DialogTitle>
          <DialogDescription>
            매칭된 사용자와 팔로잉에서 초대할 대상을 선택하세요. 수락하면 자동으로 참가 등록됩니다.
          </DialogDescription>
        </DialogHeader>

        <Input
          placeholder="이름 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="초대할 사용자 검색"
        />

        <div className="max-h-72 overflow-y-auto space-y-1 border rounded p-1">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              불러오는 중...
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              초대할 수 있는 사용자가 없습니다.
            </p>
          ) : (
            filtered.map((c) => {
              const isOn = selected.has(c.id)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggle(c.id)}
                  aria-pressed={isOn}
                  className={
                    isOn
                      ? "w-full flex items-center gap-3 p-2 rounded bg-primary/10 transition-colors"
                      : "w-full flex items-center gap-3 p-2 rounded hover:bg-muted/50 transition-colors"
                  }
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={c.avatar_url ?? "/placeholder-user.jpg"} alt="" />
                    <AvatarFallback>{c.display_name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm flex-1 text-left">{c.display_name}</span>
                  {isOn && <Check aria-hidden="true" className="w-4 h-4 text-primary" />}
                </button>
              )
            })
          )}
        </div>

        {status.kind === "ok" && (
          <div role="status" className="text-sm text-green-700">
            {status.count}명에게 초대를 보냈습니다.
          </div>
        )}
        {status.kind === "error" && (
          <div role="alert" className="text-sm text-red-600">
            {status.message}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            닫기
          </Button>
          <Button
            onClick={onSend}
            disabled={isPending || selected.size === 0}
          >
            {isPending ? "전송 중..." : `${selected.size}명 초대`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
