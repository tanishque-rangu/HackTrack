import { useStore } from '../useStore';
import { motion } from 'framer-motion';
import { ExternalLink, CheckCircle2, Link as LinkIcon } from 'lucide-react';

export default function AllLinks() {
  const { data } = useStore();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-8"
    >
      <div>
        <h2 className="text-2xl font-bold mb-4">Submission Checklist</h2>
        <div className="bg-gradient-to-br from-card to-card/50 rounded-2xl p-5 border border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.1)] space-y-4">
          {data.submissionChecklist.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-300 leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Quick Links</h2>
        <div className="bg-card rounded-2xl border border-white/5 overflow-hidden divide-y divide-white/5">
          {data.hackathons.map((h, i) => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              key={h.id} 
              className="p-4 hover:bg-white/[0.02] transition-colors"
            >
              <h3 className="font-bold text-lg mb-3">{h.name}</h3>
              <div className="space-y-2">
                {h.registrationLink && (
                  <a 
                    href={h.registrationLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-black/20 hover:bg-black/40 transition-colors border border-transparent hover:border-white/5 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <LinkIcon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-200">Registration Link</p>
                      <p className="text-xs text-gray-500 truncate">{h.registrationLink}</p>
                    </div>
                    <ExternalLink size={16} className="text-gray-600 group-hover:text-primary transition-colors" />
                  </a>
                )}
                
                {h.submissionLink && h.submissionLink !== h.registrationLink && (
                  <a 
                    href={h.submissionLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-black/20 hover:bg-black/40 transition-colors border border-transparent hover:border-white/5 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                      <LinkIcon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-200">Submission Link</p>
                      <p className="text-xs text-gray-500 truncate">{h.submissionLink}</p>
                    </div>
                    <ExternalLink size={16} className="text-gray-600 group-hover:text-primary transition-colors" />
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
