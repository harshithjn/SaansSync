import { AlertLevel } from '../scoring/scoringEngine';
import { DailyLogSubmission } from '../types/shared';
export interface EvaluatedAlert {
    score: number;
    level: AlertLevel;
    drivers: string[];
    is_manual_override: boolean;
}
export declare function evaluateAndStoreAlert(patientId: string, diseaseType: string, submission: DailyLogSubmission): Promise<EvaluatedAlert>;
//# sourceMappingURL=alertService.d.ts.map