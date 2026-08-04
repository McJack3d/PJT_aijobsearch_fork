// Data source: France Travail (ex-Pôle emploi) official "Offres d'emploi v2" API.
// Unlike the HTML-scraping portal skills, this is a sanctioned JSON API: access is
// granted by registering an application on https://francetravail.io and is governed
// by the terms accepted at registration (not by robots.txt).
//
// Auth is OAuth2 client_credentials (machine-to-machine). Responses are JSON, so no
// markup parsing is needed — but the API has three quirks the parsers below absorb:
//   1. Locations are INSEE codes, not names ("Paris" must become 75056).
//   2. Pagination is a `range: start-end` header-style parameter, max 150 per call.
//   3. An empty result set is HTTP 204 with no body, not an empty array.

import { tmpdir } from "os"
import { join } from "path"

export const TOKEN_URL =
  "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire"
export const API_BASE = "https://api.francetravail.io/partenaire/offresdemploi/v2"
export const SEARCH_URL = `${API_BASE}/offres/search`
export const DETAIL_URL = `${API_BASE}/offres`
export const COMMUNES_URL = `${API_BASE}/referentiel/communes`
export const PUBLIC_DETAIL_URL =
  "https://candidat.francetravail.fr/offres/recherche/detail"

/** Default OAuth scope. Override with FRANCETRAVAIL_SCOPE if your app differs. */
export const DEFAULT_SCOPE = "api_offresdemploiv2 o2dsoffre"

/** The API accepts only these values for `publieeDepuis` (days). */
export const PUBLIEE_DEPUIS_VALUES = [1, 3, 7, 14, 31]

/** Max offers the API will return in a single `range` window. */
export const MAX_RANGE_SIZE = 150

/** An error carrying a stable machine-readable code for the CLI's error output. */
export class CliError extends Error {
  code: string
  constructor(message: string, code: string) {
    super(message)
    this.code = code
  }
}

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

// ---------------------------------------------------------------------------
// Credentials
// ---------------------------------------------------------------------------

export interface Credentials {
  clientId: string
  clientSecret: string
  scope: string
}

/**
 * Minimal `.env` parser — enough for KEY=value files with optional quotes and
 * `#` comments. Avoids a dotenv dependency so the skill stays zero-runtime-dep.
 */
export function parseDotEnv(text: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue
    const eq = line.indexOf("=")
    if (eq === -1) continue
    const key = line.slice(0, eq).trim().replace(/^export\s+/, "")
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length > 1) ||
      (value.startsWith("'") && value.endsWith("'") && value.length > 1)
    ) {
      value = value.slice(1, -1)
    }
    if (key) out[key] = value
  }
  return out
}

/** Candidate `.env` locations, nearest-first: cli dir, skill dir, then cwd. */
function dotEnvCandidates(): string[] {
  const cliDir = join(import.meta.dir, "..")
  const skillDir = join(cliDir, "..")
  return [
    join(cliDir, ".env"),
    join(skillDir, ".env"),
    join(process.cwd(), ".env"),
  ]
}

/**
 * Resolve credentials from the environment, falling back to a `.env` file.
 * Environment variables always win so CI/one-off overrides work.
 */
export async function loadCredentials(): Promise<Credentials> {
  let clientId = process.env.FRANCETRAVAIL_CLIENT_ID
  let clientSecret = process.env.FRANCETRAVAIL_CLIENT_SECRET
  let scope = process.env.FRANCETRAVAIL_SCOPE

  if (!clientId || !clientSecret) {
    for (const path of dotEnvCandidates()) {
      const file = Bun.file(path)
      if (!(await file.exists())) continue
      const env = parseDotEnv(await file.text())
      clientId = clientId || env.FRANCETRAVAIL_CLIENT_ID
      clientSecret = clientSecret || env.FRANCETRAVAIL_CLIENT_SECRET
      scope = scope || env.FRANCETRAVAIL_SCOPE
      if (clientId && clientSecret) break
    }
  }

  if (!clientId || !clientSecret) {
    throw new CliError(
      "Missing France Travail API credentials. Set FRANCETRAVAIL_CLIENT_ID and " +
        "FRANCETRAVAIL_CLIENT_SECRET (environment or a .env file in the skill directory). " +
        "Create an application at https://francetravail.io and subscribe it to " +
        '"Offres d\'emploi v2" to obtain them.',
      "NO_CREDENTIALS",
    )
  }

  return { clientId, clientSecret, scope: scope || DEFAULT_SCOPE }
}

// ---------------------------------------------------------------------------
// OAuth2
// ---------------------------------------------------------------------------

let cachedToken: { token: string; expiresAt: number } | null = null

/**
 * Fetch (and process-cache) an access token. Tokens live ~25 minutes; we expire
 * ours 60s early so a long-running command never uses one mid-rotation.
 */
export async function getToken(creds: Credentials): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.token

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    scope: creds.scope,
  })

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })

  const text = await response.text()
  if (!response.ok) {
    let detail = text.slice(0, 300)
    let oauthError = ""
    try {
      const parsed = JSON.parse(text) as {
        error?: string
        error_description?: string
      }
      oauthError = parsed.error || ""
      detail = parsed.error_description || parsed.error || detail
    } catch {
      // Non-JSON error body — fall through with the raw text.
    }
    if (oauthError === "invalid_client") {
      throw new CliError(
        `Authentication failed (${detail}). Check FRANCETRAVAIL_CLIENT_ID / ` +
          "FRANCETRAVAIL_CLIENT_SECRET and that your application is subscribed to " +
          '"Offres d\'emploi v2".',
        "AUTH_FAILED",
      )
    }
    if (oauthError === "invalid_scope") {
      throw new CliError(
        `Invalid OAuth scope "${creds.scope}" (${detail}). Override it with ` +
          "FRANCETRAVAIL_SCOPE — francetravail.io shows the exact scope on your application page.",
        "AUTH_FAILED",
      )
    }
    throw new CliError(
      `Token request failed: ${response.status} ${detail}`,
      "AUTH_FAILED",
    )
  }

  const json = JSON.parse(text) as { access_token?: string; expires_in?: number }
  if (!json.access_token) {
    throw new CliError("Token response contained no access_token", "AUTH_FAILED")
  }

  const ttl = typeof json.expires_in === "number" ? json.expires_in : 1499
  cachedToken = {
    token: json.access_token,
    expiresAt: Date.now() + Math.max(ttl - 60, 30) * 1000,
  }
  return cachedToken.token
}

/** Test seam: drop the process-cached token. */
export function resetTokenCache(): void {
  cachedToken = null
}

// ---------------------------------------------------------------------------
// API fetch
// ---------------------------------------------------------------------------

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

export interface ApiResponse<T> {
  /** null when the API answered 204 No Content or 404 Not Found. */
  data: T | null
  contentRange: string | null
}

/**
 * GET a JSON endpoint with bearer auth and exponential backoff on 429/5xx.
 * The API rate-limits at ~3 requests/second, so backoff starts generously.
 */
export async function apiFetch<T>(
  url: string,
  token: string,
): Promise<ApiResponse<T>> {
  const maxRetries = 6
  let delay = 700
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "User-Agent": UA,
      },
      redirect: "follow",
    })

    if (response.status === 429 || response.status >= 500) {
      if (attempt === maxRetries) {
        throw new CliError(
          `Request failed after ${maxRetries} retries: ${response.status} ${response.statusText}`,
          "RATE_LIMITED",
        )
      }
      // Honour Retry-After when the API sends it, otherwise exponential + jitter.
      const retryAfter = Number(response.headers.get("Retry-After"))
      const wait = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : delay + Math.floor(Math.random() * 500)
      await new Promise((r) => setTimeout(r, wait))
      delay = Math.min(delay * 2, 8000)
      continue
    }

    // 204 = no offers matched; 404 = unknown offer id. Both are "no data", not errors.
    if (response.status === 204 || response.status === 404) {
      return { data: null, contentRange: null }
    }

    if (response.status === 401 || response.status === 403) {
      throw new CliError(
        `Not authorised (${response.status}). The token was rejected — verify your ` +
          'application is subscribed to "Offres d\'emploi v2".',
        "AUTH_FAILED",
      )
    }

    if (!response.ok) {
      const body = (await response.text()).slice(0, 300)
      throw new CliError(
        `Request failed: ${response.status} ${response.statusText}${body ? ` — ${body}` : ""}`,
        "REQUEST_FAILED",
      )
    }

    const text = await response.text()
    if (!text.trim()) return { data: null, contentRange: null }

    try {
      return {
        data: JSON.parse(text) as T,
        contentRange: response.headers.get("Content-Range"),
      }
    } catch {
      throw new CliError("API returned a malformed JSON body", "BAD_RESPONSE")
    }
  }
  throw new CliError("Request failed after max retries", "RATE_LIMITED")
}

// ---------------------------------------------------------------------------
// Offer shapes
// ---------------------------------------------------------------------------

/** The subset of the raw API offer we read. The API sends many more fields. */
export interface RawOffer {
  id?: string
  intitule?: string
  description?: string
  dateCreation?: string
  dateActualisation?: string
  lieuTravail?: { libelle?: string; commune?: string; codePostal?: string }
  entreprise?: { nom?: string; url?: string; description?: string }
  typeContrat?: string
  typeContratLibelle?: string
  natureContrat?: string
  experienceLibelle?: string
  salaire?: { libelle?: string; commentaire?: string }
  dureeTravailLibelle?: string
  alternance?: boolean
  secteurActiviteLibelle?: string
  romeCode?: string
  romeLibelle?: string
  appellationlibelle?: string
  nombrePostes?: number
  origineOffre?: { urlOrigine?: string }
  competences?: { libelle?: string }[]
  formations?: { niveauLibelle?: string; domaineLibelle?: string }[]
  langues?: { libelle?: string }[]
  contact?: { nom?: string; coordonnees1?: string; urlPostulation?: string }
}

/** Normalised search result. Missing values are `null`, never omitted. */
export interface Offer {
  id: string
  title: string
  company: string | null
  location: string | null
  date: string | null
  url: string
  contractType: string | null
  salary: string | null
  experience: string | null
  duration: string | null
  alternance: boolean
  rome: string | null
}

export interface OfferDetail extends Offer {
  description: string | null
  sector: string | null
  skills: string[]
  education: string[]
  languages: string[]
  positions: number | null
  companyUrl: string | null
  applyUrl: string | null
  updated: string | null
}

/** Collapse whitespace and trim; return null for anything empty. */
function text(value: string | undefined | null): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.replace(/\s+/g, " ").trim()
  return trimmed || null
}

/**
 * Salary arrives split across `libelle` (the range) and `commentaire` (free-text
 * notes), either of which may be absent. Join whichever are present.
 */
function salaryOf(raw: RawOffer): string | null {
  const parts = [text(raw.salaire?.libelle), text(raw.salaire?.commentaire)]
  const joined = parts.filter(Boolean).join(" — ")
  return joined || null
}

export function normalizeOffer(raw: RawOffer): Offer | null {
  const id = text(raw.id)
  if (!id) return null
  return {
    id,
    title: text(raw.intitule) ?? "(sans intitulé)",
    company: text(raw.entreprise?.nom),
    location: text(raw.lieuTravail?.libelle),
    date: text(raw.dateCreation),
    url: text(raw.origineOffre?.urlOrigine) ?? `${PUBLIC_DETAIL_URL}/${id}`,
    contractType: text(raw.typeContratLibelle) ?? text(raw.typeContrat),
    salary: salaryOf(raw),
    experience: text(raw.experienceLibelle),
    duration: text(raw.dureeTravailLibelle),
    alternance: raw.alternance === true,
    rome: text(raw.romeLibelle),
  }
}

/**
 * The API returns descriptions as plain text with real newlines, but entities
 * and stray carriage returns show up often enough to be worth normalising.
 */
function cleanDescription(value: string | undefined): string | null {
  if (!value) return null
  return (
    value
      .replace(/\r\n?/g, "\n")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&nbsp;/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim() || null
  )
}

export function normalizeDetail(raw: RawOffer): OfferDetail | null {
  const base = normalizeOffer(raw)
  if (!base) return null
  return {
    ...base,
    description: cleanDescription(raw.description),
    sector: text(raw.secteurActiviteLibelle),
    skills: (raw.competences ?? [])
      .map((c) => text(c?.libelle))
      .filter((s): s is string => s !== null),
    education: (raw.formations ?? [])
      .map((f) => [text(f?.niveauLibelle), text(f?.domaineLibelle)].filter(Boolean).join(" — "))
      .filter((s) => s !== ""),
    languages: (raw.langues ?? [])
      .map((l) => text(l?.libelle))
      .filter((s): s is string => s !== null),
    positions: typeof raw.nombrePostes === "number" ? raw.nombrePostes : null,
    companyUrl: text(raw.entreprise?.url),
    applyUrl: text(raw.contact?.urlPostulation),
    updated: text(raw.dateActualisation),
  }
}

// ---------------------------------------------------------------------------
// Parameter mapping
// ---------------------------------------------------------------------------

/**
 * Map an arbitrary day count onto the API's fixed `publieeDepuis` ladder
 * (1, 3, 7, 14, 31). Anything above 31 means "no filter" -> null.
 */
export function toPublieeDepuis(days: number | undefined): string | null {
  if (days === undefined || !Number.isFinite(days) || days <= 0) return null
  if (days > 31) return null
  const match = PUBLIEE_DEPUIS_VALUES.find((v) => days <= v)
  return String(match ?? 31)
}

/** Build the `range` parameter (`start-end`) for a 1-indexed page. */
export function toRange(page: number, pageSize: number): string {
  const size = Math.min(Math.max(pageSize, 1), MAX_RANGE_SIZE)
  const start = (Math.max(page, 1) - 1) * size
  return `${start}-${start + size - 1}`
}

const SORT_MAP: Record<string, string> = {
  relevance: "0",
  pertinence: "0",
  date: "1",
  distance: "2",
}

export function toSort(sort: string | undefined): string | null {
  if (!sort) return null
  return SORT_MAP[sort.toLowerCase()] ?? null
}

/** Strip accents and case so "Saint-Étienne" matches "SAINT ETIENNE". */
export function normalizePlace(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
}

// ---------------------------------------------------------------------------
// Commune resolution
// ---------------------------------------------------------------------------

export interface Commune {
  code: string
  libelle: string
  codePostal?: string
}

const COMMUNES_CACHE = join(tmpdir(), "francetravail-communes.json")
const COMMUNES_TTL_MS = 30 * 24 * 60 * 60 * 1000

async function loadCommunes(token: string): Promise<Commune[]> {
  const cache = Bun.file(COMMUNES_CACHE)
  if (await cache.exists()) {
    try {
      const cached = (await cache.json()) as { fetchedAt: number; communes: Commune[] }
      if (
        cached?.fetchedAt &&
        Date.now() - cached.fetchedAt < COMMUNES_TTL_MS &&
        Array.isArray(cached.communes) &&
        cached.communes.length > 0
      ) {
        return cached.communes
      }
    } catch {
      // Corrupt cache — fall through and refetch.
    }
  }

  const { data } = await apiFetch<Commune[]>(COMMUNES_URL, token)
  const communes = Array.isArray(data) ? data : []
  if (communes.length > 0) {
    try {
      await Bun.write(
        COMMUNES_CACHE,
        JSON.stringify({ fetchedAt: Date.now(), communes }),
      )
    } catch {
      // A read-only tmpdir is not fatal; we just refetch next time.
    }
  }
  return communes
}

/** Pick the best commune match, preferring exact names and lower INSEE codes. */
export function pickCommune(communes: Commune[], place: string): Commune | null {
  const needle = normalizePlace(place)
  if (!needle) return null

  // A 5-character code is already an INSEE code (75056) or a postal code (75001).
  if (/^[0-9AB][0-9]{4}$/i.test(place.trim())) {
    const code = place.trim().toUpperCase()
    const byInsee = communes.find((c) => c.code?.toUpperCase() === code)
    if (byInsee) return byInsee
    const byPostal = communes.filter((c) => c.codePostal === code)
    if (byPostal.length > 0) {
      return byPostal.sort((a, b) => a.code.localeCompare(b.code))[0]
    }
    return null
  }

  const exact = communes.filter((c) => normalizePlace(c.libelle || "") === needle)
  if (exact.length > 0) {
    return exact.sort((a, b) => a.code.localeCompare(b.code))[0]
  }
  const prefix = communes.filter((c) => normalizePlace(c.libelle || "").startsWith(needle))
  if (prefix.length > 0) {
    return prefix.sort((a, b) => a.code.localeCompare(b.code))[0]
  }
  return null
}

export interface ResolvedLocation {
  /** `commune` (INSEE), `departement`, or `region` — the API param to set. */
  param: "commune" | "departement" | "region"
  value: string
  label: string
}

/**
 * Turn a user-supplied `--location` into an API parameter.
 *
 * Two-character values ("75", "2A") are departments and three-digit values are
 * regions; both are used as-is. Everything else is resolved against the commune
 * referential, which is cached in the OS temp dir for 30 days.
 */
export async function resolveLocation(
  place: string,
  token: string,
): Promise<ResolvedLocation> {
  const trimmed = place.trim()
  if (!trimmed) {
    throw new CliError("--location was empty", "BAD_LOCATION")
  }

  // Departments: 2 digits, 2A/2B (Corsica), or 3 digits for overseas (971…976).
  if (/^(2[AB]|[0-9]{2})$/i.test(trimmed) || /^9[7-8][0-9]$/.test(trimmed)) {
    return { param: "departement", value: trimmed.toUpperCase(), label: `département ${trimmed.toUpperCase()}` }
  }

  const communes = await loadCommunes(token)
  if (communes.length === 0) {
    throw new CliError(
      "Could not load the commune referential to resolve --location. " +
        "Pass an INSEE code (e.g. 75056) or a département number (e.g. 75) instead.",
      "BAD_LOCATION",
    )
  }

  const match = pickCommune(communes, trimmed)
  if (!match) {
    throw new CliError(
      `No French commune matched "${trimmed}". Try the exact name (e.g. "Lyon"), ` +
        'an INSEE code (e.g. 69123), or a département number (e.g. "69").',
      "BAD_LOCATION",
    )
  }
  return { param: "commune", value: match.code, label: `${match.libelle} (${match.code})` }
}
