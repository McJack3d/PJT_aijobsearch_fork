# Interview Preparation Guide

<!-- SETUP: STAR examples are personalized by running /setup based on your actual experience -->

## STAR Format

Structure answers as: **Situation** (context), **Task** (your responsibility), **Action** (what you did), **Result** (outcome).

Keep answers to 1-2 minutes. Be specific. End with what you learned or would do differently.

## Ready-Made STAR Examples

<!-- Drafted by /setup from documented experience. Verify the exact figures/wording before an interview. -->

### 1. MSc Thesis — sentiment-augmented equity return prediction (applied ML / rigor)
**S:** Wanted to test whether news sentiment adds predictive signal for short-term returns in small-cap nuclear equities, an under-researched, noisy segment.
**T:** Design and run the whole study end to end, and prove any improvement was real, not noise.
**A:** Built a five-phase pipeline — feasibility audit, data engineering (3,992 ticker-days, 25,885 news articles), FinBERT sentiment scoring, LSTM training, and SHAP explainability — and benchmarked sentiment-augmented vs. baseline models.
**R:** Sentiment augmentation gave a statistically significant 5.18% average MAE improvement at the 5-day horizon; SHAP made the driver features interpretable.
**Use for:** "Walk me through an end-to-end ML project", "How do you validate a model?", "Tell me about a time you handled messy data"

### 2. TRAD_BOT — production-grade algorithmic trading suite (engineering / risk-awareness)
**S:** Wanted to trade two strategies (Binance funding-rate arbitrage; IBKR sentiment long/short) safely with real money on the line.
**T:** Build systems that are correct and fail safe, not just backtest-profitable.
**A:** Engineered spec-driven bots with an event-driven backtester, pre-trade risk checks, a kill-switch, a reconciliation loop, and Telegram/email monitoring; staged execution through backtest → paper → dry-run → live gates; async SQLAlchemy state, Pydantic config, systemd + docker-compose deploy, CI.
**R:** A deployable suite that only reaches live trading after explicit acceptance gates pass, with adversarial risk-manager tests in CI.
**Use for:** "Tell me about a technically complex project", "How do you handle risk/edge cases?", "Describe something you built beyond coursework"

### 3. La Banque Postale — "Commando" payment-flow steering tools (delivery / stakeholders)
**S:** The payment department lacked real-time visibility into SEPA/PSD2/Instant Payment flows and relied on slow manual reporting.
**T:** Automate reporting and give the team live monitoring.
**A:** Built the "Commando" steering tools — dashboards and automated reporting in QlikSense, Dataiku, Python, and SQL — plus validation rules, automated error detection, and XML mapping for traceability.
**R:** Real-time monitoring of payment flows, faster anomaly detection, and reduced operational delays and costs.
**Use for:** "Tell me about a time you improved a process", "How do you work with non-technical stakeholders?", "Describe automating something manual"

### 4. L'Oréal — B2B commerce data product (data structuring / cross-functional)
**S:** B2B commerce data (Salesforce structure, points of sale, customer data) was scattered and hard for business stakeholders to use.
**T:** Make it accessible and trustworthy through a dashboard webapp for the "Find Your Customer" project.
**A:** Processed and structured large volumes of data, enforced data quality, handled master-data structuring, and worked daily with Data Product Owners and Data Engineers to optimize flows and delivery.
**R:** A stakeholder-facing dashboard making B2B commerce data usable across business teams. *(ongoing internship — quantify impact when available)*
**Use for:** "Tell me about cross-functional work", "How do you ensure data quality?", "Describe delivering for business users"

<!-- Add more STAR examples as needed. Aim for 4-6 covering different competencies. -->

## Common Tough Questions

### "Why did you leave [previous company]?"
> [PREPARE YOUR ANSWER - be honest, forward-looking, no negativity about former employer]

### "You don't have [specific skill/experience]."
> [PREPARE YOUR ANSWER - acknowledge the gap, bridge to adjacent experience, show willingness to learn]

### "Where do you see yourself in 5 years?"
> [PREPARE YOUR ANSWER - show ambition aligned with the role's growth path]

### "What's your biggest weakness?"
> [PREPARE YOUR ANSWER - genuine weakness with concrete mitigation strategy]

### "Why this company specifically?"
> Customize per company. Must reference: specific projects, company values, market position, or team structure. Never give a generic answer.

## Questions You Should Ask Interviewers

### About the Role
- "What does a typical week look like in this role?"
- "What would success look like in the first 6 months?"
- "What's the biggest challenge the team is facing right now?"

### About the Team
- "How big is the team, and how do you divide work?"
- "What does the development/project lifecycle look like, from idea to production?"
- "How do you onboard new team members?"

### About Tech & Growth
- "What's your current tech stack for [relevant area]?"
- "Is there room to grow into more architectural or strategic decisions?"
- "How does the team stay current with new tools and methods?"

### About Culture (use these to prevent disappointment)
- "How would you describe the team culture?"
- "What does professional development look like here?"
- "Is there flexibility for remote/hybrid work?"
- "What's the balance between development/new projects and maintenance work?"
- "How would you describe the leadership style in this team?"
- "What do people who thrive here have in common?"

## Phone/Video Interview Tips
- Have STAR examples written out (use this file)
- Keep a glass of water nearby
- Smile when speaking (it changes your tone)
- Ask for clarification if a question is vague
- It's OK to take 5 seconds to think before answering
- End with: "Is there anything else you'd like to know about my background?"

## After the Application (Best Practice)

### Follow-Up Etiquette
- **Don't call to "stand out"** or to learn more about the role post-submission - this risks a negative impression
- If the employer specified a timeline, respect it and wait
- If no timeline was given and significant time has passed (2+ weeks), a brief call to ask about status is acceptable
- If you have genuinely new, relevant information to share, a short follow-up is fine

### Thank-You Notes
- When you receive any update (interview invitation, rejection, or status update), send a brief thank-you message
- Express appreciation for their time and the process
- Keep it short (2-3 sentences)

## Roleplay Guidelines
When the user asks for interview practice:
1. Ask which role/company to simulate
2. Start with easy warm-up questions ("Tell me about yourself")
3. Progress to role-specific technical questions
4. Include 1-2 behavioral questions using the competencies from the job posting
5. End with a tough question or curveball
6. After each answer, give brief feedback: what worked, what to sharpen
7. Suggest which STAR example would work best for each question
