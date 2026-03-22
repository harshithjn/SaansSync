import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function diagnosisToDiseaseType(diagnosis: string): string {
  if (!diagnosis) return 'unknown';
  const l = diagnosis.toLowerCase();
  if (l.includes('asthma')) return 'asthma';
  if (l.includes('ild') || l.includes('interstitial')) return 'ild';
  if (l.includes('copd') || l.includes('obstructive')) return 'copd';
  if (l.includes('bronchiectasis')) return 'bronchiectasis';
  if (l.includes('post') || l.includes('icu') || l.includes('infection')) return 'post-infection';
  return 'unknown';
}

/**
 * Safely format a date string or object to a human-readable format.
 * Prevents "Invalid Date" errors.
 */
export function formatDate(dateInput: any, options: Intl.DateTimeFormatOptions = {}): string {
  if (!dateInput) return 'N/A';
  
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'N/A';
  
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options
  });
}
