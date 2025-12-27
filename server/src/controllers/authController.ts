import { Request, Response } from 'express';
import { User, IUser } from '../models/User';
import { generateOTP, sendOTPEmail, sendWelcomeEmail } from '../services/emailService';

// Extend Express Request to include session
declare global {
  namespace Express {
    interface Request {
      session?: any;
    }
  }
}

/**
 * SIGNUP - Register a new user
 * Required fields: email, password, age
 */
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, age, name } = req.body;

    // Validation
    if (!email || !password || !age) {
      res.status(400).json({
        success: false,
        message: 'Email, password, and age are required',
      });
      return;
    }

    // Email validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
      return;
    }

    // Password validation (minimum 6 characters)
    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
      return;
    }

    // Age validation
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 150) {
      res.status(400).json({
        success: false,
        message: 'Age must be between 1 and 150',
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'Email already registered. Please login or use a different email.',
      });
      return;
    }

    // Create new user
    const newUser = new User({
      name: name || email.split('@')[0], // Use email prefix as default name
      email: email.toLowerCase(),
      password,
      age: ageNum,
      languagePreference: 'English',
      tier: 'Free',
    });

    // Save user (password will be hashed by pre-save hook)
    await newUser.save();

    // Send welcome email
    await sendWelcomeEmail(newUser.email, newUser.name);

    // Create session
    (req.session as any).userId = newUser._id;
    (req.session as any).email = newUser.email;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        age: newUser.age,
      },
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during signup. Please try again.',
      error: error.message,
    });
  }
};

/**
 * LOGIN - Authenticate existing user
 * Required fields: email, password
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
      return;
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Create session
    (req.session as any).userId = user._id;
    (req.session as any).email = user.email;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        age: user.age,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login. Please try again.',
      error: error.message,
    });
  }
};

/**
 * FORGOT PASSWORD - Send OTP to user's email
 * Required fields: email
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required',
      });
      return;
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists for security
      res.status(200).json({
        success: true,
        message: 'If this email is registered, you will receive an OTP shortly',
      });
      return;
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 10); // OTP valid for 10 minutes

    // Save OTP to database
    user.otpCode = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP email
    const emailSent = await sendOTPEmail(user.email, otp);

    if (!emailSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again later.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email. Valid for 10 minutes.',
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing forgot password request',
      error: error.message,
    });
  }
};

/**
 * RESET PASSWORD - Verify OTP and update password
 * Required fields: email, otp, newPassword
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;

    // Validation
    if (!email || !otp || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required',
      });
      return;
    }

    // Password validation
    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
      return;
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or OTP',
      });
      return;
    }

    // Check if OTP exists
    if (!user.otpCode || !user.otpExpires) {
      res.status(401).json({
        success: false,
        message: 'No OTP request found. Please request a new one.',
      });
      return;
    }

    // Verify OTP
    if (user.otpCode !== otp) {
      res.status(401).json({
        success: false,
        message: 'Invalid OTP',
      });
      return;
    }

    // Check OTP expiration
    const currentTime = new Date();
    if (currentTime > user.otpExpires) {
      res.status(401).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      });
      return;
    }

    // Update password
    user.password = newPassword;
    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message,
    });
  }
};

/**
 * LOGOUT - Destroy user session
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Destroy session
    req.session.destroy((err: any) => {
      if (err) {
        res.status(500).json({
          success: false,
          message: 'Error during logout',
          error: err.message,
        });
        return;
      }

      // Clear session cookie
      res.clearCookie('medilingo_session');

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during logout',
      error: error.message,
    });
  }
};

/**
 * GET PROFILE - Retrieve current user's profile (protected route)
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.session as any).userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated. Please login first.',
      });
      return;
    }

    const user = await User.findById(userId).select('-password -otpCode -otpExpires');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving profile',
      error: error.message,
    });
  }
};

/**
 * UPDATE PROFILE - Update current user's name and age (protected route)
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.session as any).userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Not authenticated. Please login first.' });
      return;
    }

    const { name, age } = req.body as { name?: string; age?: number };

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ success: false, message: 'Valid name is required' });
      return;
    }

    const ageNum = Number(age);
    if (!ageNum || isNaN(ageNum) || ageNum < 1 || ageNum > 150) {
      res.status(400).json({ success: false, message: 'Age must be between 1 and 150' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    user.name = name.trim();
    user.age = ageNum;
    await user.save();

    const safeUser = await User.findById(userId).select('-password -otpCode -otpExpires');

    res.status(200).json({ success: true, message: 'Profile updated successfully', user: safeUser });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Error updating profile', error: error.message });
  }
};

/**
 * CHANGE PASSWORD - Update password after verifying current password (protected route)
 */
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.session as any).userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Not authenticated. Please login first.' });
      return;
    }

    const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };

    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Current password and new password are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      res.status(401).json({ success: false, message: 'Current password is incorrect' });
      return;
    }

    user.password = newPassword; // hashed by pre-save hook
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Error changing password', error: error.message });
  }
};
