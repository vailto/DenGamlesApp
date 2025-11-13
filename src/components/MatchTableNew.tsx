'use client';

import { MatchComputed, Outcome } from '@/lib/types';
import { toPercentage } from '@/lib/math';

interface MatchTableNewProps {
  matches: MatchComputed[];
  selections: Record<string, Outcome[]>; // matchId -> selected outcomes
  onSelectionChange: (matchId: string, outcome: Outcome) => void;
  outcomePercentages?: Record<string, Record<Outcome, number>>; // % of filtered rows with each outcome
}

export default function MatchTableNew({
  matches,
  selections,
  onSelectionChange,
  outcomePercentages,
}: MatchTableNewProps) {
  const outcomes: Outcome[] = ['1', 'X', '2'];

  const selectAllOutcome = (outcome: Outcome) => {
    // Check if all matches already have this outcome selected
    const allHaveOutcome = matches.every(match =>
      selections[match.id]?.includes(outcome)
    );

    if (allHaveOutcome) {
      // If all have it, deselect from all
      matches.forEach(match => {
        if (selections[match.id]?.includes(outcome)) {
          onSelectionChange(match.id, outcome);
        }
      });
    } else {
      // Otherwise, add to all that don't have it
      matches.forEach(match => {
        if (!selections[match.id]?.includes(outcome)) {
          onSelectionChange(match.id, outcome);
        }
      });
    }
  };

  const helgarderaMatch = (matchId: string) => {
    // Check if all three outcomes are already selected
    const allSelected = outcomes.every(outcome =>
      selections[matchId]?.includes(outcome)
    );

    if (allSelected) {
      // If all selected, deselect all
      outcomes.forEach(outcome => {
        if (selections[matchId]?.includes(outcome)) {
          onSelectionChange(matchId, outcome);
        }
      });
    } else {
      // Otherwise, add all that aren't selected
      outcomes.forEach(outcome => {
        if (!selections[matchId]?.includes(outcome)) {
          onSelectionChange(matchId, outcome);
        }
      });
    }
  };

  const getEV = (match: MatchComputed, outcome: Outcome): number | null => {
    const ip = match.ip?.[outcome];
    const streck = match.streck?.[outcome];
    if (ip === undefined || streck === undefined || streck === 0) return null;
    return ip / streck;
  };

  const isSelected = (matchId: string, outcome: Outcome): boolean => {
    return selections[matchId]?.includes(outcome) || false;
  };

  // Calculate total payout percentage
  // This is the inverse of the bookmaker margin
  // 100% = fair, <100% = bookmaker takes margin, >100% = arbitrage opportunity
  const calculatePayout = (odds: Partial<Record<Outcome, number>>): number => {
    let total = 0;
    outcomes.forEach(outcome => {
      const o = odds[outcome];
      if (o && o > 0) {
        total += 1 / o;
      }
    });
    // If total is 0, return 0 to avoid division by zero
    if (total === 0) return 0;
    // Payout% = 100 / (sum of inverse odds)
    return (1 / total) * 100;
  };

  // Get SvS odds (from file if available, otherwise calculate from streck%)
  const getSvsOdds = (match: MatchComputed): Partial<Record<Outcome, number>> => {
    // If we have svsOdds from the file, use those
    if (match.svsOdds && Object.keys(match.svsOdds).length > 0) {
      return match.svsOdds;
    }

    // Otherwise calculate from streck%
    const svsOdds: Partial<Record<Outcome, number>> = {};
    outcomes.forEach(outcome => {
      const s = match.streck?.[outcome];
      if (s && s > 0) {
        svsOdds[outcome] = 1 / s;
      }
    });
    return svsOdds;
  };

  return (
    <div className="overflow-x-auto rounded-lg shadow-sm">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="px-3 py-3 text-left w-64 bg-gradient-to-br from-blue-900 to-indigo-900 text-white font-bold text-base border-r-2 border-blue-700">
            </th>
            <th className="px-3 py-3 text-center bg-gradient-to-br from-indigo-600 to-blue-700 text-white font-bold border-r-2 border-indigo-800" colSpan={4}>
              📊 Svenska Spel (Streck%)
            </th>
            <th className="px-3 py-3 text-center bg-gradient-to-br from-cyan-600 to-blue-600 text-white font-bold border-r-2 border-cyan-800" colSpan={4}>
              🎯 Odds API (Bästa Odds)
            </th>
            <th className="px-3 py-3 text-center bg-gradient-to-br from-blue-600 to-cyan-700 text-white font-bold" colSpan={3}>
              💎 Värde & Urval
            </th>
          </tr>
          <tr>
            <th className="px-3 py-2 bg-gradient-to-br from-blue-900 to-indigo-900 text-white border-r-2 border-blue-700"></th>
            {/* SvS columns */}
            {outcomes.map(outcome => (
              <th key={`svs-${outcome}`} className="px-1 py-2 bg-indigo-500 text-white text-sm font-semibold border-r border-indigo-400 w-16">
                {outcome}
              </th>
            ))}
            <th className="px-1 py-2 bg-indigo-500 text-white text-xs font-semibold border-r-2 border-indigo-800 w-12">
              Utb%
            </th>
            {/* API columns */}
            {outcomes.map(outcome => (
              <th key={`api-${outcome}`} className="px-1 py-2 bg-cyan-500 text-white text-sm font-semibold border-r border-cyan-400 w-16">
                {outcome}
              </th>
            ))}
            <th className="px-1 py-2 bg-cyan-500 text-white text-xs font-semibold border-r-2 border-cyan-800 w-12">
              Utb%<br/>⚡
            </th>
            {/* Value columns with select all buttons */}
            {outcomes.map(outcome => (
              <th key={`value-${outcome}`} className="px-1 py-2 bg-blue-500 text-white text-xs font-semibold border-r border-blue-400 w-20">
                <button
                  onClick={() => selectAllOutcome(outcome)}
                  className="px-3 py-1 bg-[#2d3752] text-white rounded hover:bg-blue-600 transition-colors font-bold"
                  title={`Välj alla ${outcome}`}
                >
                  {outcome}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matches.map(match => {
            const svsOdds = getSvsOdds(match);
            const svsPayout = calculatePayout(svsOdds);
            // Use API odds if available, otherwise fallback to SvS odds
            const hasApiOdds = match.odds && Object.keys(match.odds).length > 0;
            const displayOdds = hasApiOdds ? match.odds : svsOdds;
            const apiPayout = calculatePayout(displayOdds || {});

            // Check if API odds are missing (using fair odds instead)
            const missingApiOdds = !hasApiOdds;

            return (
              <tr key={match.id} className={`hover:bg-blue-900/30 transition-colors border-b-2 border-blue-700/20 ${missingApiOdds ? 'bg-yellow-900/20' : ''}`}>
                {/* Match name */}
                <td className="px-3 py-2 border-r-2 border-blue-200">
                  <div className="flex items-center gap-2">
                    {missingApiOdds && (
                      <span className="text-yellow-400 text-xs" title="Odds saknas från API - använder fair odds">⚠️</span>
                    )}
                    <div>
                      <div className="text-sm text-white mb-1">{match.home}</div>
                      <div className="text-sm text-white">vs {match.away}</div>
                    </div>
                  </div>
                </td>

                {/* SvS Odds & Streck columns */}
                {outcomes.map(outcome => {
                  const streck = match.streck?.[outcome];
                  const svsOdd = svsOdds[outcome];

                  return (
                    <td
                      key={`svs-${match.id}-${outcome}`}
                      className="px-2 py-1 text-center border-r border-indigo-100"
                    >
                      <div className="text-xs font-medium text-white">
                        {svsOdd ? svsOdd.toFixed(2) : '-'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {streck !== undefined ? `${(streck * 100).toFixed(0)}%` : '-'}
                      </div>
                    </td>
                  );
                })}

                {/* SvS Payout */}
                <td className="px-2 py-1 text-center border-r-2 border-indigo-200">
                  <div className="text-xs font-bold text-white">
                    {svsPayout.toFixed(1)}%
                  </div>
                </td>

                {/* API Odds & IP columns */}
                {outcomes.map(outcome => {
                  // Use API odds if available, otherwise fallback to SvS odds
                  const apiOdds = match.odds?.[outcome];
                  const svsOdd = svsOdds[outcome];
                  const displayOdds = apiOdds || svsOdd;
                  const ip = match.ip?.[outcome];

                  return (
                    <td
                      key={`api-${match.id}-${outcome}`}
                      className="px-2 py-1 text-center border-r border-cyan-100"
                    >
                      <div className="text-xs font-medium text-white">
                        {displayOdds ? displayOdds.toFixed(2) : '-'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {ip !== undefined ? toPercentage(ip) : '-'}
                      </div>
                    </td>
                  );
                })}

                {/* API Payout with helgardera button */}
                <td className="px-2 py-1 text-center border-r-2 border-cyan-200">
                  <button
                    onClick={() => helgarderaMatch(match.id)}
                    className={`text-xs px-2 py-1.5 rounded hover:bg-blue-600 transition-all font-medium w-full ${
                      apiPayout > 100 ? 'bg-emerald-900/40 text-emerald-300' :
                      apiPayout < 100 ? 'bg-orange-900/40 text-orange-300' :
                      'bg-[#2d3752] text-gray-300'
                    }`}
                    title="Helgardera matchen"
                  >
                    {apiPayout.toFixed(1)}%
                  </button>
                </td>

                {/* Value/Selection columns */}
                {outcomes.map(outcome => {
                  const ev = getEV(match, outcome);
                  const selected = isSelected(match.id, outcome);
                  const percentage = outcomePercentages?.[match.id]?.[outcome];
                  const streck = match.streck?.[outcome];
                  const ip = match.ip?.[outcome];

                  // Find the outcome with highest IP (most likely according to odds)
                  const highestIp = Math.max(
                    match.ip?.['1'] || 0,
                    match.ip?.['X'] || 0,
                    match.ip?.['2'] || 0
                  );

                  // Check if it's a favorite with value:
                  // - Has highest IP% (most likely according to odds)
                  // - EV > 1
                  const isFavoriteWithValue =
                    ip && ip === highestIp &&
                    ev && ev > 1;

                  // Check if it's a non-favorite with low value (warning):
                  // - Does NOT have highest IP% (not a favorite)
                  // - EV < 1 (low value)
                  const isNonFavoriteWithLowValue =
                    ip && ip !== highestIp &&
                    ev && ev < 1;

                  return (
                    <td
                      key={`ev-${match.id}-${outcome}`}
                      className="px-2 py-1 border-r border-blue-100"
                    >
                      <button
                        onClick={() => onSelectionChange(match.id, outcome)}
                        className={`w-full rounded font-bold text-sm transition-all flex flex-col items-center justify-center ${
                          selected
                            ? isFavoriteWithValue
                              ? 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white border-2 border-green-500 shadow-md py-2'
                              : isNonFavoriteWithLowValue
                              ? 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white border-2 border-red-500 shadow-md py-2'
                              : 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white border-2 border-blue-700 shadow-md py-2'
                            : isFavoriteWithValue
                            ? 'bg-green-900/30 text-green-300 border-2 border-green-600 hover:bg-green-900/40 py-2'
                            : ev && ev > 1
                            ? 'bg-green-900/20 text-green-400 border border-green-700/50 hover:bg-green-900/30 py-2'
                            : isNonFavoriteWithLowValue
                            ? 'bg-red-900/20 text-red-400 border-2 border-red-600 hover:bg-red-900/30 py-2'
                            : 'bg-gray-900/20 text-gray-400 border border-gray-700/50 hover:bg-gray-900/30 py-2'
                        }`}
                      >
                        <div className="text-base">
                          {ev !== null ? ev.toFixed(2) : '-'}
                        </div>
                        {percentage !== undefined && (
                          <div className={`text-xs mt-1 ${
                            selected ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {percentage.toFixed(0)}%
                          </div>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
