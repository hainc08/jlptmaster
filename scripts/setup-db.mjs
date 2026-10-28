import { spawn } from "node:child_process";

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    console.log(`[DB-SETUP] Running: ${command} ${args.join(" ")}`);
    const proc = spawn(command, args, { stdio: "inherit", shell: true });
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} failed with exit code ${code}`));
    });
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("[DB-SETUP] DATABASE_URL not set; skipping postbuild DB push & seed.");
    return;
  }

  try {
    console.log("[DB-SETUP] Applying MariaDB/MySQL schema with Prisma...");
    await runCommand("npx", ["prisma", "db", "push", "--skip-generate"]);
    console.log("[DB-SETUP] Schema verified. Running idempotent N5 seed...");
    await runCommand("npx", ["tsx", "prisma/seed.ts"]);
    console.log("[DB-SETUP] Database setup and seed completed successfully.");
  } catch (err) {
    console.warn("[DB-SETUP WARNING] Database setup encountered an issue (non-fatal for build):", err.message);
  }
}

main();

