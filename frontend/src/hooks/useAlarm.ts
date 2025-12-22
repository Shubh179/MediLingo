import { useRef } from 'react';

interface AlarmHandle {
  id: number;
  time: number; // ms timestamp
  title: string;
  body: string;
}

export const useAlarm = () => {
  const timers = useRef<AlarmHandle[]>([]);

  const requestPermission = async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  };

  const schedule = async (at: Date, title: string, body: string) => {
    const ok = await requestPermission();
    if (!ok) return false;
    const delay = Math.max(0, at.getTime() - Date.now());
    const id = window.setTimeout(() => {
      try {
        new Notification(title, { body });
      } catch {
        // ignore
      }
    }, delay);
    timers.current.push({ id, time: at.getTime(), title, body });
    return true;
  };

  const cancelAll = () => {
    timers.current.forEach((t) => clearTimeout(t.id));
    timers.current = [];
  };

  return { schedule, cancelAll };
};
