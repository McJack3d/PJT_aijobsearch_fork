import { describe, test, expect } from "bun:test";
import { runCLI } from "./helpers";

const QUERY = "data analyst";

function parsedStderr(stderr: string): { error?: string; code?: string } {
  try {
    return JSON.parse(stderr);
  } catch {
    return {};
  }
}

describe("Jobillico CLI flag validation", () => {
  test("missing --query exits 1 with NO_QUERY on stderr", async () => {
    const result = await runCLI(["search"]);
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    const err = parsedStderr(result.stderr);
    expect(err.code).toBe("NO_QUERY");
  });

  test("detail without an id exits 1 with NO_ID", async () => {
    const result = await runCLI(["detail"]);
    expect(result.exitCode).toBe(1);
    expect(parsedStderr(result.stderr).code).toBe("NO_ID");
  });

  test("detail with an unparseable id exits 1 with BAD_ID", async () => {
    const result = await runCLI(["detail", "not-a-job", "--format", "json"]);
    expect(result.exitCode).toBe(1);
    expect(parsedStderr(result.stderr).code).toBe("BAD_ID");
  });

  test("unknown command exits 1 with BAD_CMD", async () => {
    const result = await runCLI(["frobnicate"]);
    expect(result.exitCode).toBe(1);
    expect(parsedStderr(result.stderr).code).toBe("BAD_CMD");
  });

  test.each([
    ["jobage", "foo"],
    ["page", "abc"],
    ["limit", "xyz"],
  ])("--%s with a non-numeric value exits 1 with BAD_ARG", async (flag, value) => {
    const result = await runCLI(["search", "-q", QUERY, `--${flag}`, value]);
    expect(result.exitCode).toBe(1);
    const err = parsedStderr(result.stderr);
    expect(err.code).toBe("BAD_ARG");
    expect(err.error).toMatch(new RegExp(flag));
  });

  test("--lang outside en|fr exits 1 with BAD_ARG", async () => {
    const result = await runCLI(["search", "-q", QUERY, "--lang", "de"]);
    expect(result.exitCode).toBe(1);
    expect(parsedStderr(result.stderr).code).toBe("BAD_ARG");
  });

  test("--sort outside date|pert exits 1 with BAD_ARG", async () => {
    const result = await runCLI(["search", "-q", QUERY, "--sort", "salary"]);
    expect(result.exitCode).toBe(1);
    expect(parsedStderr(result.stderr).code).toBe("BAD_ARG");
  });

  test("bare --help prints usage and exits 0 with a command", async () => {
    const result = await runCLI(["search", "--help"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("jobillico-cli");
  });
});
