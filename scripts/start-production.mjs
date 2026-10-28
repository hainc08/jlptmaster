import { spawn } from "node:child_process";

console.log("==================================================");
console.log("   JLPT MASTER — HOSTINGER PRODUCTION STARTUP   ");
console.log("==================================================");

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    console.log(`[STARTUP] Running: ${command} ${args.join(" ")}`);
    const proc = spawn(command, args, { stdio: "inherit", shell: true });
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} failed with exit code ${code}`));
    });
  });
}

async function main() {
  try {
    // 1. Sync database schema and idempotent seed on startup (non-blocking if DB is not ready yet)
    if (process.env.DATABASE_URL) {
      console.log("[STARTUP] Applying database schema with Prisma...");
      try {
        await runCommand("npx", ["prisma", "db", "push", "--skip-generate"]);
        console.log("[STARTUP] Database schema verified successfully.");

        console.log("[STARTUP] Running idempotent N5 dataset & admin seed...");
        await runCommand("npx", ["tsx", "prisma/seed.ts"]);
        console.log("[STARTUP] Database seed verified successfully.");
      } catch (dbErr) {
        console.warn(
          "[STARTUP WARNING] Database initialization failed (check DATABASE_URL in hPanel):",
          dbErr.message
        );
        console.warn("[STARTUP WARNING] Proceeding to start Next.js server so /api/health remains accessible.");
      }
    } else {
      console.warn("[STARTUP] DATABASE_URL not set! Skipping DB push and seed.");
    }

    // 2. Start Next.js production server bound to 0.0.0.0 and Hostinger's assigned PORT
    const port = process.env.PORT || "3000";
    const hostname = process.env.HOSTNAME || "0.0.0.0";
    console.log(`[STARTUP] Starting Next.js server on ${hostname}:${port}...`);

    await runCommand("npx", ["next", "start", "-p", port, "-H", hostname]);
  } catch (error) {
    console.error("[STARTUP ERROR]", error);
    process.exit(1);
  }
}

main();
