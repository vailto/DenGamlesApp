import { MatchComputed, Outcome } from '@/lib/types';
import { streckToDecimal } from '@/lib/math';

/**
 * Computes the difference between IP and streck for each outcome
 * diff = IP - streck (both in decimal form 0-1)
 * @param match - Match with IP computed
 * @returns Match with diff values added
 */
export function computeDiff(match: MatchComputed): MatchComputed {
  const diff: Partial<Record<Outcome, number>> = {};
  const outcomes: Outcome[] = ['1', 'X', '2'];

  for (const outcome of outcomes) {
    const ip = match.ip?.[outcome];
    const streck = match.streck?.[outcome];

    // Only compute diff if both IP and streck exist
    if (ip !== undefined && streck !== undefined) {
      const streckDecimal = streckToDecimal(streck);
      diff[outcome] = ip - streckDecimal;
    }
  }

  return {
    ...match,
    diff,
  };
}
