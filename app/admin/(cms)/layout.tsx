import "./cms.css";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/src/server/db";
import { verifySessionToken } from "@/src/server/services/auth-service";
import { ADMIN_MODULES, can, type AdminModule } from "@/src/server/services/admin-guard";
import { CmsShell } from "./_components/CmsShell";
import { parseLang } from "./_lib/i18n";

export const metadata: Metadata = { title: "JLPT Master Admin" };

// Reads the session and the role's permissions on every request; never cached.
export const dynamic = "force-dynamic";

export default async function CmsLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const token = jar.get("jlpt_session")?.value;
  const session = token ? verifySessionToken(token) : null;
  if (!session) redirect("/login?redirect=/admin/dashboard");

  // Role and account state come from the database, not from the (up to 7-day-old) token.
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true, displayName: true, role: true, status: true, deletedAt: true },
  });
  if (!user || user.status !== "ACTIVE" || user.deletedAt) redirect("/login");

  const allowed: AdminModule[] = [];
  for (const m of ADMIN_MODULES) if (await can(user.role, m)) allowed.push(m);

  return (
    <CmsShell
      user={{ name: user.displayName ?? user.email.split("@")[0], email: user.email, role: user.role }}
      allowed={allowed}
      lang={parseLang(jar.get("admin_lang")?.value)}
    >
      {children}
    </CmsShell>
  );
}
