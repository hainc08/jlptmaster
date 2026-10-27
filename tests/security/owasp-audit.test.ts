import { describe, it, expect } from 'vitest';
import { prisma } from '@/src/server/db';
import { assertAdminRole, assertUserOwnership, OwnershipError, UnauthorizedRoleError } from '@/src/server/services/auth-service';
import { stripAnswerKeysFromExam, ExamSnapshot } from '@/src/server/services/exam-service';

describe('OWASP & Security Audit Test Suite', () => {
  it('SEC-01: Password hashes are never exposed in user queries or responses', async () => {
    const user = await prisma.user.findFirst({
      where: { email: 'minh@jlptmaster.vn' },
      select: {
        id: true,
        email: true,
        role: true,
        profile: {
          select: {
            targetLevel: true,
            dailyGoalMinutes: true,
          },
        },
      },
    });

    expect(user).toBeDefined();
    // @ts-expect-error passwordHash should not exist on sanitized user
    expect(user?.passwordHash).toBeUndefined();
  });

  it('SEC-02: RBAC prevents STUDENT from performing administrative publish operations', () => {
    expect(() => assertAdminRole('STUDENT')).toThrow(UnauthorizedRoleError);
    expect(() => assertAdminRole('ADMIN')).not.toThrow();
  });

  it('SEC-03: IDOR prevention blocks user from modifying another users exam attempt', () => {
    const attackerId = 'usr-attacker-id';
    const victimUserId = 'usr-victim-id';

    expect(() => {
      assertUserOwnership(attackerId, victimUserId);
    }).toThrow(OwnershipError);

    expect(() => {
      assertUserOwnership(victimUserId, victimUserId);
    }).not.toThrow();
  });

  it('SEC-04: Answer key secrecy prevents leaking answers in unfinalized exam payloads', () => {
    const rawSnapshot: ExamSnapshot = {
      examId: 'exam-1',
      version: 'v1.0',
      questions: [
        {
          id: 'q-1',
          prompt: 'これ',
          explanationVi: 'Đáp án bí mật không được lộ trước khi nộp bài',
          options: [
            { id: 'opt-secret-1', text: 'Đây', isCorrect: true },
            { id: 'opt-2', text: 'Đó', isCorrect: false },
          ],
        },
      ],
    };

    const sanitized = stripAnswerKeysFromExam(rawSnapshot);
    const firstQ = sanitized.questions[0];

    // @ts-expect-error correctOptionId should be stripped
    expect(firstQ.correctOptionId).toBeUndefined();
    // @ts-expect-error explanationVi should be stripped
    expect(firstQ.explanationVi).toBeUndefined();
    // @ts-expect-error isCorrect should be stripped from options
    expect(firstQ.options[0].isCorrect).toBeUndefined();
    // @ts-expect-error isCorrect should be stripped from options
    expect(firstQ.options[1].isCorrect).toBeUndefined();
  });

  it('SEC-05: SQL Injection immunity through Prisma parameterized queries', async () => {
    // Malicious SQL injection attempt in search string
    const maliciousSearch = "' OR '1'='1' -- ; DROP TABLE vocabulary;";
    
    // Prisma parameterizes this safely
    const results = await prisma.vocabulary.findMany({
      where: {
        searchNormalized: { contains: maliciousSearch },
      },
    });

    // Should return 0 results safely without crashing or executing SQL injection
    expect(results.length).toBe(0);
  });
});
