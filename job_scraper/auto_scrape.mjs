#!/usr/bin/env node
// Import actual search results as discovery candidates; /rank evaluates full postings.
// Usage: node job_scraper/auto_scrape.mjs <results.json>
// No input means no write. This replaces the old hard-coded September job list.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function importCandidates(state, input, date = new Date().toISOString().slice(0, 10)) {
  const jobs = Array.isArray(input) ? input : input?.results ?? input?.reviewed;
  if (!Array.isArray(jobs)) throw new Error('Expected an array, results array, or reviewed array.');
  if (!state || !state.seen || typeof state.seen !== 'object' || Array.isArray(state.seen)) {
    throw new Error('Invalid discovery state: expected a seen object.');
  }
  // Validate every entry before changing state, preventing partial imports.
  const clean = jobs.map((job) => {
    if (!job || !['title', 'company', 'url'].every(k => typeof job[k] === 'string' && job[k].trim())) {
      throw new Error('Each candidate needs a non-empty title, company and URL.');
    }
    const url = new URL(job.url);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Expected an HTTP(S) job URL.');
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (/^utm_/i.test(key) || ['trackingId', 'refId'].includes(key)) url.searchParams.delete(key);
    }
    return { ...job, url: url.href };
  });
  const seen = { ...state.seen };
  const urls = new Set(Object.values(seen).map(j => {
    if (!j?.url) return null;
    try {
      const u = new URL(j.url); u.hash = '';
      for (const key of [...u.searchParams.keys()]) {
        if (/^utm_/i.test(key) || ['trackingId', 'refId'].includes(key)) u.searchParams.delete(key);
      }
      return u.href;
    } catch { return j.url; }
  }));
  const added = [];
  for (const job of clean) {
    if (urls.has(job.url) || Object.hasOwn(seen, job.url)) continue;
    const candidate = {
      title: job.title, company: job.company, url: job.url,
      location: job.location ?? null, date: job.date ?? null,
      source: job.source ?? 'imported-search-results', first_seen: date,
      description: job.description ?? null,
      retrieved_at: job.retrieved_at ?? null,
      fit: 'needs_evaluation', status: 'new',
      fit_notes: 'Full posting and current CV must be evaluated with /rank; eligibility unverified.',
    };
    // Incoming fit/status/rank fields are intentionally not trusted or reused.
    seen[job.url] = candidate;
    urls.add(job.url);
    added.push(candidate);
  }
  return { state: { ...state, seen }, added, duplicates: jobs.length - added.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (!process.argv[2]) throw new Error('Usage: node job_scraper/auto_scrape.mjs <results.json>. No jobs fetched or state changed.');
    const statePath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'seen_jobs.json');
    const state = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : { seen: {} };
    const result = importCandidates(state, JSON.parse(fs.readFileSync(process.argv[2], 'utf8')));
    fs.writeFileSync(statePath, JSON.stringify(result.state, null, 2) + '\n');
    console.log(`Imported ${result.added.length} candidates; skipped ${result.duplicates} duplicates. Run /rank for evidence-based evaluation.`);
    for (const job of result.added) console.log(`[NEEDS EVALUATION] ${job.title} — ${job.company}: ${job.url}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
