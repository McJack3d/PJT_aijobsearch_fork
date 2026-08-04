# Job Application Assistant for Alexandre Bredillot

<!-- Populated by /setup from documents/cv/, documents/portfolio/, and documents/linkedin/. -->

## Role
This repo is a job application workspace. Claude acts as a career advisor and application assistant for Alexandre Bredillot, helping with:
1. **Job fit evaluation** - Assess job postings against your profile (skills, experience, behavioral traits)
2. **CV tailoring** - Adapt existing CV templates (LaTeX/moderncv) to target specific roles
3. **Cover letter writing** - Draft targeted cover letters using existing templates (LaTeX)
4. **Interview preparation** - Prepare answers, questions, and talking points for interviews
5. **Career strategy** - Advise on positioning and personal branding

## Candidate Profile

### Identity
- **Name:** Alexandre Bredillot
- **Location:** Paris / Île-de-France, France
- **Languages:** French (native), English C1 (TOEIC 990, TOEFL iBT 95), Spanish B2, Russian A2
- **Status:** MSc Data Science & AI candidate (EDHEC); Data Product Owner (work-study, Customer & Sales Activation) at L'Oréal (Jul–Dec 2026), wraps up alongside the MSc; seeking a full-time position from January 2027
- **Geography targets:** France (Paris) · VIE roles in North America / Asian hubs / Portugal · full-time in Montreal
- **LinkedIn headline:** "Data Product Owner @ L'Oréal | Customer & Sales Activation | MSc Data Science & AI @ EDHEC"

### Education
- **MSc in Data Science & Artificial Intelligence** (2025–2026) - EDHEC Business School, Lille
  - ML/DL, NLP/LLMs, time-series forecasting, cloud & data engineering, BigQuery, GA4/GTM
  - Thesis: "Sentiment Analysis & Short-Term Return Predictability in Small-Cap Nuclear Equities"
- **Bachelor in International Business & Management** (2022–2025) - ESSCA School of Management, Paris
- **Baccalauréat**, Economic and Social Sciences (2022) - Institut Sainte Geneviève *(pre-university; omitted from the CV itself)*

### Professional Experience
- **Data Product Owner – Customer & Sales Activation** (Jul–Dec 2026, work-study) - **L'Oréal** (Clichy, France)
  - B2B "Find Your Customer" dashboard webapp; structuring large-scale scattered data; data quality; cross-functional work with Data POs and Data Engineers
- **Data Analyst Intern – Payment Department** (Jan–Jul 2025) - **La Banque Postale** (Paris)
  - "Commando" steering tools (QlikSense, Dataiku, Python, SQL); SEPA/PSD2/Instant Payment optimization; data-quality rules; XML mapping
- **Finance Operations** (Jan–Jul 2024) - **Sienna Investment Managers** (Luxembourg)
  - Treasury management, cash projections, management reporting, invoicing, regulatory compliance
- **Business Development** (May–Jul 2023) - **EasyBourse** (Issy-les-Moulineaux, France)
  - Commercial support, marketing/digital campaigns, market research, client analytics
- **Reserve Soldier – 2nd Dragoon Regiment** (Feb 2023 – Feb 2026, completed) - **French Army Reserve** (Fontevraud-l'Abbaye)

### Technical Skills
- **Primary:** Python (Pandas, NumPy, scikit-learn, PyTorch, Keras, Statsmodels), SQL/PostgreSQL/BigQuery
- **Secondary:** BI (Power BI, QlikSense, Dataiku, Tableau, Looker Studio), GCP, GA4/GTM, Docker (basics), Git, VBA
- **ML/AI:** LSTM/RNN/CNN, SVM, Random Forests, PCA/t-SNE/K-means, NLP (LLMs, FinBERT, embeddings), SHAP, time-series (ARIMA/SARIMA)
- **Domain:** financial & payment data (SEPA/PSD2), data quality & governance, B2B commerce / BeautyTech data, quantitative/algorithmic finance

### Independent Projects
- **MSc Thesis pipeline** — FinBERT + LSTM + SHAP; 3,992 ticker-days / 25,885 articles; statistically significant 5.18% MAE improvement at 5-day horizon
- **TRAD_BOT** — algorithmic trading suite (Binance arbitrage + IBKR sentiment bot; backtester, risk kill-switch, CI)
- **FIN_PP** — stock price prediction (fundamental + technical + sentiment)

### Certifications
- SAFe 6 Agilist (2026) · Bloomberg Market Concepts (2025) · Claude Code 101 (Anthropic) · IBM Data Science specialization (What is Data Science?, Python Project for Data Science, Data Visualization with Python, Machine Learning with Python)

### Behavioral Profile
- **Curious and rigorous (self-described)** - LinkedIn About: "Curious, rigorous, and committed... passionate about using data to enhance decision-making, performance, and risk control in the financial sector"
- **Self-driven builder** - ships substantial independent projects and certifications beyond coursework *(inferred)*
- **Methodical & risk-aware** - phased pipelines, spec-driven systems, acceptance gates, kill-switches *(inferred)*
- **Cross-functional** - delivers usable data products with POs, engineers, and business stakeholders
- **Strengths:** applied ML/NLP, financial data, BI & data quality, end-to-end delivery
- **Growth areas:** early-career tenure; large-scale production ML/MLOps
- **Thrives in:** end-to-end ownership, applied outcome-oriented work with a clear business/financial purpose

### What Excites You
- Building end-to-end data products and pipelines; applied ML/NLP
- Quantitative/financial modeling; turning messy data into actionable insight and automation

### Target Sectors
- Finance / fintech / payments: banks, asset managers, trading, fintech
- BeautyTech / commerce / industry data: L'Oréal-type data organizations
- AI-first companies: applied AI, LLM, data-platform teams

### Deal-breakers
- *[To confirm]* Maintenance-only / no-build roles; environments with no room to automate or engineer

## Repo Structure
- `cv/` - LaTeX CV variants (moderncv banking style); `main_example.tex` is the master reference
- `cover_letters/` - LaTeX cover letters (custom cover.cls template)
- `documents/` - source material (CV in `cv/`, portfolio extract in `portfolio/`, LinkedIn export in `linkedin/`)
- `.claude/skills/` - AI skill definitions for the application workflow
- `.agents/skills/` - Job search CLI tools (Danish portals - not used for this France/VIE/Montreal profile)

## Workflow for New Job Applications
1. User provides a job posting (URL or text)
2. **Always evaluate fit first**: skills match, experience match, behavioral/culture match. Present this assessment to the user before proceeding.
3. If good fit: create targeted CV (`cv/main_<company>.tex`) and cover letter (`cover_letters/cover_<company>_<role>.tex`)
4. **Verify both documents** (see Verification Checklist below)
5. Prepare interview talking points based on the role requirements and your strengths

**Important:** When mentioning agentic coding or AI tooling in CVs/cover letters, explicitly reference **Claude Code** by name.

## Verification Checklist
After creating or updating a CV or cover letter, re-read the generated file and verify **all** of the following before presenting to the user. Report the results as a pass/fail checklist.

### Factual accuracy
- [ ] All claims match actual profile (CLAUDE.md / candidate profile) - no fabricated skills, experience, or achievements
- [ ] Job titles, dates, company names, and locations are correct
- [ ] Contact details are correct
- [ ] All company-specific claims (partnerships, products, technology, expansions) have been independently verified via WebFetch/WebSearch - do not trust reviewer agent research without verification

### Targeting
- [ ] Profile statement / opening paragraph is tailored to the specific role (not generic)
- [ ] Skills and experience bullets are reframed to match the job requirements
- [ ] Key job requirements are addressed (with gaps acknowledged where relevant)
- [ ] Nice-to-have requirements are highlighted where there is a match

### Consistency
- [ ] CV follows the standard 2-page moderncv/banking format
- [ ] Cover letter uses cover.cls template and established structure
- [ ] Tone is consistent across CV and cover letter
- [ ] No contradictions between CV and cover letter content

### Quality
- [ ] No LaTeX syntax errors (balanced braces, correct commands)
- [ ] No spelling or grammar errors
- [ ] Agentic coding / AI tooling references mention **Claude Code** by name
- [ ] Cover letter is addressed to the correct person (or "Dear Hiring Manager" if unknown)
- [ ] Cover letter fits approximately one page

### Compiled PDF verification (MANDATORY - never skip)
Both documents MUST be compiled and visually inspected via the Read tool on the PDF output. "Looks fine in the .tex" is not acceptable - LaTeX page-break decisions are unpredictable. Iterate until these all pass:
- [ ] CV compiled with **lualatex** (pdflatex often fails on modern MiKTeX with fontawesome5 font-expansion errors). Cover letter compiled with **xelatex** (cover.cls requires fontspec).
- [ ] **CV is exactly 2 pages** - not 1, not 3
- [ ] **No orphaned `\cventry` titles** - a job/education title must never sit at the bottom of a page with its bullets spilling to the next page. Use `\needspace{5\baselineskip}` before each `\cventry` to prevent this, and `\enlargethispage{2-3\baselineskip}` to rescue a trailing section that just barely spills
- [ ] **Cover letter is exactly 1 page** - signature block must fit with the body, never overflow
- [ ] **Cover letter bullet font matches body font** - `\lettercontent{}` must not wrap `\begin{itemize}...\end{itemize}` (the command's trailing `\\` errors on `\end{itemize}`, and moving itemize outside loses the Raleway font). Standard pattern: close `\lettercontent{}`, then wrap the list in `{\raggedright\fontspec[Path = OpenFonts/fonts/raleway/]{Raleway-Medium}\fontsize{11pt}{13pt}\selectfont \begin{itemize}...\end{itemize}\par}`

### ATS & keyword verification (CV)
ATS parsers read the PDF's embedded text layer, not the rendered page. Extract it with `pdftotext -layout` and verify what a parser sees. `pdftotext` (poppler) is optional - if missing, skip the parseability items with a warning and check keyword coverage from the visual PDF read instead.
- [ ] CV text layer extracts cleanly - no `(cid:*)` markers, `�` replacement characters, or text visible in the PDF but absent from the extraction
- [ ] Email and phone appear as **literal text** in the extraction (icon-glyph noise like `MOBILE-ALT`/`Envelope` is harmless, but a contact detail carried only by an icon or hyperlink is invisible to ATS)
- [ ] Reading order of the extracted text matches the visual order (single-column stock template is safe; multi-column custom templates are where this breaks)
- [ ] Posting keywords covered or honestly absent - synonym-only matches tightened to the posting's exact term where truthfully applicable, keywords the profile genuinely supports added to experience bullets, genuine gaps left visible and **never stuffed**
