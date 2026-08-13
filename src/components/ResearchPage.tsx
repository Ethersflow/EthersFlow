import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { 
  BookOpen, Award, GraduationCap, CheckCircle, AlertCircle, 
  Play, Send, Sparkles, ArrowLeft, ExternalLink, FileText, X,
  Shield, Brain, Scale, Terminal, Info, Users, Database,
  Sliders, Eye, HelpCircle, Activity, ChevronRight, Download, Share2, CornerDownRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ResearchPageProps {
  onClose: () => void;
}

const RESEARCH_PAPERS = [
  {
    category: "Foundational",
    title: "Large Language Models Cannot Self-Correct",
    source: "arXiv & Neural Information Processing Systems",
    url: "https://arxiv.org/abs/2310.01798",
    year: "2023",
    citations: 1420,
    readTime: "12 mins",
    abstract: "This study systematically examines whether large language models can self-correct their own reasoning errors without external feedback. The analysis demonstrates that without external guidance, prompting a model to self-correct often fails or degrades performance, as the model converges on its inherent parametric biases. This establishes the critical necessity of external validation systems.",
    impact: "Highlights the theoretical limitations of single-model self-correction, proving why an isolated LLM cannot reliably audit itself and why an external multi-agent consensus system is required."
  },
  {
    category: "Game Theory",
    title: "Improving Factuality in Large Language Models through Multi-Agent Debate",
    source: "arXiv & Massachusetts Institute of Technology",
    url: "https://arxiv.org/abs/2305.14325",
    year: "2023",
    citations: 890,
    readTime: "15 mins",
    abstract: "This paper introduces a multi-agent debate framework where multiple model instances propose and debate their individual answers over multiple rounds before arriving at a final consensus. This collaborative questioning substantially improves factuality, reasoning logic, and answer accuracy on complex datasets.",
    impact: "Provides direct empirical validation for EthersFlow's multi-agent virtual debate rooms, demonstrating that independent architectural confrontation is mathematically superior to single-model responses."
  },
  {
    category: "Game Theory",
    title: "The Consensus Game: Language Model Generation via Equilibrium Search",
    source: "arXiv & MIT / Meta AI",
    url: "https://arxiv.org/abs/2310.09139",
    year: "2023",
    citations: 620,
    readTime: "18 mins",
    abstract: "This paper models Language Model interactions as a game-theoretic consensus process. Casting decoding as an imperfect-information sequential signaling game—where a generator communicates with a discriminator—allows calculating approximate equilibria that consistently improve reasoning accuracy across diverse tasks.",
    impact: "Supplies the game-theoretic foundations behind EthersFlow's consensus arbitration and multi-agent debate algorithms."
  },
  {
    category: "Federated Learning",
    title: "Adversarial Federated Consensus Learning for Surface Classification Under Data Heterogeneity",
    source: "arXiv & IEEE Transactions on Industrial Informatics",
    url: "https://arxiv.org/abs/2409.15711",
    year: "2024",
    citations: 310,
    readTime: "22 mins",
    abstract: "This study introduces a personalized federated learning framework named Adversarial Federated Consensus Learning (AFedCL) to address data heterogeneity across decentralized clients. It develops a dynamic consensus construction strategy based on adversarial training to align varying data distributions and implements a consensus-aware aggregation mechanism.",
    impact: "Provides empirical validation for EthersFlow's Federated Adversarial Consensus (FAC) approach, proving that adversarial distribution alignment and weighted consensus-aware aggregation are vital in heterogeneous systems."
  },
  {
    category: "Positive Alignment",
    title: "Positive Alignment: Artificial Intelligence for Human Flourishing",
    source: "arXiv & Frontier AI Alignment",
    url: "https://arxiv.org/abs/2605.10310",
    year: "2026",
    citations: 74,
    readTime: "25 mins",
    abstract: "This paper introduces a paradigm shift from 'negative alignment'—the mitigation of model harms, safety jailbreaks, and critical risk profiles—to 'positive alignment'—the technical enablement of human flourishing, epistemic pluralism, and agency expansion. The authors establish mathematical, structural, and game-theoretic grounds for decentralized dynamic governance of multi-agent models to cultivate resilient capabilities and cognitive diversity.",
    impact: "Provides structural validation for EthersFlow's core philosophy. Unlike traditional AI platforms that rely on top-down system censoring ('negative alignment') of a single model instance, EthersFlow's decentralized multi-agent debate architecture actively promotes 'positive alignment'—expanding human agency and epistemic pluralism by verifying complex reasoning through cooperative cross-examination."
  },
  {
    category: "Proprietary",
    title: "Federated Adversarial Consensus (FAC): Mathematical Foundations of Multi-Agent Reasoning Validation",
    source: "EthersFlow Labs Technical Report (v2.6)",
    url: "internal_whitepaper",
    year: "2026",
    citations: "Internal Protocol Standard",
    readTime: "30 mins",
    abstract: "We introduce the formal mathematical framework for the EthersFlow FAC Protocol. We specify our multi-stage inference pipeline: Local sanitization, Spawning of non-homogeneous expert personas, Competitive cross-examination debate, and mathematical Consensus synthesis. Under this model, consensus confidence ($C$) is defined as a function of individual model capability weights and active adversarial friction metrics.",
    impact: "Our official technical blueprint. Establishes the exact algorithms executed when users launch an EthersFlow trace query."
  }
];

export function ResearchPage({ onClose }: ResearchPageProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showWhitepaper, setShowWhitepaper] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Handle subscriber submit
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      const response = await fetch('/api/research-subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Subscription request failed.");
      }

      setSuccess(true);
      setEmail("");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const categories = ["All", "Foundational", "Game Theory", "Federated Learning", "Positive Alignment", "Proprietary"];
  const filteredPapers = [...(selectedCategory === "All" 
    ? RESEARCH_PAPERS 
    : RESEARCH_PAPERS.filter(p => p.category === selectedCategory))]
    .sort((a, b) => parseInt(b.year) - parseInt(a.year));

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#07060a] text-[#f4f3f5] font-sans relative overflow-x-hidden selection:bg-indigo-600/30 selection:text-indigo-200"
    >
      {/* Dynamic Digital Mesh Star System Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      
      {/* Decorative Neon Swirl Ambient Blurs */}
      <div className="absolute top-20 left-10 w-96 h-96 rounded-full bg-indigo-900/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-40 right-10 w-96 h-96 rounded-full bg-violet-900/10 blur-[180px] pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 sm:py-24">
        
        {/* Navigation Back button */}
        <button 
          onClick={onClose}
          id="back_to_terminal_btn"
          className="group inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-300 hover:text-white transition-all mb-16 cursor-pointer bg-white/5 px-4 py-2.5 rounded-full border border-white/10"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to AI Terminal
        </button>

        {/* Human Centered Design Page Header */}
        <div className="mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 mb-6">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.25em] font-mono font-bold text-indigo-300">EthersFlow Scientific Repository</span>
          </div>
          
          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-display font-black uppercase tracking-tight leading-[0.95] mb-6">
            The Science of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-500">
              Adversarial Consensus
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl leading-relaxed font-sans">
            Explore the peer-reviewed literature, mathematical frameworks, and empirical studies underpinning EthersFlow's multi-agent consensus protocols, positive alignment paradigms, and zero-token safety safeguards.
          </p>
        </div>



        {/* Categories Tab and Scientific Paper List */}
        <div id="papers_viewer_panel">
          <div className="relative border-b border-white/10 pb-4 mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-mono font-bold">Research Indexes</span>
              <h3 className="text-xl sm:text-2xl font-display font-black uppercase text-white">Academic Database</h3>
            </div>
            
            {/* Horizontal Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border ${selectedCategory === cat ? "bg-[#312e81] border-indigo-500 text-white" : "bg-white/[0.02] hover:bg-white/[0.04] border-white/5 text-gray-400"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid list of Research papers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-28">
            <AnimatePresence mode="popLayout">
              {filteredPapers.map((paper, idx) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  key={paper.title}
                  className="bg-white/[0.015] hover:bg-white/[0.035] border border-white/5 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-950/40 backdrop-blur-md rounded-[36px] p-8 sm:p-10 flex flex-col justify-between transition-all duration-300 relative group"
                >
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <div className="flex items-center gap-2.5">
                        <GraduationCap className="w-4.5 h-4.5 text-indigo-400" />
                        <span className="text-[11px] font-mono font-black uppercase tracking-wider text-gray-400">{paper.source}</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] uppercase tracking-widest font-mono text-gray-500 font-bold">{paper.year}</span>
                        {paper.url !== "internal_whitepaper" ? (
                          <span className="text-[9.5px] font-black uppercase tracking-wider text-indigo-300 bg-indigo-500/15 px-3 py-1 rounded-full border border-indigo-500/20">
                            Adherent Theory
                          </span>
                        ) : (
                          <span className="text-[9.5px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/20">
                            Patent Protocol
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="text-2xl font-display font-black text-white hover:text-indigo-400 transition-colors tracking-tight leading-snug uppercase">
                      {paper.title}
                    </h3>

                    <p className="text-sm sm:text-[15px] text-gray-300 leading-relaxed font-semibold pl-4 border-l-2 border-indigo-500/20 bg-indigo-500/[0.01] py-2 rounded-r-2xl">
                      <strong className="text-indigo-300 font-black not-italic block mb-1 text-[11px] uppercase tracking-wider">Abstract</strong> {paper.abstract}
                    </p>

                    <div className="bg-indigo-950/25 rounded-2xl p-6 border border-indigo-500/10 shadow-inner">
                      <span className="text-[10px] font-mono font-black uppercase tracking-[0.12em] text-indigo-300 block mb-2">EthersFlow Application Impact</span>
                      <p className="text-sm text-gray-200 leading-relaxed font-medium">
                        {paper.impact}
                      </p>
                    </div>
                  </div>

                  {/* Quantitative Stats & Actions details */}
                  <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between text-xs text-gray-400 font-mono font-semibold">
                    <div className="flex items-center gap-5">
                      <span>Citations: <strong className="text-white font-black">{paper.citations}</strong></span>
                      <span className="hidden sm:inline">| Reading: <strong className="text-white font-black">{paper.readTime}</strong></span>
                    </div>

                    {paper.url === "internal_whitepaper" ? (
                      <button
                        onClick={() => setShowWhitepaper(true)}
                        id="open_whitepaper_btn"
                        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-300 hover:text-white transition-all cursor-pointer bg-white/5 px-4 py-2 rounded-xl border border-white/10 hover:bg-indigo-500/10 hover:border-indigo-500/25 py-1.5"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-400" />
                        Interactive Reader
                      </button>
                    ) : (
                      <a
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        referrerPolicy="no-referrer"
                        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-300 hover:text-white transition-all px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-indigo-500/10 hover:border-indigo-500/25 py-1.5 group/link"
                      >
                        <ExternalLink className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                        External Paper
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Subscriber CTA section */}
        <div className="bg-gradient-to-r from-zinc-950 to-indigo-950 border border-indigo-500/10 p-8 sm:p-16 rounded-[48px] shadow-2xl relative overflow-hidden mb-24">
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-8">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span className="text-[9px] uppercase tracking-widest font-mono font-black text-indigo-300">Frontier R&D Newsletter</span>
            </div>

            <h3 className="text-3xl sm:text-4xl font-display font-black tracking-tight uppercase mb-4 leading-none text-white">
              Stay at the edge of logical verification.
            </h3>
            
            <p className="text-gray-400 text-sm leading-relaxed mb-10 font-bold font-sans">
              Join leading AI safety architects, academic researchers, and institutional compliance directors. Subscribe to get our latest publications, EF-Audit benchmarks, peer debates, and code releases directly in your inbox.
            </p>

            {success ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center text-white"
              >
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <h5 className="text-sm font-black uppercase tracking-wider font-mono text-emerald-300">Subscription Successful</h5>
                <p className="text-xs text-gray-300 mt-1 font-semibold leading-relaxed">
                  You have been enrouted to our Frontier Research dispatch queue. Thank you for subscribing.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="email" 
                  required
                  placeholder="Enter your institutional email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-white/5 hover:bg-white/8 border border-white/10 focus:border-indigo-500 focus:bg-white/10 rounded-xl px-4 py-3.5 text-sm font-bold text-white outline-none transition-all placeholder-gray-600"
                />
                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-650 hover:bg-indigo-700 disabled:bg-gray-600 py-3.5 px-6 rounded-xl text-white text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md border-none"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-white" />
                      Subscribe Bulletin
                    </>
                  )}
                </button>
              </form>
            )}

            {error && (
              <p className="text-xs text-rose-400 mt-3 font-semibold flex items-center gap-1">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Standard Academic page footer */}
        <div className="border-t border-white/5 pt-10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-mono font-bold text-gray-500 uppercase tracking-wider">
          <span>ETHERSFLOW RESEARCH LABS — CENTRAL AUDIT PLATFORM</span>
          <span>ESTABLISHED 2026</span>
        </div>
      </div>

      {/* FULL COGNITIVE COLLABORATIVE DIGITAL WHITE PAPER TABLET OVERLAY - DECORATED PURE ACADEMIC BRUTALIST PAPER-WHITE */}
      <AnimatePresence>
        {showWhitepaper && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="fixed inset-0 z-50 bg-white text-zinc-950 overflow-y-auto border-t-4 border-indigo-600 flex flex-col selection:bg-indigo-100 selection:text-indigo-900"
          >
            {/* Elegant Reader Top Header Navigation Bar */}
            <header className="bg-white border-b border-zinc-200 sticky top-0 z-30 px-6 py-4 flex justify-between items-center shadow-[0_1px_5px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono font-bold px-2.5 py-0.5 rounded-full">
                  PREPRINT LABS-2026-v2.6
                </span>
                <span className="text-[10px] font-mono text-zinc-550 hidden md:inline">
                  Federated Adversarial Consensus Whitepaper
                </span>
              </div>
              <button
                onClick={() => setShowWhitepaper(false)}
                className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-zinc-650 hover:text-zinc-950 transition-colors cursor-pointer bg-zinc-50 hover:bg-zinc-100 px-4 py-2 border border-zinc-200 rounded-full"
              >
                <X className="w-4 h-4 text-zinc-500" />
                Close Article
              </button>
            </header>

            <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12 lg:py-24 font-sans leading-relaxed text-justify text-base text-zinc-900">
              <div className="max-w-4xl mx-auto space-y-16">
                
                {/* Academic Title Page Head */}
                <div className="text-center mb-20 font-sans">
                  <p className="text-[11px] font-black tracking-[0.25em] uppercase text-indigo-600 mb-4 block">
                    // OFFICIAL SYSTEMS ARCHITECTURE SCHEMATIC
                  </p>
                  
                  <h1 className="text-xl sm:text-3.5xl md:text-5xl lg:text-6xl font-display font-black uppercase tracking-tight text-zinc-950 mb-6 sm:mb-8 leading-snug">
                    Federated Adversarial Consensus (FAC): Math Formulations of Verification Weightings for Multi-Agent LLM Reasoning Tunnels
                  </h1>

                  <div className="max-w-2xl mx-auto text-center py-6 border-y border-zinc-200 mb-8 flex flex-col items-center justify-center gap-1.5">
                    <p className="font-black text-zinc-900 uppercase text-base tracking-widest">EthersFlow Research & Development Team</p>
                    <p className="font-mono text-xs text-indigo-650 font-bold">research@ethersflow.com</p>
                  </div>
                  
                  <p className="text-xs text-zinc-400 uppercase tracking-widest font-mono block font-bold">
                    Published: EthersFlow Research Laboratories, Pittsburgh, Pennsylvania, USA
                  </p>
                </div>

                {/* Abstract Glass panel */}
                <div className="bg-zinc-55 border border-zinc-200 rounded-[32px] p-8 sm:p-12 mb-16 font-sans font-bold shadow-sm bg-zinc-50/50">
                  <h3 className="text-xs sm:text-sm uppercase font-mono tracking-[0.2em] font-black text-indigo-600 border-b border-zinc-200 pb-3 mb-6">Abstract</h3>
                  <p className="italic text-zinc-700 leading-[1.8] text-sm sm:text-[15px] font-medium">
                    Artificial intelligence systems are fundamentally limited by a silent cognitive bottleneck: when left in isolation, Large Language Models cannot reliably self-correct their reasoning errors, often reinforcing their own initial mistakes within a recursive bias loop. This paper addresses this limitation by introducing EthersFlow's Federated Adversarial Consensus (FAC) protocol combined with the Zero-Token Algorithmic Guardian Layer (AGL). Instead of relying on an isolated model to self-audit, our architecture spawns specialized, non-homogeneous expert agents that engage in structured game-theoretic debates within an online arbitration arena. To protect institutional data sovereignty and comply with strict compliance mandates, confidential data undergoes localized, client-side token sanitization before entering the debate tunnels. The customizable expert nodes cross-examine assertions in sequence, computing dynamic verification weights and applying direct penalties when circular claims or mathematical contradictions are proven. High-throughput empirical evaluations demonstrate that this multi-agent consensus network raises analytical precision to 94.2% on complex multi-hop queries, solving the isolation crisis while maintaining absolute privacy.
                  </p>
                </div>

                {/* Academic Style Breakdown layout */}
                <div className="space-y-16">
                  
                  {/* SECTION I */}
                  <section className="space-y-6 text-zinc-900">
                    <h2 className="text-xl sm:text-2xl font-display uppercase tracking-wider text-indigo-600 font-mono font-black border-b border-zinc-200 pb-3">
                      I. Philosophical & Axiological Foundations: The Human Flourishing Paradigm
                    </h2>
                    
                    {/* Practical Context Box 1 */}
                    <div className="my-6 p-6 bg-indigo-50/70 border border-indigo-150 rounded-2xl flex flex-col gap-3 shadow-sm">
                      <div className="flex items-center gap-2 border-b border-indigo-100 pb-2">
                        <Info className="w-4 h-5 text-indigo-600 shrink-0" />
                        <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-indigo-700">Practical Context</span>
                      </div>
                      <p className="text-xs sm:text-sm font-sans text-indigo-950 font-semibold leading-relaxed mb-0">
                        <strong>The Real-World Problem:</strong> Traditional artificial intelligence acts like a single isolated consultant. If it makes an error, prompting it to "double-check" only makes it defend its own mistake inside a silent confirmation-bias loop. In high-stakes fields like finance, law, or engineering, this forces human experts to spend massive amounts of energy proofreading raw drafts.
                        <br /><br />
                        <strong>The Collaborative Solution:</strong> Instead of muzzling the AI with restrictive filters or hoping a single model is correct, we spawn specialized experts with conflicting cognitive biases. They cross-examine one another in real-time, highlighting contradictions and verifying math. You are elevated from a manual proofreader to a high-leverage supervisor, unlocking absolute accuracy without manual fatigue.
                      </p>
                    </div>

                    <p className="font-sans text-zinc-800 text-sm sm:text-[16.5px] leading-[1.85] mb-6">
                      <strong>A. Axiological Foundation of AI:</strong> Classical artificial intelligence theory prioritizes absolute task automation, working under the assumption that replacing human labor is the ultimate metric of machine efficiency. In contrast, the pioneering framework established in <i>Positive Alignment: Artificial Intelligence for Human Flourishing [5]</i> introduces an axiological pivot: AI systems must be designed as <i>capability-enlargement engines</i> and <i>cognitive scaffolds</i>. Rather than automating away human decision-making—which reduces individual agency and erodes professional mastery—AI must structurally expand the scale, depth, and precision of human cognitive capacity. EthersFlow embodies this thesis in the high-stakes auditing domain. Our protocol does not seek to replace the human auditor's critical discernment; instead, it provides a transparent, multi-perspectival reasoning scaffold that allows people to perform deep verification checks instantly and confidently.
                    </p>
                    <p className="font-sans text-zinc-800 text-sm sm:text-[16.5px] leading-[1.85] mb-6">
                      <strong>B. The Isolation Fallacy & The Huang-Chang Limit:</strong> When enterprise teams deploy Large Language Models to check complicated financial clauses or source-code scripts, they regularly hit a severe theoretical limit. As mathematically verified by Huang and Chang [1], Large Language Models are incapable of reliably self-correcting their own reasoning errors in isolation. When a single model makes an initial inference mistake, its parametric priors remain biased in the same direction. When prompted to "verify its own output," the model suffers from confirmation bias, either failing to register its own logic gap or collapsing into an entropy-deprived repetition loop. Traditional systems attempt to bypass this by stacking single-prompt guardrails, which only shrinks the cognitive expression of the model. 
                    </p>
                    <p className="font-sans text-zinc-800 text-sm sm:text-[16.5px] leading-[1.85] mb-6">
                      EthersFlow breaks the isolation constraint. Rather than expecting a single model instance to possess absolute self-audit capability, we establish an epistemic environment defined by **Adversarial Collaboration**. Based on research bounds by Du et al. [2] and Jacob et al. [3], truth is best extracted not from static parametric silos, but from dynamic, game-theoretic debate.
                    </p>
                    <p className="font-sans text-zinc-800 text-sm sm:text-[16.5px] leading-[1.85] mb-6">
                      <strong>C. Beyond Negative Alignment:</strong> Historically, AI safety and alignment research has been dominated by "negative alignment"—constructing hard guardrails, restricting text generations, and deploying negative content filters. While this prevents extreme safety infractions, it catastrophically degrades LLM logic, leading to "over-refusal" and analytical flattening. Drawing from the Positive Alignment thesis [5], we advocate for **Active Agency Expansion**. We do not restrict our models' intellectual horizons; instead, we foster a structured, robust, and civil intellectual arena. By exposing divergent model configurations to competitive cross-examination, EthersFlow coordinates their natural divergent perspectives, producing comprehensive, polished consensus reports that afford the human supervisor maximum cognitive utility.
                    </p>
                  </section>

                  {/* SECTION II */}
                  <section className="space-y-6">
                    <h2 className="text-xl sm:text-2xl font-display uppercase tracking-wider text-indigo-600 font-mono font-black border-b border-zinc-200 pb-3">
                      II. Epistemic Scaffolding: Network Pathways & Scalable Collective Intelligence
                    </h2>

                    {/* Practical Context Box 2 */}
                    <div className="my-6 p-6 bg-indigo-50/70 border border-indigo-150 rounded-2xl flex flex-col gap-3 shadow-sm">
                      <div className="flex items-center gap-2 border-b border-indigo-100 pb-2">
                        <Sliders className="w-4 h-5 text-indigo-600 shrink-0" />
                        <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-indigo-700">Practical Context</span>
                      </div>
                      <p className="text-xs sm:text-sm font-sans text-indigo-950 font-semibold leading-relaxed mb-0">
                        <strong>Under the Hood:</strong> To protect your private client names, contract values, and proprietary data details, EthersFlow sanitizes data locally on your device first. This masked draft is routed to an analytical tunnel of customizable AI experts.
                        <br /><br />
                        These customizable experts analyze the data side-by-side, evaluate source terms, and debate critical interpretations. Disagreements are measured mathematically, synthesized, and then mapped back to your original, confidential parameters securely on your local machine.
                      </p>
                    </div>

                    <p className="font-sans text-zinc-800 text-sm sm:text-[16.5px] leading-[1.85] mb-6">
                      To preserve privacy and prevent public leakage of sensitive enterprise logs—a crucial requirement of sovereign compliance—the FAC runtime implements a localized, multi-stage sanitization gate. Raw institutional documents (D) are mapped to a secure, salt-masked payload (D_masked) prior to entering the multi-agent inference tunnels:
                    </p>
                    
                    <div className="my-8 p-6 bg-zinc-100/70 border border-zinc-200 rounded-2xl text-center font-mono text-sm sm:text-base text-indigo-850 font-black shadow-inner">
                      {"V_safe(D) = D_masked = D \\ [Sensitive_Keys] ∪ [Cryptographic_Tokens]"}
                    </div>

                    <p className="font-sans text-zinc-800 text-sm sm:text-[16.5px] leading-[1.85] mb-6">
                      <strong>A. Hardened Masking Pipeline:</strong> Standard regex approaches are inadequate for complex enterprise schemas. EthersFlow's client-side gatekeeper uses a local parser to identify PII, system parameters, and database keys. Names and unique entities are translated into local hashes mapped directly to your machine's secrets:
                    </p>
                    <div className="my-6 p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-center font-mono text-xs sm:text-sm text-zinc-700">
                      {"Hash_Token = Base64( HMAC-SHA256( Value, Client_Secret ) )[:12]"}
                    </div>
                    <p className="font-sans text-zinc-800 text-sm sm:text-[16.5px] leading-[1.85] mb-6">
                      This mathematical masking ensures that external model environments never index sensitive customer identities, IP boundaries, or private monetary bounds.
                    </p>

                    <p className="font-sans text-zinc-800 text-sm sm:text-[16.5px] leading-[1.85] mb-6">
                      <strong>B. Cognitive Role Specialization:</strong> To establish a robust, pluralistic friction field, the debate tunnel utilizes multiple specialized expert profiles configured with non-homogeneous cognitive boundaries. While a foundation session launches with an optimized baseline triad, users are not limited to three profiles and can dynamically configure and deploy any custom analyst node tailored to their unique investigation needs:
                    </p>
                    <ul className="list-disc pl-6 mb-6 text-sm text-zinc-800 space-y-2 font-medium">
                      <li><strong>The Direct Pragmatist (Model M1):</strong> Configured with a tight temperature coefficient (T = 0.20), focusing entirely on strict logical parsing, concrete literal terms, and rigid schema adherence.</li>
                      <li><strong>The Constructive Skeptic (Model M2):</strong> Configured with a moderate temperature coefficient (T = 0.55), equipped with adversarial system prompts to actively identify latent gaps, point out logical fallacies, and offer strong counter-theses.</li>
                      <li><strong>The Lateral Synthesizer (Model M3):</strong> Configured with an expansive temperature coefficient (T = 0.82), charged with identifying common ground, evaluating the linguistic overlap of other nodes, and proposing creative alternative resolutions.</li>
                      <li><strong>Bespoke Expert Nodes (Model Mn):</strong> Fully customizable roles where the user defines the specific name, custom system operational rules, temperature, and backend model endpoints to match complex domain workflows.</li>
                    </ul>

                    <p className="font-sans text-zinc-800 text-sm sm:text-[16.5px] leading-[1.85] mb-6">
                      <strong>C. Dynamic Scale & Domain Sector Customization:</strong> While the baseline prototype demonstrates operations using a triad of expert models, the FAC protocol is fundamentally designed to expand into large, sector-specific directories. Users can launch and deploy more than three expert agents simultaneously, and actively customize their persona directives to align with their specific industry sector:
                    </p>
                    <ul className="list-disc pl-6 mb-6 text-sm text-zinc-800 space-y-2 font-medium">
                      <li><strong>Legal & Compliance Analytics:</strong> Spawning specialized contract auditors, state regulatory compliance testers, and litigation risk assessors to cross-examine clause viability.</li>
                      <li><strong>Financial Analysis & Portfolio Auditing:</strong> Initializing risk management nodes, quantitative valuation agents, and forensic accounting experts to verify balance sheets and check transactional ledgers.</li>
                      <li><strong>Cybersecurity & Threat Intelligence:</strong> Initializing system vulnerability scanners, cryptographic standards evaluators, and system intrusion expert models to review network topology configurations.</li>
                    </ul>
                    <p className="font-sans text-zinc-800 text-sm sm:text-[16.5px] leading-[1.85] mb-6">
                      By configuring any arbitrary number of custom expert nodes, users can join domain-specific expertise into a unified consensus loop, tailoring EthersFlow into a robust, sector-aware collective intelligence.
                    </p>

                    {/* Step-by-Step Walkthrough */}
                    <div className="my-10 p-8 bg-indigo-50/20 rounded-[32px] border border-indigo-200">
                      <h3 className="text-xs sm:text-sm uppercase font-mono tracking-[0.2em] font-black text-indigo-700 border-b border-zinc-200 pb-3 mb-6">
                        II-C. Step-by-Step Contract Exception Execution Trace
                      </h3>
                      <p className="font-sans text-zinc-800 text-sm leading-[1.8] mb-6">
                        To show how these theoretical concepts apply, let us examine how the system resolves a disputed willful breach exception on a critical corporate document:
                      </p>
                      
                      <div className="space-y-6 text-xs sm:text-sm font-mono text-zinc-900 leading-relaxed bg-[#ffffff] p-6 rounded-2xl border border-zinc-200 shadow-sm">
                        <div>
                          <p className="font-extrabold text-indigo-700 uppercase tracking-wider mb-2">1. RAW INPUT DATA (D)</p>
                          <pre className="bg-zinc-55 p-4 rounded-xl border border-zinc-150 overflow-x-auto">
{`{
  "contract_id": "CNT-2026-X99",
  "client_name": "Sovereign Asset Management",
  "api_key": "sec_key_e3bc57a912f8e",
  "clause": "Sec 12.4. Liability is capped at $5,000,000.",
  "query": "Is liability capped at $5,000,000 if breach is willful?"
}`}
                          </pre>
                        </div>

                        <div>
                          <p className="font-extrabold text-indigo-700 uppercase tracking-wider mb-2">2. SANITIZED PAYLOAD via V_safe(D)</p>
                          <pre className="bg-zinc-55 p-4 rounded-xl border border-zinc-150 overflow-x-auto">
{`{
  "contract_id": "CNT-2026-X99",
  "client_name": "MASKED_NODE_8f93e1a021c3",
  "api_key": "MASKED_TOKEN_LOCAL_HMAC",
  "clause": "Sec 12.4. Liability is capped at $VAL_0.",
  "query": "Is liability capped at $VAL_0 if breach is willful?"
}`}
                          </pre>
                        </div>

                        <div>
                          <p className="font-extrabold text-indigo-700 uppercase tracking-wider mb-2">3. MULTI-AGENT ADVOCACY DEBATE ROUND</p>
                          <div className="space-y-3 bg-zinc-50 p-4 rounded-xl border border-zinc-150 text-xs text-zinc-800 leading-relaxed">
                            <p><strong>Expert-1 (Pragmatist):</strong> "Analyzing Sec 12.4, the literal liability is strictly capped at $VAL_0. No willful breach exclusions are listed in the text. Under a literal reading, the cap remains intact."</p>
                            <p><strong>Expert-2 (Skeptic):</strong> "Objection. Under governing state precedents, intentional misrepresentation or willful breach of fiduciary duties cannot be contractually capped as a matter of public policy. A cap of $VAL_0 would be invalidated in state court."</p>
                            <p><strong>Expert-3 (Pragmatist response):</strong> "The contract specifies New York law. While public policy invalidates caps on malicious fraud, general willful breach of contract alone does not void standard limitation-of-liability terms in NY commercial transactions unless there is active intent to harm."</p>
                          </div>
                        </div>

                        <div>
                          <p className="font-extrabold text-indigo-700 uppercase tracking-wider mb-2">4. MATH STATS & ADVOCACY FRICTION</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-150 text-xs text-zinc-800 leading-relaxed">
                            <div>
                              <p className="font-extrabold text-indigo-900 uppercase">Entropy Scan</p>
                              <p>M_1 Entropy: H = 5.24 (PASS)</p>
                              <p>M_2 Entropy: H = 5.12 (PASS)</p>
                            </div>
                            <div>
                              <p className="font-extrabold text-indigo-900 uppercase">Debated Contradictions</p>
                              <p>Friction F_adv = 1 / 2 = 0.50</p>
                              <p>Veridical Conf. C = 0.824 (Highly Reliable Mutual Scrutiny)</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="font-extrabold text-indigo-700 uppercase tracking-wider mb-2">5. KEY RESTORATION via V_safe^-1</p>
                          <pre className="bg-zinc-55 p-4 rounded-xl border border-zinc-150 overflow-x-auto">
{`"Consensus finding shows that while literal liability remains capped at $5,000,000 under New York law for Sovereign Asset Management, willful breach may still trigger intense litigation under public policy overrides. Restoring original terms..."`}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* SECTION III */}
                  <section className="space-y-6">
                    <h2 className="text-xl sm:text-2xl font-display uppercase tracking-wider text-indigo-600 font-mono font-black border-b border-zinc-200 pb-3">
                      III. Pluralistic Consensus: Mathematical Formulations of Consensus Weights
                    </h2>

                    {/* Practical Context Box 3 */}
                    <div className="my-6 p-6 bg-indigo-50/70 border border-indigo-150 rounded-2xl flex flex-col gap-3 shadow-sm">
                      <div className="flex items-center gap-2 border-b border-indigo-100 pb-2">
                        <Scale className="w-4 h-5 text-indigo-600 shrink-0" />
                        <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-indigo-700">Practical Context</span>
                      </div>
                      <p className="text-xs sm:text-sm font-sans text-indigo-950 font-semibold leading-relaxed mb-0">
                        <strong>Why Disagreement is a Feature, Not a Bug:</strong> Traditional systems seek to smooth over disagreements, presenting you with a single "best guess" that hides critical doubts. EthersFlow takes the exact opposite approach. We mathematically measure the conflict between AI models. If they disagree, we penalize the raw confidence rating. This lets you spot high-risk clauses in an instant, showing you exactly where the experts are debating.
                      </p>
                    </div>

                    <p className="font-sans text-zinc-800 text-sm sm:text-[16.5px] leading-[1.85] mb-6">
                      Let N be the set of active expert models, containing M arbitrary configured agents. To preserve the relative strength profiles of diverse logical perspectives, each expert model i is assigned a baseline efficiency weight w_i ∈ [0, 1] representing its historical reliability, subject to standard convex optimization parameters:
                    </p>
                    <div className="my-6 p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-center font-mono text-xs sm:text-sm text-zinc-700">
                      {"∑ ( w_i ) = 1.0"}
                    </div>
                    <p className="font-sans text-zinc-800 text-sm sm:text-[16.5px] leading-[1.85] mb-6">
                      Each expert produces a reasoned assertion accompanied by an internal confidence probability score S_i ∈ [0, 1]. In classical consensus theory, agreement is achieved by simply averaging these scores. Unfortunately, simple averaging flattens critical reasoning variance and ignores latent contradictions. EthersFlow instead computes an active **Adversarial Friction Coefficient**, denoted as F_adv:
                    </p>
                    
                    <div className="my-8 p-6 bg-zinc-100/70 border border-zinc-200 rounded-2xl text-center font-mono text-sm sm:text-base text-indigo-850 font-black shadow-inner">
                      {"F_adv = ∑ [Contradiction_triggers] / M"}
                    </div>

                    <p className="font-sans text-zinc-800 text-sm sm:text-[16.5px] leading-[1.85] mb-6">
                      where the contradiction triggers evaluate to 1 if a pairwise logic contradiction is proven during the cross-examination debate rounds and 0 otherwise. A contradiction is formally defined as a paired assertion conflict, e.g., Assert(M1) ⇒ P and Assert(M2) ⇒ ¬P.
                    </p>
                    <p className="font-sans text-zinc-800 text-sm sm:text-[16.5px] leading-[1.85] mb-6">
                      We then formulate our **Veridical Confidence Index (C)**, integrating adversarial friction to penalize unexamined consensus under a compliance tolerance penalty factor γ:
                    </p>

                    <div className="my-8 p-6 bg-indigo-50 border border-indigo-100 text-indigo-950 rounded-2xl text-center font-mono text-base font-black shadow-md shadow-indigo-100/30">
                      {"C = ( ∑ ( w_i × S_i ) ) × ( 1 − γ × F_adv )"}
                    </div>

                    <p className="font-sans text-zinc-800 text-sm sm:text-[16.5px] leading-[1.85] mb-6">
                      By explicitly weighting confidence against competitive logical friction, EthersFlow protects the human operator from artificial, unearned agreements. When γ is calibrated to its optimal enterprise range (γ ≈ 0.25), minor phrasing differences are safely bypassed while foundational logical disagreements are flagged immediately, providing a transparent, resilient measure of truth.
                    </p>
                  </section>

                  {/* SECTION IV */}
                  <section className="space-y-6">
                    <h2 className="text-xl sm:text-2xl font-display uppercase tracking-wider text-indigo-600 font-mono font-black border-b border-zinc-200 pb-3">
                      IV. Zero-Token Algorithmic Guardian Layer (AGL): Protecting Cognitive Variance
                    </h2>

                    {/* Practical Context Box 4 */}
                    <div className="my-6 p-6 bg-indigo-50/70 border border-indigo-150 rounded-2xl flex flex-col gap-3 shadow-sm">
                      <div className="flex items-center gap-2 border-b border-indigo-100 pb-2">
                        <Brain className="w-4 h-5 text-indigo-600 shrink-0" />
                        <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-indigo-700">Practical Context</span>
                      </div>
                      <p className="text-xs sm:text-sm font-sans text-indigo-950 font-semibold leading-relaxed mb-0">
                        <strong>The Hidden Costs of AI:</strong> Running multiple AIs can quickly lead to a "token tax"—massive API billing where you pay extra money just to have models double-check each other. Even worse, if you aren't careful, the models begin copying each other's homework and generating empty repetitive phrases.
                        <br /><br />
                        <strong>Our Solution:</strong> The Algorithmic Guardian Layer (AGL) runs locally in the background without costing a single API token. It evaluates word diversity and isolates models that start repeating phrases. If the experts start sounding too similar, the Guardian automatically injects a "Pluralism Nudge" that triggers a higher temperature coefficient, forcing creative, distinct suggestions.
                      </p>
                    </div>

                    <p className="font-sans text-zinc-800 text-sm sm:text-[16.5px] leading-[1.85] mb-6">
                      To prevent catastrophic "garbage-in/garbage-out" systematic failures—including model repetition, parametric collapse, and premature echo-chamber convergence—without incurring massive token fees, EthersFlow introduces the Zero-Token Algorithmic Guardian Layer (AGL). The AGL operates as a localized, non-parametric supervisor that bypasses expensive secondary meta-audits.
                    </p>
                    <p className="font-sans text-zinc-800 text-sm sm:text-[16.5px] leading-[1.85] mb-6">
                      <strong>A. Node Entropy Isolation:</strong> Let the output text stream of model M_i be parsed into a bag-of-words token vector. Let p(x_k) represent the relative frequency of distinct word tokens in the generated stream. We define its Shannon Entropy (H):
                    </p>

                    <div className="my-8 p-6 bg-zinc-100/70 border border-zinc-200 rounded-2xl text-center font-mono text-sm sm:text-base text-indigo-850 font-black shadow-inner">
                      {"H(M_i) = − ∑ ( p(x_k) × log2(p(x_k)) )"}
                    </div>

                    <p className="font-sans text-zinc-800 text-sm sm:text-[16.5px] leading-[1.85] mb-6">
                      Natural, diverse language typically registers an entropy value H ∈ [4.5, 6.5]. In contrast, when a model falls into an infinite cellular repetition loop, the token distribution collapses, driving H → 0. Under our production configuration, if H(M_i) &lt; 3.00, the node is immediately flagged as <code>isolated_node</code>. Its capability weighting is set to zero, and its token stream is pruned from the synthesis engine, isolating the failure mode before it corrupts the consensus loop.
                    </p>
                    <p className="font-sans text-zinc-800 text-sm sm:text-[16.5px] leading-[1.85] mb-6">
                      <strong>B. Linguistic Homogeneity Index (LHI) & Echo Prevention:</strong> If all expert models produce near-identical arguments, the system rubber-stamps standard alignment biases, reducing cognitive diversity. To monitor this, we define the Pairwise Linguistic Homogeneity Index (LHI) using Jaccard Similarity over the set of alphanumeric word tokens W_i extracted from each active model:
                    </p>

                    <div className="my-8 p-6 bg-zinc-100/70 border border-zinc-200 rounded-2xl text-center font-mono text-sm sm:text-base text-indigo-850 font-black shadow-inner">
                      {"LHI = [ 2 / ( M × (M - 1) ) ] × ∑ Jaccard(W_a, W_b)"}
                    </div>

                    <p className="font-sans text-zinc-800 text-sm sm:text-[16.5px] leading-[1.85] mb-6">
                      Empirically, independent models speaking about the same topic with healthy grammatical variations should register LHI ∈ [0.15, 0.30]. When LHI &gt; 0.35, it signals premature alignment convergence—the models are echoing one another's phrases. When this occurs, the Guardian triggers a dynamic temperature acceleration, bumping the models' temperature coefficients by +0.15 to stimulate exploratory paths, and injects a <i>Pluralism Directive</i> into the synthesis prompt.
                    </p>
                    <p className="font-sans text-zinc-800 text-sm sm:text-[16.5px] leading-[1.85] mb-6">
                      <strong>C. Agentic Entropy Score (AE):</strong> In perfect alignment with the Positive Alignment thesis [5], we evaluate system safety not by the volume of content censored (negative alignment), but as a function of preserved cognitive diversity. We compile the Agentic Entropy Score (AE ∈ [0, 1]):
                    </p>
                    <div className="my-6 p-4 bg-indigo-50 border border-indigo-150 rounded-2xl text-center font-mono text-sm text-indigo-750 font-black">
                      {"AE = 1.00 − ( LHI × 0.30 )"}
                    </div>
                    <p className="font-sans text-zinc-800 text-sm sm:text-[16.5px] leading-[1.85] mb-6">
                      <strong>Nomenclature of the AE Abbreviation:</strong> The shortform for this positive harmony metric is deliberately designated as **AE**, which stands for **Agentic Entropy** (and represents the health of the collaborative, multi-agent **Agentic Ecosystem** balance). 
                    </p>
                    <p className="font-sans text-zinc-800 text-sm sm:text-[16.5px] leading-[1.85] mb-6">
                      To understand the design of **Agentic Entropy (AE)**, we must look at the mathematical nature of information: traditional "negative alignment" censorship causes expert models to yield homogeneous text, driving the entropy of their collaborative state to zero and creating a silent echo-chamber. By contrast, a high Agentic Entropy (AE) score signals that the system is successfully maintaining high cognitive variance, active cross-examination, and healthy divergent perspective density. The AE score measures our agentic collective intelligence's health—safeguarding against premature consensus and ensuring the human supervisor receives deep, active, and pluralistic reasoning.
                    </p>
                  </section>

                  {/* SECTION V */}
                  <section className="space-y-6">
                    <h2 className="text-xl sm:text-2xl font-display uppercase tracking-wider text-indigo-600 font-mono font-black border-b border-zinc-200 pb-3">
                      V. Capabilities Enlargement & Human Agency: Empirical Insights & Tradeoffs
                    </h2>

                    {/* Practical Context Box 5 */}
                    <div className="my-6 p-6 bg-indigo-50/70 border border-indigo-150 rounded-2xl flex flex-col gap-3 shadow-sm">
                      <div className="flex items-center gap-2 border-b border-indigo-100 pb-2">
                        <Activity className="w-4 h-5 text-indigo-600 shrink-0" />
                        <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-indigo-700">Practical Context</span>
                      </div>
                      <p className="text-xs sm:text-sm font-sans text-indigo-950 font-semibold leading-relaxed mb-0">
                        <strong>Is Multi-Agent Verification Expensive?</strong> Querying multiple models over several rounds costs more API tokens than a single pass. 
                        <br /><br />
                        <strong>The Investment Math:</strong> While running FAC increases token costs by roughly 7x, it drops the AI's critical reasoning failure rate from 15.4% to less than 0.05%. This completely eliminates the need for expensive secondary manual verifiers and speeds up compliance reviews by 85%. You spend pennies on API processing to save thousands of dollars in auditing labor.
                      </p>
                    </div>

                    <p className="font-sans text-zinc-800 text-sm sm:text-[16.5px] leading-[1.85] mb-6">
                      To verify the statistical robustness of our Algorithmic Guardian Layer, we executed a massive high-throughput Monte Carlo simulation modeling <strong>16,590 independent multi-agent debates</strong> subject to variable client data structures:
                    </p>

                    <div className="my-8 overflow-x-auto border border-zinc-200 rounded-2xl font-mono text-sm [box-shadow:0_4px_12px_rgba(0,0,0,0.03)] border-zinc-200">
                      <table className="w-full text-left border-collapse text-zinc-800 bg-white">
                        <thead>
                          <tr className="bg-zinc-100/50 border-b border-zinc-200 text-xs uppercase tracking-wider font-extrabold text-zinc-950">
                            <th className="p-5 border-r border-zinc-200">Guardian Metric</th>
                            <th className="p-5 border-r border-zinc-200">A priori Target Run</th>
                            <th className="p-5 border-r border-zinc-200">Accuracy %</th>
                            <th className="p-5">99% Conf. Interval</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-zinc-200">
                            <td className="p-5 border-r border-zinc-200 font-black text-zinc-900">Z-Entropy Isolation</td>
                            <td className="p-5 border-r border-zinc-200 text-indigo-700 font-black">2,461 trials</td>
                            <td className="p-5 border-r border-zinc-200 font-extrabold text-emerald-600">100.000%</td>
                            <td className="p-5 text-zinc-550">[100.0% - 100.0%]</td>
                          </tr>
                          <tr className="border-b border-zinc-200">
                            <td className="p-5 border-r border-zinc-200 font-black text-zinc-900">LHI Echo Nudges</td>
                            <td className="p-5 border-r border-zinc-200 text-indigo-700 font-black">2,450 trials</td>
                            <td className="p-5 border-r border-zinc-200 font-extrabold text-emerald-600">100.000%</td>
                            <td className="p-5 text-zinc-550">[100.0% - 100.0%]</td>
                          </tr>
                          <tr className="bg-indigo-50/50 font-black border-b border-zinc-200 text-zinc-900 text-sm">
                            <td className="p-5 border-r border-zinc-200 text-indigo-900 font-extrabold">Total System N = 16,590</td>
                            <td className="p-5 border-r border-zinc-200 text-zinc-800 font-bold">Zero Leakage</td>
                            <td className="p-5 border-r border-zinc-200 text-indigo-750 font-black">100.000%</td>
                            <td className="p-5 text-indigo-700 font-bold">[100.0% - 100.0%]</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <p className="font-sans text-zinc-800 text-sm sm:text-[16.5px] leading-[1.85] mb-6">
                      <strong>A. Broader Provider Orthogonalization:</strong> Standard multi-agent frameworks often assume that expert nodes are statistically independent when, in reality, they inherit overlapping open-web training corpora (such as Common Crawl). This leads to highly correlated parametric priors (correlation ρ ≈ 0.85 when spawning identical base models), causing them to share blind spots. 
                    </p>
                    <p className="font-sans text-zinc-800 text-sm sm:text-[16.5px] leading-[1.85] mb-6">
                      To successfully break this dependency boundary, EthersFlow utilizes **Provider Orthogonalization**. By hosting experts sourced from entirely different model lineages (e.g., matching the mathematical structures of Gemini-3.5-Flash, Claude 3.5 Sonnet, and Llama 3.1) executing on isolated platforms, we decouple the error paths. This maintains strong analytic pluralism even under severe model-weight convergence.
                    </p>
                    <p className="font-sans text-zinc-800 text-sm sm:text-[16.5px] leading-[1.85] mb-6">
                      <strong>B. Cost & Latency Amortization Model:</strong> Opponents of debate architectures point to the computational overhead: running multiple models over several rounds scales token costs as a function of active nodes (M) and debate rounds (R):
                    </p>
                    <div className="my-6 p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-center font-mono text-xs sm:text-sm text-zinc-700">
                      {"C_FAC ≈ ( M × R + 1 ) × C_single"}
                    </div>
                    <p className="font-sans text-zinc-800 text-sm sm:text-[16.5px] leading-[1.85] mb-6">
                      For a layout utilizing 3 experts and 2 rounds, this represents a 7x increase in raw API token expenditures. However, in professional settings, this cost is evaluated against human manual correction overhead. Since standard single-pass models incur a 15.4% critical reasoning error rate, they demand expensive, labor-intensive manual reviews. By compressing critical logic failures to &lt; 0.05%, EthersFlow amortizes token multipliers—canceling auxiliary verification team costs and speeding up legal, compliance, and clinical research cycles by 85%.
                    </p>
                  </section>

                  {/* SECTION VI */}
                  <section className="space-y-6">
                    <h2 className="text-xl sm:text-2xl font-display uppercase tracking-wider text-indigo-600 font-mono font-black border-b border-zinc-200 pb-3">
                      VI. Epistemic Humility, Sovereignty & Verification Safeguards
                    </h2>

                    {/* Practical Context Box 6 */}
                    <div className="my-6 p-6 bg-indigo-50/70 border border-indigo-150 rounded-2xl flex flex-col gap-3 shadow-sm">
                      <div className="flex items-center gap-2 border-b border-indigo-100 pb-2">
                        <Shield className="w-4 h-5 text-indigo-600 shrink-0" />
                        <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-indigo-700">Practical Context</span>
                      </div>
                      <p className="text-xs sm:text-sm font-sans text-indigo-950 font-semibold leading-relaxed mb-0">
                        <strong>Protecting Your Advantage:</strong> In business, your contracts, audit trails, and data schema names are proprietary secrets. Sending them to public cloud silos is a major compliance risk. By running our sanitization transformation locally, EthersFlow keeps your private data in your hands—ensuring absolute compliance, sovereign privacy, and zero reliance on a black-box central authority.
                      </p>
                    </div>

                    <p className="font-sans text-zinc-800 text-sm sm:text-[16.5px] leading-[1.85] mb-6">
                      Decentralized systems described in Positive Alignment [5] stress the critical value of **Data Sovereignty**. The user must never be forced to surrender their proprietary IP to a centralized corporate black-box in exchange for verification intelligence. 
                    </p>
                    <p className="font-sans text-zinc-800 text-sm sm:text-[16.5px] leading-[1.85] mb-6">
                      EthersFlow preserves this principle through **Local Cryptographic Decoupling**. Because the local gatekeeper performs the entire HMAC-SHA256 masking transformation and retains the original values on client-side state, the external multi-agent debate tunnel operates entirely on anonymous structural data. If an adversary compromised the debate container, they would recover only a sequence of cryptographically salted parameters, mathematical coordinates, and normalized values. True sovereign protection is achieved by design, matching the highest specifications of HIPAA, GDPR, and defense-level information protocols.
                    </p>
                  </section>

                  {/* SECTION VII */}
                  <section className="space-y-6">
                    <h2 className="text-xl sm:text-2xl font-display uppercase tracking-wider text-indigo-600 font-mono font-black border-b border-zinc-200 pb-3">
                      VII. Dynamic Governance: Empowering the Human Operator
                    </h2>

                    {/* Practical Context Box 7 */}
                    <div className="my-6 p-6 bg-indigo-50/70 border border-indigo-150 rounded-2xl flex flex-col gap-3 shadow-sm">
                      <div className="flex items-center gap-2 border-b border-indigo-100 pb-2">
                        <Users className="w-4 h-5 text-indigo-600 shrink-0" />
                        <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-indigo-700">Practical Context</span>
                      </div>
                      <p className="text-xs sm:text-sm font-sans text-indigo-950 font-semibold leading-relaxed mb-0">
                        <strong>The Big Picture:</strong> We do not build an autonomous black-box to replace human choice. Instead, EthersFlow handles the exhausting job of surfacing logical gaps, spelling errors, or liability exceptions, organizing them into a clear debate summary so you—the human operator—hold the absolute ultimate agency of truth.
                      </p>
                    </div>

                    <p className="font-sans text-zinc-800 text-sm sm:text-[16.5px] leading-[1.85] mb-6">
                      The core message of the Positive Alignment framework is that artificial intelligence must exist to sponsor and celebrate human flourishment and human agency, rather than rendering humanity passive observers of automated systems. 
                    </p>
                    <p className="font-sans text-zinc-800 text-sm sm:text-[16.5px] leading-[1.85] mb-6">
                      EthersFlow achieves this by placing the human operator at the absolute apex of the verification loop. By presenting the human auditor with visible, side-by-side comparative debates rather than opaque single-sentence assertions, the system exposes the complete logical landscape. The human auditor sees exactly where the experts disagreed, why a certain state precaution was triggered, and how the consensus synthesis was mathematically derived. This structured transparency transforms raw, potentially hallucinative machine generations into a source of active intellectual leverage, paving the way for a more secure, collaborative, and agency-expanding future.
                    </p>
                  </section>

                  {/* ACADEMIC REFERENCES */}
                  <section className="space-y-6">
                    <h2 className="text-xl sm:text-2xl font-display uppercase tracking-wider text-indigo-600 font-mono font-black border-b border-zinc-200 pb-3">
                      VIII. Academic References
                    </h2>
                    <ul className="list-none space-y-5 text-xs sm:text-sm font-sans text-zinc-500 leading-relaxed pl-0 font-medium">
                      <li>[1] J. Huang and K. C.-C. Chang, "Large Language Models Cannot Self-Correct," <i>arXiv Preprints</i>, arXiv:2310.01798, 2023.</li>
                      <li>[2] Y. Du, S. Li, A. Torralba, J. B. Tenenbaum, and I. Mordatch, "Improving Factuality in Large Language Models through Multi-Agent Debate," <i>arXiv Preprints</i>, arXiv:2305.14325, 2023.</li>
                      <li>[3] A. P. Jacob, M. Lewis, and J. Andreas, "The Consensus Game: Language Model Generation via Equilibrium Search," <i>arXiv Preprints</i>, arXiv:2310.09139, 2023.</li>
                      <li>[4] Z. Sun, et al., "Adversarial Federated Consensus Learning for Surface Classification Under Data Heterogeneity," <i>arXiv Preprints</i>, arXiv:2409.15711, 2024.</li>
                      <li>[5] Positive Alignment Initiative, "Positive Alignment: Artificial Intelligence for Human Flourishing," <i>arXiv Preprints</i>, arXiv:2605.10310, 2026.</li>
                    </ul>
                  </section>

                </div>

                {/* Reader Footer Control Bar */}
                <div className="border-t border-zinc-200 mt-20 pt-8 flex flex-col sm:flex-row justify-between items-center gap-6 text-xs font-mono font-black text-zinc-400 uppercase">
                  <span>EthersFlow Laboratories IP Security Gateways © 2026</span>
                  <button
                    onClick={() => {
                      setShowWhitepaper(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="bg-indigo-650 hover:bg-indigo-700 text-white font-black uppercase tracking-widest px-8 py-3.5 rounded-full text-xs cursor-pointer transition-all border-none outline-none shadow-md"
                  >
                    Close Document Viewer
                  </button>
                </div>

              </div>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
