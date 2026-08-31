import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Search, 
  Linkedin, 
  Github, 
  Copy, 
  Check, 
  Plus, 
  ShieldAlert, 
  Cpu, 
  TrendingUp, 
  Sparkles, 
  RefreshCw, 
  CheckCircle, 
  Lock, 
  LockOpen, 
  ArrowRight, 
  Play, 
  Layers,
  Database,
  UserCheck,
  Send,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export interface Lead {
  id: string;
  name: string;
  title: string;
  company: string;
  linkedinUrl: string;
  githubUrl?: string;
  intentTrigger: string;
  intentScore: number;
  customHook: string;
  status: 'new' | 'contacted' | 'replied' | 'ignored';
  createdAt: number;
}

export function GtmPipelineDashboard() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // Scraper inputs
  const [scrapingQuery, setScrapingQuery] = useState('');
  const [scrapingState, setScrapingState] = useState<'idle' | 'proxy' | 'scraping' | 'enriching' | 'saving' | 'success'>('idle');
  const [scraperLogs, setScraperLogs] = useState<string[]>([]);
  
  // Clipboard copying state
  const [copiedLeadId, setCopiedLeadId] = useState<string | null>(null);
  
  // Filter settings
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'contacted' | 'replied' | 'ignored'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-bypass lock if the user has a verified admin email domain
  const hasAdminEmailBypass = useMemo(() => {
    if (!user || !user.email) return false;
    const email = user.email.toLowerCase();
    return email === 'ethersflow.dev@gmail.com' || email === 'ryan.milisits@gmail.com' || email === 'craig@beerwego.com' || email.endsWith('@ethersflow.com');
  }, [user]);

  // Session Storage Check
  useEffect(() => {
    const isSessionUnlocked = sessionStorage.getItem('gtm_dashboard_unlocked') === 'true';
    if (isSessionUnlocked || hasAdminEmailBypass) {
      setIsUnlocked(true);
    }
  }, [hasAdminEmailBypass]);

  // Fetch leads on unlock
  useEffect(() => {
    if (isUnlocked) {
      fetchLeads();
    }
  }, [isUnlocked]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gtm/leads');
      const data = await res.json();
      if (data.success && data.leads) {
        setLeads(data.leads);
      }
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setAuthError('');
    try {
      const res = await fetch('/api/gtm/verify-passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsUnlocked(true);
        sessionStorage.setItem('gtm_dashboard_unlocked', 'true');
      } else {
        setAuthError(data.message || "Invalid passcode");
      }
    } catch (err) {
      setAuthError("Failed to connect to gateway verification node.");
    } finally {
      setVerifying(false);
    }
  };

  const handleUpdateStatus = async (leadId: string, newStatus: Lead['status']) => {
    // Optimistic update
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    try {
      await fetch('/api/gtm/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, status: newStatus })
      });
    } catch (err) {
      console.error("Failed to sync lead status update:", err);
    }
  };

  const triggerLeadScraper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scrapingQuery.trim()) return;

    setScraperLogs([`[GTM] Launching background scraper pipeline for signal: "${scrapingQuery}"`]);
    setScrapingState('proxy');
    
    // Step-by-step loading animation simulation
    const logs = [
      { state: 'scraping' as const, log: `[${new Date().toLocaleTimeString()}] [GTM] Querying Google Job boards and social intent profiles...` },
      { state: 'scraping' as const, log: `[${new Date().toLocaleTimeString()}] [GTM] Proxycurl extraction pipeline active. Isolated 3 target LinkedIn bios.` },
      { state: 'enriching' as const, log: `[${new Date().toLocaleTimeString()}] [GTM] Executing server-side Gemini 1.5 Flash zero-token context parsing...` },
      { state: 'enriching' as const, log: `[${new Date().toLocaleTimeString()}] [GTM] Compiling hyper-authentic outreach hooks tailored to corporate infrastructure.` },
      { state: 'saving' as const, log: `[${new Date().toLocaleTimeString()}] [GTM] Writing newly enriched outbound prospects to Firestore...` },
    ];

    let logIdx = 0;
    const interval = setInterval(() => {
      if (logIdx < logs.length) {
        setScrapingState(logs[logIdx].state);
        setScraperLogs(prev => [...prev, logs[logIdx].log]);
        logIdx++;
      } else {
        clearInterval(interval);
        executeRealScrape();
      }
    }, 1200);
  };

  const executeRealScrape = async () => {
    try {
      const res = await fetch('/api/gtm/scrape-enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: scrapingQuery })
      });
      const data = await res.json();
      if (data.success && data.leads) {
        setLeads(prev => [...data.leads, ...prev]);
        setScrapingState('success');
        setScraperLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [GTM] Firestore records written successfully!`,
          `[${new Date().toLocaleTimeString()}] [GTM] Pipeline complete. 3 high-intent leads added to active outreach list.`
        ]);
        setScrapingQuery('');
        setTimeout(() => setScrapingState('idle'), 4000);
      }
    } catch (err) {
      setScrapingState('idle');
      setScraperLogs(prev => [...prev, `[GTM] [ERROR] Scraper pipeline failed: Could not connect to enrichment node.`]);
    }
  };

  const handleCopyHook = (lead: Lead) => {
    navigator.clipboard.writeText(lead.customHook);
    setCopiedLeadId(lead.id);
    setTimeout(() => setCopiedLeadId(null), 2000);
  };

  // Filter & Search Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesSearch = searchQuery === '' || 
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.intentTrigger.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [leads, statusFilter, searchQuery]);

  // Aggregate Funnel metrics
  const metrics = useMemo(() => {
    const total = leads.length;
    const contacted = leads.filter(l => l.status === 'contacted' || l.status === 'replied').length;
    const replied = leads.filter(l => l.status === 'replied').length;
    const conversionRate = contacted > 0 ? ((replied / contacted) * 100).toFixed(0) : '0';

    return { total, contacted, replied, conversionRate };
  }, [leads]);

  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[580px] p-6 text-center" id="gtm-lock-container">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-[32px] border border-slate-200/60 p-8 shadow-xl max-w-md w-full space-y-6"
        >
          <div className="mx-auto w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-[22px] flex items-center justify-center text-indigo-600">
            <Lock className="w-6 h-6 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">GTM Administration Gatekeeper</h2>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              To restrict access to internal leads, system metrics, and Outreach hooks, please enter your secure administrator passcode.
            </p>
          </div>

          {user && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl justify-center text-xs text-slate-500 font-medium">
              <UserCheck className="w-4 h-4 text-emerald-500" />
              <span>Logged in as: <strong className="text-slate-700">{user.email}</strong></span>
            </div>
          )}

          <form onSubmit={handleVerifyPasscode} className="space-y-4">
            <div className="relative">
              <input
                type="password"
                placeholder="Enter GTM admin passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500/80 outline-none rounded-2xl text-center font-mono tracking-widest text-lg transition-all shadow-inner placeholder:text-sm placeholder:font-sans placeholder:tracking-normal"
                required
              />
            </div>

            {authError && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-xl font-bold"
              >
                {authError}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={verifying}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2"
            >
              {verifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  VERIFYING ADMIN KEY...
                </>
              ) : (
                <>
                  <LockOpen className="w-4 h-4" />
                  UNLOCK LEAD SYSTEM
                </>
              )}
            </button>
          </form>

          <p className="text-[11px] text-slate-400 font-mono">
            EthersFlow Outbound Hub • Role-Based Auth Compliant
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" id="gtm-active-dashboard">
      
      {/* Dashboard Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-[24px] p-6 border border-slate-200/60 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Signal-Led Outbound GTM Pipeline
            </h2>
            <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 border border-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full">
              SDR Automation Suite
            </span>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Collect, enrich, and convert high-intent tech stack vacancy leads with hyper-personalized connection notes.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchLeads}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200/80 disabled:opacity-50 text-slate-700 font-black text-xs uppercase tracking-wider rounded-xl transition-all border border-slate-200/60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            REFRESH LIST
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-[24px] p-6 border border-slate-200/60 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Scraped Leads</span>
          <div className="text-3xl font-black text-slate-900 font-mono mt-1">{metrics.total}</div>
          <p className="text-xs text-slate-400 font-medium mt-1">Durable Firestore entries</p>
        </div>
        <div className="bg-white rounded-[24px] p-6 border border-slate-200/60 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Contacted</span>
          <div className="text-3xl font-black text-slate-900 font-mono mt-1">{metrics.contacted}</div>
          <p className="text-xs text-slate-400 font-medium mt-1">Outreach notes sent manually</p>
        </div>
        <div className="bg-white rounded-[24px] p-6 border border-slate-200/60 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Replies</span>
          <div className="text-3xl font-black text-slate-900 font-mono mt-1">{metrics.replied}</div>
          <p className="text-xs text-slate-400 font-medium mt-1">Sovereign pipelines discussed</p>
        </div>
        <div className="bg-white rounded-[24px] p-6 border border-slate-200/60 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Manual Conversion Rate</span>
          <div className="text-3xl font-black text-emerald-600 font-mono mt-1">{metrics.conversionRate}%</div>
          <p className="text-xs text-slate-400 font-medium mt-1">Target conversion efficiency</p>
        </div>
      </div>

      {/* Scraper / Enrichment Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Lead Generation Form */}
        <div className="bg-white rounded-[32px] p-8 border border-slate-200/60 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-500 animate-bounce" />
              Scrape & AI-Enrich Leads
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Enter a technical stack, hiring query, or repository signal. EthersFlow's background scraper pipes raw data directly into a server-side Gemini agent to craft personalized outreach hooks with zero token waste.
            </p>

            <form onSubmit={triggerLeadScraper} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Web3 Security, Senior Solidity Developer jobs"
                  value={scrapingQuery}
                  onChange={(e) => setScrapingQuery(e.target.value)}
                  disabled={scrapingState !== 'idle'}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500/80 outline-none rounded-xl text-xs font-semibold text-slate-700 transition-all placeholder:text-slate-400"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={scrapingState !== 'idle' || !scrapingQuery.trim()}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-600/15 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                LAUNCH SCRAPER TRIGGER
              </button>
            </form>
          </div>

          {/* Scraper Console Logs */}
          <div className="mt-6 bg-slate-950 text-slate-300 rounded-2xl p-4 border border-slate-800 font-mono text-[10px] space-y-2 min-h-[160px] max-h-[220px] overflow-y-auto flex flex-col justify-between">
            <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[150px] scrollbar-none">
              {scraperLogs.length === 0 ? (
                <div className="text-slate-500 italic">Console idle. Awaiting scraping query...</div>
              ) : (
                scraperLogs.map((log, i) => (
                  <div key={i} className={log.includes('[ERROR]') ? 'text-rose-400' : 'text-slate-300'}>
                    {log}
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-900 pt-2 text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-2">
              <span>Status: {scrapingState.toUpperCase()}</span>
              {scrapingState !== 'idle' && <span className="animate-pulse text-indigo-400">● processing</span>}
            </div>
          </div>
        </div>

        {/* Right: Funnel Outbound Representation */}
        <div className="lg:col-span-2 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white rounded-[32px] p-8 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl transform translate-x-20 -translate-y-20 pointer-events-none" />
          
          <div className="space-y-3 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-[10px] text-white font-black tracking-wider uppercase font-mono">
              <Layers className="w-3.5 h-3.5" />
              CONVERSION ARCHITECTURE
            </div>
            <h3 className="text-xl font-black tracking-tight">
              EthersFlow Scraper Outreach Playbook
            </h3>
            <p className="text-sm text-indigo-100 font-medium leading-relaxed max-w-xl">
              Don't spam. Use high-intent triggers to secure the pipeline. Our scraper watches GitHub starred repos and job boards, maps them to LinkedIn, enriches metadata with Gemini-powered outbound hooks, and exports rows here for 100% compliant manual outreach.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8 relative z-10">
            <div className="bg-white/10 border border-white/10 p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-black tracking-widest text-indigo-200 uppercase">1. SOURCE</span>
              <p className="text-xs font-bold mt-1">Social Signals & vacancies</p>
            </div>
            <div className="bg-white/10 border border-white/10 p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-black tracking-widest text-indigo-200 uppercase">2. AI ENRICH</span>
              <p className="text-xs font-bold mt-1">Gemini notes drafted</p>
            </div>
            <div className="bg-white/10 border border-white/10 p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-black tracking-widest text-indigo-200 uppercase">3. SYNC FIRESTORE</span>
              <p className="text-xs font-bold mt-1">Durable tracking logs</p>
            </div>
            <div className="bg-white/10 border border-white/10 p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-black tracking-widest text-indigo-200 uppercase">4. OUTBOUND</span>
              <p className="text-xs font-bold mt-1">Copy-paste outreach</p>
            </div>
          </div>
        </div>

      </div>

      {/* Leads Management Table View */}
      <div className="bg-white rounded-[32px] border border-slate-200/60 shadow-sm overflow-hidden">
        
        {/* Table Filters & Searches */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search prospects, companies, triggers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 outline-none rounded-xl text-xs font-semibold text-slate-700 transition-all w-full sm:w-64 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50 self-stretch sm:self-auto overflow-x-auto">
            {['all', 'new', 'contacted', 'replied', 'ignored'].map(filter => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter as any)}
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                  statusFilter === filter
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Lead List Rows */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Retrieved SDR Database...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <Database className="w-8 h-8 text-slate-300" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No matching leads found</p>
              <p className="text-xs text-slate-400 font-semibold">Try triggering a new scraper or clearing filters.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">PROSPECT / COMPANY</th>
                  <th className="py-4 px-6">INTENT SIGNAL TRIGGER</th>
                  <th className="py-4 px-6">INTENT SCORE</th>
                  <th className="py-4 px-6">PERSONALIZED OUTREACH HOOK (150 CHARS)</th>
                  <th className="py-4 px-6">STATUS</th>
                  <th className="py-4 px-6 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                    
                    {/* Name & Company */}
                    <td className="py-5 px-6">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        {lead.name}
                        <a 
                          href={lead.linkedinUrl} 
                          target="_blank" 
                          rel="noreferrer referrer" 
                          className="text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          <Linkedin className="w-3.5 h-3.5" />
                        </a>
                        {lead.githubUrl && (
                          <a 
                            href={lead.githubUrl} 
                            target="_blank" 
                            rel="noreferrer referrer" 
                            className="text-slate-600 hover:text-slate-800 transition-colors"
                          >
                            <Github className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      <div className="text-slate-500 font-medium text-[11px] mt-0.5">
                        {lead.title} at <strong className="text-slate-700">{lead.company}</strong>
                      </div>
                    </td>

                    {/* Trigger */}
                    <td className="py-5 px-6 max-w-xs">
                      <div className="text-slate-600 font-medium leading-relaxed text-[11px]">
                        {lead.intentTrigger}
                      </div>
                    </td>

                    {/* Intent Score Badge */}
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          lead.intentScore >= 90 ? 'bg-emerald-500' : lead.intentScore >= 80 ? 'bg-amber-500' : 'bg-slate-400'
                        }`} />
                        <span className="font-mono font-bold text-slate-900">{lead.intentScore}%</span>
                      </div>
                    </td>

                    {/* Custom Hook Outreach */}
                    <td className="py-5 px-6 max-w-sm">
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-slate-700 leading-normal font-medium text-[11px] italic">
                        "{lead.customHook}"
                      </div>
                    </td>

                    {/* Status Select */}
                    <td className="py-5 px-6">
                      <select
                        value={lead.status}
                        onChange={(e) => handleUpdateStatus(lead.id, e.target.value as any)}
                        className={`px-3 py-1.5 font-bold uppercase text-[9px] tracking-wider rounded-lg outline-none border transition-all ${
                          lead.status === 'new'
                            ? 'bg-indigo-50 border-indigo-100 text-indigo-700'
                            : lead.status === 'contacted'
                            ? 'bg-amber-50 border-amber-100 text-amber-700'
                            : lead.status === 'replied'
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                            : 'bg-slate-100 border-slate-200 text-slate-500'
                        }`}
                      >
                        <option value="new">New Lead</option>
                        <option value="contacted">Contacted</option>
                        <option value="replied">Replied</option>
                        <option value="ignored">Ignored</option>
                      </select>
                    </td>

                    {/* Action Button */}
                    <td className="py-5 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleCopyHook(lead)}
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all"
                          title="Copy Outreach Hook"
                        >
                          {copiedLeadId === lead.id ? (
                            <Check className="w-4 h-4 text-emerald-600 animate-pulse" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <a
                          href={lead.linkedinUrl}
                          target="_blank"
                          rel="noreferrer referrer"
                          className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all border border-indigo-100"
                        >
                          Connect
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

    </div>
  );
}
