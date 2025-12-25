import { Request, Response } from 'express';
import { sendAppointmentConfirmation } from '../services/emailService';

export const bookAppointment = async (req: Request, res: Response) => {
  console.log('📥 Received appointment booking request:', req.body);
  try {
    const { name, email, phone, date, time, specialty, notes } = req.body;
    if (!name || !email || !phone || !date || !time || !specialty) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    await sendAppointmentConfirmation({ name, email, phone, date, time, specialty, notes });
    return res.json({ success: true, message: 'Appointment booked and confirmation email sent.' });
  } catch (err) {
    console.error('❌ Error in bookAppointment:', err);
    return res.status(500).json({ success: false, message: 'Failed to book appointment', error: err?.toString() });
  }
};