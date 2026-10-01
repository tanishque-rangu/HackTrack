import { useState } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { useStore } from '../useStore';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { History, X, Undo } from 'lucide-react';

interface Props {
  hackathonId?: string;
  onClose?: () => void;
}

export function ActivityLogView({ hackathonId, onClose }: Props) {
  const { actualTheme } = useTheme();
  const { data, updateHackathon, updateTimelineEvent, updateProblemStatement } = useStore();
  const currentUserId = localStorage.getItem('hacktrack-sender') || 'Unknown';
  const [filter, setFilter] = useState<'ALL' | 'HACKATHON' | 'TIMELINE' | 'PROBLEM_STATEMENT'>('ALL');

  let logs = data.activityLogs || [];
  if (hackathonId) {
    logs = logs.filter(l => l.hackathonId === hackathonId);
  }
  
  if (filter !== 'ALL') {
    logs = logs.filter(l => l.entityType === filter);
  }

  // Sort by timestamp descending
  logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getActionColor = (action: string) => {
    if (actualTheme === 'light') {
      switch (action) {
        case 'CREATED': return 'text-success bg-success/10 border-success/20';
        case 'UPDATED': return 'text-primary bg-primary/10 border-primary/20';
        case 'ARCHIVED': return 'text-danger bg-danger/10 border-danger/20';
        case 'RESTORED': return 'text-warning bg-warning/10 border-warning/20';
        case 'VERIFIED': return 'text-accent bg-accent/10 border-accent/20';
        default: return 'text-muted bg-panelAlt border-borderSubtle';
      }
    } else {
      switch (action) {
        case 'CREATED': return 'text-green-400 bg-green-500/10 border-green-500/30';
        case 'UPDATED': return 'text-primaryLight bg-primary/10 border-primary/30';
        case 'ARCHIVED': return 'text-red-400 bg-red-500/10 border-red-500/30';
        case 'RESTORED': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
        case 'VERIFIED': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
        default: return 'text-[var(--text-gray-400)] bg-white/5 border-borderMuted';
      }
    }
  };

  return (
    <div className={`w-full flex flex-col h-full ${actualTheme === 'dark' ? 'text-gray-200' : 'text-foreground'}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className={`text-xl font-black flex items-center gap-2 uppercase tracking-widest ${actualTheme === 'dark' ? 'text-primaryLight drop-shadow-md' : 'text-primary'}`}>
          <History className={actualTheme === 'dark' ? 'text-primary' : 'text-primary'} />
          ACTIVITY LOG
        </h3>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
        {['ALL', 'HACKATHON', 'TIMELINE', 'PROBLEM_STATEMENT'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded whitespace-nowrap transition-colors ${
              filter === f 
                ? (actualTheme === 'dark' ? 'bg-primary text-black' : 'bg-primary text-white')
                : (actualTheme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-panelAlt hover:bg-borderSubtle text-muted')
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2 pb-10">
        {logs.length === 0 ? (
          <div className="text-center py-10 opacity-50">
            <span className="text-4xl kanji-emblem block mb-4">無</span>
            <p className="font-bold tracking-widest text-sm uppercase">No activity recorded</p>
          </div>
        ) : (
          logs.map((log, i) => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              key={log.id} 
              className={`p-4 rounded border ${actualTheme === 'dark' ? 'bg-black/40 border-borderSubtle' : 'bg-card border-borderSubtle shadow-sm'}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 flex items-center justify-center text-[10px] font-black rounded-full ${actualTheme === 'dark' ? 'bg-primary/20 text-primary border border-primary/40' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                    {log.userId.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-bold text-sm">{log.userId}</span>
                  <span className="text-xs opacity-60">changed</span>
                  <span className="font-bold text-sm">{log.field || log.entityType.replace('_', ' ').toLowerCase()}</span>
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${getActionColor(log.action)}`}>
                  {log.action}
                </span>
              </div>
              
              <div className="pl-8 text-sm">
                {log.action === 'UPDATED' && log.oldValue && log.newValue ? (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="line-through opacity-50 max-w-[150px] truncate" title={log.oldValue}>{log.oldValue}</span>
                    <span className="opacity-50">→</span>
                    <span className="font-bold max-w-[150px] truncate" title={log.newValue}>{log.newValue}</span>
                  </div>
                ) : log.newValue ? (
                  <div className="mt-1 font-medium">{log.newValue}</div>
                ) : null}
                
                <div className="flex items-center gap-4 mt-2">
                  <div className="text-[10px] uppercase font-bold tracking-widest opacity-40">
                    {formatDistanceToNow(parseISO(log.timestamp), { addSuffix: true })}
                  </div>
                  {(log.action === 'UPDATED' || log.action === 'ARCHIVED') && (
                    <button 
                      onClick={() => {
                        if (log.entityType === 'HACKATHON' && log.field) {
                          updateHackathon(log.entityId, { [log.field]: log.oldValue }, currentUserId);
                        } else if (log.entityType === 'HACKATHON' && log.action === 'ARCHIVED') {
                          updateHackathon(log.entityId, { archivedAt: undefined }, currentUserId);
                        } else if (log.entityType === 'TIMELINE' && log.action === 'ARCHIVED') {
                          updateTimelineEvent(log.entityId, { archivedAt: undefined }, currentUserId);
                        } else if (log.entityType === 'PROBLEM_STATEMENT' && log.action === 'ARCHIVED') {
                          updateProblemStatement(log.entityId, { archivedAt: undefined }, currentUserId);
                        }
                      }}
                      className="text-[10px] uppercase font-black tracking-widest text-primary flex items-center gap-1 hover:underline opacity-80 hover:opacity-100"
                    >
                      <Undo size={12} /> RESTORE
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
