interface Reminder {
  id: string;
  medicineName: string;
  dosage: string;
  times: string[];
  frequency: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  isActive: boolean;
  notes?: string;
}

interface ReminderInput {
  medicineName: string;
  dosage: string;
  times: string[];
  frequency: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  isActive: boolean;
  notes?: string;
}

const STORAGE_KEY = 'medilingo_reminders';

export const reminderService = {
  /**
   * Get all reminders from localStorage
   */
  getReminders: (): Reminder[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading reminders:', error);
      return [];
    }
  },

  /**
   * Add a new reminder
   */
  addReminder: (reminder: ReminderInput): Reminder => {
    const newReminder: Reminder = {
      id: `reminder_${Date.now()}`,
      ...reminder,
      startDate: new Date(reminder.startDate),
    };

    const reminders = reminderService.getReminders();
    reminders.push(newReminder);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
      
      // Schedule notification if supported
      reminderService.scheduleNotifications(newReminder);
      
      return newReminder;
    } catch (error) {
      console.error('Error adding reminder:', error);
      return newReminder;
    }
  },

  /**
   * Delete a reminder
   */
  deleteReminder: (reminderId: string): void => {
    const reminders = reminderService.getReminders();
    const filtered = reminders.filter(r => r.id !== reminderId);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  },

  /**
   * Update a reminder
   */
  updateReminder: (reminderId: string, updates: Partial<Reminder>): Reminder | null => {
    const reminders = reminderService.getReminders();
    const index = reminders.findIndex(r => r.id === reminderId);
    
    if (index === -1) return null;
    
    const updated = { ...reminders[index], ...updates };
    reminders[index] = updated;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
      return updated;
    } catch (error) {
      console.error('Error updating reminder:', error);
      return reminders[index];
    }
  },

  /**
   * Get active reminders for today
   */
  getTodayReminders: (): Reminder[] => {
    const reminders = reminderService.getReminders();
    return reminders.filter(r => r.isActive && r.frequency === 'daily');
  },

  /**
   * Request notification permission from user
   */
  requestNotificationPermission: async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
      }
    }

    return false;
  },

  /**
   * Send a notification
   */
  sendNotification: (title: string, options?: NotificationOptions): void => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          icon: '/favicon.ico',
          ...options,
        });
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    }
  },

  /**
   * Schedule notifications for a reminder
   */
  scheduleNotifications: (reminder: Reminder): void => {
    // This is a simple implementation. For production, you might want to use a service worker
    // or a more robust notification scheduling system.
    
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    // Store reminder ID for the interval tracking
    const intervalStorageKey = `reminder_interval_${reminder.id}`;
    const existingInterval = localStorage.getItem(intervalStorageKey);
    if (existingInterval) {
      clearInterval(parseInt(existingInterval));
    }

    // Check and notify at each scheduled time
    const checkAndNotify = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      reminder.times.forEach(time => {
        if (currentTime === time && reminder.isActive) {
          reminderService.sendNotification(
            `💊 Time for ${reminder.medicineName}`,
            {
              body: `Take ${reminder.dosage}`,
              tag: `reminder_${reminder.id}`,
              requireInteraction: true, // Keep notification visible
            }
          );
        }
      });
    };

    // Check every minute for reminder time
    const interval = window.setInterval(() => {
      const reminders = reminderService.getReminders();
      const currentReminder = reminders.find(r => r.id === reminder.id);
      if (currentReminder && currentReminder.isActive) {
        checkAndNotify();
      } else {
        clearInterval(interval);
        localStorage.removeItem(intervalStorageKey);
      }
    }, 60000); // Check every minute

    // Save interval ID for cleanup
    localStorage.setItem(intervalStorageKey, String(interval));
  },

  /**
   * Get reminders for a specific medicine
   */
  getMedicineReminders: (medicineName: string): Reminder[] => {
    const reminders = reminderService.getReminders();
    return reminders.filter(r => r.medicineName.toLowerCase() === medicineName.toLowerCase());
  },

  /**
   * Clear all reminders
   */
  clearAllReminders: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing reminders:', error);
    }
  },

  /**
   * Get statistics about reminders
   */
  getStatistics: () => {
    const reminders = reminderService.getReminders();
    return {
      total: reminders.length,
      active: reminders.filter(r => r.isActive).length,
      inactive: reminders.filter(r => !r.isActive).length,
      medicines: new Set(reminders.map(r => r.medicineName)).size,
    };
  },
};
