import { describe, expect, test } from "bun:test"
import {
  normalizeOffer,
  normalizeDetail,
  parseDotEnv,
  pickCommune,
  normalizePlace,
  toPublieeDepuis,
  toRange,
  toSort,
  type Commune,
  type RawOffer,
} from "../src/helpers.js"
import { normalizeId } from "../src/commands/detail.js"

describe("normalizeOffer", () => {
  const raw: RawOffer = {
    id: "190RSQK",
    intitule: "Data Analyst (H/F)",
    dateCreation: "2026-07-30T09:12:04.000Z",
    lieuTravail: { libelle: "75 - PARIS 08", commune: "75108" },
    entreprise: { nom: "ACME DATA" },
    typeContrat: "CDI",
    typeContratLibelle: "Contrat à durée indéterminée",
    salaire: { libelle: "Annuel de 40000.0 Euros à 50000.0 Euros" },
    experienceLibelle: "1 an",
    dureeTravailLibelle: "35H",
    romeLibelle: "Data analyst",
    origineOffre: { urlOrigine: "https://candidat.francetravail.fr/offres/recherche/detail/190RSQK" },
  }

  test("maps the documented fields", () => {
    const offer = normalizeOffer(raw)!
    expect(offer.id).toBe("190RSQK")
    expect(offer.title).toBe("Data Analyst (H/F)")
    expect(offer.company).toBe("ACME DATA")
    expect(offer.location).toBe("75 - PARIS 08")
    expect(offer.contractType).toBe("Contrat à durée indéterminée")
    expect(offer.url).toContain("190RSQK")
    expect(offer.alternance).toBe(false)
  })

  test("missing values become null, never undefined or omitted", () => {
    const offer = normalizeOffer({ id: "ABC1234", intitule: "Poste" })!
    for (const key of ["company", "location", "date", "contractType", "salary", "experience", "duration", "rome"] as const) {
      expect(offer[key]).toBeNull()
    }
    expect(Object.keys(offer)).toContain("company")
  })

  test("falls back to the public URL when origineOffre is absent", () => {
    const offer = normalizeOffer({ id: "XYZ9876", intitule: "Poste" })!
    expect(offer.url).toBe("https://candidat.francetravail.fr/offres/recherche/detail/XYZ9876")
  })

  test("joins split salary fields", () => {
    const offer = normalizeOffer({
      id: "A00001",
      salaire: { libelle: "Annuel de 40000 Euros", commentaire: "selon profil" },
    })!
    expect(offer.salary).toBe("Annuel de 40000 Euros — selon profil")
  })

  test("returns null for an offer with no id", () => {
    expect(normalizeOffer({ intitule: "Sans id" })).toBeNull()
  })
})

describe("normalizeDetail", () => {
  test("decodes entities and normalises blank lines in the description", () => {
    const detail = normalizeDetail({
      id: "190RSQK",
      intitule: "Data Analyst",
      description: "Vous &amp; l'équipe.\r\n\n\n\nMissions :\r\n- SQL",
      competences: [{ libelle: "SQL" }, { libelle: "Python" }],
      langues: [{ libelle: "Anglais" }],
    })!
    expect(detail.description).toContain("Vous & l'équipe.")
    expect(detail.description).not.toContain("\r")
    expect(detail.description).not.toMatch(/\n{3,}/)
    expect(detail.skills).toEqual(["SQL", "Python"])
    expect(detail.languages).toEqual(["Anglais"])
  })

  test("tolerates absent nested arrays", () => {
    const detail = normalizeDetail({ id: "A00001", intitule: "Poste" })!
    expect(detail.skills).toEqual([])
    expect(detail.education).toEqual([])
    expect(detail.description).toBeNull()
  })
})

describe("toPublieeDepuis", () => {
  test("snaps arbitrary day counts up to the API's ladder", () => {
    expect(toPublieeDepuis(1)).toBe("1")
    expect(toPublieeDepuis(2)).toBe("3")
    expect(toPublieeDepuis(5)).toBe("7")
    expect(toPublieeDepuis(10)).toBe("14")
    expect(toPublieeDepuis(30)).toBe("31")
  })

  test("returns null when the filter does not apply", () => {
    expect(toPublieeDepuis(undefined)).toBeNull()
    expect(toPublieeDepuis(0)).toBeNull()
    expect(toPublieeDepuis(60)).toBeNull()
  })
})

describe("toRange", () => {
  test("builds 0-indexed windows from 1-indexed pages", () => {
    expect(toRange(1, 50)).toBe("0-49")
    expect(toRange(2, 50)).toBe("50-99")
    expect(toRange(3, 10)).toBe("20-29")
  })

  test("clamps the page size to the API maximum of 150", () => {
    expect(toRange(1, 500)).toBe("0-149")
  })
})

describe("toSort", () => {
  test("maps names to the API's numeric codes", () => {
    expect(toSort("relevance")).toBe("0")
    expect(toSort("date")).toBe("1")
    expect(toSort("distance")).toBe("2")
    expect(toSort("nonsense")).toBeNull()
    expect(toSort(undefined)).toBeNull()
  })
})

describe("normalizePlace", () => {
  test("strips accents, case and punctuation", () => {
    expect(normalizePlace("Saint-Étienne")).toBe("SAINT ETIENNE")
    expect(normalizePlace("  Le Mans ")).toBe("LE MANS")
  })
})

describe("pickCommune", () => {
  const communes: Commune[] = [
    { code: "75056", libelle: "Paris", codePostal: "75001" },
    { code: "75101", libelle: "Paris 01", codePostal: "75001" },
    { code: "69123", libelle: "Lyon", codePostal: "69001" },
    { code: "42218", libelle: "Saint-Étienne", codePostal: "42000" },
  ]

  test("matches an INSEE code directly", () => {
    expect(pickCommune(communes, "69123")?.libelle).toBe("Lyon")
  })

  test("matches a name regardless of accents and case", () => {
    expect(pickCommune(communes, "saint etienne")?.code).toBe("42218")
  })

  test("prefers the exact name over a longer prefix match", () => {
    expect(pickCommune(communes, "Paris")?.code).toBe("75056")
  })

  test("falls back to postal code, choosing the lowest INSEE code", () => {
    expect(pickCommune(communes, "42000")?.code).toBe("42218")
  })

  test("returns null when nothing matches", () => {
    expect(pickCommune(communes, "Springfield")).toBeNull()
  })
})

describe("normalizeId", () => {
  test("accepts a bare id", () => {
    expect(normalizeId("190RSQK")).toBe("190RSQK")
  })

  test("extracts an id from a candidate detail URL", () => {
    expect(
      normalizeId("https://candidat.francetravail.fr/offres/recherche/detail/190RSQK"),
    ).toBe("190RSQK")
  })

  test("keeps a partner suffix", () => {
    expect(normalizeId("1234567-ABC")).toBe("1234567-ABC")
  })

  test("rejects empty input", () => {
    expect(normalizeId("   ")).toBeNull()
  })
})

describe("parseDotEnv", () => {
  test("parses keys, quotes, comments and export prefixes", () => {
    const env = parseDotEnv(
      ['# comment', 'FRANCETRAVAIL_CLIENT_ID=PAR_abc_123', 'export FRANCETRAVAIL_CLIENT_SECRET="s3cret"', "EMPTY=", "junk"].join("\n"),
    )
    expect(env.FRANCETRAVAIL_CLIENT_ID).toBe("PAR_abc_123")
    expect(env.FRANCETRAVAIL_CLIENT_SECRET).toBe("s3cret")
    expect(env.EMPTY).toBe("")
    expect(env.junk).toBeUndefined()
  })
})
