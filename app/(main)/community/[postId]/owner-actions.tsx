"use client"

import Link from "next/link"
import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Edit, Trash2 } from "lucide-react"
import { deletePost } from "../actions"

export function PostOwnerActions({ postId }: { postId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const onDelete = () => {
    startTransition(async () => {
      const r = await deletePost(postId)
      if (r.ok) {
        router.push("/community")
        router.refresh()
      }
    })
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/community/${postId}/edit`}>
          <Edit aria-hidden="true" className="w-4 h-4 mr-1" />
          수정
        </Link>
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-destructive">
            <Trash2 aria-hidden="true" className="w-4 h-4 mr-1" />
            삭제
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>게시글을 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              댓글과 좋아요도 함께 삭제되며 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                onDelete()
              }}
              disabled={isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isPending ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
