# PoolEV - Pool Betting Analysis Tool

A powerful MVP application for analyzing Swedish football pools (Topptipset/Stryktipset/Powerplay) using implied probability, streck%, and expected value calculations.

## Overview

PoolEV helps you identify value bets in Swedish football pools by:

1. **Converting odds to Implied Probability (IP%)**: Calculates the probability implied by bookmaker odds
2. **Normalizing probabilities**: Ensures IP% values sum to 100% per match (removing bookmaker margin)
3. **Comparing with public betting (streck%)**: Shows the difference between true probability and public betting patterns
4. **Calculating Expected Value (EV)**: Uses EV Index = (row IP / row streck) to identify value combinations
5. **Filtering system rows**: Allows you to filter betting combinations based on minimum EV threshold

## How It Works

### The Model

**Step 1: Odds → Implied Probability**
```
IP = 1 / odds
Example: Odds 2.50 → IP = 1/2.50 = 0.40 (40%)
```

**Step 2: Normalization**
Raw IP values don't sum to 100% due to bookmaker margin. We normalize them:
```
Normalized IP = Raw IP / Sum(all Raw IPs)
```

**Step 3: Value Detection**
```
Diff = IP% - Streck%
Positive diff = Undervalued by the public (potential value)
```

**Step 4: EV Index**
For each betting row:
```
Row IP = Product of selected outcomes' IP values
Row Streck = Product of selected outcomes' streck values
EV Index = Row IP / Row Streck

EV Index > 1.0 = Theoretical value
Higher EV Index = Better value
```

## Installation

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### 1. Input Match Data

- Enter odds for each outcome (1/X/2) for all 8 matches
- Enter streck% for each outcome (0-100%)
- The table automatically calculates and displays:
  - IP% (implied probability)
  - Diff (IP% - Streck%)
  - Value badges (green = positive diff = potential value)

### 2. Adjust EV Filter

- Use the slider to set minimum EV Index (0.5 - 3.0)
- Default: 1.0 (only show rows with theoretical value)
- Higher values = more aggressive filtering

### 3. Analyze Round

- Click "Analyze Round" to generate all betting combinations
- View:
  - Total rows generated
  - Rows passing the EV filter
  - Top 20 rows sorted by EV Index

### 4. Export Results

- Export filtered rows as CSV or JSON
- Use exported data for further analysis or system building

### Quick Actions

- **Load Sample**: Load 8 sample matches with realistic data
- **Clear All**: Reset all matches to empty state

## Project Structure

```
poolev/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Main application page
│   │   └── globals.css   # Global styles
│   ├── components/       # React components
│   │   ├── MatchTable.tsx        # Match input/display table
│   │   ├── ValueBadges.tsx       # Value indicator badges
│   │   ├── SliderEV.tsx          # EV threshold slider
│   │   ├── SystemPreview.tsx     # Analysis results display
│   │   └── FileButtons.tsx       # Export buttons
│   ├── lib/              # Core utilities
│   │   ├── types.ts      # TypeScript type definitions
│   │   ├── math.ts       # Math utilities
│   │   ├── flow.ts       # Orchestration functions
│   │   └── csv.ts        # Export utilities
│   ├── modules/          # Business logic
│   │   ├── odds.ts       # Odds → IP calculations
│   │   ├── streck.ts     # Streck handling
│   │   └── ev.ts         # System generation & EV calculations
│   └── data/
│       └── sampleMatches.json    # Sample data
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: React hooks + localStorage
- **Build**: SWC

## Known Limitations (MVP)

1. **No pot data**: EV Index is a theoretical measure. Real EV requires pot size and payout structure
2. **Sampling for large combinations**: When > 50,000 combinations exist, we randomly sample 50k rows
3. **No optimization algorithms**: All combinations are generated, not optimized
4. **Manual data entry**: No automatic scraping of odds/streck from Svenska Spel
5. **No historical data**: No database or tracking of past rounds
6. **Client-side only**: All calculations happen in browser

## Future Enhancements

- Integration with Svenska Spel API for automatic data
- Real EV calculation using pot data
- Optimization algorithms (genetic, simulated annealing)
- Historical analysis and backtesting
- User accounts and saved systems
- Mobile app
- Advanced filtering (min rows per sign, banker locks, etc.)

## Development

### Key Functions

- `computeMatchIp()`: Converts odds to normalized IP
- `computeDiff()`: Calculates IP - streck difference
- `generateSystemRows()`: Creates all betting combinations
- `filterRowsByEv()`: Filters by EV threshold
- `analyzeRound()`: Orchestrates full analysis flow

### Adding Features

1. New calculations: Add to `src/modules/`
2. New UI components: Add to `src/components/`
3. New data types: Update `src/lib/types.ts`

## License

MIT

## Support

For issues or questions, please open an issue on the project repository.

---

**PoolEV MVP** - Built with Next.js, TypeScript, and Tailwind CSS
