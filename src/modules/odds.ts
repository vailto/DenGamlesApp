import { MatchInput, MatchComputed, Outcome } from '@/lib/types';
import { oddsToRawIp, normalizeIp, streckToDecimal } from '@/lib/math';

/**
 * Computes implied probabilities from odds for a single match
 * Normalizes IP values to sum to 1.0
 * @param match - Match with odds data
 * @returns Match with computed IP values
 */
export function computeMatchIp(match: MatchInput): MatchComputed {
  const rawIp: Partial<Record<Outcome, number>> = {};

  // Calculate raw IP for each outcome that has odds
  // Prioritize API odds, fall back to SvS odds, then to fair odds from streck%
  const outcomes: Outcome[] = ['1', 'X', '2'];
  for (const outcome of outcomes) {
    // First try API odds
    let odds = match.odds?.[outcome];

    // If no API odds, try SvS odds as fallback
    if ((odds === undefined || odds === 0) && match.svsOdds) {
      odds = match.svsOdds[outcome];
    }

    // If still no odds, calculate fair odds from streck% (EV=1.00)
    if ((odds === undefined || odds === 0) && match.streck?.[outcome]) {
      const streck = match.streck[outcome];
      if (streck > 0) {
        odds = 1 / streckToDecimal(streck);
      }
    }

    if (odds !== undefined && odds > 0) {
      rawIp[outcome] = oddsToRawIp(odds);
    }
  }

  // Normalize IP values
  const normalizedIp = normalizeIp(rawIp);

  return {
    ...match,
    ip: normalizedIp,
    diff: {},
  };
}
