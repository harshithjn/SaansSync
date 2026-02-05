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
exports.getDoctorPatients = getDoctorPatients;
exports.getDoctorLogs = getDoctorLogs;
exports.getDoctorAlerts = getDoctorAlerts;
exports.assignPatient = assignPatient;
exports.upsertPatientFolder = upsertPatientFolder;
exports.getPatientFolders = getPatientFolders;
exports.updatePatientFolder = updatePatientFolder;
exports.deletePatientFolder = deletePatientFolder;
exports.createDoctorProfile = createDoctorProfile;
const doctorService = __importStar(require("../services/doctorService"));
async function getDoctorPatients(req, res) {
    try {
        const doctorId = req.params.doctorId;
        const data = await doctorService.getDoctorPatients(doctorId);
        return res.json(data);
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch patients' });
    }
}
async function getDoctorLogs(req, res) {
    try {
        const doctorId = req.params.doctorId;
        const data = await doctorService.getDoctorLogs(doctorId);
        return res.json(data);
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch logs' });
    }
}
async function getDoctorAlerts(req, res) {
    try {
        const doctorId = req.params.doctorId;
        const data = await doctorService.getDoctorAlerts(doctorId);
        return res.json(data);
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch alerts' });
    }
}
async function assignPatient(req, res) {
    try {
        const doctorId = req.params.doctorId;
        const { patientId, diseaseType } = req.body;
        if (!patientId)
            return res.status(400).json({ success: false, error: 'patientId required' });
        await doctorService.assignPatientToDoctor(doctorId, patientId, diseaseType);
        return res.json({ success: true });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err?.message || 'Failed to assign patient' });
    }
}
async function upsertPatientFolder(req, res) {
    try {
        const doctorId = req.params.doctorId;
        const { patientId, fullName, age, diseaseType, lastLogDate, folderColor, redFlagScore, alertCount } = req.body;
        if (!patientId)
            return res.status(400).json({ success: false, error: 'patientId required' });
        const data = await doctorService.upsertPatientFolder({
            patientId,
            doctorId,
            fullName,
            age: Number(age || 0),
            diseaseType,
            lastLogDate,
            folderColor,
            redFlagScore: Number(redFlagScore || 0),
            alertCount: Number(alertCount || 0)
        });
        return res.json(data);
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err?.message || 'Failed to upsert patient folder' });
    }
}
async function getPatientFolders(req, res) {
    try {
        const doctorId = req.params.doctorId;
        const data = await doctorService.getPatientFolders(doctorId);
        return res.json(data);
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch patient folders' });
    }
}
async function updatePatientFolder(req, res) {
    try {
        const doctorId = req.params.doctorId;
        const patientId = req.params.patientId;
        const { redFlagScore, alertCount, folderColor } = req.body;
        await doctorService.updatePatientFolder(doctorId, patientId, { redFlagScore, alertCount, folderColor });
        return res.json({ success: true });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err?.message || 'Failed to update patient folder' });
    }
}
async function deletePatientFolder(req, res) {
    try {
        const doctorId = req.params.doctorId;
        const patientId = req.params.patientId;
        await doctorService.deletePatientFolder(doctorId, patientId);
        return res.json({ success: true });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err?.message || 'Failed to delete patient folder' });
    }
}
async function createDoctorProfile(req, res) {
    try {
        const { fullName, email, phone } = req.body;
        if (!fullName)
            return res.status(400).json({ success: false, error: 'fullName required' });
        if (!req.user?.id)
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        const data = await doctorService.createDoctorProfile(req.user.id, { fullName, email, phone });
        return res.json({ success: true, profile: data });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err?.message || 'Failed to create doctor profile' });
    }
}
//# sourceMappingURL=doctorController.js.map