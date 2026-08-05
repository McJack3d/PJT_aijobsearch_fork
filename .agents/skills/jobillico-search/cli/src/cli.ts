#!/usr/bin/env bun
// Self-contained CLI for searching jobs on Jobillico (www.jobillico.com), the
// Québec/Canada job board, in French or English. No external CLI framework and
// zero runtime dependencies, so it runs anywhere `bun` is available.
//
// Personal use only. This reads Jobillico's public pages. Their robots.txt
// disallows crawling paginated results beyond page 1 (see url-reference.md), so
// keep volume low and do not use this commercially or for bulk collection.

import { runSearch, type SearchOpts } from "./commands/search.js"
import { runDetail, type DetailOpts } from "./commands/detail.js"
import type { Lang } from "./helpers.js"

interface Flags {
  _: string[]
  [k: string]: string | boolean | string[]
}

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { _: [] }
  const alias: Record<string, string> = { q: "query", l: "location", n: "limit" }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith("--") || a.startsWith("-")) {
      const key = alias[a.replace(/^-+/, "")] ?? a.replace(/^-+/, "")
      const next = argv[i + 1]
      if (next === undefined || next.startsWith("-")) {
        flags[key] = true
      } else {
        flags[key] = next
        i++
      }
    } else {
      ;(flags._ as string[]).push(a)
    }
  }
  return flags
}

const HELP = `jobillico-cli — search jobs on Jobillico (Québec / Canada, FR + EN)

USAGE
  bun run src/cli.ts search --query "<keywords>" [flags]
  bun run src/cli.ts detail <id|url> [--lang en|fr] [--format json|plain]

SEARCH FLAGS
  --query, -q <text>      Keywords (job title, skill, or role). REQUIRED.
  --location, -l <text>   City name, e.g. "Montreal", "Quebec", "Laval", "Gatineau".
                          Omit to search all of Canada.
  --jobage <days>         Posted within N days. Filtered client-side from each
                          card's date; undated cards are dropped. Default: all.
  --sort <mode>           date | pert (relevance). Defaults to date when
                          --jobage is set, otherwise the portal's relevance sort.
  --lang <en|fr>          Portal language. Default en. Use fr for French postings
                          and French-language keywords.
  --page <n>              1-indexed page. Default 1. NOTE: Jobillico's robots.txt
                          disallows pages beyond 1 — see the warning it prints.
  --limit, -n <n>         Cap results emitted (client-side).
  --format <fmt>          json (default) | table | plain.

EXAMPLES
  bun run src/cli.ts search -q "data analyst" -l "Montreal" --format table
  bun run src/cli.ts search -q "analyste de données" -l "Québec" --lang fr --format table
  bun run src/cli.ts search -q "data engineer" -l "Laval" --jobage 7 --format table
  bun run src/cli.ts search -q "machine learning" --limit 10
  bun run src/cli.ts detail 17338241 --format plain

Personal use only — uses Jobillico's public pages; keep volume low.
`

const LANGS = ["en", "fr"]
const SORTS = ["date", "pert"]

async function main(): Promise<number> {
  const argv = process.argv.slice(2)
  const flags = parseFlags(argv)
  const cmd = (flags._ as string[])[0]

  if (!cmd || flags.help || flags.h) {
    process.stdout.write(HELP)
    return cmd ? 0 : 1
  }

  const lang = typeof flags.lang === "string" ? flags.lang.toLowerCase() : "en"
  if (!LANGS.includes(lang)) {
    process.stderr.write(
      JSON.stringify({ error: `--lang must be en or fr, got "${flags.lang}"`, code: "BAD_ARG" }) +
        "\n",
    )
    return 1
  }

  if (cmd === "search") {
    const query = typeof flags.query === "string" ? flags.query : undefined
    if (!query) {
      process.stderr.write(
        JSON.stringify({
          error:
            'the --query/-q flag is required (e.g. -q "data analyst"). Jobillico\'s robots.txt disallows keyword-less searches.',
          code: "NO_QUERY",
        }) + "\n",
      )
      return 1
    }

    const sort = typeof flags.sort === "string" ? flags.sort.toLowerCase() : undefined
    if (sort !== undefined && !SORTS.includes(sort)) {
      process.stderr.write(
        JSON.stringify({ error: `--sort must be date or pert, got "${flags.sort}"`, code: "BAD_ARG" }) +
          "\n",
      )
      return 1
    }

    const fmt = (flags.format as string) || "json"

    const parseIntFlag = (name: string, raw: string | boolean | string[]): number | null => {
      const val = parseInt(raw as string, 10)
      if (isNaN(val)) {
        process.stderr.write(
          JSON.stringify({ error: `--${name} must be a number, got "${raw}"`, code: "BAD_ARG" }) + "\n",
        )
        return null
      }
      return val
    }

    for (const name of ["jobage", "page", "limit"]) {
      if (flags[name] !== undefined) {
        const v = parseIntFlag(name, flags[name])
        if (v === null) return 1
        flags[name] = String(v)
      }
    }

    const page = flags.page ? Math.max(1, parseInt(flags.page as string, 10)) : 1
    if (page > 1) {
      // Surfaced, not silently bypassed: Jobillico's robots.txt disallows
      // `&ipg=` beyond page 1. Warn on stderr so stdout stays machine-readable.
      process.stderr.write(
        `warning: Jobillico's robots.txt disallows result pages beyond page 1 ` +
          `(Disallow: /*&ipg=, Allow: /*&ipg=1). Requesting page ${page} anyway — ` +
          `personal use only, keep volume low.\n`,
      )
    }

    const opts: SearchOpts = {
      query,
      location: typeof flags.location === "string" ? flags.location : undefined,
      jobage: flags.jobage ? parseInt(flags.jobage as string, 10) : 9999,
      sort,
      lang: lang as Lang,
      page,
      limit: flags.limit ? parseInt(flags.limit as string, 10) : undefined,
      format: (["json", "table", "plain"].includes(fmt) ? fmt : "json") as SearchOpts["format"],
    }
    return runSearch(opts)
  }

  if (cmd === "detail") {
    const id = (flags._ as string[])[1]
    if (!id) {
      process.stderr.write(
        JSON.stringify({ error: "detail requires an <id|url>", code: "NO_ID" }) + "\n",
      )
      return 1
    }
    const fmt = (flags.format as string) || "json"
    const opts: DetailOpts = {
      id,
      lang: lang as Lang,
      format: (fmt === "plain" ? "plain" : "json") as DetailOpts["format"],
    }
    return runDetail(opts)
  }

  process.stderr.write(JSON.stringify({ error: `Unknown command "${cmd}"`, code: "BAD_CMD" }) + "\n")
  return 1
}

main().then((code) => process.exit(code))
