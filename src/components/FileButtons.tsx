'use client';

import { useState, useEffect } from 'react';
import { SystemRow } from '@/lib/types';
import { exportRowsToCSV, exportRowsToJSON, downloadFile } from '@/lib/csv';
import { exportToTopptipset, downloadTopptipsetFile } from '@/lib/svenskaSpelExport';

interface FileButtonsProps {
  rows: SystemRow[];
  disabled?: boolean;
  defaultRoundNumber?: string;
  sportType?: string;
}

export default function FileButtons({ rows, disabled = false, defaultRoundNumber = '3825', sportType }: FileButtonsProps) {
  const [showTopptipsetModal, setShowTopptipsetModal] = useState(false);
  const [roundNumber, setRoundNumber] = useState(defaultRoundNumber);
  const [stake, setStake] = useState(1);
  const [linkedGame, setLinkedGame] = useState<'' | 'Stryk' | 'Europa'>('');

  // Update roundNumber when defaultRoundNumber changes
  useEffect(() => {
    if (defaultRoundNumber) {
      setRoundNumber(defaultRoundNumber);
    }
  }, [defaultRoundNumber]);

  const handleExportCSV = () => {
    const csv = exportRowsToCSV(rows);
    downloadFile(csv, 'poolev-system.csv', 'text/csv');
  };

  const handleExportJSON = () => {
    const json = exportRowsToJSON(rows);
    downloadFile(json, 'poolev-system.json', 'application/json');
  };

  const handleExportTopptipset = () => {
    const content = exportToTopptipset(
      rows,
      roundNumber,
      stake,
      linkedGame || undefined,
      sportType
    );
    downloadTopptipsetFile(content, roundNumber, sportType);
    setShowTopptipsetModal(false);
  };

  const handleSubmit = () => {
    // Dummy function for now - will be implemented when API is ready
    alert('Lämna in-funktionen kommer snart! 🚀');
  };

  const handleExportToTracker = () => {
    // Create simple text file with game info
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const gameType = sportType || 'Topptipset';
    const rowCount = rows.length;
    
    const content = `${gameType}\n${rowCount} rader\n${today}`;
    
    // Create filename: "Powerplay 4317 rader 144.txt"
    const filename = `${gameType} ${roundNumber} rader ${rowCount}.txt`;
    
    // Download the file
    downloadFile(content, filename, 'text/plain');
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowTopptipsetModal(true)}
            disabled={disabled || rows.length === 0}
            className="px-4 py-2 bg-[#2d3752] text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-sm font-medium transition-all"
          >
            📥 Ladda ner
          </button>
          <button
            onClick={handleExportToTracker}
            disabled={disabled || rows.length === 0}
            className="px-4 py-2 bg-[#2d3752] text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-sm font-medium transition-all"
          >
            📊 Till Tracker
          </button>
          <button
            onClick={handleSubmit}
            disabled={disabled || rows.length === 0}
            className="px-4 py-2 bg-[#2d3752] text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-sm font-medium transition-all"
          >
            🚀 Lämna in
          </button>
        </div>

        {rows.length > 0 && (
          <p className="text-sm text-white font-semibold">
            {rows.length.toLocaleString()} rader redo för export
          </p>
        )}
      </div>

      {/* Topptipset Modal */}
      {showTopptipsetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Export till Topptipset</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Omgångsnummer
                </label>
                <input
                  type="text"
                  value={roundNumber}
                  onChange={e => setRoundNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="3825"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Insats (kr)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={stake}
                  onChange={e => setStake(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kopplat till (valfritt)
                </label>
                <select
                  value={linkedGame}
                  onChange={e => setLinkedGame(e.target.value as '' | 'Stryk' | 'Europa')}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Inget</option>
                  <option value="Stryk">Stryktipset</option>
                  <option value="Europa">Europatipset</option>
                </select>
              </div>

              <div className="bg-gray-50 p-3 rounded text-sm">
                <p className="font-medium mb-1">Förhandsvisning:</p>
                <code className="text-xs">
                  {sportType || 'Topptipset'}{linkedGame ? `,${linkedGame}` : ''},Omg={roundNumber},Insats={stake}
                </code>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleExportTopptipset}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
              >
                Exportera
              </button>
              <button
                onClick={() => setShowTopptipsetModal(false)}
                className="px-4 py-2 bg-[#2d3752] text-white rounded hover:bg-gray-600"
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
