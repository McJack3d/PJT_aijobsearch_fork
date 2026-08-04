import { describe, expect, test } from "bun:test"
import { buildUrl, type SearchOpts } from "../src/commands/search.js"

/**
 * Verifies the search URL against the documented parameter names. These run
 * offline: every case here uses --departement/--region, which need no commune
 * lookup, so no token is ever used.
 */
const base: SearchOpts = { page: 1, format: "json" }

async function params(opts: Partial<SearchOpts>): Promise<URLSearchParams> {
  const { url } = await buildUrl({ ...base, ...opts }, "unused-token")
  return new URL(url).searchParams
}

describe("search URL construction", () => {
  test("targets the documented v2 search endpoint", async () => {
    const { url } = await buildUrl({ ...base, departement: "75" }, "unused-token")
    expect(url).toStartWith(
      "https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search?",
    )
  })

  test("maps the query to motsCles", async () => {
    const p = await params({ query: "data analyst", departement: "75" })
    expect(p.get("motsCles")).toBe("data analyst")
  })

  test("maps departement and uppercases Corsican codes", async () => {
    expect((await params({ departement: "75" })).get("departement")).toBe("75")
    expect((await params({ departement: "2a" })).get("departement")).toBe("2A")
  })

  test("maps region", async () => {
    expect((await params({ region: "11" })).get("region")).toBe("11")
  })

  test("snaps jobage onto publieeDepuis", async () => {
    expect((await params({ departement: "75", jobage: 5 })).get("publieeDepuis")).toBe("7")
    expect((await params({ departement: "75", jobage: 90 })).get("publieeDepuis")).toBeNull()
  })

  test("maps contract, experience and alternance", async () => {
    const p = await params({
      departement: "75",
      contract: "cdi",
      experience: "1",
      alternance: true,
    })
    expect(p.get("typeContrat")).toBe("CDI")
    expect(p.get("experience")).toBe("1")
    expect(p.get("alternance")).toBe("true")
  })

  test("maps sort names to numeric codes", async () => {
    expect((await params({ departement: "75", sort: "date" })).get("sort")).toBe("1")
  })

  test("builds the range window from page and limit", async () => {
    expect((await params({ departement: "75" })).get("range")).toBe("0-49")
    expect((await params({ departement: "75", page: 2, limit: 10 })).get("range")).toBe("10-19")
    // The API caps a window at 150 results.
    expect((await params({ departement: "75", limit: 400 })).get("range")).toBe("0-149")
  })

  test("drops distance when no commune is set (it would be meaningless)", async () => {
    expect((await params({ departement: "75", distance: 30 })).get("distance")).toBeNull()
  })

  test("omits every filter that was not requested", async () => {
    const p = await params({ query: "data", departement: "75" })
    for (const key of ["typeContrat", "experience", "alternance", "publieeDepuis", "sort", "commune", "region"]) {
      expect(p.get(key)).toBeNull()
    }
  })
})
