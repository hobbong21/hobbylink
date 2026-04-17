import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { LanguageProvider } from "@/contexts/language-context"
import { HtmlLangSync } from "@/components/html-lang-sync"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })

export const metadata: Metadata = {
  title: {
    default: "HobbyLink — 취미로 연결되는 새로운 세상",
    template: "%s | HobbyLink",
  },
  description:
    "HobbyLink에서 당신의 취향에 꼭 맞는 취미를 발견하고, 마음이 통하는 친구들과 오프라인 모임을 만들어보세요.",
  keywords: ["취미", "관심사", "커뮤니티", "오프라인 모임", "HobbyLink"],
  openGraph: {
    title: "HobbyLink — 취미로 연결되는 새로운 세상",
    description: "취미로 연결되는 새로운 세상",
    type: "website",
    locale: "ko_KR",
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={geist.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <HtmlLangSync />
            {children}
            <Analytics />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
