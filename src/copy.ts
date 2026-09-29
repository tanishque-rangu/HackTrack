export const getCopy = (theme: 'dark' | 'light') => {
  const isDark = theme === 'dark';

  return {
    subtitle: isDark ? 'KI COMMAND CENTER' : 'HACKATHON TRACKER',
    powerLevel: isDark ? 'POWER LEVEL (KI)' : 'PROGRESS',
    totalPower: isDark ? 'TOTAL SQUAD POWER' : 'TEAM PROGRESS',
    mission: isDark ? 'MISSION' : 'HACKATHON',
    currentMission: isDark ? 'CURRENT MISSION' : 'CURRENT HACKATHON',
    warRoom: isDark ? 'DRAGON BALL COMMAND' : 'OVERVIEW',
    intelAndCoords: isDark ? 'INTEL & COORDS' : 'OVERVIEW',
    missionTimeline: isDark ? 'MISSION TIMELINE' : 'TIMELINE',
    combatUnits: isDark ? 'COMBAT UNITS' : 'TEAMS',
    commLink: isDark ? 'COMM LINK' : 'TEAM CHAT',
    missionComplete: isDark ? 'MISSION COMPLETE' : 'ALL STAGES COMPLETE',
    missionStatus: isDark ? 'MISSION STATUS' : 'STATUS',
    registrationStatus: isDark ? 'REGISTRATION STATUS' : 'REGISTRATION',
    dragonBallProgress: isDark ? 'DRAGON BALL PROGRESS' : 'PROGRESS',
    powerLevelShort: isDark ? 'POWER LEVEL' : 'PROGRESS',
    ballsCollected: (count: number) => isDark ? `${count} / 7 BALLS` : `${count} / 7 STAGES`,
    stages: isDark ? [
      'Discover', 'Registration', 'Team', 'Idea', 'Build', 'Submission', 'Finale'
    ] : [
      'Discover', 'Register', 'Team', 'Idea', 'Build', 'Submit', 'Finale'
    ],
    critical: isDark ? 'CRITICAL' : 'DUE SOON',
    superSaiyan: isDark ? 'SUPER SAIYAN' : 'ACTIVE TRACKER',
  };
};
