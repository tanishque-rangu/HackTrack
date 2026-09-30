import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useTheme } from './ThemeProvider';
import { ThemeTransitionOverlay } from './ThemeTransitionOverlay';
import { playThemeAudio, stopThemeAudio } from './sound';

interface ThemeTransitionContextType {
  changeTheme: (next: 'dark' | 'light' | 'system', originRect?: DOMRect | null) => void;
  isPlaying: boolean;
  reducedEffects: boolean;
  setReducedEffects: (val: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
}

const ThemeTransitionContext = createContext<ThemeTransitionContextType | undefined>(undefined);

export const ThemeTransitionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { actualTheme, setTheme } = useTheme();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [direction, setDirection] = useState<'light-to-dark' | 'dark-to-light'>('light-to-dark');
  const [nextTheme, setNextTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [originRect, setOriginRect] = useState<DOMRect | null>(null);

  const [reducedEffects, setReducedEffectsState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('hacktrack-reduced-effects') === 'true';
  });

  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('hacktrack-sound-enabled') === 'true';
  });

  const [announcement, setAnnouncement] = useState<string>('');

  const setReducedEffects = useCallback((val: boolean) => {
    localStorage.setItem('hacktrack-reduced-effects', String(val));
    setReducedEffectsState(val);
  }, []);

  const setSoundEnabled = useCallback((val: boolean) => {
    localStorage.setItem('hacktrack-sound-enabled', String(val));
    setSoundEnabledState(val);
  }, []);

  // System prefers-reduced-motion check
  const systemPrefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const effectiveReducedEffects = reducedEffects || systemPrefersReducedMotion;

  // Change Theme trigger
  const changeTheme = useCallback(
    (next: 'dark' | 'light' | 'system', rect?: DOMRect | null) => {
      if (isPlaying) return; // Prevent double-triggering

      // Determine target theme direction
      let targetTheme: 'dark' | 'light' = 'dark';
      if (next === 'system') {
        targetTheme = (typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
      } else {
        targetTheme = next;
      }

      if (targetTheme === actualTheme) {
        // If theme isn't changing, set directly
        setTheme(next);
        return;
      }

      const dir = actualTheme === 'light' ? 'light-to-dark' : 'dark-to-light';
      
      if (!effectiveReducedEffects) {
        playThemeAudio(dir === 'light-to-dark' ? 'power-up' : 'power-down', soundEnabled);
      }

      setDirection(dir);
      setNextTheme(next);
      setOriginRect(rect || null);
      setIsPlaying(true);
    },
    [isPlaying, actualTheme, setTheme, effectiveReducedEffects, soundEnabled]
  );

  // Lock scroll while transition is playing
  useEffect(() => {
    if (isPlaying) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isPlaying]);

  // Clean cancellation/fallback if tab is hidden mid-animation
  useEffect(() => {
    if (!isPlaying) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden mid-animation -> swap immediately & finish
        setTheme(nextTheme);
        setIsPlaying(false);
        stopThemeAudio();
        setAnnouncement(nextTheme === 'dark' ? 'Dark mode on' : 'Light mode on');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isPlaying, nextTheme, setTheme]);

  const handleThemeSwap = useCallback(() => {
    setTheme(nextTheme);
    const label = nextTheme === 'dark' ? 'Dark mode on' : 'Light mode on';
    setAnnouncement(label);
  }, [nextTheme, setTheme]);

  const handleComplete = useCallback(() => {
    setIsPlaying(false);
    stopThemeAudio();
  }, []);



  return (
    <ThemeTransitionContext.Provider
      value={{
        changeTheme,
        isPlaying,
        reducedEffects,
        setReducedEffects,
        soundEnabled,
        setSoundEnabled,
      }}
    >
      {children}

      <ThemeTransitionOverlay
        isPlaying={isPlaying}
        direction={direction}
        originRect={originRect}
        reducedEffects={effectiveReducedEffects}
        soundEnabled={soundEnabled}
        onThemeSwap={handleThemeSwap}
        onComplete={handleComplete}
      />

      {/* ARIA Live Region for screen reader announcements */}
      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </div>
    </ThemeTransitionContext.Provider>
  );
};

export const useThemeTransition = () => {
  const context = useContext(ThemeTransitionContext);
  if (!context) {
    throw new Error('useThemeTransition must be used within a ThemeTransitionProvider');
  }
  return context;
};
