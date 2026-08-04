#!/usr/bin/env bun
// Self-contained CLI for the France Travail (ex-Pôle emploi) "Offres d'emploi v2"
// API — the official public job-offer API for the French market. No external CLI
// framework and zero runtime dependencies, so it runs anywhere `bun` is available.
//
// Requires API credentials (free): create an application at https://francetravail.io,
// subscribe it to "Offres d'emploi v2", then set FRANCETRAVAIL_CLIENT_ID and
// FRANCETRAVAIL_CLIENT_SECRET in the environment or a .env file next to this CLI.

import { runSearch, type SearchOpts } from "./commands/search.js"
import { runDetail, type DetailOpts } from "./commands/detail.js"

interface Flags {
  _: string[]
  [k: string]: string | boolean | string[]
}

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { _: [] }
  const alias: Record<string, string> = {
    q: "query",
    l: "location",
    n: "limit",
    d: "departement",
  }
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

const KNOWN_SEARCH_FLAGS = new Set([
  "query",
  "location",
  "departement",
  "region",
  "distance",
  "jobage",
  "contract",
  "experience",
  "alternance",
  "sort",
  "page",
  "limit",
  "format",
  "help",
  "h",
])

const KNOWN_DETAIL_FLAGS = new Set(["format", "help", "h"])

const HELP = `francetravail-cli — search French job offers via the official France Travail API

USAGE
  bun run src/cli.ts search [flags]
  bun run src/cli.ts detail <id|url> [--format json|plain]

SEARCH FLAGS
  --query, -q <text>       Keywords (job title, skill, company). e.g. "data analyst"
  --location, -l <place>   Commune name, INSEE code, or département number.
                           e.g. "Paris", "69123", "75". Names are resolved against
                           the official commune referential.
  --departement, -d <n>    Département code (75, 92, 2A, 971). Overrides --location.
  --region <code>          Région code (11 = Île-de-France, 84 = Auvergne-Rhône-Alpes).
  --distance <km>          Radius around the commune (default 10). Needs --location.
  --jobage <days>          Posted within N days. Snapped to 1, 3, 7, 14 or 31.
  --contract <type>        CDI, CDD, MIS (intérim), SAI (saisonnier), LIB, FRA…
  --experience <1|2|3>     1 = <1 an, 2 = 1–3 ans, 3 = >3 ans.
  --alternance             Only apprenticeship / work-study offers.
  --sort <mode>            relevance (default) | date | distance.
  --page <n>               1-indexed page. Default 1.
  --limit, -n <n>          Cap results (also sets page size, max 150).
  --format <fmt>           json (default) | table | plain.

DETAIL FLAGS
  --format <fmt>           json (default) | plain.

EXAMPLES
  bun run src/cli.ts search -q "data analyst" -l "Paris" --format table
  bun run src/cli.ts search -q "data scientist" -l "Paris" --distance 30 --jobage 7 --format table
  bun run src/cli.ts search -q "ingénieur données" -d 92 --contract CDI --format table
  bun run src/cli.ts search -q "machine learning" --region 11 --sort date -n 20
  bun run src/cli.ts search -q "analyste crédit" -l "Lyon" --alternance --format plain
  bun run src/cli.ts detail 190RSQK --format plain

CREDENTIALS
  FRANCETRAVAIL_CLIENT_ID and FRANCETRAVAIL_CLIENT_SECRET must be set (environment
  or a .env file in this cli/ directory). Register free at https://francetravail.io.
`

function badArg(message: string, code = "BAD_ARG"): number {
  process.stderr.write(JSON.stringify({ error: message, code }) + "\n")
  return 1
}

function parseIntFlag(name: string, raw: string | boolean | string[]): number | null {
  const val = parseInt(raw as string, 10)
  if (isNaN(val)) {
    badArg(`--${name} must be a number, got "${String(raw)}"`)
    return null
  }
  return val
}

/** Reject unknown flags so typos fail loudly instead of being silently ignored. */
function rejectUnknown(flags: Flags, known: Set<string>): string | null {
  for (const key of Object.keys(flags)) {
    if (key === "_") continue
    if (!known.has(key)) return key
  }
  return null
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2)
  const flags = parseFlags(argv)
  const cmd = (flags._ as string[])[0]

  if (!cmd || flags.help || flags.h) {
    process.stdout.write(HELP)
    return cmd ? 0 : 1
  }

  if (cmd === "search") {
    const unknown = rejectUnknown(flags, KNOWN_SEARCH_FLAGS)
    if (unknown) return badArg(`Unknown flag "--${unknown}"`, "BAD_FLAG")

    if (!flags.query && !flags.location && !flags.departement && !flags.region) {
      return badArg(
        'search needs at least one of --query/-q, --location/-l, --departement/-d or --region (e.g. -q "data analyst" -l "Paris")',
        "NO_CRITERIA",
      )
    }

    for (const name of ["jobage", "page", "limit", "distance"]) {
      if (flags[name] !== undefined && flags[name] !== true) {
        const v = parseIntFlag(name, flags[name])
        if (v === null) return 1
        flags[name] = String(v)
      }
    }

    const fmt = (flags.format as string) || "json"
    const sort = typeof flags.sort === "string" ? flags.sort.toLowerCase() : undefined
    if (sort && !["relevance", "pertinence", "date", "distance"].includes(sort)) {
      return badArg(`--sort must be relevance, date or distance, got "${sort}"`)
    }

    const experience = typeof flags.experience === "string" ? flags.experience : undefined
    if (experience && !["1", "2", "3"].includes(experience)) {
      return badArg(`--experience must be 1, 2 or 3, got "${experience}"`)
    }

    const opts: SearchOpts = {
      query: typeof flags.query === "string" ? flags.query : undefined,
      location: typeof flags.location === "string" ? flags.location : undefined,
      departement: typeof flags.departement === "string" ? flags.departement : undefined,
      region: typeof flags.region === "string" ? flags.region : undefined,
      distance: flags.distance && flags.distance !== true ? parseInt(flags.distance as string, 10) : undefined,
      jobage: flags.jobage && flags.jobage !== true ? parseInt(flags.jobage as string, 10) : undefined,
      contract: typeof flags.contract === "string" ? flags.contract : undefined,
      experience,
      alternance: flags.alternance === true || flags.alternance === "true",
      sort,
      page: flags.page && flags.page !== true ? Math.max(1, parseInt(flags.page as string, 10)) : 1,
      limit: flags.limit && flags.limit !== true ? parseInt(flags.limit as string, 10) : undefined,
      format: (["json", "table", "plain"].includes(fmt) ? fmt : "json") as SearchOpts["format"],
    }
    return runSearch(opts)
  }

  if (cmd === "detail") {
    const unknown = rejectUnknown(flags, KNOWN_DETAIL_FLAGS)
    if (unknown) return badArg(`Unknown flag "--${unknown}"`, "BAD_FLAG")

    const id = (flags._ as string[])[1]
    if (!id) return badArg("detail requires an <id|url>", "NO_ID")

    const fmt = (flags.format as string) || "json"
    const opts: DetailOpts = {
      id,
      format: (fmt === "plain" ? "plain" : "json") as DetailOpts["format"],
    }
    return runDetail(opts)
  }

  return badArg(`Unknown command "${cmd}"`, "BAD_CMD")
}

main().then((code) => process.exit(code))
