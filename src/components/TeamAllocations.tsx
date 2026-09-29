import { useStore } from '../useStore';
import { motion } from 'framer-motion';
import { ShieldAlert, Users } from 'lucide-react';

export default function TeamAllocations() {
  const { data } = useStore();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-8"
    >
      <div className="mb-2">
        <h2 className="text-2xl font-bold">Team Allocations</h2>
      </div>

      <div className="bg-gradient-to-br from-card to-card/50 rounded-2xl p-5 border border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
        <h3 className="flex items-center gap-2 font-bold text-lg text-primary mb-4">
          <ShieldAlert size={20} /> Ground Rules
        </h3>
        <ul className="space-y-3">
          {data.teamRules.map((rule, idx) => (
            <li key={idx} className="text-sm text-gray-300 leading-relaxed flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </div>

      <h3 className="font-bold text-xl pt-4">Hackathon Squads</h3>
      
      <div className="grid gap-4 md:grid-cols-2">
        {data.hackathons.map((h, i) => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            key={h.id} 
            className="bg-card rounded-2xl p-5 border border-white/5"
          >
            <div className="mb-4">
              <h4 className="font-bold text-lg">{h.name}</h4>
              <p className="text-xs text-gray-400 mt-1">{h.notes || h.format}</p>
            </div>
            
            <div className="space-y-3">
              {h.teams.map((team, idx) => (
                <div key={idx} className="bg-white/5 rounded-xl p-3">
                  <h5 className="text-sm font-semibold text-primary mb-2 flex items-center gap-1.5">
                    <Users size={14} /> {team.teamLabel}
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {team.members.map(m => (
                      <span key={m} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-md border border-gray-700">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
