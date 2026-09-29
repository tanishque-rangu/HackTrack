import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { DragonBallStage } from '../utils/dragonBalls';
import { Flame, Check } from 'lucide-react';
import { useTheme } from '../theme/ThemeProvider';
import { getCopy } from '../copy';

interface DragonBallProps {
  stage: DragonBallStage;
  onClick: (stage: DragonBallStage) => void;
  isActive: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function DragonBall({ stage, onClick, isActive, size = 'md', onHover, onLeave }: DragonBallProps & { onHover?: (rect: DOMRect) => void, onLeave?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (containerRef.current && onHover) {
      onHover(containerRef.current.getBoundingClientRect());
    }
  };
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10 md:w-12 md:h-12',
    lg: 'w-16 h-16 md:w-20 md:h-20'
  };
  
  const starSizeClasses = {
    sm: 'text-[6px]',
    md: 'text-[8px] md:text-[10px]',
    lg: 'text-[12px] md:text-[14px]'
  };

  // Generate stars based on stage number
  
  // State specific styles
  let stateClasses = '';
  let glowClasses = '';
  
  switch(stage.state) {
    case 'NOT_STARTED':
      stateClasses = 'bg-gradient-to-br from-[#2a2a2a] to-[#0a0a0a] border border-borderSubtle';
      glowClasses = 'shadow-[inset_-2px_-2px_6px_rgba(0,0,0,0.9),inset_2px_2px_6px_rgba(255,255,255,0.05)] opacity-80 hover:opacity-100';
      break;
    case 'IN_PROGRESS':
      stateClasses = 'bg-gradient-to-br from-[#2a1a0a] to-[#150a00] border border-primary/40';
      glowClasses = 'shadow-[0_0_15px_rgba(255,152,0,0.2),inset_-4px_-4px_8px_rgba(0,0,0,0.8),inset_4px_4px_8px_rgba(255,152,0,0.3)] animate-ki-pulse ring-1 ring-primary/30';
      break;
    case 'COMPLETED':
      stateClasses = 'bg-gradient-to-br from-[#ffb74d] to-[#ef6c00]';
      glowClasses = 'shadow-[0_0_20px_rgba(245,124,0,0.6),inset_-4px_-4px_8px_rgba(0,0,0,0.4),inset_4px_4px_8px_rgba(255,255,255,0.6)]';
      break;
    case 'COMPLETED_FINAL':
      stateClasses = 'bg-gradient-to-br from-[#ffd54f] to-[#f57c00]';
      glowClasses = 'shadow-[0_0_30px_rgba(255,213,79,0.8),inset_-4px_-4px_8px_rgba(0,0,0,0.4),inset_4px_4px_8px_rgba(255,255,255,0.8)]';
      break;
  }
  
  if (isActive) {
    glowClasses += ' ring-[3px] ring-primary/80 ring-offset-2 ring-offset-background shadow-[0_0_20px_rgba(245,124,0,0.4)]';
  }

  // Handle Stars layout inside the ball
  const getStarLayout = (count: number) => {
    switch(count) {
      case 1: return <span className="absolute">★</span>;
      case 2: return <><span className="absolute -translate-x-2 -translate-y-1">★</span><span className="absolute translate-x-2 translate-y-1">★</span></>;
      case 3: return <><span className="absolute -translate-y-2">★</span><span className="absolute -translate-x-2.5 translate-y-1.5">★</span><span className="absolute translate-x-2.5 translate-y-1.5">★</span></>;
      case 4: return <><span className="absolute -translate-x-2 -translate-y-2">★</span><span className="absolute translate-x-2 -translate-y-2">★</span><span className="absolute -translate-x-2 translate-y-2">★</span><span className="absolute translate-x-2 translate-y-2">★</span></>;
      case 5: return <><span className="absolute -translate-y-2.5">★</span><span className="absolute -translate-x-2.5 -translate-y-0.5">★</span><span className="absolute translate-x-2.5 -translate-y-0.5">★</span><span className="absolute -translate-x-1.5 translate-y-2">★</span><span className="absolute translate-x-1.5 translate-y-2">★</span></>;
      case 6: return <><span className="absolute -translate-x-2 -translate-y-2.5">★</span><span className="absolute translate-x-2 -translate-y-2.5">★</span><span className="absolute -translate-x-3 translate-y-0">★</span><span className="absolute translate-x-3 translate-y-0">★</span><span className="absolute -translate-x-2 translate-y-2.5">★</span><span className="absolute translate-x-2 translate-y-2.5">★</span></>;
      case 7: return <><span className="absolute -translate-y-3">★</span><span className="absolute -translate-x-2.5 -translate-y-1">★</span><span className="absolute translate-x-2.5 -translate-y-1">★</span><span className="absolute -translate-x-3.5 translate-y-1.5">★</span><span className="absolute translate-x-3.5 translate-y-1.5">★</span><span className="absolute -translate-x-1.5 translate-y-3">★</span><span className="absolute translate-x-1.5 translate-y-3">★</span></>;
      default: return null;
    }
  };

  return (
    <div 
      className="relative z-20 group shrink-0"
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onLeave}
      onFocus={handleMouseEnter}
      onBlur={onLeave}
    >
      <button
        onClick={() => onClick(stage)}
        className={`rounded-full relative flex items-center justify-center transition-all duration-300 cursor-pointer ${sizeClasses.md} ${sizeClasses[size]} ${stateClasses} ${glowClasses} hover:scale-110`}
      >
        {/* Shine highlight */}
        <div className="absolute top-[10%] left-[15%] w-[35%] h-[25%] bg-white rounded-[50%] opacity-40 rotate-[-45deg] blur-[1px]"></div>
        
        {/* Stars container */}
        <div className={`relative flex items-center justify-center drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] ${starSizeClasses[size]} ${(stage.state === 'NOT_STARTED' || stage.state === 'IN_PROGRESS') ? 'text-red-900/50' : 'text-red-700'}`}>
          {getStarLayout(stage.stageNumber)}
        </div>
        
        {/* Aura for IN_PROGRESS and FINAL */}
        {(stage.state === 'IN_PROGRESS' || stage.state === 'COMPLETED_FINAL') && (
          <div className="absolute inset-[-20%] rounded-full border-2 border-primary/40 opacity-0 group-hover:opacity-100 group-hover:animate-ki-aura pointer-events-none"></div>
        )}
      </button>

    </div>
  );
}

export function DragonBallProgress({ stages, onStageClick, activeStageNumber }: { stages: DragonBallStage[], onStageClick?: (stage: DragonBallStage) => void, activeStageNumber?: number }) {
  const { actualTheme } = useTheme();
  const copy = getCopy(actualTheme);
  const [tooltipState, setTooltipState] = useState<{stage: DragonBallStage, rect: DOMRect} | null>(null);
  const completedCount = stages.filter(s => s.state === 'COMPLETED' || s.state === 'COMPLETED_FINAL').length;

  useEffect(() => {
    const handleScroll = () => setTooltipState(null);
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    return () => window.removeEventListener('scroll', handleScroll, { capture: true });
  }, []);
  return (
    <div className="flex flex-col gap-3 relative min-w-0">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-1">
        <span className={`text-[10px] font-black uppercase tracking-widest ${actualTheme === 'dark' ? 'text-primary text-glow-orange' : 'text-muted'}`}>{copy.dragonBallProgress}</span>
        <span className="text-xs font-black text-foreground">{copy.ballsCollected(completedCount)}</span>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3 w-full py-3 px-2 overflow-x-auto scrollbar-hide relative">
        {actualTheme === 'light' && (
          <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-borderSubtle -translate-y-1/2 z-0">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(completedCount / Math.max(1, stages.length - 1)) * 100}%` }}></div>
          </div>
        )}
        
        {stages.map((stage) => {
          if (actualTheme === 'light') {
            const isCompleted = stage.state === 'COMPLETED' || stage.state === 'COMPLETED_FINAL';
            const isCurrent = activeStageNumber === stage.stageNumber;
            
            return (
              <div key={stage.stageNumber} className="relative z-10 flex-1 flex justify-center shrink-0 min-w-[32px]">
                <button
                  ref={(el) => {
                    if (el && tooltipState?.stage.stageNumber === stage.stageNumber) {
                      // Need to maintain rect for tooltip
                    }
                  }}
                  onMouseEnter={(e) => setTooltipState({ stage, rect: e.currentTarget.getBoundingClientRect() })}
                  onMouseLeave={() => setTooltipState(null)}
                  onFocus={(e) => setTooltipState({ stage, rect: e.currentTarget.getBoundingClientRect() })}
                  onBlur={() => setTooltipState(null)}
                  onClick={() => onStageClick && onStageClick(stage)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 border-2 ${
                    isCompleted 
                      ? 'bg-primary border-primary text-primaryForeground hover:bg-primaryLight hover:border-primaryLight' 
                      : isCurrent 
                        ? 'bg-card border-primary text-primary ring-4 ring-primary/20' 
                        : 'bg-card border-borderMuted text-muted hover:border-borderSubtle'
                  }`}
                >
                  {isCompleted ? <Check size={14} strokeWidth={3} /> : <span className="text-xs font-bold">{stage.stageNumber}</span>}
                </button>
              </div>
            );
          }
          
          return (
            <DragonBall 
              key={stage.stageNumber} 
              stage={stage} 
              onClick={(s) => onStageClick && onStageClick(s)}
              onHover={(rect) => setTooltipState({ stage, rect })}
              onLeave={() => setTooltipState(null)}
              isActive={activeStageNumber === stage.stageNumber}
              size="md"
            />
          );
        })}
      </div>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {tooltipState && (
            <motion.div
              initial={{ opacity: 0, y: "calc(-100% + 10px)", x: "-50%", scale: 0.95 }}
              animate={{ opacity: 1, y: "-100%", x: "-50%", scale: 1 }}
              exit={{ opacity: 0, y: "calc(-100% + 10px)", x: "-50%", scale: 0.95 }}
              style={{
                position: 'fixed',
                top: tooltipState.rect.top - 12,
                left: tooltipState.rect.left + (tooltipState.rect.width / 2),
                zIndex: 99999
              }}
              className={`w-64 p-4 pointer-events-none ${
                actualTheme === 'dark' 
                  ? 'bg-card/95 backdrop-blur-xl border border-primary/30 rounded shadow-[0_10px_40px_rgba(0,0,0,0.9),0_0_20px_rgba(245,124,0,0.3)]'
                  : 'bg-card border border-borderSubtle shadow-xl rounded-xl'
              }`}
            >
              <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 pointer-events-none ${
                actualTheme === 'dark' ? 'bg-card/95 border-b border-r border-primary/30' : 'bg-card border-b border-r border-borderSubtle'
              }`}></div>
              
              <div className="relative z-10 flex flex-col gap-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="flex items-center gap-1 text-[10px] font-black text-muted uppercase tracking-widest">
                    {actualTheme === 'dark' ? <><span className="text-primary">★</span> {tooltipState.stage.stageNumber}-STAR BALL</> : `STAGE ${tooltipState.stage.stageNumber}`}
                  </span>
                  <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    tooltipState.stage.state === 'NOT_STARTED' ? 'bg-panelAlt text-muted border border-borderSubtle' :
                    tooltipState.stage.state === 'IN_PROGRESS' ? 'bg-primary/10 text-primary border border-primary/20' :
                    'bg-success/10 text-success border border-success/20'
                  }`}>
                    {tooltipState.stage.statusText}
                  </span>
                </div>
                
                <h4 className={`text-xl font-black uppercase tracking-wider ${actualTheme === 'dark' ? 'text-foreground text-glow-orange' : 'text-foreground'}`}>{tooltipState.stage.name}</h4>
                <p className={`text-xs mb-2 leading-relaxed ${actualTheme === 'dark' ? 'text-gray-300' : 'text-muted'}`}>{tooltipState.stage.description}</p>
                
                {tooltipState.stage.details && Object.keys(tooltipState.stage.details).length > 0 && (
                  <div className="bg-[#111] p-2 rounded border border-borderSubtle flex flex-col gap-1 mb-2">
                    {Object.entries(tooltipState.stage.stageNumber ? tooltipState.stage.details : {}).map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center text-[10px]">
                        <span className="text-[var(--text-gray-500)] font-bold uppercase">{k}</span>
                        <span className="text-gray-200 font-black truncate max-w-[100px]" title={String(v)}>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {tooltipState.stage.deadline && (
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-warning">
                    <Flame size={12} /> DEADLINE: {tooltipState.stage.deadline}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

export function MissionComplete({ hackathonName, powerLevel }: { hackathonName: string, powerLevel: number }) {
  const { actualTheme } = useTheme();
  const copy = getCopy(actualTheme);
  const [showShenron, setShowShenron] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowShenron(false);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);
  
  if (actualTheme === 'light') {
    return (
      <div className="h-full min-h-[300px] bg-success/5 border border-success/20 rounded-xl p-8 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mb-4">
          <Check size={40} className="text-success" strokeWidth={3} />
        </div>
        <h2 className="text-2xl font-black text-foreground uppercase mb-2">{copy.missionComplete}</h2>
        <p className="text-muted font-medium mb-6">All requirements met for {hackathonName}</p>
        <div className="inline-flex items-center gap-2 bg-card border border-borderSubtle px-4 py-2 rounded-full shadow-sm">
           <span className="text-xs font-bold text-muted uppercase tracking-widest">{copy.powerLevelShort}:</span>
           <span className="text-sm font-black text-foreground">{powerLevel.toLocaleString()} PTS</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[300px]">
      <AnimatePresence>
        {showShenron && (
          <motion.div
            key="shenron"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-50 rounded-md bg-[#020202] border border-green-500/30 overflow-hidden flex flex-col items-center justify-center shadow-[inset_0_0_100px_rgba(16,185,129,0.2)]"
          >
            {/* Shenron SVG Path Animation */}
            <motion.svg 
              viewBox="0 0 100 100" 
              className="absolute inset-0 w-full h-full scale-150" 
              preserveAspectRatio="xMidYMid meet"
            >
              <motion.path 
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.2 }}
                transition={{ duration: 2, ease: "easeInOut" }}
                d="M50 10 C30 15, 20 30, 25 50 C30 70, 50 80, 70 65 C85 55, 90 35, 75 20 C60 5, 40 5, 25 20" 
                fill="none" 
                stroke="#10b981" 
                strokeWidth="2"
              />
              <motion.path 
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.6 }}
                transition={{ duration: 2.5, ease: "easeOut", delay: 0.5 }}
                d="M40 30 C35 35, 30 45, 35 55 C40 65, 50 70, 60 60 C70 50, 75 35, 65 25" 
                fill="none" 
                stroke="#f57c00" 
                strokeWidth="1.5"
              />
            </motion.svg>
            
            {/* Flash Effect */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1, delay: 2.5 }}
              className="absolute inset-0 bg-green-400 mix-blend-overlay"
            />
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 1 }}
              className="relative z-10 text-2xl font-black text-green-400 uppercase tracking-[0.3em] drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]"
            >
              Shenron is summoned...
            </motion.h2>
          </motion.div>
        )}
      </AnimatePresence>

      {!showShenron && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative h-full p-6 rounded-md bg-gradient-to-b from-[#1a1103] to-card border border-[#f57c00]/40 overflow-hidden flex flex-col items-center justify-center text-center group"
        >
          <div className="absolute inset-0 bg-ki-orange-gradient opacity-20 group-hover:opacity-30 transition-opacity"></div>
          
          {/* Dragon Silhouette Background */}
          <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-10 transition-opacity pointer-events-none flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full scale-150 fill-primary" preserveAspectRatio="xMidYMid meet">
              <path d="M50 10 C30 15, 20 30, 25 50 C30 70, 50 80, 70 65 C85 55, 90 35, 75 20 C60 5, 40 5, 25 20" stroke="none"/>
              <path d="M40 30 C35 35, 30 45, 35 55 C40 65, 50 70, 60 60 C70 50, 75 35, 65 25" fill="none" stroke="#f57c00" strokeWidth="2"/>
            </svg>
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="text-4xl mb-4 animate-bounce-slow">🐉</div>
            <h3 className="text-xl font-black text-[#ffd54f] uppercase tracking-widest mb-1 text-glow-yellow">7 DRAGON BALLS COLLECTED</h3>
            <h2 className="text-4xl font-black text-foreground uppercase tracking-tighter mb-4 text-glow-orange">MISSION COMPLETE</h2>
            
            <div className="bg-panel border border-primary/30 px-6 py-3 rounded-full mb-6 shadow-[0_0_20px_rgba(245,124,0,0.2)]">
              <p className="text-sm font-bold text-gray-300 uppercase tracking-wider">{hackathonName}</p>
            </div>
            
            <div className="flex items-center gap-2 mb-6 group/ki relative cursor-pointer">
              <span className="text-xs font-black uppercase tracking-widest text-primary text-glow-orange">POWER LEVEL</span>
              <span className="text-xl font-black text-foreground bg-darkblue px-3 py-1 rounded border border-accent/30">{powerLevel.toLocaleString()} KI</span>
            </div>

            <div className="flex flex-wrap justify-center gap-2 max-w-sm">
              {['Discover', 'Registration', 'Team', 'Idea', 'Build', 'Submission', 'Finale'].map((stage, i) => (
                 <div key={i} className="flex items-center gap-1.5 text-xs font-bold text-success bg-success/10 px-2 py-1 rounded border border-success/20">
                   <span className="text-[10px]">✓</span> {stage}
                 </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
