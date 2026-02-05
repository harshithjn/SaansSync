import { DailyLogSubmission } from '../types/shared';
export type AlertLevel = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
export interface AlertResult {
    score: number;
    level: AlertLevel;
    drivers: string[];
}
export declare function calculateDailyScore(log: DailyLogSubmission, baselineSpO2?: number): AlertResult;
export declare function getRiskLevel(score: number): AlertLevel;
export declare function calculateWeightedScore(today: number, yesterday: number, dayBefore: number): number;
//# sourceMappingURL=scoringEngine.d.ts.map