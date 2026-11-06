import { describe, it, expect, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/src/server/db";
import {
  signSessionToken,
  verifySessionToken,
  resolveSession,
} from "@/src/server/services/auth-service";
import { GET as getAttempt } from "@/app/api/v1/attempts/[id]/route";
import { POST as publishContent } from "@/app/api/v1/admin/content/[id]/publish/route";

describe("TDD Milestone 1: Authentication, Session Tokens & Strict IDOR Protection", () => {
  let studentUser: { id: string; email: string };
  let victimUser: { id: string; email: string };
  let adminUser: { id: string; email: string };
  let studentAttempt: any;
  let sampleContent: any;

  beforeAll(async () => {
    studentUser = await prisma.user.findUniqueOrThrow({ where: { email: "minh@jlptmaster.vn" } });
    adminUser = await prisma.user.findUniqueOrThrow({ where: { email: "admin@jlptmaster.vn" } });

    // Ensure a second user (victim) exists for IDOR tests
    victimUser = await prisma.user.upsert({
      where: { email: "victim@jlptmaster.vn" },
      update: {},
      create: {
        email: "victim@jlptmaster.vn",
        role: "STUDENT",
      },
    });

    const exam = await prisma.exam.findFirstOrThrow({ where: { levelId: "N5", status: "PUBLISHED", NOT: { title: { startsWith: "TEST platform" } } } });

    // Create an attempt belonging to victimUser
    studentAttempt = await prisma.examAttempt.create({
      data: {
        examId: exam.id,
        examVersion: "v1.0",
        userId: victimUser.id,
        status: "IN_PROGRESS",
        expiresAt: new Date(Date.now() + 1200 * 1000),
        examSnapshotJson: {
          examId: exam.id,
          version: "v1.0",
          questions: [],
        },
      },
    });

    sampleContent = await prisma.contentItem.findFirstOrThrow({ where: { levelId: "N5" } });
  });

  // Test 1: Cryptographic session tokens
  it("signSessionToken creates a verifiable HMAC token with expiration", () => {
    const token = signSessionToken({
      userId: studentUser.id,
      email: studentUser.email,
      role: "STUDENT",
    });

    expect(token).toBeDefined();
    expect(token).toContain(".");

    const verified = verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(studentUser.id);
    expect(verified?.email).toBe(studentUser.email);
    expect(verified?.role).toBe("STUDENT");
  });

  it("verifySessionToken rejects tampered signatures and expired tokens", () => {
    const token = signSessionToken({
      userId: studentUser.id,
      email: studentUser.email,
      role: "STUDENT",
    });

    const [data] = token.split(".");
    const tampered = `${data}.tampered_signature_12345`;
    expect(verifySessionToken(tampered)).toBeNull();

    // Expired token (-10 seconds)
    const expiredToken = signSessionToken(
      { userId: studentUser.id, email: studentUser.email, role: "STUDENT" },
      -10
    );
    expect(verifySessionToken(expiredToken)).toBeNull();
  });

  // Test 2: IDOR Prevention on GET /api/v1/attempts/:id
  it("GET /api/v1/attempts/:id BLOCKS unauthorized caller when userId is omitted (IDOR fix)", async () => {
    // Calling without userId param or session token must NOT return victim's attempt
    const reqWithoutAuth = new NextRequest(`http://localhost:3000/api/v1/attempts/${studentAttempt.id}`);
    const res = await getAttempt(reqWithoutAuth, { params: Promise.resolve({ id: studentAttempt.id }) });

    // Expect 401 Unauthorized or 403 Forbidden, NOT 200 OK!
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("GET /api/v1/attempts/:id BLOCKS caller when attacker supplies a different userId", async () => {
    // Attacker is studentUser, attempting to read victim's attempt
    const attackerToken = signSessionToken({
      userId: studentUser.id,
      email: studentUser.email,
      role: "STUDENT",
    });

    const reqWithAttacker = new NextRequest(
      `http://localhost:3000/api/v1/attempts/${studentAttempt.id}?userId=${studentUser.id}`,
      {
        headers: {
          Cookie: `jlpt_session=${attackerToken}`,
        },
      }
    );
    const res = await getAttempt(reqWithAttacker, { params: Promise.resolve({ id: studentAttempt.id }) });
    expect(res.status).toBe(403);
  });

  // Test 3: Privilege Escalation Prevention on POST /api/v1/admin/content/:id/publish
  it("POST /api/v1/admin/content/:id/publish REJECTS client body asserting role='ADMIN' without admin session", async () => {
    // Student user attempts to publish by spoofing role: "ADMIN" in JSON body
    const studentToken = signSessionToken({
      userId: studentUser.id,
      email: studentUser.email,
      role: "STUDENT",
    });

    const spoofReq = new NextRequest(
      `http://localhost:3000/api/v1/admin/content/${sampleContent.id}/publish`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `jlpt_session=${studentToken}`,
        },
        body: JSON.stringify({
          role: "ADMIN", // Spoofed role!
          status: "PUBLISHED",
        }),
      }
    );

    const res = await publishContent(spoofReq, { params: Promise.resolve({ id: sampleContent.id }) });
    expect(res.status).toBe(403);
  });
});

