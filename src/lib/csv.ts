import { SystemRow } from './types';

/**
 * Exports system rows to CSV format
 * @param rows - Array of system rows
 * @returns CSV string
 */
export function exportRowsToCSV(rows: SystemRow[]): string {
  if (rows.length === 0) return '';

  // Get all match IDs from the first row
  const matchIds = Object.keys(rows[0].picks).sort();

  // Header
  const headers = [...matchIds, 'rowIp', 'rowStreck', 'evIndex'];
  let csv = headers.join(',') + '\n';

  // Data rows
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

/**
 * Exports system rows to JSON format
 * @param rows - Array of system rows
 * @returns JSON string
 */
export function exportRowsToJSON(rows: SystemRow[]): string {
  return JSON.stringify(rows, null, 2);
}

/**
 * Triggers download of content as a file
 * @param content - File content
 * @param filename - Name of the file
 * @param mimeType - MIME type of the file
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
