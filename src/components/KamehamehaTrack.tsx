import { useState, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNow } from '../hooks/useNow';
import { getBeamPhase } from '../utils/beamLogic';
import type { BeamPhase } from '../utils/beamLogic';
import { formatDistanceToNowStrict, format } from 'date-fns';
import { Target, CheckCircle, XCircle } from 'lucide-react';
import { useTheme } from '../theme/ThemeProvider';

export interface KamehamehaTrackProps {
  label: string;
  startTime: number;
  deadline: number;
  completed: boolean;
  compact?: boolean;
}

const phaseColors: Record<BeamPhase, string> = {
  CHARGING: '#60a5fa', // blue-400
  FIRING: '#3b82f6',   // blue-500
  CRITICAL: '#f97316', // orange-500
  EXTREME: '#ef4444',  // red-500
  EXPIRED: '#52525b',  // zinc-500
  CLEARED: '#eab308',  // yellow-500
};

const phaseGlows: Record<BeamPhase, string> = {
  CHARGING: '0 0 0 rgba(96, 165, 250, 0)',
  FIRING: '0 0 10px rgba(59, 130, 246, 0.6)',
  CRITICAL: '0 0 15px rgba(249, 115, 22, 0.8), inset 0 0 8px rgba(249, 115, 22, 0.5)',
  EXTREME: '0 0 20px rgba(239, 68, 68, 1), inset 0 0 10px rgba(239, 68, 68, 0.8)',
  EXPIRED: '0 0 0 rgba(82, 82, 91, 0)',
  CLEARED: '0 0 20px rgba(234, 179, 8, 0.8), inset 0 0 10px rgba(255, 255, 255, 0.8)',
};

export function KamehamehaTrack({ label, startTime, deadline, completed, compact }: KamehamehaTrackProps) {
  const { actualTheme } = useTheme();
  const now = useNow();
  const prefersReducedMotion = useReducedMotion();
  const [showTooltip, setShowTooltip] = useState(false);
  const [chargingAnim, setChargingAnim] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const { phase, progress, msToNextPhase } = getBeamPhase(now, startTime, deadline, completed);

  const color = phaseColors[phase];
  const glow = phaseGlows[phase];
  const isFinished = phase === 'EXPIRED' || phase === 'CLEARED';

  const timeText = completed ? 'CLEARED' : (phase === 'EXPIRED' ? 'MISSED' : formatDistanceToNowStrict(deadline) + ' left');

  const handleGokuClick = () => {
    if (prefersReducedMotion || isFinished) return;
    setChargingAnim(true);
    setTimeout(() => setChargingAnim(false), 500);
  };

  return (
    <div 
      className={`relative w-full ${compact ? 'py-1' : 'py-3'} flex flex-col group`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      tabIndex={0}
      role="progressbar"
      aria-valuenow={progress * 100}
      aria-label={`${label}: ${timeText}`}
    >
      {actualTheme === 'dark' ? (
        <>
          {/* Top Label (for non-compact) */}
          {!compact && (
            <div className="flex justify-between items-end mb-2 px-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</span>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${phase === 'EXTREME' || phase === 'CRITICAL' ? 'text-white' : 'text-gray-500'}`}>
                {timeText}
              </span>
            </div>
          )}

          {/* Main Track Area */}
          <div className={`flex items-center gap-2 ${compact ? 'h-6' : 'h-10'} relative`} ref={trackRef}>
            
            {/* Goku Avatar */}
            <div 
              className={`relative z-10 flex items-center justify-center cursor-pointer transition-transform ${chargingAnim ? 'scale-125 brightness-150' : 'hover:scale-110'}`}
              onClick={handleGokuClick}
              style={{ 
                width: compact ? '24px' : '40px', 
                height: compact ? '24px' : '40px',
                filter: isFinished && phase !== 'CLEARED' ? 'grayscale(100%) opacity(0.5)' : 'none' 
              }}
            >
              {/* Custom SVG Goku silhouette */}
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg" style={{ color }}>
                {/* Aura */}
                {!prefersReducedMotion && !isFinished && phase !== 'CHARGING' && (
                  <motion.circle 
                    cx="50" cy="50" r="45" 
                    fill={color} 
                    opacity="0.2"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: phase === 'EXTREME' ? 0.3 : 1, repeat: Infinity }}
                  />
                )}
                {/* Body Shape */}
                <path d="M 50 10 C 60 10, 65 20, 60 30 L 70 50 L 50 45 L 30 50 L 40 30 C 35 20, 40 10, 50 10 Z" fill="currentColor" />
                <path d="M 30 50 C 20 60, 20 80, 20 90 L 80 90 C 80 80, 80 60, 70 50 C 60 60, 40 60, 30 50 Z" fill="#F57C00" />
                {/* Chest Kanji */}
                <text x="50" y="70" fontSize="16" fontWeight="bold" textAnchor="middle" fill="#fff" opacity="0.8">悟</text>
                {/* Charging Ball */}
                {phase === 'CHARGING' && !prefersReducedMotion && (
                  <motion.circle 
                    cx="80" cy="45" r="8" fill="#fff"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </svg>
            </div>

            {/* The Track Line */}
            <div className={`flex-1 relative rounded-full overflow-hidden bg-white/5 border border-white/10 ${compact ? 'h-1.5' : 'h-3'}`}>
              {/* The Beam */}
              {phase !== 'CHARGING' && (
                <motion.div
                  className="absolute top-0 left-0 bottom-0 origin-left w-full"
                  style={{ backgroundColor: color, boxShadow: prefersReducedMotion ? 'none' : glow }}
                  initial={{ scaleX: progress }}
                  animate={{ scaleX: progress }}
                  transition={{ ease: "linear", duration: 1 }}
                >
                  {/* Beam Head Glow */}
                  {!prefersReducedMotion && !isFinished && (
                    <motion.div 
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-full bg-white blur-sm rounded-full"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: phase === 'EXTREME' ? 0.2 : 0.5, repeat: Infinity }}
                    />
                  )}
                </motion.div>
              )}
            </div>

            {/* Target */}
            <div 
              className={`relative z-10 flex flex-col items-center justify-center transition-all ${isFinished ? (phase === 'CLEARED' ? 'text-yellow-400' : 'text-gray-600') : 'text-white'}`}
              style={{ width: compact ? '24px' : '40px' }}
            >
              {phase === 'CLEARED' ? <CheckCircle size={compact ? 16 : 24} /> : 
               phase === 'EXPIRED' ? <XCircle size={compact ? 16 : 24} /> : 
               <Target size={compact ? 16 : 24} className={!prefersReducedMotion && phase === 'EXTREME' ? 'animate-pulse' : ''} style={{ filter: phase === 'EXTREME' && !prefersReducedMotion ? `drop-shadow(0 0 5px ${color})` : 'none' }} />}
            </div>

          </div>
        </>
      ) : (
        <div className="flex flex-col gap-1 w-full mt-1">
          {!compact && (
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${phase === 'EXTREME' ? 'text-danger' : phase === 'CRITICAL' ? 'text-warning' : 'text-muted'}`}>
                {timeText}
              </span>
            </div>
          )}
          
          <div className={`w-full relative rounded-full overflow-hidden bg-accent flex items-center h-2`}>
            <motion.div
              className={`h-full rounded-full ${
                phase === 'CLEARED' ? 'bg-success' : 
                phase === 'EXPIRED' ? 'bg-muted' : 
                phase === 'EXTREME' ? 'bg-danger' : 
                phase === 'CRITICAL' ? 'bg-accentForeground animate-pulse' : 
                phase === 'FIRING' ? 'bg-primary' :
                'bg-muted'
              }`}
              initial={{ width: `${progress * 100}%` }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ ease: "linear", duration: 1 }}
            />
          </div>
          <div className="flex justify-between items-center px-1 mt-0.5">
             <span className="text-[8px] font-bold text-muted uppercase">START</span>
             <span className="text-[8px] font-bold text-muted uppercase">DEADLINE</span>
          </div>
        </div>
      )}

      {/* Tooltip Overlay */}
      <div 
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 ${actualTheme === 'dark' ? 'bg-[#0a0a0a] border-white/10 text-white' : 'bg-card border-borderSubtle text-foreground shadow-lg'} border rounded-lg p-3 z-30 transition-all duration-200 ${showTooltip ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'}`}
      >
        <div className={`text-[10px] font-black uppercase tracking-widest ${actualTheme === 'dark' ? 'text-gray-500 border-white/5' : 'text-muted border-borderSubtle'} mb-2 border-b pb-1`}>
          {label} STATUS
        </div>
        <div className="flex justify-between text-xs mb-1">
          <span className={actualTheme === 'dark' ? 'text-gray-400' : 'text-muted'}>Phase</span>
          <span className="font-bold" style={{ color: actualTheme === 'dark' ? color : (phase === 'EXTREME' ? 'var(--danger)' : phase === 'CRITICAL' ? 'var(--warning)' : phase === 'CLEARED' ? 'var(--success)' : 'var(--primary)') }}>{phase}</span>
        </div>
        <div className="flex justify-between text-xs mb-1">
          <span className={actualTheme === 'dark' ? 'text-gray-400' : 'text-muted'}>Deadline</span>
          <span className={actualTheme === 'dark' ? 'text-white' : 'text-foreground'}>{format(deadline, 'MMM dd, HH:mm')}</span>
        </div>
        <div className="flex justify-between text-xs mb-2">
          <span className={actualTheme === 'dark' ? 'text-gray-400' : 'text-muted'}>Elapsed</span>
          <span className={actualTheme === 'dark' ? 'text-white' : 'text-foreground'}>{(progress * 100).toFixed(1)}%</span>
        </div>
        
        {!isFinished && msToNextPhase !== null && (
          <div className={`pt-2 border-t ${actualTheme === 'dark' ? 'border-white/5' : 'border-borderSubtle'} mt-2`}>
            <span className={`text-[10px] ${actualTheme === 'dark' ? 'text-gray-500' : 'text-muted'} block leading-tight`}>
              Next phase in: <strong className={actualTheme === 'dark' ? 'text-gray-300' : 'text-foreground'}>{formatDistanceToNowStrict(now + msToNextPhase)}</strong>
            </span>
          </div>
        )}
      </div>

    </div>
  );
}
