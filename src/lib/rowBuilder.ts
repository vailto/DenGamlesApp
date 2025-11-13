import { MatchComputed, Outcome, SystemRow } from './types';

/**
 * Calculates total number of rows from selections
 */
export function calculateRowCount(selections: Record<string, Outcome[]>): number {
  let count = 1;
  for (const outcomes of Object.values(selections)) {
    if (outcomes.length === 0) return 0; // No selection on a match = no valid system
    count *= outcomes.length;
  }
  return count;
}

/**
 * Generates all rows from user selections
 */
export function generateRowsFromSelections(
  matches: MatchComputed[],
  selections: Record<string, Outcome[]>
): SystemRow[] {
  const rows: SystemRow[] = [];

  // Get match IDs in order
  const matchIds = matches.map(m => m.id);

  // Check all matches have selections
  for (const matchId of matchIds) {
    if (!selections[matchId] || selections[matchId].length === 0) {
      return []; // Can't build system if any match lacks selection
    }
  }

  // Recursive function to build all combinations
  function buildRows(index: number, currentPicks: Record<string, Outcome>) {
    if (index === matchIds.length) {
      // Calculate row metrics
      const row = calculateRowMetrics(matches, currentPicks);
      rows.push(row);
      return;
    }

    const matchId = matchIds[index];
    const possibleOutcomes = selections[matchId];

    for (const outcome of possibleOutcomes) {
      buildRows(index + 1, { ...currentPicks, [matchId]: outcome });
    }
  }

  buildRows(0, {});
  return rows;
}

/**
 * Calculates IP and streck for a single row
 */
function calculateRowMetrics(
  matches: MatchComputed[],
  picks: Record<string, Outcome>
): SystemRow {
  let rowIp = 1;
  let rowStreck = 1;

  for (const match of matches) {
    const pickedOutcome = picks[match.id];
    if (!pickedOutcome) continue;

    const ip = match.ip?.[pickedOutcome];
    const streck = match.streck?.[pickedOutcome];

    if (ip !== undefined) {
      rowIp *= ip;
    }

    // streck is already stored as decimal (0-1), not percentage (0-100)
    // so we don't need to convert it
    if (streck !== undefined) {
      rowStreck *= streck;
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
 * Filters rows by percentile ranges
 * @param rows - All rows
 * @param streckRange - [min%, max%] percentile to keep (0-100)
 * @param ipRange - [min%, max%] percentile to keep (0-100)
 */
export function filterRowsByPercentile(
  rows: SystemRow[],
  streckRange: [number, number],
  ipRange: [number, number]
): SystemRow[] {
  if (rows.length === 0) return [];

  // Sort by streck
  const sortedByStreck = [...rows].sort((a, b) => a.rowStreck - b.rowStreck);
  const streckMin = sortedByStreck[Math.floor((streckRange[0] / 100) * rows.length)]?.rowStreck || 0;
  const streckMax = sortedByStreck[Math.ceil((streckRange[1] / 100) * rows.length) - 1]?.rowStreck || 1;

  // Sort by IP
  const sortedByIp = [...rows].sort((a, b) => a.rowIp - b.rowIp);
  const ipMin = sortedByIp[Math.floor((ipRange[0] / 100) * rows.length)]?.rowIp || 0;
  const ipMax = sortedByIp[Math.ceil((ipRange[1] / 100) * rows.length) - 1]?.rowIp || 1;

  // Filter rows that fall within both ranges
  return rows.filter(
    row =>
      row.rowStreck >= streckMin &&
      row.rowStreck <= streckMax &&
      row.rowIp >= ipMin &&
      row.rowIp <= ipMax
  );
}

/**
 * Filters rows based on EV threshold
 * Keeps only the top X% of rows by EV index (IP/Streck ratio)
 *
 * @param rows - All rows to filter
 * @param keepPercentage - Percentage of rows to keep (0-100). Default 50 = keep top 50% by EV
 * @returns Filtered rows with highest EV values
 */
export function filterRowsByEvPercentile(
  rows: SystemRow[],
  keepPercentage: number = 50
): SystemRow[] {
  if (rows.length === 0) return [];

  // Sort rows by EV index (descending - highest EV first)
  const sortedRows = [...rows].sort((a, b) => b.evIndex - a.evIndex);

  // Calculate how many rows to keep
  const keepCount = Math.ceil((keepPercentage / 100) * rows.length);

  // Return top X% of rows
  return sortedRows.slice(0, keepCount);
}

/**
 * Filters rows based on pot value and expected payout
 * Removes rows where the expected payout is too low to be worthwhile
 *
 * @param rows - All rows to filter
 * @param matches - Match data with odds
 * @param turnover - Total turnover/omsättning in SEK
 * @param extraPot - Extra pot money added to the pool
 * @param totalRowsPlayed - Estimated total number of rows played by all participants (default: 1 million)
 * @param minPayoutRatio - Minimum ratio of (expected payout / row cost). Default 2 = expect at least 2:1 return
 * @returns Filtered rows that are worth playing based on pot value
 */
export function filterRowsByPotValue(
  rows: SystemRow[],
  matches: MatchComputed[],
  turnover: number,
  extraPot: number = 0,
  totalRowsPlayed: number = 1000000,
  minPayoutRatio: number = 2
): SystemRow[] {
  if (rows.length === 0) return [];

  // Calculate pot (70% of turnover + extra money)
  const pot = turnover * 0.70 + extraPot;

  // Filter rows based on expected value
  return rows.filter(row => {
    // Calculate expected number of winners for this specific combination
    // row.rowIp is the probability of this combination winning
    const expectedWinners = totalRowsPlayed * row.rowIp;

    // If expected winners is very low, filter it out (too unlikely)
    if (expectedWinners < 0.001) return false;

    // Calculate expected payout per winner
    const expectedPayoutPerWinner = pot / expectedWinners;

    // Keep row only if expected payout is at least X times the cost (1 kr per row)
    // This filters out rows where the expected return is too low
    return expectedPayoutPerWinner >= minPayoutRatio;
  });
}
