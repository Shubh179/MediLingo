import { Request, Response } from 'express';
import { User } from '../models/User';

// GET /api/share/code - Return current user's sharing code (female only)
export const getSharingCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      console.log('❌ No userId in session for getSharingCode');
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      console.warn(`❌ User ${userId} not found`);
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (user.gender !== 'Female') {
      console.log(`⚠️ User ${userId} is not female (gender: ${user.gender})`);
      res.status(403).json({ success: false, message: 'Sharing code available only for female users' });
      return;
    }

    // Ensure code exists (pre-save hook should create it; fallback here if missing)
    if (!user.sharingCode) {
      console.log(`📝 Generating missing sharingCode for female user ${userId}`);
      await user.save();
    }

    console.log(`✅ Returning sharing code for female user ${userId}: ${user.sharingCode}`);
    res.status(200).json({ success: true, sharingCode: user.sharingCode });
  } catch (error: any) {
    console.error('❌ Get sharing code error:', error);
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
      console.log('❌ No userId in session for getSharedProfiles');
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    console.log(`📋 Fetching shared profiles for user ${userId}`);
    
    const currentUser = await User.findById(userId).populate({
      path: 'sharedAccessList',
      select: 'name age email gender',
    });

    if (!currentUser) {
      console.warn(`❌ User ${userId} not found`);
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

    console.log(`✅ Found ${profiles.length} shared profiles for user ${userId}`);
    res.status(200).json({ success: true, profiles });
  } catch (error: any) {
    console.error('❌ Get shared profiles error:', error);
    res.status(500).json({ success: false, message: 'Error fetching shared profiles', error: error.message });
  }
};

// POST /api/share/regenerate-code - Regenerate a new unique sharing code (female only)
export const regenerateSharingCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      console.log('❌ No userId in session for regenerateSharingCode');
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      console.warn(`❌ User ${userId} not found`);
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (user.gender !== 'Female') {
      console.log(`⚠️ User ${userId} is not female, cannot regenerate code`);
      res.status(403).json({ success: false, message: 'Sharing code regeneration available only for female users' });
      return;
    }

    const oldCode = user.sharingCode;
    
    // Clear the code and trigger regeneration on save
    user.sharingCode = undefined;
    await user.save(); // This will trigger the pre-save hook to generate a new unique code
    
    // Fetch the updated user to get the new code
    const updatedUser = await User.findById(userId);
    
    console.log(`✅ Regenerated sharing code for female user ${userId}: ${oldCode} → ${updatedUser?.sharingCode}`);
    res.status(200).json({ 
      success: true, 
      sharingCode: updatedUser?.sharingCode,
      message: 'Sharing code regenerated successfully. Previous code is now invalid.' 
    });
  } catch (error: any) {
    console.error('❌ Regenerate sharing code error:', error);
    res.status(500).json({ success: false, message: 'Error regenerating sharing code', error: error.message });
  }
};
