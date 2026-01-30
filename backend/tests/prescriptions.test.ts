import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as prescriptionsController from '../src/controllers/prescriptionsController'
import * as prescriptionsService from '../src/services/prescriptionsService'

function mockReq(body?: any, query?: any) {
  return { body: body || {}, query: query || {} } as any
}

function mockRes() {
  const res: any = {}
  res.status = vi.fn(() => res)
  res.json = vi.fn(() => res)
  return res
}

describe('prescriptionsController', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('createPrescription - missing required fields returns 400', async () => {
    const req = mockReq({})
    const res = mockRes()

    await prescriptionsController.createPrescription(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Missing required fields' })
  })

  it('createPrescription - success', async () => {
    const sample = { id: 'p1' }
    vi.spyOn(prescriptionsService, 'insertPrescription').mockResolvedValue(sample)

    const req = mockReq({ patient_id: 'pid', doctor_id: 'did', patient_name: 'p', doctor_name: 'd' })
    const res = mockRes()

    await prescriptionsController.createPrescription(req, res)

    expect(prescriptionsService.insertPrescription).toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ success: true, prescription: sample })
  })

  it('listPrescriptions - missing query returns 400', async () => {
    const req = mockReq({}, {})
    const res = mockRes()

    await prescriptionsController.listPrescriptions(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'patientId or doctorId required' })
  })

  it('listPrescriptions - success', async () => {
    const sampleList = [{ id: 'x' }]
    vi.spyOn(prescriptionsService, 'getPrescriptions').mockResolvedValue(sampleList)

    const req = mockReq({}, { patientId: 'pid' })
    const res = mockRes()

    await prescriptionsController.listPrescriptions(req, res)

    expect(prescriptionsService.getPrescriptions).toHaveBeenCalledWith({ patientId: 'pid', doctorId: undefined })
    expect(res.json).toHaveBeenCalledWith({ success: true, prescriptions: sampleList })
  })
})
