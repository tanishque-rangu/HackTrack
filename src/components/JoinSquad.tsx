import { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, ArrowRight } from 'lucide-react';
import { useTheme } from '../theme/ThemeProvider';

interface JoinSquadProps {
  onJoin: (code: string, name: string) => void;
}

export default function JoinSquad({ onJoin }: JoinSquadProps) {
  const { actualTheme } = useTheme();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim() && name.trim()) {
      onJoin(code.trim().toUpperCase(), name.trim());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-background text-foreground relative overflow-hidden">
      {actualTheme === 'dark' && (
        <>
          <div className="shenron-bg"></div>
          <div className="absolute inset-0 bg-ki-gradient pointer-events-none opacity-30 z-0"></div>
        </>
      )}
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative z-10 w-full max-w-md p-8 backdrop-blur-xl border rounded-lg ${actualTheme === 'dark' ? 'bg-card/90 border-primary/30 shadow-[0_0_50px_rgba(245,124,0,0.15)]' : 'bg-card border-borderSubtle shadow-xl'}`}
      >
        <div className="flex justify-center mb-6">
          {actualTheme === 'dark' ? (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primaryLight to-primary shadow-[0_0_20px_rgba(245,124,0,0.5)] flex items-center justify-center border-2 border-background/50 relative overflow-hidden">
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.4),transparent_60%)]"></div>
              <span className="kanji-emblem text-3xl text-[#fff0cc] text-glow-yellow relative z-10">悟</span>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
              <Target size={32} className="text-primary" />
            </div>
          )}
        </div>
        
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-black tracking-widest uppercase mb-2 ${actualTheme === 'dark' ? 'text-glow-orange text-foreground' : 'text-foreground'}`}>Join Squad</h1>
          <p className={`text-sm font-medium tracking-wide ${actualTheme === 'dark' ? 'text-[var(--text-gray-400)]' : 'text-muted'}`}>Enter your squad coordinates to synchronize.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1 ${actualTheme === 'dark' ? 'text-primaryLight' : 'text-muted'}`}>
              <Target size={12} /> Squad Code
            </label>
            <input 
              type="text" 
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. ALPHA-7"
              required
              className={`w-full border rounded px-4 py-3 text-sm font-bold text-foreground focus:outline-none transition-all uppercase tracking-wider ${actualTheme === 'dark' ? 'bg-[#0a0a0a] border-borderMuted placeholder:text-gray-600 focus:border-primary/50 focus:ring-1 focus:ring-primary/50' : 'bg-background border-borderSubtle placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary'}`}
            />
          </div>

          <div>
            <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${actualTheme === 'dark' ? 'text-primaryLight' : 'text-muted'}`}>
              Display Name
            </label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={actualTheme === 'dark' ? "e.g. Goku" : "e.g. Alex"}
              required
              className={`w-full border rounded px-4 py-3 text-sm font-bold text-foreground focus:outline-none transition-all uppercase tracking-wider ${actualTheme === 'dark' ? 'bg-[#0a0a0a] border-borderMuted placeholder:text-gray-600 focus:border-primary/50 focus:ring-1 focus:ring-primary/50' : 'bg-background border-borderSubtle placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary'}`}
            />
          </div>

          <button 
            type="submit"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`w-full relative overflow-hidden flex items-center justify-center gap-2 text-sm font-black px-4 py-3.5 rounded mt-4 transition-all duration-300 ${actualTheme === 'dark' ? 'text-[#070707] bg-primary hover:bg-primaryLight border border-primaryLight box-glow-orange' : 'text-primaryForeground bg-primary hover:bg-primary/90 border border-primary'}`}
          >
            {actualTheme === 'dark' && <div className={`absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 transition-transform duration-700 ${isHovered ? 'translate-x-[150%]' : 'translate-x-[-150%]'}`}></div>}
            SYNCHRONIZE <ArrowRight size={16} />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
