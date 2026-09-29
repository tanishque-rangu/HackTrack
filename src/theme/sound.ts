export const playThemeAudio = (type: 'power-up' | 'power-down', enabled: boolean = true) => {
  if (!enabled || typeof window === 'undefined') return;

  console.log(`[Audio] Playing ${type} using gokuyelling.mp3.mpeg`);
  try {
    const audio = new Audio('/gokuyelling.mp3.mpeg');
    audio.volume = type === 'power-up' ? 0.6 : 0.4;
    audio.play().catch((e) => {
      console.warn('[Audio] Playback failed:', e);
    });
  } catch (e) {
    // Ignore audio autoplay restrictions gracefully
    console.warn('[Audio] Setup failed:', e);
  }
};

