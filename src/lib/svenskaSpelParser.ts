import { MatchInput } from './types';

export interface ParsedCoupon {
  sport: 'Topptipset' | 'Powerplay' | 'Stryktipset' | 'Europatipset';
  roundNumber: string;
  matches: MatchInput[];
  skipOddsApi?: boolean;
  useSvsOdds?: boolean;
}

/**
 * Parses a Svenska Spel text file and extracts match data
 */
export function parseSvenskaSpelFile(content: string): ParsedCoupon {
  // Clean up encoding issues (common in copy-pasted text)
  const cleanContent = content
    .replace(/Ã¥/g, 'å')
    .replace(/Ã¤/g, 'ä')
    .replace(/Ã¶/g, 'ö')
    .replace(/Ã©/g, 'é')
    .replace(/Ã/g, 'Ä')
    .replace(/Ã/g, 'Å')
    .replace(/Ã/g, 'Ö');

  const lines = cleanContent.split('\n').map(line => line.trim()).filter(line => line);

  let sport: 'Topptipset' | 'Powerplay' | 'Stryktipset' | 'Europatipset' = 'Topptipset';
  let roundNumber = '';
  const matches: MatchInput[] = [];

  // Find sport type and round number
  for (const line of lines) {
    // Look for patterns like "Powerplay Omgångsnummer: 4317" or "Powerplay,Omg=4317"
    if (line.includes('Powerplay')) {
      sport = 'Powerplay';
      const match1 = line.match(/(?:Omg|omg).*?[:=]\s*(\d+)/);
      const match2 = line.match(/nummer:\s*(\d+)/);
      if (match1) roundNumber = match1[1];
      else if (match2) roundNumber = match2[1];
    } else if (line.includes('Topptipset')) {
      sport = 'Topptipset';
      const match1 = line.match(/(?:Omg|omg).*?[:=]\s*(\d+)/);
      const match2 = line.match(/nummer:\s*(\d+)/);
      if (match1) roundNumber = match1[1];
      else if (match2) roundNumber = match2[1];
    } else if (line.includes('Stryktipset')) {
      sport = 'Stryktipset';
      const match1 = line.match(/(?:Omg|omg).*?[:=]\s*(\d+)/);
      const match2 = line.match(/nummer:\s*(\d+)/);
      if (match1) roundNumber = match1[1];
      else if (match2) roundNumber = match2[1];
    } else if (line.includes('Europatipset')) {
      sport = 'Europatipset';
      const match1 = line.match(/(?:Omg|omg).*?[:=]\s*(\d+)/);
      const match2 = line.match(/nummer:\s*(\d+)/);
      if (match1) roundNumber = match1[1];
      else if (match2) roundNumber = match2[1];
    }
  }

  // Parse matches - look for pattern: "TeamA - TeamB" followed by streck% and odds
  let currentMatchId = 0;
  let currentHome = '';
  let currentAway = '';
  let currentStreck: { '1': number; 'X': number; '2': number } | null = null;
  let lookingForStreck = false;
  let lookingForOdds = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match line with teams (e.g., "Toronto Maple Leafs - Utah Hockey Club")
    const teamMatch = line.match(/^(.+?)\s*-\s*(.+)$/);
    if (teamMatch && !line.includes('Omg') && !line.includes('%') && !line.includes('Match-ID') && !line.includes('Odds')) {
      const [, home, away] = teamMatch;

      // Skip if it looks like a header, metadata, or match number line
      if (
        home.includes('Match') ||
        home.includes('Nr') ||
        home.includes('Liga') ||
        home.includes('Matchstart') ||
        /^\d+$/.test(home.trim()) ||  // Skip if home is just a number
        home.length < 3 ||  // Skip very short names
        away.length < 3
      ) {
        continue;
      }

      // If we were looking for odds but found a new match, save the previous match without SvS odds
      if (lookingForOdds && currentHome && currentStreck) {
        currentMatchId++;
        matches.push({
          id: `M${currentMatchId}`,
          home: currentHome,
          away: currentAway,
          streck: currentStreck,
          odds: {},
          svsOdds: {}, // No SvS odds available
        });
      }

      currentHome = home.trim();
      currentAway = away.trim();
      currentStreck = null;
      lookingForStreck = true;
      lookingForOdds = false;
      continue;
    }

    // Look for "Svenska folket" line followed by percentages
    if (lookingForStreck && (line.includes('Svenska folket') || line === 'Svenska folket')) {
      // Try to find percentages on the next line (all on one line)
      const nextLine = lines[i + 1];
      if (nextLine) {
        const percentMatch = nextLine.match(/(\d+)%\s+(\d+)%\s+(\d+)%/);
        if (percentMatch) {
          const [, p1, px, p2] = percentMatch;
          currentStreck = {
            '1': parseInt(p1) / 100,
            'X': parseInt(px) / 100,
            '2': parseInt(p2) / 100,
          };
          lookingForStreck = false;
          lookingForOdds = true;
          i++; // Skip the percentage line
          continue;
        }

        // Alternative format: percentages on separate lines
        const line1 = lines[i + 1];
        const line2 = lines[i + 2];
        const line3 = lines[i + 3];

        const p1Match = line1?.match(/^(\d+)%$/);
        const pxMatch = line2?.match(/^(\d+)%$/);
        const p2Match = line3?.match(/^(\d+)%$/);

        if (p1Match && pxMatch && p2Match) {
          currentStreck = {
            '1': parseInt(p1Match[1]) / 100,
            'X': parseInt(pxMatch[1]) / 100,
            '2': parseInt(p2Match[1]) / 100,
          };
          lookingForStreck = false;
          lookingForOdds = true;
          i += 3; // Skip the three percentage lines
        }
      }
    }

    // Look for "Odds" line followed by odds values
    if (lookingForOdds && line === 'Odds') {
      const nextLine = lines[i + 1];

      // Check if next line has odds or is empty/separator
      if (nextLine && nextLine.trim() !== '' && nextLine.trim() !== '---') {
        // Match pattern like "3,30   4,00   2,08" or "3.30   4.00   2.08" (with comma or period as decimal separator)
        const oddsMatch = nextLine.match(/([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)/);
        if (oddsMatch) {
          const [, o1, ox, o2] = oddsMatch;

          currentMatchId++;
          matches.push({
            id: `M${currentMatchId}`,
            home: currentHome,
            away: currentAway,
            streck: currentStreck || {},
            odds: {}, // Will be filled by API
            svsOdds: {
              '1': parseFloat(o1.replace(',', '.')),
              'X': parseFloat(ox.replace(',', '.')),
              '2': parseFloat(o2.replace(',', '.')),
            },
          });

          // Reset for next match
          lookingForOdds = false;
          currentHome = '';
          currentAway = '';
          currentStreck = null;
          continue;
        }
      }

      // If no odds found (empty line or separator), save match without SvS odds
      if (!nextLine || nextLine.trim() === '' || nextLine.trim() === '---') {
        currentMatchId++;
        matches.push({
          id: `M${currentMatchId}`,
          home: currentHome,
          away: currentAway,
          streck: currentStreck || {},
          odds: {},
          svsOdds: {}, // No SvS odds available
        });

        // Reset for next match
        lookingForOdds = false;
        currentHome = '';
        currentAway = '';
        currentStreck = null;
        continue;
      }
    }

    // If we have streck but no odds found after some lines, save without odds
    if (currentStreck && !lookingForOdds && currentHome && i > 0) {
      // Check if we've moved to a new match (found team names again)
      const isNewMatch = teamMatch && !line.includes('Odds');
      if (isNewMatch) {
        currentMatchId++;
        matches.push({
          id: `M${currentMatchId}`,
          home: currentHome,
          away: currentAway,
          streck: currentStreck,
          odds: {},
        });

        // Start processing the new match
        const [, home, away] = teamMatch;
        currentHome = home.trim();
        currentAway = away.trim();
        currentStreck = null;
        lookingForStreck = true;
        lookingForOdds = false;
      }
    }
  }

  // Save last match if we have pending data
  if (currentHome && currentStreck) {
    currentMatchId++;
    matches.push({
      id: `M${currentMatchId}`,
      home: currentHome,
      away: currentAway,
      streck: currentStreck,
      odds: {},
      svsOdds: {}, // No SvS odds available
    });
  }

  return {
    sport,
    roundNumber,
    matches,
  };
}
