import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_MIGRATIONS_DIR = path.resolve(here, "../prisma/migrations");

/** Names of migration folders (those containing migration.sql), oldest first. */
export function listMigrationNames(dir = DEFAULT_MIGRATIONS_DIR) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(dir, d.name, "migration.sql")))
    .map((d) => d.name)
    .sort();
}

/**
 * Prisma P3005: the database already has tables but no migration history.
 * That is exactly the state of a database that used to be created with `prisma db push`.
 */
export function needsBaseline(output) {
  return typeof output === "string" && /P3005/.test(output);
}

function run(args, { tag }) {
  return new Promise((resolve) => {
    console.log(`[${tag}] Running: npx ${args.join(" ")}`);
    const proc = spawn("npx", args, { shell: true, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    const tee = (stream, sink) =>
      stream.on("data", (chunk) => {
        const text = chunk.toString();
        output += text;
        sink.write(text);
      });
    tee(proc.stdout, process.stdout);
    tee(proc.stderr, process.stderr);
    proc.on("close", (code) => resolve({ code, output }));
  });
}

/**
 * Applies pending migrations with `prisma migrate deploy` (never `db push`, never resets data).
 * If the database predates migrations (created by `db push`), the existing migrations are first
 * marked as already applied (baseline) and deploy is retried. Throws on failure.
 */
export async function applyMigrations({ tag = "DB-MIGRATE" } = {}) {
  let result = await run(["prisma", "migrate", "deploy"], { tag });
  if (result.code === 0) return { baselined: false };

  if (!needsBaseline(result.output)) {
    throw new Error(`prisma migrate deploy failed with exit code ${result.code}`);
  }

  console.warn(`[${tag}] Existing database without migration history detected; baselining...`);
  for (const name of listMigrationNames()) {
    const resolved = await run(["prisma", "migrate", "resolve", "--applied", name], { tag });
    if (resolved.code !== 0) throw new Error(`prisma migrate resolve --applied ${name} failed`);
  }

  result = await run(["prisma", "migrate", "deploy"], { tag });
  if (result.code !== 0) throw new Error(`prisma migrate deploy failed after baseline (exit ${result.code})`);
  return { baselined: true };
}
