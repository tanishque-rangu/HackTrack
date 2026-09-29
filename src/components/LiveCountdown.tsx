import { useState, useEffect } from 'react';
import { differenceInSeconds, parseISO, isPast } from 'date-fns';

export function LiveCountdown({ dateStr }: { dateStr: string | null }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!dateStr) return;

    const date = parseISO(dateStr);
    if (dateStr.length === 10) date.setHours(23, 59, 59); // EOD UTC implicitly handled by local offset for now, but strictly we should use UTC. 
    // To treat as UTC: date = parseISO(`${dateStr}T23:59:59Z`)
    const targetDate = dateStr.length === 10 ? parseISO(`${dateStr}T23:59:59Z`) : date;

    const updateTimer = () => {
      if (isPast(targetDate)) {
        setIsExpired(true);
        setTimeLeft(null);
        return;
      }
      
      const diff = differenceInSeconds(targetDate, new Date());
      const d = Math.floor(diff / (3600 * 24));
      const h = Math.floor((diff % (3600 * 24)) / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      
      setTimeLeft({ d, h, m, s });
      setIsExpired(false);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [dateStr]);

  if (!dateStr) return null;
  
  if (isExpired || !timeLeft) {
    return <span className="text-gray-500 font-black tracking-widest text-sm">EXPIRED</span>;
  }

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="flex items-center gap-1.5 font-mono font-bold tracking-tight">
      {timeLeft.d > 0 && <span className="bg-white/10 px-1.5 py-0.5 rounded-sm">{timeLeft.d}d</span>}
      <span className="bg-white/10 px-1.5 py-0.5 rounded-sm">{pad(timeLeft.h)}h</span>
      <span className="bg-white/10 px-1.5 py-0.5 rounded-sm">{pad(timeLeft.m)}m</span>
      <span className="bg-white/10 px-1.5 py-0.5 rounded-sm text-primaryLight">{pad(timeLeft.s)}s</span>
    </div>
  );
}
