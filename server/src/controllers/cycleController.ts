import { Request, Response } from 'express';
import { MenstrualCycle } from '../models/MenstrualCycle';
import { User } from '../models/User';

function getAuthUserId(req: Request): string | null {
  const id = (req.session as any)?.userId;
  return id ? String(id) : null;
}

export const getMyCycle = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) { res.status(401).json({ success: false, message: 'Not authenticated' }); return; }

    const user = await User.findById(userId);
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }

    const cycle = await MenstrualCycle.findOne({ user: userId });
    res.status(200).json({ success: true, cycle });
  } catch (e: any) {
    console.error('getMyCycle error', e);
    res.status(500).json({ success: false, message: 'Error fetching cycle', error: e.message });
  }
};

export const updateMyCycle = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) { res.status(401).json({ success: false, message: 'Not authenticated' }); return; }

    const user = await User.findById(userId);
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }

    // Only female users can edit their cycle
    if (user.gender !== 'Female') {
      res.status(403).json({ success: false, message: 'Only female users can update cycle data' });
      return;
    }

    const { periodDuration, cycleLength, lastPeriodStart } = req.body as { periodDuration?: number; cycleLength?: number; lastPeriodStart?: string | Date | null };

    const upd: any = {};
    if (periodDuration !== undefined) {
      const v = Number(periodDuration);
      if (isNaN(v) || v < 1 || v > 15) { res.status(400).json({ success: false, message: 'periodDuration must be 1-15' }); return; }
      upd['settings.periodDuration'] = v;
    }
    if (cycleLength !== undefined) {
      const v = Number(cycleLength);
      if (isNaN(v) || v < 18 || v > 45) { res.status(400).json({ success: false, message: 'cycleLength must be 18-45' }); return; }
      upd['settings.cycleLength'] = v;
    }
    if (lastPeriodStart !== undefined) {
      upd['settings.lastPeriodStart'] = lastPeriodStart ? new Date(lastPeriodStart) : null;
    }

    const cycle = await MenstrualCycle.findOneAndUpdate(
      { user: userId },
      { $setOnInsert: { user: userId }, $set: upd },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, cycle });
  } catch (e: any) {
    console.error('updateMyCycle error', e);
    res.status(500).json({ success: false, message: 'Error updating cycle', error: e.message });
  }
};

export const addSymptomLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) { res.status(401).json({ success: false, message: 'Not authenticated' }); return; }

    const user = await User.findById(userId);
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    if (user.gender !== 'Female') { res.status(403).json({ success: false, message: 'Only female users can add symptom logs' }); return; }

    const { date, symptoms, notes } = req.body as { date?: string | Date; symptoms?: string[]; notes?: string };
    if (!date) { res.status(400).json({ success: false, message: 'date is required' }); return; }

    const log = { date: new Date(date), symptoms: Array.isArray(symptoms) ? symptoms : [], notes };

    const cycle = await MenstrualCycle.findOneAndUpdate(
      { user: userId },
      { $setOnInsert: { user: userId }, $push: { symptomLogs: log } },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, cycle });
  } catch (e: any) {
    console.error('addSymptomLog error', e);
    res.status(500).json({ success: false, message: 'Error adding symptom log', error: e.message });
  }
};

export const getSharedCycle = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) { res.status(401).json({ success: false, message: 'Not authenticated' }); return; }

    const targetId = String(req.params.userId);
    const currentUser = await User.findById(userId);
    if (!currentUser) { res.status(404).json({ success: false, message: 'User not found' }); return; }

    // Must have explicit access
    const allowed = (currentUser.sharedAccessList || []).some(id => String(id) === targetId);
    if (!allowed) { res.status(403).json({ success: false, message: 'No access to this profile' }); return; }

    const targetUser = await User.findById(targetId);
    if (!targetUser || targetUser.gender !== 'Female') {
      res.status(404).json({ success: false, message: 'Target profile not found' });
      return;
    }

    const cycle = await MenstrualCycle.findOne({ user: targetId });
    res.status(200).json({ success: true, user: { id: targetUser._id, name: targetUser.name }, cycle });
  } catch (e: any) {
    console.error('getSharedCycle error', e);
    res.status(500).json({ success: false, message: 'Error fetching shared cycle', error: e.message });
  }
};
