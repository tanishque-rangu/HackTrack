import { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
import type { StoreData, Project, Hackathon, TimelineEvent, ProblemStatement, ActivityLog, Role } from './types';
import initialData from './data.json';
import { supabase } from './lib/supabase';

// Initialize registration status for everyone
const initStore = (): StoreData => {
  const data = JSON.parse(JSON.stringify(initialData)) as StoreData;
  if (!data.chats) data.chats = {};
  if (!data.registrationStatus) data.registrationStatus = {};
  if (!data.checklistState) data.checklistState = {};
  if (!data.timelineEvents) data.timelineEvents = [];
  if (!data.problemStatements) data.problemStatements = [];
  if (!data.activityLogs) data.activityLogs = [];
  if (!data.roles) data.roles = {};
  
  data.hackathons.forEach(h => {
    if (!data.registrationStatus[h.id]) data.registrationStatus[h.id] = {};
    if (!data.chats[h.id]) data.chats[h.id] = [];
    if (!data.checklistState![h.id]) {
      data.checklistState![h.id] = {};
      data.submissionChecklist.forEach(item => {
        data.checklistState![h.id][item] = { done: false };
      });
    }
    
    // For every member, set N/A if they aren't in any team for this hackathon, otherwise 'Not Yet'
    data.members.forEach(m => {
      if (!data.registrationStatus[h.id][m]) {
        const isParticipating = h.teams.some(team => team.members.includes(m));
        data.registrationStatus[h.id][m] = isParticipating ? 'Not Yet' : 'N/A';
      }
    });
    
    // Initialize projects array if it doesn't exist
    if (!h.projects) h.projects = [];
  });
  
  return data;
};

interface SquadInfo {
  code: string;
  id?: string;
}

interface StoreContextType {
  data: StoreData;
  squadInfo: SquadInfo | null;
  handleJoinSquad: (code: string, name: string) => void;
  updateRegistrationStatus: (hackathonId: string, member: string, status: 'Registered' | 'Not Yet' | 'N/A') => void;
  updateChecklistItem: (hackathonId: string, itemText: string, updates: { done?: boolean; owner?: string }) => void;
  updateProject: (hackathonId: string, team: string, projectUpdates: Partial<Project>) => void;
  addChatMessage: (hackathonId: string, sender: string, text: string) => void;
  updatePowerHistory: (power: number) => void;
  addHackathon: (hackathon: Hackathon) => void;
  updateHackathon: (id: string, updates: Partial<Hackathon>, userId: string) => void;
  deleteHackathon: (id: string, userId: string) => void;
  addTimelineEvent: (event: TimelineEvent, userId: string) => void;
  updateTimelineEvent: (id: string, updates: Partial<TimelineEvent>, userId: string) => void;
  addProblemStatement: (statement: ProblemStatement, userId: string) => void;
  updateProblemStatement: (id: string, updates: Partial<ProblemStatement>, userId: string) => void;
  verifyHackathon: (id: string, userId: string) => void;
  updateRole: (member: string, role: Role) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
};

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const [squadInfo, setSquadInfo] = useState<SquadInfo | null>(() => {
    const stored = localStorage.getItem('hacktrack-squad');
    return stored ? JSON.parse(stored) : null;
  });
  
  const [data, setData] = useState<StoreData>(() => {
    const stored = localStorage.getItem('hacktrack-data');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (!parsed.chats) parsed.chats = {};
        if (!parsed.registrationStatus) parsed.registrationStatus = {};
        if (!parsed.checklistState) parsed.checklistState = {};
        if (!parsed.submissionChecklist) parsed.submissionChecklist = initialData.submissionChecklist || [];
        
        if (!parsed.timelineEvents) parsed.timelineEvents = [];
        if (!parsed.problemStatements) parsed.problemStatements = [];
        if (!parsed.activityLogs) parsed.activityLogs = [];
        if (!parsed.roles) parsed.roles = {};
        
        // Merge fresh hackathon static data (links/notes) while preserving dynamic project states
        const initialIds = initialData.hackathons.map((h: any) => h.id);
        const userAddedHackathons = (parsed.hackathons || []).filter((h: Hackathon) => !initialIds.includes(h.id));

        parsed.hackathons = [
          ...initialData.hackathons.map((initialHackathon: any) => {
            const storedHackathon = parsed.hackathons?.find((h: Hackathon) => h.id === initialHackathon.id);
            return {
              ...initialHackathon,
              ...(storedHackathon || {}), // preserve edits
              projects: storedHackathon?.projects || initialHackathon.projects || []
            };
          }),
          ...userAddedHackathons
        ];

        parsed.hackathons?.forEach((h: Hackathon) => {
          if (!parsed.chats[h.id]) parsed.chats[h.id] = [];
          if (!parsed.registrationStatus[h.id]) parsed.registrationStatus[h.id] = {};
          if (!parsed.checklistState![h.id]) {
            parsed.checklistState![h.id] = {};
            (parsed.submissionChecklist || []).forEach((item: string) => {
              parsed.checklistState![h.id][item] = { done: false };
            });
          }
        });
        return parsed as StoreData;
      } catch (e) {
        return initStore();
      }
    }
    return initStore();
  });

  // Local persistence
  useEffect(() => {
    localStorage.setItem('hacktrack-data', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    if (squadInfo) {
      localStorage.setItem('hacktrack-squad', JSON.stringify(squadInfo));
    } else {
      localStorage.removeItem('hacktrack-squad');
    }
  }, [squadInfo]);

  const channelRef = useRef<ReturnType<NonNullable<typeof supabase>['channel']> | null>(null);

  // Real-time Supabase Subscription
  useEffect(() => {
    if (!squadInfo?.code) return;
    if (!supabase) return;

    const channel = supabase
      .channel(`squad:${squadInfo.code}`)
      .on('broadcast', { event: 'state_update' }, ({ payload }) => {
        // Optimistic sync from peers
        setData(payload.state);
      })
      .subscribe();
      
    channelRef.current = channel;

    // Fetch initial state from DB on load (if returning user)
    const fetchInitialState = async () => {
      try {
        const { data, error } = await supabase!.from('squads').select('state').eq('code', squadInfo.code).single();
        if (!error && data?.state) {
          setData(data.state);
        }
      } catch (e) {
        // Ignore, fallback to local storage
      }
    };
    fetchInitialState();

    return () => {
      supabase?.removeChannel(channel);
      channelRef.current = null;
    };
  }, [squadInfo?.code]);

  const broadcastChange = useCallback(async (newState: StoreData) => {
    if (squadInfo?.code && supabase) {
      // 1. Broadcast to currently online peers
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'state_update',
          payload: { state: newState }
        }).catch(console.error);
      }
      
      // 2. Persist to database so offline peers get it when they join
      try {
        await supabase.from('squads').update({ state: newState }).eq('code', squadInfo.code);
      } catch (err) {
        console.warn("Could not save state to DB. You may need to add the 'state' JSONB column to the squads table.");
      }
    }
  }, [squadInfo?.code]);

  const handleJoinSquad = async (code: string, name: string) => {
    // Basic Supabase interaction example
    try {
      if (!supabase) throw new Error("Supabase is disabled");
      
      // Create or get squad, trying to fetch the 'state' column
      let squad;
      let loadedState = null;
      
      const { data: squadWithState, error: stateErr } = await supabase.from('squads').select('id, code, state').eq('code', code).single();
      
      if (stateErr && stateErr.code === '42703') {
        // Fallback if 'state' column doesn't exist yet
        const { data: squadWithoutState } = await supabase.from('squads').select('id, code').eq('code', code).single();
        squad = squadWithoutState;
      } else if (!stateErr) {
        squad = squadWithState;
        loadedState = squadWithState.state;
      }
      
      if (!squad) {
        const { data: newSquad, error } = await supabase.from('squads').insert([{ code, name: code }]).select().single();
        if (error) throw error;
        squad = newSquad;
      }

      // Ensure member exists
      if (squad) {
        await supabase.from('members').insert([{ squad_id: squad.id, display_name: name }]).select().single();
        
        // If we loaded state from DB, apply it!
        if (loadedState) {
           setData(loadedState);
        }
        
        setSquadInfo({ code: squad.code, id: squad.id });
        localStorage.setItem('hacktrack-sender', name);
      }
    } catch (err) {
      console.error("Failed to join squad", err);
      // Fallback for offline or misconfigured supabase
      setSquadInfo({ code });
      localStorage.setItem('hacktrack-sender', name);
    }
  };

  const updateRegistrationStatus = (hackathonId: string, member: string, status: 'Registered' | 'Not Yet' | 'N/A') => {
    setData(prev => {
      const newState = {
        ...prev,
        registrationStatus: {
          ...prev.registrationStatus,
          [hackathonId]: {
            ...(prev.registrationStatus[hackathonId] || {}),
            [member]: status
          }
        }
      };
      broadcastChange(newState);
      return newState;
    });
  };

  const updateChecklistItem = (hackathonId: string, itemText: string, updates: { done?: boolean; owner?: string }) => {
    setData(prev => {
      const hackathonChecklist = prev.checklistState?.[hackathonId] || {};
      const currentItem = hackathonChecklist[itemText] || { done: false };
      
      const newState = {
        ...prev,
        checklistState: {
          ...prev.checklistState,
          [hackathonId]: {
            ...hackathonChecklist,
            [itemText]: { ...currentItem, ...updates }
          }
        }
      };
      broadcastChange(newState);
      return newState;
    });
  };

  const updateProject = (hackathonId: string, teamLabel: string, projectUpdates: Partial<Project>) => {
    setData(prev => {
      const newHackathons = [...prev.hackathons];
      const hIndex = newHackathons.findIndex(h => h.id === hackathonId);
      if (hIndex === -1) return prev;
      
      const hackathon = { ...newHackathons[hIndex] };
      const projects = [...(hackathon.projects || [])];
      const pIndex = projects.findIndex(p => p.team === teamLabel);
      
      if (pIndex >= 0) {
        projects[pIndex] = { ...projects[pIndex], ...projectUpdates };
      } else {
        projects.push({
          team: teamLabel,
          projectName: 'New Project',
          buildStatus: 'Not Started',
          ...projectUpdates
        } as Project);
      }
      
      hackathon.projects = projects;
      newHackathons[hIndex] = hackathon;
      
      const newState = { ...prev, hackathons: newHackathons };
      broadcastChange(newState);
      return newState;
    });
  };

  const addChatMessage = (hackathonId: string, sender: string, text: string) => {
    setData(prev => {
      const newMessage = {
        id: Math.random().toString(36).substr(2, 9),
        sender,
        text,
        timestamp: new Date().toISOString()
      };
      
      const newState = {
        ...prev,
        chats: {
          ...prev.chats,
          [hackathonId]: [...(prev.chats[hackathonId] || []), newMessage]
        }
      };
      broadcastChange(newState);
      return newState;
    });
  };

  const updatePowerHistory = useCallback((power: number) => {
    setData(prev => {
      const history = prev.powerHistory || [];
      if (history.length > 0 && history[history.length - 1] === power) {
        return prev; // Don't add duplicate
      }
      
      const newHistory = [...history, power].slice(-20); // Keep last 20
      const newState = { ...prev, powerHistory: newHistory };
      broadcastChange(newState);
      return newState;
    });
  }, [broadcastChange]);

  const addHackathon = (hackathon: Hackathon) => {
    setData(prev => {
      const newState = { ...prev, hackathons: [...prev.hackathons, hackathon] };
      if (!newState.chats) newState.chats = {};
      if (!newState.chats[hackathon.id]) newState.chats[hackathon.id] = [];
      if (!newState.registrationStatus) newState.registrationStatus = {};
      if (!newState.registrationStatus[hackathon.id]) newState.registrationStatus[hackathon.id] = {};
      if (!newState.checklistState) newState.checklistState = {};
      if (!newState.checklistState[hackathon.id]) {
        newState.checklistState[hackathon.id] = {};
        (newState.submissionChecklist || []).forEach(item => {
          newState.checklistState![hackathon.id][item] = { done: false };
        });
      }
      
      // Log creation
      const log: ActivityLog = {
        id: Math.random().toString(36).substr(2, 9),
        userId: localStorage.getItem('hacktrack-sender') || 'Unknown',
        hackathonId: hackathon.id,
        action: 'CREATED',
        entityType: 'HACKATHON',
        entityId: hackathon.id,
        timestamp: new Date().toISOString()
      };
      newState.activityLogs = [...(newState.activityLogs || []), log];
      
      broadcastChange(newState);
      return newState;
    });
  };

  const updateHackathon = (id: string, updates: Partial<Hackathon>, userId: string) => {
    setData(prev => {
      const hackathons = [...prev.hackathons];
      const index = hackathons.findIndex(h => h.id === id);
      if (index === -1) return prev;
      
      const oldH = hackathons[index];
      hackathons[index] = { ...oldH, ...updates };
      
      const logs = [...(prev.activityLogs || [])];
      
      // Log changes
      Object.keys(updates).forEach(key => {
        const k = key as keyof Hackathon;
        if (oldH[k] !== updates[k] && k !== 'verifiedAt' && k !== 'verifiedBy') {
          logs.push({
            id: Math.random().toString(36).substr(2, 9),
            userId,
            hackathonId: id,
            action: updates.archivedAt ? 'ARCHIVED' : (oldH.archivedAt && !updates.archivedAt) ? 'RESTORED' : 'UPDATED',
            entityType: 'HACKATHON',
            entityId: id,
            field: k,
            oldValue: oldH[k] ? String(oldH[k]) : undefined,
            newValue: updates[k] ? String(updates[k]) : undefined,
            timestamp: new Date().toISOString()
          });
        }
      });
      
      const newState = { ...prev, hackathons, activityLogs: logs };
      broadcastChange(newState);
      return newState;
    });
  };

  const addTimelineEvent = (event: TimelineEvent, userId: string) => {
    setData(prev => {
      const logs = [...(prev.activityLogs || []), {
        id: Math.random().toString(36).substr(2, 9),
        userId,
        hackathonId: event.hackathonId,
        action: 'CREATED' as const,
        entityType: 'TIMELINE' as const,
        entityId: event.id,
        field: 'Title',
        newValue: event.title,
        timestamp: new Date().toISOString()
      }];
      const newState = { ...prev, timelineEvents: [...(prev.timelineEvents || []), event], activityLogs: logs };
      broadcastChange(newState);
      return newState;
    });
  };

  const updateTimelineEvent = (id: string, updates: Partial<TimelineEvent>, userId: string) => {
    setData(prev => {
      const events = [...(prev.timelineEvents || [])];
      const index = events.findIndex(e => e.id === id);
      if (index === -1) return prev;
      
      const oldE = events[index];
      events[index] = { ...oldE, ...updates };
      
      const logs = [...(prev.activityLogs || [])];
      if (updates.archivedAt && !oldE.archivedAt) {
        logs.push({
          id: Math.random().toString(36).substr(2, 9),
          userId,
          hackathonId: oldE.hackathonId,
          action: 'ARCHIVED',
          entityType: 'TIMELINE',
          entityId: id,
          field: 'Title',
          oldValue: oldE.title,
          timestamp: new Date().toISOString()
        });
      } else if (!updates.archivedAt && oldE.archivedAt) {
         logs.push({
          id: Math.random().toString(36).substr(2, 9),
          userId,
          hackathonId: oldE.hackathonId,
          action: 'RESTORED',
          entityType: 'TIMELINE',
          entityId: id,
          field: 'Title',
          oldValue: oldE.title,
          timestamp: new Date().toISOString()
        });
      } else {
         // simple update log
         logs.push({
          id: Math.random().toString(36).substr(2, 9),
          userId,
          hackathonId: oldE.hackathonId,
          action: 'UPDATED',
          entityType: 'TIMELINE',
          entityId: id,
          field: 'Title',
          oldValue: oldE.title,
          timestamp: new Date().toISOString()
        });
      }
      
      const newState = { ...prev, timelineEvents: events, activityLogs: logs };
      broadcastChange(newState);
      return newState;
    });
  };

  const addProblemStatement = (statement: ProblemStatement, userId: string) => {
    setData(prev => {
      const logs = [...(prev.activityLogs || []), {
        id: Math.random().toString(36).substr(2, 9),
        userId,
        hackathonId: statement.hackathonId,
        action: 'CREATED' as const,
        entityType: 'PROBLEM_STATEMENT' as const,
        entityId: statement.id,
        field: 'Title',
        newValue: statement.title,
        timestamp: new Date().toISOString()
      }];
      const newState = { ...prev, problemStatements: [...(prev.problemStatements || []), statement], activityLogs: logs };
      broadcastChange(newState);
      return newState;
    });
  };

  const updateProblemStatement = (id: string, updates: Partial<ProblemStatement>, userId: string) => {
    setData(prev => {
      const statements = [...(prev.problemStatements || [])];
      const index = statements.findIndex(e => e.id === id);
      if (index === -1) return prev;
      
      const oldE = statements[index];
      statements[index] = { ...oldE, ...updates };
      
      const logs = [...(prev.activityLogs || [])];
      if (updates.archivedAt && !oldE.archivedAt) {
        logs.push({
          id: Math.random().toString(36).substr(2, 9),
          userId,
          hackathonId: oldE.hackathonId,
          action: 'ARCHIVED',
          entityType: 'PROBLEM_STATEMENT',
          entityId: id,
          field: 'Title',
          oldValue: oldE.title,
          timestamp: new Date().toISOString()
        });
      }
      
      const newState = { ...prev, problemStatements: statements, activityLogs: logs };
      broadcastChange(newState);
      return newState;
    });
  };

  const verifyHackathon = (id: string, userId: string) => {
    setData(prev => {
      const hackathons = [...prev.hackathons];
      const index = hackathons.findIndex(h => h.id === id);
      if (index === -1) return prev;
      
      hackathons[index] = { ...hackathons[index], verifiedAt: new Date().toISOString(), verifiedBy: userId };
      
      const logs = [...(prev.activityLogs || []), {
        id: Math.random().toString(36).substr(2, 9),
        userId,
        hackathonId: id,
        action: 'VERIFIED' as const,
        entityType: 'HACKATHON' as const,
        entityId: id,
        timestamp: new Date().toISOString()
      }];
      
      const newState = { ...prev, hackathons, activityLogs: logs };
      broadcastChange(newState);
      return newState;
    });
  };

  const deleteHackathon = (id: string, userId: string) => {
    setData(prev => {
      const hackathons = prev.hackathons.filter(h => h.id !== id);
      const logs = [...(prev.activityLogs || []), {
        id: Math.random().toString(36).substr(2, 9),
        userId,
        hackathonId: id,
        action: 'ARCHIVED' as const, // We use ARCHIVED visually but we are deleting it
        entityType: 'HACKATHON' as const,
        entityId: id,
        field: 'DELETED',
        timestamp: new Date().toISOString()
      }];
      const newState = { ...prev, hackathons, activityLogs: logs };
      broadcastChange(newState);
      return newState;
    });
  };

  const updateRole = (member: string, role: Role) => {
    setData(prev => {
      const newState = { ...prev, roles: { ...(prev.roles || {}), [member]: role } };
      broadcastChange(newState);
      return newState;
    });
  };

  return (
    <StoreContext.Provider value={{ 
      data, squadInfo, handleJoinSquad, updateRegistrationStatus, updateChecklistItem, 
      updateProject, addChatMessage, updatePowerHistory, addHackathon,
      updateHackathon, deleteHackathon, addTimelineEvent, updateTimelineEvent, addProblemStatement,
      updateProblemStatement, verifyHackathon, updateRole 
    }}>
      {children}
    </StoreContext.Provider>
  );
};
