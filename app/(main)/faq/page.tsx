import type { Metadata } from "next"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export const metadata: Metadata = {
  title: "자주 묻는 질문",
}

const faqs = [
  {
    q: "HobbyLink는 유료인가요?",
    a: "기본 기능은 무료로 이용할 수 있습니다. 프리미엄 티어는 준비 중이며 /pricing 페이지에서 비교할 수 있습니다.",
  },
  {
    q: "매칭은 어떻게 이루어지나요?",
    a: "관심사(취미)를 공유하는 사람 중 서로 관심을 표현하면 매칭이 성사됩니다. 매칭 후 메시지를 주고받을 수 있어요.",
  },
  {
    q: "오프라인 모임은 안전한가요?",
    a: "모든 사용자는 신고·차단 기능을 이용할 수 있고, 이상 행동이 반복되면 계정이 정지됩니다. 공공장소에서 만나는 것을 권장합니다.",
  },
  {
    q: "계정을 삭제하고 싶어요.",
    a: "설정 페이지 하단의 '계정 삭제'를 이용하세요. 모든 데이터가 영구적으로 삭제됩니다.",
  },
]

export default function FaqPage() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">자주 묻는 질문</h1>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </main>
  )
}
