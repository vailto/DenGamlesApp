import { SystemRow } from './types';

/**
 * Exports rows to Svenska Spel format (Topptipset, Stryktipset, Powerplay, Europatipset)
 * @param rows - System rows to export
 * @param roundNumber - Omgångsnummer (e.g., 3825)
 * @param stake - Insats (1-10 kr)
 * @param linkedGame - Optional: "Stryk" or "Europa"
 * @param sportType - Optional: Sport type (Topptipset, Stryktipset, Powerplay, Europatipset)
 * @returns Formatted string for Svenska Spel
 */
export function exportToTopptipset(
  rows: SystemRow[],
  roundNumber: string,
  stake: number = 1,
  linkedGame?: 'Stryk' | 'Europa',
  sportType?: string
): string {
  if (rows.length === 0) return '';

  // Determine product name - use sportType if provided, otherwise default to Topptipset
  const productName = sportType || 'Topptipset';

  // Build header
  let header = productName;
  if (linkedGame) {
    header += `,${linkedGame}`;
  }
  header += `,Omg=${roundNumber},Insats=${stake}`;

  // Build rows
  const lines: string[] = [header];

  // Get match IDs in order (sort numerically, not alphabetically)
  const matchIds = Object.keys(rows[0].picks).sort((a, b) => {
    // Extract numbers from match IDs (e.g., "M1" -> 1, "M10" -> 10)
    const numA = parseInt(a.replace(/\D/g, ''), 10);
    const numB = parseInt(b.replace(/\D/g, ''), 10);
    return numA - numB;
  });

  // Debug: Log number of matches
  console.log('Export: Number of matches in first row:', matchIds.length);
  console.log('Export: Match IDs:', matchIds);

  for (const row of rows) {
    // Convert picks to Svenska Spel format
    const signs = matchIds.map(id => row.picks[id]);

    // All rows are single rows (E for enkelrad)
    const line = `E,${signs.join(',')}`;
    lines.push(line);
  }

  return lines.join('\n');
}

/**
 * Downloads the file with appropriate name based on sport type
 */
export function downloadTopptipsetFile(
  content: string,
  roundNumber: string,
  sportType?: string
): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  // Use sport type for filename, default to 'topptipset'
  const filename = (sportType || 'topptipset').toLowerCase().replace(/\s+/g, '_');
  link.download = `${filename}_${roundNumber}.txt`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
