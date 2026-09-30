import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GokuSilhouette } from './GokuSilhouette';

interface ThemeTransitionOverlayProps {
  isPlaying: boolean;
  direction: 'light-to-dark' | 'dark-to-light';
  originRect: DOMRect | null;
  reducedEffects: boolean;
  soundEnabled: boolean;
  onThemeSwap: () => void;
  onComplete: () => void;
  onSkip: () => void;
}

export const ThemeTransitionOverlay: React.FC<ThemeTransitionOverlayProps> = ({
  isPlaying,
  direction,
  originRect,
  reducedEffects,
  soundEnabled,
  onThemeSwap,
  onComplete,
  onSkip,
}) => {
  const [phase, setPhase] = useState<'idle' | 'charging' | 'flash' | 'complete'>('idle');
  const [hairColor, setHairColor] = useState<string>(direction === 'light-to-dark' ? '#070707' : '#FFD54F');
  const [isSuperSaiyan, setIsSuperSaiyan] = useState<boolean>(direction === 'dark-to-light');
  const themeSwappedRef = useRef(false);

  // Lock interaction strictly during the transition
  useEffect(() => {
    if (!isPlaying) return;

    // Blur current active element so typing doesn't affect inputs
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const stopEvent = (e: Event) => {
      e.stopPropagation();
      e.preventDefault();
    };

    window.addEventListener('keydown', stopEvent, { capture: true });
    window.addEventListener('keyup', stopEvent, { capture: true });
    window.addEventListener('keypress', stopEvent, { capture: true });
    window.addEventListener('click', stopEvent, { capture: true });
    window.addEventListener('mousedown', stopEvent, { capture: true });
    
    return () => {
      window.removeEventListener('keydown', stopEvent, { capture: true });
      window.removeEventListener('keyup', stopEvent, { capture: true });
      window.removeEventListener('keypress', stopEvent, { capture: true });
      window.removeEventListener('click', stopEvent, { capture: true });
      window.removeEventListener('mousedown', stopEvent, { capture: true });
    };
  }, [isPlaying]);

  // Main animation sequence controller
  useEffect(() => {
    if (!isPlaying) {
      setPhase('idle');
      themeSwappedRef.current = false;
      return;
    }

    themeSwappedRef.current = false;

    // Reduced motion or reduced effects fallback: short 200ms cross-fade
    if (reducedEffects) {
      const swapTimer = setTimeout(() => {
        onThemeSwap();
        themeSwappedRef.current = true;
      }, 100);

      const endTimer = setTimeout(() => {
        onComplete();
      }, 200);

      return () => {
        clearTimeout(swapTimer);
        clearTimeout(endTimer);
        if (!themeSwappedRef.current) onThemeSwap();
      };
    }

    if (direction === 'light-to-dark') {
      // LIGHT -> DARK (Full 9.0s Sequence)
      // Phase 1: 0.0s - Vignette & Goku Silhouette
      setPhase('charging');
      setHairColor('#070707');
      setIsSuperSaiyan(false);

      // Phase 2: 4.5s - Hair turns gold & aura burst
      const hairTimer = setTimeout(() => {
        setHairColor('#FFD54F');
        setIsSuperSaiyan(true);
      }, 4500);

      // Phase 3: 8.0s - Smooth Flash Peak & Theme Swap
      const flashTimer = setTimeout(() => {
        setPhase('flash');
        // Swap theme after flash starts reaching full opacity
        setTimeout(() => {
          if (!themeSwappedRef.current) {
            onThemeSwap();
            themeSwappedRef.current = true;
          }
        }, 80);
      }, 8000);

      // Phase 4: 9.0s - Completion
      const completeTimer = setTimeout(() => {
        setPhase('complete');
        onComplete();
      }, 9000);

      return () => {
        clearTimeout(hairTimer);
        clearTimeout(flashTimer);
        clearTimeout(completeTimer);
        if (!themeSwappedRef.current) onThemeSwap();
      };
    } else {
      // DARK -> LIGHT (Short ~1.5s Sequence)
      // Phase 1: 0.0s - Collapse aura
      setPhase('charging');
      setHairColor('#FFD54F');
      setIsSuperSaiyan(true);

      // Phase 2: 0.5s - Hair turns black
      const hairTimer = setTimeout(() => {
        setHairColor('#070707');
        setIsSuperSaiyan(false);
      }, 500);

      // Phase 3: 0.8s - Flash Peak & Theme Swap
      const flashTimer = setTimeout(() => {
        setPhase('flash');
        setTimeout(() => {
          if (!themeSwappedRef.current) {
            onThemeSwap();
            themeSwappedRef.current = true;
          }
        }, 60);
      }, 800);

      // Phase 4: 1.5s - Completion
      const completeTimer = setTimeout(() => {
        setPhase('complete');
        onComplete();
      }, 1500);

      return () => {
        clearTimeout(hairTimer);
        clearTimeout(flashTimer);
        clearTimeout(completeTimer);
        if (!themeSwappedRef.current) onThemeSwap();
      };
    }
  }, [isPlaying, direction, reducedEffects, soundEnabled, onThemeSwap, onComplete]);

  if (!isPlaying) return null;

  // Toggle button position calculation for vignette center
  const originX = originRect ? originRect.left + originRect.width / 2 : window.innerWidth / 2;
  const originY = originRect ? originRect.top + originRect.height / 2 : 40;

  // Floating debris particles (24 particles)
  const particles = Array.from({ length: 24 }).map((_, i) => ({
    id: i,
    size: 4 + (i % 5) * 3,
    initialX: (i % 6 - 2.5) * 60,
    initialY: 80 + (i % 4) * 30,
    targetY: -150 - Math.random() * 180,
    targetX: (i % 6 - 2.5) * 90 + (Math.random() * 40 - 20),
    delay: (i * 0.04) % 0.4,
  }));

  // Simple Cross-Fade fallback if reduced effects is true
  if (reducedEffects) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[9999] bg-background pointer-events-auto"
        aria-hidden="true"
      />
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[9999] pointer-events-auto select-none overflow-hidden"
        aria-hidden="true"
        role="presentation"
      >
        {/* Background Dark Vignette centered on toggle button */}
        <div
          className="absolute inset-0 transition-opacity duration-300 bg-[#050508]/90"
          style={{
            background: `radial-gradient(circle at ${originX}px ${originY}px, rgba(15,23,42,0.7) 0%, rgba(5,5,8,0.95) 70%)`,
          }}
        />

        {/* Screen Shake Container */}
        <motion.div
          animate={
            direction === 'light-to-dark' && phase === 'charging'
              ? {
                  x: [-2, 2, -3, 3, -1, 1, 0],
                  y: [-1, 1, -2, 2, -1, 1, 0],
                }
              : { x: 0, y: 0 }
          }
          transition={{
            repeat: Infinity,
            duration: 0.25,
            ease: 'linear',
          }}
          className="relative w-full h-full flex items-center justify-center"
        >
          {/* Main Ki Aura */}
          <motion.div
            animate={{
              scale: isSuperSaiyan ? [1, 1.4, 1.2] : [0.8, 1, 0.9],
              opacity: phase === 'charging' ? [0.6, 1, 0.8] : 0,
            }}
            transition={{ repeat: Infinity, duration: 0.5 }}
            className="absolute w-[500px] h-[500px] rounded-full blur-2xl pointer-events-none"
            style={{
              background: isSuperSaiyan
                ? 'radial-gradient(circle, rgba(255,213,79,0.8) 0%, rgba(245,124,0,0.4) 50%, transparent 70%)'
                : 'radial-gradient(circle, rgba(0,229,255,0.7) 0%, rgba(30,136,229,0.3) 50%, transparent 70%)',
            }}
          />
          {/* Intense Core Aura */}
          <motion.div
            animate={{
              scale: isSuperSaiyan ? [1.1, 1.5, 1.3] : [0.9, 1.1, 1.0],
              opacity: phase === 'charging' ? [0.7, 1, 0.8] : 0,
            }}
            transition={{ repeat: Infinity, duration: 0.3 }}
            className="absolute w-[300px] h-[300px] rounded-full blur-xl pointer-events-none"
            style={{
              background: isSuperSaiyan
                ? 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,193,7,0.7) 40%, transparent 80%)'
                : 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(0,229,255,0.6) 40%, transparent 80%)',
            }}
          />

          {/* Electric Shockwaves / Lightning Arcs */}
          {isSuperSaiyan && (
            <svg className="absolute w-[500px] h-[500px] pointer-events-none" viewBox="0 0 200 200">
              <motion.path
                d="M 20 100 Q 60 50 100 95 T 180 100"
                stroke="#00E5FF"
                strokeWidth="2.5"
                fill="none"
                animate={{ opacity: [0, 0.8, 0, 0.6, 0] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
              />
              <motion.path
                d="M 100 20 Q 130 60 95 120 T 100 180"
                stroke="#FFD54F"
                strokeWidth="2.5"
                fill="none"
                animate={{ opacity: [0, 0.9, 0, 0.8, 0] }}
                transition={{ repeat: Infinity, duration: 0.9, delay: 0.3 }}
              />
              <motion.path
                d="M 50 150 Q 80 120 120 160 T 170 140"
                stroke="#FFFFFF"
                strokeWidth="2"
                fill="none"
                animate={{ opacity: [0, 0.7, 0] }}
                transition={{ repeat: Infinity, duration: 0.7, delay: 0.5 }}
              />
            </svg>
          )}

          {/* Floating Debris Particles */}
          <div className="absolute w-full h-full flex items-center justify-center pointer-events-none">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{
                  x: p.initialX,
                  y: p.initialY,
                  opacity: 0,
                  scale: 0.5,
                  rotate: 0,
                }}
                animate={{
                  y: p.targetY,
                  x: p.targetX,
                  opacity: [0, 1, 0.8, 0],
                  scale: [0.5, 1.2, 0.8],
                  rotate: 360,
                }}
                transition={{
                  duration: direction === 'light-to-dark' ? 1.2 : 0.6,
                  delay: p.delay,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
                className={`absolute rounded-sm ${
                  isSuperSaiyan ? 'bg-amber-400 shadow-[0_0_8px_#FFC107]' : 'bg-cyan-400 shadow-[0_0_8px_#00E5FF]'
                }`}
                style={{ width: p.size, height: p.size }}
              />
            ))}
          </div>

          {/* Goku Silhouette Centerpiece */}
          <motion.div
            animate={{
              scale: isSuperSaiyan ? [1, 1.04, 1] : [0.96, 1, 0.98],
            }}
            transition={{ repeat: Infinity, duration: 0.4 }}
            className="relative z-10"
          >
            <GokuSilhouette hairColor={hairColor} isSuperSaiyan={isSuperSaiyan} />
          </motion.div>
        </motion.div>

        {/* Peak White Flash Screen Swap Overlay */}
        <motion.div
          animate={{
            opacity: phase === 'flash' ? [0, 1, 1, 0] : 0,
          }}
          transition={{
            duration: 1.0,
            times: [0, 0.3, 0.7, 1],
            ease: "easeInOut"
          }}
          className="fixed inset-0 z-[10000] bg-white pointer-events-none"
        />
      </motion.div>
    </AnimatePresence>
  );
};
