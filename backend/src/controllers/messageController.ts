import { Request, Response } from 'express';
import * as messageService from '../services/messageService';

export const send = async (req: Request, res: Response) => {
    try {
        console.log('Controller received message data:', JSON.stringify(req.body, null, 2));
        const message = await messageService.sendMessage(req.body);
        res.status(201).json(message);
    } catch (error: any) {
        console.error('Error in messageController.send:', error);
        res.status(500).json({ error: error.message });
    }
};

export const getPatientMessages = async (req: Request, res: Response) => {
    try {
        const { patientId } = req.params;
        const messages = await messageService.getConversation(patientId);
        res.json(messages);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getDoctorThreads = async (req: Request, res: Response) => {
    try {

        const doctorId = req.query.doctorId as string;
        const threads = await messageService.getDoctorConversations(doctorId);
        res.json(threads);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
