import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, Search, Cpu, CheckCircle2, ArrowRight, Layers, Sparkles, RefreshCw, Sliders } from 'lucide-react';
import { performVectorSearch, VectorMatch, chunkTextSlidingWindow } from '../services/embeddingService';

interface NemotronVectorInspectorProps {
  onInjectContext?: (groundedText: string) => void;
  initialDocuments?: string[];
}

export const NemotronVectorInspector: React.FC<NemotronVectorInspectorProps> = ({
  onInjectContext,
  initialDocuments
}) => {
  const [query, setQuery] = useState('audit risk mitigation for zero-knowledge proof verification');
  const [documentsText, setDocumentsText] = useState(
    initialDocuments && initialDocuments.length > 0
      ? initialDocuments.join('\n---\n')
      : `Zero-Knowledge proof rollups reduce L1 gas overhead by batching state transitions off-chain.
Multi-signature key rotation policies require threshold consensus before executing emergency pauses.
Consensus divergence between nodes occurs when state transition functions evaluate unverified opcodes.
Automated audit telemetry calculates LHI score and entropy metrics to prevent model hallucination.`
  );
  
  const [isSearching, setIsSearching] = useState(false);
  const [matches, setMatches] = useState<VectorMatch[]>([]);
  const [queryVectorSample, setQueryVectorSample] = useState<number[]>([]);
  const [modelName, setModelName] = useState<string>('nvidia/nemotron-3-embed-1b:free');
  const [dimension, setDimension] = useState<number>(1024);
  const [hasSearched, setHasSearched] = useState(false);

  const handleRunVectorSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    const rawBlocks = documentsText
      .split('\n---')
      .map(d => d.trim())
      .filter(Boolean);

    // Apply sliding window chunking (~2,000 chars, 400 char overlap) across all raw blocks
    const chunks: string[] = [];
    for (const block of rawBlocks) {
      const windowChunks = chunkTextSlidingWindow(block, 2000, 400);
      chunks.push(...windowChunks);
    }

    try {
      const res = await performVectorSearch(query, chunks.length > 0 ? chunks : [documentsText], 5);
      setMatches(res.matches);
      setModelName(res.model);
      if (res.dimension) setDimension(res.dimension);
      if (res.queryVector) setQueryVectorSample(res.queryVector);
      setHasSearched(true);
    } catch (e) {
      console.error('Vector search error:', e);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-950 border border-indigo-100 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
      {/* Background Decorators */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-zinc-800/80 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-zinc-100 tracking-tight uppercase">
                  Nemotron-3 1B Vector Grounding Engine
                </h3>
                <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Free Embedding
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Zero-token semantic vector retrieval using <code className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">nvidia/nemotron-3-embed-1b:free</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-900/80 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-300">
            <Cpu className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-mono text-[11px]">{dimension} Dims</span>
          </div>
        </div>

        {/* Query Input */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-indigo-500" />
            Semantic Grounding Query
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. Zero-knowledge proof security audit"
              className="flex-1 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleRunVectorSearch}
              disabled={isSearching || !query.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-5 py-3 rounded-2xl flex items-center gap-2 text-xs uppercase tracking-wider transition-all shadow-md shadow-indigo-600/20"
            >
              {isSearching ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Embedding...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Vector Match
                </>
              )}
            </button>
          </div>
        </div>

        {/* Document Chunks Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              Document Chunks Corpus (Separate chunks with ---)
            </label>
            <span className="text-[10px] text-slate-400 font-mono">
              {documentsText.split('\n---').filter(Boolean).length} Chunks
            </span>
          </div>
          <textarea
            value={documentsText}
            onChange={e => setDocumentsText(e.target.value)}
            rows={4}
            className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 text-xs font-mono text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
            placeholder="Paste raw text chunks here separated by ---"
          />
        </div>

        {/* Results Visualizer */}
        <AnimatePresence>
          {hasSearched && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 pt-4 border-t border-slate-100 dark:border-zinc-800"
            >
              {/* Query Embedding Vector Heatmap */}
              {queryVectorSample.length > 0 && (
                <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-indigo-300">
                    <span>Query Embedding Sample (First 32 / {dimension} Dimensions)</span>
                    <span>Model: {modelName}</span>
                  </div>
                  <div className="grid grid-cols-16 sm:grid-cols-32 gap-1 h-6">
                    {queryVectorSample.map((val, idx) => {
                      const normalizedPct = Math.min(100, Math.max(10, Math.abs(val) * 300));
                      return (
                        <div
                          key={idx}
                          title={`Dim ${idx}: ${val.toFixed(4)}`}
                          style={{
                            backgroundColor: val >= 0 ? `rgba(99, 102, 241, ${Math.max(0.2, Math.abs(val) * 2.5)})` : `rgba(244, 63, 94, ${Math.max(0.2, Math.abs(val) * 2.5)})`
                          }}
                          className="h-full rounded-sm transition-all hover:scale-125"
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Match Cards */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                  Top Cosine Similarity Ranked Chunks
                </h4>

                {matches.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No matching document chunks found.</p>
                ) : (
                  matches.map((match, idx) => {
                    const pct = Math.round(match.score * 100);
                    const isHigh = pct >= 65;
                    const isMed = pct >= 40 && pct < 65;

                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`p-4 rounded-2xl border transition-all ${
                          isHigh
                            ? 'bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/60'
                            : isMed
                            ? 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40'
                            : 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                            Rank #{idx + 1} Chunk
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-black px-2 py-0.5 rounded-lg font-mono ${
                              isHigh
                                ? 'bg-indigo-600 text-white'
                                : isMed
                                ? 'bg-amber-500 text-white'
                                : 'bg-slate-400 text-white'
                            }`}>
                              {pct}% Similarity
                            </span>
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-800 dark:text-zinc-200 leading-relaxed font-sans">
                          "{match.text}"
                        </p>

                        {onInjectContext && isHigh && (
                          <button
                            onClick={() => onInjectContext(match.text)}
                            className="mt-3 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Inject as Grounding Context for Multi-Agent Consensus
                          </button>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
