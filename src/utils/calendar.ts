import { format, parseISO } from 'date-fns';
import type { Hackathon } from '../types';

export function generateICS(hackathon: Hackathon) {
  // RFC 5545 format
  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HackTrack//Squad Command Center//EN',
    'CALSCALE:GREGORIAN',
  ];

  const now = format(new Date(), "yyyyMMdd'T'HHmmss'Z'");

  const addEvent = (title: string, dateStr: string, description: string, url: string) => {
    // Treat dateStr (YYYY-MM-DD) as UTC end-of-day for deadlines if time isn't specified
    const dt = dateStr.length === 10 ? dateStr.replace(/-/g, '') + 'T235959Z' : format(parseISO(dateStr), "yyyyMMdd'T'HHmmss'Z'");
    
    ics.push(
      'BEGIN:VEVENT',
      `UID:${title.replace(/\s+/g, '')}-${dt}@hacktrack`,
      `DTSTAMP:${now}`,
      `DTSTART:${dt}`,
      `DTEND:${dt}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `URL:${url}`,
      'END:VEVENT'
    );
  };

  if (hackathon.registrationDeadline) {
    addEvent(
      `[HackTrack] Registration Deadline: ${hackathon.name}`, 
      hackathon.registrationDeadline, 
      `Registration closes today for ${hackathon.name}. Ensure all squad members are registered!`,
      hackathon.registrationLink
    );
  }

  if (hackathon.submissionDeadline) {
    addEvent(
      `[HackTrack] Submission Deadline: ${hackathon.name}`, 
      hackathon.submissionDeadline, 
      `Final submission is due for ${hackathon.name}. Double check the checklist!`,
      hackathon.submissionLink
    );
  }

  ics.push('END:VCALENDAR');

  const blob = new Blob([ics.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `hacktrack-${hackathon.id}-deadlines.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
