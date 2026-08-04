# francetravail-cli

CLI for searching French job offers via the official **France Travail** (ex-Pôle emploi)
"Offres d'emploi v2" API.

**Zero runtime dependencies** — plain `bun` + `fetch`. `bun install` pulls dev types only
(`typescript`, `@types/bun`) so `bun run typecheck` works.

## Setup

Credentials are free but required (the API rejects unauthenticated calls with 401):

1. Create an account at https://francetravail.io
2. Create an application in your dashboard
3. Subscribe it to **"Offres d'emploi v2"**
4. `cp .env.example .env` and fill in your client id and secret

```bash
bun install
```

`.env` is gitignored. Environment variables `FRANCETRAVAIL_CLIENT_ID` /
`FRANCETRAVAIL_CLIENT_SECRET` take precedence over the file.

## Usage

```bash
# Search
bun run src/cli.ts search -q "data analyst" -l "Paris" --format table
bun run src/cli.ts search -q "data scientist" -l "Paris" --distance 30 --jobage 7
bun run src/cli.ts search -q "données" -d 92 --contract CDI --experience 1
bun run src/cli.ts search -q "machine learning" --region 11 --sort date -n 20
bun run src/cli.ts search -q "data" -l "Lyon" --alternance --format plain

# Detail
bun run src/cli.ts detail 190RSQK --format plain

# Help
bun run src/cli.ts --help
```

Run `--help` for the full flag list. Location accepts a commune name, an INSEE code, or a
département number; names are resolved via the official commune referential (cached in
`$TMPDIR` for 30 days).

## Output

`search` emits `{ "meta": {...}, "results": [...] }` on stdout. Errors go to **stderr** as
`{ "error": "...", "code": "..." }` with exit code `1`.

## Development

```bash
bun run typecheck   # tsc --noEmit
bun run test        # bun test --timeout 30000
```

The suite has three offline groups — response mapping, URL construction, and CLI argument
validation — plus a live smoke-test group that **self-skips when no credentials are
configured**, so `bun test` is green on a fresh clone. With credentials set, the live group
searches "data analyst" in Paris, verifies fields are populated, and round-trips one id
through `detail`.

## Notes

- Rate limit is 3 requests/second; the CLI honours `Retry-After` and backs off on 429/5xx.
- `--jobage` snaps up to the API's fixed ladder (1, 3, 7, 14, 31 days).
- A single search can page through at most ~1150 offers (`range` caps); narrow the query
  to go deeper.

See `../url-reference.md` for the full endpoint and field documentation.
