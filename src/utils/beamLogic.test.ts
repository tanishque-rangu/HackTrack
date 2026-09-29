import { getBeamPhase } from './beamLogic';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error('FAIL:', msg);
    throw new Error(msg);
  }
}

function runTests() {
  const HOUR = 1000 * 60 * 60;
  const start = 0;
  const deadline = 200 * HOUR;
  
  // Test 1: > 7 days (CHARGING)
  let now = 0; // 200 hours remaining
  let state = getBeamPhase(now, start, deadline, false);
  assert(state.phase === 'CHARGING', 'Expected CHARGING for > 168 hours');

  // Test 2: 7d to 48h (FIRING)
  now = (200 - 100) * HOUR; // 100 hours remaining
  state = getBeamPhase(now, start, deadline, false);
  assert(state.phase === 'FIRING', 'Expected FIRING for > 48 hours');

  // Test 3: 48h to 6h (CRITICAL)
  now = (200 - 24) * HOUR; // 24 hours remaining
  state = getBeamPhase(now, start, deadline, false);
  assert(state.phase === 'CRITICAL', 'Expected CRITICAL for > 6 hours');

  // Test 4: < 6h (EXTREME)
  now = (200 - 3) * HOUR; // 3 hours remaining
  state = getBeamPhase(now, start, deadline, false);
  assert(state.phase === 'EXTREME', 'Expected EXTREME for < 6 hours');

  // Test 5: Passed deadline (EXPIRED)
  now = 201 * HOUR; 
  state = getBeamPhase(now, start, deadline, false);
  assert(state.phase === 'EXPIRED', 'Expected EXPIRED past deadline');
  assert(state.progress === 1, 'Progress should be 1 if expired');

  // Test 6: Completed (CLEARED)
  now = 100 * HOUR;
  state = getBeamPhase(now, start, deadline, true);
  assert(state.phase === 'CLEARED', 'Expected CLEARED if completed before deadline');
  assert(state.progress === 1, 'Progress should be 1 if cleared early');

  console.log('All beamLogic tests passed!');
}

runTests();
