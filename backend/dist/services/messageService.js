"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAsRead = exports.getDoctorConversations = exports.getConversation = exports.sendMessage = void 0;
const db_1 = __importDefault(require("../config/db"));
const sendMessage = async (data) => {
    return await db_1.default.message.create({
        data: {
            patientId: data.patient_id,
            doctorId: data.doctor_id,
            senderRole: data.sender_role,
            content: data.content
        }
    });
};
exports.sendMessage = sendMessage;
const getConversation = async (patientId) => {
    return await db_1.default.message.findMany({
        where: { patientId },
        orderBy: { createdAt: 'asc' }
    });
};
exports.getConversation = getConversation;
const getDoctorConversations = async (doctorId) => {
    return await db_1.default.message.findMany({
        where: {
            OR: [
                { doctorId },
                { senderRole: 'patient' } // Needs refinement logically, but matching legacy exactly
            ]
        },
        include: {
            patient: { select: { fullName: true, id: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
};
exports.getDoctorConversations = getDoctorConversations;
const markAsRead = async (messageIds) => {
    await db_1.default.message.updateMany({
        where: { id: { in: messageIds } },
        data: { isRead: true }
    });
};
exports.markAsRead = markAsRead;
//# sourceMappingURL=messageService.js.map