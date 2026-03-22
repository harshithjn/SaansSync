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
exports.createLog = createLog;
const logsService = __importStar(require("../services/logsService"));
async function createLog(req, res) {
    try {
        const { patientId, diseaseType, commonData, diseaseSpecificData } = req.body;
        if (!patientId || !diseaseType) {
            return res.status(400).json({ success: false, error: 'patientId and diseaseType required' });
        }
        const result = await logsService.createDailyLog({
            patientId,
            diseaseType,
            commonData,
            diseaseSpecificData
        });
        return res.json({ success: true, logEntry: result.logEntry, alert: result.alert, score: result.score });
    }
    catch (err) {
        console.error('CRITICAL LOG ERROR:', err);
        return res.status(500).json({ success: false, error: err?.message || 'Failed to create log' });
    }
}
//# sourceMappingURL=logsController.js.map