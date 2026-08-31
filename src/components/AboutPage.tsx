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
          Return to EthersFlow
        </button>

        {/* Hero Section */}
        <div className="max-w-3xl mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1d1d1f]/5 border border-[#1d1d1f]/10 mb-6 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-indigo-650 animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-black text-indigo-750">EthersFlow Corporate Manifesto</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-sans font-black tracking-tight leading-[0.95] uppercase mb-8">
            The verification layer <br />
            <span className="text-indigo-600">for agentic systems.</span>
          </h1>
          <p className="text-xl sm:text-2xl font-bold text-gray-700 leading-relaxed tracking-tight">
            EthersFlow builds the review, routing, and evidence systems that help teams inspect model disagreement, enforce policies before consequential actions, and preserve a record of how decisions were reached. People use EthersFlow to run multi-perspective reviews in the Console; developers extend the same capability into applications and agent workflows through API and MCP.
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
                In the race for model deployment, software has defaulted to a fragile structure: relying on single-provider black-box models to make consequential decisions in finance, legal evaluation, infrastructure operations, and customer transactions.
              </p>
              <p>
                When a single model hallucinates or strays from intent, the mistake remains invisible until execution. At EthersFlow, we recognized that the path to dependable autonomous software is not simply a larger single model—it is <strong>independent, multi-model review</strong>.
              </p>
            </div>
          </div>
          
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600 mb-6">// OUR PROTOCOL</h3>
            <h2 className="text-2xl sm:text-3xl font-sans font-black tracking-tight mb-6 uppercase text-gray-950">
              Federated Adversarial Consensus (FAC)
            </h2>
            <div className="space-y-6 text-[#1d1d1f]/80 font-medium text-base leading-relaxed">
              <p>
                <strong>Federated Adversarial Consensus</strong> is our protocol for coordinating independent reviewer roles, model routing, adversarial challenge, quorum evaluation, and evidence synthesis.
              </p>
              <p>
                We do not train generic models. EthersFlow builds the verification and arbitration infrastructure that holds autonomous systems accountable before they act.
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
              <h4 className="text-lg font-black text-gray-950 uppercase tracking-tight mb-3">Provider-Independent Review</h4>
              <p className="text-sm font-semibold text-gray-550 leading-relaxed">
                Objective review is impossible when an evaluation depends on a single vendor's architecture. EthersFlow routes decisions across distinct frontier models to neutralize singular cognitive blind spots.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white border border-gray-150 p-8 rounded-[36px] shadow-sm hover:shadow-md transition-all">
              <div className="p-3 w-max rounded-2xl bg-amber-50 text-amber-600 mb-8">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-black text-gray-950 uppercase tracking-tight mb-3">Adversarial Review Loop</h4>
              <p className="text-sm font-semibold text-gray-550 leading-relaxed">
                Reliable decisions require proactive stress-testing. Our protocol coordinates adversarial reviewer roles designed to challenge assumptions, surface contradictions, and verify empirical evidence.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-gray-150 p-8 rounded-[36px] shadow-sm hover:shadow-md transition-all">
              <div className="p-3 w-max rounded-2xl bg-emerald-50 text-emerald-600 mb-8">
                <Key className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-black text-gray-950 uppercase tracking-tight mb-3">Policy-Enforced Privacy & Provenance</h4>
              <p className="text-sm font-semibold text-gray-550 leading-relaxed">
                Security and provenance are core architecture. Sensitive data is sanitized before dispatch, while review traces, reviewer votes, dissent, and quorum attestations provide an inspectable review trace.
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
              <h3 className="text-3xl font-sans font-black tracking-tight uppercase mb-4">Continuous Review Loop</h3>
              <p className="text-gray-400 text-sm leading-relaxed font-semibold">
                How EthersFlow validates requests in real-time to return policy-aware, evidence-backed decisions before execution.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="border-l-2 border-gray-750 pl-6 py-2">
                <div className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">01 // SANITIZE</div>
                <h5 className="font-bold text-sm text-white mb-2">Sanitize the Input</h5>
                <p className="text-xs text-gray-500 leading-relaxed">Sensitive inputs are sanitized locally to maintain data integrity and prevent unintended exposure.</p>
              </div>

              <div className="border-l-2 border-gray-750 pl-6 py-2">
                <div className="text-xs font-black text-amber-400 uppercase tracking-widest mb-1">02 // ASSIGN</div>
                <h5 className="font-bold text-sm text-white mb-2">Assign Reviewers</h5>
                <p className="text-xs text-gray-500 leading-relaxed">Specialized reviewer roles and model architectures evaluate the request from distinct perspectives.</p>
              </div>

              <div className="border-l-2 border-gray-750 pl-6 py-2">
                <div className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1">03 // CROSS-EXAMINE</div>
                <h5 className="font-bold text-sm text-white mb-2">Cross-Examine the Decision</h5>
                <p className="text-xs text-gray-500 leading-relaxed">Reviewers cross-examine reasoning chains, identify contradictions, and surface missing evidence.</p>
              </div>

              <div className="border-l-2 border-gray-750 pl-6 py-2">
                <div className="text-xs font-black text-violet-400 uppercase tracking-widest mb-1">04 // RESOLVE</div>
                <h5 className="font-bold text-sm text-white mb-2">Resolve with Evidence and Policy</h5>
                <p className="text-xs text-gray-500 leading-relaxed">The system calculates consensus alignment scores, verifies quorum, and attaches an inspectable review trace.</p>
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
