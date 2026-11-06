import { prisma } from "@/src/server/db";

const THROTTLE_MS = 5 * 60_000;

/** Records "last active" with one atomic UPDATE that is a no-op if it was already set in the last 5 minutes. */
export async function touchLastActive(userId: string): Promise<void> {
  await prisma.user.updateMany({
    where: { id: userId, OR: [{ lastActiveAt: null }, { lastActiveAt: { lt: new Date(Date.now() - THROTTLE_MS) } }] },
    data: { lastActiveAt: new Date() },
  });
}
