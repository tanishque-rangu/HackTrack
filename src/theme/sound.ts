let currentAudio: HTMLAudioElement | null = null;
let bgAudio: HTMLAudioElement | null = null;

export const playThemeAudio = (type: 'power-up' | 'power-down', enabled: boolean = true) => {
  if (!enabled || typeof window === 'undefined') return;

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  if (bgAudio) {
    bgAudio.pause();
    bgAudio.currentTime = 0;
    bgAudio = null;
  }

  if (type === 'power-down') {
    console.log(`[Audio] Playing power-down using teleport.mpeg`);
    try {
      currentAudio = new Audio('/teleport.mpeg');
      currentAudio.volume = 0.6;
      currentAudio.play().catch((e) => {
        console.warn('[Audio] Playback failed:', e);
      });
    } catch (e) {
      console.warn('[Audio] Setup failed:', e);
    }
    return;
  }

  console.log(`[Audio] Playing power-up using gokuyelling.mp3.mpeg`);
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

export const stopThemeAudio = (startChargingLoop: boolean = false) => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  
  if (startChargingLoop && typeof window !== 'undefined') {
    try {
      if (!bgAudio) {
        bgAudio = new Audio('/charged.mpeg');
        bgAudio.volume = 0.2;
        bgAudio.loop = true;
      }
      bgAudio.play().catch(e => console.warn(e));
    } catch (e) {
      console.warn(e);
    }
  } else if (bgAudio) {
    bgAudio.pause();
    bgAudio.currentTime = 0;
    bgAudio = null;
  }
};
