export interface CreateMessageData {
    patient_id: string;
    doctor_id?: string;
    sender_role: 'patient' | 'doctor';
    content: string;
}
export declare const sendMessage: (data: CreateMessageData) => Promise<{
    id: string;
    createdAt: Date;
    doctorId: string | null;
    patientId: string;
    senderRole: string;
    content: string;
    isRead: boolean;
}>;
export declare const getConversation: (patientId: string) => Promise<{
    id: string;
    createdAt: Date;
    doctorId: string | null;
    patientId: string;
    senderRole: string;
    content: string;
    isRead: boolean;
}[]>;
export declare const getDoctorConversations: (doctorId: string) => Promise<({
    patient: {
        id: string;
        fullName: string;
    };
} & {
    id: string;
    createdAt: Date;
    doctorId: string | null;
    patientId: string;
    senderRole: string;
    content: string;
    isRead: boolean;
})[]>;
export declare const markAsRead: (messageIds: string[]) => Promise<void>;
//# sourceMappingURL=messageService.d.ts.map