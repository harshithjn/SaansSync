/**
 * Phase 1: Supabase Auth helpers for doctor and persistence checks.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isDoctorIdUuid(doctorId: string): boolean {
  return UUID_REGEX.test(doctorId)
}

export function diagnosisToDiseaseType(primaryCategory: string): string {
  switch (primaryCategory) {
    case 'Bronchial Asthma':
      return 'Asthma'
    case 'COPD (Chronic Obstructive Pulmonary Disease)':
      return 'COPD'
    case 'Interstitial Lung Disease (ILD)':
      return 'ILD'
    case 'Bronchiectasis':
      return 'Bronchiectasis'
    case 'Post ICU Recovery':
      return 'Post-Infection'
    default:
      return 'ILD'
  }
}
