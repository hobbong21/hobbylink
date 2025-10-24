"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Users, Heart, Sparkles } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/contexts/language-context"
import { LanguageToggle } from "@/components/language-toggle"

export default function HomePage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image src="/hobbylink-logo.png" alt="HobbyLink" width={120} height={40} className="h-10 w-auto" priority />
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Button asChild>
              <Link href="/signup">{t("signup")}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-muted/50 to-background">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" aria-hidden="true" />
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-6 text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              <span>{t("hero.badge")}</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-balance leading-tight">
              {t("hero.title")}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty leading-relaxed">
              {t("hero.description")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="text-base">
                <Link href="/explore">
                  {t("hero.start")}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base bg-transparent">
                <Link href="/about">{t("hero.learnMore")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="order-2 md:order-1">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted shadow-2xl">
                <Image
                  src="/people-connecting-through-hobbies-illustration.jpg"
                  alt="Interest-based matching illustration"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-4 text-sm font-medium">
                <Users className="w-4 h-4" />
                <span>{t("features.matching.badge")}</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">{t("features.matching.title")}</h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">{t("features.matching.description")}</p>
              <Button asChild variant="link" className="px-0 text-base">
                <Link href="/interests">
                  {t("features.matching.cta")}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-4 text-sm font-medium">
                <Heart className="w-4 h-4" />
                <span>{t("features.community.badge")}</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">{t("features.community.title")}</h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                {t("features.community.description")}
              </p>
              <Button asChild variant="link" className="px-0 text-base">
                <Link href="/community">
                  {t("features.community.cta")}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
            <div>
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted shadow-2xl">
                <Image
                  src="/trusted-community-members-interacting.jpg"
                  alt="Trusted community illustration"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("stats.title")}</h2>
            <p className="text-lg text-muted-foreground">{t("stats.description")}</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            <Card className="text-center border-2">
              <CardContent className="pt-8 pb-8">
                <div className="text-4xl md:text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">10,000+</div>
                <div className="text-muted-foreground font-medium">{t("stats.users")}</div>
              </CardContent>
            </Card>
            <Card className="text-center border-2">
              <CardContent className="pt-8 pb-8">
                <div className="text-4xl md:text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">500+</div>
                <div className="text-muted-foreground font-medium">{t("stats.categories")}</div>
              </CardContent>
            </Card>
            <Card className="text-center border-2">
              <CardContent className="pt-8 pb-8">
                <div className="text-4xl md:text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">50,000+</div>
                <div className="text-muted-foreground font-medium">{t("stats.meetings")}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto border-2 shadow-xl">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">{t("cta.title")}</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">{t("cta.description")}</p>
              <Button size="lg" asChild className="text-base">
                <Link href="/signup">
                  {t("cta.button")}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-4">{t("footer.product")}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/features" className="hover:text-foreground transition-colors">
                    {t("footer.features")}
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-foreground transition-colors">
                    {t("footer.pricing")}
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-foreground transition-colors">
                    {t("footer.faq")}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">{t("footer.company")}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/about" className="hover:text-foreground transition-colors">
                    {t("footer.about")}
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-foreground transition-colors">
                    {t("footer.blog")}
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="hover:text-foreground transition-colors">
                    {t("footer.careers")}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">{t("footer.support")}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/help" className="hover:text-foreground transition-colors">
                    {t("footer.help")}
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-foreground transition-colors">
                    {t("footer.contact")}
                  </Link>
                </li>
                <li>
                  <Link href="/status" className="hover:text-foreground transition-colors">
                    {t("footer.status")}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">{t("footer.legal")}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/privacy" className="hover:text-foreground transition-colors">
                    {t("footer.privacy")}
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-foreground transition-colors">
                    {t("footer.terms")}
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="hover:text-foreground transition-colors">
                    {t("footer.cookies")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>
              &copy; {new Date().getFullYear()} HobbyLink. {t("footer.rights")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
