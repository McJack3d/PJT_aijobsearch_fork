# Search Queries for Job Scraper

<!-- Populated by /setup for Alexandre Bredillot. Current evidence targets: Data & AI Product Developer, Data/Analytics Engineer, applied AI integration, analytics/BI; junior data science where supported. -->
<!-- NOTE: The bundled Danish CLI scrapers (jobindex/jobnet/jobbank/jobdanmark) are NOT used for this profile. Search is driven by the LinkedIn/Google site-search queries below. -->

## Geography (VIE-first worldwide, Canada second)

1. **VIE (Volontariat International en Entreprise) — PRIMARY, WORLDWIDE:** any country, no geographic restriction. Search the official Business France portal first, then company VIE listings.
2. **Canada — SECONDARY:** Local contracts in Canada only, Québec preferred, starting January 2027.
3. **France / Paris / Île-de-France — NOT TARGETED.** Exclude French-based non-VIE roles. (A VIE posted by a French company for an overseas mission still counts as track 1.)

## Search Sites

**VIE (primary, worldwide):**
- **mon-vie-via.businessfrance.fr** — official VIE/VIA portal (primary source)
- **linkedin.com/jobs** — query `"VIE" data` filtered to the target countries
- Company career pages of large French groups that post VIE roles (L'Oréal, TotalEnergies, BNP Paribas, Schneider Electric, Dassault Systèmes, Capgemini, etc.)
- **JobTeaser (EDHEC Career Centre)** — SSO-gated, no CLI skill; browse manually and filter to the "International Graduate Business Placements (VIE)" contract type

**Canada (secondary):**
- **linkedin.com/jobs** — filter: Montréal, QC / Canada
- **jobillico.com** — CLI skill available (`jobillico-search`)
- **ca.indeed.com**, **jobboom.com**, **quebecemploi**
- Company career pages (Shopify, CGI, Coveo, Element AI/ServiceNow, banks, gaming/AI studios)

**Company career pages via Google:** direct `site:` searches for target companies.

## Query Categories

Use latest CV evidence; titles are discovery terms, never fit scores. Search VIE worldwide first; local contracts in Canada second, Québec preferred. January 2027 availability is confirmed. Verify the actual VIE contract and start date in each full posting.

### Priority 1: Data and AI product development

Search `"VIE" ("data product" OR "AI developer" OR "développeur IA")`, and Canadian local roles with `"data product developer"`, `"AI integration"`, `"LLM" "tool calling"`, `"développeur IA"`. Focus on integration/delivery requirements, not research titles.

### Priority 2: Data engineering and analytics engineering

Search `"VIE" ("data engineer" OR "BigQuery")`, and Canadian local roles with `"junior data engineer"`, `"analytics engineer" "BigQuery"`, `"ingénieur données" "GCP"`.

### Priority 3: Analytics, BI and data quality

Search `"VIE" ("data analyst" OR "BI" OR "data quality")`, and Canadian local roles with `"data analyst" "SQL"`, `"analyste de données"`, `"qualité des données"`. Prefer building/automation responsibilities when supported by the posting.

### Priority 4: Junior applied data science

Search `"VIE" "data scientist"`, `"junior data scientist"`, `"scientifique de données junior"`. Compare professional versus academic requirements carefully; do not inflate fit from a matching title.

## Distinctive Search Terms

Use current evidence terms: `BigQuery`, `SQL`, `Cloud Run`, `GCP`, `LLM integration`, `tool calling`, `prompt design`, `data contracts`, `row-level security`, `CI/CD`, `Power BI`, `QlikSense`, `Dataiku`, `SEPA`, `PSD2`.

## Location Filter

Keep only jobs in the two active tracks. VIE leads in presentation order:
- **Ideal (primary):** VIE roles **anywhere in the world** (confirm eligibility and duration).
- **Ideal (secondary):** local contracts in Canada — Québec preferred, other provinces accepted (check work authorization and January 2027 start).
- **Excluded:** France-based non-VIE roles (Paris / Île-de-France included) — do not present unless the user reopens that track.
- **Borderline:** remote roles based outside both tracks — FLAG for the user.

## Date Filter

Only include jobs posted within the last 14 days, or with an application deadline that has not yet passed. If a posting date cannot be determined, include it but flag as "date unknown".

## Adapting Queries

If the user specifies a focus area, select queries from the matching category and also generate 2-3 custom queries for that focus. Example: `/scrape VIE Lisbon` → Priority-1/2 queries scoped to the VIE portal + Portugal, plus custom Lisbon-specific queries.
