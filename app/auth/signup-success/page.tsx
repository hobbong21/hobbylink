import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail } from "lucide-react"

export default function SignupSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border py-4">
        <div className="container mx-auto px-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity w-fit">
            <Image src="/hobbylink-logo.png" alt="HobbyLink" width={120} height={40} className="h-10 w-auto" priority />
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">이메일을 확인하세요</CardTitle>
            <CardDescription className="text-base">회원가입이 거의 완료되었습니다!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              입력하신 이메일 주소로 확인 링크를 보내드렸습니다. 이메일의 링크를 클릭하여 계정을 활성화해주세요.
            </p>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>이메일이 보이지 않나요?</strong>
                <br />
                스팸 폴더를 확인하거나 몇 분 후 다시 시도해주세요.
              </p>
            </div>
            <Button asChild className="w-full h-11">
              <Link href="/login">로그인 페이지로 이동</Link>
            </Button>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} HobbyLink. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
