import {
  DETAIL_URL,
  apiFetch,
  getToken,
  loadCredentials,
  normalizeDetail,
  writeError,
  CliError,
  type RawOffer,
} from "../helpers.js"

export interface DetailOpts {
  id: string
  format: "json" | "plain"
}

/**
 * Accept a bare offer id (`190RSQK`) or any France Travail URL containing one.
 * Ids are alphanumeric, typically 7 characters, and may carry a partner suffix
 * such as `1234567-ABC`.
 */
export function normalizeId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const fromUrl = trimmed.match(/\/detail\/([0-9A-Za-z]+(?:-[0-9A-Za-z]+)?)/)
  if (fromUrl) return fromUrl[1].toUpperCase()

  if (/^[0-9A-Za-z]{5,15}(?:-[0-9A-Za-z]{1,10})?$/.test(trimmed)) {
    return trimmed.toUpperCase()
  }

  // Any trailing path segment that looks like an id.
  const tail = trimmed.match(/([0-9A-Za-z]{5,15}(?:-[0-9A-Za-z]{1,10})?)\/?$/)
  return tail ? tail[1].toUpperCase() : null
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const id = normalizeId(opts.id)
  if (!id) {
    writeError(`Could not parse an offer id from "${opts.id}"`, "BAD_ID")
    return 1
  }

  try {
    const creds = await loadCredentials()
    const token = await getToken(creds)
    const { data } = await apiFetch<RawOffer>(`${DETAIL_URL}/${encodeURIComponent(id)}`, token)

    if (!data) {
      writeError(`Offer ${id} not found (it may have expired)`, "NOT_FOUND")
      return 1
    }

    const offer = normalizeDetail(data)
    if (!offer) {
      writeError(`Offer ${id} returned an unreadable payload`, "BAD_RESPONSE")
      return 1
    }

    if (opts.format === "plain") {
      const lines = [
        offer.title,
        `${offer.company || "—"} · ${offer.location || "—"}`,
        "",
        offer.contractType ? `Contrat : ${offer.contractType}` : "",
        offer.duration ? `Durée : ${offer.duration}` : "",
        offer.salary ? `Salaire : ${offer.salary}` : "",
        offer.experience ? `Expérience : ${offer.experience}` : "",
        offer.sector ? `Secteur : ${offer.sector}` : "",
        offer.rome ? `ROME : ${offer.rome}` : "",
        offer.alternance ? "Alternance : oui" : "",
        offer.positions !== null ? `Postes : ${offer.positions}` : "",
        offer.date ? `Publiée : ${offer.date}` : "",
        "",
        offer.description || "(pas de description)",
        "",
        offer.skills.length > 0 ? `Compétences : ${offer.skills.join(", ")}` : "",
        offer.education.length > 0 ? `Formation : ${offer.education.join(" ; ")}` : "",
        offer.languages.length > 0 ? `Langues : ${offer.languages.join(", ")}` : "",
        "",
        `URL : ${offer.url}`,
        offer.applyUrl ? `Postuler : ${offer.applyUrl}` : "",
      ].filter((l) => l !== "")
      process.stdout.write(lines.join("\n") + "\n")
    } else {
      process.stdout.write(JSON.stringify(offer, null, 2) + "\n")
    }
    return 0
  } catch (e) {
    if (e instanceof CliError) {
      writeError(e.message, e.code)
    } else {
      writeError(e instanceof Error ? e.message : String(e), "DETAIL_FAILED")
    }
    return 1
  }
}
