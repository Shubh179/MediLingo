/**
 * Send appointment confirmation email
 * @param details Appointment details: { name, email, phone, date, time, specialty, notes }
 * @returns Promise<boolean> - true if sent successfully
 */
export const sendAppointmentConfirmation = async (details: {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  specialty: string;
  notes?: string;
}): Promise<boolean> => {
  try {
    const { name, email, phone, date, time, specialty, notes } = details;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'MediLingo - Appointment Confirmation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
            <h2 style="color: #2563eb; margin-bottom: 20px;">Appointment Confirmed</h2>
            <p style="color: #333;">Dear <b>${name}</b>,</p>
            <p style="color: #666; margin-bottom: 20px;">
              Your appointment has been successfully booked. Here are your details:
            </p>
            <ul style="color: #444; font-size: 15px; line-height: 1.7;">
              <li><b>Date:</b> ${date}</li>
              <li><b>Time:</b> ${time}</li>
              <li><b>Specialty:</b> ${specialty}</li>
              <li><b>Phone:</b> ${phone}</li>
              ${notes ? `<li><b>Notes:</b> ${notes}</li>` : ''}
            </ul>
            <p style="color: #2563eb; font-weight: bold; margin-top: 24px;">Please be available at the scheduled time. Our team will contact you if any further information is needed.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">© 2025 MediLingo. All rights reserved.</p>
          </div>
        </div>
      `,
    };
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Appointment confirmation sent to ${email}. Message ID: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to send appointment confirmation to ${details.email}:`, error.message);
    return false;
  }
};
/**
 * Email Service - Handles sending OTP and welcome emails using Nodemailer
 * Configured with Gmail SMTP
 */

import nodemailer from 'nodemailer';

// Create transporter for Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App password for Gmail (not regular password)
  },
});

/**
 * Generate a random 6-digit OTP
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP email to user
 * @param email User's email address
 * @param otp OTP code to send
 * @returns Promise<boolean> - true if sent successfully
 */
export const sendOTPEmail = async (email: string, otp: string): Promise<boolean> => {
  try {
    console.log(`📧 Sending OTP Email to: ${email}`);
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'MediLingo - Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
            <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
            
            <p style="color: #666; margin-bottom: 20px;">
              We received a request to reset your MediLingo account password. 
              Use the OTP code below to proceed with the password reset.
            </p>
            
            <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #999; font-size: 12px; margin: 0;">Your OTP Code:</p>
              <p style="font-size: 32px; font-weight: bold; color: #16a34a; letter-spacing: 5px; margin: 10px 0;">
                ${otp}
              </p>
            </div>
            
            <p style="color: #999; font-size: 14px; margin: 20px 0;">
              ⏱️ This OTP is valid for <strong>10 minutes</strong> only.
            </p>
            
            <p style="color: #999; font-size: 14px; margin: 20px 0;">
              If you didn't request a password reset, please ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            
            <p style="color: #999; font-size: 12px;">
              © 2025 MediLingo. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ OTP Email sent successfully to ${email}. Message ID: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to send OTP email to ${email}:`, error.message);
    return false;
  }
};

/**
 * Send welcome email to new user
 * @param email User's email address
 * @param name User's name
 * @returns Promise<boolean> - true if sent successfully
 */
export const sendWelcomeEmail = async (email: string, name: string): Promise<boolean> => {
  try {
    console.log(`🎉 Sending Welcome Email to: ${email}`);
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to MediLingo - Your Health Companion',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
            <h2 style="color: #333; margin-bottom: 20px;">Welcome to MediLingo, ${name}! 👋</h2>
            
            <p style="color: #666; margin-bottom: 20px;">
              Thank you for creating your account. We're excited to help you manage your health with MediLingo!
            </p>
            
            <h3 style="color: #333; margin-top: 20px;">Getting Started:</h3>
            <ul style="color: #666; line-height: 1.8;">
              <li>📱 Scan prescriptions for instant analysis</li>
              <li>💊 Manage your medications and reminders</li>
              <li>🏥 Find nearby hospitals and pharmacies</li>
              <li>🗣️ Chat with our AI health assistant</li>
              <li>💰 Compare medicine prices</li>
            </ul>
            
            <div style="background-color: #16a34a; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'https://medilingo.app'}" style="color: white; text-decoration: none; font-size: 16px; font-weight: bold;">
                Start Using MediLingo →
              </a>
            </div>
            
            <p style="color: #999; font-size: 14px; margin: 20px 0;">
              If you have any questions, feel free to contact our support team.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            
            <p style="color: #999; font-size: 12px;">
              © 2025 MediLingo. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome Email sent successfully to ${email}. Message ID: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to send welcome email to ${email}:`, error.message);
    return false;
  }
};
