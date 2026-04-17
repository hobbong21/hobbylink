import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { NotificationPrefsForm } from "./prefs-form"
import { EnablePushButton } from "./enable-push-button"
import type { Tables } from "@/lib/database.types"

export default async function NotificationPrefsPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) redirect("/login")

  const { data } = await supabase
    .from("notification_prefs")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<Tables<"notification_prefs">>()

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">알림 설정</h1>
          <p className="text-muted-foreground mt-2">
            어떤 알림을 어떤 채널로 받을지 선택하세요.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>채널별 설정</CardTitle>
            <CardDescription>
              이메일 알림은 RESEND_API_KEY가 설정된 환경에서만 실제 발송됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <NotificationPrefsForm
              initial={{
                email_on_match: data?.email_on_match ?? true,
                email_on_new_message: data?.email_on_new_message ?? false,
                email_on_event_reminder: data?.email_on_event_reminder ?? true,
                inapp_on_follow: data?.inapp_on_follow ?? true,
                play_sound: data?.play_sound ?? true,
                vibrate: data?.vibrate ?? false,
              }}
            />
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-1">브라우저 푸시 알림</p>
              <p className="text-xs text-muted-foreground mb-3">
                알림을 수신할 기기에서 한 번씩 켜주세요. HTTPS 환경 + VAPID 키가 설정된 경우에만 동작합니다.
              </p>
              <EnablePushButton />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
