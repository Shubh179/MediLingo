import { Request, Response } from 'express';
import { User } from '../models/User';

// GET /api/share/code - Return current user's sharing code (female only)
export const getSharingCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (user.gender !== 'Female') {
      res.status(403).json({ success: false, message: 'Sharing code available only for female users' });
      return;
    }

    // Ensure code exists (pre-save hook should create it; fallback here if missing)
    if (!user.sharingCode) {
      await user.save();
    }

    res.status(200).json({ success: true, sharingCode: user.sharingCode });
  } catch (error: any) {
    console.error('Get sharing code error:', error);
    res.status(500).json({ success: false, message: 'Error retrieving sharing code', error: error.message });
  }
};

// POST /api/share/access - Redeem a code to gain access (male user links to female profile)
export const redeemAccessCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { sharingCode } = req.body as { sharingCode?: string };
    if (!sharingCode) {
      res.status(400).json({ success: false, message: 'Sharing code is required' });
      return;
    }

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Find female user by code
    const femaleUser = await User.findOne({ sharingCode, gender: 'Female' });
    if (!femaleUser) {
      res.status(404).json({ success: false, message: 'Invalid code or user not eligible' });
      return;
    }

    // Prevent self-linking
    if (String(femaleUser._id) === String(currentUser._id)) {
      res.status(400).json({ success: false, message: 'You cannot link your own code' });
      return;
    }

    // Add to sharedAccessList if not already present
    const hasAccess = (currentUser.sharedAccessList || []).some(id => String(id) === String(femaleUser._id));
    if (!hasAccess) {
      currentUser.sharedAccessList = [...(currentUser.sharedAccessList || []), femaleUser._id as any];
      await currentUser.save();
    }

    res.status(200).json({ success: true, message: 'Access granted', sharedUser: { id: femaleUser._id, name: femaleUser.name, age: femaleUser.age } });
  } catch (error: any) {
    console.error('Redeem sharing code error:', error);
    res.status(500).json({ success: false, message: 'Error redeeming code', error: error.message });
  }
};

// GET /api/share/profiles - List of female profiles the current user can access
export const getSharedProfiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const currentUser = await User.findById(userId).populate({
      path: 'sharedAccessList',
      select: 'name age email gender',
    });

    if (!currentUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const profiles = (currentUser.sharedAccessList || []).map((u: any) => ({
      id: u._id,
      name: u.name,
      age: u.age,
      email: u.email,
      gender: u.gender,
    }));

    res.status(200).json({ success: true, profiles });
  } catch (error: any) {
    console.error('Get shared profiles error:', error);
    res.status(500).json({ success: false, message: 'Error fetching shared profiles', error: error.message });
  }
};
