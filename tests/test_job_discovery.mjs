import test from 'node:test';
import assert from 'node:assert/strict';
import { importCandidates } from '../job_scraper/auto_scrape.mjs';

test('senior titles and incoming high scores cannot manufacture fit', () => {
  const original = { seen: {}, meta: 'preserve' };
  const { state, added } = importCandidates(original, [{
    title: 'Senior Data Scientist', company: 'Example', url: 'https://example.com/job/1',
    fit: 'high', rank_score: 99, status: 'ranked', date: '2026-09-14',
  }], '2026-10-07');
  assert.equal(added[0].fit, 'needs_evaluation');
  assert.equal(added[0].status, 'new');
  assert.equal(added[0].rank_score, undefined);
  assert.equal(added[0].date, '2026-09-14');
  assert.equal(state.meta, 'preserve');
  assert.deepEqual(original.seen, {});
});

test('reruns and URL tracking variants preserve existing ranking', () => {
  const old = { url: 'https://example.com/job/1?utm_source=old', status: 'ranked', rank_score: 75 };
  const state = { seen: { old } };
  const input = { reviewed: [
    { title: 'Analyst', company: 'Example', url: 'https://example.com/job/1#apply' },
    { title: 'Engineer', company: 'Example', url: 'https://example.com/job/2?utm_source=new' },
    { title: 'Engineer', company: 'Example', url: 'https://example.com/job/2' },
  ] };
  const result = importCandidates(state, input);
  assert.equal(result.duplicates, 2);
  assert.equal(result.added.length, 1);
  assert.deepEqual(result.state.seen.old, old);
  assert.equal(importCandidates(result.state, input).added.length, 0);
});

test('invalid batches fail without mutating discovery state', () => {
  const state = { seen: {} };
  assert.throws(() => importCandidates(state, [
    { title: 'Analyst', company: 'Example', url: 'https://example.com/job/1' },
    { title: 'Invalid', company: 'Example', url: 'file:///tmp/job' },
  ]));
  assert.deepEqual(state, { seen: {} });
  assert.throws(() => importCandidates(state, { incorrect: [] }));
});
