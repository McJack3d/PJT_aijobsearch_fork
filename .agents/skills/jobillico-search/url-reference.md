# Jobillico URL Reference

Public, unauthenticated pages on `https://www.jobillico.com` used by this skill.
Jobillico is a Québec-based board covering Québec and the rest of Canada, served in
French and English from the same backend.

> Personal use only — see the robots.txt constraints below; keep volume low.

## Search

```
GET https://www.jobillico.com/search-jobs        (en)
GET https://www.jobillico.com/recherche-emploi   (fr)
```

Both locale paths accept the same query parameters and return a server-rendered
HTML results page (no JSON API backs the search — the page is rendered by the
server and hydrated by Vue for the preview pane only).

| Param | Meaning | Example | Used by CLI |
|-------|---------|---------|-------------|
| `skwd` | Free-text keywords | `data analyst`, `analyste de données` | ✅ `--query` (required) |
| `scty` | City name | `Montreal`, `Québec`, `Laval`, `Gatineau` | ✅ `--location` |
| `sort` | Result order | `date`, `pert` (relevance), `dist` (proximity, needs geo) | ✅ `--sort` |
| `ipg` | Page number, 1-indexed | `2` | ⚠️ `--page` (see robots.txt) |
| `icty` | Numeric city ID | `0` | ❌ not needed; `scty` alone works |
| `flat` / `flng` | Latitude / longitude | `0` | ❌ **robots-disallowed** |
| `mfil` | Search radius, km | `15`, `40`, `75`, `100`, `200`, `byCity`, `byRegion`, `byProvince` | ❌ only default `40` is robots-allowed |
| `iPerPage` | Results per page | `50`, `75`, `100` | ❌ **robots-disallowed** |

The CLI emits **only** `skwd`, `scty`, `sort`, and `ipg`, so every request it
builds stays inside what robots.txt permits (except `--page > 1`, which warns).

### robots.txt constraints (fetched 2026-08-04)

`https://www.jobillico.com/robots.txt`, `User-agent: *`:

- `/search-jobs`, `/recherche-emploi`, and the job-offer detail paths are **not**
  disallowed — the core of this skill is permitted.
- `Disallow: /*&ipg=` with `Allow: /*&ipg=1$`, `/*&ipg=1&`, `/*&ipg=&*`, `/*&ipg=$`
  → **only page 1 is crawlable.** `--page 2` and beyond work but print a warning
  on stderr.
- `Disallow: *skwd=&scty=&` → keyword-less + city-less searches are disallowed,
  which is why `--query` is a required flag.
- `Disallow: /*flat=`, `Disallow: /*flng=` → the site's own pagination links carry
  these; the CLI builds its own URLs instead of following them.
- `Disallow: *mfil=15|75|100|200|byCity|byProvince|byRegion` → only the default
  40 km radius is allowed, so the CLI never sends `mfil`.
- `Disallow: *iPerPage=50|75|100` → page size is left at the default.
- `Disallow: /see-partner-offer`, `/voir-offre-partenaire` → sponsored cards.
  These have no `data-job-url` attribute, so keying the parser on that attribute
  both selects the organic listings and keeps the CLI out of the disallowed path.

### Search response structure

Each listing is an `<article>` element. Parsing anchors, per card:

| Field | Anchor |
|-------|--------|
| id | `data-job-url="<company>/<slug>/<id>?…"` — trailing digits. **Organic cards only**; sponsored `has-tag-partner` cards lack this attribute |
| title + url | `<h2 class="h3 …"><a href="/en/job-offer/<company>/<slug>/<id>?…">TITLE</a>` |
| company | `<a class="link companyLink …" href="/see-company/<slug>?…">NAME</a>` |
| location | `<span class="… icon--information--position"></span>` → following `<p>` |
| employment type | `<span class="… icon--information--clock"></span>` → following `<p>` |
| date | `<time class="xs" datetime="YYYY-MM-DD">3 weeks ago</time>` |
| snippet | `<p class="xs word-break">` |

Roughly 9–12 organic cards per page. A `<ul class="pagination">` block at the end
of the list carries the page links. There is also a `<script type="application/ld+json">`
`ItemList` giving each result's URL and title — useful as a cross-check, but it
omits company, location, and date, so the CLI parses the cards instead.

Href values carry click-tracking parameters (`lshs`, `lijn`, `lijp`, `lirk`,
`lids`, `lisp`, `liet`, `ipg`). The CLI strips the query string from every URL it
emits.

## Detail

```
GET https://www.jobillico.com/en/job-offer/<company>/<slug>/<id>     (en)
GET https://www.jobillico.com/fr/offre-d-emploi/<company>/<slug>/<id> (fr)
```

The company and title slugs are cosmetic: **the ID alone is authoritative.**
Placeholder slugs 302-redirect to the canonical URL, so the CLI fetches
`/en/job-offer/x/x/<id>` when given a bare ID. A bare `/en/job-offer/<id>` with no
slug segments returns 404.

Note the French detail path is `/fr/offre-d-emploi/` (with the hyphenated `d`),
**not** `/fr/offre-emploi/`, which 404s. The French *search* path, confusingly, is
`/recherche-emploi` with no `d`.

### Detail response structure

The page embeds a complete schema.org `JobPosting` as JSON-LD, which the CLI reads
in preference to the surrounding markup:

```json
{
  "@type": "JobPosting",
  "title": "Product data analyst",
  "url": "https://www.jobillico.com/en/job-offer/soucy/product-data-analyst/17338241",
  "industry": "Manufacturing",
  "salaryCurrency": "CAD",
  "validThrough": "2026-08-06",
  "datePosted": "2026-07-08",
  "employmentType": "CONTRACTOR",
  "hiringOrganization": { "legalName": "Soucy", "url": ".../see-company/soucy" },
  "jobLocation": { "address": { "addressLocality": "Drummondville", "addressRegion": "QC" } },
  "description": "<strong>Mission</strong><p>…</p><ul><li>…</li></ul>"
}
```

The page contains several JSON-LD blocks (an `Organization` one too, and
occasionally a malformed one), so the CLI scans all of them for `@type: JobPosting`
and skips blocks that fail to parse. `description` is an HTML fragment with real
`<p>`/`<ul>`/`<li>` structure — it must be converted to text **without** collapsing
whitespace globally, or the posting runs into one unreadable paragraph.

Fallbacks when no JSON-LD is present: `<meta property="og:title">`, then `<h1>`;
canonical URL from `<link rel="canonical">`.

### Fields not available

- **Apply link.** Applications go through an on-site modal
  (`#popupExternPostulation`); there is no clean outbound URL in the page, so the
  CLI reports the canonical posting URL as `applyUrl`.
- **Salary.** Only `salaryCurrency` is published; no `baseSalary` figure.
- **Posted-within filter.** No query parameter exists. `--jobage` is applied
  client-side against each card's `datetime`, and the CLI switches `sort` to `date`
  so the filter sees the newest postings first.

## Notes

- No authentication required.
- `hreflang` alternates on every page give the counterpart-locale URL — the fastest
  way to re-derive the FR/EN path pair if the routes ever change.
- The CLI backs off on 429/5xx and returns `""` on 404.
