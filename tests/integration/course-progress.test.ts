import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/src/server/db";
import { signSessionToken } from "@/src/server/services/auth-service";
import { GET as getCourses } from "@/app/api/v1/courses/route";
import { GET as getOverview } from "@/app/api/v1/progress/overview/route";

const EMAIL = "course-progress-test@jlptmaster.vn";

type L = { id: string; progressStatus: string };

describe("GET /courses per-lesson progressStatus", () => {
  let user: { id: string; email: string };
  let lessons: { id: string }[];

  beforeAll(async () => {
    user = await prisma.user.upsert({ where: { email: EMAIL }, update: {}, create: { email: EMAIL, role: "STUDENT" } });
    lessons = await prisma.lesson.findMany({ where: { status: "PUBLISHED", course: { levelId: "N5", status: "PUBLISHED" } }, orderBy: { position: "asc" }, select: { id: true } });
    expect(lessons.length).toBeGreaterThanOrEqual(2);
    await prisma.lessonProgress.deleteMany({ where: { userId: user.id } });
    await prisma.lessonProgress.create({ data: { userId: user.id, lessonId: lessons[0].id, status: "COMPLETED", completedAt: new Date() } });
    await prisma.lessonProgress.create({ data: { userId: user.id, lessonId: lessons[1].id, status: "IN_PROGRESS" } });
  });
  afterAll(async () => {
    await prisma.user.delete({ where: { id: user.id } });
  });

  const flat = async (res: Response): Promise<L[]> => ((await res.json()).data as { lessons: L[] }[]).flatMap((c) => c.lessons);

  it("marks the signed-in user's lessons", async () => {
    const cookie = `jlpt_session=${signSessionToken({ userId: user.id, email: user.email, role: "STUDENT" })}`;
    const all = await flat(await getCourses(new NextRequest("http://x/api/v1/courses?level=N5", { headers: { Cookie: cookie } })));
    const by = new Map(all.map((l) => [l.id, l.progressStatus]));
    expect(by.get(lessons[0].id)).toBe("COMPLETED");
    expect(by.get(lessons[1].id)).toBe("IN_PROGRESS");
    expect(all.filter((l) => l.id !== lessons[0].id && l.id !== lessons[1].id).every((l) => l.progressStatus === "NOT_STARTED")).toBe(true);
  });

  it("is NOT_STARTED for everything when signed out", async () => {
    const all = await flat(await getCourses(new NextRequest("http://x/api/v1/courses?level=N5")));
    expect(all.length).toBeGreaterThan(0);
    expect(all.every((l) => l.progressStatus === "NOT_STARTED")).toBe(true);
  });

  it("overview.nextLesson is the first lesson the user has not completed", async () => {
    const cookie = `jlpt_session=${signSessionToken({ userId: user.id, email: user.email, role: "STUDENT" })}`;
    const { data } = await (await getOverview(new NextRequest("http://x/api/v1/progress/overview", { headers: { Cookie: cookie } }))).json();
    // lessons[0] is COMPLETED, lessons[1] IN_PROGRESS
    expect(data.nextLesson.id).toBe(lessons[1].id);
  });
});
