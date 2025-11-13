'use client';

import { useState, useEffect } from 'react';
import { MatchInput, MatchComputed, SystemRow, Outcome, AnalysisSettings } from '@/lib/types';
import { computeAll, analyzeRound } from '@/lib/flow';
import MatchTableNew from '@/components/MatchTableNew';
import RowPreview from '@/components/RowPreview';
import FileButtons from '@/components/FileButtons';
import FileUpload from '@/components/FileUpload';
import TextPasteInput from '@/components/TextPasteInput';
import OddsEditor from '@/components/OddsEditor';
import sampleData from '@/data/sampleMatches.json';
import currentWeek from '@/data/currentWeek.json';
import { fetchBestOddsForMatches } from '@/services/oddsApi';
import { calculateRowCount, generateRowsFromSelections, filterRowsByEvPercentile } from '@/lib/rowBuilder';
import { ParsedCoupon } from '@/lib/svenskaSpelParser';

const STORAGE_KEY = 'poolev-matches';

export default function Home() {
  const [matches, setMatches] = useState<MatchComputed[]>([]);
  const [minEvIndex, setMinEvIndex] = useState<number>(1.0);
  const [analysisResult, setAnalysisResult] = useState<{
    allRows: SystemRow[];
    keptRows: SystemRow[];
  } | null>(null);
  const [isLoadingOdds, setIsLoadingOdds] = useState(false);
  const [oddsError, setOddsError] = useState<string | null>(null);
  const [selections, setSelections] = useState<Record<string, Outcome[]>>({});
  const [allBuiltRows, setAllBuiltRows] = useState<SystemRow[]>([]);
  const [roundNumber, setRoundNumber] = useState<string>('');
  const [sportType, setSportType] = useState<string>('');
  const [uploadTab, setUploadTab] = useState<'file' | 'text'>('text');
  const [showOddsEditor, setShowOddsEditor] = useState(false);
  const [evFilterPercentage, setEvFilterPercentage] = useState<number>(100); // Keep 100% by default (no filtering)
  const [ipFilterPercentage, setIpFilterPercentage] = useState<number>(100); // Keep 100% by default (no filtering)
  const [turnover, setTurnover] = useState<number>(0); // Omsättning i SEK
  const [extraPot, setExtraPot] = useState<number>(0); // Extra pengar i potten

  // Don't auto-load matches on startup - user will paste/upload their own data
  // Clear old localStorage data on mount
  useEffect(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Don't save to localStorage - it causes issues with reloading old data
  // useEffect(() => {
  //   if (matches.length > 0) {
  //     const matchInputs: MatchInput[] = matches.map(m => ({
  //       id: m.id,
  //       home: m.home,
  //       away: m.away,
  //       odds: m.odds,
  //       streck: m.streck,
  //     }));
  //     localStorage.setItem(STORAGE_KEY, JSON.stringify(matchInputs));
  //   }
  // }, [matches]);

  const loadSampleData = () => {
    const sampleMatches = sampleData as MatchInput[];
    setMatches(computeAll(sampleMatches));
    setAnalysisResult(null);
  };

  const loadCurrentWeek = () => {
    const weekMatches = currentWeek as MatchInput[];
    setMatches(computeAll(weekMatches));
    setAnalysisResult(null);
    setOddsError(null);
  };

  const fetchOddsFromApi = async () => {
    setIsLoadingOdds(true);
    setOddsError(null);

    try {
      // Get current matches to search for
      const matchesToFetch = matches.map(m => ({
        home: m.home,
        away: m.away,
      }));

      console.log('Fetching odds for matches:', matchesToFetch);

      // If no matches, don't fetch
      if (matchesToFetch.length === 0) {
        setOddsError('Inga matcher att hämta odds för');
        setIsLoadingOdds(false);
        return;
      }

      // Fetch best odds from The Odds API
      const oddsMap = await fetchBestOddsForMatches(matchesToFetch, sportType === "Powerplay" ? "hockey" : (sportType === "Topptipset" || sportType === "Stryktipset" || sportType === "Europatipset") ? "soccer" : "all");

      console.log('Odds fetched:', oddsMap.size, 'matches found');

      // Update matches with fetched odds
      const updatedMatches = matches.map(m => {
        const key = `${m.home}-${m.away}`;
        const bestOdds = oddsMap.get(key);

        if (bestOdds) {
          return {
            ...m,
            odds: {
              '1': bestOdds.home,
              'X': bestOdds.draw,
              '2': bestOdds.away,
            },
          };
        }

        // If no API odds found, keep existing odds (svsOdds will be used as fallback in computeMatchIp)
        return m;
      });

      setMatches(computeAll(updatedMatches));
      setAnalysisResult(null);

      // Show success message
      const foundCount = Array.from(oddsMap.values()).length;
      if (foundCount === 0) {
        setOddsError('Inga matcher hittades i The Odds API. Kontrollera lagnamn eller försök senare.');
      } else if (foundCount < matches.length) {
        setOddsError(`Odds hittades för ${foundCount} av ${matches.length} matcher. Vissa lagnamn kunde inte matchas.`);
      }
    } catch (error) {
      console.error('Failed to fetch odds:', error);
      setOddsError(error instanceof Error ? error.message : 'Misslyckades att hämta odds från API');
    } finally {
      setIsLoadingOdds(false);
    }
  };

  const clearAll = () => {
    const emptyMatches: MatchInput[] = Array.from({ length: 8 }, (_, i) => ({
      id: `M${i + 1}`,
      home: '',
      away: '',
      odds: {},
      streck: {},
    }));
    setMatches(computeAll(emptyMatches));
    setAnalysisResult(null);
    setSelections({});
    setRoundNumber('');
    setSportType('');
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleFileLoaded = async (coupon: ParsedCoupon) => {
    // Load the parsed data
    const computedMatches = computeAll(coupon.matches);
    console.log('Parsed matches:', coupon.matches.length, 'matches');
    console.log('Match IDs:', coupon.matches.map(m => m.id));
    setMatches(computedMatches);
    setRoundNumber(coupon.roundNumber);
    setSportType(coupon.sport);
    setAnalysisResult(null);
    setSelections({});
    setOddsError(null);

    // Check if we should skip odds fetching
    if (coupon.skipOddsApi) {
      console.log('Skipping odds API, using fair odds from streck%');
      // Apply fair odds immediately
      const matchesWithFairOdds = computedMatches.map(m => {
        const fairOdds: Partial<Record<Outcome, number>> = {};
        const outcomes: Outcome[] = ['1', 'X', '2'];
        for (const outcome of outcomes) {
          const streck = m.streck?.[outcome];
          if (streck !== undefined && streck > 0) {
            fairOdds[outcome] = 1 / streck;
          }
        }
        return { ...m, odds: fairOdds };
      });
      setMatches(computeAll(matchesWithFairOdds));
      setOddsError('Använder fair odds från streck% (EV=1.00 för alla tecken). Bocka ur checkboxen för att hämta riktiga odds.');
      return;
    }

    // Auto-trigger odds fetching with the new matches
    console.log('Loaded matches:', computedMatches.map(m => `${m.home} - ${m.away}`));

    setIsLoadingOdds(true);

    try {
      const matchesToFetch = computedMatches.map(m => ({
        home: m.home,
        away: m.away,
      }));

      console.log('Fetching odds for:', matchesToFetch);

      const oddsMap = await fetchBestOddsForMatches(matchesToFetch, sportType === "Powerplay" ? "hockey" : (sportType === "Topptipset" || sportType === "Stryktipset" || sportType === "Europatipset") ? "soccer" : "all");

      console.log('Odds fetched:', oddsMap.size, 'matches found');

      // Update matches with fetched odds
      const updatedMatches = computedMatches.map(m => {
        const key = `${m.home}-${m.away}`;
        const bestOdds = oddsMap.get(key);

        if (bestOdds) {
          return {
            ...m,
            odds: {
              '1': bestOdds.home,
              'X': bestOdds.draw,
              '2': bestOdds.away,
            },
          };
        }

        // If no API odds found, keep existing odds (svsOdds will be used as fallback in computeMatchIp)
        return m;
      });

      setMatches(computeAll(updatedMatches));

      // Show success message
      const foundCount = Array.from(oddsMap.values()).length;
      if (foundCount === 0) {
        setOddsError('Inga matcher hittades i The Odds API. Använder fair odds (EV=1.00) från streck%.');
      } else if (foundCount < computedMatches.length) {
        setOddsError(`Odds hittades för ${foundCount} av ${computedMatches.length} matcher. Resterande använder fair odds.`);
      }
    } catch (error) {
      console.error('Failed to fetch odds:', error);
      setOddsError(error instanceof Error ? error.message : 'Misslyckades att hämta odds från API');
    } finally {
      setIsLoadingOdds(false);
    }
  };

  const handleSelectionChange = (matchId: string, outcome: Outcome) => {
    setSelections(prev => {
      const current = prev[matchId] || [];
      const isSelected = current.includes(outcome);

      if (isSelected) {
        // Deselect
        const updated = current.filter(o => o !== outcome);
        return { ...prev, [matchId]: updated };
      } else {
        // Select
        return { ...prev, [matchId]: [...current, outcome] };
      }
    });
  };

  const handleBuildRows = () => {
    const rows = generateRowsFromSelections(matches, selections);
    setAllBuiltRows(rows);
  };

  const handleOddsSave = (allOdds: Record<string, { '1': number; 'X': number; '2': number }>) => {
    // Update all matches with new odds at once
    const updatedMatches = matches.map(m => {
      const newOdds = allOdds[m.id];
      if (newOdds) {
        return { ...m, odds: newOdds };
      }
      return m;
    });

    // Recompute IP%, EV, etc. with new odds
    setMatches(computeAll(updatedMatches));
  };

  const rowCount = calculateRowCount(selections);

  // Apply EV-based filtering (keep top X% by EV)
  let filteredRows = allBuiltRows;
  if (evFilterPercentage < 100) {
    filteredRows = filterRowsByEvPercentile(allBuiltRows, evFilterPercentage);
  }

  // Apply IP-based filtering on the already EV-filtered rows (keep top Y% by IP)
  if (ipFilterPercentage < 100) {
    // Sort by IP (descending) and keep top %
    const sortedByIp = [...filteredRows].sort((a, b) => b.rowIp - a.rowIp);
    const keepCount = Math.ceil((ipFilterPercentage / 100) * filteredRows.length);
    filteredRows = sortedByIp.slice(0, keepCount);
  }

  // Calculate outcome distribution in filtered rows
  const outcomeDistribution: Record<string, Record<Outcome, number>> = {};
  matches.forEach(match => {
    outcomeDistribution[match.id] = { '1': 0, 'X': 0, '2': 0 };
  });

  filteredRows.forEach(row => {
    Object.entries(row.picks).forEach(([matchId, outcome]) => {
      if (outcomeDistribution[matchId]) {
        outcomeDistribution[matchId][outcome]++;
      }
    });
  });

  // Calculate percentages
  const outcomePercentages: Record<string, Record<Outcome, number>> = {};
  matches.forEach(match => {
    outcomePercentages[match.id] = { '1': 0, 'X': 0, '2': 0 };
    const totalRows = filteredRows.length;
    if (totalRows > 0) {
      (['1', 'X', '2'] as Outcome[]).forEach(outcome => {
        const count = outcomeDistribution[match.id][outcome];
        outcomePercentages[match.id][outcome] = (count / totalRows) * 100;
      });
    }
  });


  return (
    <main className="min-h-screen bg-[#1a1f3a] p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 bg-gradient-to-br from-[#1e2745] to-[#2a3256] rounded-2xl shadow-2xl border border-blue-700/30 overflow-hidden">
          <div className="flex items-center -m-4">
            {/* Logo */}
            <div className="flex-shrink-0 pl-4">
              <img
                src="/onegamblingguru-logo.png"
                alt="den Gamle och Vadet"
                className="h-56 w-auto transform hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Text content */}
            <div className="flex-1 px-6">
              <h1 className="text-7xl mb-1 text-white leading-tight">
                <span className="font-bold">den Gamle</span>{' '}
                <span className="font-light">och Vadet</span>
              </h1>
              <p className="text-gray-300 text-2xl italic">
                "tur är för amatörer"
              </p>
              {sportType && roundNumber && (
                <p className="text-sm text-blue-400 font-semibold mt-1 flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
                  {sportType} - Omgång {roundNumber}
                </p>
              )}
            </div>
          </div>
        </header>

        <div className="space-y-6">
          {/* Data Input - File or Text */}
          <div className="bg-gradient-to-br from-[#1e2745] to-[#2a3256] rounded-xl shadow-xl border border-blue-700/30 p-6">
            <h2 className="text-xl font-bold mb-4 text-white">Läs in matcher</h2>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setUploadTab('text')}
                className={`px-4 py-2 font-medium text-sm rounded-lg transition-all ${
                  uploadTab === 'text'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#2d3752] text-gray-300 hover:bg-blue-600 hover:text-white'
                }`}
              >
                📋 Klistra in text
              </button>
              <button
                onClick={() => setUploadTab('file')}
                className={`px-4 py-2 font-medium text-sm rounded-lg transition-all ${
                  uploadTab === 'file'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#2d3752] text-gray-300 hover:bg-blue-600 hover:text-white'
                }`}
              >
                📄 Ladda upp fil
              </button>
            </div>

            {/* Tab Content */}
            {uploadTab === 'text' && (
              <TextPasteInput onDataParsed={handleFileLoaded} />
            )}
            {uploadTab === 'file' && (
              <FileUpload onFileLoaded={handleFileLoaded} />
            )}
          </div>

          {/* Match Table - Full Width */}
          <div className="bg-gradient-to-br from-[#1e2745] to-[#2a3256] rounded-xl shadow-xl border border-blue-700/30 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Matches</h2>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={loadCurrentWeek}
                  className="px-4 py-2 text-sm bg-[#2d3752] text-white rounded-lg hover:bg-blue-600 font-medium transition-all"
                >
                  Veckans Matcher
                </button>
                <button
                  onClick={fetchOddsFromApi}
                  disabled={isLoadingOdds || matches.length === 0}
                  className="px-4 py-2 text-sm bg-[#2d3752] text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed font-medium transition-all"
                >
                  {isLoadingOdds ? 'Hämtar odds...' : 'Hämta Odds (API)'}
                </button>
                <button
                  onClick={() => setShowOddsEditor(true)}
                  disabled={matches.length === 0}
                  className="px-4 py-2 text-sm bg-[#2d3752] text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed font-medium transition-all"
                >
                  Redigera Odds
                </button>
                <button
                  onClick={loadSampleData}
                  className="px-4 py-2 text-sm bg-[#2d3752] text-gray-300 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                >
                  Sample
                </button>
                <button
                  onClick={clearAll}
                  className="px-4 py-2 text-sm bg-[#2d3752] text-red-400 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                >
                  Clear
                </button>
              </div>
            </div>
            {oddsError && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg text-sm text-yellow-800 shadow-sm">
                {oddsError}
              </div>
            )}
            <MatchTableNew
              matches={matches}
              selections={selections}
              onSelectionChange={handleSelectionChange}
              outcomePercentages={allBuiltRows.length > 0 ? outcomePercentages : undefined}
            />

            {/* Row count display */}
            <div className="mt-4 p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-300 font-semibold">Antal rader som kommer byggas:</p>
                  <p className="text-2xl font-bold text-white">
                    {rowCount.toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={handleBuildRows}
                  disabled={rowCount === 0}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed font-medium text-lg transition-all"
                >
                  🚀 Bygg Rader
                </button>
              </div>
            </div>
          </div>

          {/* Filtering and Results - Show after rows are built */}
          {allBuiltRows.length > 0 && (
            <>
              {/* Two-column layout for Filter and Results */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left column - Filtering + Export */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-[#1e2745] to-[#2a3256] rounded-xl shadow-xl border border-blue-700/30 p-6">
                    <h2 className="text-xl font-bold mb-4 text-white">Filtrera Rader</h2>
                    <div className="space-y-6">
                      {/* EV-based filtering */}
                      <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-700/50">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-bold text-blue-300">
                            🎯 EV-filtrering (värde)
                          </label>
                          <span className="text-sm font-bold text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full">
                            {evFilterPercentage}% = {Math.ceil((evFilterPercentage / 100) * allBuiltRows.length).toLocaleString()} rader
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          step="1"
                          value={evFilterPercentage}
                          onChange={(e) => setEvFilterPercentage(Number(e.target.value))}
                          className="w-full h-2 bg-blue-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                        />
                        <p className="text-xs text-gray-400 mt-2">
                          Behåller de <strong className="text-white">{evFilterPercentage}%</strong> av raderna med högst EV (värde).
                          Lägre % = färre rader med bättre värde.
                        </p>
                      </div>

                      {/* IP-based filtering */}
                      <div className="bg-cyan-900/20 p-4 rounded-lg border border-cyan-700/50">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-bold text-cyan-300">
                            🎲 IP-filtrering (sannolikhet)
                          </label>
                          <span className="text-sm font-bold text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full">
                            {ipFilterPercentage}% = {evFilterPercentage < 100
                              ? Math.ceil((ipFilterPercentage / 100) * Math.ceil((evFilterPercentage / 100) * allBuiltRows.length)).toLocaleString()
                              : Math.ceil((ipFilterPercentage / 100) * allBuiltRows.length).toLocaleString()} rader
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          step="1"
                          value={ipFilterPercentage}
                          onChange={(e) => setIpFilterPercentage(Number(e.target.value))}
                          className="w-full h-2 bg-cyan-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                        />
                        <p className="text-xs text-gray-400 mt-2">
                          Tar bort de mest osannolika raderna. Behåller <strong className="text-white">{ipFilterPercentage}%</strong> av
                          EV-filtrerade rader med högst sannolikhet (IP%).
                        </p>
                      </div>

                      {/* Payout calculation inputs */}
                      <div className="bg-yellow-900/20 p-4 rounded-lg border border-yellow-700/50">
                        <label className="text-sm font-bold text-yellow-300 block mb-3">
                          💰 Utdelningsberäkning
                        </label>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">Omsättning (kr)</label>
                            <input
                              type="number"
                              min="0"
                              step="1000"
                              value={turnover || ''}
                              onChange={(e) => setTurnover(Number(e.target.value))}
                              placeholder="t.ex. 1000000"
                              className="w-full px-3 py-2 bg-[#0f0f2a] border border-yellow-700/50 text-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">Extra pott (kr)</label>
                            <input
                              type="number"
                              min="0"
                              step="1000"
                              value={extraPot || ''}
                              onChange={(e) => setExtraPot(Number(e.target.value))}
                              placeholder="t.ex. 50000"
                              className="w-full px-3 py-2 bg-[#0f0f2a] border border-yellow-700/50 text-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          Pott = 70% av omsättning + extra. Utdelning beräknas per rad baserat på rowStreck.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right column - Results */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-[#1e2745] to-[#2a3256] rounded-xl shadow-xl border border-blue-700/30 p-6">
                    <h2 className="text-xl font-bold mb-4 text-white">Resultat</h2>
                    <RowPreview
                      allRows={allBuiltRows}
                      filteredRows={filteredRows}
                      showTable={false}
                      turnover={turnover > 0 ? turnover : undefined}
                      extraPot={extraPot}
                      matches={matches}
                    />
                  </div>
                </div>
              </div>

              {/* Full-width table below filter/results */}
              <div className="bg-gradient-to-br from-[#1e2745] to-[#2a3256] rounded-xl shadow-xl border border-blue-700/30 p-6">
                <RowPreview
                  allRows={allBuiltRows}
                  filteredRows={filteredRows}
                  showTable={true}
                  turnover={turnover > 0 ? turnover : undefined}
                  extraPot={extraPot}
                  matches={matches}
                />
              </div>
            </>
          )}
        </div>

        <footer className="mt-8 text-sm bg-gradient-to-br from-[#1e2745] to-[#2a3256] rounded-xl shadow-xl border border-blue-700/30 p-4">
          <div className="flex items-center justify-between">
            {/* Left side - Export buttons */}
            <div className="flex gap-2">
              <FileButtons rows={filteredRows} defaultRoundNumber={roundNumber} sportType={sportType} />
            </div>

            {/* Right side - Text */}
            <div className="text-right">
              <p className="font-medium text-gray-300">
                den Gamle och Vadet - Din guide till smartare spel 🎯
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Odds → IP% → Streck% → EV Index
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* Odds Editor Modal */}
      {showOddsEditor && (
        <OddsEditor
          matches={matches}
          onSave={handleOddsSave}
          onClose={() => setShowOddsEditor(false)}
        />
      )}
    </main>
  );
}
