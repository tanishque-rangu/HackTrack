let currentAudio: HTMLAudioElement | null = null;

export const playThemeAudio = (type: 'power-up' | 'power-down', enabled: boolean = true) => {
  if (!enabled || typeof window === 'undefined') return;
  if (type === 'power-down') return;

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  console.log(`[Audio] Playing ${type} using gokuyelling.mp3.mpeg`);
  try {
    currentAudio = new Audio('/gokuyelling.mp3.mpeg');
    currentAudio.volume = 0.6;
    currentAudio.play().catch((e) => {
      console.warn('[Audio] Playback failed:', e);
    });
  } catch (e) {
    console.warn('[Audio] Setup failed:', e);
  }
};

export const stopThemeAudio = () => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
};
