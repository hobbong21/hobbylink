"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, X, MapPin, Star, Users, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import Image from "next/image"

const matchSuggestions = [
  {
    id: 1,
    name: "김민지",
    age: 28,
    location: "서울 강남구",
    avatar: "/placeholder-user.jpg",
    interests: ["수채화", "사진", "카페 투어"],
    bio: "주말마다 새로운 카페를 찾아다니며 수채화를 그리는 것을 좋아해요. 함께 그림 그리실 분 찾아요!",
    matchScore: 92,
    commonInterests: 3,
  },
  {
    id: 2,
    name: "이준호",
    age: 32,
    location: "서울 마포구",
    avatar: "/placeholder-user.jpg",
    interests: ["등산", "사진", "캠핑"],
    bio: "자연을 사랑하는 아웃도어 마니아입니다. 주말 등산 메이트 구해요!",
    matchScore: 88,
    commonInterests: 2,
  },
  {
    id: 3,
    name: "박서연",
    age: 26,
    location: "서울 송파구",
    avatar: "/placeholder-user.jpg",
    interests: ["독서", "글쓰기", "영화"],
    bio: "책과 영화를 사랑하는 감성파입니다. 함께 독서 모임 하실 분 환영해요.",
    matchScore: 85,
    commonInterests: 2,
  },
]

export default function MatchingPage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [matches, setMatches] = useState<number[]>([])

  const currentMatch = matchSuggestions[currentIndex]

  const handleLike = () => {
    setMatches([...matches, currentMatch.id])
    if (currentIndex < matchSuggestions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePass = () => {
    if (currentIndex < matchSuggestions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image src="/hobbylink-logo.png" alt="HobbyLink" width={120} height={40} className="h-10 w-auto" priority />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/explore"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              탐색
            </Link>
            <Link href="/matching" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              매칭
            </Link>
            <Link
              href="/community"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              커뮤니티
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/login">로그인</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">회원가입</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-muted/50 to-background py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-4 text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              <span>AI 기반 스마트 매칭</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">당신을 위한 완벽한 매칭</h1>
            <p className="text-lg text-muted-foreground text-pretty">
              AI가 분석한 관심사와 성향을 바탕으로 가장 잘 맞는 사람들을 추천해드립니다
            </p>
          </div>
        </div>
      </section>

      {/* Matching Stats */}
      <section className="py-8 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {matches.length}
              </div>
              <div className="text-sm text-muted-foreground">오늘의 매칭</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {matchSuggestions.length - currentIndex}
              </div>
              <div className="text-sm text-muted-foreground">남은 추천</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">92%</div>
              <div className="text-sm text-muted-foreground">평균 매칭률</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Matching Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {currentIndex < matchSuggestions.length ? (
            <div className="max-w-2xl mx-auto">
              <Card className="overflow-hidden border-2 shadow-xl">
                {/* Match Score */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 fill-current" />
                      <span className="font-semibold">매칭 점수</span>
                    </div>
                    <span className="text-2xl font-bold">{currentMatch.matchScore}%</span>
                  </div>
                  <Progress value={currentMatch.matchScore} className="h-2 bg-white/20" />
                </div>

                {/* Profile Image */}
                <div className="relative aspect-[3/4] bg-muted">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Avatar className="w-64 h-64">
                      <AvatarImage src={currentMatch.avatar || "/placeholder.svg"} alt={currentMatch.name} />
                      <AvatarFallback className="text-6xl">{currentMatch.name[0]}</AvatarFallback>
                    </Avatar>
                  </div>
                </div>

                {/* Profile Info */}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl mb-2">
                        {currentMatch.name}, {currentMatch.age}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-muted-foreground mb-3">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{currentMatch.location}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      <Users className="w-3 h-3" />
                      {currentMatch.commonInterests}개 공통
                    </Badge>
                  </div>
                  <CardDescription className="text-base leading-relaxed">{currentMatch.bio}</CardDescription>
                </CardHeader>

                {/* Interests */}
                <CardContent>
                  <div className="mb-6">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      관심사
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {currentMatch.interests.map((interest, index) => (
                        <Badge key={index} variant="outline" className="text-sm">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex-1 gap-2 h-14 text-base border-2 bg-transparent"
                      onClick={handlePass}
                    >
                      <X className="w-5 h-5" />
                      패스
                    </Button>
                    <Button size="lg" className="flex-1 gap-2 h-14 text-base" onClick={handleLike}>
                      <Heart className="w-5 h-5" />
                      관심 있어요
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Progress Indicator */}
              <div className="mt-6 text-center text-sm text-muted-foreground">
                {currentIndex + 1} / {matchSuggestions.length}
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <Card className="border-2">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold mb-3">모든 추천을 확인했어요!</h2>
                  <p className="text-muted-foreground mb-6">
                    {matches.length}명과 매칭되었습니다. 내일 새로운 추천을 받아보세요.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button size="lg" asChild>
                      <Link href="/matches">
                        매칭 목록 보기
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                      <Link href="/explore">더 탐색하기</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">매칭은 어떻게 이루어지나요?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle>1. AI 분석</CardTitle>
                  <CardDescription>당신의 관심사, 활동 패턴, 선호도를 AI가 종합적으로 분석합니다</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle>2. 스마트 추천</CardTitle>
                  <CardDescription>가장 잘 맞는 사람들을 매칭 점수와 함께 추천해드립니다</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                    <Heart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle>3. 연결</CardTitle>
                  <CardDescription>서로 관심을 표현하면 즉시 대화를 시작할 수 있습니다</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} HobbyLink. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
