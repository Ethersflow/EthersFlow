import React from 'react';
import { Logo } from './Logo';
import { ProtocolFlow } from './ProtocolFlow';
import { 
  ShieldCheck, Brain, Lock, ArrowLeft, Cpu, 
  Workflow, Layers, Sparkles, Scale, Database, CheckCircle2 
} from 'lucide-react';
import { motion } from 'motion/react';

interface ProtocolPageProps {
  onClose: () => void;
}

export function ProtocolPage({ onClose }: ProtocolPageProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#F9F8F6] text-[#1d1d1f] font-sans relative overflow-hidden"
    >
      {/* Absolute subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px]" />

      {/* Decorative gradient blur accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-50 blur-[128px] pointer-events-none" />
      <div className="absolute bottom-20 -right-40 w-96 h-96 rounded-full bg-indigo-50/50 blur-[128px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 sm:py-24">
        {/* Navigation */}
        <button 
          onClick={onClose}
          className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#86868b] hover:text-[#1d1d1f] transition-all mb-16 cursor-pointer bg-transparent border-none outline-none"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Return to EthersFlow
        </button>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-24">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1d1d1f]/5 border border-[#1d1d1f]/10 mb-6 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.2em] font-black text-indigo-700">Consensus Architecture</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-sans font-black tracking-tight leading-[0.95] uppercase mb-8">
              Adversarial Consensus <br />
              <span className="text-indigo-600">Protocol (FAC).</span>
            </h1>
            <p className="text-lg sm:text-xl font-bold text-gray-700 leading-relaxed max-w-2xl">
              EthersFlow coordinates independent reviewer roles into structured adversarial cross-examination to reduce dependence on a single model and surface blind spots that single-model review may miss before consequential actions execute.
            </p>
          </div>
          <div className="lg:col-span-5 bg-white border border-gray-150 rounded-[40px] p-2 shadow-sm relative overflow-hidden">
            {/* Embedded visually rich live pipeline graph */}
            <div className="scale-95 origin-center">
              <ProtocolFlow />
            </div>
          </div>
        </div>

        {/* Technical Core Specifications */}
        <div className="border-t border-gray-200/60 pt-16 mb-24">
          <div className="mb-12">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600 mb-2">// TECHNICAL WHITE SHEET</h3>
            <h2 className="text-3xl font-sans font-black uppercase tracking-tight text-gray-950">The Four-Stage Arbitration Pipeline</h2>
            <p className="text-sm font-semibold text-gray-500 max-w-xl mt-2">
              Every query submitted to EthersFlow is compiled and secured under the following deterministic loop before returning the final consensus reports.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Stage 1 */}
            <div className="bg-white border border-gray-150 p-8 rounded-[32px] hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
                <Lock className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block mb-2">Stage 01</span>
              <h4 className="text-base font-black text-gray-950 uppercase mb-3 text-left">Sanitize the Input</h4>
              <p className="text-xs font-semibold text-gray-500 leading-relaxed">
                Sensitive inputs are sanitized locally to maintain data integrity and prevent unintended exposure before dispatch.
              </p>
            </div>

            {/* Stage 2 */}
            <div className="bg-white border border-gray-150 p-8 rounded-[32px] hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-605 flex items-center justify-center mb-6">
                <Cpu className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider block mb-2">Stage 02</span>
              <h4 className="text-base font-black text-gray-950 uppercase mb-3 text-left">Assign Reviewers</h4>
              <p className="text-xs font-semibold text-gray-500 leading-relaxed">
                Specialized reviewer roles and model architectures evaluate the request from distinct, independent perspectives.
              </p>
            </div>

            {/* Stage 3 */}
            <div className="bg-white border border-gray-150 p-8 rounded-[32px] hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-6">
                <Workflow className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider block mb-2">Stage 03</span>
              <h4 className="text-base font-black text-gray-950 uppercase mb-3 text-left">Cross-Examine the Decision</h4>
              <p className="text-xs font-semibold text-gray-500 leading-relaxed">
                Reviewers cross-examine reasoning chains, identify contradictions, and surface missing evidence under adversarial conditions.
              </p>
            </div>

            {/* Stage 4 */}
            <div className="bg-white border border-gray-150 p-8 rounded-[32px] hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
                <Scale className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block mb-2">Stage 04</span>
              <h4 className="text-base font-black text-gray-950 uppercase mb-3 text-left">Resolve with Evidence and Policy</h4>
              <p className="text-xs font-semibold text-gray-500 leading-relaxed">
                The system calculates consensus alignment scores, verifies quorum, enforces policy constraints, and attaches an inspectable review trace.
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Mechanics & Formulas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start mb-24">
          {/* Left Column: Mathematical Foundation */}
          <div className="lg:col-span-7 bg-[#1d1d1f] text-white p-8 sm:p-12 rounded-[40px] shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[96px]" />
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400 mb-3">// MATHEMATICAL MODEL</h4>
            <h3 className="text-2xl font-sans font-black uppercase mb-6 text-white">Trust & Consensus Weight (FAC-W)</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-8 font-semibold">
              EthersFlow does not average model confidence. The confidence coefficient ($C$) is calculated dynamically by compounding independent model capability factors and penalizing logical contradictions exposed during adversarial rounds.
            </p>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 font-mono mb-8">
              <div className="text-[10px] text-gray-450 uppercase tracking-wider mb-2 font-mono">FAC Scoring Function</div>
              <div className="text-lg font-black text-indigo-300 font-mono mb-2">
                C = &sum; ( w_i &times; S_i ) &times; ( 1 &minus; &gamma; &times; F_adv )
              </div>
              <p className="text-[10px] text-gray-500 leading-normal">
                Where <span className="text-white font-mono">w_i</span> represents the system's baseline capability weight, <span className="text-white font-mono">S_i</span> is the single-evaluation logical confidence, <span className="text-white font-mono">F_adv</span> is the adversarial friction metric, and <span className="text-white font-mono">&gamma;</span> scales compliance penalty parameters.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-black text-white uppercase">Single-Model Dependency Reduction</h5>
                  <p className="text-xs text-gray-400 mt-1">Single-model self-correction loops often suffer from confirmation drift. Confronting models with divergent architectures surfaces blind spots that single-model review may miss.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-black text-white uppercase">Inspectable Trace Audit</h5>
                  <p className="text-xs text-gray-400 mt-1">Every dialectic step, cited source, and contradiction flag is recorded in an inspectable review trace for transparent compliance reviews.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Architectural Highlights */}
          <div className="lg:col-span-5 space-y-10">
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#86868b] mb-4">// CORE PRINCIPLES</h3>
              <h4 className="text-2xl font-sans font-black uppercase text-gray-950 mb-3">Architectural Honesty</h4>
              <p className="text-sm font-semibold text-gray-550 leading-relaxed">
                Objective facts do not change. EthersFlow is committed to structural accuracy, bringing a strict glass-box approach back to corporate intelligence and decision systems.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm flex items-start gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-gray-950 mb-1">Non-Homogeneous Logic</h4>
                  <p className="text-xs font-semibold text-gray-500 mt-1">Integrating mixed architectures prevents co-dependent vulnerabilities and unifies safety checks.</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm flex items-start gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-gray-950 uppercase mb-1">State Decoupling</h4>
                  <p className="text-xs font-semibold text-gray-400 mt-1">User prompts never intermingle or enter third-party training pipelines, keeping business secrets secure.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Standard Disclaimer Footer */}
        <div className="border-t border-gray-250 pt-10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-black uppercase text-gray-400 tracking-wider">
          <span>ETHERSFLOW FAC STAND_PROTOCOL // SPEC V1.04</span>
          <span>ESTABLISHED 2026</span>
        </div>
      </div>
    </motion.div>
  );
}
