"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type Language = "ko" | "en"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ko")

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language
    if (savedLanguage) {
      setLanguageState(savedLanguage)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("language", lang)
  }

  const t = (key: string) => {
    return translations[language][key] || key
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

const translations: Record<Language, Record<string, string>> = {
  ko: {
    // Header
    signup: "회원가입",
    login: "로그인",

    // Hero
    "hero.badge": "취미로 연결되는 새로운 세상",
    "hero.title": "새로운 관심사, 새로운 연결",
    "hero.description": "HobbyLink에서 당신의 취향에 꼭 맞는 취미를 발견하고, 마음이 통하는 친구들을 만나보세요.",
    "hero.start": "지금 시작하기",
    "hero.learnMore": "자세히 알아보기",

    // Features
    "features.matching.badge": "관심사 기반 매칭",
    "features.matching.title": "관심사 기반 맞춤 탐색",
    "features.matching.description":
      "미술, 게임, 스포츠부터 야외 활동까지. 당신이 좋아하는 모든 것을 위한 맞춤형 커뮤니티를 손쉽게 찾아보세요.",
    "features.matching.cta": "맞춤 취미 둘러보기",

    "features.community.badge": "신뢰할 수 있는 커뮤니티",
    "features.community.title": "신뢰할 수 있는 커뮤니티",
    "features.community.description":
      "AI 평판 시스템은 모든 사용자의 활동을 기반으로 신뢰도를 평가하여 안전한 만남 환경을 조성합니다. 안심하고 새로운 친구들을 만나보세요.",
    "features.community.cta": "커뮤니티 알아보기",

    // Stats
    "stats.title": "함께 성장하는 커뮤니티",
    "stats.description": "수천 명의 사용자들이 이미 HobbyLink에서 새로운 친구를 만나고 있습니다",
    "stats.users": "활성 사용자",
    "stats.categories": "관심사 카테고리",
    "stats.meetings": "성사된 만남",

    // CTA
    "cta.title": "지금 바로 시작하세요",
    "cta.description": "무료로 가입하고 당신과 같은 취미를 가진 사람들을 만나보세요",
    "cta.button": "무료로 시작하기",

    // Footer
    "footer.product": "제품",
    "footer.features": "기능",
    "footer.pricing": "가격",
    "footer.faq": "FAQ",
    "footer.company": "회사",
    "footer.about": "소개",
    "footer.blog": "블로그",
    "footer.careers": "채용",
    "footer.support": "지원",
    "footer.help": "고객센터",
    "footer.contact": "문의하기",
    "footer.status": "서비스 상태",
    "footer.legal": "법적 고지",
    "footer.privacy": "개인정보처리방침",
    "footer.terms": "이용약관",
    "footer.cookies": "쿠키 정책",
    "footer.rights": "All rights reserved.",

    // Navigation
    "nav.explore": "탐색",
    "nav.matching": "매칭",
    "nav.community": "커뮤니티",

    // Explore Page
    "explore.title": "관심사 탐색",
    "explore.description": "500개 이상의 취미 카테고리에서 당신에게 맞는 커뮤니티를 찾아보세요",
    "explore.search": "관심사 검색...",
    "explore.all": "전체",
    "explore.popular": "인기",
    "explore.new": "신규",
    "explore.filter.all": "전체 카테고리",
    "explore.filter.arts": "예술 & 공예",
    "explore.filter.sports": "스포츠 & 피트니스",
    "explore.filter.music": "음악",
    "explore.filter.outdoor": "야외 활동",
    "explore.filter.tech": "기술 & 코딩",
    "explore.filter.food": "요리 & 음식",
    "explore.filter.games": "게임",
    "explore.filter.reading": "독서 & 글쓰기",
    "explore.members": "명의 회원",
    "explore.join": "참여하기",

    // Matching Page
    "matching.title": "스마트 매칭",
    "matching.description": "AI가 당신의 관심사를 분석하여 최적의 친구를 추천합니다",
    "matching.score": "매칭 점수",
    "matching.commonInterests": "공통 관심사",
    "matching.location": "위치",
    "matching.pass": "패스",
    "matching.interested": "관심 있어요",
    "matching.complete.title": "모든 추천을 확인했습니다",
    "matching.complete.description": "새로운 추천이 곧 업데이트됩니다",
    "matching.complete.button": "처음으로 돌아가기",

    // Community Page
    "community.title": "커뮤니티",
    "community.description": "회원들과 소통하고 다가오는 이벤트를 확인하세요",
    "community.newPost": "새 게시글",
    "community.latest": "최신",
    "community.popular": "인기",
    "community.following": "팔로잉",
    "community.upcomingEvents": "다가오는 이벤트",
    "community.monthlyContributors": "이달의 활동가",
    "community.posts": "게시글",
    "community.viewProfile": "프로필 보기",
    "community.ago": "전",
    "community.min": "분",
    "community.hour": "시간",
    "community.day": "일",

    // Auth Pages
    "auth.login.title": "로그인",
    "auth.login.description": "계정에 로그인하여 HobbyLink를 시작하세요",
    "auth.login.email": "이메일",
    "auth.login.password": "비밀번호",
    "auth.login.button": "로그인",
    "auth.login.or": "또는",
    "auth.login.google": "Google로 계속하기",
    "auth.login.github": "GitHub로 계속하기",
    "auth.login.noAccount": "계정이 없으신가요?",
    "auth.login.signupLink": "회원가입",

    "auth.signup.title": "회원가입",
    "auth.signup.description": "무료로 가입하고 새로운 친구들을 만나보세요",
    "auth.signup.name": "이름",
    "auth.signup.email": "이메일",
    "auth.signup.password": "비밀번호",
    "auth.signup.button": "가입하기",
    "auth.signup.or": "또는",
    "auth.signup.google": "Google로 가입하기",
    "auth.signup.github": "GitHub로 가입하기",
    "auth.signup.hasAccount": "이미 계정이 있으신가요?",
    "auth.signup.loginLink": "로그인",
  },
  en: {
    // Header
    signup: "Sign Up",
    login: "Log In",

    // Hero
    "hero.badge": "A New World Connected by Hobbies",
    "hero.title": "New Interests, New Connections",
    "hero.description": "Discover hobbies that match your taste and meet like-minded friends on HobbyLink.",
    "hero.start": "Get Started",
    "hero.learnMore": "Learn More",

    // Features
    "features.matching.badge": "Interest-Based Matching",
    "features.matching.title": "Personalized Interest Discovery",
    "features.matching.description":
      "From art, gaming, sports to outdoor activities. Easily find tailored communities for everything you love.",
    "features.matching.cta": "Explore Hobbies",

    "features.community.badge": "Trusted Community",
    "features.community.title": "Trusted Community",
    "features.community.description":
      "Our AI reputation system evaluates user activity to create a safe meeting environment. Meet new friends with confidence.",
    "features.community.cta": "Explore Community",

    // Stats
    "stats.title": "Growing Together",
    "stats.description": "Thousands of users are already making new friends on HobbyLink",
    "stats.users": "Active Users",
    "stats.categories": "Interest Categories",
    "stats.meetings": "Successful Meetings",

    // CTA
    "cta.title": "Start Today",
    "cta.description": "Sign up for free and meet people who share your hobbies",
    "cta.button": "Get Started Free",

    // Footer
    "footer.product": "Product",
    "footer.features": "Features",
    "footer.pricing": "Pricing",
    "footer.faq": "FAQ",
    "footer.company": "Company",
    "footer.about": "About",
    "footer.blog": "Blog",
    "footer.careers": "Careers",
    "footer.support": "Support",
    "footer.help": "Help Center",
    "footer.contact": "Contact",
    "footer.status": "Status",
    "footer.legal": "Legal",
    "footer.privacy": "Privacy Policy",
    "footer.terms": "Terms of Service",
    "footer.cookies": "Cookie Policy",
    "footer.rights": "All rights reserved.",

    // Navigation
    "nav.explore": "Explore",
    "nav.matching": "Matching",
    "nav.community": "Community",

    // Explore Page
    "explore.title": "Explore Interests",
    "explore.description": "Find your community among 500+ hobby categories",
    "explore.search": "Search interests...",
    "explore.all": "All",
    "explore.popular": "Popular",
    "explore.new": "New",
    "explore.filter.all": "All Categories",
    "explore.filter.arts": "Arts & Crafts",
    "explore.filter.sports": "Sports & Fitness",
    "explore.filter.music": "Music",
    "explore.filter.outdoor": "Outdoor",
    "explore.filter.tech": "Tech & Coding",
    "explore.filter.food": "Cooking & Food",
    "explore.filter.games": "Gaming",
    "explore.filter.reading": "Reading & Writing",
    "explore.members": "members",
    "explore.join": "Join",

    // Matching Page
    "matching.title": "Smart Matching",
    "matching.description": "AI analyzes your interests to recommend the perfect friends",
    "matching.score": "Match Score",
    "matching.commonInterests": "Common Interests",
    "matching.location": "Location",
    "matching.pass": "Pass",
    "matching.interested": "Interested",
    "matching.complete.title": "You've seen all recommendations",
    "matching.complete.description": "New recommendations will be updated soon",
    "matching.complete.button": "Back to Start",

    // Community Page
    "community.title": "Community",
    "community.description": "Connect with members and check out upcoming events",
    "community.newPost": "New Post",
    "community.latest": "Latest",
    "community.popular": "Popular",
    "community.following": "Following",
    "community.upcomingEvents": "Upcoming Events",
    "community.monthlyContributors": "Top Contributors",
    "community.posts": "posts",
    "community.viewProfile": "View Profile",
    "community.ago": "ago",
    "community.min": "min",
    "community.hour": "hour",
    "community.day": "day",

    // Auth Pages
    "auth.login.title": "Log In",
    "auth.login.description": "Log in to your account to start using HobbyLink",
    "auth.login.email": "Email",
    "auth.login.password": "Password",
    "auth.login.button": "Log In",
    "auth.login.or": "or",
    "auth.login.google": "Continue with Google",
    "auth.login.github": "Continue with GitHub",
    "auth.login.noAccount": "Don't have an account?",
    "auth.login.signupLink": "Sign up",

    "auth.signup.title": "Sign Up",
    "auth.signup.description": "Sign up for free and meet new friends",
    "auth.signup.name": "Name",
    "auth.signup.email": "Email",
    "auth.signup.password": "Password",
    "auth.signup.button": "Sign Up",
    "auth.signup.or": "or",
    "auth.signup.google": "Sign up with Google",
    "auth.signup.github": "Sign up with GitHub",
    "auth.signup.hasAccount": "Already have an account?",
    "auth.signup.loginLink": "Log in",
  },
}
