# /outcome - Save Optional Application Feedback

Run only when the user explicitly wants to save interview feedback or submitted materials. No application log, status CSV, routine outcome prompts or automatic score calibration is maintained.

1. Accept company/role and feedback from the user. Resolve an existing `documents/applications/<company>_<role>/` folder if present; ask only for missing context. No prior registration is required.
2. If requested, copy the actual submitted CV/letter (PDF, DOCX or TeX) supplied or confirmed by the user into that folder. Never infer that the latest draft was submitted. Preserve existing archived versions.
3. If supplied, save the actual posting with source URL and retrieval date as `job_posting.md`. Never reconstruct a dead posting from memory.
4. Save dated feedback in `outcome.md` using the optional format in `documents/README.md`: status, stages reached and notes. Preserve previous entries and avoid duplicating the same update. Status describes only what the user reports; never assume silence means rejection.
5. Confirm only what was saved. Do not update discovery state or prompt for ongoing outcome collection. `/interview` can use this folder, or take a posting directly.

This is an optional note-taking utility, not an input to job ranking. Do not alter weights or candidate evidence based on sparse outcomes.
