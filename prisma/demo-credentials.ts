// DEMO / TEST ONLY. These passwords are used for local development, CI and automated tests
// (enabled in the seed with SEED_DEMO_PASSWORDS=1). They are public in the repository, so they
// MUST NEVER be set on a production database: in production set SEED_ADMIN_PASSWORD (and optionally
// SEED_STUDENT_PASSWORD) from the hosting environment instead.
export const DEMO_PASSWORDS = {
  admin: "Admin-Demo-2026!",
  student: "Student-Demo-2026!",
} as const;

/**
 * Mock learners (and anything else that is demo-only) are seeded ONLY when the demo flag is set and
 * NODE_ENV is not production. The production start script runs the seed on every boot, so this is
 * what keeps fake accounts out of the real database.
 */
export function shouldSeedDemoData(env: Record<string, string | undefined>): boolean {
  return env.SEED_DEMO_PASSWORDS === "1" && env.NODE_ENV !== "production";
}
