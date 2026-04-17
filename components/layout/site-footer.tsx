import Link from "next/link"

interface SiteFooterProps {
  /** If true, renders a short copyright-only footer. */
  minimal?: boolean
}

export function SiteFooter({ minimal = false }: SiteFooterProps) {
  if (minimal) {
    return (
      <footer className="border-t border-border py-6 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} HobbyLink. All rights reserved.
          </p>
        </div>
      </footer>
    )
  }

  return (
    <footer className="border-t border-border py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4 mb-8">
          <div>
            <h3 className="font-semibold mb-4">제품</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/explore" className="hover:text-foreground transition-colors">
                  탐색
                </Link>
              </li>
              <li>
                <Link href="/matching" className="hover:text-foreground transition-colors">
                  매칭
                </Link>
              </li>
              <li>
                <Link href="/community" className="hover:text-foreground transition-colors">
                  커뮤니티
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">회사</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-foreground transition-colors">
                  소개
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground transition-colors">
                  문의
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">지원</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/help" className="hover:text-foreground transition-colors">
                  도움말
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-foreground transition-colors">
                  자주 묻는 질문
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">정책</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  이용약관
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} HobbyLink. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
