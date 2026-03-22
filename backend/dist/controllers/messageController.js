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
exports.getDoctorThreads = exports.getPatientMessages = exports.send = void 0;
const messageService = __importStar(require("../services/messageService"));
const send = async (req, res) => {
    try {
        console.log('Controller received message data:', JSON.stringify(req.body, null, 2));
        const message = await messageService.sendMessage(req.body);
        res.status(201).json(message);
    }
    catch (error) {
        console.error('Error in messageController.send:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.send = send;
const getPatientMessages = async (req, res) => {
    try {
        const { patientId } = req.params;
        const messages = await messageService.getConversation(patientId);
        res.json(messages);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getPatientMessages = getPatientMessages;
const getDoctorThreads = async (req, res) => {
    try {
        // In a real app, we get doctor ID from auth token
        const doctorId = req.query.doctorId;
        const threads = await messageService.getDoctorConversations(doctorId);
        res.json(threads);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getDoctorThreads = getDoctorThreads;
//# sourceMappingURL=messageController.js.map