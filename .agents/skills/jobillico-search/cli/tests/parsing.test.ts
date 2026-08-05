import { describe, expect, test } from "bun:test";
import {
  parseJobCards,
  parseJobDetail,
  filterByAge,
  htmlToText,
  decodeHtmlEntities,
} from "../src/helpers";
import { normalizeId } from "../src/commands/detail";
import { buildUrl } from "../src/commands/search";

// Trimmed from a real www.jobillico.com/search-jobs response: one organic card,
// one sponsored "partner" card (no data-job-url), one card missing its date.
const SEARCH_FIXTURE = `
<article class="has-tag-partner card card--clickable none-trigger">
  <div class="card__content"><header>
    <h2 class="h3 mb0 pr5 word-break"><a href="/see-partner-offer/999">Sponsored Role</a></h2>
  </header></div>
</article>
<article class="card card--clickable" data-job-url="soucy/product-data-analyst/17338241?lshs=abc&ipg=1" data-company-id="508">
  <div class="card__content">
    <header class="relative font-0">
      <h2 class="h3 mb0 pr5 word-break"><a href="/en/job-offer/soucy/product-data-analyst/17338241?lshs=abc" id="1" rel='nofollow'>Product Data Analyst</a></h2>
      <h3 class="h4"><a class="link companyLink js--stopPropagationEvent" href="/see-company/soucy?lshs=abc">Soucy</a></h3>
    </header>
    <p class="xs word-break"> Mission Are you passionate about data? [...]</p>
    <ul class="list list--has-no-bullets">
      <li class="list__item mb1"><span class="icon icon--information icon--information--position"></span>
        <p class="inline xs valign-middle">Drummondville - QC</p></li>
      <li class="list__item mb1"><span class="icon icon--information icon--information--clock"></span>
        <p class="inline xs valign-middle">Full time</p></li>
      <li class="list__item"><span class="icon icon--information icon--information--calendar"></span>
        <p class="inline valign-middle"><time class="xs" datetime="2026-07-08">3 weeks ago</time></p></li>
    </ul>
  </div>
</article>
<article class="card card--clickable" data-job-url="acme/analyste-de-donn-es/17400765">
  <div class="card__content"><header>
    <h2 class="h3"><a href="/fr/offre-d-emploi/acme/analyste-de-donn-es/17400765">Analyste de donn&#233;es</a></h2>
    <h3 class="h4"><a class="link companyLink" href="/see-company/acme">Acme Qu&eacute;bec</a></h3>
  </header>
  <ul class="list"><li class="list__item mb1"><span class="icon icon--information icon--information--position"></span>
    <p class="inline xs valign-middle">Montr&#233;al - QC</p></li></ul>
  </div>
</article>
`;

describe("parseJobCards", () => {
  const cards = parseJobCards(SEARCH_FIXTURE);

  test("skips sponsored partner cards that carry no data-job-url", () => {
    expect(cards).toHaveLength(2);
    expect(cards.some((c) => c.title === "Sponsored Role")).toBe(false);
  });

  test("extracts every contract field from an organic card", () => {
    const c = cards[0];
    expect(c.id).toBe("17338241");
    expect(c.title).toBe("Product Data Analyst");
    expect(c.company).toBe("Soucy");
    expect(c.companyUrl).toBe("https://www.jobillico.com/see-company/soucy");
    expect(c.location).toBe("Drummondville - QC");
    expect(c.date).toBe("2026-07-08");
    expect(c.employmentType).toBe("Full time");
    expect(c.url).toBe(
      "https://www.jobillico.com/en/job-offer/soucy/product-data-analyst/17338241",
    );
    expect(c.snippet).toContain("Mission");
  });

  test("decodes French accents and nulls missing fields rather than omitting them", () => {
    const c = cards[1];
    expect(c.title).toBe("Analyste de données");
    expect(c.company).toBe("Acme Québec");
    expect(c.location).toBe("Montréal - QC");
    expect(c.date).toBeNull();
    expect(c.employmentType).toBeNull();
    expect("date" in c && "employmentType" in c).toBe(true);
  });

  test("returns an empty array on markup with no cards", () => {
    expect(parseJobCards("<html><body>no results</body></html>")).toEqual([]);
  });
});

describe("decodeHtmlEntities", () => {
  test("decodes named, decimal, and hex references", () => {
    expect(decodeHtmlEntities("Qu&eacute;bec &#233; &#xE9;")).toBe("Québec é é");
  });

  test("does not double-decode an escaped entity", () => {
    expect(decodeHtmlEntities("&amp;lt;")).toBe("&lt;");
  });
});

describe("htmlToText", () => {
  test("strips tags, bullets lists, and preserves paragraph breaks", () => {
    const out = htmlToText(
      "<strong>Mission</strong><p>Nous cherchons un analyste.</p><ul><li>SQL</li><li>Python</li></ul>",
    );
    expect(out).toContain("Mission");
    expect(out).toContain("• SQL");
    expect(out).toContain("• Python");
    expect(out).not.toContain("<");
  });
});

describe("parseJobDetail", () => {
  const DETAIL_FIXTURE = `
    <link rel="canonical" href="https://www.jobillico.com/en/job-offer/soucy/product-data-analyst/17338241" />
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Jobillico"}</script>
    <script type="application/ld+json">{ not valid json }</script>
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"JobPosting",
      "title":"Product data analyst","url":"https://www.jobillico.com/en/job-offer/soucy/product-data-analyst/17338241",
      "industry":"Manufacturing","salaryCurrency":"CAD","validThrough":"2026-08-06","datePosted":"2026-07-08",
      "hiringOrganization":{"@type":"Organization","legalName":"Soucy","url":"https://www.jobillico.com/see-company/soucy"},
      "jobLocation":{"@type":"Place","address":{"@type":"PostalAddress","addressCountry":"CA","addressLocality":"Drummondville","addressRegion":"QC"}},
      "employmentType":"CONTRACTOR","description":"<strong>Mission</strong><p>Data quality work.</p>"}</script>`;

  test("reads the JobPosting block past unrelated and malformed JSON-LD", () => {
    const d = parseJobDetail(DETAIL_FIXTURE, "17338241", "en");
    expect(d.title).toBe("Product data analyst");
    expect(d.company).toBe("Soucy");
    expect(d.location).toBe("Drummondville - QC");
    expect(d.date).toBe("2026-07-08");
    expect(d.deadline).toBe("2026-08-06");
    expect(d.employmentType).toBe("CONTRACTOR");
    expect(d.industry).toBe("Manufacturing");
    expect(d.salaryCurrency).toBe("CAD");
    expect(d.description).toContain("Data quality work.");
    expect(d.description).not.toContain("<p>");
  });

  test("falls back to og:title when no JSON-LD is present", () => {
    const d = parseJobDetail(
      '<meta property="og:title" content="Analyste BI" />',
      "123456",
      "fr",
    );
    expect(d.title).toBe("Analyste BI");
    expect(d.company).toBeNull();
    expect(d.description).toBeNull();
  });
});

describe("filterByAge", () => {
  const now = new Date("2026-08-04T09:00:00Z");
  const cards = parseJobCards(SEARCH_FIXTURE);

  test("keeps postings inside the window", () => {
    expect(filterByAge(cards, 60, now)).toHaveLength(1);
  });

  test("drops postings older than the window", () => {
    expect(filterByAge(cards, 7, now)).toHaveLength(0);
  });

  test("keeps same-day postings regardless of clock time", () => {
    const today = parseJobCards(
      SEARCH_FIXTURE.replace('datetime="2026-07-08"', 'datetime="2026-08-04"'),
    );
    expect(filterByAge(today, 1, now)).toHaveLength(1);
  });

  test("is a no-op for the 'all postings' sentinel", () => {
    expect(filterByAge(cards, 9999, now)).toHaveLength(2);
  });
});

describe("normalizeId", () => {
  test.each([
    ["17338241", "17338241"],
    ["https://www.jobillico.com/en/job-offer/soucy/product-data-analyst/17338241", "17338241"],
    ["https://www.jobillico.com/fr/offre-d-emploi/acme/analyste/17400765?lshs=abc", "17400765"],
  ])("parses %p", (input, expected) => {
    expect(normalizeId(input)).toBe(expected);
  });

  test("rejects input with no ID", () => {
    expect(normalizeId("not-a-job")).toBeNull();
  });
});

describe("buildUrl", () => {
  const base = { query: "data analyst", jobage: 9999, lang: "en" as const, page: 1, format: "json" as const };

  test("emits only robots-permitted parameters", () => {
    const url = buildUrl({ ...base, location: "Montreal" });
    expect(url).toStartWith("https://www.jobillico.com/search-jobs?");
    expect(url).toContain("skwd=data+analyst");
    expect(url).toContain("scty=Montreal");
    // Disallowed by robots.txt — must never be sent.
    for (const p of ["flat=", "flng=", "mfil=", "iPerPage="]) {
      expect(url).not.toContain(p);
    }
    expect(url).not.toContain("ipg=");
  });

  test("uses the French search path for --lang fr", () => {
    expect(buildUrl({ ...base, lang: "fr" })).toStartWith(
      "https://www.jobillico.com/recherche-emploi?",
    );
  });

  test("sorts by date when --jobage is set and no sort was chosen", () => {
    expect(buildUrl({ ...base, jobage: 7 })).toContain("sort=date");
  });

  test("respects an explicit --sort over the jobage default", () => {
    expect(buildUrl({ ...base, jobage: 7, sort: "pert" })).toContain("sort=pert");
  });
});
