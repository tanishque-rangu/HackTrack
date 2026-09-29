import type { Hackathon, StoreData } from '../types';
import { isPast, parseISO } from 'date-fns';

export type BallState = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'COMPLETED_FINAL';

export interface DragonBallStage {
  stageNumber: number;
  name: string;
  state: BallState;
  description: string;
  statusText: string;
  actionText: string;
  actionType: 'NONE' | 'REGISTER' | 'TEAM' | 'IDEA' | 'BUILD' | 'SUBMIT' | 'FINALE';
  deadline?: string;
  details?: Record<string, string>;
}

export function calculateHackathonStages(hackathon: Hackathon, storeData: StoreData): DragonBallStage[] {
  const stages: DragonBallStage[] = [];
  
  // 1. DISCOVER
  stages.push({
    stageNumber: 1,
    name: 'DISCOVER',
    state: 'COMPLETED',
    description: 'The hackathon has been discovered and added to HackTrack.',
    statusText: 'COMPLETED',
    actionText: 'VIEW DETAILS →',
    actionType: 'NONE'
  });

  // 2. REGISTER
  const teamMembers = Array.from(new Set(hackathon.teams.flatMap(t => t.members)));
  let regStatus: BallState = 'NOT_STARTED';
  let regDetails = {};
  if (teamMembers.length > 0) {
    const statuses = teamMembers.map(m => storeData.registrationStatus[hackathon.id]?.[m] || 'N/A');
    const registeredCount = statuses.filter(s => s === 'Registered').length;
    
    if (registeredCount === teamMembers.length) {
      regStatus = 'COMPLETED';
    } else if (registeredCount > 0) {
      regStatus = 'IN_PROGRESS';
    } else {
      regStatus = 'NOT_STARTED';
    }
    regDetails = { 'Registered': `${registeredCount} / ${teamMembers.length}` };
  } else {
    // If no teams yet, default to not started
    regStatus = 'NOT_STARTED';
  }
  
  stages.push({
    stageNumber: 2,
    name: 'REGISTER',
    state: regStatus,
    description: 'Team registration is completed.',
    statusText: regStatus.replace('_', ' '),
    actionText: 'OPEN REGISTRATION →',
    actionType: 'REGISTER',
    deadline: hackathon.registrationDeadline || undefined,
    details: regDetails
  });

  // 3. TEAM
  const teamState: BallState = hackathon.teams.length > 0 ? 'COMPLETED' : 'NOT_STARTED';
  stages.push({
    stageNumber: 3,
    name: 'TEAM',
    state: teamState,
    description: 'The team has been organized.',
    statusText: teamState.replace('_', ' '),
    actionText: 'VIEW TEAM →',
    actionType: 'TEAM',
    details: { 'Teams Formed': hackathon.teams.length.toString() }
  });

  // 4. IDEA
  let ideaState: BallState = 'NOT_STARTED';
  let ideaDetails = {};
  if (hackathon.projects && hackathon.projects.length > 0) {
    const hasIdea = hackathon.projects.some(p => p.description && p.description.trim().length > 0);
    ideaState = hasIdea ? 'COMPLETED' : 'IN_PROGRESS';
    ideaDetails = { 'Projects': hackathon.projects.map(p => p.projectName).join(', ') };
  } else if (hackathon.teams.length > 0) {
    ideaState = 'NOT_STARTED';
  }
  stages.push({
    stageNumber: 4,
    name: 'IDEA',
    state: ideaState,
    description: 'The team has finalized the project/problem/solution.',
    statusText: ideaState.replace('_', ' '),
    actionText: 'OPEN PROJECT →',
    actionType: 'IDEA',
    details: ideaDetails
  });

  // 5. BUILD
  let buildState: BallState = 'NOT_STARTED';
  let buildDetails = {};
  if (hackathon.projects && hackathon.projects.length > 0) {
    const statuses = hackathon.projects.map(p => p.buildStatus);
    if (statuses.some(s => s === 'Done' || s === 'Submitted')) {
      buildState = 'COMPLETED';
    } else if (statuses.some(s => s === 'In Progress')) {
      buildState = 'IN_PROGRESS';
    } else {
      buildState = 'NOT_STARTED';
    }
    
    // Pick the most advanced project for details
    const activeProject = hackathon.projects.find(p => ['In Progress', 'Submitted', 'Done'].includes(p.buildStatus)) || hackathon.projects[0];
    buildDetails = { 'Project': activeProject.projectName, 'Status': activeProject.buildStatus };
  }
  stages.push({
    stageNumber: 5,
    name: 'BUILD',
    state: buildState,
    description: 'Development has started.',
    statusText: buildState.replace('_', ' '),
    actionText: 'UPDATE BUILD →',
    actionType: 'BUILD',
    details: buildDetails
  });

  // 6. SUBMIT
  let submitState: BallState = 'NOT_STARTED';
  let submitDetails = {};
  if (hackathon.projects && hackathon.projects.length > 0) {
    const isSubmitted = hackathon.projects.some(p => p.buildStatus === 'Submitted' || p.buildStatus === 'Done');
    const hasLinks = hackathon.projects.some(p => p.repoLink || p.pptLink || p.demoLink);
    
    if (isSubmitted) {
      submitState = 'COMPLETED';
    } else if (hasLinks) {
      submitState = 'IN_PROGRESS';
    }
    
    const activeProject = hackathon.projects[0];
    submitDetails = {
      'Repo': activeProject.repoLink ? 'Added' : 'Missing',
      'Demo/PPT': (activeProject.demoLink || activeProject.pptLink) ? 'Added' : 'Missing',
    };
  }
  stages.push({
    stageNumber: 6,
    name: 'SUBMIT',
    state: submitState,
    description: 'The hackathon submission is complete.',
    statusText: submitState.replace('_', ' '),
    actionText: 'COMPLETE SUBMISSION →',
    actionType: 'SUBMIT',
    deadline: hackathon.submissionDeadline || undefined,
    details: submitDetails
  });

  // 7. FINALE
  let finaleState: BallState = 'NOT_STARTED';
  if (hackathon.projects && hackathon.projects.some(p => p.buildStatus === 'Done')) {
    finaleState = 'COMPLETED_FINAL';
  } else if (hackathon.submissionDeadline && isPast(parseISO(hackathon.submissionDeadline))) {
    finaleState = 'IN_PROGRESS';
  }
  
  stages.push({
    stageNumber: 7,
    name: 'FINALE',
    state: finaleState,
    description: 'The team has reached the final/presentation/result stage.',
    statusText: finaleState.replace('_', ' '),
    actionText: 'VIEW EVENT →',
    actionType: 'FINALE',
    details: { 'Event Dates': hackathon.eventDates }
  });
  
  // If all 7 are complete, make sure 7 is COMPLETED_FINAL
  const allComplete = stages.every(s => s.state === 'COMPLETED' || s.state === 'COMPLETED_FINAL');
  if (allComplete) {
    stages[6].state = 'COMPLETED_FINAL';
  }

  return stages;
}

export interface PowerBreakdown {
  total: number;
  stagesCompleted: number;
  deadlinePressure: number;
  maxPossible: number;
}

export function calculatePowerLevel(stages: DragonBallStage[], hackathon: Hackathon): PowerBreakdown {
  let stagesCompletedScore = 0;
  
  // Base power from completed stages (up to 7000)
  stages.forEach(s => {
    if (s.state === 'COMPLETED' || s.state === 'COMPLETED_FINAL') stagesCompletedScore += 1000;
    else if (s.state === 'IN_PROGRESS') stagesCompletedScore += 500;
  });
  
  // Urgency multiplier
  let deadlinePressureScore = 0;
  const dates = [];
  if (hackathon.registrationDeadline) dates.push(new Date(hackathon.registrationDeadline).getTime());
  if (hackathon.submissionDeadline) dates.push(new Date(hackathon.submissionDeadline).getTime());
  const futureDates = dates.filter(d => d > Date.now());
  
  if (futureDates.length > 0) {
    const nextDeadline = Math.min(...futureDates);
    const hoursRemaining = (nextDeadline - Date.now()) / (1000 * 60 * 60);
    
    if (hoursRemaining <= 6) deadlinePressureScore = 2420; // EXTREME URGENCY (OVER 9000 possible)
    else if (hoursRemaining <= 48) deadlinePressureScore = 1500; // CRITICAL URGENCY
    else if (hoursRemaining <= 168) deadlinePressureScore = 800; // WARNING URGENCY
  } else if (stages[6].state === 'COMPLETED_FINAL') {
    stagesCompletedScore = 7000;
    deadlinePressureScore = 2420; // Max possible for completed
  }

  const total = Math.min(9999, stagesCompletedScore + deadlinePressureScore);

  return {
    total,
    stagesCompleted: stagesCompletedScore,
    deadlinePressure: deadlinePressureScore,
    maxPossible: 9420
  };
}

export function getOverallProgress(hackathons: Hackathon[], storeData: StoreData) {
  if (hackathons.length === 0) return { completed: 0, total: 7, power: { total: 0, stagesCompleted: 0, deadlinePressure: 0, maxPossible: 9420 }, currentStage: 'DISCOVER' };
  
  let totalPower = 0;
  let totalStagesCompleted = 0;
  let totalDeadlinePressure = 0;
  
  let maxCompleted = 0;
  let dominantStage = 'DISCOVER';
  
  hackathons.forEach(h => {
    const stages = calculateHackathonStages(h, storeData);
    const ki = calculatePowerLevel(stages, h);
    
    totalPower += ki.total;
    totalStagesCompleted += ki.stagesCompleted;
    totalDeadlinePressure += ki.deadlinePressure;
    
    const compCount = stages.filter(s => s.state === 'COMPLETED' || s.state === 'COMPLETED_FINAL').length;
    if (compCount >= maxCompleted) {
      maxCompleted = compCount;
      const inProg = stages.find(s => s.state === 'IN_PROGRESS');
      const firstNotStarted = stages.find(s => s.state === 'NOT_STARTED');
      dominantStage = inProg ? inProg.name : (firstNotStarted ? firstNotStarted.name : 'FINALE');
    }
  });
  
  const count = hackathons.length;
  
  return {
    completed: maxCompleted,
    total: 7,
    power: {
      total: Math.floor(totalPower / count),
      stagesCompleted: Math.floor(totalStagesCompleted / count),
      deadlinePressure: Math.floor(totalDeadlinePressure / count),
      maxPossible: 9420
    },
    currentStage: dominantStage
  };
}
