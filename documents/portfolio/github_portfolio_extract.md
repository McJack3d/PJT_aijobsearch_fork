# GitHub Portfolio Extract — Alexandre Bredillot

Source: https://mcjack3d.github.io/ and https://github.com/McJack3d (extracted during /setup)
GitHub username: McJack3d

## Headline
"Data & AI specialist — turning financial and operational data into reliable insight and automation."
Open to opportunities in data science, AI strategy, and data governance roles.

## Projects (from portfolio + repos)

### 1. MSc Thesis — Sentiment Analysis & Short-Term Return Predictability in Small-Cap Nuclear Equities
- Five-phase pipeline: feasibility audit → data engineering → FinBERT sentiment scoring → LSTM training → SHAP explainability
- Dataset: 3,992 ticker-days, 25,885 news articles
- Key finding: sentiment augmentation gave a statistically significant 5.18% average MAE improvement at the 5-day horizon
- Tech: Python, FinBERT/NLP, LSTM, SHAP, financial ML

### 2. TRAD_BOT — Algorithmic Trading Suite (repo: McJack3d/TRAD_BOT, Python)
- Two independent bots in one repo:
  - Binance funding-rate arbitrage bot: delta-neutral cash-and-carry (long spot + short perp), harvest funding every 8h; event-driven backtester, risk kill-switches, reconciliation loop, Telegram/email monitoring
  - IBKR sentiment bot: long/short US equities via two-stage sentiment funnel (FinBERT → LLM gatekeeper) with dollar-neutral overlay
- Modes: backtest / paper / dry-run / live. Pydantic-validated config, async SQLAlchemy state, systemd + docker-compose deploy (IB Gateway + Redis + TimescaleDB + Qdrant), CI workflow
- Tech: Python, Binance/IBKR APIs, asyncio, SQLAlchemy, Streamlit

### 3. FIN_PP — Stock Price Prediction System (repo: McJack3d/FIN_PP, Python)
- Stock price predictor combining fundamental + technical + sentiment analysis. Currently paused ("experience accumulation period")

### 4. kleerer.io (repo: McJack3d/kleerer.io, JavaScript/Python) — web product, ★1

## Work experience surfaced by portfolio (BEYOND the CV)
- **Sienna Investment Managers** — Account Payables Trainee (January–July 2024): treasury management, cash projections, management reporting, invoice processing, regulatory compliance
- **EasyBourse** — Business Development support (April–July 2023): market/sales analysis, campaign coordination, quotation preparation

## Certifications (from portfolio)
- SAFe 6 Agilist (2026)
- Bloomberg Market Concepts (2025)
- Multiple Anthropic AI / Claude certifications
- IBM Data Science specialization courses

## Additional test scores (from portfolio)
- English C1 — TOEIC 970, TOEFL iBT 95   [NOTE: CV states TOEIC 990 — conflict to resolve]

## Skills emphasis (portfolio adds vs CV)
- Adds **Tableau** and **PostgreSQL** and **Docker (basics)** to the CV's stack
- Methods: data governance, data quality, statistical analysis, time-series forecasting, NLP/sentiment analysis, model interpretability (SHAP), product thinking, cross-functional collaboration
