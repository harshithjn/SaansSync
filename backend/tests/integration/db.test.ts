import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../../src/config/db';

describe('Database Integration Tests', () => {
  
  // NOTE: Requires local Docker Postgres Database to be running
  beforeAll(async () => {
    // Basic connectivity check
    try {
        await prisma.$connect();
    } catch (e) {
        console.warn('Database not available for integration tests. Skipping setup.', e);
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('Prisma Client matches expected schema models', () => {
    // Simple test verifying that the Prisma client is initialized
    expect(prisma.alert).toBeDefined();
    expect(prisma.dailyLog).toBeDefined();
    expect(prisma.patient).toBeDefined();
    expect(prisma.doctor).toBeDefined();
  });
  
  // Example of an integration test accessing real models
  it.skip('can create and retrieve a patient reliably from DB', async () => {
      // Test omitted locally if DB is not spun up
      const testEmail = `test_${Date.now()}@example.com`;
      
      const newPatient = await prisma.patient.create({
          data: {
              authUserId: 'clerk-auth-test-id',
              email: testEmail,
              fullName: 'Integration Testing',
              phone: '1234567890',
              diseaseType: 'Asthma'
          }
      });
      
      expect(newPatient.id).toBeDefined();
      
      const retrieved = await prisma.patient.findUnique({
          where: { id: newPatient.id }
      });
      
      expect(retrieved?.email).toBe(testEmail);
      
      // Cleanup
      await prisma.patient.delete({ where: { id: newPatient.id } });
  });
});
