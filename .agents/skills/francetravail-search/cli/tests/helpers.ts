import { join } from "path";

const CLI_PATH = join(import.meta.dir, "../src/cli.ts");

export interface CLIResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export async function runCLI(args: string[]): Promise<CLIResult> {
  const proc = Bun.spawn(["bun", "run", CLI_PATH, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode };
}

export function parseJSON<T = unknown>(result: CLIResult): T {
  if (result.exitCode !== 0) {
    throw new Error(
      `CLI exited with code ${result.exitCode}. stderr: ${result.stderr}`
    );
  }
  try {
    return JSON.parse(result.stdout) as T;
  } catch {
    throw new Error(
      `Failed to parse JSON. stdout: ${result.stdout}\nstderr: ${result.stderr}`
    );
  }
}

/**
 * True when API credentials are available. The live smoke tests skip themselves
 * when they are not, so `bun test` stays green on a fresh clone.
 */
export async function hasCredentials(): Promise<boolean> {
  if (process.env.FRANCETRAVAIL_CLIENT_ID && process.env.FRANCETRAVAIL_CLIENT_SECRET) {
    return true;
  }
  for (const dir of ["..", "../.."]) {
    const file = Bun.file(join(import.meta.dir, dir, ".env"));
    if (await file.exists()) {
      const text = await file.text();
      if (/FRANCETRAVAIL_CLIENT_ID\s*=\s*\S/.test(text) && /FRANCETRAVAIL_CLIENT_SECRET\s*=\s*\S/.test(text)) {
        return true;
      }
    }
  }
  return false;
}
