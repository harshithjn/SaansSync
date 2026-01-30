/**
 * SaansSync Alert Engines — FINAL (LOCKED)
 * Asthma, COPD, Bronchiectasis/Post ICU, ILD
 * RED / YELLOW / GREEN with reason_text for doctor dashboard
 */

export type AlertLevel = 'RED' | 'YELLOW' | 'GREEN'
export type DiseaseType = 'ILD' | 'ASTHMA' | 'COPD' | 'BRONCHIECTASIS' | 'POST_ICU'

export type AsthmaControlLevel = 'well-controlled' | 'partly-controlled' | 'poorly-controlled'

/** Inputs from today's log + stored baselines / yesterday */
export interface AsthmaLogInput {
  patientId: string
  spo2Rest: number
  spo2Exertion?: number
  rescuePuffsToday: number
  controllerTaken: boolean
  mMrcToday: number
  temperatureF?: number
  coughVas: number
  chestPainVas: number
  hemoptysis: boolean
  breathlessnessVas: number
  wheezeVas?: number
  fatigueVas?: number
  asthmaControlToday: AsthmaControlLevel
  baselineSpO2?: number
  baselineMrc?: number
  baselineCoughVas?: number
  /** Yesterday's control level */
  yesterdayControl?: AsthmaControlLevel
  /** Yesterday's rescue puffs */
  yesterdayRescuePuffs?: number
}

export interface COPDLogInput {
  patientId: string
  spo2Rest: number
  oxygenFlowToday?: number
  mMrcToday: number
  sputumColor?: string
  sputumVolume?: 'none' | 'small' | 'moderate' | 'large' | 'large amount'
  energyScore?: number
  chestHeavinessVas?: number
  sleepDisturbed?: boolean
  wheeze?: boolean
  temperatureF?: number
  hemoptysisAmount?: string // 'one cup' etc
  exerciseToleranceGood?: boolean
  baselineSpO2?: number
  baselineMrc?: number
  baselineOxygenFlow?: number
  yesterdaySputumColor?: string
  yesterdaySputumVolume?: string
  yesterdayTemp?: number
  yesterdaySpO2?: number
  yesterdayMrc?: number
  yesterdayEnergy?: number
  yesterdaySleepDisturbed?: boolean
  yesterdayChestHeaviness?: number
}

export interface BronchiectasisLogInput {
  patientId: string
  spo2Rest: number
  oxygenFlowToday?: number
  sputumColor?: string
  sputumVolume?: string
  temperatureF?: number
  malaise?: boolean
  wheezing?: boolean
  mMrcToday: number
  pedalEdema?: boolean
  chestPainVas?: number
  hemoptysisAmount?: string
  baselineSpO2?: number
  baselineMrc?: number
  baselineOxygenFlow?: number
  /** For 3-day rule: day before yesterday */
  dayBeforeSputumColor?: string
  dayBeforeSputumVolume?: string
  yesterdaySputumColor?: string
  yesterdaySputumVolume?: string
  yesterdayTemp?: number
  yesterdayMalaise?: boolean
  yesterdaySpO2?: number
  yesterdayMrc?: number
  yesterdayOxygenFlow?: number
  yesterdayPedalEdema?: boolean
}

export interface ILDLogInput {
  patientId: string
  spo2Rest: number
  spo2Exertion?: number
  oxygenFlowToday?: number
  mMrcToday: number
  temperatureF?: number
  coughVas: number
  chestPainVas: number
  hemoptysis: boolean
  breathlessnessVas?: number
  fatigueVas?: number
  kbildToday?: number
  medTakenToday?: boolean
  newRash?: boolean
  diarrhea?: boolean
  baselineSpO2?: number
  baselineMrc?: number
  baselineOxygenFlow?: number
  baselineCoughVas?: number
  baselineExertionalSpO2?: number
  yesterdaySpO2?: number
  yesterdayMrc?: number
  yesterdayCoughVas?: number
  yesterdaySpO2Exertion?: number
  lastKbild?: number
}

export interface AlertOutput {
  level: AlertLevel
  reason_text: string
  triggers: string[]
  timestamp: string
  patientId: string
  diseaseType: DiseaseType
}

// --- Doctor-facing alert storage (RED/YELLOW/GREEN with reason_text)
const SAANSSYNC_ALERTS_KEY = 'saanssync_doctor_alerts'

export interface StoredDoctorAlert {
  id: string
  patientId: string
  patientName?: string
  doctorId: string
  level: AlertLevel
  reason_text: string
  triggers: string[]
  diseaseType: DiseaseType
  timestamp: string
  acknowledged: boolean
}

export function storeDoctorAlert(alert: AlertOutput, doctorId: string, patientName?: string): void {
  if (typeof window === 'undefined') return
  try {
    const stored = localStorage.getItem(SAANSSYNC_ALERTS_KEY)
    const alerts: StoredDoctorAlert[] = stored ? JSON.parse(stored) : []
    const entry: StoredDoctorAlert = {
      id: `sa-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      patientId: alert.patientId,
      patientName,
      doctorId,
      level: alert.level,
      reason_text: alert.reason_text,
      triggers: alert.triggers,
      diseaseType: alert.diseaseType,
      timestamp: alert.timestamp,
      acknowledged: false
    }
    alerts.push(entry)
    // Keep last 500 alerts
    const trimmed = alerts.slice(-500)
    localStorage.setItem(SAANSSYNC_ALERTS_KEY, JSON.stringify(trimmed))
  } catch (e) {
    console.error('storeDoctorAlert error:', e)
  }
}

export function getDoctorAlertsSaansSync(doctorId: string): StoredDoctorAlert[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(SAANSSYNC_ALERTS_KEY)
    const alerts: StoredDoctorAlert[] = stored ? JSON.parse(stored) : []
    return alerts.filter(a => a.doctorId === doctorId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  } catch (e) {
    return []
  }
}

export function acknowledgeSaansSyncAlert(id: string): void {
  if (typeof window === 'undefined') return
  try {
    const stored = localStorage.getItem(SAANSSYNC_ALERTS_KEY)
    const alerts: StoredDoctorAlert[] = stored ? JSON.parse(stored) : []
    const idx = alerts.findIndex(a => a.id === id)
    if (idx >= 0) {
      alerts[idx].acknowledged = true
      localStorage.setItem(SAANSSYNC_ALERTS_KEY, JSON.stringify(alerts))
    }
  } catch (e) {
    console.error('acknowledgeSaansSyncAlert error:', e)
  }
}

const ASTHMA_CONTROL_HISTORY_KEY = 'asthma_control_history'
const RESCUE_INHALER_HISTORY_KEY = 'rescue_inhaler_history'

/** Get yesterday's control level and rescue puffs for 2-day rules (from enhanced-alert-system storage). */
export function getYesterdayAsthmaData(patientId: string): { yesterdayControl?: AsthmaControlLevel; yesterdayRescuePuffs?: number } {
  if (typeof window === 'undefined') return {}
  try {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const controlStored = localStorage.getItem(ASTHMA_CONTROL_HISTORY_KEY)
    const controlHistory: { [k: string]: { date: string; controlLevel: string }[] } = controlStored ? JSON.parse(controlStored) : {}
    const patientControl = (controlHistory[patientId] || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const yesterdayControlEntry = patientControl.find(e => e.date === yesterdayStr)

    const inhalerStored = localStorage.getItem(RESCUE_INHALER_HISTORY_KEY)
    const inhalerHistory: { [k: string]: { date: string; puffs: number }[] } = inhalerStored ? JSON.parse(inhalerStored) : {}
    const patientInhaler = (inhalerHistory[patientId] || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const yesterdayInhalerEntry = patientInhaler.find(e => e.date === yesterdayStr)

    return {
      yesterdayControl: yesterdayControlEntry?.controlLevel as AsthmaControlLevel | undefined,
      yesterdayRescuePuffs: yesterdayInhalerEntry?.puffs
    }
  } catch {
    return {}
  }
}

/** Store today's asthma control and rescue puffs for next-day 2-day rules (call on submit). */
export function storeTodayAsthmaData(patientId: string, controlLevel: AsthmaControlLevel, rescuePuffs: number): void {
  if (typeof window === 'undefined') return
  try {
    const today = new Date().toISOString().split('T')[0]
    const controlStored = localStorage.getItem(ASTHMA_CONTROL_HISTORY_KEY)
    const controlHistory: { [k: string]: { date: string; controlLevel: string }[] } = controlStored ? JSON.parse(controlStored) : {}
    if (!controlHistory[patientId]) controlHistory[patientId] = []
    controlHistory[patientId] = controlHistory[patientId].filter(e => e.date !== today)
    controlHistory[patientId].push({ date: today, controlLevel })
    localStorage.setItem(ASTHMA_CONTROL_HISTORY_KEY, JSON.stringify(controlHistory))

    const inhalerStored = localStorage.getItem(RESCUE_INHALER_HISTORY_KEY)
    const inhalerHistory: { [k: string]: { date: string; puffs: number }[] } = inhalerStored ? JSON.parse(inhalerStored) : {}
    if (!inhalerHistory[patientId]) inhalerHistory[patientId] = []
    inhalerHistory[patientId] = inhalerHistory[patientId].filter(e => e.date !== today)
    inhalerHistory[patientId].push({ date: today, puffs: rescuePuffs })
    localStorage.setItem(RESCUE_INHALER_HISTORY_KEY, JSON.stringify(inhalerHistory))
  } catch (e) {
    console.error('storeTodayAsthmaData error:', e)
  }
}

// --- Asthma control classification (4 questions → 0, 1–2, 3–4 checkboxes)
export function classifyAsthmaControl(
  nightWaking: boolean,
  daytimeSymptoms: boolean,
  activityLimitation: boolean,
  relieverUse: boolean
): AsthmaControlLevel {
  let count = 0
  if (nightWaking) count++
  if (daytimeSymptoms) count++
  if (activityLimitation) count++
  if (relieverUse) count++
  if (count === 0) return 'well-controlled'
  if (count <= 2) return 'partly-controlled'
  return 'poorly-controlled'
}

// --- ASTHMA ALERT ENGINE
export function asthmaAlertEngine(input: AsthmaLogInput): AlertOutput {
  const triggers: string[] = []
  const t: AsthmaLogInput = input

  // STEP 2 — RED (immediate)
  if (t.hemoptysis) {
    return { level: 'RED', reason_text: 'Action recommended: Hemoptysis reported.', triggers: ['Hemoptysis = YES'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'ASTHMA' }
  }
  if (t.chestPainVas >= 8) {
    return { level: 'RED', reason_text: 'Action recommended: Severe chest pain (VAS ≥8/10).', triggers: ['Chest pain VAS ≥ 8'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'ASTHMA' }
  }
  if (t.spo2Rest <= 80) {
    return { level: 'RED', reason_text: 'Action recommended: SpO₂ ≤80% at rest.', triggers: ['SpO₂ ≤ 80%'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'ASTHMA' }
  }
  if (t.rescuePuffsToday >= 8) {
    return { level: 'RED', reason_text: 'Action recommended: Rescue inhaler use ≥8 puffs today.', triggers: ['Rescue inhaler ≥ 8 puffs'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'ASTHMA' }
  }

  // STEP 3 — RED (control-based, 2 consecutive days)
  if (t.asthmaControlToday === 'poorly-controlled' && t.yesterdayControl === 'poorly-controlled') {
    return { level: 'RED', reason_text: 'Action recommended: Poorly controlled asthma for 2 consecutive days.', triggers: ['Poorly controlled asthma × 2 days'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'ASTHMA' }
  }
  if (t.rescuePuffsToday > 6 && (t.yesterdayRescuePuffs ?? 0) > 6) {
    return { level: 'RED', reason_text: 'Action recommended: Rescue inhaler use >6 puffs/day for 2 consecutive days.', triggers: ['Rescue >6 puffs × 2 days'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'ASTHMA' }
  }

  // STEP 4 — RED (sustained physiology / symptoms, 2 consecutive days)
  const yesterdaySpO2 = (t as any).yesterdaySpO2 as number | undefined
  const yesterdayMrc = (t as any).yesterdayMrc as number | undefined
  const yesterdayCough = (t as any).yesterdayCoughVas as number | undefined
  if (t.spo2Rest <= 88 && yesterdaySpO2 != null && yesterdaySpO2 <= 88) {
    return { level: 'RED', reason_text: 'Action recommended: Resting SpO₂ ≤88% for 2 consecutive days.', triggers: ['SpO₂ ≤ 88% × 2 days'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'ASTHMA' }
  }
  if (t.baselineSpO2 != null && (t.baselineSpO2 - t.spo2Rest) >= 4 && yesterdaySpO2 != null && t.baselineSpO2 - yesterdaySpO2 >= 4) {
    return { level: 'RED', reason_text: 'Action recommended: SpO₂ drop ≥4% from baseline for 2 consecutive days.', triggers: ['SpO₂ drop ≥4% × 2 days'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'ASTHMA' }
  }
  if (t.baselineSpO2 != null && t.spo2Exertion != null && (t.baselineSpO2 - t.spo2Exertion) >= 10) {
    return { level: 'RED', reason_text: 'Action recommended: Exertional SpO₂ drop ≥10% from baseline.', triggers: ['Exertional SpO₂ drop ≥10%'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'ASTHMA' }
  }
  if (t.baselineMrc != null && (t.mMrcToday - t.baselineMrc) >= 3) {
    return { level: 'RED', reason_text: 'Action recommended: mMRC increase ≥3 grades from baseline.', triggers: ['mMRC ↑ ≥3'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'ASTHMA' }
  }
  const tempHigh = (t.temperatureF ?? 0) >= 100.4
  const coughHigh = t.coughVas >= 8
  const coughWorse = (t.baselineCoughVas != null) && (t.coughVas - t.baselineCoughVas) >= 4
  if (tempHigh && coughHigh && coughWorse && yesterdaySpO2 != null) {
    return { level: 'RED', reason_text: 'Action recommended: Temperature ≥100.4°F with cough VAS ≥8 and worsened ≥4 from baseline (2 days).', triggers: ['Fever + cough worsening'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'ASTHMA' }
  }

  // STEP 5 — YELLOW scoring
  let score = 0
  if (t.spo2Rest >= 89 && t.spo2Rest <= 91) score += 2
  if (t.baselineMrc != null && (t.mMrcToday - t.baselineMrc) >= 2) score += 2
  const anyVas57 = [t.breathlessnessVas, t.coughVas, t.wheezeVas ?? 0, t.fatigueVas ?? 0].some(v => v >= 5 && v <= 7)
  if (anyVas57) score += 1
  if (t.rescuePuffsToday > 6) score += 2
  if (t.asthmaControlToday === 'partly-controlled') score += 1
  if (t.asthmaControlToday === 'poorly-controlled') score += 2
  if (!t.controllerTaken) score += 2
  // Any side effect (simplified: pass from caller if needed)
  // if (sideEffectReported) score += 1

  if (score >= 3) {
    const reason = 'Review suggested: ' + (t.rescuePuffsToday > 6 ? 'Increased rescue inhaler use. ' : '') + (t.asthmaControlToday === 'partly-controlled' ? 'Partly controlled asthma.' : t.asthmaControlToday === 'poorly-controlled' ? 'Poorly controlled asthma (1 day).' : '')
    return { level: 'YELLOW', reason_text: reason.trim() || 'Review suggested: Score ≥3.', triggers: [`Yellow score ${score}`], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'ASTHMA' }
  }

  // STEP 6 — GREEN
  return { level: 'GREEN', reason_text: 'Asthma stable and well controlled.', triggers: [], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'ASTHMA' }
}

// --- COPD ALERT ENGINE
export function copdAlertEngine(input: COPDLogInput): AlertOutput {
  const t = input

  if (t.hemoptysisAmount === 'one cup' || (t.hemoptysisAmount && t.hemoptysisAmount.toLowerCase().includes('cup'))) {
    return { level: 'RED', reason_text: 'Action recommended: Massive hemoptysis (≥ one cup).', triggers: ['Hemoptysis ≥ one cup'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'COPD' }
  }
  if ((t.chestHeavinessVas ?? 0) >= 8) {
    return { level: 'RED', reason_text: 'Action recommended: Severe chest pain/heaviness (VAS ≥8).', triggers: ['Chest pain VAS ≥ 8'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'COPD' }
  }
  if (t.spo2Rest <= 80) {
    return { level: 'RED', reason_text: 'Action recommended: SpO₂ ≤80% at rest.', triggers: ['SpO₂ ≤ 80%'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'COPD' }
  }

  const purulent = t.sputumColor === 'yellow' || t.sputumColor === 'dark-green' || t.sputumColor === 'green'
  const largeVolume = t.sputumVolume === 'large' || t.sputumVolume === 'large amount'
  if (purulent && largeVolume) {
    return { level: 'RED', reason_text: 'Action recommended: Purulent sputum with increased volume (large amount) on same day.', triggers: ['Purulent sputum + large volume'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'COPD' }
  }
  if ((t.temperatureF ?? 0) >= 102 && t.yesterdayTemp != null && t.yesterdayTemp >= 102) {
    return { level: 'RED', reason_text: 'Action recommended: Fever ≥102°F on 2 consecutive days.', triggers: ['Fever ≥102°F × 2 days'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'COPD' }
  }
  const oxIncrease = (t.oxygenFlowToday ?? 0) - (t.baselineOxygenFlow ?? 0) >= 3
  if (oxIncrease) {
    return { level: 'RED', reason_text: 'Action recommended: Increase in oxygen requirement ≥3 L/min above baseline.', triggers: ['Oxygen ↑ ≥3 L/min'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'COPD' }
  }

  if (t.spo2Rest <= 85 && t.yesterdaySpO2 != null && t.yesterdaySpO2 <= 85) {
    return { level: 'RED', reason_text: 'Action recommended: Resting SpO₂ ≤85% for 2 consecutive days.', triggers: ['SpO₂ ≤85% × 2 days'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'COPD' }
  }
  if (t.baselineSpO2 != null && (t.baselineSpO2 - t.spo2Rest) >= 6 && t.yesterdaySpO2 != null && (t.baselineSpO2 - t.yesterdaySpO2) >= 6) {
    return { level: 'RED', reason_text: 'Action recommended: SpO₂ drop ≥6% from baseline for 2 consecutive days.', triggers: ['SpO₂ drop ≥6% × 2 days'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'COPD' }
  }
  if (t.baselineMrc != null && (t.mMrcToday - t.baselineMrc) >= 2 && t.yesterdayMrc != null && (t.yesterdayMrc - t.baselineMrc) >= 2) {
    return { level: 'RED', reason_text: 'Action recommended: mMRC increase ≥2 grades from baseline for 2 consecutive days.', triggers: ['mMRC ↑ ≥2 × 2 days'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'COPD' }
  }
  if ((t.energyScore ?? 10) < 4 && (t.yesterdayEnergy ?? 10) < 4) {
    return { level: 'RED', reason_text: 'Action recommended: Energy level <4/10 for 2 consecutive days.', triggers: ['Energy <4 × 2 days'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'COPD' }
  }
  if (t.sleepDisturbed && t.yesterdaySleepDisturbed) {
    return { level: 'RED', reason_text: 'Action recommended: Sleep disturbed due to breathlessness for 2 consecutive days.', triggers: ['Sleep disturbed × 2 days'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'COPD' }
  }
  if ((t.chestHeavinessVas ?? 0) >= 8 && (t.yesterdayChestHeaviness ?? 0) >= 8) {
    return { level: 'RED', reason_text: 'Action recommended: Chest heaviness VAS ≥8 for 2 consecutive days.', triggers: ['Chest heaviness ≥8 × 2 days'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'COPD' }
  }

  let score = 0
  if (purulent) score += 2
  if (largeVolume) score += 1
  if ((t.energyScore ?? 10) < 4) score += 2
  if ((t.chestHeavinessVas ?? 0) >= 5 && (t.chestHeavinessVas ?? 0) <= 7) score += 1
  if (t.sleepDisturbed) score += 2
  if (t.wheeze) score += 2
  const temp100_102 = (t.temperatureF ?? 0) >= 100.4 && (t.temperatureF ?? 0) <= 101.9
  if (temp100_102) score += 1
  if (t.baselineMrc != null && (t.mMrcToday - t.baselineMrc) >= 2) score += 2
  if (t.spo2Rest >= 89 && t.spo2Rest <= 91) score += 1
  if (t.exerciseToleranceGood) score -= 1

  if (score >= 4) {
    return { level: 'YELLOW', reason_text: 'Review suggested: Increased sputum purulence with mild breathlessness.', triggers: [`Yellow score ${score}`], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'COPD' }
  }
  return { level: 'GREEN', reason_text: 'COPD symptoms stable.', triggers: [], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'COPD' }
}

// --- BRONCHIECTASIS / POST ICU ALERT ENGINE
export function bronchiectasisAlertEngine(input: BronchiectasisLogInput): AlertOutput {
  const t = input

  if (t.hemoptysisAmount === 'one glass' || (t.hemoptysisAmount && t.hemoptysisAmount.toLowerCase().includes('glass'))) {
    return { level: 'RED', reason_text: 'Action recommended: Hemoptysis ≥ one glass.', triggers: ['Hemoptysis ≥ one glass'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'BRONCHIECTASIS' }
  }
  if ((t.chestPainVas ?? 0) >= 8) {
    return { level: 'RED', reason_text: 'Action recommended: Severe chest pain (VAS ≥8).', triggers: ['Chest pain VAS ≥ 8'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'BRONCHIECTASIS' }
  }
  if (t.spo2Rest <= 80) {
    return { level: 'RED', reason_text: 'Action recommended: SpO₂ ≤80% at rest.', triggers: ['SpO₂ ≤ 80%'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'BRONCHIECTASIS' }
  }

  const darkGreen = (t.sputumColor ?? '').toLowerCase().includes('dark green')
  const muchMore = (t.sputumVolume ?? '').toLowerCase().includes('much more')
  const yesterdayDark = (t.yesterdaySputumColor ?? '').toLowerCase().includes('dark green')
  const yesterdayMuch = (t.yesterdaySputumVolume ?? '').toLowerCase().includes('much more')
  const dayBeforeDark = (t.dayBeforeSputumColor ?? '').toLowerCase().includes('dark green')
  const dayBeforeMuch = (t.dayBeforeSputumVolume ?? '').toLowerCase().includes('much more')
  if (darkGreen && muchMore && yesterdayDark && yesterdayMuch && dayBeforeDark && dayBeforeMuch) {
    return { level: 'RED', reason_text: 'Action recommended: Dark green sputum with "much more than usual" volume for 3 consecutive days.', triggers: ['Dark green sputum + much more × 3 days'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'BRONCHIECTASIS' }
  }

  if ((t.temperatureF ?? 0) >= 102 && (t.yesterdayTemp ?? 0) >= 102) {
    return { level: 'RED', reason_text: 'Action recommended: Temperature ≥102°F on 2 consecutive days.', triggers: ['Temp ≥102°F × 2 days'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'BRONCHIECTASIS' }
  }
  const temp100_102 = (t.temperatureF ?? 0) >= 100.4 && (t.temperatureF ?? 0) < 102
  if (temp100_102 && t.malaise && (t.yesterdayTemp ?? 0) >= 100.4 && t.yesterdayMalaise) {
    return { level: 'RED', reason_text: 'Action recommended: Temperature ≥100.4°F with severe malaise on 2 consecutive days.', triggers: ['Fever + malaise × 2 days'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'BRONCHIECTASIS' }
  }
  if (t.spo2Rest <= 85 && t.yesterdaySpO2 != null && t.yesterdaySpO2 <= 85) {
    return { level: 'RED', reason_text: 'Action recommended: Resting SpO₂ ≤85% for 2 consecutive days.', triggers: ['SpO₂ ≤85% × 2 days'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'BRONCHIECTASIS' }
  }
  if (t.baselineSpO2 != null && (t.baselineSpO2 - t.spo2Rest) >= 6 && t.yesterdaySpO2 != null && (t.baselineSpO2 - t.yesterdaySpO2) >= 6) {
    return { level: 'RED', reason_text: 'Action recommended: SpO₂ drop ≥6% from baseline for 2 consecutive days.', triggers: ['SpO₂ drop ≥6% × 2 days'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'BRONCHIECTASIS' }
  }
  const oxIncrease = (t.oxygenFlowToday ?? 0) - (t.baselineOxygenFlow ?? 0) >= 3
  if (oxIncrease) {
    return { level: 'RED', reason_text: 'Action recommended: Increase in oxygen requirement ≥3 L/min above baseline.', triggers: ['Oxygen ↑ ≥3 L/min'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'BRONCHIECTASIS' }
  }
  if (t.baselineMrc != null && (t.mMrcToday - t.baselineMrc) >= 2 && t.yesterdayMrc != null && (t.yesterdayMrc - t.baselineMrc) >= 2) {
    return { level: 'RED', reason_text: 'Action recommended: mMRC increase ≥2 grades for 2 consecutive days.', triggers: ['mMRC ↑ ≥2 × 2 days'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'BRONCHIECTASIS' }
  }
  if (t.pedalEdema && (t as any).yesterdayPedalEdema) {
    return { level: 'RED', reason_text: 'Action recommended: Pedal edema present for 2 consecutive days.', triggers: ['Pedal edema × 2 days'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'BRONCHIECTASIS' }
  }

  let score = 0
  if ((t.sputumColor ?? '').toLowerCase().includes('pale yellow') || (t.sputumColor ?? '').toLowerCase().includes('light green')) score += 2
  if ((t.sputumVolume ?? '').toLowerCase().includes('more than usual')) score += 1
  if (t.malaise) score += 1
  if ((t.temperatureF ?? 0) >= 100.4 && (t.temperatureF ?? 0) <= 101.9) score += 2
  if (t.wheezing) score += 1
  if (t.baselineMrc != null && (t.mMrcToday - t.baselineMrc) >= 2) score += 1
  if (t.spo2Rest >= 89 && t.spo2Rest <= 91) score += 1
  if (t.pedalEdema) score += 1

  if (score >= 4) {
    return { level: 'YELLOW', reason_text: 'Review suggested: Increased sputum volume and mild breathlessness.', triggers: [`Yellow score ${score}`], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'BRONCHIECTASIS' }
  }
  return { level: 'GREEN', reason_text: 'Stable. Continue airway clearance and maintenance therapy.', triggers: [], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'BRONCHIECTASIS' }
}

// --- ILD ALERT ENGINE
export function ildAlertEngine(input: ILDLogInput): AlertOutput {
  const t = input

  if (t.hemoptysis) {
    return { level: 'RED', reason_text: 'Action recommended: Hemoptysis reported.', triggers: ['Hemoptysis = YES'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'ILD' }
  }
  if (t.chestPainVas >= 8) {
    return { level: 'RED', reason_text: 'Action recommended: Severe chest pain (VAS ≥8).', triggers: ['Chest pain VAS ≥ 8'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'ILD' }
  }
  if (t.spo2Rest <= 80) {
    return { level: 'RED', reason_text: 'Action recommended: SpO₂ ≤80% at rest.', triggers: ['SpO₂ ≤ 80%'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'ILD' }
  }

  if (t.spo2Rest <= 85 && t.yesterdaySpO2 != null && t.yesterdaySpO2 <= 85) {
    return { level: 'RED', reason_text: 'Action recommended: Resting SpO₂ ≤85% for 2 consecutive days.', triggers: ['SpO₂ ≤85% × 2 days'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'ILD' }
  }
  if (t.baselineSpO2 != null && (t.baselineSpO2 - t.spo2Rest) >= 6 && t.yesterdaySpO2 != null && (t.baselineSpO2 - t.yesterdaySpO2) >= 6) {
    return { level: 'RED', reason_text: 'Action recommended: SpO₂ drop ≥6% from baseline for 2 consecutive days.', triggers: ['SpO₂ drop ≥6% × 2 days'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'ILD' }
  }
  if (t.baselineExertionalSpO2 != null && t.spo2Exertion != null && (t.baselineExertionalSpO2 - t.spo2Exertion) >= 10) {
    return { level: 'RED', reason_text: 'Action recommended: Exertional SpO₂ drop ≥10% from baseline.', triggers: ['Exertional SpO₂ drop ≥10%'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'ILD' }
  }
  if (t.baselineMrc != null && (t.mMrcToday - t.baselineMrc) >= 2 && t.yesterdayMrc != null && (t.yesterdayMrc - t.baselineMrc) >= 2) {
    return { level: 'RED', reason_text: 'Action recommended: mMRC increase ≥2 grades for 2 consecutive days.', triggers: ['mMRC ↑ ≥2 × 2 days'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'ILD' }
  }
  if ((t.temperatureF ?? 0) >= 100.4 && t.coughVas >= 8 && t.baselineCoughVas != null && (t.coughVas - t.baselineCoughVas) >= 3) {
    return { level: 'RED', reason_text: 'Action recommended: Temperature ≥100.4°F with cough VAS ≥8 and worsened ≥3 from baseline.', triggers: ['Fever + cough worsening'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'ILD' }
  }

  const oxIncrease = (t.oxygenFlowToday ?? 0) - (t.baselineOxygenFlow ?? 0) >= 3
  if (oxIncrease) {
    return { level: 'RED', reason_text: 'Action recommended: Oxygen requirement increased by ≥3 L/min.', triggers: ['Oxygen ↑ ≥3 L/min'], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'ILD' }
  }

  let score = 0
  const spO2Drop2_3 = t.baselineSpO2 != null && (t.baselineSpO2 - t.spo2Rest) >= 2 && (t.baselineSpO2 - t.spo2Rest) <= 3
  if (t.spo2Rest >= 89 && t.spo2Rest <= 91 && spO2Drop2_3) score += 1
  if (t.baselineMrc != null && (t.mMrcToday - t.baselineMrc) >= 2) score += 1
  const anyVas57 = [t.breathlessnessVas ?? 0, t.coughVas, t.fatigueVas ?? 0].some(v => v >= 5 && v <= 7)
  if (anyVas57) score += 1
  // KBILD drop ≥10% vs last entry
  if (t.kbildToday != null && (t as any).lastKbild != null && ((t as any).lastKbild - t.kbildToday) / (t as any).lastKbild >= 0.1) score += 1
  if (t.medTakenToday === false) score += 1
  if (t.newRash || t.diarrhea) score += 1

  if (score >= 3) {
    return { level: 'YELLOW', reason_text: 'Review suggested: mMRC increased and/or symptoms moderately worse.', triggers: [`Yellow score ${score}`], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'ILD' }
  }
  return { level: 'GREEN', reason_text: 'Stable compared to baseline.', triggers: [], timestamp: new Date().toISOString(), patientId: t.patientId, diseaseType: 'ILD' }
}
