import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, ShieldCheck, Zap, Database, MessageSquare, Activity, Lock, Target, ArrowRight, Sparkles, Binary, Fingerprint } from 'lucide-react';

const AgentOrb = ({ delay, color, icon: Icon }: { delay: number, color: string, icon: any }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ duration: 0.6, delay }}
    className="relative group"
  >
    {/* Particle trail path */}
    <motion.div 
      animate={{ 
        pathLength: [0, 1],
        opacity: [0, 1, 0]
      }}
      transition={{ duration: 2, repeat: Infinity, delay: delay + 0.5 }}
      className="absolute inset-0 z-0"
    >
      <svg className="w-full h-full overflow-visible">
        <circle cx="50%" cy="50%" r="40" fill="none" stroke="currentColor" strokeWidth="1" className={color} strokeDasharray="4 4" />
      </svg>
    </motion.div>

    <div className={`w-16 h-16 rounded-2xl ${color} bg-opacity-10 border border-current flex items-center justify-center relative z-10 backdrop-blur-sm shadow-lg group-hover:scale-110 transition-transform`}>
      <Icon className="w-7 h-7" />
      {/* Animated Scan Line */}
      <motion.div 
        animate={{ top: ['-10%', '110%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-px bg-current opacity-30 shadow-[0_0_8px_currentColor]"
      />
    </div>
  </motion.div>
);

export const ProtocolFlow = () => {
  return (
    <div className="relative w-full max-w-4xl mx-auto py-20 overflow-hidden">
      {/* Dynamic Background Grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #4f46e5 1px, transparent 0)', backgroundSize: '32px 32px' }} />

      <div className="relative flex flex-col items-center">
        
        {/* Phase 1: Input Directive */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col items-center gap-4 mb-16"
        >
          <div className="w-20 h-20 bg-gray-900 rounded-[28px] flex items-center justify-center text-indigo-400 shadow-2xl relative">
            <MessageSquare className="w-8 h-8" />
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-indigo-500 rounded-[28px] blur-xl -z-10"
            />
          </div>
          <div className="text-center">
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.25em]">Phase 1</span>
            <h4 className="text-sm font-black text-gray-900 uppercase tracking-tighter mt-1">User Question</h4>
          </div>
        </motion.div>

        {/* Phase 2: Adversarial Multi-Agent Processing */}
        <div className="relative flex flex-col items-center mb-16 w-full">
          <div className="text-center mb-8">
            <span className="text-[10px] font-black text-rose-600 uppercase tracking-[0.25em]">Phase 2</span>
            <h4 className="text-sm font-black text-gray-900 uppercase tracking-tighter mt-1">Adversarial Debate</h4>
          </div>
          
          <div className="relative flex items-center justify-center gap-12 w-full">
            {/* Connector Lines */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-24 pointer-events-none opacity-20">
              <svg width="100%" height="100%" viewBox="0 0 400 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 50 C 100 50, 100 10, 200 10" stroke="#4f46e5" strokeWidth="2" strokeDasharray="4 4" />
                <path d="M0 50 L 200 50" stroke="#4f46e5" strokeWidth="2" strokeDasharray="4 4" />
                <path d="M0 50 C 100 50, 100 90, 200 90" stroke="#4f46e5" strokeWidth="2" strokeDasharray="4 4" />
              </svg>
            </div>

            <AgentOrb delay={0.2} color="text-rose-500" icon={Activity} />
            <AgentOrb delay={0.4} color="text-indigo-500" icon={Brain} />
            <AgentOrb delay={0.6} color="text-amber-500" icon={Database} />
          </div>
        </div>

        {/* Phase 3: Consensus Synthesis */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1 }}
          className="relative group mt-8"
        >
          {/* Rotating Rings */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-x-[-40px] inset-y-[-40px] border border-indigo-200 rounded-full border-dashed opacity-50"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute inset-x-[-20px] inset-y-[-20px] border border-gray-200 rounded-full border-dashed opacity-50"
          />

          <div className="bg-white rounded-[40px] p-10 shadow-[0_40px_80px_-15px_rgba(79,70,229,0.2)] border border-indigo-50 relative z-10 w-[320px] text-center">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 mx-auto mb-6">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-2 block">Phase 3</span>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none uppercase mb-4">Trusted Answer</h3>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
              Answer verified by 3 independent agents
            </p>
            
            {/* Visual Confidence Meter */}
            <div className="mt-8 flex items-center justify-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(i => (
                  <motion.div 
                    key={i}
                    animate={{ scaleY: [1, 1.5, 1] }}
                    transition={{ duration: 1.5, delay: i * 0.1, repeat: Infinity }}
                    className="w-1 h-4 bg-indigo-600 rounded-full"
                  />
                ))}
              </div>
              <span className="text-xl font-black text-indigo-600">98.2%</span>
            </div>
          </div>

          {/* Floating Data Glyphs */}
          <motion.div 
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -right-24 top-0 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3 z-20"
          >
            <Binary className="w-4 h-4 text-gray-400" />
            <span className="text-[8px] font-black text-gray-800 uppercase tracking-widest">Source Check</span>
          </motion.div>

          <motion.div 
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute -left-24 bottom-10 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3 z-20"
          >
            <Fingerprint className="w-4 h-4 text-indigo-500" />
            <span className="text-[8px] font-black text-gray-800 uppercase tracking-widest">Step History</span>
          </motion.div>
        </motion.div>

      </div>
    </div>
  );
};
