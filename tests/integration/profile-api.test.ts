import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/src/server/db";
import { signSessionToken } from "@/src/server/services/auth-service";
import { GET as getProfile, POST as saveProfile } from "@/app/api/v1/profile/route";

const EMAIL = "onboarding-test@jlptmaster.vn";

describe("Profile / onboarding API", () => {
  let user: { id: string; email: string };
  let other: { id: string };
  const cookie = () => ({
    Cookie: `jlpt_session=${signSessionToken({ userId: user.id, email: user.email, role: "STUDENT" })}`,
  });
  const post = (body: unknown, headers: Record<string, string> = cookie()) =>
    new NextRequest("http://x/api/v1/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });

  beforeAll(async () => {
    user = await prisma.user.upsert({ where: { email: EMAIL }, update: {}, create: { email: EMAIL, role: "STUDENT" } });
    other = await prisma.user.findUniqueOrThrow({ where: { email: "minh@jlptmaster.vn" } });
    await prisma.userProfile.deleteMany({ where: { userId: user.id } });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: user.id } });
  });

  it("requires a session", async () => {
    expect((await getProfile(new NextRequest("http://x/api/v1/profile"))).status).toBe(401);
    expect((await saveProfile(post({ targetLevel: "N5", dailyGoalMinutes: 30 }, {}))).status).toBe(401);
  });

  it("GET returns defaults (not onboarded) for a user without a profile", async () => {
    const res = await getProfile(new NextRequest("http://x/api/v1/profile", { headers: cookie() }));
    expect(res.status).toBe(200);
    const { data } = await res.json();
    expect(data).toMatchObject({ targetLevel: "N5", dailyGoalMinutes: 30, onboarded: false });
  });

  it("rejects invalid level or goal", async () => {
    expect((await saveProfile(post({ targetLevel: "N9", dailyGoalMinutes: 30 }))).status).toBe(400);
    expect((await saveProfile(post({ targetLevel: "N5", dailyGoalMinutes: 0 }))).status).toBe(400);
    expect((await saveProfile(post({ targetLevel: "N5", dailyGoalMinutes: 9999 }))).status).toBe(400);
  });

  it("POST saves to user_profiles and marks onboarding complete; GET reads it back", async () => {
    const res = await saveProfile(post({ targetLevel: "N4", dailyGoalMinutes: 45 }));
    expect(res.status).toBe(200);

    const row = await prisma.userProfile.findUniqueOrThrow({ where: { userId: user.id } });
    expect(row.targetLevel).toBe("N4");
    expect(row.dailyGoalMinutes).toBe(45);
    expect(row.onboardingCompletedAt).not.toBeNull();

    const { data } = await (await getProfile(new NextRequest("http://x/p", { headers: cookie() }))).json();
    expect(data).toMatchObject({ targetLevel: "N4", dailyGoalMinutes: 45, onboarded: true });
  });

  it("ignores a userId in the body: only the session user is updated", async () => {
    const before = await prisma.userProfile.findUnique({ where: { userId: other.id } });
    await saveProfile(post({ userId: other.id, targetLevel: "N3", dailyGoalMinutes: 15 }));
    const after = await prisma.userProfile.findUnique({ where: { userId: other.id } });
    expect(after?.targetLevel).toBe(before?.targetLevel);
    expect(after?.dailyGoalMinutes).toBe(before?.dailyGoalMinutes);
    expect((await prisma.userProfile.findUniqueOrThrow({ where: { userId: user.id } })).targetLevel).toBe("N3");
  });
});
