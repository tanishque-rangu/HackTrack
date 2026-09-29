import { differenceInHours, parseISO } from 'date-fns';
import type { Hackathon } from '../types';

let permissionGranted = false;

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  
  if (Notification.permission === 'granted') {
    permissionGranted = true;
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    permissionGranted = permission === 'granted';
    return permissionGranted;
  }
  
  return false;
}

const notifiedKey = 'hacktrack_notified_deadlines';

export function checkAndTriggerNotifications(hackathons: Hackathon[]) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const notified = JSON.parse(localStorage.getItem(notifiedKey) || '{}');
  let updated = false;

  const notify = (id: string, title: string, body: string, urgencyId: string) => {
    const key = `${id}_${urgencyId}`;
    if (!notified[key]) {
      new Notification(title, {
        body,
        icon: '/vite.svg', // Assuming vite icon exists, or any icon
        tag: key,
      });
      notified[key] = true;
      updated = true;
    }
  };

  hackathons.forEach(h => {
    const checkDate = (dateStr: string | undefined | null, type: string) => {
      if (!dateStr) return;
      const date = parseISO(dateStr);
      if (dateStr.length === 10) date.setHours(23, 59, 59); // EOD

      const hoursLeft = differenceInHours(date, new Date());
      
      if (hoursLeft <= 6 && hoursLeft > 0) {
        notify(h.id, `EXTREME URGENCY: ${h.name}`, `${type} is due in less than 6 hours!`, `${type}_6h`);
      } else if (hoursLeft <= 48 && hoursLeft > 6) {
        notify(h.id, `CRITICAL URGENCY: ${h.name}`, `${type} is due in less than 48 hours!`, `${type}_48h`);
      } else if (hoursLeft <= 168 && hoursLeft > 48) {
        notify(h.id, `WARNING: ${h.name}`, `${type} is due in less than 7 days.`, `${type}_168h`);
      }
    };

    checkDate(h.registrationDeadline, 'Registration');
    checkDate(h.submissionDeadline, 'Submission');
  });

  if (updated) {
    localStorage.setItem(notifiedKey, JSON.stringify(notified));
  }
}
