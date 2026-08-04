# France Travail API Reference

Official **"Offres d'emploi v2"** API from France Travail (ex-Pôle emploi). This is a
sanctioned JSON API, not a scraped site — access is granted by registering an application
on https://francetravail.io and governed by the terms accepted there.

> `api.francetravail.io/robots.txt` is `Disallow: /`. That governs *crawlers*; it does not
> apply to credentialed API access, which is the provider's own intended distribution
> channel. Documented here so a future maintainer does not mistake one for the other.

## Authentication

OAuth2 **client_credentials** (machine-to-machine).

```
POST https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire
Content-Type: application/x-www-form-urlencoded
```

| Form field | Value |
|------------|-------|
| `grant_type` | `client_credentials` |
| `client_id` | from your francetravail.io application |
| `client_secret` | from your francetravail.io application |
| `scope` | `api_offresdemploiv2 o2dsoffre` (override via `FRANCETRAVAIL_SCOPE`) |

Returns `{ "access_token": "...", "token_type": "Bearer", "expires_in": 1499 }`.
The CLI caches the token in-process and expires it 60s early. Send it as
`Authorization: Bearer <token>` on every API call.

Error bodies are standard OAuth: `{"error":"invalid_client","error_description":"Client authentication failed"}`.
`invalid_client` = wrong id/secret; `invalid_scope` = the scope string does not match your app.
The `realm=/partenaire` query parameter is required — omitting it fails authentication.

## Base URL

```
https://api.francetravail.io/partenaire/offresdemploi/v2
```

## Search

```
GET /offres/search
```

| Param | Meaning | Example |
|-------|---------|---------|
| `motsCles` | Free-text keywords | `data analyst` |
| `commune` | **INSEE** code (not postal, not a name) | `75056` (Paris), `69123` (Lyon) |
| `departement` | Département code | `75`, `92`, `2A`, `971` |
| `region` | Région code | `11` (Île-de-France), `84`, `93` |
| `distance` | Radius in km around `commune` (default 10) | `30` |
| `publieeDepuis` | Posted within N days — **only** 1, 3, 7, 14, 31 | `7` |
| `typeContrat` | Contract type | `CDI`, `CDD`, `MIS`, `SAI`, `LIB`, `FRA` |
| `experience` | Experience band | `1` (<1y), `2` (1–3y), `3` (>3y) |
| `alternance` | Work-study only | `true` |
| `sort` | Ordering | `0` relevance, `1` date, `2` distance |
| `range` | Pagination window, `start-end` | `0-49`, `50-99` |
| `minCreationDate` / `maxCreationDate` | ISO-8601 window (not exposed by the CLI) | `2026-01-01T00:00:00Z` |

**`range` constraints:** max 150 results per request; first index ≤ 1000; last index ≤ 1149.
So a single search can page through at most ~1150 offers — narrow with
`minCreationDate`/`maxCreationDate` or a tighter location to go deeper.

**Rate limit: 3 requests/second.**

### Response

```jsonc
{
  "resultats": [ /* array of offers */ ],
  "filtresPossibles": [ /* facet counts: typeContrat, experience, qualification, natureContrat */ ]
}
```

Status codes:
- `200` — all matching results fit in the requested range
- `206` — partial content (more results exist beyond the range); **still a success**
- `204` — no offers matched; **empty body**, so parse defensively
- `400` — bad parameter; `401`/`403` — token problem

The `Content-Range` response header (`offres 0-49/12345`) carries the total match count;
the CLI parses the trailing number into `meta.total`.

### Per-offer fields consumed by the CLI

| JSON path | Mapped to |
|-----------|-----------|
| `id` | `id` |
| `intitule` | `title` |
| `entreprise.nom` | `company` |
| `lieuTravail.libelle` | `location` |
| `dateCreation` | `date` |
| `dateActualisation` | `updated` |
| `origineOffre.urlOrigine` | `url` (falls back to the public detail URL) |
| `typeContratLibelle` → `typeContrat` | `contractType` |
| `salaire.libelle` + `salaire.commentaire` | `salary` (joined with ` — `) |
| `experienceLibelle` | `experience` |
| `dureeTravailLibelle` | `duration` |
| `alternance` | `alternance` |
| `romeLibelle` | `rome` |
| `description` | `description` (detail only) |
| `secteurActiviteLibelle` | `sector` (detail only) |
| `competences[].libelle` | `skills` (detail only) |
| `formations[].niveauLibelle` / `.domaineLibelle` | `education` (detail only) |
| `langues[].libelle` | `languages` (detail only) |
| `contact.urlPostulation` | `applyUrl` (detail only) |
| `nombrePostes` | `positions` (detail only) |

The API sends many more fields (`qualificationLibelle`, `codeNAF`, `deplacementLibelle`,
`accessibleTH`, `qualitesProfessionnelles[]`, …) — add them to `RawOffer` in
`cli/src/helpers.ts` if you need them.

## Detail

```
GET /offres/{offerId}
```

`offerId` is the alphanumeric id from search results (e.g. `190RSQK`), optionally with a
partner suffix (`1234567-ABC`). Returns a single offer object with the same shape as a
search result plus the full `description`. Expired offers return `404`.

Public human-readable page for any offer:
```
https://candidat.francetravail.fr/offres/recherche/detail/{offerId}
```

## Referential (commune resolution)

```
GET /referentiel/communes
```

Returns the full list of French communes as `[{ "code": "75056", "libelle": "Paris", "codePostal": "75001" }, …]`.
The CLI fetches this once to translate `--location "Paris"` into `commune=75056`, caching
it at `$TMPDIR/francetravail-communes.json` for 30 days.

Other referentials available on the same path pattern: `/referentiel/{metiers,themes,departements,regions,naturesContrats,typesContrats,niveauxFormations,permis,langues}`.

## Notes for future maintainers

- Since this is a versioned JSON API, breakage looks like new/renamed **fields**, not
  changed CSS selectors. If a field goes missing, check `RawOffer` in `cli/src/helpers.ts`.
- The `v2` in the path is the contract version — a `v3` would be a separate base URL.
- INSEE ≠ postal code. Paris is INSEE `75056`; `75001`–`75020` are postal codes, and
  `75101`–`75120` are the arrondissement INSEE codes. `pickCommune` prefers exact-name
  matches and then the lowest INSEE code, so `"Paris"` resolves to the city, not the 1st.
