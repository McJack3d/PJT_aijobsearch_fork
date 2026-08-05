---
name: jobillico-search
version: 1.0.0
description: >
  Use this skill to search job postings on Jobillico, the Québec-based job board
  covering Montréal, Québec City, Laval, Gatineau, Sherbrooke, Trois-Rivières and
  the rest of Canada (Toronto, Ottawa, Vancouver, Calgary), in French and English.
  Invoke for open positions, vacancies, permanent/contract/internship roles across
  any sector (data, tech, finance, health, retail, manufacturing). Trigger phrases
  (English): jobs in Montreal, jobs in Quebec, Canadian job search, Jobillico,
  Quebec job board, find a job in Canada, job postings Montreal, Montreal hiring,
  VIE Montreal, jobs in Québec City. Trigger phrases (français) : offres d'emploi
  Québec, recherche d'emploi Montréal, emplois au Québec, trouver un emploi,
  postes ouverts, recrutement Québec, emploi Montréal, annonces d'emploi,
  offre d'emploi, embauche, carrière Québec.
context: fork
allowed-tools: Bash(bun run .agents/skills/jobillico-search/cli/src/cli.ts *)
---

# Jobillico Search Skill

Search live job listings from [Jobillico](https://www.jobillico.com), a Québec-founded
job board carrying roughly 26,000 active postings across Québec and the rest of Canada.
No authentication, no API key, and **zero runtime dependencies** — it runs with just `bun`.

The portal is fully bilingual: the same backend serves French postings at
`/recherche-emploi` and English ones at `/search-jobs`. Use `--lang fr` with
French keywords to reach the French-language listings, which are the majority of
Québec-local postings.

## ⚠️ Personal use only

Jobillico's `robots.txt` permits crawling the search and job-offer pages, but
**disallows paginated results beyond page 1** (`Disallow: /*&ipg=` with an
`Allow` exception only for `ipg=1`), along with larger page sizes, non-default
search radii, and keyword-less searches. This CLI:

- never sends the disallowed `flat`, `flng`, `mfil`, or `iPerPage` parameters,
- requires `--query`, so it never issues a keyword-less search,
- skips sponsored "partner" cards, whose targets sit under the disallowed
  `/see-partner-offer` path,
- **warns on stderr** when you ask for `--page 2` or beyond, rather than
  silently crawling a disallowed path.

Keep volume low, do not use this commercially or for bulk data collection, and
run it on your own responsibility.

## When to use this skill

- Search job openings anywhere in Québec or Canada, in French or English
- Filter by city, posting recency, or sort newest-first
- Get the full description, posting date, and application deadline of a specific listing

## Commands

### Search job listings

```bash
bun run .agents/skills/jobillico-search/cli/src/cli.ts search --query "<keywords>" [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — **required.** Keywords (job title, skill, role).
- `--location <text>` / `-l <text>` — city name, e.g. `"Montreal"`, `"Québec"`, `"Laval"`, `"Gatineau"`. Omit to search all of Canada.
- `--jobage <days>` — posted within N days. Applied **client-side** (Jobillico has no such parameter); undated cards are dropped.
- `--sort <mode>` — `date` or `pert` (relevance). Defaults to `date` when `--jobage` is set, otherwise the portal's relevance order.
- `--lang <en|fr>` — portal language. Default `en`.
- `--page <n>` — 1-indexed page. Default 1. Beyond 1 prints the robots.txt warning above.
- `--limit <n>` / `-n <n>` — cap total results emitted (client-side).
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/jobillico-search/cli/src/cli.ts detail <id|url> [--lang en|fr] [--format json|plain]
```

`id` is the numeric job ID from `search` results (e.g. `17338241`). You may also pass
a full Jobillico job-offer URL in either language. Returns the full description,
posting date, application deadline, employment type, and industry.

## Usage examples

```bash
# Data analyst roles in Montréal
bun run .agents/skills/jobillico-search/cli/src/cli.ts search -q "data analyst" -l "Montreal" --format table

# French-language data roles in Québec City
bun run .agents/skills/jobillico-search/cli/src/cli.ts search -q "analyste de données" -l "Québec" --lang fr --format table

# Data engineering roles posted in the last week, anywhere in Canada
bun run .agents/skills/jobillico-search/cli/src/cli.ts search -q "data engineer" --jobage 7 --format table

# Machine learning roles in Laval, newest first, capped at 10
bun run .agents/skills/jobillico-search/cli/src/cli.ts search -q "machine learning" -l "Laval" --sort date --limit 10

# Business intelligence roles in Gatineau, as JSON for further processing
bun run .agents/skills/jobillico-search/cli/src/cli.ts search -q "business intelligence" -l "Gatineau"

# Full details for a specific posting
bun run .agents/skills/jobillico-search/cli/src/cli.ts detail 17338241 --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use, passing IDs to `detail` |
| `table` | Quick human-readable scanning |
| `plain` | Reading a single job's full detail (`detail` command) |

JSON search output is `{ "meta": { "count", "page" }, "results": [...] }`, where each
result carries `id`, `title`, `company`, `companyUrl`, `location`, `date`,
`employmentType`, `snippet`, and `url`. Missing values are `null`, never omitted.

All errors are written to **stderr** as `{ "error": "...", "code": "..." }` and the
process exits with code `1`.

## Notes

- **Bilingual, one backend.** `--lang` switches both the request path and the
  `Accept-Language` header; the same posting exists under both locales with
  different slugs and a translated title/description.
- **Location is a city name, not a region.** `scty=Montreal` matches the Montréal
  area within the portal's default 40 km radius; the radius parameter is
  robots-disallowed, so it cannot be widened from here. For a whole-province
  sweep, omit `--location` and filter the results yourself.
- **No posting-age parameter exists** on the portal, so `--jobage` filters the
  parsed cards. Because only one page is fetched per call, a narrow `--jobage` on
  a broad query can return few results — the filter cannot reach postings that
  fell onto page 2.
- **Roughly 9–12 organic results per page.** Page size is fixed (larger values are
  robots-disallowed).
- **Sponsored listings are excluded** from results by design (see the warning above).
- **No salary figures.** Jobillico publishes `salaryCurrency` (CAD) but no
  `baseSalary`, so salary is not part of the output.
- **Apply link.** Applications run through an on-site modal, so `applyUrl` in the
  `detail` JSON is the canonical posting URL rather than an external ATS link.
- Jobillico may rate-limit; the CLI retries 429/5xx with exponential backoff.
- Parsing anchors and the full robots.txt analysis are documented in
  [`url-reference.md`](url-reference.md) — start there if the markup changes.
