"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SectionHeading } from "@/components/ui/section-heading"
import { TrustBar } from "@/components/marketing/trust-bar"
import { LanguageToggle } from "@/components/language-toggle"
import { useLanguage } from "@/contexts/language-context"
import {
  ArrowRight,
  Users,
  Heart,
  Sparkles,
  ShieldCheck,
  CalendarCheck,
  MessageSquare,
  BadgeCheck,
  Star,
} from "lucide-react"

/**
 * Trust / Professional landing page.
 *
 * Structure:
 *   Header  →  Hero (grid pattern + spotlight)  →  TrustBar  →
 *   3-up features  →  Social proof card  →  Large statements  →
 *   How-it-works timeline  →  Final CTA  →  Footer
 */
export default function HomePage() {
  const { t } = useLanguage()

  const FEATURES = [
    {
      icon: Sparkles,
      title: t("features.matching.title"),
      description: t("features.matching.description"),
      href: "/interests",
      badge: t("features.matching.badge"),
    },
    {
      icon: Heart,
      title: t("features.community.title"),
      description: t("features.community.description"),
      href: "/community",
      badge: t("features.community.badge"),
    },
    {
      icon: CalendarCheck,
      title: "오프라인 모임 운영",
      description:
        "참가 신청, 결제, 출석까지 하나의 링크로 관리합니다. 주최자에게 필요한 도구만 깔끔하게 모았습니다.",
      href: "/events",
      badge: "Events",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header -------------------------------------------------------- */}
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Image
              src="/hobbylink-logo.png"
              alt="HobbyLink"
              width={120}
              height={40}
              className="h-8 w-auto"
              priority
            />
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/explore" className="text-muted-foreground hover:text-foreground transition-colors">
              탐색
            </Link>
            <Link href="/features" className="text-muted-foreground hover:text-foreground transition-colors">
              기능
            </Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              요금제
            </Link>
            <Link href="/docs/api" className="text-muted-foreground hover:text-foreground transition-colors">
              API
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/login">{t("login")}</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">{t("signup")}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero ---------------------------------------------------------- */}
      <section className="relative overflow-hidden bg-hero-spotlight">
        <div className="absolute inset-0 bg-grid-pattern opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" aria-hidden="true" />
        <div className="container mx-auto px-4 py-20 md:py-28 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary-muted text-primary text-xs font-medium mb-6">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" aria-hidden="true" />
              <span>검증된 커뮤니티 · 실명 연결 주의 의무</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight mb-5">
              <span className="text-gradient-brand">취미로 연결되는</span>
              <br />
              믿을 수 있는 오프라인 모임
            </h1>
            <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
              HobbyLink는 관심사 매칭, 모임 운영, 안전 검증을 하나의 제품에
              담았습니다. 업무 효율과 동일한 기준으로 설계된 커뮤니티 플랫폼을 경험해보세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" asChild className="text-sm md:text-base">
                <Link href="/signup">
                  무료로 시작하기
                  <ArrowRight className="ml-1.5 w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-sm md:text-base">
                <Link href="/explore">이미 있는 모임 둘러보기</Link>
              </Button>
            </div>
            <p className="mt-5 text-xs text-muted-foreground">
              회원가입 시 카드 정보가 필요하지 않습니다 · 5초 만에 둘러보기 가능
            </p>
          </div>

          {/* Product preview card */}
          <div className="mt-14 max-w-5xl mx-auto">
            <div className="relative rounded-2xl border border-border/80 bg-card shadow-[0_20px_60px_-30px_color-mix(in_oklch,var(--primary)_35%,transparent)] overflow-hidden">
              <div className="h-8 border-b border-border/60 bg-muted/40 flex items-center gap-1.5 px-4">
                <span className="w-2.5 h-2.5 rounded-full bg-[color-mix(in_oklch,var(--destructive)_70%,transparent)]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[color-mix(in_oklch,var(--warning)_70%,transparent)]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[color-mix(in_oklch,var(--success)_70%,transparent)]" />
                <span className="ml-3 text-[11px] text-muted-foreground font-mono">
                  hobbylink.app/home
                </span>
              </div>
              <div className="aspect-[16/9] relative bg-muted">
                <Image
                  src="/people-connecting-through-hobbies-illustration.jpg"
                  alt="HobbyLink 제품 미리보기"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar ----------------------------------------------------- */}
      <TrustBar />

      {/* Features grid ------------------------------------------------- */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <SectionHeading
            align="center"
            eyebrow={<><Sparkles className="w-3.5 h-3.5" /> Features</>}
            title="모임을 운영하기 위한 모든 것"
            description="매칭, 커뮤니티, 결제, 안전 검증까지 — 각 기능은 독립적으로 완성되어 있지만 하나의 맥락으로 이어집니다."
            className="mb-12"
          />
          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            {FEATURES.map((f) => (
              <Link
                key={f.title}
                href={f.href}
                className="group relative rounded-xl border border-border/80 bg-card p-6 md:p-7 transition hover:border-primary/40 hover:shadow-[0_1px_0_0_var(--border),0_22px_40px_-28px_color-mix(in_oklch,var(--primary)_40%,transparent)]"
              >
                <div className="w-10 h-10 rounded-lg bg-primary-muted text-primary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <f.icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                  {f.badge}
                </p>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                  자세히 보기
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof -------------------------------------------------- */}
      <section className="py-20 md:py-24 bg-elevated/40 border-y border-border/60">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-1">
              <SectionHeading
                eyebrow="Social proof"
                title={<>왜 사용자들은 HobbyLink를<br />반복해서 사용할까요?</>}
                description="5천 건 이상의 사용자 인터뷰와 리뷰에서 반복해 언급된 세 가지 이유입니다."
              />
            </div>
            <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
              {[
                {
                  quote:
                    "모임 호스트라면 꼭 필요한 기능만 담아둬서, 기존에 쓰던 여러 툴을 정리할 수 있었어요.",
                  author: "이은지 · 서울 보드게임 클럽",
                },
                {
                  quote:
                    "관심사 매칭 정확도가 생각보다 높아서, 진짜 대화가 통하는 사람을 만날 수 있었습니다.",
                  author: "박준호 · 러닝 크루 오거나이저",
                },
                {
                  quote:
                    "전화번호 인증과 신고 처리 속도가 빨라 처음 만나는 자리에 가도 부담이 적어요.",
                  author: "김지원 · 여성 혼자 가입 사용자",
                },
                {
                  quote:
                    "공개 API 덕에 자체 팀 블로그에 모임 캘린더를 바로 꽂았습니다. 개발자 친화적이네요.",
                  author: "Dev Kim · 기술 블로그 운영자",
                },
              ].map((q) => (
                <Card
                  key={q.author}
                  className="border-border/60 bg-card"
                >
                  <CardContent className="p-5">
                    <div className="flex gap-0.5 text-[color:var(--warning)] mb-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed">“{q.quote}”</p>
                    <p className="mt-3 text-xs text-muted-foreground">{q.author}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Big stats ----------------------------------------------------- */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto px-4">
          <SectionHeading
            align="center"
            eyebrow="By the numbers"
            title={t("stats.title")}
            description={t("stats.description")}
            className="mb-12"
          />
          <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              { value: "10,000+", label: t("stats.users"), icon: Users },
              { value: "500+", label: t("stats.categories"), icon: Heart },
              { value: "50,000+", label: t("stats.meetings"), icon: CalendarCheck },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-border/80 bg-card p-6 text-center"
              >
                <s.icon
                  className="w-5 h-5 text-primary mx-auto mb-2"
                  aria-hidden="true"
                />
                <div className="text-3xl md:text-4xl font-semibold tracking-tight tabular-nums text-gradient-brand">
                  {s.value}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works -------------------------------------------------- */}
      <section className="py-20 md:py-24 bg-elevated/40 border-y border-border/60">
        <div className="container mx-auto px-4">
          <SectionHeading
            align="center"
            eyebrow="How it works"
            title="3단계로 시작합니다"
            className="mb-12"
          />
          <ol className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto counter-reset">
            {[
              {
                icon: BadgeCheck,
                title: "가입 + 본인 인증",
                description: "이메일 한 줄로 가입하고, 전화번호 인증으로 '검증됨' 배지를 받습니다.",
              },
              {
                icon: MessageSquare,
                title: "관심사 매칭",
                description: "5개 이상의 관심사를 고르면 AI가 대화가 이어질 수 있는 사람을 추천합니다.",
              },
              {
                icon: CalendarCheck,
                title: "오프라인 만남",
                description: "모임을 열거나 참가 신청 한 번으로 참여합니다. 결제·출석·후기까지 한 곳에서.",
              },
            ].map((step, i) => (
              <li
                key={step.title}
                className="relative rounded-xl border border-border/80 bg-card p-6"
              >
                <span className="absolute -top-3 left-6 inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-semibold tabular-nums">
                  {i + 1}
                </span>
                <step.icon className="w-6 h-6 text-primary mt-2 mb-3" aria-hidden="true" />
                <h3 className="font-semibold mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Safety pillars ----------------------------------------------- */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-[1fr,auto] items-end gap-8 mb-10">
            <SectionHeading
              eyebrow={<><ShieldCheck className="w-3.5 h-3.5" /> Safety</>}
              title="검증된 환경에서만 만남이 이뤄집니다"
              description="HobbyLink는 오프라인 만남 서비스에 필요한 안전장치를 기본값으로 제공합니다."
            />
            <Button asChild variant="outline">
              <Link href="/help/safety">안전 정책 자세히</Link>
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              "전화번호 인증 후에만 결제 모임 개설 가능",
              "24시간 내 신고 처리, 관리자 전담 대응",
              "상호 차단 시 프로필·메시지 완전 격리",
              "후기는 참석자만 작성 가능, 도배 차단",
            ].map((item) => (
              <div
                key={item}
                className="rounded-lg border border-border/80 bg-card p-4 text-sm leading-relaxed"
              >
                <ShieldCheck
                  className="w-4 h-4 text-primary mb-2"
                  aria-hidden="true"
                />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA ----------------------------------------------------- */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary-muted p-8 md:p-12 text-center max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-grid-pattern opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_70%)]" aria-hidden="true" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
                {t("cta.title")}
              </h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                {t("cta.description")}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" asChild>
                  <Link href="/signup">
                    {t("cta.button")}
                    <ArrowRight className="ml-1.5 w-4 h-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/contact">영업팀에 문의</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer -------------------------------------------------------- */}
      <footer className="border-t border-border/70 py-12 bg-elevated/40">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-8 mb-10">
            <div className="md:col-span-2 pr-4">
              <Image
                src="/hobbylink-logo.png"
                alt="HobbyLink"
                width={120}
                height={40}
                className="h-8 w-auto mb-4"
              />
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                HobbyLink — 취미로 연결되는 오프라인 모임 플랫폼.
              </p>
            </div>
            <FooterCol
              title={t("footer.product")}
              links={[
                { href: "/features", label: t("footer.features") },
                { href: "/pricing", label: t("footer.pricing") },
                { href: "/faq", label: t("footer.faq") },
                { href: "/docs/api", label: "API" },
              ]}
            />
            <FooterCol
              title={t("footer.company")}
              links={[
                { href: "/about", label: t("footer.about") },
                { href: "/blog", label: t("footer.blog") },
                { href: "/careers", label: t("footer.careers") },
              ]}
            />
            <FooterCol
              title={t("footer.legal")}
              links={[
                { href: "/privacy", label: t("footer.privacy") },
                { href: "/terms", label: t("footer.terms") },
                { href: "/cookies", label: t("footer.cookies") },
                { href: "/status", label: t("footer.status") },
              ]}
            />
          </div>
          <div className="pt-6 border-t border-border/70 flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-muted-foreground">
            <p>
              &copy; {new Date().getFullYear()} HobbyLink. {t("footer.rights")}
            </p>
            <p className="font-mono">v1.0 · status: operational</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FooterCol({
  title,
  links,
}: {
  title: string
  links: Array<{ href: string; label: string }>
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
