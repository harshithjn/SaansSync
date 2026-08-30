import { describe, it, expect, vi } from 'vitest';
import { insertAlert, getAlertsByPatient } from '../../src/services/alertsService';

vi.mock('../../src/config/db', () => ({
  default: {
    alert: {
      create: vi.fn().mockImplementation((args) =>
        Promise.resolve({
            id: 'test-alert-1',
            ...args.data,
            createdAt: new Date(),
            updatedAt: new Date()
        })
      ),
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'test-alert-1',
          patientId: 'pat-1',
          doctorId: 'doc-1',
          level: 'CRITICAL',
          reasonText: 'Low SpO2',
          diseaseType: 'Asthma',
          score: 8,
          acknowledged: false
        }
      ])
    }
  }
}));

describe('Alerts Service Unit Tests', () => {
    it('should successfully create an alert with correct mapped properties', async () => {
        const payload = {
            patient_id: 'pat-1',
            doctor_id: 'doc-1',
            level: 'WARNING',
            reason_text: 'High Heart Rate',
            disease_type: 'COPD',
            alert_data: { score: 6 }
        };
        const result = await insertAlert(payload);

        expect(result.level).toBe('WARNING');
        expect(result.score).toBe(6);
        expect(result.patientId).toBe('pat-1');
    });

    it('should fetch alerts by patient ID', async () => {
        const result = await getAlertsByPatient('pat-1');
        expect(result.length).toBe(1);
        expect(result[0].level).toBe('CRITICAL');
    });
});
