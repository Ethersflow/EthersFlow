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
      className="min-h-screen bg-[#F9F8F6] dark:bg-[#0c0d10] text-[#1d1d1f] dark:text-zinc-100 font-sans relative overflow-hidden transition-colors"
    >
      {/* Absolute subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />

      {/* Decorative Blur Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-50 dark:bg-indigo-950/30 blur-[128px] pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 rounded-full bg-amber-50 dark:bg-amber-950/20 blur-[128px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 sm:py-24">
        {/* Navigation */}
        <button 
          onClick={onClose}
          className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#86868b] dark:text-zinc-400 hover:text-[#1d1d1f] dark:hover:text-white transition-all mb-16 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Return to EthersFlow
        </button>

        {/* Hero Section */}
        <div className="max-w-3xl mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1d1d1f]/5 dark:bg-white/10 border border-[#1d1d1f]/10 dark:border-white/15 mb-6 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-black text-indigo-750 dark:text-indigo-300">EthersFlow Corporate Manifesto</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-sans font-black tracking-tight leading-[0.95] uppercase mb-8 text-[#1d1d1f] dark:text-white">
            The action-verification layer <br />
            <span className="text-indigo-600 dark:text-indigo-400">for the agentic web (KYAA).</span>
          </h1>
          <p className="text-xl sm:text-2xl font-bold text-gray-700 dark:text-zinc-200 leading-relaxed tracking-tight">
            KYA establishes who your agent is and what it is allowed to do. <span className="text-indigo-600 dark:text-indigo-400 font-black">KYAA (Know Your Agent's Action)</span> verifies what it is actually doing — one signed action at a time. Identity gets your agent through the door. Verification decides what leaves with it.
          </p>
          <p className="mt-4 text-base sm:text-lg text-gray-500 dark:text-zinc-400 font-semibold leading-relaxed">
            EthersFlow provides this verification through two doors: an interactive Review Console for human teams to evaluate complex strategies and model disagreements, and high-performance API & MCP servers for autonomous agents requiring cryptographically signed clearance before execution.
          </p>
        </div>

        {/* Core Narrative / Dual Column */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 sm:gap-20 mb-24 border-t border-gray-200/60 dark:border-zinc-800 pt-16">
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400 mb-6">// THE CATEGORY GAP</h3>
            <h2 className="text-2xl sm:text-3xl font-sans font-black tracking-tight mb-6 uppercase text-gray-950 dark:text-white">
              Identity & Authorization Leave a Dangerous Empty Box
            </h2>
            <div className="space-y-6 text-gray-700 dark:text-zinc-200 font-medium text-base leading-relaxed">
              <p>
                Agent identity standards (KYA) and authorization protocols (Google AP2, FIDO, OAuth mandates) prove <em className="text-gray-900 dark:text-white font-semibold not-italic underline decoration-indigo-400">who</em> an agent represents and <em className="text-gray-900 dark:text-white font-semibold not-italic underline decoration-indigo-400">what</em> permissions it holds.
              </p>
              <p>
                Yet as open agent protocols concede, authorization cannot guarantee that a specific composed action is safe. A fully authorized agent can still execute a lookalike vendor payment, an unintentional parameter drift, or a data leakage payload. EthersFlow exists to fill that empty box: <strong className="text-gray-950 dark:text-white font-bold">verifying the semantic legitimacy of each specific action before it executes</strong>.
              </p>
            </div>
          </div>
          
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400 mb-6">// OUR PROTOCOL</h3>
            <h2 className="text-2xl sm:text-3xl font-sans font-black tracking-tight mb-6 uppercase text-gray-950 dark:text-white">
              Federated Consensus Protocol (FCP)
            </h2>
            <div className="space-y-6 text-gray-700 dark:text-zinc-200 font-medium text-base leading-relaxed">
              <p>
                <strong className="text-gray-950 dark:text-white font-bold">Federated Consensus Protocol</strong> is our engine for coordinating specialized reviewer roles, heterogeneous model routing, adversarial cross-examination, and cryptographic attestation.
              </p>
              <p>
                We do not replace identity or authorization providers — we bind identity attestations directly into signed Ed25519 verdicts so auditors, operators, and compliance officers have an immutable record of clearance before any high-stakes tool call fires.
              </p>
            </div>
          </div>
        </div>

        {/* Bento Grid Pillars */}
        <div className="mb-24">
          <div className="mb-10 text-center sm:text-left">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400 mb-2">// PHILOSOPHICAL FOUNDATIONS</h3>
            <h2 className="text-3xl sm:text-4xl font-sans font-black tracking-tight uppercase text-gray-950 dark:text-white">The Three Pillars of Rigorous Logic</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 p-8 rounded-[36px] shadow-sm hover:shadow-md transition-all">
              <div className="p-3 w-max rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mb-8">
                <Brain className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-black text-gray-950 dark:text-white uppercase tracking-tight mb-3">Provider-Independent Review</h4>
              <p className="text-sm font-semibold text-gray-600 dark:text-zinc-300 leading-relaxed">
                Objective review is impossible when an evaluation depends on a single vendor's architecture. EthersFlow routes decisions across distinct frontier models to neutralize singular cognitive blind spots.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 p-8 rounded-[36px] shadow-sm hover:shadow-md transition-all">
              <div className="p-3 w-max rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mb-8">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-black text-gray-950 dark:text-white uppercase tracking-tight mb-3">Adversarial Review Loop</h4>
              <p className="text-sm font-semibold text-gray-600 dark:text-zinc-300 leading-relaxed">
                Reliable decisions require proactive stress-testing. Our protocol coordinates adversarial reviewer roles designed to challenge assumptions, surface contradictions, and verify empirical evidence.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 p-8 rounded-[36px] shadow-sm hover:shadow-md transition-all">
              <div className="p-3 w-max rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-8">
                <Key className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-black text-gray-950 dark:text-white uppercase tracking-tight mb-3">Policy-Enforced Privacy & Provenance</h4>
              <p className="text-sm font-semibold text-gray-600 dark:text-zinc-300 leading-relaxed">
                Security and provenance are core architecture. Sensitive data is sanitized before dispatch, while review traces, reviewer votes, dissent, and quorum attestations provide an inspectable review trace.
              </p>
            </div>
          </div>
        </div>

        {/* Visual Strategy Map */}
        <div className="bg-[#1d1d1f] dark:bg-zinc-900/90 text-white p-8 sm:p-12 rounded-[48px] shadow-2xl relative overflow-hidden mb-24 border border-transparent dark:border-zinc-800">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-indigo-500/10 blur-[96px]" />
          
          <div className="relative z-10">
            <div className="max-w-2xl mb-12">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 block mb-3">SYSTEM PROTOCOLS</span>
              <h3 className="text-3xl font-sans font-black tracking-tight uppercase mb-4">Continuous Review Loop</h3>
              <p className="text-gray-400 dark:text-zinc-300 text-sm leading-relaxed font-semibold">
                How EthersFlow validates requests in real-time to return policy-aware, evidence-backed decisions before execution.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="border-l-2 border-gray-750 dark:border-zinc-700 pl-6 py-2">
                <div className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">01 // SANITIZE</div>
                <h5 className="font-bold text-sm text-white mb-2">Sanitize the Input</h5>
                <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">Sensitive inputs are sanitized locally to maintain data integrity and prevent unintended exposure.</p>
              </div>

              <div className="border-l-2 border-gray-750 dark:border-zinc-700 pl-6 py-2">
                <div className="text-xs font-black text-amber-400 uppercase tracking-widest mb-1">02 // ASSIGN</div>
                <h5 className="font-bold text-sm text-white mb-2">Assign Reviewers</h5>
                <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">Specialized reviewer roles and model architectures evaluate the request from distinct perspectives.</p>
              </div>

              <div className="border-l-2 border-gray-750 dark:border-zinc-700 pl-6 py-2">
                <div className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1">03 // CROSS-EXAMINE</div>
                <h5 className="font-bold text-sm text-white mb-2">Cross-Examine the Decision</h5>
                <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">Reviewers cross-examine reasoning chains, identify contradictions, and surface missing evidence.</p>
              </div>

              <div className="border-l-2 border-gray-750 dark:border-zinc-700 pl-6 py-2">
                <div className="text-xs font-black text-violet-400 uppercase tracking-widest mb-1">04 // RESOLVE</div>
                <h5 className="font-bold text-sm text-white mb-2">Resolve with Evidence and Policy</h5>
                <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">The system calculates consensus alignment scores, verifies quorum, and attaches an inspectable review trace.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Global Standard Disclaimer Footer */}
        <div className="border-t border-gray-250 dark:border-zinc-800 pt-10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-black uppercase text-gray-400 dark:text-zinc-500 tracking-wider">
          <span>ETHERSFLOW CORP — GLOBAL STRATEGY OFFICE</span>
          <span>ESTABLISHED 2026</span>
        </div>
      </div>
    </motion.div>
  );
}
