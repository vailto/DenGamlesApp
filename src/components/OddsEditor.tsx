'use client';

import { useState } from 'react';
import { MatchComputed, Outcome } from '@/lib/types';

interface OddsEditorProps {
  matches: MatchComputed[];
  onSave: (allOdds: Record<string, { '1': number; 'X': number; '2': number }>) => void;
  onClose: () => void;
}

export default function OddsEditor({ matches, onSave, onClose }: OddsEditorProps) {
  const [editedOdds, setEditedOdds] = useState<Record<string, { '1': number; 'X': number; '2': number }>>(
    () => {
      const initial: Record<string, { '1': number; 'X': number; '2': number }> = {};
      matches.forEach(m => {
        // Start with current odds or fair odds from streck%
        const odds1 = m.odds?.['1'] || (m.streck?.['1'] ? 1 / m.streck['1'] : 2.0);
        const oddsX = m.odds?.['X'] || (m.streck?.['X'] ? 1 / m.streck['X'] : 3.0);
        const odds2 = m.odds?.['2'] || (m.streck?.['2'] ? 1 / m.streck['2'] : 3.5);

        initial[m.id] = {
          '1': Number(odds1.toFixed(2)),
          'X': Number(oddsX.toFixed(2)),
          '2': Number(odds2.toFixed(2)),
        };
      });
      return initial;
    }
  );

  const adjustOdds = (matchId: string, outcome: Outcome, delta: number) => {
    setEditedOdds(prev => {
      const current = prev[matchId][outcome];
      const newValue = Math.max(1.01, Number((current + delta).toFixed(2)));
      return {
        ...prev,
        [matchId]: {
          ...prev[matchId],
          [outcome]: newValue,
        },
      };
    });
  };

  const handleInputChange = (matchId: string, outcome: Outcome, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    setEditedOdds(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [outcome]: Math.max(1.01, Number(numValue.toFixed(2))),
      },
    }));
  };

  const handleSaveAll = () => {
    // Save all edited odds at once
    onSave(editedOdds);
    onClose();
  };

  const calculateImpliedProb = (odds: number) => {
    return (1 / odds * 100).toFixed(1);
  };

  const calculatePayout = (matchOdds: { '1': number; 'X': number; '2': number }) => {
    const total = (1 / matchOdds['1']) + (1 / matchOdds['X']) + (1 / matchOdds['2']);
    return (total * 100).toFixed(1);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e2745] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-blue-700/30">
        {/* Header */}
        <div className="p-6 border-b border-blue-700/30">
          <h2 className="text-2xl font-bold text-white">Redigera Odds</h2>
          <p className="text-sm text-gray-400 mt-1">
            Justera odds manuellt i steg om 0.01. Odds under 1.01 är inte tillåtet.
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {matches.map(match => {
              const matchOdds = editedOdds[match.id];
              const payout = calculatePayout(matchOdds);

              return (
                <div key={match.id} className="border border-blue-700/30 rounded-lg p-4 bg-[#2a3256]">
                  {/* Match Header */}
                  <div className="mb-3">
                    <h3 className="font-bold text-lg text-white">
                      {match.id}: {match.home} - {match.away}
                    </h3>
                    <p className="text-xs text-gray-400">
                      Utbetalning: {payout}%
                      {parseFloat(payout) > 100 && <span className="text-green-400 ml-1">(Övervärde!)</span>}
                      {parseFloat(payout) < 100 && <span className="text-gray-500 ml-1">(Bookmakeravdrag)</span>}
                    </p>
                  </div>

                  {/* Odds Controls */}
                  <div className="grid grid-cols-3 gap-4">
                    {(['1', 'X', '2'] as Outcome[]).map(outcome => {
                      const odds = matchOdds[outcome];
                      const streck = match.streck?.[outcome] || 0;
                      const impliedProb = calculateImpliedProb(odds);

                      return (
                        <div key={outcome} className="bg-[#1e2745] rounded p-3 border border-blue-700/30">
                          <div className="text-center mb-2">
                            <span className="font-bold text-lg text-white">{outcome}</span>
                            <span className="text-xs text-gray-400 ml-2">
                              (Streck: {(streck * 100).toFixed(0)}%)
                            </span>
                          </div>

                          {/* Odds Input */}
                          <div className="flex items-center justify-center mb-2">
                            <button
                              onClick={() => adjustOdds(match.id, outcome, -0.1)}
                              className="px-2 py-1 bg-[#2d3752] hover:bg-blue-600 text-white rounded-l text-sm font-bold"
                            >
                              --
                            </button>
                            <button
                              onClick={() => adjustOdds(match.id, outcome, -0.01)}
                              className="px-2 py-1 bg-[#2d3752] hover:bg-blue-600 text-white text-sm"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={odds}
                              onChange={(e) => handleInputChange(match.id, outcome, e.target.value)}
                              step="0.01"
                              min="1.01"
                              className="w-20 px-2 py-1 text-center border-y border-blue-700/30 bg-[#0f0f2a] text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => adjustOdds(match.id, outcome, 0.01)}
                              className="px-2 py-1 bg-[#2d3752] hover:bg-blue-600 text-white text-sm"
                            >
                              +
                            </button>
                            <button
                              onClick={() => adjustOdds(match.id, outcome, 0.1)}
                              className="px-2 py-1 bg-[#2d3752] hover:bg-blue-600 text-white rounded-r text-sm font-bold"
                            >
                              ++
                            </button>
                          </div>

                          {/* Implied Probability */}
                          <div className="text-center text-xs text-gray-400">
                            IP: {impliedProb}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-blue-700/30 bg-[#2a3256] flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#2d3752] text-white rounded hover:bg-gray-600 font-medium"
          >
            Avbryt
          </button>
          <button
            onClick={handleSaveAll}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
          >
            Spara alla odds
          </button>
        </div>
      </div>
    </div>
  );
}
