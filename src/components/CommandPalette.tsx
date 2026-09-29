import { useState, useEffect } from 'react';
import { Search, Download, Upload, Target, X } from 'lucide-react';
import { useStore } from '../useStore';
import { motion, AnimatePresence } from 'framer-motion';

export function CommandPalette({ onSelectHackathon }: { onSelectHackathon: (id: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { data } = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleExport = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hacktrack_backup_${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    setIsOpen(false);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedData = JSON.parse(e.target?.result as string);
            localStorage.setItem('hacktrack-data', JSON.stringify(importedData));
            window.location.reload();
          } catch (err) {
            console.error('Failed to import data', err);
            alert('Invalid JSON file.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
    setIsOpen(false);
  };

  const filteredHackathons = data.hackathons.filter(h => 
    h.name.toLowerCase().includes(query.toLowerCase()) || 
    h.platform.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl bg-card border border-primary/30 rounded-lg shadow-[0_0_50px_rgba(245,124,0,0.1)] overflow-hidden flex flex-col"
            >
              <div className="flex items-center px-4 py-3 border-b border-white/10">
                <Search size={20} className="text-primary mr-3" />
                <input
                  autoFocus
                  type="text"
                  placeholder="SEARCH MISSIONS OR COMMANDS..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent text-white placeholder:text-gray-500 focus:outline-none text-sm font-black tracking-widest uppercase"
                />
                <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
                {query === '' && (
                  <>
                    <div className="px-3 py-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">Global Commands</div>
                    <button 
                      onClick={handleExport}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm font-bold text-gray-300 hover:bg-primary/10 hover:text-primary rounded transition-colors uppercase tracking-wider"
                    >
                      <Download size={16} /> EXPORT BACKUP (JSON)
                    </button>
                    <button 
                      onClick={handleImport}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm font-bold text-gray-300 hover:bg-primary/10 hover:text-primary rounded transition-colors uppercase tracking-wider"
                    >
                      <Upload size={16} /> IMPORT BACKUP (JSON)
                    </button>
                  </>
                )}

                {(query !== '' || data.hackathons.length > 0) && (
                  <div className="mt-2">
                    <div className="px-3 py-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">Missions</div>
                    {filteredHackathons.map(h => (
                      <button 
                        key={h.id}
                        onClick={() => {
                          onSelectHackathon(h.id);
                          setIsOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/5 rounded transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <Target size={16} className="text-primary/50 group-hover:text-primary transition-colors" />
                          <div>
                            <div className="text-sm font-bold text-white uppercase tracking-wider">{h.name}</div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{h.platform}</div>
                          </div>
                        </div>
                        <div className="text-[10px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          JUMP
                        </div>
                      </button>
                    ))}
                    {filteredHackathons.length === 0 && (
                      <div className="px-3 py-4 text-center text-sm font-bold text-gray-500 uppercase tracking-wider">
                        NO MISSIONS FOUND
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="bg-[#050505] border-t border-white/5 px-4 py-2 flex justify-between items-center text-[10px] font-black text-gray-500 tracking-widest">
                <span>ESC TO CLOSE</span>
                <span>CMD/CTRL + K</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
