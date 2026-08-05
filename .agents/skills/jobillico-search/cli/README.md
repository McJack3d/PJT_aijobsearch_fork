# jobillico-cli

CLI for searching job listings on [Jobillico](https://www.jobillico.com), the
Québec-based job board covering Québec and the rest of Canada, in French and English.

**Zero runtime dependencies** — plain `bun` + `fetch` + regex parsing. `bun install`
pulls dev types only (`typescript`, `@types/bun`), needed for `bun run typecheck`
but not to run the CLI.

> **Personal use only.** Jobillico's robots.txt disallows paginated results beyond
> page 1, larger page sizes, non-default search radii, and keyword-less searches.
> This CLI stays inside those limits and warns on stderr if you request `--page 2`
> or beyond. Keep volume low; no commercial or bulk use.

## Install

```bash
bun install
```

## Usage

```bash
# Search (--query is required)
bun run src/cli.ts search -q "data analyst" -l "Montreal" --format table

# French postings
bun run src/cli.ts search -q "analyste de données" -l "Québec" --lang fr --format table

# Recent postings only (client-side filter, newest-first)
bun run src/cli.ts search -q "data engineer" --jobage 7 --format table

# Full detail for one posting
bun run src/cli.ts detail 17338241 --format plain
```

Run without arguments for the full flag reference.

## Output

`search --format json` (the default):

```json
{
  "meta": { "count": 2, "page": 1 },
  "results": [
    {
      "id": "17338241",
      "title": "Product Data Analyst",
      "company": "Soucy",
      "companyUrl": "https://www.jobillico.com/see-company/soucy",
      "location": "Drummondville - QC",
      "date": "2026-07-08",
      "employmentType": "Full time",
      "snippet": "Mission Are you passionate about data […]",
      "url": "https://www.jobillico.com/en/job-offer/soucy/product-data-analyst/17338241"
    }
  ]
}
```

Missing values are `null`, never omitted. Errors go to **stderr** as
`{ "error": "...", "code": "..." }` with exit code `1`
(`NO_QUERY`, `NO_ID`, `BAD_ID`, `BAD_ARG`, `BAD_CMD`, `NOT_FOUND`,
`SEARCH_FAILED`, `DETAIL_FAILED`).

## Layout

```
src/
  cli.ts              Arg parsing, help text, command dispatch
  helpers.ts          Fetch with backoff, card/detail parsers, entity decoding
  commands/search.ts  URL building, recency filter, output rendering
  commands/detail.ts  ID normalisation, JSON-LD-first detail fetch
tests/
  helpers.ts               runCLI + parseJSON utilities
  parsing.test.ts          Offline parser unit tests (fixtures, no network)
  cli-flag-validation.test.ts  Flag validation and error contract
  search.test.ts           Live smoke tests against the portal
```

## Tests

```bash
bun run test        # 38 tests; search.test.ts hits the live portal
bun run typecheck
```

`parsing.test.ts` and `cli-flag-validation.test.ts` run offline. `search.test.ts`
makes a handful of real requests and will fail if the portal is unreachable or
rate-limiting.

## Maintenance

Parsing anchors, the query-parameter table, and the full robots.txt analysis live in
[`../url-reference.md`](../url-reference.md). If Jobillico changes its markup, the
per-card anchors documented there are what needs updating in `helpers.ts`.
