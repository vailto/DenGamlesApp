import { MatchComputed, SystemRow, Outcome, AnalysisSettings } from '@/lib/types';
import { streckToDecimal } from '@/lib/math';

/**
 * Generates all possible system rows (combinations) from matches
 * Limits to 50,000 random samples if total combinations exceed this
 * @param matches - Array of matches with computed IP and streck
 * @returns Array of system rows with EV calculations
 */
export function generateSystemRows(matches: MatchComputed[]): SystemRow[] {
  // Get valid outcomes for each match (must have both IP and streck)
  const matchOutcomes: Array<{ matchId: string; outcomes: Outcome[] }> = [];

  for (const match of matches) {
    const validOutcomes: Outcome[] = [];
    const outcomes: Outcome[] = ['1', 'X', '2'];

    for (const outcome of outcomes) {
      if (match.ip[outcome] !== undefined && match.streck[outcome] !== undefined) {
        validOutcomes.push(outcome);
      }
    }

    if (validOutcomes.length > 0) {
      matchOutcomes.push({ matchId: match.id, outcomes: validOutcomes });
    }
  }

  // Calculate total number of combinations
  const totalCombinations = matchOutcomes.reduce(
    (acc, mo) => acc * mo.outcomes.length,
    1
  );

  const MAX_ROWS = 50000;
  const shouldSample = totalCombinations > MAX_ROWS;

  if (shouldSample) {
    return generateRandomSample(matches, matchOutcomes, MAX_ROWS);
  } else {
    return generateAllCombinations(matches, matchOutcomes);
  }
}

/**
 * Generates all possible combinations
 */
function generateAllCombinations(
  matches: MatchComputed[],
  matchOutcomes: Array<{ matchId: string; outcomes: Outcome[] }>
): SystemRow[] {
  const rows: SystemRow[] = [];

  function recurse(index: number, picks: Record<string, Outcome>) {
    if (index === matchOutcomes.length) {
      const row = computeSystemRow(matches, picks);
      rows.push(row);
      return;
    }

    const { matchId, outcomes } = matchOutcomes[index];
    for (const outcome of outcomes) {
      recurse(index + 1, { ...picks, [matchId]: outcome });
    }
  }

  recurse(0, {});
  return rows;
}

/**
 * Generates random sample of combinations
 */
function generateRandomSample(
  matches: MatchComputed[],
  matchOutcomes: Array<{ matchId: string; outcomes: Outcome[] }>,
  sampleSize: number
): SystemRow[] {
  const rows: SystemRow[] = [];
  const seen = new Set<string>();

  while (rows.length < sampleSize) {
    const picks: Record<string, Outcome> = {};

    for (const { matchId, outcomes } of matchOutcomes) {
      const randomIndex = Math.floor(Math.random() * outcomes.length);
      picks[matchId] = outcomes[randomIndex];
    }

    // Create a unique key for this combination
    const key = matchOutcomes.map(mo => picks[mo.matchId]).join('-');

    if (!seen.has(key)) {
      seen.add(key);
      const row = computeSystemRow(matches, picks);
      rows.push(row);
    }
  }

  return rows;
}

/**
 * Computes rowIp, rowStreck, and evIndex for a single system row
 */
function computeSystemRow(
  matches: MatchComputed[],
  picks: Record<string, Outcome>
): SystemRow {
  let rowIp = 1;
  let rowStreck = 1;

  for (const match of matches) {
    const pickedOutcome = picks[match.id];
    if (!pickedOutcome) continue;

    const ip = match.ip[pickedOutcome];
    const streck = match.streck[pickedOutcome];

    if (ip !== undefined) {
      rowIp *= ip;
    }

    if (streck !== undefined) {
      rowStreck *= streckToDecimal(streck);
    }
  }

  const evIndex = rowStreck > 0 ? rowIp / rowStreck : 0;

  return {
    picks,
    rowIp,
    rowStreck,
    evIndex,
  };
}

/**
 * Filters system rows by minimum EV index
 * @param rows - Array of system rows
 * @param settings - Analysis settings with minEvIndex threshold
 * @returns Filtered array of system rows
 */
export function filterRowsByEv(
  rows: SystemRow[],
  settings: AnalysisSettings
): SystemRow[] {
  return rows.filter(row => row.evIndex >= settings.minEvIndex);
}
