import {
  BASE,
  detailPath,
  htmlFetch,
  parseJobDetail,
  writeError,
  type Lang,
} from "../helpers.js"

export interface DetailOpts {
  id: string
  lang: Lang
  format: "json" | "plain"
}

/** Accept a raw job ID or any Jobillico job-offer URL. */
export function normalizeId(input: string): string | null {
  const bare = input.trim().match(/^\d{4,}$/)
  if (bare) return bare[0]
  // .../job-offer/<company>/<slug>/<id>[?query] and the French equivalent.
  const url = input.match(/\/(\d{4,})(?:[/?#]|$)/)
  if (url) return url[1]
  return null
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const id = normalizeId(opts.id)
  if (!id) {
    writeError(`Could not parse a job ID from "${opts.id}"`, "BAD_ID")
    return 1
  }
  try {
    // Jobillico's canonical detail URL embeds a company and title slug, but the
    // ID alone is authoritative: placeholder slugs 302-redirect to the real URL.
    const html = await htmlFetch(`${BASE}${detailPath(opts.lang)}/x/x/${id}`, opts.lang)
    if (!html) {
      writeError("Job not found", "NOT_FOUND")
      return 1
    }
    const job = parseJobDetail(html, id, opts.lang)

    if (opts.format === "plain") {
      const lines = [
        job.title,
        `${job.company || "—"} · ${job.location || "—"}`,
        "",
        job.date ? `Posted: ${job.date}` : "",
        job.deadline ? `Apply before: ${job.deadline}` : "",
        job.employmentType ? `Employment: ${job.employmentType}` : "",
        job.industry ? `Industry: ${job.industry}` : "",
        "",
        job.description || "(no description)",
        "",
        `URL: ${job.url}`,
      ].filter((l) => l !== "")
      process.stdout.write(lines.join("\n") + "\n")
    } else {
      process.stdout.write(JSON.stringify(job, null, 2) + "\n")
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "DETAIL_FAILED")
    return 1
  }
}
