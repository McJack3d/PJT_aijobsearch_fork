import {
  SEARCH_URL,
  apiFetch,
  getToken,
  loadCredentials,
  normalizeOffer,
  resolveLocation,
  toPublieeDepuis,
  toRange,
  toSort,
  writeError,
  CliError,
  MAX_RANGE_SIZE,
  type Offer,
  type RawOffer,
} from "../helpers.js"

export interface SearchOpts {
  query?: string
  location?: string
  departement?: string
  region?: string
  distance?: number
  jobage?: number
  contract?: string
  experience?: string
  alternance?: boolean
  sort?: string
  page: number
  limit?: number
  format: "json" | "table" | "plain"
}

interface SearchResponse {
  resultats?: RawOffer[]
  filtresPossibles?: unknown
}

/** Default page size when the caller did not cap results. */
const DEFAULT_PAGE_SIZE = 50

export async function buildUrl(
  opts: SearchOpts,
  token: string,
): Promise<{ url: string; locationLabel: string | null }> {
  const params = new URLSearchParams()
  if (opts.query) params.set("motsCles", opts.query)

  let locationLabel: string | null = null
  if (opts.location) {
    const resolved = await resolveLocation(opts.location, token)
    params.set(resolved.param, resolved.value)
    locationLabel = resolved.label
  }
  // Explicit --departement / --region win over anything inferred from --location.
  if (opts.departement) {
    params.set("departement", opts.departement.toUpperCase())
    locationLabel = `département ${opts.departement.toUpperCase()}`
  }
  if (opts.region) {
    params.set("region", opts.region)
    locationLabel = `région ${opts.region}`
  }

  // `distance` is only meaningful alongside a commune.
  if (opts.distance !== undefined && params.has("commune")) {
    params.set("distance", String(opts.distance))
  }

  const publieeDepuis = toPublieeDepuis(opts.jobage)
  if (publieeDepuis) params.set("publieeDepuis", publieeDepuis)

  if (opts.contract) params.set("typeContrat", opts.contract.toUpperCase())
  if (opts.experience) params.set("experience", opts.experience)
  if (opts.alternance) params.set("alternance", "true")

  const sort = toSort(opts.sort)
  if (sort) params.set("sort", sort)

  const pageSize = Math.min(opts.limit && opts.limit > 0 ? opts.limit : DEFAULT_PAGE_SIZE, MAX_RANGE_SIZE)
  params.set("range", toRange(opts.page, pageSize))

  return { url: `${SEARCH_URL}?${params.toString()}`, locationLabel }
}

function renderTable(offers: Offer[]): string {
  if (offers.length === 0) return "Aucun résultat."
  const header =
    "ID".padEnd(9) +
    " " +
    "TITRE".padEnd(44) +
    " " +
    "ENTREPRISE".padEnd(24) +
    " " +
    "LIEU".padEnd(24) +
    " " +
    "CONTRAT".padEnd(10) +
    " DATE"
  const rows = offers.map((o) => {
    const title = (o.title || "").slice(0, 44).padEnd(44)
    const company = (o.company || "—").slice(0, 24).padEnd(24)
    const loc = (o.location || "—").slice(0, 24).padEnd(24)
    const contract = (o.contractType || "—").slice(0, 10).padEnd(10)
    const date = (o.date || "—").slice(0, 10)
    return `${o.id.padEnd(9)} ${title} ${company} ${loc} ${contract} ${date}`
  })
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

function renderPlain(offers: Offer[]): string {
  if (offers.length === 0) return "Aucun résultat."
  return offers
    .map((o) =>
      [
        o.title,
        `  ${o.company || "—"} · ${o.location || "—"} · ${o.contractType || "—"}`,
        o.salary ? `  ${o.salary}` : "",
        `  id: ${o.id}`,
        `  ${o.url}`,
      ]
        .filter((l) => l !== "")
        .join("\n"),
    )
    .join("\n\n")
}

/** Parse the `Content-Range` header (`offres 0-49/12345`) for the total count. */
function totalFromContentRange(contentRange: string | null): number | null {
  if (!contentRange) return null
  const m = contentRange.match(/\/(\d+)\s*$/)
  return m ? parseInt(m[1], 10) : null
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const creds = await loadCredentials()
    const token = await getToken(creds)
    const { url, locationLabel } = await buildUrl(opts, token)

    const { data, contentRange } = await apiFetch<SearchResponse>(url, token)

    // 204 No Content means the search matched nothing — an empty result set, not an error.
    const raw = data?.resultats ?? []
    let offers = raw
      .map(normalizeOffer)
      .filter((o): o is Offer => o !== null)

    if (opts.limit !== undefined && opts.limit >= 0) {
      offers = offers.slice(0, opts.limit)
    }

    if (opts.format === "table") {
      process.stdout.write(renderTable(offers) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(renderPlain(offers) + "\n")
    } else {
      process.stdout.write(
        JSON.stringify(
          {
            meta: {
              count: offers.length,
              page: opts.page,
              total: totalFromContentRange(contentRange),
              location: locationLabel,
              query: opts.query ?? null,
            },
            results: offers,
          },
          null,
          2,
        ) + "\n",
      )
    }
    return 0
  } catch (e) {
    if (e instanceof CliError) {
      writeError(e.message, e.code)
    } else {
      writeError(e instanceof Error ? e.message : String(e), "SEARCH_FAILED")
    }
    return 1
  }
}
