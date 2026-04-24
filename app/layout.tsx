import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { LanguageProvider } from "@/contexts/language-context"
import { HtmlLangSync } from "@/components/html-lang-sync"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

/**
 * Typography — we pair Inter (Latin) with Pretendard (Korean) via
 * Pretendard's CDN font-face declared directly in <head>. Pretendard is not
 * on Google Fonts so we can't use `next/font/google` for it, but the CDN
 * link is preconnected below to keep LCP tight.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  adjustFontFallback: true,
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
})

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
    <html
      lang="ko"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Pretendard provides crisp Hangul glyphs. Served from its dedicated CDN. */}
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.css"
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `:root { --font-pretendard: "Pretendard Variable", Pretendard; }`,
          }}
        />
        {/*
          Theme-init script: runs synchronously before React hydrates so
          <html> already has the correct 'dark'/'light' class on first paint.
          This prevents the flash-of-incorrect-theme (FOIT) that would
          otherwise occur because our ThemeProvider defers mounting via
          a React.useState(false) guard to avoid the React 19 hydration
          mismatch caused by next-themes' module-level J constant.
        */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var m=(!t||t==='system')?(d?'dark':'light'):t;document.documentElement.classList.add(m);document.documentElement.style.colorScheme=m;}catch(e){}})();",
          }}
        />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
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
