"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { LogOut } from "lucide-react"

export function SignOutButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/")
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSignOut}
      disabled={isLoading}
      className="gap-2"
    >
      <LogOut className="w-4 h-4" />
      <span className="hidden sm:inline">{isLoading ? "로그아웃 중..." : "로그아웃"}</span>
    </Button>
  )
}
