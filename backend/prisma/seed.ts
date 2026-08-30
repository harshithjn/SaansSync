import bcrypt from 'bcryptjs'
import prisma from '../src/config/db'

const SALT_ROUNDS = 10

async function seed() {
  console.log('Starting demo seeding...')

  const docEmail = 'doctor@saanssync.com'
  const docPassword = 'doctor123'
  const docName = 'Dr. Sarah Miller'

  const doctor = await prisma.doctor.upsert({
    where: { email: docEmail },
    update: {},
    create: {
      email: docEmail,
      fullName: docName,
      approvalStatus: 'approved',
      password: await bcrypt.hash(docPassword, SALT_ROUNDS)
    }
  })
  console.log('Doctor ready:', doctor.email)

  const patEmail = 'patient@saanssync.com'
  const patPassword = 'patient123'
  const patName = 'John Doe'

  const patientData = {
    fullName: patName,
    age: '65',
    sex: 'Male',
    emailId: patEmail,
    diagnosis: {
      primaryCategory: 'Bronchial Asthma',
      diagnosisDate: '2023-01-01'
    },
    medications: [
      { drugName: 'Salbutamol', dose: '2 puffs', frequency: 'SOS', isActive: true, startDate: '2023-01-01' }
    ]
  }

  const patient = await prisma.patient.upsert({
    where: { email: patEmail },
    update: { doctorId: doctor.id },
    create: {
      email: patEmail,
      fullName: patName,
      doctorId: doctor.id,
      diseaseType: 'Asthma',
      patientData,
      defaultPassword: patPassword,
      password: await bcrypt.hash(patPassword, SALT_ROUNDS)
    }
  })
  console.log('Patient ready:', patient.email)

  await prisma.patientFolder.upsert({
    where: { doctorId_patientId: { doctorId: doctor.id, patientId: patient.id } },
    update: {},
    create: {
      doctorId: doctor.id,
      patientId: patient.id,
      fullName: patName,
      age: 65,
      diseaseType: 'Asthma',
      folderColor: 'green',
      redFlagScore: 2,
      alertCount: 0,
      lastLogDate: new Date()
    }
  })
  console.log('Patient folder synced.')

  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const dayBefore = new Date(today)
  dayBefore.setDate(dayBefore.getDate() - 2)

  await prisma.dailyLog.upsert({
    where: { patientId_logDate: { patientId: patient.id, logDate: dayBefore } },
    update: {},
    create: {
      patientId: patient.id,
      logDate: dayBefore,
      diseaseType: 'Asthma',
      redFlagScore: 2,
      diseaseData: { rawScore: 2, common: { spo2: { atRest: 96 } } }
    }
  })

  await prisma.dailyLog.upsert({
    where: { patientId_logDate: { patientId: patient.id, logDate: yesterday } },
    update: {},
    create: {
      patientId: patient.id,
      logDate: yesterday,
      diseaseType: 'Asthma',
      redFlagScore: 4,
      diseaseData: { rawScore: 4, common: { spo2: { atRest: 94 } }, drivers: ['Mild Symptoms'] }
    }
  })
  console.log('Seeded historical logs.')

  console.log('\nSeeding complete. Demo logins:')
  console.log('  Doctor:  doctor@saanssync.com / doctor123')
  console.log('  Patient: patient@saanssync.com / patient123')
  console.log('  Admin:   any email in ADMIN_EMAILS (see authService.ts) / ADMIN_PASSWORD env var')
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
