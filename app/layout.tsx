import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { LanguageProvider } from "@/contexts/language-context"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "HobbyLink - 새로운 관심사, 새로운 연결",
  description:
    "취미로 연결되는 새로운 세상. HobbyLink에서 당신의 취향에 꼭 맞는 취미를 발견하고, 마음이 통하는 친구들을 만나보세요.",
  generator: "v0.app",
  keywords: ["취미", "관심사", "커뮤니티", "친구 만들기", "HobbyLink"],
  openGraph: {
    title: "HobbyLink - 새로운 관심사, 새로운 연결",
    description: "취미로 연결되는 새로운 세상",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className={`font-sans antialiased`}>
        <LanguageProvider>
          {children}
          <Analytics />
        </LanguageProvider>
      </body>
    </html>
  )
}
