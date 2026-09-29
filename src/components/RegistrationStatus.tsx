import { useStore } from '../useStore';
import { motion } from 'framer-motion';
import { Check, X, Minus } from 'lucide-react';

export default function RegistrationStatus() {
  const { data, updateRegistrationStatus } = useStore();

  const handleCycleStatus = (hackathonId: string, member: string, current: 'Registered' | 'Not Yet' | 'N/A') => {
    const nextStatus = {
      'Registered': 'Not Yet',
      'Not Yet': 'N/A',
      'N/A': 'Registered'
    } as const;
    
    updateRegistrationStatus(hackathonId, member, nextStatus[current]);
  };

  const getStatusDisplay = (status: 'Registered' | 'Not Yet' | 'N/A') => {
    switch(status) {
      case 'Registered':
        return <div className="bg-green-500/20 text-green-400 w-8 h-8 rounded-lg flex items-center justify-center border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]"><Check size={18} /></div>;
      case 'Not Yet':
        return <div className="bg-amber-500/20 text-amber-400 w-8 h-8 rounded-lg flex items-center justify-center border border-amber-500/30"><X size={18} /></div>;
      case 'N/A':
        return <div className="bg-gray-800 text-gray-500 w-8 h-8 rounded-lg flex items-center justify-center border border-gray-700"><Minus size={18} /></div>;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 pb-8"
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold">Registration Status</h2>
      </div>
      <p className="text-gray-400 text-sm mb-6">Tap to cycle: Registered &rarr; Not Yet &rarr; N/A</p>

      {/* Mobile-optimized Card View */}
      <div className="grid gap-4 md:hidden">
        {data.hackathons.map((h, i) => (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            key={h.id} 
            className="bg-card rounded-2xl p-4 border border-white/5"
          >
            <h3 className="font-bold text-lg mb-4 truncate">{h.name}</h3>
            <div className="grid grid-cols-3 gap-3">
              {data.members.map(m => {
                const status = data.registrationStatus[h.id]?.[m] || 'N/A';
                return (
                  <button 
                    key={m}
                    onClick={() => handleCycleStatus(h.id, m, status)}
                    className="flex flex-col items-center gap-2 hover:scale-105 active:scale-95 transition-transform"
                  >
                    <span className="text-xs text-gray-300 font-medium">{m}</span>
                    {getStatusDisplay(status)}
                  </button>
                )
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Desktop Grid View */}
      <div className="hidden md:block bg-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-white/5 text-gray-400">
              <tr>
                <th className="px-6 py-4 font-semibold rounded-tl-2xl">Hackathon</th>
                {data.members.map(m => (
                  <th key={m} className="px-6 py-4 text-center font-semibold">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.hackathons.map((h) => (
                <tr key={h.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-medium max-w-[200px] truncate" title={h.name}>
                    {h.name}
                  </td>
                  {data.members.map(m => {
                    const status = data.registrationStatus[h.id]?.[m] || 'N/A';
                    return (
                      <td key={m} className="px-6 py-3">
                        <button 
                          onClick={() => handleCycleStatus(h.id, m, status)}
                          className="mx-auto flex justify-center hover:scale-110 active:scale-95 transition-transform"
                        >
                          {getStatusDisplay(status)}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
