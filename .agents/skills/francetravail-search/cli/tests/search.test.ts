import { describe, expect, test } from "bun:test"
import { runCLI, parseJSON, hasCredentials } from "./helpers.js"

interface SearchOutput {
  meta: { count: number; page: number; total: number | null; location: string | null }
  results: {
    id: string
    title: string
    company: string | null
    location: string | null
    date: string | null
    url: string
  }[]
}

const credentialed = await hasCredentials()

/**
 * Live smoke tests against the France Travail API. They self-skip when no
 * credentials are configured so `bun test` stays green on a fresh clone.
 */
describe.if(credentialed)("live search", () => {
  test("returns real results for 'data analyst' in Paris", async () => {
    const result = await runCLI(["search", "-q", "data analyst", "-l", "Paris", "--limit", "5"])
    const output = parseJSON<SearchOutput>(result)

    expect(result.exitCode).toBe(0)
    expect(output.results.length).toBeGreaterThan(0)
    expect(output.results.length).toBeLessThanOrEqual(5)
    expect(output.meta.page).toBe(1)

    for (const offer of output.results) {
      expect(offer.id).toBeTruthy()
      expect(offer.title).toBeTruthy()
      expect(offer.url).toStartWith("http")
      // Titles must be text, not markup or an empty shell.
      expect(offer.title).not.toContain("<")
    }
  })

  test("honours --limit exactly", async () => {
    const result = await runCLI(["search", "-q", "data", "-l", "Paris", "--limit", "3"])
    const output = parseJSON<SearchOutput>(result)
    expect(output.results.length).toBeLessThanOrEqual(3)
    expect(output.meta.count).toBe(output.results.length)
  })

  test("table format renders a header and rows", async () => {
    const result = await runCLI(["search", "-q", "data analyst", "-l", "Paris", "--limit", "3", "--format", "table"])
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain("TITRE")
    expect(result.stdout).toContain("ENTREPRISE")
  })

  test("resolves a commune name to an INSEE code", async () => {
    const result = await runCLI(["search", "-q", "data", "-l", "Lyon", "--limit", "2"])
    const output = parseJSON<SearchOutput>(result)
    expect(output.meta.location).toContain("69123")
  })

  test("detail returns readable text for a real offer", async () => {
    const search = await runCLI(["search", "-q", "data analyst", "-l", "Paris", "--limit", "1"])
    const output = parseJSON<SearchOutput>(search)
    expect(output.results.length).toBeGreaterThan(0)

    const id = output.results[0].id
    const detail = await runCLI(["detail", id, "--format", "plain"])
    expect(detail.exitCode).toBe(0)
    expect(detail.stdout.length).toBeGreaterThan(50)
    // Entities decoded and tags stripped.
    expect(detail.stdout).not.toContain("&amp;")
    expect(detail.stdout).not.toMatch(/<[a-z/][^>]*>/i)
  })

  test("an unknown offer id exits 1 with NOT_FOUND", async () => {
    const result = await runCLI(["detail", "ZZZZ999"])
    expect(result.exitCode).toBe(1)
    expect(result.stdout).toBe("")
    expect(JSON.parse(result.stderr).code).toBe("NOT_FOUND")
  })
})

describe.if(!credentialed)("live search (skipped)", () => {
  test("missing credentials exit 1 with NO_CREDENTIALS", async () => {
    const result = await runCLI(["search", "-q", "data analyst", "-l", "Paris"])
    expect(result.exitCode).toBe(1)
    expect(result.stdout).toBe("")
    const err = JSON.parse(result.stderr)
    expect(err.code).toBe("NO_CREDENTIALS")
    expect(err.error).toContain("francetravail.io")
  })
})
