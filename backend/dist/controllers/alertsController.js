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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAlert = createAlert;
exports.evaluateAlert = evaluateAlert;
exports.getAlerts = getAlerts;
exports.acknowledgeAlert = acknowledgeAlert;
const zod_1 = require("zod");
const alertsService = __importStar(require("../services/alertsService")); // DAO
const alertEvaluationService = __importStar(require("../services/alertService")); // Complex Logic
const db_1 = __importDefault(require("../config/db"));
const alertSchema = zod_1.z.object({
    patient_id: zod_1.z.string().uuid(),
    doctor_id: zod_1.z.string().uuid(),
    level: zod_1.z.string(),
    reason_text: zod_1.z.string().min(1, 'Reason is required'),
    disease_type: zod_1.z.string(),
    alert_data: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional()
});
const evaluateSchema = zod_1.z.object({
    diseaseType: zod_1.z.string(),
    submission: zod_1.z.any() // Full Log object
});
async function createAlert(req, res) {
    try {
        const validated = alertSchema.parse(req.body);
        const inserted = await alertsService.insertAlert(validated);
        res.json({ success: true, alert: inserted });
    }
    catch (err) {
        console.error('createAlert error', err);
        const message = err?.message || 'Failed to create alert';
        res.status(500).json({ success: false, error: message });
    }
}
async function evaluateAlert(req, res) {
    try {
        const patientId = req.params.patientId;
        const { diseaseType, submission } = evaluateSchema.parse(req.body);
        // Ensure patientId in submission matches params
        submission.patientId = patientId;
        submission.diseaseType = diseaseType;
        const result = await alertEvaluationService.evaluateAndStoreAlert(patientId, diseaseType, submission);
        res.json({ success: true, evaluation: result });
    }
    catch (err) {
        console.error('evaluateAlert error', err);
        res.status(500).json({ success: false, error: err?.message || 'Failed to evaluate alert' });
    }
}
async function getAlerts(req, res) {
    try {
        const doctorId = req.query.doctorId || (req.body && req.body.doctorId);
        const patientId = req.query.patientId || (req.body && req.body.patientId);
        if (!doctorId && !patientId) {
            return res.status(400).json({ success: false, error: 'doctorId or patientId required' });
        }
        if (doctorId) {
            const alerts = await alertsService.getAlertsByDoctor(doctorId);
            return res.json({ success: true, alerts });
        }
        const alerts = await alertsService.getAlertsByPatient(patientId);
        return res.json({ success: true, alerts });
    }
    catch (err) {
        console.error('getAlerts error', err);
        res.status(500).json({ success: false, error: err?.message || 'Failed to fetch alerts' });
    }
}
async function acknowledgeAlert(req, res) {
    try {
        const alertId = req.params.alertId;
        // Using service for consistency or direct DB
        // Simple enough for direct DB or service call? 
        // Let's use service if available, but alertsService doesn't have it explicitly yet?
        // The previous file content had logic inline. Let's keep it but clean import.
        await db_1.default.alert.update({
            where: { id: alertId },
            data: {
                acknowledged: true,
                acknowledgedAt: new Date()
            }
        });
        return res.json({ success: true });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err?.message || 'Failed to acknowledge alert' });
    }
}
exports.default = {
    createAlert,
    evaluateAlert,
    getAlerts,
    acknowledgeAlert
};
//# sourceMappingURL=alertsController.js.map