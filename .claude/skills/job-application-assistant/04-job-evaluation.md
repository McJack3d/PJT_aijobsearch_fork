# Job Evaluation Framework

Version: cv-2026-10-07-v1. Goal: prioritise roles with a defensible interview case using the latest CV. A score measures evidence alignment, not an interview probability. Use this same rubric in `/scrape`, `/rank` and `/apply`.

## 1. Evidence authority

Read **Current ranking evidence** in `01-candidate-profile.md`, sourced from `documents/cv/CV_Alexandre_Bredillot_EN.docx`. Separate professional work, independent projects, coursework and skills-list claims. Do not count omitted historical projects without explicit user direction. Do not infer years, advanced proficiency, quantified impact, sole ownership or unlisted technologies.

Strong current evidence: data-product development; BigQuery SQL/models/stored procedures/optimisation; GCP Cloud Run application delivery; LLM integration and tool calling; data quality/contracts/row-level security; production operations/CI/CD; payments analytics and stakeholder coordination.

Role families to explore (not automatic scores):
- Data & AI Product Developer / technical data-product roles.
- Junior Data Engineer / Analytics Engineer, especially BigQuery/GCP.
- Applied AI / AI integration roles centred on LLM applications and tools.
- Data Analyst / BI roles with engineering, automation or product ownership.
- Junior Data Scientist where academic ML meets the actual requirements. Model research, deep MLOps and senior leadership need evidence not established by this CV.

## 2. Eligibility and feasibility gates

For each gate output PASS, FAIL or UNKNOWN, an explicit reason and source:
- Geography/contract: user-confirmed preference (2026-10-07) is VIE worldwide first, local contracts in Canada second (Québec preferred); all other contracts/geographies excluded. Verify VIE contract from the posting, not a search query or French employer name.
- Availability: user-confirmed start date is January 2027 (confirmed 2026-10-07). An explicitly incompatible mandatory start date fails; unstated timing is unknown.
- Work authorization, sponsorship and VIE eligibility: unknown unless confirmed. Never infer from French language, location or mobility. Check official current requirements when needed; do not invent legal rules.
- Mandatory language, qualification, certification or clearance: compare literal requirement to evidence. Degree dates alone do not prove completion.
- Posting status: explicit closure or past deadline means expired. Blocked access, missing text or a login wall means unavailable, not expired.

Any confirmed FAIL excludes the role regardless of score. UNKNOWN stays visible in a **conditional shortlist** with the precise question to resolve; it never becomes an assumed pass. Missing full posting means no numerical score. Explicit mandatory experience/seniority mismatches use the seniority rule below.

## 3. Requirement-to-evidence matrix

Extract non-duplicated requirements/responsibilities from the full posting. Separate essential from preferred; do not invent a requirement because it commonly appears in similar roles. Allocate each requirement to one dimension only, avoiding duplicate credit for synonyms.

| Requirement and posting quote | Essential/preferred | Dimension | Latest-CV evidence | Evidence level | Gap/question |
|---|---|---|---|---|---|

Credit per requirement:
- **1.00:** directly demonstrated in professional work, or explicitly matched credential/language. If the role explicitly accepts project/coursework evidence, directly relevant evidence of that kind can earn 1.00 too; label it honestly.
- **0.75:** directly demonstrated in an independent project, or closely transferable professional work with a concrete explanation of the difference.
- **0.50:** relevant coursework or listed skill without demonstrated application.
- **0.25:** weak/partial adjacent evidence with a stated limitation.
- **0.00:** no supporting evidence. Say “not evidenced”, not “cannot do”.

Weight essential requirements 2 and preferred requirements 1. Each dimension = 100 × sum(requirement weight × credit) / sum(requirement weights). Round the final overall score only. If the posting provides no criteria for a dimension, mark N/A and renormalise the remaining dimension weights; report this. If core technical requirements or responsibilities are too vague to assess, do not score; request fuller text.

## 4. Hiring-fit score

| Dimension | Weight | What it measures |
|---|---:|---|
| Technical requirements | 40% | Demonstrated tools, methods and technical capabilities |
| Similar responsibilities | 35% | Evidence of doing the tasks and delivering the required outcomes |
| Seniority and scope | 15% | Actual tenure, independence, architecture/leadership expectations |
| Domain relevance | 10% | Relevant payments, commerce or other explicitly required domain knowledge |

For seniority, evaluate explicit requirements with the same credit scale. Compute tenure from actual month ranges at evaluation time, count overlapping months once, and distinguish internships from experience requirements that exclude them. Never count projected future months. A “senior” title triggers scrutiny, not an automatic pass or fail. An explicit mandatory tenure/leadership requirement not supported by the CV caps the final score at **59** and verdict at **Stretch**; if explicitly non-negotiable and demonstrably unmet, exclude as FAIL. Missing mandatory technical evidence also caps the score at 59 (or excludes if the employer explicitly states a non-negotiable credential/capability condition). Always show raw score, any cap and its reason.

Bands after caps:
- **80–100 Strong:** prioritise, provided gates pass.
- **65–79 Good:** credible application, address specific gaps.
- **50–64 Stretch:** selective effort; explain what would need to convince the employer.
- **0–49 Low:** deprioritise.

A gated failure is **Excluded**, not Strong. Unknown gates make any band **Conditional**. These are decision aids, not calibrated probabilities.

## 5. Preference and confidence (unweighted)

- Career interest: high / medium / low / unknown, grounded in saved or current user preferences.
- Culture: confirmed observations or unknown. Marketing language is not evidence of a personal fit.
- Confidence: high / medium / low, with reasons about posting completeness and evidence specificity. This describes evidence quality, not confidence of being hired.
- Salary: optional benchmark only; do not infer a salary floor or score salary without a user preference.

Ranking order: show eligible and conditional lists separately; within each show VIE first, Canadian local contracts second. Within Canada, show Québec and other provinces as explicit subgroups (Québec preferred). Sort within each subgroup by capped hiring-fit score descending, then confidence, then upcoming deadline, then newest verified posting date. Unknown dates go last in date ties. Show excluded/unavailable jobs separately with reasons. Never promote a low-fit VIE over a strong Canada role without making the track grouping explicit.

## 6. Evaluation output

Present role/company/link, source date, role family and the gate table. Then show the requirement matrix, dimension scores, raw/capped overall score, band, confidence, separate preference notes, top three strengths, material gaps and a concrete apply/clarify/skip recommendation. For triage the matrix may be compact, but keep the underlying evidence in ranking state.

### One worked example (hypothetical, not a live vacancy)

Assume a junior commerce-data/AI developer local contract in Montréal starting January 2027. The employer accepts early-career candidates and asks for the requirements below. Authorization is not yet confirmed.

| Requirement | Dimension | Weight | Credit | Evidence |
|---|---|---:|---:|---|
| BigQuery SQL/model development (essential) | Technical | 2 | 1.00 | L’Oréal models, SQL and stored procedures |
| LLM tool integration (essential) | Technical | 2 | 1.00 | In-app assistant and eight tools |
| Airflow (preferred) | Technical | 1 | 0.00 | Not evidenced in latest CV |
| Deliver a business-facing data product (essential) | Responsibilities | 2 | 1.00 | Co-developed commerce webapp |
| Coordinate stakeholders and maintain operations (essential) | Responsibilities | 2 | 1.00 | Main contact, delivery and production operations |
| Own features with engineering support; no minimum years (essential) | Seniority/scope | 2 | 1.00 | Own assistant/features, co-development with full-stack developer |
| Commerce data experience (preferred) | Domain | 1 | 1.00 | Global Commerce Data Domain |

Technical = 100 × 4/5 = 80; responsibilities = 100; seniority/scope = 100; domain = 100. Overall = 0.40×80 + 0.35×100 + 0.15×100 + 0.10×100 = **92/100**. No cap: the unsupported tool is preferred, not mandatory. This is **Conditional Strong** because authorization is unresolved. The seniority score measures this junior role's stated scope, not senior-level capability. Career interest is high based on the CV’s business-focused AI positioning; company culture is unknown and adds no points.

If the posting instead requires five years of production experience, the seniority dimension must be rescored and the 59-point cap applies (or exclude if explicitly non-negotiable). Technical overlap cannot override that mismatch.

## Company Research Checklist

For `/apply` and `/interview`, verify company products, team and role context from primary sources; distinguish company statements from independent evidence. Research named contacts only using public professional information. Record uncertainty. Triage needs no company research.

## Employer questions

Suggest contacting the named employer contact only for a useful unanswered question: essential requirements, start-date flexibility, team responsibilities or first-six-month expectations. Prepare a brief pitch and specific questions. Never invent a conversation or contact anyone automatically.
