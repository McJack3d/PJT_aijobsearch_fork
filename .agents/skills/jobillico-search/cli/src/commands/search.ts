import {
  BASE,
  searchPath,
  htmlFetch,
  parseJobCards,
  filterByAge,
  writeError,
  type JobCard,
  type Lang,
} from "../helpers.js"

export interface SearchOpts {
  query: string
  location?: string
  jobage: number
  sort?: string // "date" | "pert"
  lang: Lang
  page: number
  limit?: number
  format: "json" | "table" | "plain"
}

/**
 * Build the search URL.
 *
 * Only the parameters robots.txt permits are emitted. In particular we never
 * send `flat`/`flng` (disallowed), `mfil` (only the default 40 km is allowed),
 * or `iPerPage` (larger page sizes are disallowed) — see url-reference.md.
 */
export function buildUrl(opts: SearchOpts): string {
  const params = new URLSearchParams()
  params.set("skwd", opts.query)
  if (opts.location) params.set("scty", opts.location)
  // Recency filtering is client-side, so ask the portal for newest-first when
  // the user filters by age and has not chosen a sort explicitly.
  const sort = opts.sort ?? (opts.jobage < 9999 ? "date" : undefined)
  if (sort) params.set("sort", sort)
  if (opts.page > 1) params.set("ipg", String(opts.page))
  return `${BASE}${searchPath(opts.lang)}?${params.toString()}`
}

function renderTable(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  const rows = cards.map((c) => {
    const title = (c.title || "").slice(0, 44).padEnd(44)
    const company = (c.company || "—").slice(0, 26).padEnd(26)
    const loc = (c.location || "—").slice(0, 24).padEnd(24)
    const date = c.date || "—"
    return `${c.id.padEnd(9)} ${title} ${company} ${loc} ${date}`
  })
  const header =
    "ID".padEnd(9) +
    " " +
    "TITLE".padEnd(44) +
    " " +
    "COMPANY".padEnd(26) +
    " " +
    "LOCATION".padEnd(24) +
    " DATE"
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const html = await htmlFetch(buildUrl(opts), opts.lang)
    let cards = parseJobCards(html)
    cards = filterByAge(cards, opts.jobage)
    if (opts.limit !== undefined && opts.limit >= 0) cards = cards.slice(0, opts.limit)

    if (opts.format === "table") {
      process.stdout.write(renderTable(cards) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(
        cards
          .map(
            (c) =>
              `${c.title}\n  ${c.company || "—"} · ${c.location || "—"} · ${c.date || "—"}\n  id: ${c.id}\n  ${c.url}`,
          )
          .join("\n\n") + "\n",
      )
    } else {
      process.stdout.write(
        JSON.stringify(
          { meta: { count: cards.length, page: opts.page }, results: cards },
          null,
          2,
        ) + "\n",
      )
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "SEARCH_FAILED")
    return 1
  }
}
