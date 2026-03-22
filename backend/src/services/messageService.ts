import prisma from '../config/db';

export interface CreateMessageData {
    patient_id: string;
    doctor_id?: string;
    sender_role: 'patient' | 'doctor';
    content: string;
}

export const sendMessage = async (data: CreateMessageData) => {
    return await prisma.message.create({
        data: {
            patientId: data.patient_id,
            doctorId: data.doctor_id,
            senderRole: data.sender_role,
            content: data.content
        }
    });
};

export const getConversation = async (patientId: string) => {
    return await prisma.message.findMany({
        where: { patientId },
        orderBy: { createdAt: 'asc' }
    });
};

export const getDoctorConversations = async (doctorId: string) => {
    return await prisma.message.findMany({
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

export const markAsRead = async (messageIds: string[]) => {
    await prisma.message.updateMany({
        where: { id: { in: messageIds } },
        data: { isRead: true }
    });
};
