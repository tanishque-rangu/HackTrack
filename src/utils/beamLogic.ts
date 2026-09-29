export type BeamPhase = 'CHARGING' | 'FIRING' | 'CRITICAL' | 'EXTREME' | 'EXPIRED' | 'CLEARED';

export interface BeamState {
  phase: BeamPhase;
  progress: number;
  msRemaining: number;
  msToNextPhase: number | null;
}

export function getBeamPhase(now: number, start: number, deadline: number, completed: boolean): BeamState {
  if (completed && now <= deadline) {
    return { phase: 'CLEARED', progress: 1, msRemaining: 0, msToNextPhase: null };
  }

  if (now > deadline) {
    return { phase: completed ? 'CLEARED' : 'EXPIRED', progress: 1, msRemaining: 0, msToNextPhase: null };
  }

  const total = Math.max(deadline - start, 1);
  const progress = Math.max(0, Math.min((now - start) / total, 1));
  const msRemaining = deadline - now;
  const hoursRemaining = msRemaining / (1000 * 60 * 60);

  let phase: BeamPhase;
  let nextPhaseIn: number | null = null;

  if (hoursRemaining > 168) { // > 7 days
    phase = 'CHARGING';
    nextPhaseIn = msRemaining - (168 * 60 * 60 * 1000);
  } else if (hoursRemaining > 48) {
    phase = 'FIRING';
    nextPhaseIn = msRemaining - (48 * 60 * 60 * 1000);
  } else if (hoursRemaining > 6) {
    phase = 'CRITICAL';
    nextPhaseIn = msRemaining - (6 * 60 * 60 * 1000);
  } else {
    phase = 'EXTREME';
    nextPhaseIn = msRemaining;
  }

  if (completed) {
     phase = 'CLEARED';
     nextPhaseIn = null;
  }

  return {
    phase,
    progress,
    msRemaining,
    msToNextPhase: nextPhaseIn
  };
}
