import { useState, useEffect } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { useStore } from '../useStore';
import { Save, AlertCircle, Trash2, Plus, Clock, FileText, CheckCircle2 } from 'lucide-react';
import type { Hackathon, TimelineEvent, ProblemStatement } from '../types';

interface Props {
  hackathonId: string | null; // null means ADD NEW
  onClose: () => void;
}

export function MissionEditor({ hackathonId, onClose }: Props) {
  const { actualTheme } = useTheme();
  const { data, addHackathon, updateHackathon, deleteHackathon, addTimelineEvent, updateTimelineEvent, addProblemStatement, updateProblemStatement, verifyHackathon } = useStore();
  const currentUserId = localStorage.getItem('hacktrack-sender') || 'Unknown';

  const [formData, setFormData] = useState<Partial<Hackathon>>({
    name: '', organizer: '', description: '', website: '',
    registrationDeadline: '', submissionDeadline: '', eventDates: '',
    platform: 'Custom', format: 'Online',
    registrationLink: '', submissionLink: '', discordLink: '', githubLink: '',
    prizePool: '', location: '', mode: 'Online', eligibility: '',
    status: 'Upcoming'
  });

  const [localTimeline, setLocalTimeline] = useState<TimelineEvent[]>([]);
  const [localProblems, setLocalProblems] = useState<ProblemStatement[]>([]);

  useEffect(() => {
    if (hackathonId) {
      const h = data.hackathons.find(hx => hx.id === hackathonId);
      if (h) setFormData(h);
      
      const t = (data.timelineEvents || []).filter(tx => tx.hackathonId === hackathonId && !tx.archivedAt);
      setLocalTimeline(t);
      
      const p = (data.problemStatements || []).filter(px => px.hackathonId === hackathonId && !px.archivedAt);
      setLocalProblems(p);
    }
  }, [hackathonId, data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!formData.name) {
      alert("Name is required");
      return;
    }

    if (!hackathonId) {
      // Create new
      const newId = formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      addHackathon({
        ...formData,
        id: newId,
        teams: [{ teamLabel: 'Team A', members: [] }],
        projects: []
      } as Hackathon);
      onClose();
    } else {
      // Update existing
      updateHackathon(hackathonId, formData, currentUserId);
      onClose();
    }
  };

  const addTimeline = () => {
    if (!hackathonId) return alert("Save the hackathon first to add timeline events.");
    const title = prompt("Event Title:");
    if (!title) return;
    const date = prompt("Date (YYYY-MM-DD):") || new Date().toISOString().split('T')[0];
    
    addTimelineEvent({
      id: Math.random().toString(36).substr(2, 9),
      hackathonId,
      title,
      date,
      order: localTimeline.length
    }, currentUserId);
  };

  const addProblem = () => {
    if (!hackathonId) return alert("Save the hackathon first to add problem statements.");
    const title = prompt("Problem Title:");
    if (!title) return;
    
    addProblemStatement({
      id: Math.random().toString(36).substr(2, 9),
      hackathonId,
      title,
      description: 'Pending details...'
    }, currentUserId);
  };

  const inputClass = `w-full p-3.5 rounded-lg text-sm border focus:outline-none focus:ring-2 transition-all duration-300 ${
    actualTheme === 'dark' 
      ? 'bg-white/5 border-primary/20 text-white placeholder:text-gray-600 focus:border-primary focus:bg-white/10 focus:ring-primary/30 shadow-inner' 
      : 'bg-white border-borderSubtle text-foreground focus:border-primary focus:ring-primary/20 shadow-sm'
  }`;
  
  const labelClass = `block text-[11px] font-black uppercase tracking-widest mb-2 ${actualTheme === 'dark' ? 'text-primaryLight drop-shadow-[0_0_8px_rgba(255,167,38,0.4)]' : 'text-muted'}`;

  return (
    <div className={`w-full flex flex-col h-full p-4 md:p-6 ${actualTheme === 'dark' ? 'text-gray-200' : 'text-foreground'}`}>
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-borderSubtle shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary text-black font-black text-xl shadow-[0_0_15px_rgba(245,124,0,0.5)]">
            悟
          </div>
          <div>
            <h2 className={`text-2xl font-black uppercase tracking-tight ${actualTheme === 'dark' ? 'text-foreground text-glow-orange' : 'text-foreground'}`}>
              {hackathonId ? 'EDIT MISSION' : 'NEW MISSION'}
            </h2>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${actualTheme === 'dark' ? 'text-[var(--text-gray-400)]' : 'text-muted'}`}>
              Modify the mission parameters
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors ${actualTheme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-panelAlt'}`}>
            Cancel
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-primary text-[#070707] text-xs font-black uppercase tracking-widest rounded shadow-[0_0_15px_rgba(245,124,0,0.4)] hover:bg-primaryLight hover:-translate-y-0.5 transition-all">
            <Save size={14} /> Save Changes
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-8 custom-scrollbar pr-4 pb-10 mt-2">
        
        {hackathonId && (
          <div className={`p-5 rounded-xl border flex justify-between items-center shadow-sm ${actualTheme === 'dark' ? 'bg-gradient-to-r from-black/40 to-black/10 border-primary/20 backdrop-blur-md' : 'bg-panelAlt border-borderSubtle'}`}>
            <div className="flex items-center gap-3">
              <CheckCircle2 className={formData.verifiedAt ? "text-success" : "text-warning"} size={20} />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider">
                  {formData.verifiedAt ? `Verified by ${formData.verifiedBy}` : 'Needs Verification'}
                </div>
                {formData.verifiedAt && <div className="text-[10px] opacity-60">Last verified: {new Date(formData.verifiedAt).toLocaleString()}</div>}
              </div>
            </div>
            <button 
              onClick={() => verifyHackathon(hackathonId, currentUserId)}
              className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded border transition-colors ${actualTheme === 'dark' ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20' : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'}`}
            >
              Verify Information
            </button>
          </div>
        )}

        <section className={`p-6 rounded-xl border ${actualTheme === 'dark' ? 'bg-[#0f0a05] border-primary/20 shadow-[0_0_20px_rgba(245,124,0,0.05)]' : 'bg-card border-borderSubtle'}`}>
          <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-5 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-primary rounded-full"></div> Basic Information
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Hackathon Name</label>
              <input name="name" value={formData.name || ''} onChange={handleChange} className={inputClass} placeholder="e.g. OpenCV AI Hackathon" />
            </div>
            <div>
              <label className={labelClass}>Organizer</label>
              <input name="organizer" value={formData.organizer || ''} onChange={handleChange} className={inputClass} placeholder="e.g. OpenCV" />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Description</label>
              <textarea name="description" value={formData.description || ''} onChange={handleChange} className={inputClass} rows={3} placeholder="Brief summary of the event..."></textarea>
            </div>
            <div>
              <label className={labelClass}>Website</label>
              <input name="website" value={formData.website || ''} onChange={handleChange} className={inputClass} placeholder="https://..." />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select name="status" value={formData.status || ''} onChange={handleChange} className={inputClass}>
                <option value="Upcoming">Upcoming</option>
                <option value="Registration Open">Registration Open</option>
                <option value="Building">Building</option>
                <option value="Submitted">Submitted</option>
                <option value="Finalist">Finalist</option>
                <option value="Completed">Completed</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>
        </section>

        <section className={`p-6 rounded-xl border ${actualTheme === 'dark' ? 'bg-[#0f0a05] border-primary/20 shadow-[0_0_20px_rgba(245,124,0,0.05)]' : 'bg-card border-borderSubtle'}`}>
          <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-5 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-primary rounded-full"></div> Timeline & Deadlines
          </h3>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass}>Registration Deadline</label>
              <input type="date" name="registrationDeadline" value={formData.registrationDeadline || ''} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Submission Deadline</label>
              <input type="date" name="submissionDeadline" value={formData.submissionDeadline || ''} onChange={handleChange} className={inputClass} />
            </div>
          </div>
          
          {hackathonId && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-3">
                <label className={labelClass}>Custom Timeline Events</label>
                <button onClick={addTimeline} className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1 hover:underline">
                  <Plus size={12} /> Add Event
                </button>
              </div>
              <div className="space-y-2">
                {localTimeline.length === 0 ? (
                  <div className={`p-4 text-center rounded border border-dashed text-xs opacity-50 ${actualTheme === 'dark' ? 'border-borderMuted' : 'border-borderSubtle'}`}>No custom events added.</div>
                ) : (
                  localTimeline.map(ev => (
                    <div key={ev.id} className={`flex items-center justify-between p-3 rounded border ${actualTheme === 'dark' ? 'bg-black/20 border-borderSubtle' : 'bg-panelAlt border-borderSubtle'}`}>
                      <div className="flex items-center gap-3">
                        <Clock size={16} className="text-primary" />
                        <div>
                          <div className="font-bold text-sm">{ev.title}</div>
                          <div className="text-xs opacity-60">{ev.date}</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          if (window.confirm("Archive this event?")) {
                            updateTimelineEvent(ev.id, { archivedAt: new Date().toISOString() }, currentUserId);
                          }
                        }}
                        className="text-danger hover:bg-danger/10 p-1.5 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </section>

        {hackathonId && (
          <section className={`p-6 rounded-xl border ${actualTheme === 'dark' ? 'bg-[#0f0a05] border-primary/20 shadow-[0_0_20px_rgba(245,124,0,0.05)]' : 'bg-card border-borderSubtle'}`}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <div className="w-1.5 h-4 bg-primary rounded-full"></div> Problem Statements
              </h3>
              <button onClick={addProblem} className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1 hover:underline">
                <Plus size={12} /> Add Problem
              </button>
            </div>
            <div className="space-y-2">
              {localProblems.length === 0 ? (
                <div className={`p-4 text-center rounded border border-dashed text-xs opacity-50 ${actualTheme === 'dark' ? 'border-borderMuted' : 'border-borderSubtle'}`}>No problem statements added.</div>
              ) : (
                localProblems.map(ps => (
                  <div key={ps.id} className={`flex items-start justify-between p-3 rounded border ${actualTheme === 'dark' ? 'bg-black/20 border-borderSubtle' : 'bg-panelAlt border-borderSubtle'}`}>
                    <div className="flex items-start gap-3">
                      <FileText size={16} className="text-primary mt-0.5" />
                      <div>
                        <div className="font-bold text-sm">{ps.title}</div>
                        <div className="text-xs opacity-60 mt-1">{ps.description}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        if (window.confirm("Archive this problem statement?")) {
                          updateProblemStatement(ps.id, { archivedAt: new Date().toISOString() }, currentUserId);
                        }
                      }}
                      className="text-danger hover:bg-danger/10 p-1.5 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        <section>
          <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-4 border-b border-primary/20 pb-2">Hackathon Details</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Prize Pool</label>
              <input name="prizePool" value={formData.prizePool || ''} onChange={handleChange} className={inputClass} placeholder="e.g. $10,000" />
            </div>
            <div>
              <label className={labelClass}>Mode</label>
              <select name="mode" value={formData.mode || ''} onChange={handleChange} className={inputClass}>
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Location</label>
              <input name="location" value={formData.location || ''} onChange={handleChange} className={inputClass} placeholder="e.g. San Francisco, CA" />
            </div>
            <div>
              <label className={labelClass}>Eligibility</label>
              <input name="eligibility" value={formData.eligibility || ''} onChange={handleChange} className={inputClass} placeholder="e.g. University Students" />
            </div>
          </div>
        </section>

        <section className={`p-6 rounded-xl border ${actualTheme === 'dark' ? 'bg-[#0f0a05] border-primary/20 shadow-[0_0_20px_rgba(245,124,0,0.05)]' : 'bg-card border-borderSubtle'}`}>
          <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-5 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-primary rounded-full"></div> Important Links
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Registration URL</label>
              <input name="registrationLink" value={formData.registrationLink || ''} onChange={handleChange} className={inputClass} placeholder="https://..." />
            </div>
            <div>
              <label className={labelClass}>Submission URL</label>
              <input name="submissionLink" value={formData.submissionLink || ''} onChange={handleChange} className={inputClass} placeholder="https://..." />
            </div>
            <div>
              <label className={labelClass}>Discord / Comms</label>
              <input name="discordLink" value={formData.discordLink || ''} onChange={handleChange} className={inputClass} placeholder="https://discord.gg/..." />
            </div>
            <div>
              <label className={labelClass}>GitHub / Repo</label>
              <input name="githubLink" value={formData.githubLink || ''} onChange={handleChange} className={inputClass} placeholder="https://github.com/..." />
            </div>
          </div>
        </section>

        {hackathonId && (
          <section className={`p-6 rounded-xl border ${actualTheme === 'dark' ? 'bg-[#0f0a05] border-primary/20 shadow-[0_0_20px_rgba(245,124,0,0.05)]' : 'bg-card border-borderSubtle'}`}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <div className="w-1.5 h-4 bg-primary rounded-full"></div> Combat Units (Teams)
              </h3>
              <button 
                onClick={() => setFormData(prev => ({ ...prev, teams: [...(prev.teams || []), { teamLabel: `Team ${String.fromCharCode(65 + (prev.teams?.length || 0))}`, members: [] }] }))} 
                className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1 hover:underline"
              >
                <Plus size={12} /> Add Unit
              </button>
            </div>
            <div className="space-y-3">
              {(formData.teams || []).map((t, i) => (
                <div key={i} className={`p-3 rounded border ${actualTheme === 'dark' ? 'bg-black/20 border-borderSubtle' : 'bg-panelAlt border-borderSubtle'}`}>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className={labelClass}>Unit Designation</label>
                      <input 
                        value={t.teamLabel} 
                        onChange={(e) => {
                          const newTeams = [...(formData.teams || [])];
                          newTeams[i].teamLabel = e.target.value;
                          setFormData(prev => ({ ...prev, teams: newTeams }));
                        }} 
                        className={inputClass} 
                      />
                    </div>
                    <div className="flex-1">
                      <label className={labelClass}>Operatives (comma separated)</label>
                      <input 
                        value={t.members.join(', ')} 
                        onChange={(e) => {
                          const newTeams = [...(formData.teams || [])];
                          newTeams[i].members = e.target.value.split(',').map(m => m.trim()).filter(Boolean);
                          setFormData(prev => ({ ...prev, teams: newTeams }));
                        }} 
                        className={inputClass} 
                        placeholder="e.g. Goku, Vegeta"
                      />
                    </div>
                    <button 
                      onClick={() => {
                        const newTeams = [...(formData.teams || [])];
                        newTeams.splice(i, 1);
                        setFormData(prev => ({ ...prev, teams: newTeams }));
                      }}
                      className="mt-6 text-danger hover:bg-danger/10 p-2 rounded transition-colors self-start"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {hackathonId && (
          <section className={`p-6 rounded-xl border ${actualTheme === 'dark' ? 'bg-[#0f0a05] border-primary/20 shadow-[0_0_20px_rgba(245,124,0,0.05)]' : 'bg-card border-borderSubtle'}`}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <div className="w-1.5 h-4 bg-primary rounded-full"></div> Projects & Submissions
              </h3>
              <button 
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  projects: [...(prev.projects || []), { team: (prev.teams?.[0]?.teamLabel || 'Team A'), projectName: 'New Project', buildStatus: 'Not Started' }] 
                }))} 
                className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1 hover:underline"
              >
                <Plus size={12} /> Add Project
              </button>
            </div>
            <div className="space-y-3">
              {(formData.projects || []).map((p, i) => (
                <div key={i} className={`p-3 rounded border ${actualTheme === 'dark' ? 'bg-black/20 border-borderSubtle' : 'bg-panelAlt border-borderSubtle'}`}>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Project Designation</label>
                      <input 
                        value={p.projectName} 
                        onChange={(e) => {
                          const newProjs = [...(formData.projects || [])];
                          newProjs[i].projectName = e.target.value;
                          setFormData(prev => ({ ...prev, projects: newProjs }));
                        }} 
                        className={inputClass} 
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Assigned Unit</label>
                      <select 
                        value={p.team} 
                        onChange={(e) => {
                          const newProjs = [...(formData.projects || [])];
                          newProjs[i].team = e.target.value;
                          setFormData(prev => ({ ...prev, projects: newProjs }));
                        }} 
                        className={inputClass}
                      >
                        {(formData.teams || []).map(t => (
                          <option key={t.teamLabel} value={t.teamLabel}>{t.teamLabel}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Repository Link</label>
                      <input 
                        value={p.repoLink || ''} 
                        onChange={(e) => {
                          const newProjs = [...(formData.projects || [])];
                          newProjs[i].repoLink = e.target.value;
                          setFormData(prev => ({ ...prev, projects: newProjs }));
                        }} 
                        className={inputClass} 
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className={labelClass}>Current Phase</label>
                        <select 
                          value={p.buildStatus} 
                          onChange={(e) => {
                            const newProjs = [...(formData.projects || [])];
                            newProjs[i].buildStatus = e.target.value as any;
                            setFormData(prev => ({ ...prev, projects: newProjs }));
                          }} 
                          className={inputClass}
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="Idea Stage">Idea Stage</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Submitted">Submitted</option>
                          <option value="Done">Done</option>
                        </select>
                      </div>
                      <button 
                        onClick={() => {
                          const newProjs = [...(formData.projects || [])];
                          newProjs.splice(i, 1);
                          setFormData(prev => ({ ...prev, projects: newProjs }));
                        }}
                        className="mt-6 text-danger hover:bg-danger/10 p-2 rounded transition-colors self-start"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        
        {hackathonId && (
          <div className="pt-8 border-t border-danger/20 flex justify-between items-center">
            <button 
              onClick={() => {
                if (window.confirm("WARNING: This will permanently eradicate this hackathon. This cannot be undone. Proceed?")) {
                  deleteHackathon(hackathonId, currentUserId);
                  onClose();
                }
              }}
              className="px-4 py-2 text-xs font-black uppercase tracking-widest text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded flex items-center gap-2 transition-colors"
            >
              <Trash2 size={14} /> PERMANENT DELETE
            </button>
            <button 
              onClick={() => {
                if (window.confirm("Archive this entire hackathon? It will be hidden from the main dashboard.")) {
                  updateHackathon(hackathonId, { archivedAt: new Date().toISOString() }, currentUserId);
                  onClose();
                }
              }}
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-warning border border-warning/30 hover:bg-warning/10 rounded flex items-center gap-2 transition-colors"
            >
              <AlertCircle size={14} /> Archive Mission
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
