import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BulkSuspendForm } from "./bulk-suspend-form"

export default function AdminBulkPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">대량 작업</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          여러 계정에 대해 동시에 조치를 적용합니다. 실수로 인한 피해를 줄이려면 UUID를 정확히 확인하세요.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>일괄 정지</CardTitle>
          <CardDescription>
            사용자 UUID를 한 줄에 하나씩 붙여넣으세요. 최대 500개.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BulkSuspendForm />
        </CardContent>
      </Card>
    </div>
  )
}
