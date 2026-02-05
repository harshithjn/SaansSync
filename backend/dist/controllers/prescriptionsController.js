"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPrescription = createPrescription;
exports.listPrescriptions = listPrescriptions;
const prescriptionsService = __importStar(require("../services/prescriptionsService"));
async function createPrescription(req, res) {
    try {
        const { patient_id, doctor_id, patient_name, doctor_name } = req.body;
        if (!patient_id || !doctor_id || !patient_name || !doctor_name) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }
        const inserted = await prescriptionsService.insertPrescription(req.body);
        res.json({ success: true, prescription: inserted });
    }
    catch (err) {
        console.error('createPrescription error', err);
        res.status(500).json({ success: false, error: err?.message || 'Failed to create prescription' });
    }
}
async function listPrescriptions(req, res) {
    try {
        const patientId = req.query.patientId;
        const doctorId = req.query.doctorId;
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        if (!patientId && !doctorId)
            return res.status(400).json({ success: false, error: 'patientId or doctorId required' });
        const prescriptions = await prescriptionsService.getPrescriptions({ patientId, doctorId, startDate, endDate });
        res.json({ success: true, prescriptions });
    }
    catch (err) {
        console.error('listPrescriptions error', err);
        res.status(500).json({ success: false, error: err?.message || 'Failed to fetch prescriptions' });
    }
}
exports.default = { createPrescription, listPrescriptions };
//# sourceMappingURL=prescriptionsController.js.map