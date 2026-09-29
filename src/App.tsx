import Dashboard from './components/Dashboard';
import JoinSquad from './components/JoinSquad';
import { getOverallProgress } from './utils/dragonBalls';
import { Moon, Map, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { useTheme, ThemeProvider } from './theme/ThemeProvider';
import { ThemeTransitionProvider, useThemeTransition } from './theme/ThemeTransitionProvider';
import { getCopy } from './copy';
import { StoreProvider, useStore } from './useStore';
import { TimeProvider } from './hooks/useNow';
import { MotionConfig } from 'framer-motion';

function AppContent() {
  const { data, squadInfo, handleJoinSquad } = useStore();
  const { actualTheme } = useTheme();
  const { changeTheme, isPlaying, reducedEffects, setReducedEffects, soundEnabled, setSoundEnabled } = useThemeTransition();
  const copy = getCopy(actualTheme);

  if (!squadInfo) {
    return <JoinSquad onJoin={handleJoinSquad} />;
  }

  const progress = getOverallProgress(data.hackathons, data);
  const completedBalls = progress.completed;

  const handleToggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const next = actualTheme === 'dark' ? 'light' : 'dark';
    changeTheme(next, rect);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background text-foreground overflow-hidden relative">
      {actualTheme === 'dark' && (
        <>
          {/* Global Background Shenron / Ki */}
          <div className="shenron-bg"></div>
          <div className="absolute inset-0 bg-ki-gradient pointer-events-none opacity-30 z-0"></div>
        </>
      )}

      {/* Header */}
      <header className={`px-6 py-4 backdrop-blur-md border-b z-10 flex-shrink-0 relative transition-colors duration-200 ${actualTheme === 'dark' ? 'bg-background/95 border-primary/20 shadow-[0_4px_30px_rgba(245,124,0,0.1)]' : 'bg-card border-borderSubtle'}`}>
        {actualTheme === 'dark' ? (
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-80"></div>
        ) : (
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary"></div>
        )}
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Logo */}
            {actualTheme === 'dark' ? (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primaryLight to-primary shadow-[0_0_20px_rgba(245,124,0,0.5)] flex items-center justify-center border-2 border-background/50 relative overflow-hidden shrink-0">
                <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.4),transparent_60%)]"></div>
                <span className="kanji-emblem text-2xl text-[#fff0cc] text-glow-yellow relative z-10 drop-shadow-md">悟</span>
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-primary text-primaryForeground flex items-center justify-center shrink-0 shadow-sm border border-transparent">
                <Map size={24} strokeWidth={2.5} />
              </div>
            )}
            
            <div className="flex flex-col">
              <h1 className={`text-2xl font-black tracking-widest flex items-center gap-2 ${actualTheme === 'dark' ? 'text-foreground' : 'text-foreground'}`}>
                HACK<span className={`text-primary ${actualTheme === 'dark' ? 'text-glow-orange' : ''}`}>TRACK</span>
              </h1>
              <span className={`text-[10px] uppercase font-bold tracking-[0.2em] flex items-center gap-1 ${actualTheme === 'dark' ? 'text-primaryLight' : 'text-muted'}`}>
                {copy.subtitle}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Header Stats */}
            {actualTheme === 'dark' ? (
              <div className="flex items-center gap-1.5 px-4 py-1.5 bg-card/80 border border-primary/20 rounded-full box-glow-orange relative group" title={`${completedBalls} / 7 Dragon Balls Collected`}>
                <span className="text-[10px] font-bold text-primary mr-2 uppercase tracking-widest group-hover:text-primaryLight transition-colors">{completedBalls} / 7</span>
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <div key={num} className={`w-5 h-5 flex items-center justify-center animate-ki-float ${num <= completedBalls ? 'dragon-ball' : 'bg-gray-800 rounded-full border border-gray-700 opacity-50 grayscale'}`} style={{ animationDelay: `${num * 0.15}s` }}>
                     <span className={`text-[7px] leading-none drop-shadow-sm font-black relative z-10 ${num <= completedBalls ? 'text-red-700 opacity-80' : 'text-gray-900 opacity-30'}`}>★</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-2 bg-card border border-borderSubtle rounded-full shadow-sm">
                <span className="text-xs font-bold text-muted">{copy.dragonBallProgress}</span>
                <span className="text-sm font-black text-foreground">{completedBalls} / 7</span>
              </div>
            )}
            
            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                soundEnabled
                  ? (actualTheme === 'dark' ? 'bg-primary/20 text-primary border border-primary/40' : 'bg-primary/10 text-primary border border-primary/30')
                  : (actualTheme === 'dark' ? 'bg-card border border-borderSubtle text-[var(--text-gray-500)]' : 'bg-card border border-borderSubtle text-muted')
              }`}
              title={soundEnabled ? 'Disable Transition Sound' : 'Enable Transition Sound'}
              aria-label="Toggle Sound"
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* Reduce Effects Toggle */}
            <button
              onClick={() => setReducedEffects(!reducedEffects)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                reducedEffects
                  ? (actualTheme === 'dark' ? 'bg-card border border-borderSubtle text-[var(--text-gray-500)]' : 'bg-card border border-borderSubtle text-muted')
                  : (actualTheme === 'dark' ? 'bg-primary/20 text-primary border border-primary/40' : 'bg-primary/10 text-primary border border-primary/30')
              }`}
              title={reducedEffects ? 'FX: Simple Crossfade' : 'FX: Super Saiyan Aura'}
              aria-label="Toggle Effects Level"
            >
              <Sparkles size={16} className={reducedEffects ? 'opacity-40' : ''} />
            </button>

            {/* Theme Toggle Button */}
            <button 
              onClick={handleToggleTheme}
              disabled={isPlaying}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${actualTheme === 'dark' ? 'bg-card/80 border border-primary/20 text-primary hover:bg-primary/20 shadow-[0_0_10px_rgba(245,124,0,0.2)]' : 'bg-card border border-borderSubtle text-muted hover:text-foreground hover:bg-panelAlt shadow-sm'}`}
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              {actualTheme === 'dark' ? <span className="text-lg">🐉</span> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Scrollable Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 relative scroll-smooth z-10">
        <div className="max-w-7xl mx-auto h-full">
          <Dashboard />
        </div>
      </main>
    </div>
  );
}


export default function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <ThemeTransitionProvider>
        <TimeProvider>
          <StoreProvider>
            <MotionConfig reducedMotion="user">
              <AppContent />
            </MotionConfig>
          </StoreProvider>
        </TimeProvider>
      </ThemeTransitionProvider>
    </ThemeProvider>
  );
}
