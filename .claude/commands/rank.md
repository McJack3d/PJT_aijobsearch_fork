# /rank - Rank Jobs Against Current CV Evidence

Read `.claude/skills/job-application-assistant/04-job-evaluation.md` and the current-evidence section of `01-candidate-profile.md` once. The framework is the only authority for weights, gates, caps, bands and sorting. Scores measure evidence alignment, never interview probability.

## 1. Select postings

Read `job_scraper/seen_jobs.json` (shape: `{"seen": {"key": {...}}}`). No application log is required or maintained.
- Default: `new`, `evaluated`, or previously ranked entries whose `rank_framework_version` differs from the current rubric version.
- Focus text: filter relevant title/description/notes; this only selects candidates, never determines their fit.
- `--all`: reconsider all entries except explicitly expired or user-skipped entries, including prior rankings.
- `--top N`: default 5 per displayed track, disclose the scope.
- If state is missing/empty, accept user-supplied URLs/full descriptions or suggest `/scrape`.
- Keep discovery deduplication separate from application history. A seen/ranked job does not mean applied.

## 2. Retrieve and evaluate

Fetch full descriptions or use saved full text with source URL and retrieval date. Never score titles/snippets alone. Record `unavailable` for blocked/missing text and `expired` only with explicit closure/deadline evidence. Unavailable entries can be retried on `--all`.

For each available job follow the framework: gates, requirement matrix, four dimension scores, raw score, cap/reason, final score, band, confidence and separate preference notes. Cite the posting requirement and current CV evidence behind every match. Use the evaluation date for tenure and deadlines.

Company research and salary lookup are not needed for triage. Keep unknown authorization/start date visible; never invent them. Do not use old `fit: high` labels or prior score weights.

## 3. Present and persist

Follow framework grouping/sorting: eligible vs conditional, then VIE vs Canadian local contracts (Québec preferred subgroup), then score/confidence/deadline/recency. Show excluded and unavailable separately. Table: rank, role/company/link, track, score/band, confidence, strongest evidence, principal gap or unresolved gate. State these are posting-based triage scores and `/apply` re-evaluates before drafting.

Update only selected entries in `seen_jobs.json`, preserving unrelated fields:
- `status: ranked` for scored jobs, plus `rank_score`, `rank_raw_score`, `rank_cap_reason`, `rank_verdict`, `rank_date`, `rank_framework_version`, `rank_gates`, `rank_dimensions`, `rank_evidence`, `rank_confidence`, `rank_preferences`, `rank_track`.
- For unavailable/expired/excluded jobs, save the corresponding status and `rank_reason`; clear any stale `rank_score`, `rank_raw_score` and `rank_verdict` so they cannot look current. Use `rank_date` and the current framework version.
- Reading or ranking never submits an application or records outcomes. Reruns with the same version skip already-ranked entries unless `--all`.

Offer `/apply <URL>` for a selected result; carry over evidence but rerun its full evaluation.
