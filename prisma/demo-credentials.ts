// DEMO / TEST ONLY. These passwords are used for local development, CI and automated tests
// (enabled in the seed with SEED_DEMO_PASSWORDS=1). They are public in the repository, so they
// MUST NEVER be set on a production database: in production set SEED_ADMIN_PASSWORD (and optionally
// SEED_STUDENT_PASSWORD) from the hosting environment instead.
export const DEMO_PASSWORDS = {
  admin: "Admin-Demo-2026!",
  student: "Student-Demo-2026!",
} as const;
