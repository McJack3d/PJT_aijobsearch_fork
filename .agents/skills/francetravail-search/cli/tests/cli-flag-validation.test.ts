import { describe, expect, test } from "bun:test"
import { runCLI } from "./helpers.js"

/**
 * These tests never reach the network: every case fails during argument
 * validation, before credentials are loaded.
 */
describe("CLI argument validation", () => {
  test("no arguments prints help and exits 1", async () => {
    const result = await runCLI([])
    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain("francetravail-cli")
  })

  test("--help exits 0 with usage on stdout", async () => {
    const result = await runCLI(["search", "--help"])
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain("SEARCH FLAGS")
    expect(result.stderr).toBe("")
  })

  test("unknown command errors as JSON on stderr", async () => {
    const result = await runCLI(["frobnicate"])
    expect(result.exitCode).toBe(1)
    expect(result.stdout).toBe("")
    const err = JSON.parse(result.stderr)
    expect(err.code).toBe("BAD_CMD")
    expect(err.error).toContain("frobnicate")
  })

  test("unknown flag is rejected rather than ignored", async () => {
    const result = await runCLI(["search", "-q", "data analyst", "--nope", "1"])
    expect(result.exitCode).toBe(1)
    const err = JSON.parse(result.stderr)
    expect(err.code).toBe("BAD_FLAG")
  })

  test("search with no criteria exits 1", async () => {
    const result = await runCLI(["search"])
    expect(result.exitCode).toBe(1)
    const err = JSON.parse(result.stderr)
    expect(err.code).toBe("NO_CRITERIA")
  })

  test("non-numeric --limit exits 1 with BAD_ARG", async () => {
    const result = await runCLI(["search", "-q", "data analyst", "--limit", "beaucoup"])
    expect(result.exitCode).toBe(1)
    const err = JSON.parse(result.stderr)
    expect(err.code).toBe("BAD_ARG")
    expect(err.error).toContain("--limit")
  })

  test("invalid --sort exits 1", async () => {
    const result = await runCLI(["search", "-q", "data", "--sort", "salaire"])
    expect(result.exitCode).toBe(1)
    expect(JSON.parse(result.stderr).code).toBe("BAD_ARG")
  })

  test("invalid --experience exits 1", async () => {
    const result = await runCLI(["search", "-q", "data", "--experience", "9"])
    expect(result.exitCode).toBe(1)
    expect(JSON.parse(result.stderr).code).toBe("BAD_ARG")
  })

  test("detail without an id exits 1 with NO_ID", async () => {
    const result = await runCLI(["detail"])
    expect(result.exitCode).toBe(1)
    expect(JSON.parse(result.stderr).code).toBe("NO_ID")
  })

  test("errors are never written to stdout", async () => {
    for (const args of [["frobnicate"], ["search"], ["detail"]]) {
      const result = await runCLI(args)
      expect(result.stdout).toBe("")
    }
  })
})
