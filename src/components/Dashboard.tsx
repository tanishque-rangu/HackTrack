import { useState, useRef, useEffect } from 'react';
import { useStore } from '../useStore';
import { differenceInHours, isPast, parseISO } from 'date-fns';
import { Link as LinkIcon, X, Send, MessageSquare, Check, CheckSquare, Minus, Users, FolderKanban, Zap, Activity, Flame, Shield, ArrowRight, Target, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Hackathon } from '../types';
import { calculateHackathonStages, calculatePowerLevel, getOverallProgress } from '../utils/dragonBalls';
import { DragonBallProgress, MissionComplete } from './DragonBalls';
import { LiveCountdown } from './LiveCountdown';
import { checkAndTriggerNotifications, requestNotificationPermission } from '../utils/notifications';
import { generateICS } from '../utils/calendar';
import { Calendar } from 'lucide-react';
import { CommandPalette } from './CommandPalette';
import { KamehamehaTrack } from './KamehamehaTrack';
import { useTheme } from '../theme/ThemeProvider';
import { getCopy } from '../copy';

export default function Dashboard() {
  const { actualTheme } = useTheme();
  const copy = getCopy(actualTheme);
  const { data, addChatMessage, updateRegistrationStatus, updatePowerHistory, updateChecklistItem, updateProject, addHackathon } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [senderName, setSenderName] = useState(() => localStorage.getItem('hacktrack-sender') || data.members[0]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const globalProgress = getOverallProgress(data.hackathons, data);

  const getRegStatusDisplay = (status: 'Registered' | 'Not Yet' | 'N/A') => {
    switch(status) {
      case 'Registered':
        return <div className="bg-success/20 text-success w-8 h-8 rounded flex items-center justify-center border border-success/30 shadow-[0_0_10px_rgba(56,142,60,0.2)]" title="Registered"><Check size={18} /></div>;
      case 'Not Yet':
        return <div className="bg-warning/20 text-warning w-8 h-8 rounded flex items-center justify-center border border-warning/30" title="Not Yet"><X size={18} /></div>;
      case 'N/A':
        return <div className="bg-white/5 text-[var(--text-gray-500)] w-8 h-8 rounded flex items-center justify-center border border-borderMuted" title="N/A"><Minus size={18} /></div>;
    }
  };

  const handleCycleStatus = (hackathonId: string, member: string, current: 'Registered' | 'Not Yet' | 'N/A') => {
    const nextStatus = {
      'Registered': 'Not Yet',
      'Not Yet': 'N/A',
      'N/A': 'Registered'
    } as const;
    updateRegistrationStatus(hackathonId, member, nextStatus[current]);
  };

  useEffect(() => {
    localStorage.setItem('hacktrack-sender', senderName);
  }, [senderName]);

  useEffect(() => {
    if (selectedId && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [selectedId, data.chats]);

  useEffect(() => {
    // Check notifications periodically (every 5 mins)
    requestNotificationPermission();
    checkAndTriggerNotifications(data.hackathons);
    const interval = setInterval(() => {
      checkAndTriggerNotifications(data.hackathons);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [data.hackathons]);

  useEffect(() => {
    // Record power history periodically (every 10 seconds for demo, normally would be hours/days)
    const interval = setInterval(() => {
      const currentPower = getOverallProgress(data.hackathons, data).power.total;
      updatePowerHistory(currentPower);
    }, 10000);
    
    // Initial record
    updatePowerHistory(globalProgress.power.total);
    
    return () => clearInterval(interval);
  }, [data.hackathons, data.registrationStatus, data.chats]);

  const sortedHackathons = [...data.hackathons].sort((a, b) => {
    const getNextDeadline = (h: Hackathon) => {
      const dates = [];
      if (h.registrationDeadline) dates.push(new Date(h.registrationDeadline).getTime());
      if (h.submissionDeadline) dates.push(new Date(h.submissionDeadline).getTime());
      
      const futureDates = dates.filter(d => !isPast(d));
      return futureDates.length > 0 ? Math.min(...futureDates) : Math.max(...dates, 0);
    };
    
    return getNextDeadline(a) - getNextDeadline(b);
  });

  const getDeadlineStatus = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = dateStr.length === 10 ? parseISO(`${dateStr}T23:59:59Z`) : parseISO(dateStr);

    if (isPast(date)) return { status: 'passed', color: 'text-[var(--text-gray-500)]', bg: 'bg-white/5 border-borderMuted', label: 'EXPIRED', pulse: false };
    
    const hours = differenceInHours(date, new Date());
    if (hours <= 6) return { status: 'extreme', color: actualTheme === 'dark' ? 'text-red-500' : 'text-danger', bg: 'bg-red-500/20 border-red-500/60', label: '< 6H EXTREME', pulse: true };
    if (hours <= 48) return { status: 'urgent', color: actualTheme === 'dark' ? 'text-primary' : 'text-primaryLight', bg: 'bg-primary/10 border-primary/40', label: '< 48H CRITICAL', pulse: true };
    if (hours <= 168) return { status: 'upcoming', color: actualTheme === 'dark' ? 'text-warning' : 'text-warning', bg: 'bg-warning/10 border-warning/30', label: 'WARNING (7D)', pulse: false };
    return { status: 'safe', color: actualTheme === 'dark' ? 'text-accent' : 'text-success', bg: 'bg-darkblue/40 border-accent/20', label: 'SAFE', pulse: false };
  };

  const filteredHackathons = sortedHackathons.filter(h => {
    if (!activeFilter) return true;
    const stages = calculateHackathonStages(h, data);
    const activeStage = stages.find(s => s.state === 'IN_PROGRESS') || stages.find(s => s.state === 'NOT_STARTED');
    if (activeStage && activeStage.name === activeFilter) return true;
    if (activeFilter === 'FINALE' && stages[6].state === 'COMPLETED_FINAL') return true;
    return false;
  });

  const selectedHackathon = data.hackathons.find(h => h.id === selectedId);
  const chats = selectedId ? (data.chats[selectedId] || []) : [];

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedId) return;
    addChatMessage(selectedId, senderName, chatInput.trim());
    setChatInput('');
  };

  const PowerBar = ({ ki, urgent }: { ki: { total: number, stagesCompleted: number, deadlinePressure: number }, urgent?: boolean }) => {
    // Max KI is roughly 10000
    const level = Math.min(10, Math.ceil((ki.total / 10000) * 10));
    const bars = 10;
    
    if (actualTheme === 'light') {
      return (
        <div className="flex flex-col gap-1 w-full min-w-0" title="Progress breakdown">
          <div className="flex justify-between items-end mb-1">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${urgent ? 'text-primary' : 'text-muted'}`}>{copy.powerLevelShort}</span>
            <span className={`text-xs font-black ${urgent ? 'text-foreground' : 'text-foreground'}`}>{level * 10}%</span>
          </div>
          <div className="w-full h-2 bg-accent rounded-full overflow-hidden">
            <div className={`h-full bg-gradient-to-r from-[#FDBA74] to-[#F97316]`} style={{ width: `${level * 10}%` }}></div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col gap-1 relative group/ki min-w-0" tabIndex={0}>
        <div className="flex justify-between items-end">
          <span className={`text-[10px] font-black uppercase tracking-widest ${urgent ? 'text-primary text-glow-orange' : 'text-[var(--text-gray-400)]'}`}>{copy.powerLevelShort}</span>
          <span className={`text-xs font-black ${urgent ? 'text-foreground' : 'text-gray-300'}`}>{ki.total.toLocaleString()} KI</span>
        </div>
        <div className="flex gap-[2px] h-3">
          {[...Array(bars)].map((_, i) => (
            <div 
              key={i} 
              className={`flex-1 skew-x-[-15deg] ${
                i < level 
                  ? urgent ? 'bg-primary shadow-[0_0_8px_rgba(245,124,0,0.8)]' : 'bg-primaryLight shadow-[0_0_5px_rgba(255,152,0,0.6)]' 
                  : 'bg-white/10'
              }`}
            />
          ))}
        </div>
        
        {/* KI Breakdown Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-[#0a0a0a] border border-borderMuted rounded p-3 opacity-0 pointer-events-none group-hover/ki:opacity-100 group-focus/ki:opacity-100 group-hover/ki:pointer-events-auto group-focus/ki:pointer-events-auto transition-opacity z-20 shadow-xl">
          <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-gray-500)] mb-2 border-b border-borderSubtle pb-1">KI BREAKDOWN</div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[var(--text-gray-400)]">Stages</span>
            <span className="text-foreground font-bold">+{ki.stagesCompleted}</span>
          </div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[var(--text-gray-400)]">Pressure</span>
            <span className="text-primary font-bold">+{ki.deadlinePressure}</span>
          </div>
          <div className="flex justify-between text-xs mt-2 pt-1 border-t border-borderSubtle font-black">
            <span className="text-foreground">TOTAL</span>
            <span className="text-primaryLight">{ki.total}</span>
          </div>
        </div>
      </div>
    );
  };

  const getTransformation = (power: number) => {
    if (power >= 9000) return { name: 'SUPER SAIYAN GOD', color: 'text-red-500', glow: 'shadow-[0_0_40px_rgba(239,68,68,0.3)]', bg: 'bg-red-500/10 border-red-500/30' };
    if (power >= 6000) return { name: 'SUPER SAIYAN 3', color: 'text-yellow-300', glow: 'shadow-[0_0_40px_rgba(253,224,71,0.3)]', bg: 'bg-yellow-400/10 border-yellow-400/30' };
    if (power >= 4000) return { name: 'SUPER SAIYAN 2', color: 'text-yellow-500', glow: 'shadow-[0_0_30px_rgba(234,179,8,0.2)]', bg: 'bg-yellow-500/10 border-yellow-500/30' };
    if (power >= 2000) return { name: 'SUPER SAIYAN', color: 'text-primaryLight', glow: 'shadow-[0_0_30px_rgba(255,152,0,0.2)]', bg: 'bg-primary/10 border-primary/30' };
    return { name: 'BASE FORM', color: 'text-foreground', glow: 'shadow-[0_0_20px_rgba(255,255,255,0.05)]', bg: 'bg-white/5 border-borderMuted' };
  };

  const transformation = getTransformation(globalProgress.power.total);

  const renderSparkline = () => {
    const history = data.powerHistory || [globalProgress.power.total];
    if (history.length < 2) return null;
    
    const maxVal = Math.max(...history, 10000);
    const minVal = 0;
    const width = 100;
    const height = 24;
    
    const points = history.map((val, i) => {
      const x = (i / (history.length - 1)) * width;
      const y = height - ((val - minVal) / (maxVal - minVal)) * height;
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <div className="absolute top-0 right-0 w-[100px] h-[24px] opacity-60">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
            className={transformation.color}
          />
          {/* Add a glow behind the line */}
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
            className={`${transformation.color} opacity-20 blur-[2px]`}
          />
        </svg>
      </div>
    );
  };

  return (
    <div className="relative">
      <CommandPalette onSelectHackathon={setSelectedId} />
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 pb-8"
      >
        <div className="flex flex-col mb-12 relative">
          
          {actualTheme === 'dark' ? (
            <>
              <div className="absolute -inset-20 bg-ki-orange-gradient opacity-20 pointer-events-none rounded-full blur-[80px]"></div>
              <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 border bg-card/60 backdrop-blur-md rounded-lg p-6 transition-all duration-1000 ${transformation.bg} ${transformation.glow}`}>
                <div className="md:col-span-2">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`kanji-emblem ${transformation.color} drop-shadow-md`}>悟</span>
                    <div className="flex flex-col">
                      <span className="text-xs uppercase font-black tracking-[0.3em] text-[var(--text-gray-400)]">{copy.warRoom}</span>
                      <span className={`text-[10px] uppercase font-black tracking-widest ${transformation.color} animate-pulse-slow`}>{transformation.name}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-4">
                    <div className="flex items-center gap-1.5 bg-black/40 p-2 rounded-full border border-borderMuted">
                      {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                        <button 
                          key={num} 
                          onClick={() => {
                            const stageNames = ['DISCOVER', 'REGISTER', 'TEAM', 'IDEA', 'BUILD', 'SUBMIT', 'FINALE'];
                            setActiveFilter(activeFilter === stageNames[num-1] ? null : stageNames[num-1]);
                          }}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${num <= globalProgress.completed ? 'dragon-ball shadow-[0_0_15px_rgba(245,124,0,0.5)] hover:scale-110' : 'bg-gray-800 border border-gray-700 opacity-50 hover:opacity-100 hover:border-primary/50'}`}
                        >
                          <span className={`text-[10px] leading-none drop-shadow-sm font-black ${num <= globalProgress.completed ? 'text-red-700 opacity-80' : 'text-[var(--text-gray-500)]'}`}>★</span>
                        </button>
                      ))}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-foreground uppercase tracking-tight leading-none mb-1">YOUR TEAM</h3>
                      <p className="text-primaryLight text-xs font-bold tracking-widest">{copy.ballsCollected(globalProgress.completed)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-card border border-borderSubtle shadow-sm rounded-xl p-6 relative z-10 flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                {/* Progress Ring / Stepper for Light Mode */}
                <div className="w-20 h-20 shrink-0 relative flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="var(--border-white-10)" strokeWidth="8" fill="none" />
                    <circle cx="50" cy="50" r="40" stroke="var(--primary)" strokeWidth="8" fill="none" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * (globalProgress.completed / 7))} strokeLinecap="round" className="transition-all duration-1000" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-black text-foreground">{globalProgress.completed}/7</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-[10px] uppercase font-bold tracking-widest text-muted mb-1">{copy.warRoom}</h3>
                  <h2 className="text-2xl font-black text-foreground">YOUR TEAM</h2>
                  <div className="flex gap-2 mt-2">
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                      <button
                        key={num}
                        onClick={() => {
                          const stageNames = ['DISCOVER', 'REGISTER', 'TEAM', 'IDEA', 'BUILD', 'SUBMIT', 'FINALE'];
                          setActiveFilter(activeFilter === stageNames[num-1] ? null : stageNames[num-1]);
                        }}
                        className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${num <= globalProgress.completed ? 'bg-primary text-primaryForeground border-primary hover:bg-primaryLight' : 'bg-card border-borderMuted text-muted hover:border-borderSubtle'}`}
                      >
                        {num <= globalProgress.completed ? <Check size={12} strokeWidth={3} /> : <span className="text-[10px] font-bold">{num}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Active Filter UI stays same but positioned correctly relative to the header */}
          {activeFilter && (
                <div className="mt-4 flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${actualTheme === 'dark' ? 'text-[var(--text-gray-400)]' : 'text-muted'}`}><Filter size={12} /> FILTER:</span>
                  <button 
                    onClick={() => setActiveFilter(null)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-sm text-[10px] font-black uppercase transition-colors ${actualTheme === 'dark' ? 'bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30' : 'bg-primary text-primaryForeground hover:bg-accentForeground border border-transparent'}`}
                  >
                    {activeFilter} MISSIONS <X size={10} />
                  </button>
                </div>
              )}
          
          {/* Stat panel for Dark Mode */}
          {actualTheme === 'dark' ? (
            <div className={`relative md:absolute top-0 right-0 h-auto md:h-full w-full md:w-1/3 flex flex-col justify-center border-t md:border-t-0 md:border-l border-borderMuted mt-4 md:mt-0 pt-4 md:pt-0 md:pl-6 space-y-4 pointer-events-none`}>
              <div className="group/total pointer-events-auto relative w-full" tabIndex={0}>
                <span className="text-[10px] font-black text-[var(--text-gray-400)] uppercase tracking-widest block mb-1">{copy.totalPower}</span>
                <div className="flex justify-between items-end relative">
                  <span className={`text-3xl font-black ${transformation.color} drop-shadow-lg`}>{globalProgress.power.total.toLocaleString()} KI</span>
                  {renderSparkline()}
                </div>
                
                {/* Total KI Breakdown */}
                <div className="absolute top-full right-0 mt-2 w-48 bg-[#0a0a0a] border border-borderMuted rounded p-3 opacity-0 pointer-events-none group-hover/total:opacity-100 group-focus/total:opacity-100 transition-opacity z-20 shadow-xl">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[var(--text-gray-400)]">Stages Avg</span>
                    <span className="text-foreground font-bold">{globalProgress.power.stagesCompleted}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-gray-400)]">Pressure Avg</span>
                    <span className="text-primary font-bold">{globalProgress.power.deadlinePressure}</span>
                  </div>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-black text-[var(--text-gray-400)] uppercase tracking-widest block mb-1">{copy.currentMission}</span>
                <span className="text-sm font-bold text-primaryLight uppercase bg-primary/10 px-2 py-1 rounded border border-primary/30 inline-block">{globalProgress.currentStage}</span>
              </div>
            </div>
          ) : (
            <div className="relative md:absolute top-0 right-0 h-auto md:h-full flex flex-col justify-center mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-borderSubtle md:pr-8 pointer-events-none w-full md:w-auto">
              <div className="pointer-events-auto flex flex-col md:items-end text-left md:text-right">
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">{copy.totalPower}</span>
                <div className="flex items-baseline gap-2">
                   <span className="text-2xl font-black text-foreground">{globalProgress.power.total.toLocaleString()}</span>
                   <span className="text-xs font-bold text-muted">PTS</span>
                </div>
                <div className="mt-3 text-left md:text-right">
                   <span className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-1">{copy.currentMission}</span>
                   <span className="text-xs font-black text-primary bg-primary/10 px-2 py-1 rounded-full inline-block">{globalProgress.currentStage}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-end mb-4 relative z-10">
          <div></div>
          <button 
            onClick={() => {
              const name = window.prompt('Enter Hackathon Name:');
              if (!name) return;
              const platform = window.prompt('Enter Platform (e.g. Devfolio, Devpost, Custom):') || 'Custom';
              const newHackathon = {
                id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                name,
                platform,
                format: 'Online',
                registrationDeadline: new Date().toISOString().split('T')[0],
                submissionDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                eventDates: 'TBD',
                teams: [{ teamLabel: 'Team A', members: [] }],
                projects: []
              };
              addHackathon(newHackathon);
            }}
            className={`px-4 py-2 font-bold text-xs uppercase tracking-wider rounded transition-colors ${actualTheme === 'dark' ? 'bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30' : 'bg-primary text-primaryForeground hover:bg-primary/90'}`}
          >
            + ADD NEW HACKATHON
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 relative z-10">
          {filteredHackathons.map((h, i) => {
            const regStatus = getDeadlineStatus(h.registrationDeadline);
            const subStatus = getDeadlineStatus(h.submissionDeadline);
            
            const stages = calculateHackathonStages(h, data);
            const ki = calculatePowerLevel(stages, h);
            const isUrgent = ki.total >= 8000;
            
            const isMissionComplete = stages[6].state === 'COMPLETED_FINAL';
            
            if (isMissionComplete) {
              return (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 25 }}
                  key={h.id} 
                  onClick={() => setSelectedId(h.id)}
                  className="cursor-pointer h-full"
                >
                  <MissionComplete hackathonName={h.name} powerLevel={ki.total} />
                </motion.div>
              );
            }
            
            // Find current stage for display
            const activeStage = stages.find(s => s.state === 'IN_PROGRESS') || stages.find(s => s.state === 'NOT_STARTED');
            
            return (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 25 }}
                key={h.id} 
                onClick={() => setSelectedId(h.id)}
                className={actualTheme === 'dark' 
                  ? `bg-card/90 min-w-0 backdrop-blur-md rounded p-1 border cursor-pointer group relative overflow-visible transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-2 ${
                      isUrgent 
                        ? 'border-primary shadow-[0_4px_20px_rgba(245,124,0,0.2)] hover:shadow-[0_15px_40px_rgba(245,124,0,0.5)]' 
                        : 'border-borderMuted hover:border-primaryLight/60 hover:shadow-[0_15px_30px_rgba(255,152,0,0.25)]'
                    }`
                  : `bg-card min-w-0 rounded-xl p-6 border cursor-pointer group relative overflow-visible transition-all duration-200 hover:-translate-y-1 shadow-sm hover:shadow-md ${
                      isUrgent ? 'border-primary/50' : 'border-borderSubtle hover:border-borderMuted'
                    }`
                }
              >
                {/* Glow Background (Dark mode only) */}
                {actualTheme === 'dark' && (
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded ${
                    isUrgent ? 'bg-[radial-gradient(circle_at_center,rgba(245,124,0,0.2),transparent_80%)]' : 'bg-[radial-gradient(circle_at_center,rgba(255,152,0,0.15),transparent_80%)]'
                  }`}></div>
                )}
                
                <div className={actualTheme === 'dark' ? "bg-[#0c0c0c] h-full w-full min-w-0 rounded-sm p-6 relative z-10 flex flex-col" : "h-full w-full min-w-0 relative z-10 flex flex-col"}>
                  {/* Subtle emblem watermark */}
                  {actualTheme === 'dark' && <div className="absolute top-2 right-2 text-6xl kanji-emblem text-foreground opacity-[0.02] pointer-events-none">悟</div>}

                  <div className="flex justify-between items-start mb-5">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {actualTheme === 'dark' ? (
                          <>
                            <span className="text-[9px] font-black text-foreground bg-darkblue px-2 py-0.5 rounded-sm border border-accent/30 uppercase tracking-widest">{h.platform}</span>
                            {isUrgent && <span className="flex items-center gap-1 text-[9px] font-black text-[#070707] bg-primary px-2 py-0.5 rounded-sm border border-primaryLight uppercase tracking-widest animate-pulse-fast"><Flame size={10} /> CRITICAL</span>}
                          </>
                        ) : (
                          <>
                            <span className="text-[10px] font-bold text-muted bg-panelAlt px-2 py-0.5 rounded-md border border-borderSubtle uppercase tracking-wider">{h.platform}</span>
                            {isUrgent && <span className="flex items-center gap-1 text-[10px] font-bold text-danger bg-danger/10 px-2 py-0.5 rounded-md uppercase tracking-wider">{copy.critical}</span>}
                          </>
                        )}
                      </div>
                      <h3 className={`font-black text-2xl leading-tight mb-2 uppercase transition-colors text-foreground break-words hyphens-auto ${
                        actualTheme === 'dark' 
                          ? (isUrgent ? 'group-hover:text-glow-orange' : 'group-hover:text-primaryLight')
                          : 'group-hover:text-primary'
                      }`}>{h.name}</h3>
                    </div>
                  </div>

                  <div className="mb-4">
                    <PowerBar ki={ki} urgent={isUrgent} />
                  </div>
                  
                  <div className={actualTheme === 'dark' ? "mb-6 min-w-0 bg-black/40 p-3 rounded border border-borderSubtle" : "mb-6 min-w-0 p-4 rounded-lg bg-panelAlt border border-borderSubtle"}>
                    <DragonBallProgress 
                      stages={stages} 
                      activeStageNumber={activeStage?.stageNumber} 
                    />
                    <div className={actualTheme === 'dark' ? "mt-3 flex flex-wrap gap-2 justify-between items-center border-t border-borderMuted pt-2" : "mt-4 flex flex-wrap gap-2 justify-between items-center border-t border-borderSubtle pt-3"}>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${actualTheme === 'dark' ? 'text-[var(--text-gray-500)]' : 'text-muted'}`}>CURRENT STAGE</span>
                      <span className={`text-xs font-black uppercase ${actualTheme === 'dark' ? 'text-primaryLight' : 'text-primary'}`}>{activeStage ? copy.stages[activeStage.stageNumber - 1] : 'FINALE'}</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6 flex-grow">
                    {h.registrationDeadline && regStatus && (
                      <div className={`flex flex-col p-3 rounded border ${actualTheme === 'dark' ? 'bg-[#0a0a0a] border-borderSubtle' : 'bg-panelAlt border-borderSubtle'}`}>
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${actualTheme === 'dark' ? 'text-[var(--text-gray-400)]' : 'text-muted'}`}>Registration</span>
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-sm border ${
                              actualTheme === 'dark' 
                                ? `bg-black ${regStatus.status === 'extreme' ? 'text-red-500 border-red-500/30' : regStatus.status === 'urgent' ? 'text-primary border-primary/30' : regStatus.status === 'passed' ? 'text-[var(--text-gray-500)] border-gray-700' : 'text-primaryLight border-primaryLight/30'}` 
                                : `${regStatus.status === 'extreme' || regStatus.status === 'urgent' ? 'bg-danger/10 text-danger border-danger/20' : regStatus.status === 'upcoming' ? 'bg-warning/10 text-warning border-warning/20' : regStatus.status === 'passed' ? 'bg-panelAlt text-muted border-borderSubtle' : 'bg-success/10 text-success border-success/20'}`
                            }`}>{regStatus.label}</span>
                          </div>
                          <div className={`text-[10px] font-black px-2 py-0.5 rounded tracking-widest ${actualTheme === 'dark' ? 'text-foreground bg-white/10' : 'text-foreground bg-card border border-borderSubtle'}`}><LiveCountdown dateStr={h.registrationDeadline} /></div>
                        </div>
                        <KamehamehaTrack 
                          label="Registration" 
                          startTime={parseISO(h.registrationDeadline).getTime() - (14 * 24 * 60 * 60 * 1000)} 
                          deadline={parseISO(h.registrationDeadline).getTime()} 
                          completed={stages[1].state === 'COMPLETED' || stages[1].state === 'COMPLETED_FINAL'} 
                          compact={true} 
                        />
                      </div>
                    )}
                    
                    {h.submissionDeadline && subStatus && (
                      <div className={`flex flex-col p-3 rounded border ${actualTheme === 'dark' ? 'bg-[#0a0a0a] border-borderSubtle' : 'bg-panelAlt border-borderSubtle'}`}>
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${actualTheme === 'dark' ? 'text-[var(--text-gray-400)]' : 'text-muted'}`}>Submission</span>
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-sm border ${
                              actualTheme === 'dark' 
                                ? `bg-black ${subStatus.status === 'extreme' ? 'text-red-500 border-red-500/30' : subStatus.status === 'urgent' ? 'text-primary border-primary/30' : subStatus.status === 'passed' ? 'text-[var(--text-gray-500)] border-gray-700' : 'text-primaryLight border-primaryLight/30'}` 
                                : `${subStatus.status === 'extreme' || subStatus.status === 'urgent' ? 'bg-danger/10 text-danger border-danger/20' : subStatus.status === 'upcoming' ? 'bg-warning/10 text-warning border-warning/20' : subStatus.status === 'passed' ? 'bg-panelAlt text-muted border-borderSubtle' : 'bg-success/10 text-success border-success/20'}`
                            }`}>{subStatus.label}</span>
                          </div>
                          <div className={`text-[10px] font-black px-2 py-0.5 rounded tracking-widest ${actualTheme === 'dark' ? 'text-foreground bg-white/10' : 'text-foreground bg-card border border-borderSubtle'}`}><LiveCountdown dateStr={h.submissionDeadline} /></div>
                        </div>
                        <KamehamehaTrack 
                          label="Submission" 
                          startTime={parseISO(h.submissionDeadline).getTime() - (14 * 24 * 60 * 60 * 1000)} 
                          deadline={parseISO(h.submissionDeadline).getTime()} 
                          completed={stages[5].state === 'COMPLETED' || stages[5].state === 'COMPLETED_FINAL'} 
                          compact={true} 
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-2 mt-auto">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black uppercase tracking-widest ${actualTheme === 'dark' ? 'text-[var(--text-gray-500)]' : 'text-muted'}`}>{copy.combatUnits}</span>
                      <div className="flex -space-x-1.5">
                        {h.teams.flatMap(t => t.members).filter((v, i, a) => a.indexOf(v) === i).slice(0, 4).map((m, idx) => (
                          <div key={idx} className={`w-6 h-6 flex items-center justify-center text-[9px] font-black z-10 ${actualTheme === 'dark' ? 'dragon-ball text-black border border-background' : 'bg-primary/10 text-primary border border-background rounded-full'}`} title={m}>
                            {m.charAt(0)}
                          </div>
                        ))}
                        {h.teams.flatMap(t => t.members).filter((v, i, a) => a.indexOf(v) === i).length > 4 && (
                          <div className={`w-6 h-6 flex items-center justify-center text-[8px] font-black z-0 relative ml-1 ${actualTheme === 'dark' ? 'dragon-ball-dark text-foreground border border-background' : 'bg-panelAlt text-muted border border-background rounded-full'}`}>
                            +{h.teams.flatMap(t => t.members).filter((v, i, a) => a.indexOf(v) === i).length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button className={`relative overflow-hidden flex items-center justify-center sm:justify-start w-full sm:w-auto gap-2 text-xs font-black px-4 py-2.5 rounded-sm transition-all duration-300 ${
                      actualTheme === 'dark' 
                        ? (isUrgent 
                          ? 'bg-primary text-[#070707] border border-primaryLight box-glow-orange group-hover:-translate-y-1' 
                          : 'bg-background text-primaryLight border border-primary/40 group-hover:bg-primary group-hover:text-[#070707] group-hover:border-primaryLight group-hover:box-glow-orange group-hover:-translate-y-1')
                        : 'bg-primary text-primaryForeground font-bold border border-transparent hover:bg-accentForeground group-hover:-translate-y-1 rounded-md'
                    }`}>
                      {actualTheme === 'dark' && <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-700"></div>}
                      {copy.warRoom} <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Detail Modal Overlay */}
      <AnimatePresence>
        {selectedHackathon && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-background/70 backdrop-blur-md"
          >
            {(() => {
              const stages = calculateHackathonStages(selectedHackathon, data);
              const isMissionComplete = stages[6].state === 'COMPLETED_FINAL';
              const ki = calculatePowerLevel(stages, selectedHackathon);
              
              return (
              <motion.div 
                initial={{ scale: 0.9, y: 30, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: -20, opacity: 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                className="bg-card w-full max-w-5xl max-h-[90vh] rounded-xl border border-primary/30 shadow-[0_20px_60px_rgba(245,124,0,0.2)] flex flex-col overflow-hidden relative"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primaryLight via-primary to-danger z-50"></div>
                <button 
                  onClick={() => setSelectedId(null)}
                  className={`absolute top-6 right-6 p-2.5 backdrop-blur-md rounded-lg transition-all z-50 group flex items-center justify-center ${actualTheme === 'dark' ? 'bg-overlay hover:bg-primary/20 border border-borderMuted hover:border-primary/50 text-[var(--text-gray-400)] hover:text-foreground shadow-[0_4px_20px_rgba(0,0,0,0.3)]' : 'bg-card border border-borderSubtle hover:bg-panelAlt text-muted hover:text-foreground shadow-sm'}`}
                >
                  <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
                
                <div className="w-full h-full overflow-y-auto custom-scrollbar flex flex-col relative">
              
              {/* Header */}
              <div className={`shrink-0 p-6 md:p-8 border-b relative overflow-hidden ${actualTheme === 'dark' ? 'bg-background border-borderSubtle' : 'bg-card border-borderSubtle'}`}>
                {actualTheme === 'dark' && (
                  <>
                    <div className="absolute top-0 right-0 w-96 h-96 bg-ki-orange-gradient opacity-20 pointer-events-none"></div>
                    <div className="absolute -bottom-10 -right-10 text-[200px] kanji-emblem text-foreground opacity-[0.02] pointer-events-none">悟</div>
                  </>
                )}
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    {actualTheme === 'dark' ? (
                      <span className="bg-darkblue border border-accent/30 px-2 py-1 rounded text-[10px] font-black text-foreground uppercase tracking-widest">{selectedHackathon.platform}</span>
                    ) : (
                      <span className="bg-panelAlt border border-borderSubtle px-2 py-1 rounded-md text-[10px] font-bold text-muted uppercase tracking-wider">{selectedHackathon.platform}</span>
                    )}
                    <span className={`text-xs flex items-center gap-1 uppercase tracking-wider ${actualTheme === 'dark' ? 'text-[var(--text-gray-400)] font-bold' : 'text-muted font-bold'}`}>
                      <Target size={12} className="text-primary" /> {selectedHackathon.format}
                    </span>
                  </div>
                  <h2 className={`text-3xl md:text-5xl font-black uppercase tracking-tight mb-2 ${actualTheme === 'dark' ? 'text-foreground text-glow-orange' : 'text-foreground'}`}>
                    {selectedHackathon.name}
                  </h2>
                  <div className={`flex flex-col md:flex-row md:items-center gap-4 md:gap-8 font-black text-sm tracking-widest mt-4 ${actualTheme === 'dark' ? 'text-primaryLight' : 'text-primary'}`}>
                    <div className="flex items-center gap-2">
                      <Activity size={16} /> 
                      {copy.missionStatus}: {isMissionComplete ? 'COMPLETE' : 'ACTIVE'}
                    </div>
                    <div className="flex items-center gap-2 text-foreground group/ki relative cursor-pointer" tabIndex={0}>
                      <span className={actualTheme === 'dark' ? 'text-[var(--text-gray-400)]' : 'text-muted'}>{copy.powerLevel}:</span> {ki.total.toLocaleString()} {actualTheme === 'dark' ? 'KI' : 'PTS'}
                      {/* Tooltip in modal */}
                      <div className={`absolute top-full left-0 mt-2 w-48 border rounded p-3 opacity-0 pointer-events-none group-hover/ki:opacity-100 group-focus/ki:opacity-100 transition-opacity z-20 shadow-xl ${actualTheme === 'dark' ? 'bg-[#0a0a0a] border-borderMuted' : 'bg-card border-borderSubtle'}`}>
                        <div className={`text-[10px] font-black uppercase tracking-widest mb-2 border-b pb-1 ${actualTheme === 'dark' ? 'text-[var(--text-gray-500)] border-borderSubtle' : 'text-muted border-borderSubtle'}`}>KI BREAKDOWN</div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className={actualTheme === 'dark' ? 'text-[var(--text-gray-400)]' : 'text-muted'}>Stages</span>
                          <span className="text-foreground font-bold">+{ki.stagesCompleted}</span>
                        </div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className={actualTheme === 'dark' ? 'text-[var(--text-gray-400)]' : 'text-muted'}>Pressure</span>
                          <span className="text-primary font-bold">+{ki.deadlinePressure}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`mt-6 pt-4 border-t max-w-xl ${actualTheme === 'dark' ? 'border-borderMuted' : 'border-borderSubtle'}`}>
                    <DragonBallProgress stages={stages} />
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 md:p-8 space-y-8 bg-card relative">
                
                {/* Details Section */}
                <div className="grid gap-6 md:grid-cols-2 relative z-10">
                  <div className={`p-6 rounded border relative group transition-colors ${actualTheme === 'dark' ? 'bg-panel border-borderSubtle hover:border-primary/30' : 'bg-panelAlt border-borderSubtle'}`}>
                    {actualTheme === 'dark' && <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-[inherit]"></div>}
                    <div className="relative z-10">
                    <h4 className={`text-xs uppercase font-black tracking-widest mb-4 flex items-center gap-2 ${actualTheme === 'dark' ? 'text-primaryLight' : 'text-foreground'}`}>
                      <Target size={16} className={actualTheme === 'light' ? 'text-primary' : ''} /> {copy.missionTimeline}
                    </h4>
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2">
                        <span className={`text-sm font-bold uppercase tracking-wide ${actualTheme === 'dark' ? 'text-[var(--text-gray-400)]' : 'text-muted'}`}>Registration</span>
                        <div className="text-foreground font-black uppercase text-right flex flex-wrap items-center gap-2">
                          <div className={`text-xs ${actualTheme === 'dark' ? 'text-[var(--text-gray-500)]' : 'text-muted'}`}>{selectedHackathon.registrationDeadline}</div>
                          <div className={`px-2 py-1 rounded tracking-widest ${actualTheme === 'dark' ? 'bg-white/10' : 'bg-panel border border-borderSubtle'}`}><LiveCountdown dateStr={selectedHackathon.registrationDeadline} /></div>
                        </div>
                      </div>
                      <KamehamehaTrack 
                        label="Registration" 
                        startTime={parseISO(selectedHackathon.registrationDeadline).getTime() - (14 * 24 * 60 * 60 * 1000)} 
                        deadline={parseISO(selectedHackathon.registrationDeadline).getTime()} 
                        completed={stages[1].state === 'COMPLETED' || stages[1].state === 'COMPLETED_FINAL'} 
                      />
                      <div className={`flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-t pt-4 pb-2 mt-4 ${actualTheme === 'dark' ? 'border-borderSubtle' : 'border-borderMuted'}`}>
                        <span className={`text-sm font-bold uppercase tracking-wide ${actualTheme === 'dark' ? 'text-[var(--text-gray-400)]' : 'text-muted'}`}>Submission</span>
                        <div className="text-foreground font-black uppercase text-right flex flex-wrap items-center gap-2">
                          <div className={`text-xs ${actualTheme === 'dark' ? 'text-[var(--text-gray-500)]' : 'text-muted'}`}>{selectedHackathon.submissionDeadline || 'N/A'}</div>
                          {selectedHackathon.submissionDeadline && (
                            <div className={`px-2 py-1 rounded tracking-widest ${actualTheme === 'dark' ? 'bg-white/10' : 'bg-panel border border-borderSubtle'}`}><LiveCountdown dateStr={selectedHackathon.submissionDeadline} /></div>
                          )}
                        </div>
                      </div>
                      {selectedHackathon.submissionDeadline && (
                        <KamehamehaTrack 
                          label="Submission" 
                          startTime={parseISO(selectedHackathon.submissionDeadline).getTime() - (14 * 24 * 60 * 60 * 1000)} 
                          deadline={parseISO(selectedHackathon.submissionDeadline).getTime()} 
                          completed={stages[5].state === 'COMPLETED' || stages[5].state === 'COMPLETED_FINAL'} 
                        />
                      )}
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                        <span className={`text-sm font-bold uppercase tracking-wide ${actualTheme === 'dark' ? 'text-[var(--text-gray-400)]' : 'text-muted'}`}>Event Dates</span>
                        <span className="text-warning font-black uppercase">{selectedHackathon.eventDates}</span>
                      </div>
                      <button 
                        onClick={() => generateICS(selectedHackathon)}
                        className={`w-full mt-4 flex items-center justify-center gap-2 font-bold uppercase tracking-wider text-xs px-4 py-2 rounded transition-colors border ${actualTheme === 'dark' ? 'bg-white/5 hover:bg-white/10 text-foreground border-borderMuted' : 'bg-panel border-borderSubtle text-muted hover:bg-panelAlt hover:text-foreground'}`}
                      >
                        <Calendar size={14} /> EXPORT DEADLINES TO CALENDAR (.ICS)
                      </button>
                    </div>
                    </div>
                  </div>
                  
                  <div className={`p-6 rounded border relative group transition-colors ${actualTheme === 'dark' ? 'bg-panel border-borderSubtle hover:border-primary/30' : 'bg-panelAlt border-borderSubtle'}`}>
                    {actualTheme === 'dark' && <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-[inherit]"></div>}
                    <div className="relative z-10">
                    <h4 className={`text-xs uppercase font-black tracking-widest mb-4 flex items-center gap-2 ${actualTheme === 'dark' ? 'text-primaryLight' : 'text-foreground'}`}>
                      <Zap size={16} className={actualTheme === 'light' ? 'text-primary' : ''} /> {copy.intelAndCoords}
                    </h4>
                    <p className={`text-sm leading-relaxed mb-6 font-medium ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {selectedHackathon.notes || 'No specific mission intel provided.'}
                    </p>
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <a 
                          href={selectedHackathon.registrationLink}
                          target="_blank"
                          rel="noreferrer"
                          className={`flex-1 relative overflow-hidden inline-flex items-center justify-center gap-2 text-xs font-black px-4 py-3 rounded uppercase tracking-wider transition-colors group/btn ${actualTheme === 'dark' ? 'text-[#070707] bg-primary hover:bg-primaryLight' : 'bg-primary text-primaryForeground hover:bg-accentForeground'}`}
                        >
                          {actualTheme === 'dark' && <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 translate-x-[-150%] group-hover/btn:translate-x-[150%] transition-transform duration-700"></div>}
                          <LinkIcon size={14} /> Registration
                        </a>
                        {selectedHackathon.submissionLink && (
                          <a 
                            href={selectedHackathon.submissionLink}
                            target="_blank"
                            rel="noreferrer"
                            className={`flex-1 inline-flex items-center justify-center gap-2 text-xs font-black px-4 py-3 rounded uppercase tracking-wider transition-colors ${actualTheme === 'dark' ? 'text-primary border border-primary/50 hover:bg-primary/10' : 'text-primary border border-primary/30 hover:bg-primary/5'}`}
                          >
                            <LinkIcon size={14} /> Submission
                          </a>
                        )}
                      </div>
                      {selectedHackathon.problemStatementLink && (
                        <a 
                          href={selectedHackathon.problemStatementLink}
                          target="_blank"
                          rel="noreferrer"
                          className={`w-full inline-flex items-center justify-center gap-2 text-xs font-black border transition-colors px-4 py-3 rounded uppercase tracking-wider ${actualTheme === 'dark' ? 'text-blue-400 border-blue-500/50 hover:bg-blue-500/10' : 'text-blue-600 border-blue-600/40 hover:bg-blue-50 bg-blue-50/50'}`}
                        >
                          <LinkIcon size={14} /> View Problem Statement
                        </a>
                      )}
                    </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2 relative z-10">
                  <div className="space-y-8">
                    {/* Registration Status */}
                    <div className={`p-6 rounded border ${actualTheme === 'dark' ? 'bg-panel border-borderSubtle' : 'bg-panelAlt border-borderSubtle'}`}>
                      <h4 className={`text-xs uppercase font-black tracking-widest mb-5 flex items-center gap-2 ${actualTheme === 'dark' ? 'text-[var(--text-gray-400)]' : 'text-[var(--text-gray-400)]'}`}>
                        <Check size={16} className="text-success" /> {copy.registrationStatus}
                      </h4>
                      <div className="flex flex-col gap-3">
                        {data.members.map(m => {
                          const status = data.registrationStatus[selectedHackathon.id]?.[m] || 'N/A';
                          return (
                            <button 
                              key={m}
                              onClick={() => handleCycleStatus(selectedHackathon.id, m, status)}
                              className={`flex items-center justify-between px-4 py-3 rounded border transition-colors group ${actualTheme === 'dark' ? 'bg-panelAlt border-borderSubtle hover:border-primary/40 hover:bg-[#1a1a1a]' : 'bg-card border-borderSubtle hover:border-primary/50 hover:bg-card/80'}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 flex items-center justify-center text-xs font-black ${actualTheme === 'dark' ? 'dragon-ball text-black' : 'bg-primary/10 text-primary border border-primary/20 rounded-full'}`}>
                                  {m.charAt(0)}
                                </div>
                                <span className={`text-sm font-bold uppercase ${actualTheme === 'dark' ? 'text-gray-200' : 'text-foreground'}`}>{m}</span>
                              </div>
                              {getRegStatusDisplay(status)}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Teams & Projects */}
                    <div className={`p-6 rounded border ${actualTheme === 'dark' ? 'bg-panel border-borderSubtle' : 'bg-panelAlt border-borderSubtle'}`}>
                      <h4 className={`text-xs uppercase font-black tracking-widest mb-5 flex items-center gap-2 ${actualTheme === 'dark' ? 'text-[var(--text-gray-400)]' : 'text-[var(--text-gray-400)]'}`}>
                        <Users size={16} className={actualTheme === 'light' ? 'text-primary' : 'text-primary'} /> {copy.combatUnits}
                      </h4>
                      {selectedHackathon.teams.length === 0 ? (
                        <div className={`text-center py-6 rounded border border-dashed ${actualTheme === 'dark' ? 'bg-panelAlt border-borderSubtle' : 'bg-card border-borderSubtle'}`}>
                          <p className={`text-sm font-medium uppercase tracking-wider ${actualTheme === 'dark' ? 'text-[var(--text-gray-500)]' : 'text-[var(--text-gray-400)]'}`}>No units formed</p>
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          {selectedHackathon.teams.map((team, idx) => {
                            const project = selectedHackathon.projects?.find(p => p.team === team.teamLabel);
                            return (
                              <div key={idx} className={`rounded p-5 border transition-colors ${actualTheme === 'dark' ? 'bg-panelAlt border-borderSubtle hover:border-primary/30' : 'bg-card border-borderSubtle hover:border-primary/40'}`}>
                                <div className="flex flex-col mb-4 gap-3">
                                  <h5 className="font-black text-lg text-foreground tracking-wider uppercase flex items-center gap-2">
                                    <Shield size={16} className={actualTheme === 'dark' ? 'text-primaryLight' : 'text-primary'} /> {team.teamLabel}
                                  </h5>
                                  <div className="flex flex-wrap gap-2">
                                    {team.members.map((m, midx) => (
                                      <div key={midx} className={`flex items-center gap-1.5 py-1 pl-1 pr-3 rounded-full ${actualTheme === 'dark' ? 'bg-background border border-borderMuted' : 'bg-panelAlt border border-borderSubtle'}`}>
                                        <div className={`w-5 h-5 flex items-center justify-center text-[9px] font-black z-10 flex-shrink-0 ${actualTheme === 'dark' ? 'dragon-ball text-black' : 'bg-primary/20 text-primary border border-primary/30 rounded-full'}`} title={m}>
                                          {m.charAt(0)}
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${actualTheme === 'dark' ? 'text-gray-300' : 'text-foreground'}`}>{m}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                
                                <div className={`rounded p-3 space-y-3 ${actualTheme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-panelAlt'}`}>
                                  <div className="flex items-center gap-2">
                                    <FolderKanban size={14} className="text-primary" />
                                    <span className={`font-bold text-sm uppercase ${actualTheme === 'dark' ? 'text-gray-200' : 'text-foreground'}`}>
                                      {project?.projectName || 'NO PROJECT ASSIGNED'}
                                    </span>
                                    <button 
                                      onClick={() => {
                                        const val = window.prompt('Enter Project Name:', project?.projectName || '');
                                        if (val !== null && val.trim() !== '') {
                                          updateProject(selectedHackathon.id, team.teamLabel, { projectName: val });
                                        }
                                      }}
                                      className={`ml-2 px-2 py-1 text-[10px] font-black uppercase rounded border transition-colors ${actualTheme === 'dark' ? 'bg-background border-borderMuted hover:border-primary text-[var(--text-gray-400)]' : 'bg-card border-borderSubtle hover:border-primary text-muted'}`}
                                      title="Edit Project Name"
                                    >
                                      EDIT
                                    </button>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Activity size={12} className="text-[var(--text-gray-400)]" />
                                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-gray-400)]">Status</span>
                                    </div>
                                    <select
                                      value={project?.buildStatus || 'Not Started'}
                                      onChange={(e) => updateProject(selectedHackathon.id, team.teamLabel, { buildStatus: e.target.value as any })}
                                      className={`border text-[10px] font-black uppercase rounded px-2 py-1 focus:outline-none focus:border-accent ${actualTheme === 'dark' ? 'bg-background border-borderMuted text-accent' : 'bg-card border-borderSubtle text-primary'}`}
                                    >
                                      <option value="Not Started">NOT STARTED</option>
                                      <option value="Idea Stage">IDEA STAGE</option>
                                      <option value="In Progress">IN PROGRESS</option>
                                      <option value="Submitted">SUBMITTED</option>
                                      <option value="Done">DONE</option>
                                    </select>
                                  </div>
                                  
                                  {project && (
                                    <div className={`pt-2 border-t flex flex-wrap sm:flex-nowrap gap-2 ${actualTheme === 'dark' ? 'border-borderSubtle' : 'border-borderMuted'}`}>
                                      {/* GitHub */}
                                      <div className={`flex flex-1 text-[9px] font-black uppercase tracking-widest rounded transition-colors border ${project.repoLink ? 'border-borderMuted' : `border-borderSubtle ${actualTheme === 'dark' ? 'text-[var(--text-gray-500)]' : 'text-[var(--text-gray-400)]'}`}`}>
                                        {project.repoLink ? (
                                          <a href={project.repoLink} target="_blank" rel="noreferrer" className={`flex-1 flex items-center justify-center py-1.5 ${actualTheme === 'dark' ? 'bg-white/10 text-foreground hover:bg-white/20' : 'bg-panel border-r border-borderSubtle text-foreground hover:bg-panelAlt'}`}>
                                            GITHUB
                                          </a>
                                        ) : (
                                          <div className={`flex-1 flex items-center justify-center py-1.5 cursor-not-allowed ${actualTheme === 'light' && 'bg-panelAlt border-r border-borderSubtle'}`}>
                                            GITHUB
                                          </div>
                                        )}
                                        <button 
                                          onClick={() => {
                                            const val = window.prompt('Enter GitHub Repository URL:', project.repoLink || 'https://github.com/');
                                            if (val !== null) updateProject(selectedHackathon.id, team.teamLabel, { repoLink: val });
                                          }}
                                          className={`px-2 flex items-center justify-center transition-colors ${project.repoLink ? (actualTheme === 'dark' ? 'border-l border-borderMuted bg-white/5 hover:bg-white/20' : 'bg-card hover:bg-panel text-[var(--text-gray-400)]') : (actualTheme === 'dark' ? 'border-l border-borderSubtle hover:bg-white/10 hover:text-foreground' : 'bg-card hover:bg-panel text-[var(--text-gray-400)]')}`}
                                          title="Edit URL"
                                        >
                                          ✎
                                        </button>
                                      </div>

                                      {/* Demo */}
                                      <div className={`flex flex-1 text-[9px] font-black uppercase tracking-widest rounded transition-colors border ${project.demoLink ? 'border-primary/30' : `border-borderSubtle ${actualTheme === 'dark' ? 'text-[var(--text-gray-500)]' : 'text-[var(--text-gray-400)]'}`}`}>
                                        {project.demoLink ? (
                                          <a href={project.demoLink} target="_blank" rel="noreferrer" className={`flex-1 flex items-center justify-center py-1.5 text-primary hover:bg-primary/30 ${actualTheme === 'dark' ? 'bg-primary/20' : 'bg-primary/10 border-r border-primary/20'}`}>
                                            DEMO
                                          </a>
                                        ) : (
                                          <div className={`flex-1 flex items-center justify-center py-1.5 cursor-not-allowed ${actualTheme === 'light' && 'bg-panelAlt border-r border-borderSubtle'}`}>
                                            DEMO
                                          </div>
                                        )}
                                        <button 
                                          onClick={() => {
                                            const val = window.prompt('Enter Demo / Devpost URL:', project.demoLink || 'https://devpost.com/software/');
                                            if (val !== null) updateProject(selectedHackathon.id, team.teamLabel, { demoLink: val });
                                          }}
                                          className={`px-2 flex items-center justify-center transition-colors ${project.demoLink ? (actualTheme === 'dark' ? 'border-l border-primary/30 bg-primary/10 hover:bg-primary/30 text-primary' : 'bg-card hover:bg-primary/10 text-primary') : (actualTheme === 'dark' ? 'border-l border-borderSubtle hover:bg-primary/10 hover:text-primary' : 'bg-card hover:bg-panel text-[var(--text-gray-400)]')}`}
                                          title="Edit URL"
                                        >
                                          ✎
                                        </button>
                                      </div>

                                      {/* Slides */}
                                      <div className={`flex flex-1 text-[9px] font-black uppercase tracking-widest rounded transition-colors border ${project.pptLink ? 'border-blue-500/30' : `border-borderSubtle ${actualTheme === 'dark' ? 'text-[var(--text-gray-500)]' : 'text-[var(--text-gray-400)]'}`}`}>
                                        {project.pptLink ? (
                                          <a href={project.pptLink} target="_blank" rel="noreferrer" className={`flex-1 flex items-center justify-center py-1.5 text-blue-400 hover:bg-blue-500/30 ${actualTheme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-500/10 border-r border-blue-500/20'}`}>
                                            SLIDES
                                          </a>
                                        ) : (
                                          <div className={`flex-1 flex items-center justify-center py-1.5 cursor-not-allowed ${actualTheme === 'light' && 'bg-panelAlt border-r border-borderSubtle'}`}>
                                            SLIDES
                                          </div>
                                        )}
                                        <button 
                                          onClick={() => {
                                            const val = window.prompt('Enter Pitch Deck / PPT URL:', project.pptLink || 'https://docs.google.com/presentation/d/');
                                            if (val !== null) updateProject(selectedHackathon.id, team.teamLabel, { pptLink: val });
                                          }}
                                          className={`px-2 flex items-center justify-center transition-colors ${project.pptLink ? (actualTheme === 'dark' ? 'border-l border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/30 text-blue-400' : 'bg-card hover:bg-blue-500/10 text-blue-500') : (actualTheme === 'dark' ? 'border-l border-borderSubtle hover:bg-blue-500/10 hover:text-blue-400' : 'bg-card hover:bg-panel text-[var(--text-gray-400)]')}`}
                                          title="Edit URL"
                                        >
                                          ✎
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Submission Checklist */}
                    <div className={`p-6 rounded border ${actualTheme === 'dark' ? 'bg-panel border-borderSubtle' : 'bg-panelAlt border-borderSubtle'}`}>
                      <h4 className="text-xs uppercase text-[var(--text-gray-400)] font-black tracking-widest mb-5 flex items-center gap-2">
                        <CheckSquare size={16} className="text-primary" /> SUBMISSION READINESS
                      </h4>
                      <div className="flex flex-col gap-2">
                        {(data.submissionChecklist || []).map(item => {
                          const state = data.checklistState?.[selectedHackathon.id]?.[item] || { done: false };
                          return (
                            <div key={item} className={`flex items-center justify-between p-3 rounded border transition-colors ${state.done ? 'bg-success/5 border-success/20' : (actualTheme === 'dark' ? 'bg-panelAlt border-borderSubtle hover:border-primary/40' : 'bg-card border-borderSubtle hover:border-primary/40')}`}>
                              <div className="flex items-center gap-3 flex-1">
                                <button 
                                  onClick={() => updateChecklistItem(selectedHackathon.id, item, { done: !state.done })}
                                  className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${state.done ? 'bg-success text-foreground border-success shadow-[0_0_10px_rgba(56,142,60,0.4)]' : 'bg-background border-borderMuted hover:border-primary'}`}
                                >
                                  {state.done && <Check size={14} strokeWidth={3} />}
                                </button>
                                <span className={`text-xs font-bold uppercase ${state.done ? 'text-[var(--text-gray-500)] line-through' : (actualTheme === 'dark' ? 'text-gray-200' : 'text-gray-800')}`}>
                                  {item}
                                </span>
                              </div>
                              <select 
                                value={state.owner || ''}
                                onChange={(e) => updateChecklistItem(selectedHackathon.id, item, { owner: e.target.value || undefined })}
                                className={`bg-background border text-[9px] font-black uppercase rounded px-2 py-1 focus:outline-none max-w-[100px] truncate ${state.owner ? 'border-primary/50 text-primary' : 'border-borderMuted text-[var(--text-gray-500)]'}`}
                              >
                                <option value="">UNASSIGNED</option>
                                {data.members.map(m => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Chat Section */}
                  <div className="bg-panel rounded border border-borderSubtle flex flex-col h-[500px] lg:h-auto overflow-hidden">
                    <div className="p-4 border-b border-borderSubtle bg-panelAlt flex items-center justify-between">
                      <h4 className="text-xs uppercase text-[var(--text-gray-400)] font-black tracking-widest flex items-center gap-2">
                        <MessageSquare size={16} className="text-warning" /> COMM LINK
                      </h4>
                      <select 
                        value={senderName}
                        onChange={e => setSenderName(e.target.value)}
                        className="bg-background border border-borderMuted text-xs font-bold uppercase rounded px-2 py-1 text-gray-300 focus:outline-none focus:border-primary"
                      >
                        {data.members.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[linear-gradient(rgba(245,124,0,0.02)_1px,transparent_1px)]" style={{ backgroundSize: '100% 40px' }}>
                      {chats.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-primary/30">
                          <Zap size={32} className="mb-3 opacity-50" />
                          <p className="text-xs font-black uppercase tracking-widest">Comm link idle</p>
                        </div>
                      ) : (
                        chats.map(msg => {
                          const isMe = msg.sender === senderName;
                          return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                              <span className="text-[9px] font-black uppercase text-[var(--text-gray-500)] mb-1 px-1 tracking-widest">{msg.sender}</span>
                              <div className={`px-4 py-3 rounded max-w-[85%] text-sm font-bold shadow-sm border ${
                                isMe 
                                  ? 'bg-primary/20 text-foreground border-primary/40 rounded-tr-none' 
                                  : 'bg-white/5 text-gray-200 border-borderMuted rounded-tl-none'
                              }`}>
                                {msg.text}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    
                    {/* Chat Input */}
                    <form onSubmit={handleSendChat} className="p-3 bg-panelAlt border-t border-borderSubtle flex gap-2">
                      <input 
                        type="text"
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        placeholder="TRANSMIT MESSAGE..."
                        className="flex-1 bg-background border border-borderMuted rounded px-4 py-2 text-xs font-black text-foreground placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition-colors uppercase tracking-wider"
                      />
                      <button 
                        type="submit"
                        disabled={!chatInput.trim()}
                        className={`disabled:opacity-50 disabled:bg-gray-800 disabled:text-[var(--text-gray-500)] rounded px-4 transition-colors flex items-center justify-center border border-transparent font-black ${actualTheme === 'dark' ? 'bg-primary hover:bg-primaryLight text-[#070707] shadow-[0_0_10px_rgba(245,124,0,0.2)]' : 'bg-primary hover:bg-accentForeground text-primaryForeground shadow-sm'}`}
                      >
                        <Send size={16} />
                      </button>
                    </form>
                  </div>
                </div>

              </div>
              </div>
            </motion.div>
            );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
