import { useStore } from '../useStore';
import { motion } from 'framer-motion';
import { GitBranch, Presentation, Video, Code2 } from 'lucide-react';
import type { Project } from '../types';

export default function Projects() {
  const { data, updateProject } = useStore();

  const statuses = ['Not Started', 'Idea Stage', 'In Progress', 'Submitted', 'Done'] as const;

  const getStatusColor = (status: Project['buildStatus']) => {
    switch(status) {
      case 'Not Started': return 'bg-gray-800 text-gray-400 border-gray-700';
      case 'Idea Stage': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'In Progress': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Submitted': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Done': return 'bg-green-500/20 text-green-400 border-green-500/30 shadow-[0_0_8px_rgba(34,197,94,0.2)]';
    }
  };

  const cycleStatus = (hackathonId: string, teamLabel: string, currentStatus: Project['buildStatus'] = 'Not Started') => {
    const currentIndex = statuses.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statuses.length;
    updateProject(hackathonId, teamLabel, { buildStatus: statuses[nextIndex] });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-8"
    >
      <div className="mb-2">
        <h2 className="text-2xl font-bold">Project Tracker</h2>
        <p className="text-gray-400 text-sm mt-1">Tap fields to edit inline</p>
      </div>

      <div className="space-y-8">
        {data.hackathons.map((h, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={h.id}
          >
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <Code2 size={18} className="text-primary" /> {h.name}
            </h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              {h.teams.map(team => {
                const project = h.projects?.find(p => p.team === team.teamLabel) || {
                  team: team.teamLabel,
                  projectName: '',
                  buildStatus: 'Not Started'
                } as Project;

                return (
                  <div key={team.teamLabel} className="bg-card rounded-2xl p-4 border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary/50 to-purple-500/50" />
                    
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        {team.teamLabel}
                      </span>
                      <button
                        onClick={() => cycleStatus(h.id, team.teamLabel, project.buildStatus)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-full border transition-colors ${getStatusColor(project.buildStatus)}`}
                      >
                        {project.buildStatus}
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Project Name / Idea..."
                      value={project.projectName}
                      onChange={(e) => updateProject(h.id, team.teamLabel, { projectName: e.target.value })}
                      className="w-full bg-transparent text-lg font-bold placeholder-gray-600 focus:outline-none focus:border-primary/50 border-b border-transparent mb-2 pb-1 transition-colors"
                    />

                    <textarea
                      placeholder="Brief description..."
                      value={project.description || ''}
                      onChange={(e) => updateProject(h.id, team.teamLabel, { description: e.target.value })}
                      className="w-full bg-transparent text-sm text-gray-400 placeholder-gray-600 focus:outline-none resize-none h-10 border-b border-transparent focus:border-primary/30 mb-4 transition-colors"
                    />

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 bg-black/20 rounded-lg p-2 focus-within:ring-1 ring-primary/50 transition-all">
                        <GitBranch size={16} className="text-gray-400" />
                        <input
                          type="url"
                          placeholder="GitHub Repo URL"
                          value={project.repoLink || ''}
                          onChange={(e) => updateProject(h.id, team.teamLabel, { repoLink: e.target.value })}
                          className="w-full bg-transparent text-sm focus:outline-none text-blue-400 placeholder-gray-600"
                        />
                      </div>
                      <div className="flex items-center gap-2 bg-black/20 rounded-lg p-2 focus-within:ring-1 ring-primary/50 transition-all">
                        <Presentation size={16} className="text-gray-400" />
                        <input
                          type="url"
                          placeholder="Deck / PPT URL"
                          value={project.pptLink || ''}
                          onChange={(e) => updateProject(h.id, team.teamLabel, { pptLink: e.target.value })}
                          className="w-full bg-transparent text-sm focus:outline-none text-orange-400 placeholder-gray-600"
                        />
                      </div>
                      <div className="flex items-center gap-2 bg-black/20 rounded-lg p-2 focus-within:ring-1 ring-primary/50 transition-all">
                        <Video size={16} className="text-gray-400" />
                        <input
                          type="url"
                          placeholder="Demo Video URL"
                          value={project.demoLink || ''}
                          onChange={(e) => updateProject(h.id, team.teamLabel, { demoLink: e.target.value })}
                          className="w-full bg-transparent text-sm focus:outline-none text-red-400 placeholder-gray-600"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
