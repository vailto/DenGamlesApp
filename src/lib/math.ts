import { Outcome } from './types';

/**
 * Converts odds to raw implied probability
 * @param odds - Decimal odds (e.g., 2.50)
 * @returns Raw implied probability (e.g., 0.4)
 */
export function oddsToRawIp(odds: number): number {
  if (odds <= 0) return 0;
  return 1 / odds;
}

/**
 * Normalizes implied probabilities to sum to 1.0
 * @param ip - Record of raw implied probabilities
 * @returns Normalized probabilities that sum to 1.0
 */
export function normalizeIp(ip: Partial<Record<Outcome, number>>): Partial<Record<Outcome, number>> {
  const sum = Object.values(ip).reduce((acc, val) => acc + (val || 0), 0);

  if (sum === 0) return ip;

  const normalized: Partial<Record<Outcome, number>> = {};
  for (const [key, value] of Object.entries(ip)) {
    if (value !== undefined) {
      normalized[key as Outcome] = value / sum;
    }
  }

  return normalized;
}

/**
 * Converts streck percentage (0-100) to decimal (0-1)
 * @param streck - Percentage value (e.g., 55)
 * @returns Decimal value (e.g., 0.55)
 */
export function streckToDecimal(streck: number): number {
  return streck / 100;
}

/**
 * Rounds a number to specified decimal places
 * @param value - Number to round
 * @param decimals - Number of decimal places
 * @returns Rounded number
 */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Converts decimal to percentage with one decimal place
 * @param decimal - Decimal value (0-1)
 * @returns Percentage string (e.g., "55.0%")
 */
export function toPercentage(decimal: number): string {
  return `${roundTo(decimal * 100, 1)}%`;
}
