import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/src/server/db";
import { signSessionToken, type SessionPayload } from "@/src/server/services/auth-service";
import { AdminError } from "@/src/server/services/admin-errors";
import {
  listMembers, getMember, createMember, updateMember, suspendMember, reactivateMember,
  changeLevel, resetPassword, deleteMember, bulkAction, exportMembersCsv,
} from "@/src/server/services/admin-members-service";
import { touchLastActive } from "@/src/server/services/activity-service";
import { GET as listGET, POST as createPOST } from "@/app/api/v1/admin/members/route";
import { GET as exportGET } from "@/app/api/v1/admin/members/export/route";
import { POST as suspendPOST } from "@/app/api/v1/admin/members/[id]/suspend/route";

const TAG = `mem${Date.now()}`;
const ids: Record<string, string> = {};
const mk = (key: string, extra: Record<string, unknown> = {}) =>
  prisma.user
    .create({ data: { email: `${TAG}-${key}@test.invalid`, role: "STUDENT", displayName: key, ...extra } as never })
    .then((u) => { ids[key] = u.id; return u; });
const actorOf = (key: string, role: SessionPayload["role"]): SessionPayload => ({
  userId: ids[key], email: `${TAG}-${key}@test.invalid`, role, exp: 9999999999,
});
const req = (key: string, role: SessionPayload["role"], url: string, init: ConstructorParameters<typeof NextRequest>[1] = {}) =>
  new NextRequest(`http://localhost${url}`, {
    ...init,
    headers: { "x-jlpt-session": signSessionToken({ userId: ids[key], email: `${TAG}-${key}@test.invalid`, role }), "content-type": "application/json" },
  });
const code = async (p: Promise<unknown>) => p.then(() => "OK", (e: AdminError) => `${e.status}:${e.code}`);

beforeAll(async () => {
  await mk("admin", { role: "ADMIN" });
  await mk("owner", { role: "OWNER" });
  await mk("owner2", { role: "OWNER" });
  await mk("support", { role: "SUPPORT" });
  await mk("student");
  await mk("l1", { displayName: `${TAG} Linh`, profile: { create: { targetLevel: "N5" } } });
  await mk("l2", { displayName: `${TAG} Minh`, profile: { create: { targetLevel: "N5" } } });
  await mk("pct", { displayName: `${TAG}50%_off` });
  await mk("nopct", { displayName: `${TAG}50xxoff` });
  await mk("formula", { displayName: `=HYPERLINK("x")${TAG}`, email: `${TAG}-f@test.invalid` });
  await mk("comma", { displayName: `Nguyễn, "Văn" ${TAG}\nA`, email: `${TAG}-c@test.invalid` });
  await mk("expired", { displayName: `${TAG} Expired`, plan: "PREMIUM", planExpiresAt: new Date(Date.now() - 5 * 86_400_000), email: `${TAG}-e@test.invalid` });
  await mk("fresh", { displayName: `${TAG} Fresh`, plan: "STANDARD", planExpiresAt: new Date(Date.now() + 30 * 86_400_000), email: `${TAG}-fr@test.invalid` });
});

afterAll(async () => {
  const users = await prisma.user.findMany({ where: { OR: [{ email: { startsWith: TAG } }, { email: { startsWith: "deleted+" }, displayName: null }] }, select: { id: true } });
  const uid = users.map((u) => u.id);
  await prisma.examAttempt.deleteMany({ where: { userId: { in: uid } } });
  await prisma.auditLog.deleteMany({ where: { actorId: { in: uid } } });
  await prisma.user.deleteMany({ where: { id: { in: uid } } });
});

describe("listing, search, filters (AC-CMS-03)", () => {
  it("returns a paged list of learners only, with the documented row shape", async () => {
    const res = await listMembers({ page: 1, perPage: 10 });
    expect(res.data.length).toBeLessThanOrEqual(10);
    expect(res.total).toBeGreaterThanOrEqual(24);
    expect(res.data[0]).toEqual(expect.objectContaining({
      id: expect.any(String), displayName: expect.any(String), email: expect.any(String),
      level: expect.stringMatching(/^N[1-5]$/), plan: expect.stringMatching(/FREE|STANDARD|PREMIUM/),
      status: expect.stringMatching(/ACTIVE|SUSPENDED|PENDING|EXPIRED/), joinedAt: expect.any(String),
    }));
    expect(res.data.find((r) => r.id === ids.admin)).toBeUndefined();
  });

  it("finds Japanese names", async () => {
    const res = await listMembers({ q: "田中", page: 1, perPage: 10 });
    expect(res.total).toBeGreaterThanOrEqual(1);
    expect(res.data.every((r) => (r.displayName + r.email).includes("田中"))).toBe(true);
  });

  it("treats % and _ in the search text literally", async () => {
    const hit = await listMembers({ q: `${TAG}50%_`, page: 1, perPage: 10 });
    expect(hit.data.map((r) => r.id)).toEqual([ids.pct]);
    const all = await listMembers({ q: "%", page: 1, perPage: 100 });
    expect(all.total).toBeGreaterThanOrEqual(1);
    expect(all.data.every((r) => (r.displayName + r.email).includes("%"))).toBe(true);
  });

  it("filters by derived status: EXPIRED vs ACTIVE", async () => {
    const exp = await listMembers({ q: TAG, status: "EXPIRED", page: 1, perPage: 100 });
    expect(exp.data.map((r) => r.id)).toEqual([ids.expired]);
    const act = await listMembers({ q: TAG, status: "ACTIVE", page: 1, perPage: 100 });
    expect(act.data.map((r) => r.id)).not.toContain(ids.expired);
    expect(act.data.map((r) => r.id)).toContain(ids.fresh);
  });

  it("route: clamps perPage, returns an empty page past the end, tolerates over-long q, 400s on bad enums", async () => {
    const big = await (await listGET(req("admin", "ADMIN", "/api/v1/admin/members?perPage=500"))).json();
    expect(big.perPage).toBe(100);
    const past = await listGET(req("admin", "ADMIN", "/api/v1/admin/members?page=99999"));
    expect(past.status).toBe(200);
    expect((await past.json()).data).toEqual([]);
    const long = await listGET(req("admin", "ADMIN", `/api/v1/admin/members?q=${"x".repeat(500)}`));
    expect(long.status).toBe(200);
    expect((await listGET(req("admin", "ADMIN", "/api/v1/admin/members?status=BOGUS"))).status).toBe(400);
    expect((await listGET(req("admin", "ADMIN", "/api/v1/admin/members?level=N9"))).status).toBe(400);
  });
});

describe("authorization on the routes (AC-CMS-01)", () => {
  it("STUDENT is 403, anonymous 401, SUPPORT 200 on list and export", async () => {
    expect((await listGET(req("student", "STUDENT", "/api/v1/admin/members"))).status).toBe(403);
    expect((await exportGET(req("student", "STUDENT", "/api/v1/admin/members/export"))).status).toBe(403);
    expect((await listGET(new NextRequest("http://localhost/api/v1/admin/members"))).status).toBe(401);
    expect((await listGET(req("support", "SUPPORT", "/api/v1/admin/members"))).status).toBe(200);
  });

  it("SUPPORT cannot suspend an ADMIN through the route (403) and the ADMIN stays active", async () => {
    const res = await suspendPOST(req("support", "SUPPORT", `/api/v1/admin/members/${ids.admin}/suspend`, { method: "POST" }), { params: Promise.resolve({ id: ids.admin }) });
    expect(res.status).toBe(403);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: ids.admin } })).status).toBe("ACTIVE");
  });

  it("create route validates the body and rejects duplicate emails with 409", async () => {
    const bad = await createPOST(req("admin", "ADMIN", "/api/v1/admin/members", { method: "POST", body: JSON.stringify({ displayName: "x", email: "nope", level: "N5", plan: "FREE" }) }));
    expect(bad.status).toBe(400);
    const dupBody = { displayName: "Dup", email: `${TAG}-l1@test.invalid`, level: "N5", plan: "FREE" };
    const dup = await createPOST(req("admin", "ADMIN", "/api/v1/admin/members", { method: "POST", body: JSON.stringify(dupBody) }));
    expect(dup.status).toBe(409);
    const ok = await createPOST(req("admin", "ADMIN", "/api/v1/admin/members", { method: "POST", body: JSON.stringify({ ...dupBody, email: `${TAG}-new@test.invalid` }) }));
    expect(ok.status).toBe(201);
  });
});

describe("mutations, protections and audit (AC-CMS-02/04/09)", () => {
  it("suspend revokes sessions, flips status and writes a redacted audit row; reactivate restores", async () => {
    await prisma.authSession.create({ data: { userId: ids.l1, sessionToken: `${TAG}-s1`, expiresAt: new Date(Date.now() + 1e7) } });
    await suspendMember(actorOf("admin", "ADMIN"), ids.l1, "10.0.0.1");
    expect((await prisma.user.findUniqueOrThrow({ where: { id: ids.l1 } })).status).toBe("SUSPENDED");
    expect(await prisma.authSession.count({ where: { userId: ids.l1 } })).toBe(0);
    const audit = await prisma.auditLog.findFirstOrThrow({ where: { actorId: ids.admin, action: "member.suspend", entityId: ids.l1 } });
    expect(audit.beforeJson).toMatchObject({ status: "ACTIVE" });
    expect(audit.afterJson).toMatchObject({ status: "SUSPENDED" });
    expect(audit.ip).toBe("10.0.0.1");
    await reactivateMember(actorOf("admin", "ADMIN"), ids.l1);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: ids.l1 } })).status).toBe("ACTIVE");
  });

  it("nobody can suspend or delete themselves", async () => {
    expect(await code(suspendMember(actorOf("admin", "ADMIN"), ids.admin))).toBe("409:CANNOT_MODIFY_SELF");
    expect(await code(deleteMember(actorOf("owner", "OWNER"), ids.owner))).toBe("409:CANNOT_MODIFY_SELF");
  });

  it("staff accounts are protected by role: SUPPORT cannot touch ADMIN, ADMIN cannot touch OWNER, OWNER can", async () => {
    expect(await code(suspendMember(actorOf("support", "SUPPORT"), ids.admin))).toBe("403:FORBIDDEN");
    expect(await code(suspendMember(actorOf("admin", "ADMIN"), ids.owner))).toBe("403:FORBIDDEN");
    expect(await code(suspendMember(actorOf("owner", "OWNER"), ids.owner2))).toBe("OK");
    await prisma.user.update({ where: { id: ids.owner2 }, data: { status: "ACTIVE" } });
  });

  it("unknown ids are 404", async () => {
    expect(await code(suspendMember(actorOf("admin", "ADMIN"), "00000000-0000-0000-0000-000000000000"))).toBe("404:NOT_FOUND");
  });

  it("changeLevel rejects unknown levels and audits real changes", async () => {
    expect(await code(changeLevel(actorOf("admin", "ADMIN"), ids.l2, "N9"))).toBe("400:INVALID_LEVEL");
    await changeLevel(actorOf("admin", "ADMIN"), ids.l2, "N4");
    expect((await prisma.userProfile.findUniqueOrThrow({ where: { userId: ids.l2 } })).targetLevel).toBe("N4");
    const a = await prisma.auditLog.findFirstOrThrow({ where: { action: "member.change_level", entityId: ids.l2 } });
    expect(a.beforeJson).toEqual({ level: "N5" });
    expect(a.afterJson).toEqual({ level: "N4" });
  });

  it("bulk suspend skips the actor and unknown ids and reports them", async () => {
    const res = await bulkAction(actorOf("admin", "ADMIN"), { ids: [ids.l1, ids.l2, ids.admin, "nope"], action: "suspend" });
    expect(res.updated).toBe(2);
    expect(res.skipped.sort()).toEqual([ids.admin, "nope"].sort());
    await prisma.user.updateMany({ where: { id: { in: [ids.l1, ids.l2] } }, data: { status: "ACTIVE" } });
  });

  it("bulk change-level requires a valid level", async () => {
    expect(await code(bulkAction(actorOf("admin", "ADMIN"), { ids: [ids.l1], action: "change-level", level: "N0" }))).toBe("400:INVALID_LEVEL");
    expect((await bulkAction(actorOf("admin", "ADMIN"), { ids: [ids.l1], action: "change-level", level: "N5" })).updated).toBe(1);
  });

  it("updateMember rejects an email owned by someone else", async () => {
    expect(await code(updateMember(actorOf("admin", "ADMIN"), ids.l1, { email: `${TAG}-l2@test.invalid` }))).toBe("409:EMAIL_TAKEN");
    await updateMember(actorOf("admin", "ADMIN"), ids.l1, { displayName: `${TAG} Linh B` });
    expect((await prisma.user.findUniqueOrThrow({ where: { id: ids.l1 } })).displayName).toBe(`${TAG} Linh B`);
  });

  it("createMember makes a learner with no usable password", async () => {
    const m = await createMember(actorOf("admin", "ADMIN"), { displayName: "Created", email: `${TAG}-made@test.invalid`, level: "N5", plan: "FREE" });
    const u = await prisma.user.findUniqueOrThrow({ where: { id: m.id }, include: { profile: true } });
    expect(u).toMatchObject({ role: "STUDENT", passwordHash: null, status: "ACTIVE" });
    expect(u.profile?.targetLevel).toBe("N5");
  });

  it("resetPassword revokes sessions, never reveals or audits a password, and says no email was sent", async () => {
    await prisma.authSession.create({ data: { userId: ids.l2, sessionToken: `${TAG}-s2`, expiresAt: new Date(Date.now() + 1e7) } });
    const res = await resetPassword(actorOf("support", "SUPPORT"), ids.l2);
    expect(res).toEqual({ sessionsRevoked: 1, emailSent: false });
    const a = await prisma.auditLog.findFirstOrThrow({ where: { action: "member.reset_password", entityId: ids.l2 } });
    expect(JSON.stringify(a)).not.toMatch(/password"?:/i);
  });

  it("delete anonymizes personal data but keeps exam attempts (AC-CMS-09)", async () => {
    const exam = await prisma.exam.findFirstOrThrow();
    await prisma.examAttempt.create({ data: { examId: exam.id, examVersion: exam.version, userId: ids.nopct, expiresAt: new Date(), examSnapshotJson: {} } });
    await prisma.authSession.create({ data: { userId: ids.nopct, sessionToken: `${TAG}-s3`, expiresAt: new Date(Date.now() + 1e7) } });
    await deleteMember(actorOf("admin", "ADMIN"), ids.nopct);
    const u = await prisma.user.findUniqueOrThrow({ where: { id: ids.nopct }, include: { profile: true } });
    expect(u.email).toBe(`deleted+${ids.nopct}@invalid`);
    expect(u).toMatchObject({ passwordHash: null, displayName: null, profile: null });
    expect(u.deletedAt).not.toBeNull();
    expect(await prisma.authSession.count({ where: { userId: ids.nopct } })).toBe(0);
    expect(await prisma.examAttempt.count({ where: { userId: ids.nopct } })).toBe(1);
    expect((await listMembers({ q: TAG, page: 1, perPage: 100 })).data.map((r) => r.id)).not.toContain(ids.nopct);
    expect(await code(getMember(ids.nopct))).toBe("404:NOT_FOUND");
  });
});

describe("detail and export", () => {
  it("getMember returns progress for all five levels and recent exam history as percentages", async () => {
    const exam = await prisma.exam.findFirstOrThrow({ where: { status: "PUBLISHED" } });
    await prisma.examAttempt.create({ data: { examId: exam.id, examVersion: exam.version, userId: ids.fresh, status: "SUBMITTED", rawCorrect: 21, rawTotal: 28, submittedAt: new Date(), expiresAt: new Date(), examSnapshotJson: {} } });
    const d = await getMember(ids.fresh);
    expect(d.progress.map((p) => p.level)).toEqual(["N5", "N4", "N3", "N2", "N1"]);
    expect(d.exams[0]).toMatchObject({ title: exam.title, level: exam.levelId, scorePercent: 75 });
  });

  it("CSV: header, UTF-8 BOM, quoting, newline-safe cells and formula-injection neutralisation (AC-CMS-05)", async () => {
    const csv = await exportMembersCsv({ q: TAG });
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv.split("\n")[0]).toBe("﻿id,name,email,level,plan,status,joined,lastActive");
    expect(csv).toContain(`"'=HYPERLINK(""x"")${TAG}"`);
    expect(csv).toContain(`"Nguyễn, ""Văn"" ${TAG}\nA"`);
    const res = await exportGET(req("admin", "ADMIN", `/api/v1/admin/members/export?q=${TAG}`));
    expect(res.headers.get("content-type")).toMatch(/text\/csv/);
    expect(res.headers.get("content-disposition")).toMatch(/attachment; filename="members-/);
  });
});

describe("lastActiveAt tracking", () => {
  it("is set once and then not rewritten within five minutes", async () => {
    await touchLastActive(ids.student);
    const first = (await prisma.user.findUniqueOrThrow({ where: { id: ids.student } })).lastActiveAt!;
    expect(first).toBeInstanceOf(Date);
    await touchLastActive(ids.student);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: ids.student } })).lastActiveAt!.getTime()).toBe(first.getTime());
    await prisma.user.update({ where: { id: ids.student }, data: { lastActiveAt: new Date(Date.now() - 6 * 60_000) } });
    await touchLastActive(ids.student);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: ids.student } })).lastActiveAt!.getTime()).toBeGreaterThan(Date.now() - 60_000);
  });
});
