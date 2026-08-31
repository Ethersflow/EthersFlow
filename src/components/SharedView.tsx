import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  CheckCircle, 
  AlertTriangle, 
  Brain, 
  ArrowLeft,
  Share2,
  Copy,
  LogOut,
  Info,
  Users,
  ShieldCheck,
  ChevronDown,
  BookOpen,
  FileText,
  HelpCircle,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, cleanHeadingText, normalizeConsensus, normalizeAnalystReport, parseAnalystReport } from '../lib/utils';
import { Logo } from './Logo';

interface SharedViewProps {
  debate: {
    query: string;
    synthesis: {
      consensus: string;
      dissents: any[];
      uncertainty: string;
      verdict: string;
      confidenceMetric: number;
      sources: any[];
    };
    analystResponses?: {
      slotId: string;
      persona: string;
      model: string;
      confidence: 'HIGH' | 'MEDIUM' | 'LOW';
      text: string;
      flags: string[];
    }[];
  };
  onClose: () => void;
}

export const SharedView: React.FC<SharedViewProps> = ({ debate, onClose }) => {
  const [activeTab, setActiveTab] = useState<'synthesis' | 'analysts'>('synthesis');
  const [expandedAnalyst, setExpandedAnalyst] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!debate) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Shared Header */}
      <header className="fixed top-0 inset-x-0 h-20 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-50 flex items-center justify-between px-6 sm:px-12">
        <div className="flex items-center gap-4">
          <Logo size="sm" />
          <div className="h-4 w-px bg-gray-200" />
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Public Research Shared</span>
        </div>
        <button 
          onClick={onClose}
          className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to App
        </button>
      </header>

      <main className="pt-32 pb-40 px-6 sm:px-12 max-w-5xl mx-auto">
        {/* Header Block */}
        <div className="mb-10">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Original Research Query</div>
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-8">
            {debate.query}
          </h1>

          {/* Tab Switcher inside the Shared View */}
          {debate.analystResponses && debate.analystResponses.length > 0 && (
            <div className="flex items-center gap-1 bg-gray-50 p-2 rounded-2xl w-fit border border-gray-100 mb-6">
              <button 
                onClick={() => setActiveTab('synthesis')}
                className={cn(
                  "px-6 sm:px-8 py-3 rounded-xl text-[10px] sm:text-xs font-black tracking-widest uppercase transition-all flex items-center gap-2",
                  activeTab === 'synthesis' ? "bg-white text-indigo-600 shadow-md shadow-indigo-50 border border-indigo-100" : "text-gray-400 hover:text-gray-650"
                )}
              >
                <Brain className="w-4 h-4" />
                Consensus Engine
              </button>
              <button 
                onClick={() => setActiveTab('analysts')}
                className={cn(
                  "px-6 sm:px-8 py-3 rounded-xl text-[10px] sm:text-xs font-black tracking-widest uppercase transition-all flex items-center gap-2",
                  activeTab === 'analysts' ? "bg-white text-indigo-600 shadow-md shadow-indigo-50 border border-indigo-100" : "text-gray-400 hover:text-gray-650"
                )}
              >
                <Users className="w-4 h-4" />
                Source Reports ({debate.analystResponses.length})
              </button>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'synthesis' ? (
            <motion.div 
              key="synthesis-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-12"
            >
              {/* Main Column */}
              <div className="lg:col-span-8 space-y-12">
                <div className="bg-white border border-gray-100 rounded-[40px] p-6 sm:p-10 shadow-2xl shadow-indigo-50/20">
                  <div className="flex items-center justify-between mb-10">
                    <h2 className="text-2xl font-black tracking-tight text-gray-900">Research Consensus</h2>
                    <div className="px-4 py-2 bg-indigo-50 rounded-xl text-indigo-600 text-[10px] font-black uppercase tracking-widest">Verified Multi-Model</div>
                  </div>

                  <div className="space-y-10">
                    <div className="relative">
                      <div className="absolute -left-10 top-0 w-1 h-full bg-green-100 rounded-full" />
                      <div className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Consensus Narrative
                      </div>
                      <div className="text-xl text-gray-800 leading-relaxed font-semibold whitespace-pre-wrap markdown-content">
                        <ReactMarkdown
                          components={{
                            a: ({ href, children, ...props }) => {
                              let faviconUrl = "";
                              let isExternal = false;
                              if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
                                isExternal = true;
                                try {
                                  const urlObj = new URL(href);
                                  faviconUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
                                } catch (e) {
                                  // Ignore invalid URLs
                                }
                              }
                              return (
                                <a 
                                  href={href}
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="text-indigo-600 underline font-black hover:text-indigo-800 transition-colors inline-flex items-center gap-1 group align-middle"
                                  {...props}
                                >
                                  {isExternal && faviconUrl && (
                                    <img 
                                      src={faviconUrl} 
                                      alt="" 
                                      className="w-3.5 h-3.5 rounded-sm inline-block object-contain mr-0.5"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                      referrerPolicy="no-referrer"
                                    />
                                  )}
                                  <span>{children}</span>
                                  <LogOut className="w-3 h-3 rotate-[-45deg] opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                              );
                            },
                            h1: ({ ...props }) => (
                              <h3 className="text-base font-bold text-slate-900 mt-6 mb-2">
                                {cleanHeadingText(props.children)}
                              </h3>
                            ),
                            h2: ({ ...props }) => (
                              <h4 className="text-sm font-bold text-slate-900 mt-5 mb-2">
                                {cleanHeadingText(props.children)}
                              </h4>
                            ),
                            h3: ({ ...props }) => (
                              <h5 className="text-xs sm:text-sm font-bold text-slate-900 mt-4 mb-2">
                                {cleanHeadingText(props.children)}
                              </h5>
                            ),
                            h4: ({ ...props }) => {
                              const cleanText = cleanHeadingText(props.children);
                              const isThesis = typeof cleanText === 'string' && (
                                cleanText.toLowerCase().includes('thesis') || 
                                cleanText.toLowerCase().includes('confidence quotient')
                              );
                              
                              if (isThesis) {
                                return (
                                  <div className="mt-6 mb-3 flex items-center gap-2 bg-indigo-50/70 border border-indigo-100/50 px-3 py-1.5 rounded-xl w-fit">
                                    <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
                                    <span className="text-[11px] sm:text-xs font-bold text-indigo-950">
                                      Thesis & Confidence Quotient
                                    </span>
                                  </div>
                                );
                              }
                              
                              return (
                                <h5 className="text-xs sm:text-sm font-bold text-slate-800 mt-4 mb-2">
                                  {cleanHeadingText(props.children)}
                                </h5>
                              );
                            },
                            h5: ({ ...props }) => (
                              <h5 className="text-xs sm:text-sm font-bold text-slate-800 mt-4 mb-2">
                                {cleanHeadingText(props.children)}
                              </h5>
                            ),
                            h6: ({ ...props }) => (
                              <h6 className="text-[11px] sm:text-xs font-semibold text-gray-500 mt-3 mb-1">
                                {cleanHeadingText(props.children)}
                              </h6>
                            ),
                            strong: ({ ...props }) => (
                              <strong className="font-extrabold text-indigo-950">
                                {props.children}
                              </strong>
                            ),
                            hr: () => <div className="h-6" />,
                            ul: ({ children }: any) => (
                              <ul className="space-y-1.5 my-3 list-disc pl-5 text-gray-750">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }: any) => (
                              <ol className="space-y-1.5 my-3 list-decimal pl-5 text-gray-750">
                                {children}
                              </ol>
                            ),
                            li: ({ children }: any) => (
                              <li className="text-[13px] sm:text-sm leading-relaxed text-gray-750">
                                {children}
                              </li>
                            )
                          }}
                        >
                          {normalizeConsensus(debate.synthesis.consensus)}
                        </ReactMarkdown>
                      </div>
                    </div>

                    {debate.synthesis.dissents && debate.synthesis.dissents.length > 0 && (
                      <div className="bg-red-50/30 border border-red-100 rounded-[32px] p-8">
                         <div className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Critical Minority Dissent
                        </div>
                        <div className="space-y-6">
                          {debate.synthesis.dissents.map((d, i) => (
                            <div key={i} className="group">
                              <p className="text-sm font-black text-red-950 uppercase tracking-tight mb-1">{d.who}</p>
                              <p className="text-sm text-red-800/80 leading-relaxed font-semibold">{d.argument}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-900 rounded-[40px] p-6 sm:p-10 text-white overflow-hidden relative">
                  <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full" />
                  <div className="flex items-center gap-3 mb-8">
                    <Brain className="w-6 h-6 text-indigo-400" />
                    <span className="text-xs font-black tracking-[0.3em] uppercase">Neural Reasoning Meta-Data</span>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2 opacity-60">Logic Variance</p>
                      <p className="text-lg font-medium text-indigo-50">{debate.synthesis.uncertainty}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2 opacity-60">Final Synthesis Verdict</p>
                      <p className="text-xl font-black text-white italic">"{debate.synthesis.verdict}"</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar / Stats */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Confidence Metric</p>
                  <div className="relative inline-flex items-center justify-center mb-6">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100" />
                      <circle 
                        cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" 
                        className="text-indigo-600"
                        strokeDasharray={56 * 2 * Math.PI}
                        strokeDashoffset={56 * 2 * Math.PI * (1 - debate.synthesis.confidenceMetric / 100)}
                        strokeLinecap="round" 
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-4xl font-black text-gray-900">{debate.synthesis.confidenceMetric}</span>
                      <span className="text-[10px] font-black text-gray-400">/ 100</span>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-gray-500 leading-relaxed">
                    Calculated based on multi-model semantic alignment and source verification.
                  </p>
                </div>

                {debate.synthesis.sources && debate.synthesis.sources.length > 0 && (
                  <div className="bg-gray-50 rounded-[32px] p-8 border border-gray-100">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Research Sources</h4>
                    <div className="space-y-3">
                      {debate.synthesis.sources.map((s, i) => (
                        <a 
                          key={i} 
                          href={s.url || '#'} 
                          target="_blank" 
                          rel="noreferrer"
                          className="block p-4 bg-white border border-gray-100 rounded-2xl hover:border-indigo-200 transition-all group"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-black text-gray-900 group-hover:text-indigo-600 transition-colors truncate">{s.title}</span>
                            <LogOut className="w-3 h-3 text-gray-300 rotate-[-45deg]" />
                          </div>
                          <p className="text-[10px] font-bold text-gray-400 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                            {s.url || 'Internal Knowledge Base'}
                          </p>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[32px]">
                   <div className="flex items-center gap-3 mb-4">
                     <Info className="w-5 h-5 text-indigo-600" />
                     <h4 className="font-black text-indigo-900 text-sm">About Research Sharing</h4>
                   </div>
                   <p className="text-xs text-indigo-700/70 font-medium leading-relaxed">
                     Shared analyses provide a snapshot of an adversarial debate between specialized AI models. This methodology reduces reasoning drift and hallucination.
                   </p>
                   <button 
                    onClick={onClose}
                    className="mt-6 w-full py-3 bg-white border border-indigo-200 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                   >
                     Create Your Own Analysis
                   </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="analysts-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Confidence Legend */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-8 bg-white border border-gray-100 rounded-[32px] px-6 py-5 shadow-sm">
                <div className="flex flex-col gap-1 mr-4">
                  <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest leading-none">Consensus Verification Markers</span>
                </div>
                {[
                  { label: 'Verified Consensus', color: 'bg-green-500', desc: 'Direct technical/evidence alignment' },
                  { label: 'Inferred Logic', color: 'bg-blue-500', desc: 'Synthesized from partial data' },
                  { label: 'Critical Gap', color: 'bg-orange-500', desc: 'Reasoning requires manual audit' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={cn("w-2.5 h-2.5 rounded-full ring-4 ring-offset-0", item.color, 
                      item.label.includes('Verified') ? "ring-green-50" : 
                      item.label.includes('Inferred') ? "ring-blue-50" : "ring-orange-50"
                    )} />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-gray-800 uppercase tracking-tight">{item.label}</span>
                      <span className="text-[9px] font-medium text-gray-400 hidden sm:block">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Analyst list bento card grid or bento list */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {debate.analystResponses?.map((r, i) => {
                  const isExpanded = expandedAnalyst === r.persona;
                  return (
                    <motion.div 
                      layout
                      transition={{ duration: 0.2 }}
                      key={r.slotId || i}
                      onClick={() => setExpandedAnalyst(isExpanded ? null : r.persona)}
                      className={cn(
                        "bg-white dark:bg-zinc-950 border transition-all relative overflow-hidden flex flex-col group cursor-pointer",
                        isExpanded 
                          ? "col-span-full border-indigo-200 dark:border-zinc-800 shadow-2xl shadow-indigo-100 dark:shadow-none rounded-[32px] sm:rounded-[48px] p-6 lg:p-10" 
                          : "border-gray-100 dark:border-zinc-800/80 rounded-[28px] sm:rounded-[36px] shadow-sm hover:shadow-2xl hover:shadow-indigo-50 dark:hover:shadow-none min-h-[280px]"
                      )}
                    >
                      {isExpanded ? (
                        <div>
                          <div className="px-4 py-5 sm:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-950 relative z-10 border-b border-gray-50 dark:border-zinc-900 mb-6">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl flex items-center justify-center text-sm font-black text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                                {r.persona.charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-base font-black tracking-tight text-gray-900 dark:text-zinc-100 uppercase leading-none">{r.persona}</h3>
                                  <ShieldCheck className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-tighter">MODEL PROVENANCE:</span>
                                  <span className="text-[10px] font-mono font-bold text-indigo-500 dark:text-indigo-400 uppercase">{r.model}</span>
                                </div>
                                {r.specialization && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-tighter">SPECIALIZATION:</span>
                                    <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase">{r.specialization}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className={cn(
                                "text-[9px] px-3 py-1.5 rounded-xl font-black tracking-widest border flex items-center gap-2 transition-all",
                                r.confidence === 'HIGH' ? "bg-green-50 text-green-600 border-green-100 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30" : 
                                r.confidence === 'MEDIUM' ? "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30" :
                                "bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30"
                              )}>
                                <div className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  r.confidence === 'HIGH' ? "bg-green-500" : 
                                  r.confidence === 'MEDIUM' ? "bg-blue-500" :
                                  "bg-orange-500"
                                )} />
                                {r.confidence === 'HIGH' ? 'HIGH CONFIDENCE' : r.confidence === 'MEDIUM' ? 'STABLE CONFIDENCE' : 'LOW CERTAINTY'}
                              </span>

                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(r.text, r.slotId);
                                }}
                                className={cn(
                                  "p-2 rounded-xl transition-all relative border shadow-sm",
                                  copiedId === r.slotId ? "bg-green-50 text-green-600 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30" : "text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-zinc-900 border-gray-100 dark:border-zinc-800"
                                )}
                              >
                                {copiedId === r.slotId ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-6 mt-4">
                            {(() => {
                              const parsed = parseAnalystReport(r.text);
                              const markdownComponents = {
                                a: ({ href, children, ...props }: any) => {
                                  let faviconUrl = "";
                                  let isExternal = false;
                                  if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
                                    isExternal = true;
                                    try {
                                      const urlObj = new URL(href);
                                      faviconUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
                                    } catch (e) {
                                      // Ignore invalid URLs
                                    }
                                  }
                                  return (
                                    <a 
                                      href={href}
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="text-indigo-600 dark:text-indigo-450 underline font-black hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors inline-flex items-center gap-1 group align-middle"
                                      {...props}
                                    >
                                      {isExternal && faviconUrl && (
                                        <img 
                                          src={faviconUrl} 
                                          alt="" 
                                          className="w-3.5 h-3.5 rounded-sm inline-block object-contain mr-0.5"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                          }}
                                          referrerPolicy="no-referrer"
                                        />
                                      )}
                                      <span>{children}</span>
                                    </a>
                                  );
                                },
                                h1: ({ ...props }: any) => (
                                  <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-zinc-100 mt-6 mb-2">
                                    {cleanHeadingText(props.children)}
                                  </h4>
                                ),
                                h2: ({ ...props }: any) => (
                                  <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-zinc-100 mt-6 mb-2">
                                    {cleanHeadingText(props.children)}
                                  </h4>
                                ),
                                h3: ({ ...props }: any) => (
                                  <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-zinc-100 mt-6 mb-2">
                                    {cleanHeadingText(props.children)}
                                  </h4>
                                ),
                                h4: ({ ...props }: any) => (
                                  <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-zinc-200 mt-5 mb-2">
                                    {cleanHeadingText(props.children)}
                                  </h4>
                                ),
                                h5: ({ ...props }: any) => (
                                  <h5 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-250 mt-4 mb-2">
                                    {cleanHeadingText(props.children)}
                                  </h5>
                                ),
                                h6: ({ ...props }: any) => (
                                  <h6 className="text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mt-3 mb-1">
                                    {cleanHeadingText(props.children)}
                                  </h6>
                                ),
                                strong: ({ ...props }: any) => (
                                  <strong className="font-extrabold text-indigo-950 dark:text-indigo-300">
                                    {props.children}
                                  </strong>
                                ),
                                hr: () => <div className="h-6" />,
                                ul: ({ children }: any) => (
                                  <ul className="space-y-1.5 my-3 list-disc pl-5 text-gray-750 dark:text-zinc-300">
                                    {children}
                                  </ul>
                                ),
                                ol: ({ children }: any) => (
                                  <ol className="space-y-1.5 my-3 list-decimal pl-5 text-gray-750 dark:text-zinc-300">
                                    {children}
                                  </ol>
                                ),
                                li: ({ children }: any) => (
                                  <li className="text-[13px] sm:text-sm leading-relaxed text-gray-750 dark:text-zinc-300">
                                    {children}
                                  </li>
                                )
                              };

                              return (
                                <div className="space-y-8 mt-4">
                                  {parsed.other && (
                                    <div className="text-gray-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed text-[13px] sm:text-sm bg-gray-50/50 dark:bg-zinc-900/40 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800/80 mb-6">
                                      {parsed.other}
                                    </div>
                                  )}

                                  {parsed.thesis && (
                                    <div className="bg-slate-50/60 dark:bg-zinc-900/20 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-5 sm:p-7 shadow-sm">
                                      <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                          <BookOpen className="w-4 h-4" />
                                        </div>
                                        <h4 className="text-xs sm:text-sm font-black text-indigo-950 dark:text-indigo-300 uppercase tracking-wider">Thesis & Confidence Quotient</h4>
                                      </div>
                                      <div className="text-gray-700 dark:text-zinc-300 leading-relaxed text-[13px] sm:text-sm markdown-content">
                                        <ReactMarkdown components={markdownComponents}>{parsed.thesis}</ReactMarkdown>
                                      </div>
                                    </div>
                                  )}

                                  {parsed.findings && (
                                    <div className="bg-white dark:bg-zinc-900/20 border border-gray-100 dark:border-zinc-800/80 rounded-2xl p-5 sm:p-7 shadow-sm">
                                      <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-450">
                                          <FileText className="w-4 h-4" />
                                        </div>
                                        <h4 className="text-xs sm:text-sm font-black text-emerald-950 dark:text-emerald-300 uppercase tracking-wider">Key Findings & Evidence Grounding</h4>
                                      </div>
                                      <div className="text-gray-700 dark:text-zinc-300 leading-relaxed text-[13px] sm:text-sm markdown-content">
                                        <ReactMarkdown components={markdownComponents}>{parsed.findings}</ReactMarkdown>
                                      </div>
                                    </div>
                                  )}

                                  {parsed.peerDebate && (
                                    <div className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/25 dark:to-purple-950/25 border-2 border-indigo-150 dark:border-indigo-900/50 rounded-2xl p-5 sm:p-7 shadow-md relative overflow-hidden group">
                                      <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full blur-2xl -mr-6 -mt-6 group-hover:scale-125 transition-transform duration-700" />
                                      <div className="flex items-center gap-3 mb-4 relative z-10">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100/10 ring-4 ring-indigo-50 dark:ring-indigo-950/50">
                                          <Users className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col">
                                          <h4 className="text-xs sm:text-sm font-black text-indigo-950 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                                            Peer Debate Alignment
                                            <span className="bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest animate-pulse">Debate Hub</span>
                                          </h4>
                                          <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold">Adversarial peer exchange & consensus pressure points</span>
                                        </div>
                                      </div>
                                      <div className="text-gray-800 dark:text-zinc-100 leading-relaxed text-[13px] sm:text-sm relative z-10 markdown-content p-4 sm:p-5 bg-white/70 dark:bg-zinc-900/70 rounded-xl border border-white dark:border-zinc-850 shadow-inner">
                                        <ReactMarkdown components={markdownComponents}>{parsed.peerDebate}</ReactMarkdown>
                                      </div>
                                    </div>
                                  )}

                                  {parsed.uncertainty && (
                                    <div className="bg-orange-50/30 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/20 rounded-2xl p-5 sm:p-7 shadow-sm">
                                      <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-orange-50/80 dark:bg-orange-950/40 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                          <HelpCircle className="w-4 h-4" />
                                        </div>
                                        <h4 className="text-xs sm:text-sm font-black text-orange-950 dark:text-indigo-300 uppercase tracking-wider">Uncertainty & Gaps</h4>
                                      </div>
                                      <div className="text-gray-700 dark:text-zinc-300 leading-relaxed text-[13px] sm:text-sm markdown-content">
                                        <ReactMarkdown components={markdownComponents}>{parsed.uncertainty}</ReactMarkdown>
                                      </div>
                                    </div>
                                  )}

                                  {parsed.conclusion && (
                                    <div className="bg-slate-50/40 dark:bg-zinc-900/20 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-5 sm:p-7 shadow-sm">
                                      <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-slate-600 dark:bg-zinc-800 flex items-center justify-center text-white">
                                          <Award className="w-4 h-4" />
                                        </div>
                                        <h4 className="text-xs sm:text-sm font-black text-slate-950 dark:text-zinc-200 uppercase tracking-wider">Conclusion</h4>
                                      </div>
                                      <div className="text-gray-700 dark:text-zinc-300 leading-relaxed text-[13px] sm:text-sm markdown-content">
                                        <ReactMarkdown components={markdownComponents}>{parsed.conclusion}</ReactMarkdown>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      ) : (
                        <div className="p-8 flex flex-col justify-between h-full relative bg-white dark:bg-zinc-950 rounded-[28px] sm:rounded-[36px]">
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl flex items-center justify-center text-xs font-black text-indigo-600 dark:text-indigo-400">
                                {r.persona.charAt(0)}
                              </div>
                              <span className={cn(
                                "text-[8px] px-2 py-1 rounded-lg font-black uppercase tracking-widest border",
                                r.confidence === 'HIGH' ? "bg-green-50 text-green-600 border-green-100 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30" : 
                                r.confidence === 'MEDIUM' ? "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30" :
                                "bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30"
                              )}>
                                {r.confidence === 'HIGH' ? 'HIGH' : r.confidence === 'MEDIUM' ? 'STABLE' : 'LOW'}
                              </span>
                            </div>

                            <h4 className="text-base font-black text-gray-900 dark:text-zinc-100 uppercase tracking-tight mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {r.persona}
                            </h4>
                            <p className="text-[10px] font-mono text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1">
                              DEPLOYED: {r.model}
                            </p>
                            {r.specialization && (
                              <p className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase truncate mb-3">
                                {r.specialization}
                              </p>
                            )}
                            <p className="text-xs font-bold text-gray-500 dark:text-zinc-400 leading-relaxed line-clamp-4">
                              {r.text.replace(/[#*`]/g, '').slice(0, 200)}...
                            </p>
                          </div>

                          <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 mt-6 border-t border-dotted border-gray-100 dark:border-zinc-800 pt-4">
                            Expand Analysis Report 
                            <ChevronDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
                          </span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-gray-100 py-12 px-6 sm:px-12 bg-gray-50/50">
         <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <Logo size="sm" />
              <span className="font-black italic tracking-tighter text-indigo-900">EthersFlow</span>
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Institutional Intelligence Framework — Powered by Adversarial Consensus
            </p>
         </div>
      </footer>
    </div>
  );
};
