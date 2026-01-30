import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as alertsController from '../src/controllers/alertsController'
import * as alertsService from '../src/services/alertsService'

function mockReq(body?: any, query?: any) {
  return { body: body || {}, query: query || {} } as any
}

function mockRes() {
  const res: any = {}
  res.status = vi.fn(() => res)
  res.json = vi.fn(() => res)
  return res
}

describe('alertsController', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('createAlert - success', async () => {
    const sample = { id: '1', patient_id: 'p1', doctor_id: 'd1', level: 'HIGH' }
    vi.spyOn(alertsService, 'insertAlert').mockResolvedValue(sample)

    const req = mockReq({ patient_id: '00000000-0000-0000-0000-000000000001', doctor_id: '00000000-0000-0000-0000-000000000002', level: 'HIGH', reason_text: 'test', disease_type: 'Asthma' })
    const res = mockRes()

    await alertsController.createAlert(req, res)

    expect(alertsService.insertAlert).toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ success: true, alert: sample })
  })

  it('createAlert - validation error returns 500', async () => {
    vi.spyOn(alertsService, 'insertAlert').mockResolvedValue(null)
    const req = mockReq({})
    const res = mockRes()

    await alertsController.createAlert(req, res)

    expect(res.status).toHaveBeenCalled()
    expect(res.json).toHaveBeenCalled()
  })

  it('getAlerts - missing doctorId returns 400', async () => {
    const req = mockReq({}, {})
    const res = mockRes()

    await alertsController.getAlerts(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'doctorId required' })
  })

  it('getAlerts - success', async () => {
    const sampleList = [{ id: 'a1' }]
    vi.spyOn(alertsService, 'getAlertsByDoctor').mockResolvedValue(sampleList)

    const req = mockReq({}, { doctorId: 'd1' })
    const res = mockRes()

    await alertsController.getAlerts(req, res)

    expect(alertsService.getAlertsByDoctor).toHaveBeenCalledWith('d1')
    expect(res.json).toHaveBeenCalledWith({ success: true, alerts: sampleList })
  })
})
