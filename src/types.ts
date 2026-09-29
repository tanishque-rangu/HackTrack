export type Platform = 'Unstop' | 'Devpost' | 'Centle' | 'Reskilll' | string;

export interface TeamMember {
  teamLabel: string;
  members: string[];
}

export interface Project {
  team: string;
  projectName: string;
  description?: string;
  buildStatus: 'Not Started' | 'Idea Stage' | 'In Progress' | 'Submitted' | 'Done';
  repoLink?: string;
  pptLink?: string;
  demoLink?: string;
  notes?: string;
}

export interface Hackathon {
  id: string;
  name: string;
  platform: Platform;
  format: string;
  registrationDeadline: string; // ISO date or null
  submissionDeadline: string | null;
  eventDates: string;
  registrationLink: string;
  submissionLink: string;
  problemStatementLink?: string;
  notes?: string;
  teams: TeamMember[];
  projects?: Project[];
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

export interface StoreData {
  members: string[];
  teamRules: string[];
  hackathons: Hackathon[];
  submissionChecklist: string[];
  // Registration status: hackathonId -> memberName -> status
  registrationStatus: Record<string, Record<string, 'Registered' | 'Not Yet' | 'N/A'>>;
  // Checklist state: hackathonId -> checklistItemText -> { done, owner }
  checklistState?: Record<string, Record<string, { done: boolean; owner?: string }>>;
  // Chat messages per hackathon: hackathonId -> ChatMessage[]
  chats: Record<string, ChatMessage[]>;
  powerHistory?: number[];
}
