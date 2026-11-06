/** Scoring copy and the internal reference mark (SPEC §153: never an official score or a definitive prediction). */
export const SCORE_DISCLAIMER = "Điểm ước tính, không phải cách chấm điểm chính thức của JLPT.";
export const REFERENCE_MARK = 80;
export const REFERENCE_MAX = 180;

/** Reference mark scaled to the attempt's max score. */
export function meetsReference(score: number, maxScore: number): boolean {
  if (!(maxScore > 0)) return false;
  return score * REFERENCE_MAX >= REFERENCE_MARK * maxScore;
}
