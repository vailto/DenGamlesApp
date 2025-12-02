'use client';

import { SystemRow, MatchComputed } from '@/lib/types';

interface RowPreviewProps {
  allRows: SystemRow[];
  filteredRows: SystemRow[];
  showTable?: boolean;
  turnover?: number; // Omsättning i SEK
  extraPot?: number; // Extra pengar i potten
  matches?: MatchComputed[]; // Match data for accurate IP calculation
}

export default function RowPreview({ allRows, filteredRows, showTable = true, turnover, extraPot = 0, matches = [] }: RowPreviewProps) {
  const matchIds = allRows.length > 0 ? Object.keys(allRows[0].picks).sort() : [];

  // Show top 50 rows sorted by EV
  const sortedRows = [...filteredRows].sort((a, b) => b.evIndex - a.evIndex).slice(0, 50);

  // Calculate total hit probability by summing rowIp for all rows
  // Each rowIp represents the probability that specific row wins
  // The sum gives us the total probability of hitting at least one of these rows
  // For helgardering (all outcomes covered) this sums to 100%
  const calculateTotalHitProbability = (rows: SystemRow[]): number => {
    if (rows.length === 0) return 0;
    return rows.reduce((sum, row) => sum + row.rowIp, 0);
  };

  // Unreduced: Total probability from all built rows
  const unreducedHitProbability = calculateTotalHitProbability(allRows);

  // Reduced: Total probability from filtered rows only
  const reducedHitProbability = calculateTotalHitProbability(filteredRows);

  // Calculate how many rows have positive EV (EV > 1.1 for safety margin)
  const positiveEvCount = filteredRows.filter(row => row.evIndex > 1.1).length;
  const positiveEvPercentage = filteredRows.length > 0
    ? (positiveEvCount / filteredRows.length) * 100
    : 0;

  // Calculate expected payout statistics
  const calculatePayoutStats = (rows: SystemRow[]) => {
    if (rows.length === 0 || !turnover) return null;

    // Pot = 70% of turnover + extra money
    const pot = turnover * 0.70 + extraPot;

    // Total number of rows played (assume 1 kr per row)
    const totalRowsPlayed = turnover / 1;

    // For each row, calculate expected number of winners and expected payout
    const payouts = rows.map(row => {
      // Expected number of winners based on rowStreck
      let expectedWinners = totalRowsPlayed * row.rowStreck;

      // Conservative adjustment: Even for "unique" rows, there's random overlap
      // If expectedWinners < 1, we still expect at least 1 winner (you, if you win)
      // But we add a safety margin for possible random overlap
      //
      // Using a Poisson-inspired model:
      // - If lambda (expectedWinners) is very small, P(k=1) is highest
      // - But P(k=2 or more) exists, especially with large total rows played
      //
      // Conservative estimate for max payout calculation:
      if (expectedWinners < 0.5) {
        // Very unique row: likely 1-2 winners if it hits
        // Add conservative buffer: assume 1.5x expected winners
        expectedWinners = Math.max(1, expectedWinners * 1.5);
      } else if (expectedWinners < 1) {
        // Somewhat unique: use minimum of 1 winner
        expectedWinners = Math.max(1, expectedWinners * 1.2);
      } else if (expectedWinners < 3) {
        // Low expected winners: add 20% safety margin
        expectedWinners = expectedWinners * 1.2;
      }
      // For expectedWinners >= 3, use the calculated value as-is

      // Expected payout per winner
      const calculatedPayout = pot / expectedWinners;

      // Cap at total pot (should never exceed this)
      return Math.min(calculatedPayout, pot);
    });

    // Calculate average, min, max payout
    const validPayouts = payouts.filter(p => p > 0 && isFinite(p));
    if (validPayouts.length === 0) return null;

    const avgPayout = validPayouts.reduce((sum, p) => sum + p, 0) / validPayouts.length;
    const minPayout = Math.min(...validPayouts);
    const maxPayout = Math.max(...validPayouts);

    // Find the row with lowest IP (most unlikely) - this gives the highest odds
    const minIpRow = rows.reduce((min, row) =>
      row.rowIp < min.rowIp ? row : min
    , rows[0]);

    // Calculate odds for that row: odds = 1 / probability
    const maxOdds = minIpRow ? (1 / minIpRow.rowIp) : 0;

    return { pot, avgPayout, minPayout, maxPayout, maxOdds };
  };

  const payoutStats = calculatePayoutStats(filteredRows);

  return (
    <>
      {/* Statistics - only show when showTable is false (in the Results box) */}
      {!showTable && (
        <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-700/50">
          <h3 className="font-bold text-lg mb-3 text-purple-300">📊 Systemstatistik</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Totalt antal rader:</p>
              <p className="text-2xl font-bold text-white">{allRows.length.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-400">Efter filtrering:</p>
              <p className="text-2xl font-bold text-green-400">{filteredRows.length.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-400">Reduktion:</p>
              <p className="text-xl font-bold text-cyan-400">
                {allRows.length > 0
                  ? ((1 - filteredRows.length / allRows.length) * 100).toFixed(1)
                  : 0}
                %
              </p>
            </div>
            <div>
              <p className="text-gray-400">Rader kvar:</p>
              <p className="text-xl font-bold text-orange-400">
                {allRows.length > 0
                  ? ((filteredRows.length / allRows.length) * 100).toFixed(1)
                  : 0}
                %
              </p>
            </div>
            <div>
              <p className="text-gray-400">Rader med positivt EV:</p>
              <p className="text-xl font-bold text-green-400">
                {positiveEvCount.toLocaleString()} ({positiveEvPercentage.toFixed(1)}%)
              </p>
            </div>
            <div>
              <p className="text-gray-400">Rader med negativt EV:</p>
              <p className="text-xl font-bold text-red-400">
                {(filteredRows.length - positiveEvCount).toLocaleString()} ({(100 - positiveEvPercentage).toFixed(1)}%)
              </p>
            </div>
            <div>
              <p className="text-gray-400">Chans träff (oreducerat):</p>
              <p className="text-xl font-bold text-purple-400">
                {(unreducedHitProbability * 100).toFixed(4)}%
              </p>
            </div>
            <div>
              <p className="text-gray-400">Chans träff (reducerat):</p>
              <p className="text-xl font-bold text-purple-400">
                {(reducedHitProbability * 100).toFixed(4)}%
              </p>
            </div>
          </div>

          {/* Payout statistics */}
          {payoutStats && (
            <div className="mt-4 pt-4 border-t border-purple-700/50">
              <h4 className="font-bold text-md mb-3 text-purple-300">💰 Förväntad utdelning</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Total pott:</p>
                  <p className="text-xl font-bold text-yellow-400">
                    {payoutStats.pot.toLocaleString()} kr
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Snittutdelning per rad:</p>
                  <p className="text-xl font-bold text-green-400">
                    {payoutStats.avgPayout.toLocaleString(undefined, { maximumFractionDigits: 0 })} kr
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Min utdelning:</p>
                  <p className="text-lg font-bold text-orange-400">
                    {payoutStats.minPayout.toLocaleString(undefined, { maximumFractionDigits: 0 })} kr
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Max utdelning:</p>
                  <p className="text-lg font-bold text-cyan-400">
                    {payoutStats.maxPayout.toLocaleString(undefined, { maximumFractionDigits: 0 })} kr
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Max odds (minst trolig rad):</p>
                  <p className="text-lg font-bold text-purple-400">
                    {payoutStats.maxOdds.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                * Baserat på rowStreck (sannolikhet att andra har samma rad)
              </p>
            </div>
          )}

          {/* Money-EV Statistics */}
          {filteredRows.length > 0 && filteredRows[0].moneyEv !== undefined && (
            <div className="mt-4 pt-4 border-t border-green-700/50">
              <h4 className="font-bold text-md mb-3 text-green-300">💰 Money-EV Statistik</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Snitt Money-EV per rad:</p>
                  <p className="text-xl font-bold text-green-400">
                    {(filteredRows.reduce((sum, r) => sum + (r.moneyEv || 0), 0) / filteredRows.length).toFixed(2)} kr
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Total System Money-EV:</p>
                  <p className="text-xl font-bold text-green-400">
                    {filteredRows.reduce((sum, r) => sum + (r.moneyEv || 0), 0).toFixed(2)} kr
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                * Money-EV = Förväntad avkastning per rad minus 1 kr insats
              </p>
            </div>
          )}
        </div>
      )}

      {/* Top 50 rows table - only show if showTable is true */}
      {showTable && sortedRows.length > 0 && (
        <div className="mt-4">
          <h3 className="font-bold text-lg mb-2 text-white">
            🏆 Topp 50 rader (sorterat på EV)
          </h3>
          <div className="overflow-x-auto max-h-96 overflow-y-auto border border-purple-700/50 rounded-lg">
            <table className="min-w-full text-xs border-collapse">
              <thead className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 text-white sticky top-0">
                <tr>
                  <th className="border border-purple-700/50 px-2 py-1">#</th>
                  {matchIds.map(id => (
                    <th key={id} className="border border-purple-700/50 px-2 py-1">
                      {id}
                    </th>
                  ))}
                  <th className="border border-purple-700/50 px-2 py-1">IP%</th>
                  <th className="border border-purple-700/50 px-2 py-1">Streck%</th>
                  <th className="border border-purple-700/50 px-2 py-1">EV</th>
                  {filteredRows.length > 0 && filteredRows[0].moneyEv !== undefined && (
                    <>
                      <th className="border border-purple-700/50 px-2 py-1">Money-EV (kr)</th>
                      <th className="border border-purple-700/50 px-2 py-1">Utdeln. vid Vinst</th>
                      <th className="border border-purple-700/50 px-2 py-1">Förv. Andra</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-[#1a1a3e]">
                {sortedRows.map((row, index) => (
                  <tr key={index} className="hover:bg-purple-900/30">
                    <td className="border border-purple-700/30 px-2 py-1 text-center font-medium text-gray-300">
                      {index + 1}
                    </td>
                    {matchIds.map(id => (
                      <td
                        key={id}
                        className="border border-purple-700/30 px-2 py-1 text-center font-bold text-cyan-400"
                      >
                        {row.picks[id]}
                      </td>
                    ))}
                    <td className="border border-purple-700/30 px-2 py-1 text-right text-gray-300">
                      {(row.rowIp * 100).toFixed(4)}%
                    </td>
                    <td className="border border-purple-700/30 px-2 py-1 text-right text-gray-300">
                      {row.rowStreck * 100 < 0.0001
                        ? row.rowStreck.toExponential(2)
                        : `${(row.rowStreck * 100).toFixed(4)}%`}
                    </td>
                    <td className="border border-purple-700/30 px-2 py-1 text-right font-bold text-green-400">
                      {row.evIndex > 1000
                        ? row.evIndex.toExponential(2)
                        : row.evIndex.toFixed(3)}
                    </td>
                    {row.moneyEv !== undefined && (
                      <>
                        <td className="border border-purple-700/30 px-2 py-1 text-right font-bold">
                          <span className={row.moneyEv > 0 ? 'text-green-400' : 'text-red-400'}>
                            {row.moneyEv.toFixed(2)}
                          </span>
                        </td>
                        <td className="border border-purple-700/30 px-2 py-1 text-right text-gray-300">
                          {row.expectedPayoutWhenWin
                            ? row.expectedPayoutWhenWin.toLocaleString(undefined, { maximumFractionDigits: 0 })
                            : '-'}
                        </td>
                        <td className="border border-purple-700/30 px-2 py-1 text-right text-gray-300">
                          {row.expectedOthers !== undefined
                            ? row.expectedOthers.toFixed(2)
                            : '-'}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
