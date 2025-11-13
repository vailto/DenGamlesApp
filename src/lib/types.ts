export type Outcome = '1' | 'X' | '2';

export interface MatchInput {
  id: string;
  home: string;
  away: string;
  // odds för varje tecken (kan vara null om saknas) - från API
  odds: Partial<Record<Outcome, number>>;
  // streck% 0–1 för varje tecken
  streck: Partial<Record<Outcome, number>>;
  // SvS odds från textfilen (om tillgängliga)
  svsOdds?: Partial<Record<Outcome, number>>;
}

export interface MatchComputed extends MatchInput {
  ip: Partial<Record<Outcome, number>>;  // implied prob per tecken, normaliserad (0–1)
  diff: Partial<Record<Outcome, number>>; // ip - streck (i decimalform 0–1)
}

export interface SystemRow {
  picks: Record<string, Outcome>; // matchId -> valt tecken
  rowIp: number;      // produkt av IP för valda tecken
  rowStreck: number;  // produkt av streck
  evIndex: number;    // rowIp / rowStreck
}

export interface AnalysisSettings {
  minEvIndex: number; // threshold från slider
}
