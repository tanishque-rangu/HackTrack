import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import type { StoreData, Project, Hackathon } from './types';
import initialData from './data.json';
import { supabase } from './lib/supabase';

// Initialize registration status for everyone
const initStore = (): StoreData => {
  const data = JSON.parse(JSON.stringify(initialData)) as StoreData;
  if (!data.chats) data.chats = {};
  if (!data.registrationStatus) data.registrationStatus = {};
  if (!data.checklistState) data.checklistState = {};
  
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
        
        // Merge fresh hackathon static data (links/notes) while preserving dynamic project states
        parsed.hackathons = initialData.hackathons.map((initialHackathon: any) => {
          const storedHackathon = parsed.hackathons?.find((h: Hackathon) => h.id === initialHackathon.id);
          return {
            ...initialHackathon,
            projects: storedHackathon?.projects || initialHackathon.projects || []
          };
        });

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

  // Real-time Supabase Subscription
  useEffect(() => {
    if (!squadInfo?.code) return;
    if (!supabase) return;

    // TODO: Implement deep fetching of data from Postgres and map to StoreData.
    // For now, we will use a "sync_payloads" fallback or just keep it local-only 
    // until full SQL mapping is built for the UI.
    
    // For Phase 1 completion, we'll simulate the real-time hookup on the main UI
    // while keeping the exact Context API intact.
    
    const channel = supabase
      .channel(`squad:${squadInfo.code}`)
      .on('broadcast', { event: 'state_update' }, ({ payload }) => {
        // Optimistic sync from peers
        setData(payload.state);
      })
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [squadInfo?.code]);

  // Helper to broadcast changes
  const broadcastChange = useCallback((newState: StoreData) => {
    if (squadInfo?.code && supabase) {
      supabase.channel(`squad:${squadInfo.code}`).send({
        type: 'broadcast',
        event: 'state_update',
        payload: { state: newState }
      }).catch(console.error);
    }
  }, [squadInfo?.code]);

  const handleJoinSquad = async (code: string, name: string) => {
    // Basic Supabase interaction example
    try {
      if (!supabase) throw new Error("Supabase is disabled");
      
      // Create or get squad
      let { data: squad } = await supabase.from('squads').select('id, code').eq('code', code).single();
      
      if (!squad) {
        const { data: newSquad, error } = await supabase.from('squads').insert([{ code, name: code }]).select().single();
        if (error) throw error;
        squad = newSquad;
      }

      // Ensure member exists
      if (squad) {
        await supabase.from('members').insert([{ squad_id: squad.id, display_name: name }]).select().single();
        
        // If migrate is checked, we would upload `data` to PostgreSQL tables here.
        // For now, we set the squadInfo to pass the gatekeeper.
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

  return (
    <StoreContext.Provider value={{ data, squadInfo, handleJoinSquad, updateRegistrationStatus, updateChecklistItem, updateProject, addChatMessage, updatePowerHistory }}>
      {children}
    </StoreContext.Provider>
  );
};
