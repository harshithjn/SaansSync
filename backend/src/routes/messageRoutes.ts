import express from 'express';
import * as messageController from '../controllers/messageController';

const router = express.Router();

router.post('/send', messageController.send);
router.get('/patient/:patientId', messageController.getPatientMessages);
router.get('/doctor/threads', messageController.getDoctorThreads);

export default router;
