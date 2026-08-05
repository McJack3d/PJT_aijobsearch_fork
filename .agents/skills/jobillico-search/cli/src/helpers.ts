// Data source: Jobillico's public search + job-offer pages (www.jobillico.com).
// No authentication required.
//
// Search returns a server-rendered HTML page of <article> job cards; the detail
// page embeds a complete schema.org JobPosting block as JSON-LD, which is far
// more stable than the surrounding markup — we read that first and only fall
// back to HTML scraping if it is missing.
//
// Regex parsing (rather than a DOM library) keeps this at zero runtime deps,
// matching the linkedin-search reference skill.

export const BASE = "https://www.jobillico.com"

export type Lang = "en" | "fr"

/** Search path per locale. Both accept the same query parameters. */
export function searchPath(lang: Lang): string {
  return lang === "fr" ? "/recherche-emploi" : "/search-jobs"
}

/** Job-offer detail path prefix per locale. */
export function detailPath(lang: Lang): string {
  return lang === "fr" ? "/fr/offre-d-emploi" : "/en/job-offer"
}

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

/** Fetch HTML with exponential backoff on 429/5xx. Returns "" on a 404. */
export async function htmlFetch(url: string, lang: Lang = "en"): Promise<string> {
  const maxRetries = 6
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language":
          lang === "fr" ? "fr-CA,fr;q=0.9,en-CA;q=0.8" : "en-CA,en;q=0.9,fr-CA;q=0.8",
      },
      redirect: "follow",
    })
    if (response.status === 429 || response.status >= 500) {
      if (attempt === maxRetries) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`)
      }
      const jitter = Math.floor(Math.random() * 500)
      await new Promise((r) => setTimeout(r, delay + jitter))
      delay = Math.min(delay * 2, 8000)
      continue
    }
    if (response.status === 404) return ""
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`)
    }
    return response.text()
  }
  throw new Error("Request failed after max retries")
}

export interface JobCard {
  id: string
  title: string
  company: string | null
  companyUrl: string | null
  location: string | null
  date: string | null
  employmentType: string | null
  snippet: string | null
  url: string
}

export interface JobDetail extends JobCard {
  description: string | null
  industry: string | null
  deadline: string | null
  salaryCurrency: string | null
  applyUrl: string | null
}

/**
 * Convert a Unicode code point to a string. Uses `fromCodePoint` (not
 * `fromCharCode`) so supplementary-plane code points decode correctly, and
 * drops out-of-range values instead of throwing.
 */
function numericEntity(cp: number): string {
  return cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : ""
}

/**
 * Decode HTML entities. Québec postings are full of accented characters and
 * curly apostrophes delivered as numeric references, so the numeric branches
 * matter here more than they do on an English-only board.
 */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&laquo;/g, "«")
    .replace(/&raquo;/g, "»")
    .replace(/&eacute;/g, "é")
    .replace(/&egrave;/g, "è")
    .replace(/&ecirc;/g, "ê")
    .replace(/&agrave;/g, "à")
    .replace(/&acirc;/g, "â")
    .replace(/&ccedil;/g, "ç")
    .replace(/&ocirc;/g, "ô")
    .replace(/&ugrave;/g, "ù")
    .replace(/&ucirc;/g, "û")
    .replace(/&icirc;/g, "î")
    .replace(/&iuml;/g, "ï")
    .replace(/&#(\d+);/g, (_, dec) => numericEntity(parseInt(dec, 10)))
    .replace(/&#[xX]([0-9a-fA-F]+);/g, (_, hex) => numericEntity(parseInt(hex, 16)))
    // &amp; last, so "&amp;lt;" does not double-decode into "<".
    .replace(/&amp;/g, "&")
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

function clean(html: string): string {
  return decodeHtmlEntities(stripTags(html))
}

/**
 * Convert an HTML fragment to readable text, preserving paragraph breaks.
 *
 * Deliberately does not use `stripTags`: that collapses all whitespace
 * (including the newlines inserted for block elements) into single spaces,
 * which would run a structured posting into one unreadable paragraph.
 * Jobillico descriptions are marked up with real <p>/<ul>/<li> blocks.
 */
export function htmlToText(html: string): string {
  const withBreaks = html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    // <li> opens its own line; </li> must not add a second one.
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<\/li>/gi, "")
    .replace(/<\/(p|ul|ol|div|h\d|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
  return decodeHtmlEntities(withBreaks)
    // Collapse runs of spaces/tabs but keep newlines intact.
    .replace(/[^\S\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

/** Absolutise a site-relative href and drop Jobillico's click-tracking query. */
function absolute(href: string): string {
  const path = decodeHtmlEntities(href).split("?")[0]
  return path.startsWith("http") ? path : `${BASE}${path}`
}

/**
 * Parse the search-results page.
 *
 * Cards are `<article>` elements. Organic listings carry `data-job-url`;
 * sponsored "partner" cards (class `has-tag-partner`) do not, and their targets
 * live under /see-partner-offer, which robots.txt disallows — so keying on
 * `data-job-url` both selects the real listings and keeps us out of the
 * disallowed path. Each chunk is parsed independently so one malformed card
 * cannot break the rest.
 */
export function parseJobCards(html: string): JobCard[] {
  const results: JobCard[] = []
  const chunks = html.split(/<article\b/i).slice(1)

  for (const chunk of chunks) {
    const jobUrlMatch = chunk.match(/data-job-url="([^"?]+)/i)
    if (!jobUrlMatch) continue // sponsored/partner card or non-job article

    const idMatch = jobUrlMatch[1].match(/(\d+)\s*$/)
    if (!idMatch) continue
    const id = idMatch[1]

    // Title + canonical link live in the card's <h2>.
    const titleMatch = chunk.match(
      /<h2[^>]*>\s*<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i,
    )
    const title = titleMatch ? clean(titleMatch[2]) : ""
    if (!title) continue
    const url = titleMatch ? absolute(titleMatch[1]) : `${BASE}/en/job-offer/x/x/${id}`

    // Company name + profile link.
    let company: string | null = null
    let companyUrl: string | null = null
    const companyMatch = chunk.match(
      /<a[^>]*class="[^"]*companyLink[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i,
    )
    if (companyMatch) {
      companyUrl = absolute(companyMatch[1])
      company = clean(companyMatch[2]) || null
    }

    // The card's icon list carries location and employment type; each entry is
    // an <li> whose icon modifier names the field.
    const location = matchIconField(chunk, "position")
    const employmentType = matchIconField(chunk, "clock")

    // <time datetime="YYYY-MM-DD"> — the machine-readable posting date.
    const dateMatch = chunk.match(/<time[^>]*datetime="([^"]+)"/i)
    const date = dateMatch ? dateMatch[1].trim() : null

    const snippetMatch = chunk.match(/<p class="xs word-break">([\s\S]*?)<\/p>/i)
    const snippet = snippetMatch ? clean(snippetMatch[1]) || null : null

    results.push({
      id,
      title,
      company,
      companyUrl,
      location,
      date,
      employmentType,
      snippet,
      url,
    })
  }

  return results
}

/** Read one `icon--information--<name>` list entry from a card chunk. */
function matchIconField(chunk: string, name: string): string | null {
  const re = new RegExp(
    `icon--information--${name}"[^>]*>\\s*</span>\\s*<p[^>]*>([\\s\\S]*?)</p>`,
    "i",
  )
  const m = chunk.match(re)
  return m ? clean(m[1]) || null : null
}

interface JsonLdJobPosting {
  title?: string
  url?: string
  description?: string
  datePosted?: string
  validThrough?: string
  employmentType?: string | string[]
  industry?: string
  salaryCurrency?: string
  hiringOrganization?: { name?: string; legalName?: string; url?: string }
  jobLocation?: {
    address?: { addressLocality?: string; addressRegion?: string; addressCountry?: string }
  }
}

/** Pull the schema.org JobPosting object out of the page's JSON-LD blocks. */
export function extractJobPostingLd(html: string): JsonLdJobPosting | null {
  const re = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    let data: unknown
    try {
      data = JSON.parse(m[1].trim())
    } catch {
      continue // a malformed block must not abort the scan
    }
    const candidates = Array.isArray(data) ? data : [data]
    for (const c of candidates) {
      if (c && typeof c === "object" && (c as { "@type"?: string })["@type"] === "JobPosting") {
        return c as JsonLdJobPosting
      }
    }
  }
  return null
}

/** Parse a single job-offer page, preferring its JSON-LD JobPosting block. */
export function parseJobDetail(html: string, id: string, lang: Lang): JobDetail {
  const ld = extractJobPostingLd(html)

  const fallbackTitle =
    html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/i)?.[1] ??
    html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ??
    ""

  const address = ld?.jobLocation?.address
  const locality = address?.addressLocality?.trim() || null
  const region = address?.addressRegion?.trim() || null
  const location = locality && region ? `${locality} - ${region}` : locality || region

  const employmentType = Array.isArray(ld?.employmentType)
    ? ld.employmentType.join(", ")
    : ld?.employmentType ?? null

  const canonical =
    html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i)?.[1] ??
    ld?.url ??
    `${BASE}${detailPath(lang)}/x/x/${id}`

  return {
    id,
    title: ld?.title ? decodeHtmlEntities(ld.title).trim() : clean(fallbackTitle) || "(untitled)",
    company: ld?.hiringOrganization?.legalName ?? ld?.hiringOrganization?.name ?? null,
    companyUrl: ld?.hiringOrganization?.url ?? null,
    location,
    date: ld?.datePosted ?? null,
    employmentType,
    snippet: null,
    url: decodeHtmlEntities(canonical).split("?")[0],
    description: ld?.description ? htmlToText(ld.description) || null : null,
    industry: ld?.industry ?? null,
    deadline: ld?.validThrough ?? null,
    salaryCurrency: ld?.salaryCurrency ?? null,
    // Jobillico funnels applications through the posting page itself (the
    // apply button opens an on-site modal), so the canonical URL *is* the
    // apply entry point.
    applyUrl: decodeHtmlEntities(canonical).split("?")[0],
  }
}

/**
 * Client-side recency filter.
 *
 * Jobillico exposes no "posted within N days" query parameter, but every card
 * carries a machine-readable `datetime`, so we filter after parsing. Cards with
 * no date are dropped when a filter is active: an unknown posting date cannot
 * be confirmed to fall inside the window.
 */
export function filterByAge(cards: JobCard[], days: number, now = new Date()): JobCard[] {
  if (!days || days <= 0 || days >= 9999) return cards
  // Cards carry a date but no time, so compare at day granularity from the
  // start of today (UTC). Using the current clock time instead would discard
  // postings made earlier today at any `days` value.
  const startOfToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const cutoff = startOfToday - days * 86400_000
  return cards.filter((c) => {
    if (!c.date) return false
    const t = Date.parse(c.date)
    return !isNaN(t) && t >= cutoff
  })
}
