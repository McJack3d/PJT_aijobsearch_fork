# Search Queries for Job Scraper

<!-- Populated by /setup for Alexandre Bredillot. Target roles: Data Scientist, AI/ML Engineer & AI strategy, Data Engineer. -->
<!-- NOTE: The bundled Danish CLI scrapers (jobindex/jobnet/jobbank/jobdanmark) are NOT used for this profile. Search is driven by the LinkedIn/Google site-search queries below. -->

## Geography (three parallel tracks)

1. **France (base):** Paris / Île-de-France, plus remote-in-France.
2. **VIE (Volontariat International en Entreprise):** North America, Asian hubs (e.g. Singapore, Hong Kong, Tokyo), or Portugal (Lisbon/Porto). VIE is a French/EEA program for under-28s — search the official portal plus company VIE listings.
3. **Montreal, Canada:** full-time regular (permanent) positions.

## Search Sites

**France:**
- **linkedin.com/jobs** — filter: France / Île-de-France
- **welcometothejungle.com** — strong for tech/data roles in France
- **apec.fr** — cadres (professional/graduate) roles
- **fr.indeed.com**
- **choosemycompany.com / glassdoor.fr** — for company research

**VIE:**
- **mon-vie-via.businessfrance.fr** — official VIE/VIA portal (primary source)
- **linkedin.com/jobs** — query `"VIE" data` filtered to the target countries
- Company career pages of large French groups that post VIE roles (L'Oréal, TotalEnergies, BNP Paribas, Schneider Electric, Dassault Systèmes, Capgemini, etc.)

**Montreal / Canada:**
- **linkedin.com/jobs** — filter: Montréal, QC / Canada
- **ca.indeed.com**, **jobboom.com**, **quebecemploi**
- Company career pages (Shopify, CGI, Coveo, Element AI/ServiceNow, banks, gaming/AI studios)

**Company career pages via Google:** direct `site:` searches for target companies.

## Query Categories

Queries grouped by priority. Combine each with the relevant location term for the track being searched (`Paris`, `"Île-de-France"`, `Montréal`, or the VIE country).

### Priority 1: Data Scientist / Applied ML

```
site:linkedin.com/jobs "Data Scientist" Paris
site:linkedin.com/jobs "Machine Learning Engineer" "Île-de-France"
site:welcometothejungle.com "Data Scientist" Paris
site:apec.fr "Data Scientist" OR "Machine Learning"
"VIE" ("Data Scientist" OR "Data Analyst") site:mon-vie-via.businessfrance.fr
site:linkedin.com/jobs "Data Scientist" Montréal
```

### Priority 2: AI / ML Engineer & AI strategy

```
site:linkedin.com/jobs "AI Engineer" OR "ML Engineer" Paris
site:welcometothejungle.com ("AI Engineer" OR "MLOps" OR "LLM") Paris
site:linkedin.com/jobs "AI strategy" OR "AI consultant" France
"VIE" ("AI" OR "Machine Learning" OR "Data") Singapore OR "Hong Kong" OR Lisbon OR Montreal
site:linkedin.com/jobs "Machine Learning" OR "Applied Scientist" Montréal
```

### Priority 3: Data Engineer / Data Governance / BI

```
site:linkedin.com/jobs "Data Engineer" Paris
site:linkedin.com/jobs ("Analytics Engineer" OR "BigQuery" OR "Dataiku") "Île-de-France"
site:welcometothejungle.com ("Data Engineer" OR "Data Governance") Paris
"VIE" ("Data Engineer" OR "Data Analyst" OR "BI") site:mon-vie-via.businessfrance.fr
site:linkedin.com/jobs "Data Engineer" OR "BI Analyst" Montréal
```

### Priority 4: Domain-flavored (finance / quant / payments)

```
site:linkedin.com/jobs ("Quantitative" OR "Quant") "Data" Paris
site:linkedin.com/jobs ("Data Scientist" OR "Data Analyst") ("payments" OR "fintech" OR "banking") Paris
site:linkedin.com/jobs "Data" ("finance" OR "trading" OR "risk") Montréal
site:welcometothejungle.com "Data" fintech Paris
```

## Distinctive Search Terms

Use these to sharpen queries (from the profile): `FinBERT`, `LSTM`, `SHAP`, `QlikSense`, `Dataiku`, `BigQuery`, `Power BI`, `SEPA`, `PSD2`, `PyTorch`, `time-series forecasting`, `data governance`, `data quality`.

## Location Filter

When evaluating results, keep only jobs that fall into one of the three tracks:
- **Ideal:** Paris / Île-de-France (on-site or hybrid); remote-in-France.
- **Ideal:** VIE roles in North America, an Asian hub, or Portugal (confirm VIE eligibility and duration).
- **Ideal:** Montréal, QC full-time permanent (check work-authorization requirements — may need a permit / Working Holiday).
- **Borderline:** rest of France requiring relocation, or remote-EU roles — FLAG for the user.
- **Too far / skip:** roles outside these tracks unless strategically compelling.

## Date Filter

Only include jobs posted within the last 14 days, or with an application deadline that has not yet passed. If a posting date cannot be determined, include it but flag as "date unknown".

## Adapting Queries

If the user specifies a focus area, select queries from the matching category and also generate 2-3 custom queries for that focus. Example: `/scrape VIE Lisbon` → Priority-1/2 queries scoped to the VIE portal + Portugal, plus custom Lisbon-specific queries.
