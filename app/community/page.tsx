import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageCircle, Users, TrendingUp, Calendar, Clock, Star, ThumbsUp, Share2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const posts = [
  {
    id: 1,
    author: {
      name: "김민지",
      avatar: "/placeholder-user.jpg",
      reputation: 4.8,
    },
    category: "예술",
    title: "홍대에서 수채화 모임 했어요!",
    content:
      "오늘 홍대에서 수채화 모임을 가졌는데 정말 즐거웠어요. 다들 실력이 좋으셔서 많이 배웠습니다. 다음 주에도 또 만나기로 했어요!",
    image: "/watercolor-painting-still-life.png",
    likes: 124,
    comments: 18,
    timestamp: "2시간 전",
    tags: ["수채화", "홍대", "모임후기"],
  },
  {
    id: 2,
    author: {
      name: "이준호",
      avatar: "/placeholder-user.jpg",
      reputation: 4.9,
    },
    category: "운동",
    title: "북한산 등산 메이트 모집합니다",
    content:
      "이번 주말 북한산 등산 가실 분 계신가요? 초보자도 환영합니다. 천천히 올라가면서 사진도 찍고 즐겁게 다녀올 예정입니다.",
    image: "/mountain-hikers.png",
    likes: 89,
    comments: 32,
    timestamp: "5시간 전",
    tags: ["등산", "북한산", "주말"],
  },
  {
    id: 3,
    author: {
      name: "박서연",
      avatar: "/placeholder-user.jpg",
      reputation: 4.7,
    },
    category: "독서",
    title: "이번 달 독서 모임 책 추천받아요",
    content: "다음 달 독서 모임에서 읽을 책을 정하려고 합니다. 추천하고 싶은 책이 있으신가요? 장르는 상관없어요!",
    image: "/book-reading-club.jpg",
    likes: 67,
    comments: 45,
    timestamp: "1일 전",
    tags: ["독서", "책추천", "모임"],
  },
]

const upcomingEvents = [
  {
    id: 1,
    title: "주말 보드게임 모임",
    category: "게임",
    date: "2025년 1월 25일",
    time: "오후 2:00",
    location: "강남구 보드게임 카페",
    participants: 8,
    maxParticipants: 12,
    image: "/diverse-board-game-gathering.png",
  },
  {
    id: 2,
    title: "기타 연주 세션",
    category: "음악",
    date: "2025년 1월 26일",
    time: "오후 7:00",
    location: "홍대 음악 스튜디오",
    participants: 5,
    maxParticipants: 8,
    image: "/person-playing-acoustic-guitar.png",
  },
  {
    id: 3,
    title: "베이킹 클래스",
    category: "요리",
    date: "2025년 1월 27일",
    time: "오전 10:00",
    location: "마포구 베이킹 스튜디오",
    participants: 10,
    maxParticipants: 15,
    image: "/baking-bread.png",
  },
]

const topMembers = [
  {
    name: "김민지",
    avatar: "/placeholder-user.jpg",
    reputation: 4.9,
    posts: 156,
    interests: ["예술", "사진"],
  },
  {
    name: "이준호",
    avatar: "/placeholder-user.jpg",
    reputation: 4.8,
    posts: 142,
    interests: ["운동", "등산"],
  },
  {
    name: "박서연",
    avatar: "/placeholder-user.jpg",
    reputation: 4.7,
    posts: 128,
    interests: ["독서", "글쓰기"],
  },
]

export default function CommunityPage() {
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
            <Link
              href="/matching"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              매칭
            </Link>
            <Link
              href="/community"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
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
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">커뮤니티</h1>
            <p className="text-lg text-muted-foreground mb-6 text-pretty">
              취미를 공유하고, 경험을 나누며, 함께 성장하는 공간입니다
            </p>
            <Button size="lg">
              <MessageCircle className="mr-2 w-5 h-5" />새 글 작성하기
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Feed */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="recent" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="recent">최신</TabsTrigger>
                  <TabsTrigger value="popular">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    인기
                  </TabsTrigger>
                  <TabsTrigger value="following">팔로잉</TabsTrigger>
                </TabsList>

                <TabsContent value="recent" className="mt-0 space-y-6">
                  {posts.map((post) => (
                    <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      {/* Post Header */}
                      <CardHeader>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={post.author.avatar || "/placeholder.svg"} alt={post.author.name} />
                              <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{post.author.name}</p>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  <span>{post.author.reputation}</span>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground">{post.timestamp}</p>
                            </div>
                          </div>
                          <Badge variant="secondary">{post.category}</Badge>
                        </div>
                        <CardTitle className="text-xl mb-2">{post.title}</CardTitle>
                        <CardDescription className="text-base leading-relaxed">{post.content}</CardDescription>
                      </CardHeader>

                      {/* Post Image */}
                      {post.image && (
                        <div className="relative aspect-video">
                          <Image
                            src={post.image || "/placeholder.svg"}
                            alt={post.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 100vw, 66vw"
                          />
                        </div>
                      )}

                      {/* Post Footer */}
                      <CardContent className="pt-4">
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-4">
                          <Button variant="ghost" size="sm" className="gap-2">
                            <ThumbsUp className="w-4 h-4" />
                            <span>{post.likes}</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-2">
                            <MessageCircle className="w-4 h-4" />
                            <span>{post.comments}</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-2 ml-auto">
                            <Share2 className="w-4 h-4" />
                            공유
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="popular" className="mt-0 space-y-6">
                  {posts
                    .sort((a, b) => b.likes - a.likes)
                    .map((post) => (
                      <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={post.author.avatar || "/placeholder.svg"} alt={post.author.name} />
                                <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold">{post.author.name}</p>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    <span>{post.author.reputation}</span>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground">{post.timestamp}</p>
                              </div>
                            </div>
                            <Badge variant="secondary">{post.category}</Badge>
                          </div>
                          <CardTitle className="text-xl mb-2">{post.title}</CardTitle>
                          <CardDescription className="text-base leading-relaxed">{post.content}</CardDescription>
                        </CardHeader>
                        {post.image && (
                          <div className="relative aspect-video">
                            <Image
                              src={post.image || "/placeholder.svg"}
                              alt={post.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 1024px) 100vw, 66vw"
                            />
                          </div>
                        )}
                        <CardContent className="pt-4">
                          <div className="flex flex-wrap gap-2 mb-4">
                            {post.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" className="gap-2">
                              <ThumbsUp className="w-4 h-4" />
                              <span>{post.likes}</span>
                            </Button>
                            <Button variant="ghost" size="sm" className="gap-2">
                              <MessageCircle className="w-4 h-4" />
                              <span>{post.comments}</span>
                            </Button>
                            <Button variant="ghost" size="sm" className="gap-2 ml-auto">
                              <Share2 className="w-4 h-4" />
                              공유
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </TabsContent>

                <TabsContent value="following" className="mt-0">
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">팔로우한 사용자가 없습니다</h3>
                      <p className="text-muted-foreground mb-4">관심있는 사용자를 팔로우하고 소식을 받아보세요</p>
                      <Button asChild>
                        <Link href="/explore">사용자 탐색하기</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Upcoming Events */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    다가오는 이벤트
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex gap-3 pb-4 border-b last:border-0 last:pb-0">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={event.image || "/placeholder.svg"}
                          alt={event.title}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm mb-1 truncate">{event.title}</h4>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{event.date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{event.time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>
                              {event.participants}/{event.maxParticipants}명
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full bg-transparent" asChild>
                    <Link href="/events">모든 이벤트 보기</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Top Members */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    이달의 활동가
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {topMembers.map((member, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                          <AvatarFallback>{member.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{member.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span>{member.reputation}</span>
                          </div>
                          <span>•</span>
                          <span>{member.posts} 게시글</span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        팔로우
                      </Button>
                    </div>
                  ))}
                </CardContent>
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
