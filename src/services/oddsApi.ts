// Removed unused import - Outcome is not needed in this file

export interface OddsApiMatch {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    markets: Array<{
      key: string;
      outcomes: Array<{
        name: string;
        price: number;
      }>;
    }>;
  }>;
}

export interface BestOdds {
  home: number;
  draw: number;
  away: number;
  sources: {
    home: string;
    draw: string;
    away: string;
  };
}

/**
 * Fetches odds from The Odds API for a specific sport
 */
export async function fetchOddsFromApi(
  sport: string = 'soccer_uefa_champs_league',
  regions: string = 'eu,uk',
  markets: string = 'h2h'
): Promise<OddsApiMatch[]> {
  // Temporarily hardcode the API key to bypass cache issues
  const apiKey = '8d16b9df1ad17e0d1dbda5d284d995a4';

  if (!apiKey) {
    throw new Error('NEXT_PUBLIC_ODDS_API_KEY is not set');
  }

  const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${apiKey}&regions=${regions}&markets=${markets}&oddsFormat=decimal`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`The Odds API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Extracts the best odds for each outcome from multiple bookmakers
 */
export function getBestOdds(match: OddsApiMatch): BestOdds | null {
  let bestHome = 0;
  let bestDraw = 0;
  let bestAway = 0;
  let sourceHome = '';
  let sourceDraw = '';
  let sourceAway = '';

  for (const bookmaker of match.bookmakers) {
    const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h');
    if (!h2hMarket) continue;

    for (const outcome of h2hMarket.outcomes) {
      if (outcome.name === match.home_team && outcome.price > bestHome) {
        bestHome = outcome.price;
        sourceHome = bookmaker.title;
      } else if (outcome.name === match.away_team && outcome.price > bestAway) {
        bestAway = outcome.price;
        sourceAway = bookmaker.title;
      } else if (outcome.name === 'Draw' && outcome.price > bestDraw) {
        bestDraw = outcome.price;
        sourceDraw = bookmaker.title;
      }
    }
  }

  if (bestHome === 0 || bestDraw === 0 || bestAway === 0) {
    return null;
  }

  return {
    home: bestHome,
    draw: bestDraw,
    away: bestAway,
    sources: {
      home: sourceHome,
      draw: sourceDraw,
      away: sourceAway,
    },
  };
}

/**
 * Attempts to match a team name from our data with API data
 * Simple fuzzy matching - can be improved
 */
export function findMatchInApiData(
  homeTeam: string,
  awayTeam: string,
  apiMatches: OddsApiMatch[]
): OddsApiMatch | null {
  const normalize = (str: string) =>
    str.toLowerCase()
      .replace(/ü/g, 'u')
      .replace(/ö/g, 'o')
      .replace(/ä/g, 'a')
      .replace(/á/g, 'a')
      .replace(/â/g, 'a')
      .replace(/ã/g, 'a')
      .replace(/à/g, 'a')
      .replace(/é/g, 'e')
      .replace(/ê/g, 'e')
      .replace(/è/g, 'e')
      .replace(/í/g, 'i')
      .replace(/ó/g, 'o')
      .replace(/ô/g, 'o')
      .replace(/õ/g, 'o')
      .replace(/ú/g, 'u')
      .replace(/ç/g, 'c')
      .replace(/[^a-z]/g, '');

  // Country name translations (Swedish to English)
  const countryTranslations: Record<string, string> = {
    'sverige': 'sweden',
    'finland': 'finland',
    'tjeckien': 'czechia',
    'tjeckiska': 'czechia',
    'czech': 'czechia',
    'usa': 'usa',
    'kanada': 'canada',
    'ryssland': 'russia',
    'tyskland': 'germany',
    'frankrike': 'france',
    'england': 'england',
    'italien': 'italy',
    'spanien': 'spain',
    'norge': 'norway',
    'danmark': 'denmark',
    'schweiz': 'switzerland',
    'slovakien': 'slovakia',
    'österrike': 'austria',
    'lettland': 'latvia',
    'polen': 'poland',
  };

  // Team name variations (common in Brazilian/Argentine football and hockey)
  const getVariations = (team: string): string[] => {
    const normalized = normalize(team);
    const variations = [normalized];

    // Check if it's a country name
    const translatedCountry = countryTranslations[normalized];
    if (translatedCountry) {
      variations.push(translatedCountry);
    }

    // Soccer variations
    // Atletico vs Athletico
    if (normalized.includes('atletico')) {
      variations.push(normalized.replace('atletico', 'athletico'));
    }
    if (normalized.includes('athletico')) {
      variations.push(normalized.replace('athletico', 'atletico'));
    }

    // Gremio vs Grêmio
    if (normalized === 'gremio') {
      variations.push('gremio', 'gremiodefutebolportoalegrense', 'gremiofbpa');
    }

    // Sport Recife variations
    if (normalized.includes('sport') && normalized.includes('recife')) {
      variations.push('sportrecife', 'sportclubdorecife');
    }

    // Independiente variations
    if (normalized.includes('independiente')) {
      variations.push('independiente', 'caindependiente');
    }

    // Argentinos Juniors variations
    if (normalized.includes('argentinos')) {
      variations.push('argentinosjuniors', 'argentinos');
    }

    // European clubs - UEFA Europa League
    // BK Häcken variations
    if (normalized.includes('hacken')) {
      variations.push('hacken', 'bkhacken', 'hackensgoteborg');
    }

    // Rangers variations
    if (normalized.includes('rangers')) {
      variations.push('rangers', 'glasgowrangers', 'therangers');
    }

    // Strasbourg variations
    if (normalized.includes('strasbourg')) {
      variations.push('strasbourg', 'rcstrasbourg', 'rcstrasbourgalsace');
    }

    // Roma variations
    if (normalized === 'roma') {
      variations.push('roma', 'asroma');
    }

    // Ferencvaros variations
    if (normalized.includes('ferencvaros') || normalized.includes('ferencvarosi')) {
      variations.push('ferencvaros', 'ferencvarosi', 'ferencvarosytc', 'ftc', 'ferencvarosbudapest');
    }

    // English lower league variations
    if (normalized.includes('miltonkeynes') || normalized === 'mkdons') {
      variations.push('miltonkeynes', 'mkdons', 'miltonkeynesdons');
    }
    if (normalized.includes('afcwimbledon') || normalized === 'wimbledon') {
      variations.push('wimbledon', 'afcwimbledon');
    }
    if (normalized.includes('bristolrovers')) {
      variations.push('bristolrovers', 'bristol');
    }
    if (normalized.includes('crawleytown') || normalized === 'crawley') {
      variations.push('crawley', 'crawleytown');
    }

    // Ludogorets variations
    if (normalized.includes('ludogorets')) {
      variations.push('ludogorets', 'ludogoretsrazgrad', 'pfcludogoretsrazgrad');
    }

    // Hockey variations
    // Remove "Hockey Club" suffix
    const withoutHockeyClub = normalized.replace('hockeyclub', '');
    if (withoutHockeyClub !== normalized) {
      variations.push(withoutHockeyClub);
    }

    // Utah Hockey Club
    if (normalized.includes('utah')) {
      variations.push('utah', 'utahhockeyclub');
    }

    // Team name abbreviations for NHL and AHL
    const hockeyAbbreviations: Record<string, string[]> = {
      // NHL
      'torontomapleleafs': ['toronto', 'mapleleafs'],
      'montrealcanadiens': ['montreal', 'canadiens'],
      'ottawasenators': ['ottawa', 'senators'],
      'vancouvercanucks': ['vancouver', 'canucks'],
      'calgaryflames': ['calgary', 'flames'],
      'edmontonoilers': ['edmonton', 'oilers'],
      'winnipegfjets': ['winnipeg', 'jets'],
      'washingtonacapitals': ['washington', 'capitals'],
      'stlouisblues': ['stlouis', 'blues'],
      'columblusjackets': ['columbus', 'bluejackets'],
      'chicagoblackhawks': ['chicago', 'blackhawks'],
      'seattlekraken': ['seattle', 'kraken'],
      'sanjosesharks': ['sanjose', 'sharks'],
      // AHL
      'bridgeportislanders': ['bridgeport', 'islanders'],
      'lehighvalleyphantoms': ['lehighvalley', 'phantoms'],
      'coachellavalleyfirebirds': ['coachellavalley', 'coachella', 'firebirds'],
      'coloradoeagles': ['colorado', 'eagles'],
      'hendersonsilverknights': ['henderson', 'silverknights'],
      'sandiegogulls': ['sandiego', 'gulls'],
    };

    for (const [fullName, abbrevs] of Object.entries(hockeyAbbreviations)) {
      if (normalized === fullName || abbrevs.some(a => normalized.includes(a))) {
        variations.push(fullName, ...abbrevs);
      }
    }

    return variations;
  };

  const homeVariations = getVariations(homeTeam);
  const awayVariations = getVariations(awayTeam);

  for (const match of apiMatches) {
    const apiHomeNorm = normalize(match.home_team);
    const apiAwayNorm = normalize(match.away_team);

    // Try all variations
    for (const homeVar of homeVariations) {
      for (const awayVar of awayVariations) {
        // Exact match
        if (apiHomeNorm === homeVar && apiAwayNorm === awayVar) {
          return match;
        }

        // Partial match (contains)
        if (apiHomeNorm.includes(homeVar) || homeVar.includes(apiHomeNorm)) {
          if (apiAwayNorm.includes(awayVar) || awayVar.includes(apiAwayNorm)) {
            return match;
          }
        }
      }
    }
  }

  return null;
}

/**
 * Fetches best odds for multiple sports and tries to match our matches
 */
export async function fetchBestOddsForMatches(
  matches: Array<{ home: string; away: string }>,
  sportType?: 'hockey' | 'soccer' | 'all'
): Promise<Map<string, BestOdds>> {
  const results = new Map<string, BestOdds>();

  // Define sport categories
  const hockeySports = [
    'icehockey_nhl',
    'icehockey_ahl', // American Hockey League
    'icehockey_sweden_hockey_league', // SHL
    'icehockey_sweden_allsvenskan', // HockeyAllsvenskan
  ];

  const soccerSports = [
    // Major leagues
    'soccer_brazil_campeonato', // Brasileiro Serie A
    'soccer_argentina_primera_division',
    'soccer_conmebol_copa_sudamericana', // South American cups
    'soccer_conmebol_copa_libertadores',
    'soccer_uefa_champs_league',
    'soccer_uefa_europa_league',
    'soccer_epl',
    'soccer_germany_bundesliga',
    'soccer_spain_la_liga',
    'soccer_italy_serie_a',
    'soccer_france_ligue_one',
    'soccer_efl_champ', // Championship
    'soccer_england_league1', // League One
    'soccer_england_league2', // League Two
    'soccer_fa_cup', // FA Cup
    'soccer_sweden_allsvenskan', // Swedish Allsvenskan
    'soccer_sweden_superettan', // Swedish Superettan (Division 2)
    // Secondary/smaller leagues
    'soccer_belgium_first_div', // Belgian Pro League
    'soccer_portugal_primeira_liga', // Primeira Liga
    'soccer_italy_serie_b', // Italian Serie B
  ];

  // Select sports based on type
  let sports: string[];
  if (sportType === 'hockey') {
    sports = hockeySports;
    console.log(`🏒 Fetching hockey leagues only (${sports.length} leagues)`);
  } else if (sportType === 'soccer') {
    sports = soccerSports;
    console.log(`⚽ Fetching soccer leagues only (${sports.length} leagues)`);
  } else {
    sports = [...hockeySports, ...soccerSports];
    console.log(`🌍 Fetching all sports (${sports.length} leagues)`);
  }

  // Fetch sports in batches to avoid rate limiting (10 requests/second limit)
  const BATCH_SIZE = 3; // Fetch 3 sports at a time (reduced from 5)
  const BATCH_DELAY_MS = 2000; // 2 second delay between batches (increased from 1)

  const allApiMatches: OddsApiMatch[] = [];

  for (let i = 0; i < sports.length; i += BATCH_SIZE) {
    const batch = sports.slice(i, i + BATCH_SIZE);

    // Fetch this batch in parallel
    const batchPromises = batch.map(sport =>
      fetchOddsFromApi(sport).catch(err => {
        console.warn(`Failed to fetch ${sport}:`, err.message);
        return [];
      })
    );

    const batchResults = await Promise.all(batchPromises);
    allApiMatches.push(...batchResults.flat());

    // Wait before next batch (unless this is the last batch)
    if (i + BATCH_SIZE < sports.length) {
      console.log(`⏳ Waiting 2s before next batch... (${i + BATCH_SIZE}/${sports.length})`);
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  // Try to match each of our matches with API data
  for (const match of matches) {
    console.log(`\n🔍 Looking for: ${match.home} - ${match.away}`);
    const apiMatch = findMatchInApiData(match.home, match.away, allApiMatches);

    if (apiMatch) {
      console.log(`  ✓ Found in API: ${apiMatch.home_team} - ${apiMatch.away_team}`);
      const bestOdds = getBestOdds(apiMatch);
      if (bestOdds) {
        const key = `${match.home}-${match.away}`;
        results.set(key, bestOdds);
        console.log(`  ✓ Best odds: 1=${bestOdds.home.toFixed(2)} X=${bestOdds.draw.toFixed(2)} 2=${bestOdds.away.toFixed(2)}`);
      } else {
        console.log(`  ✗ No odds found for this match`);
      }
    } else {
      console.log(`  ✗ Not found in API`);
    }
  }

  console.log(`\n📊 Total matches found: ${results.size} of ${matches.length}`);
  console.log(`📊 Total API matches available: ${allApiMatches.length}`);

  // Log all matches for debugging
  if (allApiMatches.length > 0) {
    console.log('\n📋 First 30 available API matches:');
    allApiMatches.slice(0, 30).forEach(m => {
      console.log(`  - ${m.home_team} vs ${m.away_team} (${m.sport_key})`);
    });
    
    if (allApiMatches.length > 30) {
      console.log(`  ... and ${allApiMatches.length - 30} more matches`);
    }

    // Group by sport_key to see what sports are available
    const sportCounts: Record<string, number> = {};
    allApiMatches.forEach(m => {
      const sport = m.sport_key || 'unknown';
      sportCounts[sport] = (sportCounts[sport] || 0) + 1;
    });
    
    console.log('\n📊 Matches by sport:');
    Object.entries(sportCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([sport, count]) => {
        console.log(`  ${sport}: ${count} matches`);
      });

    // Show League One and League Two matches specifically
    const league1Matches = allApiMatches.filter(m => m.sport_key === 'soccer_england_league1');
    const league2Matches = allApiMatches.filter(m => m.sport_key === 'soccer_england_league2');
    
    if (league1Matches.length > 0) {
      console.log('\n⚽ League One matches:');
      league1Matches.forEach(m => {
        console.log(`  ${m.home_team} vs ${m.away_team}`);
      });
    }
    
    if (league2Matches.length > 0) {
      console.log('\n⚽ League Two matches:');
      league2Matches.forEach(m => {
        console.log(`  ${m.home_team} vs ${m.away_team}`);
      });
    }
  }

  return results;
}
