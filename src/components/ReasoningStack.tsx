import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, ShieldCheck, Zap, Database, MessageSquare, Activity, Lock, Target, ShieldAlert } from 'lucide-react';

export const ReasoningStack = () => {
  return (
    <div className="relative w-full max-w-lg mx-auto aspect-[4/5] flex flex-col items-center justify-center">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-transparent to-indigo-500/5 blur-[120px] rounded-full" />
      
      {/* The Stack */}
      <div className="relative w-full h-full flex flex-col items-center gap-6 z-10 p-4">
        
        {/* Top: Consensus Layer */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="w-full bg-white rounded-[40px] p-8 shadow-[0_32px_64px_-12px_rgba(79,70,229,0.15)] border border-indigo-100 relative group overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 opacity-50 blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-100 transition-colors" />
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">Synthesized Result</p>
                <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none uppercase">Verifiable Truth</h3>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Confidence</p>
              <p className="text-2xl font-black text-indigo-600">98%</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 1, delay: 1 }}
              className="h-3 bg-indigo-50 rounded-full overflow-hidden"
            >
              <motion.div 
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="h-full w-1/3 bg-indigo-600"
              />
            </motion.div>
            <div className="flex justify-between items-center">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="w-1 h-1 rounded-full bg-indigo-200" />
                ))}
              </div>
              <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Protocol: Active</p>
            </div>
          </div>
        </motion.div>

        {/* Dynamic Connector */}
        <div className="h-12 w-px bg-gradient-to-b from-indigo-200 to-transparent relative">
          <motion.div 
            animate={{ top: ['0%', '100%'], opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500"
          />
        </div>

        {/* Middle: Multi-Model Adversarial Layer */}
        <div className="w-full grid grid-cols-2 gap-4">
          {[
            { name: 'Red Team', model: 'Llama 3.3', color: 'bg-rose-50 text-rose-600 border-rose-100', icon: <ShieldAlert className="w-4 h-4" /> },
            { name: 'Synthesizer', model: 'Gemini 2.0', color: 'bg-indigo-50 text-indigo-600 border-indigo-100', icon: <Brain className="w-4 h-4" /> }
          ].map((agent, i) => (
            <motion.div 
              key={i}
              initial={{ x: i === 0 ? -20 : 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 + (i * 0.1) }}
              className={`p-6 rounded-[32px] border ${agent.color} shadow-lg shadow-gray-100/50 flex flex-col gap-4 relative overflow-hidden group`}
            >
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                {agent.icon}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">{agent.name}</p>
                <p className="text-sm font-black tracking-tight">{agent.model}</p>
              </div>
              <div className="flex gap-1 mt-auto">
                <div className="flex-1 h-1 bg-current opacity-20 rounded-full" />
                <div className="flex-1 h-1 bg-current opacity-20 rounded-full" />
                <div className="w-4 h-1 bg-current rounded-full" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Dynamic Connector */}
        <div className="h-8 w-px bg-indigo-100 relative" />

        {/* Bottom: Knowledge Layer */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full bg-gray-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-indigo-600/10 mix-blend-overlay" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Data Reservoir</p>
                  <h3 className="text-lg font-black tracking-tight uppercase leading-none">Institutional Corpus</h3>
                </div>
              </div>
              <Activity className="w-5 h-5 text-indigo-500 animate-pulse" />
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {[...Array(8)].map((_, i) => (
                <motion.div 
                  key={i}
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
                  className="h-1 bg-white/20 rounded-full" 
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Floating Technical Decorators */}
        <motion.div 
          animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-8 top-1/2 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 hidden xl:flex items-center gap-3 z-20"
        >
          <div className="p-2 bg-green-50 text-green-600 rounded-lg">
            <Lock className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Security</p>
            <p className="text-xs font-black text-gray-800">SOC2 Encrypted</p>
          </div>
        </motion.div>

        <motion.div 
          animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-8 bottom-40 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 hidden xl:flex items-center gap-3 z-20"
        >
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Target className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Grounding</p>
            <p className="text-xs font-black text-gray-800">Vector Search</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
