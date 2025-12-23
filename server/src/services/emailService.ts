/**
 * Email Service - Handles sending OTP and welcome emails
 * NOTE: This is a stub. Configure with your email provider (Gmail, SendGrid, etc.)
 */

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
    console.log(`📧 OTP Email would be sent to: ${email}`);
    console.log(`   OTP Code: ${otp}`);
    console.log(`   Valid for: 10 minutes`);
    
    // TODO: Integrate with email provider (Gmail, SendGrid, NodeMailer, etc.)
    // Example with nodemailer:
    // const transporter = nodemailer.createTransport({...});
    // await transporter.sendMail({
    //   to: email,
    //   subject: 'MediLingo - Reset Password OTP',
    //   html: `Your OTP code is: ${otp}`
    // });
    
    return true;
  } catch (error) {
    console.error('Failed to send OTP email:', error);
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
    console.log(`🎉 Welcome Email would be sent to: ${email}`);
    console.log(`   User Name: ${name}`);
    console.log(`   Subject: Welcome to MediLingo!`);
    
    // TODO: Integrate with email provider
    // Example with nodemailer:
    // const transporter = nodemailer.createTransport({...});
    // await transporter.sendMail({
    //   to: email,
    //   subject: 'Welcome to MediLingo!',
    //   html: `Welcome ${name}! Start managing your health with MediLingo.`
    // });
    
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
};
