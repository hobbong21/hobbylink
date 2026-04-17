import { describe, it, expect } from "vitest"
import { extractHashtags } from "@/lib/tags"

describe("extractHashtags", () => {
  it("finds Korean and English hashtags", () => {
    expect(extractHashtags("주말에 #등산 #hiking 가요")).toEqual(["등산", "hiking"])
  })

  it("deduplicates", () => {
    expect(extractHashtags("#등산 #등산 #HIKING #hiking")).toEqual(["등산", "hiking"])
  })

  it("returns empty array for text without hashtags", () => {
    expect(extractHashtags("no hashtags here")).toEqual([])
  })

  it("ignores bare # symbols", () => {
    expect(extractHashtags("# is not a tag, but #tag is")).toEqual(["tag"])
  })
})
