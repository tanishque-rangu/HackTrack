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
  registrationDeadline: string | null;
  submissionDeadline: string | null;
  eventDates: string;
  registrationLink: string;
  submissionLink: string;
  problemStatementLink?: string;
  notes?: string;
  teams: TeamMember[];
  projects?: Project[];
  
  // Mission Editor additions
  organizer?: string;
  description?: string;
  website?: string;
  prizePool?: string;
  location?: string;
  mode?: string; // Online / Offline / Hybrid
  eligibility?: string;
  teamSizeMin?: number;
  teamSizeMax?: number;
  
  discordLink?: string;
  githubLink?: string;
  otherLink?: string;
  
  status?: string; // Upcoming / Registration Open / Building / Submitted / Finalist / Completed / Archived
  
  verifiedAt?: string;
  verifiedBy?: string;
  archivedAt?: string;
}

export interface TimelineEvent {
  id: string;
  hackathonId: string;
  title: string;
  date: string;
  time?: string;
  description?: string;
  type?: string;
  status?: string;
  order?: number;
  archivedAt?: string;
}

export interface ProblemStatement {
  id: string;
  hackathonId: string;
  title: string;
  description: string;
  archivedAt?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  hackathonId: string;
  action: 'CREATED' | 'UPDATED' | 'ARCHIVED' | 'RESTORED' | 'VERIFIED';
  entityType: 'HACKATHON' | 'TIMELINE' | 'PROBLEM_STATEMENT' | 'LINK' | 'FIELD';
  entityId: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
}

export type Role = 'VIEWER' | 'EDITOR' | 'OWNER';

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
  
  // Collaborative Editing Data
  timelineEvents?: TimelineEvent[];
  problemStatements?: ProblemStatement[];
  activityLogs?: ActivityLog[];
  roles?: Record<string, Role>;
}
