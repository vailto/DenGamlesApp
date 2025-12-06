'use client';

import { useState } from 'react';
import { parseSvenskaSpelFile, ParsedCoupon } from '@/lib/svenskaSpelParser';

interface TextPasteInputProps {
  onDataParsed: (coupon: ParsedCoupon) => void | Promise<void>;
}

export default function TextPasteInput({ onDataParsed }: TextPasteInputProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [skipOdds, setSkipOdds] = useState(false);
  const [useSvsOdds, setUseSvsOdds] = useState(false);

  const handleParse = async () => {
    setError('');
    setSuccess('');

    if (!text.trim()) {
      setError('Klistra in text från Svenska Spel');
      return;
    }

    try {
      const parsed = parseSvenskaSpelFile(text);

      if (parsed.matches.length === 0) {
        setError('Inga matcher hittades i texten. Kontrollera att du klistrat in rätt format.');
        return;
      }

      if (!parsed.roundNumber) {
        setError('Kunde inte hitta omgångsnummer. Kontrollera texten.');
        return;
      }

      // Pass skipOdds and useSvsOdds flags to parent (await in case it's async)
      await onDataParsed({ ...parsed, skipOddsApi: skipOdds, useSvsOdds });
      setSuccess(`✓ ${parsed.matches.length} matcher inlästa för ${parsed.sport} omgång ${parsed.roundNumber}`);
      setText(''); // Clear after success
    } catch (err) {
      setError(`Fel vid parsning: ${err instanceof Error ? err.message : 'Okänt fel'}`);
    }
  };

  const handleClear = () => {
    setText('');
    setError('');
    setSuccess('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left column - Textarea (2/3 width) */}
      <div className="lg:col-span-2 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Klistra in omgången från EV-TIPS
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Klistra in hela omgången från EV-TIPS, t.ex.:

Powerplay Omgångsnummer: 4317
...
1
Toronto Maple Leafs - Utah Hockey Club
...
Svenska folket
59%
20%
21%
...`}
            className="w-full h-64 px-3 py-2 bg-[#0f0f2a] border border-blue-700/50 text-gray-200 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 font-mono text-sm"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="skipOdds"
              checked={skipOdds}
              onChange={(e) => setSkipOdds(e.target.checked)}
              className="mr-2 h-4 w-4 text-cyan-400 rounded accent-cyan-400"
            />
            <label htmlFor="skipOdds" className="text-sm text-gray-300">
              Hoppa över odds-hämtning (använd endast streck% för beräkningar)
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="useSvsOdds"
              checked={useSvsOdds}
              onChange={(e) => setUseSvsOdds(e.target.checked)}
              className="mr-2 h-4 w-4 text-green-400 rounded accent-green-400"
            />
            <label htmlFor="useSvsOdds" className="text-sm text-gray-300">
              Hoppa över API-hämtning (använd SvS odds från filen)
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleParse}
              disabled={!text.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed font-medium transition-all"
            >
              Läs in matcher
            </button>
            <button
              onClick={handleClear}
              disabled={!text.trim()}
              className="px-4 py-2 bg-[#2d3752] text-gray-200 rounded-lg hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed transition-all"
            >
              Rensa
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}
      </div>

      {/* Right column - Tips (1/3 width) */}
      <div className="lg:col-span-1">
        <div className="bg-blue-900/20 rounded-lg p-4 h-full border border-blue-700/50">
          <p className="font-bold text-blue-300 mb-2">💡 Tips:</p>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-300">
            <li>Kopiera hela texten från EV-TIPS (inklusive omgångsnummer och streck%)</li>
            <li>Funkar med Topptipset, Stryktipset, Europatipset och Powerplay</li>
            <li>Odds hämtas automatiskt från The Odds API</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
