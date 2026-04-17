import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border py-4">
        <div className="container mx-auto px-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity w-fit">
            <Image
              src="/hobbylink-logo.png"
              alt="HobbyLink"
              width={120}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-5xl font-bold">404</h1>
          <p className="text-lg text-muted-foreground">
            요청하신 페이지를 찾을 수 없습니다.
          </p>
          <div className="flex gap-2 justify-center">
            <Button asChild>
              <Link href="/">홈으로</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/explore">취미 탐색</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
