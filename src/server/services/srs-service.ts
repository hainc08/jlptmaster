export type SrsGrade = "AGAIN" | "HARD" | "GOOD" | "EASY";

export interface SrsCalculationResult {
  intervalSeconds: number;
  nextDueAt: Date;
  repetitions: number;
  easeFactor: number;
}

export function calculateNextDue(
  currentDue: Date,
  grade: SrsGrade,
  repetitions: number = 0,
  easeFactor: number = 2.5
): SrsCalculationResult {
  let intervalSeconds = 0;
  let newRepetitions = repetitions;
  let newEase = easeFactor;

  switch (grade) {
    case "AGAIN":
      intervalSeconds = 600; // 10 minutes
      newRepetitions = 0;
      newEase = Math.max(1.3, easeFactor - 0.2);
      break;
    case "HARD":
      intervalSeconds = 86400; // 1 day
      newRepetitions = repetitions + 1;
      newEase = Math.max(1.3, easeFactor - 0.15);
      break;
    case "GOOD":
      intervalSeconds = 86400 * 3; // 3 days
      newRepetitions = repetitions + 1;
      break;
    case "EASY":
      intervalSeconds = 86400 * 7; // 7 days
      newRepetitions = repetitions + 1;
      newEase = Math.min(3.0, easeFactor + 0.15);
      break;
  }

  const nextDueAt = new Date(currentDue.getTime() + intervalSeconds * 1000);

  return {
    intervalSeconds,
    nextDueAt,
    repetitions: newRepetitions,
    easeFactor: Number(newEase.toFixed(2)),
  };
}

export interface ReviewCardState {
  id: string;
  dueAt: Date;
  intervalSeconds: number;
  repetitions: number;
  easeFactor: number;
}

export function processSrsReview(
  card: ReviewCardState,
  grade: SrsGrade,
  idempotencyKey: string,
  now: Date = new Date(),
  existingLogKeys: string[] = []
) {
  // Idempotency check: if key already exists, reject duplicate mutation
  if (existingLogKeys.includes(idempotencyKey)) {
    return {
      isApplied: false,
      isDuplicate: true,
      cardId: card.id,
      intervalSeconds: card.intervalSeconds,
      nextDueAt: card.dueAt,
    };
  }

  const calc = calculateNextDue(now, grade, card.repetitions, card.easeFactor);

  return {
    isApplied: true,
    isDuplicate: false,
    cardId: card.id,
    intervalSeconds: calc.intervalSeconds,
    nextDueAt: calc.nextDueAt,
    repetitions: calc.repetitions,
    easeFactor: calc.easeFactor,
  };
}
