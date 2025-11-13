import { MatchInput, MatchComputed, AnalysisSettings, SystemRow } from './types';
import { computeMatchIp } from '@/modules/odds';
import { computeDiff } from '@/modules/streck';
import { generateSystemRows, filterRowsByEv } from '@/modules/ev';

/**
 * Placeholder for future coupon selection functionality
 */
export async function selectCoupon(): Promise<void> {
  // MVP: dummy implementation
}

/**
 * Loads match data (from sample or user input)
 * @returns Array of match inputs
 */
export async function loadMatches(): Promise<MatchInput[]> {
  // This will be called from UI with actual data
  return [];
}

/**
 * Computes IP and diff for all matches
 * @param matches - Array of input matches
 * @returns Array of matches with computed values
 */
export function computeAll(matches: MatchInput[]): MatchComputed[] {
  return matches.map(match => {
    const withIp = computeMatchIp(match);
    return computeDiff(withIp);
  });
}

/**
 * Analyzes a complete round: generates all rows and filters by EV
 * @param matches - Array of computed matches
 * @param settings - Analysis settings
 * @returns Object with all rows and kept rows after filtering
 */
export function analyzeRound(
  matches: MatchComputed[],
  settings: AnalysisSettings
): {
  allRows: SystemRow[];
  keptRows: SystemRow[];
} {
  const allRows = generateSystemRows(matches);
  const keptRows = filterRowsByEv(allRows, settings);

  return { allRows, keptRows };
}

/**
 * Exports system rows to specified format
 * @param rows - Array of system rows
 * @param format - Export format (json or csv)
 * @returns String content of the export
 */
export function exportSystem(rows: SystemRow[], format: 'json' | 'csv'): string {
  if (format === 'json') {
    return JSON.stringify(rows, null, 2);
  } else {
    // CSV export
    if (rows.length === 0) return '';

    const matchIds = Object.keys(rows[0].picks).sort();
    const headers = [...matchIds, 'rowIp', 'rowStreck', 'evIndex'];
    let csv = headers.join(',') + '\n';

    for (const row of rows) {
      const values = [
        ...matchIds.map(id => row.picks[id] || ''),
        row.rowIp.toFixed(6),
        row.rowStreck.toFixed(6),
        row.evIndex.toFixed(3),
      ];
      csv += values.join(',') + '\n';
    }

    return csv;
  }
}
