import { Router } from 'express';
import { bookAppointment } from '../controllers/appointmentController';

const router = Router();

router.post('/book', bookAppointment);

export default router;
