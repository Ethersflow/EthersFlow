import React from 'react';
import { Logo } from './Logo';
import { ShieldCheck, Activity, Eye, Brain, Key, Award, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface AboutPageProps {
  onClose: () => void;
}

export function AboutPage({ onClose }: AboutPageProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#F9F8F6] text-[#1d1d1f] font-sans relative overflow-hidden"
    >
      {/* Absolute subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px]" />

      {/* Decorative Blur Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-50 blur-[128px] pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 rounded-full bg-amber-50 blur-[128px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 sm:py-24">
        {/* Navigation */}
        <button 
          onClick={onClose}
          className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#86868b] hover:text-[#1d1d1f] transition-all mb-16 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Terminal
        </button>

        {/* Hero Section */}
        <div className="max-w-3xl mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1d1d1f]/5 border border-[#1d1d1f]/10 mb-6 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-indigo-650 animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-black text-indigo-750">EthersFlow Corporate Manifesto</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-sans font-black tracking-tight leading-[0.95] uppercase mb-8">
            The Layer of Truth <br />
            <span className="text-indigo-600">for AI Intelligence.</span>
          </h1>
          <p className="text-xl sm:text-2xl font-bold text-gray-700 leading-relaxed tracking-tight">
            We do not train generic models. EthersFlow builds the neutral systems of logic and arbitration that hold them computationally accountable.
          </p>
        </div>

        {/* Core Narrative / Dual Column */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 sm:gap-20 mb-24 border-t border-gray-200/60 pt-16">
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600 mb-6">// THE PARADIGM SHIFT</h3>
            <h2 className="text-2xl sm:text-3xl font-sans font-black tracking-tight mb-6 uppercase text-gray-950">
              The Transparency Crisis of Closed Intelligence
            </h2>
            <div className="space-y-6 text-[#1d1d1f]/80 font-medium text-base leading-relaxed">
              <p>
                In the race for model supremacy, the world has defaulted to a highly fragile structure: relying on single-provider black-box models to run critical decisions in finance, legal audit, blockchain consensus, and intelligence operations.
              </p>
              <p>
                When a single model hallucinated, the output was blind. When bias crept in, it remained hidden. At EthersFlow, we recognized that the path to reliable synthetic reasoning is not a bigger neural network—it is <strong>adversarial consensus</strong>.
              </p>
            </div>
          </div>
          
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600 mb-6">// OUR CONVICTION</h3>
            <h2 className="text-2xl sm:text-3xl font-sans font-black tracking-tight mb-6 uppercase text-gray-950">
              Zero-Trust, Multi-Model Arbitration
            </h2>
            <div className="space-y-6 text-[#1d1d1f]/80 font-medium text-base leading-relaxed">
              <p>
                EthersFlow introduces <strong>Federated Adversarial Consensus (FAC)</strong>. We force independent frontier models to operate in a glass-box virtual debates room. Experts challenge one another’s assertions, inspect underlying reasoning links, detect contradictory premises, and compile transparent, auditable verdicts.
              </p>
              <p>
                Through this methodology, consensus is mathematically distilled and logical drift is penalized. We protect the workspace through device-level local tokenization, ensuring sovereign enterprise knowledge never leaks into the public training repositories.
              </p>
            </div>
          </div>
        </div>

        {/* Bento Grid Pillars */}
        <div className="mb-24">
          <div className="mb-10 text-center sm:text-left">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600 mb-2">// PHILOSOPHICAL FOUNDATIONS</h3>
            <h2 className="text-3xl sm:text-4xl font-sans font-black tracking-tight uppercase">The Three Pillars of Rigorous Logic</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-white border border-gray-150 p-8 rounded-[36px] shadow-sm hover:shadow-md transition-all">
              <div className="p-3 w-max rounded-2xl bg-indigo-50 text-indigo-600 mb-8">
                <Brain className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-black text-gray-950 uppercase tracking-tight mb-3">Federated Autonomy</h4>
              <p className="text-sm font-semibold text-gray-550 leading-relaxed">
                Objective consensus is impossible when a single corporation owns the inference stack. EthersFlow guarantees true multi-model diversity, pitting diverse systems (Gemini, Claude, GPT) against each other to neutralize singular cognitive biases.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white border border-gray-150 p-8 rounded-[36px] shadow-sm hover:shadow-md transition-all">
              <div className="p-3 w-max rounded-2xl bg-amber-50 text-amber-600 mb-8">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-black text-gray-950 uppercase tracking-tight mb-3">Red-Team Probing</h4>
              <p className="text-sm font-semibold text-gray-550 leading-relaxed">
                We believe that truth is forged under intense friction. Our protocol utilizes specialized "Adversarial Red-Teaming" agents targeted specifically at exposing weak points, gaps, and unverified assumptions in their peers' responses.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-gray-150 p-8 rounded-[36px] shadow-sm hover:shadow-md transition-all">
              <div className="p-3 w-max rounded-2xl bg-emerald-50 text-emerald-600 mb-8">
                <Key className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-black text-gray-950 uppercase tracking-tight mb-3">Sovereign Encryption</h4>
              <p className="text-sm font-semibold text-gray-550 leading-relaxed">
                Privacy is not an add-on. Our local on-device sanitization vault acts as an armor, scrubbing key credentials or names in memory before dispatch, and keeping the records securely persisted inside your client-side instance only.
              </p>
            </div>
          </div>
        </div>

        {/* Visual Strategy Map */}
        <div className="bg-[#1d1d1f] text-white p-8 sm:p-12 rounded-[48px] shadow-2xl relative overflow-hidden mb-24">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-indigo-500/10 blur-[96px]" />
          
          <div className="relative z-10">
            <div className="max-w-2xl mb-12">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 block mb-3">SYSTEM PROTOCOLS</span>
              <h3 className="text-3xl font-sans font-black tracking-tight uppercase mb-4">Continuous Reasoning Loop</h3>
              <p className="text-gray-400 text-sm leading-relaxed font-semibold">
                An objective view of how EthersFlow validates inference inputs in real-time to return institutional grade answers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="border-l-2 border-gray-750 pl-6 py-2">
                <div className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">01 // SANITIZE</div>
                <h5 className="font-bold text-sm text-white mb-2">Local Cryptographic Vault</h5>
                <p className="text-xs text-gray-500 leading-relaxed">Incoming strings are tokenized locally to prevent leakages of PII coordinates.</p>
              </div>

              <div className="border-l-2 border-gray-750 pl-6 py-2">
                <div className="text-xs font-black text-amber-400 uppercase tracking-widest mb-1">02 // INITIATE</div>
                <h5 className="font-bold text-sm text-white mb-2">Federated Spawning</h5>
                <p className="text-xs text-gray-500 leading-relaxed">Diverse model architectures are injected with specific expert personas.</p>
              </div>

              <div className="border-l-2 border-gray-750 pl-6 py-2">
                <div className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1">03 // DEBATE</div>
                <h5 className="font-bold text-sm text-white mb-2">Adversarial Red-Teaming</h5>
                <p className="text-xs text-gray-500 leading-relaxed">Interactive virtual debate rooms audit logic and spot structural hallucinations.</p>
              </div>

              <div className="border-l-2 border-gray-750 pl-6 py-2">
                <div className="text-xs font-black text-violet-400 uppercase tracking-widest mb-1">04 // RESOLVE</div>
                <h5 className="font-bold text-sm text-white mb-2">Consensus Synthesis</h5>
                <p className="text-xs text-gray-500 leading-relaxed">Weighted mathematical metrics distill trace logic into a single verified answer.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Global Standard Disclaimer Footer */}
        <div className="border-t border-gray-250 pt-10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-black uppercase text-gray-400 tracking-wider">
          <span>ETHERSFLOW CORP — GLOBAL STRATEGY OFFICE</span>
          <span>ESTABLISHED 2026</span>
        </div>
      </div>
    </motion.div>
  );
}
