'use client';

import { MatchComputed, Outcome } from '@/lib/types';
import { toPercentage } from '@/lib/math';
import ValueBadges from './ValueBadges';

interface MatchTableProps {
  matches: MatchComputed[];
  onMatchChange: (matchId: string, field: string, outcome: Outcome, value: number) => void;
}

export default function MatchTable({ matches, onMatchChange }: MatchTableProps) {
  const outcomes: Outcome[] = ['1', 'X', '2'];

  const handleInputChange = (
    matchId: string,
    field: 'odds' | 'streck',
    outcome: Outcome,
    value: string | number
  ) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (!isNaN(numValue)) {
      onMatchChange(matchId, field, outcome, numValue);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-gray-300 px-4 py-2 text-left">Match</th>
            {outcomes.map(outcome => (
              <th key={`odds-${outcome}`} className="border border-gray-300 px-4 py-2 text-center">
                Odds {outcome}
              </th>
            ))}
            {outcomes.map(outcome => (
              <th key={`streck-${outcome}`} className="border border-gray-300 px-4 py-2 text-center">
                Streck% {outcome}
              </th>
            ))}
            <th className="border border-gray-300 px-4 py-2 text-center">IP%</th>
            <th className="border border-gray-300 px-4 py-2 text-center">Diff (Value)</th>
          </tr>
        </thead>
        <tbody>
          {matches.map(match => (
            <tr key={match.id} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-4 py-2">
                <div className="font-medium">{match.home}</div>
                <div className="text-sm text-gray-600">vs {match.away}</div>
              </td>
              {outcomes.map(outcome => (
                <td key={`odds-${match.id}-${outcome}`} className="border border-gray-300 px-2 py-2">
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={match.odds?.[outcome] || ''}
                    onChange={e => handleInputChange(match.id, 'odds', outcome, e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                    placeholder="-"
                  />
                </td>
              ))}
              {outcomes.map(outcome => (
                <td key={`streck-${match.id}-${outcome}`} className="border border-gray-300 px-2 py-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={match.streck?.[outcome] !== undefined ? (match.streck[outcome]! * 100).toFixed(1) : ''}
                    onChange={e => {
                      const percentValue = parseFloat(e.target.value);
                      if (!isNaN(percentValue)) {
                        handleInputChange(match.id, 'streck', outcome, percentValue / 100);
                      }
                    }}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                    placeholder="-"
                  />
                </td>
              ))}
              <td className="border border-gray-300 px-2 py-2 text-center text-sm">
                {outcomes.map(outcome => {
                  const ip = match.ip?.[outcome];
                  return ip !== undefined ? (
                    <div key={outcome}>
                      {outcome}: {toPercentage(ip)}
                    </div>
                  ) : null;
                })}
              </td>
              <td className="border border-gray-300 px-2 py-2">
                <ValueBadges diff={match.diff} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
