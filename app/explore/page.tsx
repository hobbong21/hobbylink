import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Heart,
  Users,
  Search,
  TrendingUp,
  Palette,
  Gamepad2,
  Music,
  Camera,
  Book,
  Dumbbell,
  Plane,
  Coffee,
  Code,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const categories = [
  { name: "전체", icon: Sparkles, count: 500 },
  { name: "예술", icon: Palette, count: 85 },
  { name: "게임", icon: Gamepad2, count: 120 },
  { name: "음악", icon: Music, count: 95 },
  { name: "사진", icon: Camera, count: 70 },
  { name: "독서", icon: Book, count: 60 },
  { name: "운동", icon: Dumbbell, count: 110 },
  { name: "여행", icon: Plane, count: 80 },
  { name: "요리", icon: Coffee, count: 65 },
  { name: "개발", icon: Code, count: 90 },
]

const trendingHobbies = [
  {
    id: 1,
    title: "수채화 그리기",
    category: "예술",
    members: 1234,
    image: "/watercolor-painting-still-life.png",
    description: "수채화의 아름다움을 함께 탐구해요",
    trending: true,
  },
  {
    id: 2,
    title: "보드게임 모임",
    category: "게임",
    members: 2156,
    image: "/diverse-board-game-gathering.png",
    description: "다양한 보드게임을 즐기는 모임",
    trending: true,
  },
  {
    id: 3,
    title: "기타 연주",
    category: "음악",
    members: 1876,
    image: "/person-playing-acoustic-guitar.png",
    description: "기타로 음악을 만들어가요",
    trending: true,
  },
  {
    id: 4,
    title: "등산 동호회",
    category: "운동",
    members: 3421,
    image: "/mountain-hikers.png",
    description: "주말마다 산을 오르는 즐거움",
    trending: false,
  },
  {
    id: 5,
    title: "사진 촬영",
    category: "사진",
    members: 1654,
    image: "/classic-photography-camera.png",
    description: "순간을 포착하는 사진작가들",
    trending: false,
  },
  {
    id: 6,
    title: "독서 클럽",
    category: "독서",
    members: 987,
    image: "/book-reading-club.jpg",
    description: "함께 읽고 토론하는 독서 모임",
    trending: false,
  },
  {
    id: 7,
    title: "베이킹",
    category: "요리",
    members: 2341,
    image: "/baking-bread.png",
    description: "맛있는 빵과 디저트 만들기",
    trending: true,
  },
  {
    id: 8,
    title: "웹 개발",
    category: "개발",
    members: 1543,
    image: "/web-development-coding.png",
    description: "함께 성장하는 개발자 커뮤니티",
    trending: false,
  },
]

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image src="/hobbylink-logo.png" alt="HobbyLink" width={120} height={40} className="h-10 w-auto" priority />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/explore" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              탐색
            </Link>
            <Link
              href="/matching"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
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
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">관심사 탐색하기</h1>
            <p className="text-lg text-muted-foreground mb-8 text-pretty">
              500개 이상의 다양한 취미와 관심사를 발견하고, 당신과 같은 열정을 가진 사람들을 만나보세요
            </p>
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input type="search" placeholder="관심사 검색..." className="pl-12 h-12 text-base" />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <Button
                  key={category.name}
                  variant={category.name === "전체" ? "default" : "outline"}
                  className="flex-shrink-0 gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {category.name}
                  <Badge variant="secondary" className="ml-1">
                    {category.count}
                  </Badge>
                </Button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="trending" className="w-full">
            <div className="flex items-center justify-between mb-8">
              <TabsList>
                <TabsTrigger value="trending" className="gap-2">
                  <TrendingUp className="w-4 h-4" />
                  인기 급상승
                </TabsTrigger>
                <TabsTrigger value="all" className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  전체 보기
                </TabsTrigger>
                <TabsTrigger value="new" className="gap-2">
                  <Users className="w-4 h-4" />
                  신규 모임
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="trending" className="mt-0">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {trendingHobbies
                  .filter((hobby) => hobby.trending)
                  .map((hobby) => (
                    <Card key={hobby.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                      <div className="relative aspect-video overflow-hidden">
                        <Image
                          src={hobby.image || "/placeholder.svg"}
                          alt={hobby.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        />
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-red-500 text-white border-0">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            인기
                          </Badge>
                        </div>
                      </div>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <CardTitle className="text-lg">{hobby.title}</CardTitle>
                          <Badge variant="secondary" className="flex-shrink-0">
                            {hobby.category}
                          </Badge>
                        </div>
                        <CardDescription className="line-clamp-2">{hobby.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span>{hobby.members.toLocaleString()}명</span>
                          </div>
                          <Button size="sm" variant="ghost" className="gap-2">
                            <Heart className="w-4 h-4" />
                            관심
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="all" className="mt-0">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {trendingHobbies.map((hobby) => (
                  <Card key={hobby.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                    <div className="relative aspect-video overflow-hidden">
                      <Image
                        src={hobby.image || "/placeholder.svg"}
                        alt={hobby.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                      />
                      {hobby.trending && (
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-red-500 text-white border-0">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            인기
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <CardTitle className="text-lg">{hobby.title}</CardTitle>
                        <Badge variant="secondary" className="flex-shrink-0">
                          {hobby.category}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">{hobby.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{hobby.members.toLocaleString()}명</span>
                        </div>
                        <Button size="sm" variant="ghost" className="gap-2">
                          <Heart className="w-4 h-4" />
                          관심
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="new" className="mt-0">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {trendingHobbies.slice(0, 4).map((hobby) => (
                  <Card key={hobby.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                    <div className="relative aspect-video overflow-hidden">
                      <Image
                        src={hobby.image || "/placeholder.svg"}
                        alt={hobby.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                      />
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-green-500 text-white border-0">NEW</Badge>
                      </div>
                    </div>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <CardTitle className="text-lg">{hobby.title}</CardTitle>
                        <Badge variant="secondary" className="flex-shrink-0">
                          {hobby.category}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">{hobby.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{hobby.members.toLocaleString()}명</span>
                        </div>
                        <Button size="sm" variant="ghost" className="gap-2">
                          <Heart className="w-4 h-4" />
                          관심
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <Card className="max-w-3xl mx-auto border-2">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">마음에 드는 취미를 찾으셨나요?</h2>
              <p className="text-muted-foreground mb-6">지금 가입하고 당신과 같은 관심사를 가진 사람들과 연결되세요</p>
              <Button size="lg" asChild>
                <Link href="/signup">무료로 시작하기</Link>
              </Button>
            </CardContent>
          </Card>
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
