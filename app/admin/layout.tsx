import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminSidebar } from "@/components/layout/admin-sidebar"
import type { Tables } from "@/lib/database.types"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single<Pick<Tables<"profiles">, "is_admin">>()

  if (!profile?.is_admin) redirect("/")

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Image
                src="/hobbylink-logo.png"
                alt="HobbyLink"
                width={120}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-primary">관리자 모드</span>
              <Link
                href="/"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                사이트로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </header>
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}
