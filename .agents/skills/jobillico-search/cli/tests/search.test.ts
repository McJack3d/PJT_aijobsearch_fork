// Live smoke tests against www.jobillico.com. They make a handful of real
// requests; if the portal is unreachable or rate-limits, they fail loudly
// rather than silently passing on empty data.
import { describe, test, expect } from "bun:test";
import { runCLI, parseJSON } from "./helpers";

interface SearchResponse {
  meta: { count: number; page: number };
  results: Array<{
    id: string;
    title: string;
    company: string | null;
    location: string | null;
    date: string | null;
    url: string;
  }>;
}

describe("live search", () => {
  test("returns real, fully-populated results for 'data analyst'", async () => {
    const result = await runCLI(["search", "-q", "data analyst", "--limit", "5"]);
    expect(result.exitCode).toBe(0);

    const data = parseJSON<SearchResponse>(result);
    expect(data.meta.page).toBe(1);
    expect(data.results.length).toBeGreaterThan(0);
    expect(data.meta.count).toBe(data.results.length);

    for (const job of data.results) {
      expect(job.id).toMatch(/^\d+$/);
      expect(job.title.length).toBeGreaterThan(0);
      expect(job.title).not.toContain("<");
      expect(job.url).toStartWith("https://www.jobillico.com/");
      expect(job.url).not.toContain("?");
      // Every contract key is present even when the portal omits the value.
      for (const key of ["company", "location", "date"]) {
        expect(key in job).toBe(true);
      }
      if (job.date) expect(job.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  test("--limit 0 emits zero results", async () => {
    const data = parseJSON<SearchResponse>(
      await runCLI(["search", "-q", "data analyst", "--limit", "0"]),
    );
    expect(data.results).toHaveLength(0);
    expect(data.meta.count).toBe(0);
  });

  test("French search returns French postings", async () => {
    const data = parseJSON<SearchResponse>(
      await runCLI(["search", "-q", "analyste de données", "--lang", "fr", "--limit", "3"]),
    );
    expect(data.results.length).toBeGreaterThan(0);
    expect(data.results.every((j) => j.url.includes("/fr/"))).toBe(true);
  });

  test("--location narrows results to that city's region", async () => {
    const data = parseJSON<SearchResponse>(
      await runCLI(["search", "-q", "data analyst", "-l", "Montreal", "--limit", "5"]),
    );
    expect(data.results.length).toBeGreaterThan(0);
    expect(data.results.some((j) => (j.location ?? "").includes("QC"))).toBe(true);
  });

  test("--jobage keeps only postings inside the window", async () => {
    const data = parseJSON<SearchResponse>(
      await runCLI(["search", "-q", "data", "--jobage", "14", "--limit", "10"]),
    );
    const cutoff = Date.now() - 15 * 86400_000;
    for (const job of data.results) {
      expect(job.date).not.toBeNull();
      expect(Date.parse(job.date as string)).toBeGreaterThan(cutoff);
    }
  });
});

describe("live detail", () => {
  test("fetches a full posting by ID taken from search", async () => {
    const search = parseJSON<SearchResponse>(
      await runCLI(["search", "-q", "data analyst", "--limit", "1"]),
    );
    const id = search.results[0].id;

    const result = await runCLI(["detail", id]);
    expect(result.exitCode).toBe(0);

    const job = parseJSON<{
      id: string;
      title: string;
      company: string | null;
      description: string | null;
      url: string;
    }>(result);

    expect(job.id).toBe(id);
    expect(job.title.length).toBeGreaterThan(0);
    expect(job.description).toBeTruthy();
    expect(job.description).not.toContain("<p>");
    expect(job.description).not.toContain("&amp;");
    expect(job.url).toContain(id);
  });

  test("a well-formed but nonexistent ID exits 1 with NOT_FOUND", async () => {
    const result = await runCLI(["detail", "10000001"]);
    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stderr).code).toBe("NOT_FOUND");
  });
});
