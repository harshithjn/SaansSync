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
exports.createPatient = createPatient;
exports.getPatient = getPatient;
exports.updatePatient = updatePatient;
exports.getPatientLogs = getPatientLogs;
exports.getPatientMedications = getPatientMedications;
exports.canLogToday = canLogToday;
exports.getPatientReports = getPatientReports;
exports.getPatientInstructions = getPatientInstructions;
exports.addPatientInstruction = addPatientInstruction;
const patientService = __importStar(require("../services/patientService"));
async function createPatient(req, res) {
    try {
        const { email, password, fullName, diseaseType, doctorId, patientData } = req.body;
        if (!email || !fullName || !diseaseType) {
            return res.status(400).json({ success: false, error: 'email, fullName, diseaseType required' });
        }
        const profile = await patientService.createPatient({ email, password, fullName, diseaseType, doctorId, patientData });
        return res.json({ success: true, profile });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err?.message || 'Failed to create patient' });
    }
}
async function getPatient(req, res) {
    try {
        const patientId = req.params.patientId;
        const data = await patientService.getPatientById(patientId);
        return res.json(data);
    }
    catch (err) {
        return res.status(404).json({ error: err?.message || 'Patient not found' });
    }
}
async function updatePatient(req, res) {
    try {
        const patientId = req.params.patientId;
        const { full_name, patient_data } = req.body;
        await patientService.updatePatient(patientId, { full_name, patient_data });
        return res.json({ success: true });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err?.message || 'Failed to update patient' });
    }
}
async function getPatientLogs(req, res) {
    try {
        const patientId = req.params.patientId;
        const data = await patientService.getPatientLogs(patientId);
        return res.json(data);
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch logs' });
    }
}
async function getPatientMedications(req, res) {
    try {
        const patientId = req.params.patientId;
        const data = await patientService.getPatientMedications(patientId);
        return res.json(data);
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch medications' });
    }
}
async function canLogToday(req, res) {
    try {
        const patientId = req.params.patientId;
        const canLog = await patientService.canLogToday(patientId);
        return res.json({ canLog });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err?.message || 'Failed to check logging' });
    }
}
async function getPatientReports(req, res) {
    try {
        const patientId = req.params.patientId;
        const data = await patientService.getPatientReports(patientId);
        return res.json(data);
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch reports' });
    }
}
async function getPatientInstructions(req, res) {
    try {
        const patientId = req.params.patientId;
        const data = await patientService.getPatientInstructions(patientId);
        return res.json(data);
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch instructions' });
    }
}
async function addPatientInstruction(req, res) {
    try {
        const patientId = req.params.patientId;
        const { doctorId, instruction } = req.body;
        if (!doctorId || !instruction) {
            return res.status(400).json({ success: false, error: 'doctorId and instruction required' });
        }
        const data = await patientService.addPatientInstruction(patientId, doctorId, instruction);
        return res.json({ success: true, instruction: data });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err?.message || 'Failed to add instruction' });
    }
}
//# sourceMappingURL=patientController.js.map