import { describe, expect, it } from "vitest"
import { expandLevelWithCap, swatchClassForColorId } from "@/components/helpers/academy-utils"
import { MAX_EXPANDED_LEVELS } from "@/lib/constants"

describe("expandLevelWithCap", () => {
  it("never exceeds MAX_EXPANDED_LEVELS when adding sequentially", () => {
    let set = new Set<number>()
    const totalAdds = MAX_EXPANDED_LEVELS + 5
    for (let i = 0; i < totalAdds; i++) {
      set = expandLevelWithCap(set, i)
    }
    expect(set.size).toBeLessThanOrEqual(MAX_EXPANDED_LEVELS)
  })

  it("does not grow when level id was already expanded", () => {
    let set = expandLevelWithCap(new Set<string>(), "x")
    set = expandLevelWithCap(set, "x")
    expect(set.size).toBe(1)
  })
})

describe("swatchClassForColorId", () => {
  it("returns a non-empty class string for undefined", () => {
    const cls = swatchClassForColorId(undefined)
    expect(cls.length).toBeGreaterThan(0)
  })
})
