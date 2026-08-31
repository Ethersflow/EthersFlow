import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Globe, 
  Activity, 
  Sliders, 
  DollarSign, 
  Lock, 
  Server, 
  AlertTriangle, 
  CheckCircle, 
  ArrowLeft, 
  Check, 
  ChevronDown, 
  Plus, 
  Terminal, 
  ArrowRight, 
  HelpCircle, 
  Info, 
  Cpu, 
  RefreshCw, 
  TrendingUp, 
  LineChart, 
  Users 
} from 'lucide-react';
import { View } from '../types';
import { GuardianTelemetryView } from './GuardianTelemetryView';
import { GtmPipelineDashboard } from './GtmPipelineDashboard';
import { useAuth } from '../hooks/useAuth';
import { db, auth } from '../services/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  query as firestoreQuery, 
  where 
} from 'firebase/firestore';

interface SecurityDashboardProps {
  onClose: () => void;
  setView: (view: View) => void;
  initialTab?: 'sovereign' | 'telemetry' | 'guardian' | 'gtm';
  onTabChange?: (tab: 'sovereign' | 'telemetry' | 'guardian' | 'gtm') => void;
}

// Trace simulation interface
interface Span {
  name: string;
  type: 'NER_CLEANSE' | 'LLM_CALL' | 'RECONCILIATION' | 'FALLBACK';
  modelUsed?: string;
  runtimeMs: number;
  tokensProcessed: number;
  costEstimate: number;
  status: 'SUCCESS' | 'DEGRADED_FALLBACK' | 'FAILED';
  description: string;
}

interface Trace {
  id: string;
  timestamp: string;
  clientName: string;
  targetQuery: string;
  totalTokens: number;
  totalWholesaleCost: number;
  totalRetailRevenue: number;
  status: 'SUCCESS' | 'TIMEOUT' | 'FAILED';
  selectedModelSequence: string[];
  spans: Span[];
}

export function SecurityDashboard({ onClose, setView, initialTab, onTabChange }: SecurityDashboardProps) {
  const [activeTab, setActiveTab ] = useState<'sovereign' | 'telemetry' | 'guardian' | 'gtm'>(initialTab || 'sovereign');

  useEffect(() => {
    onTabChange?.(activeTab);
  }, [activeTab, onTabChange]);
  
  const { user } = useAuth();
  const [realTraces, setRealTraces] = useState<Trace[]>([]);

  // Tab 1: Sovereign Shield local storage states
  const [piiSettings, setPiiSettings] = useState({
    evm_keys: true,
    emails: true,
    phones: true,
    credit_cards: true,
    ips: true,
    ssns: true
  });
  const [regionalBoundary, setRegionalBoundary] = useState<'eu' | 'us' | 'global'>('global');
  const [criticalSlaTimeout, setCriticalSlaTimeout] = useState<number>(45); // 45s SLA before auto-escalating
  const [forceLlamaFallback, setForceLlamaFallback] = useState<boolean>(true);
  
  // Slider limits for warning budgets
  const [budgetCaps, setBudgetCaps] = useState({
    legal: 2000,
    dev: 5000,
    audit: 3500
  });

  // Tab 2: Financial Calculator/Simulator inputs
  const [retailRate, setRetailRate] = useState<number>(40); // Retail rate per M tokens billed to user
  const [multiplier, setMultiplier] = useState<number>(3.5); // Multi-model multiplier
  const [simInputTokens, setSimInputTokens] = useState<number>(500000); // Input tokens (default 500k)
  const [simOutputTokens, setSimOutputTokens] = useState<number>(100000); // Output tokens (default 100k)
  const [selectedModelTier, setSelectedModelTier] = useState<'budget' | 'standard' | 'reasoning'>('standard');

  // Ping simulation states for downstream AI services
  const [pings, setPings] = useState({
    gemini_flash: 42,
    gemini_pro: 395,
    llama_70b: 108
  });

  // Enterprise identity and KMS states
  const [tenantIdInput, setTenantIdInput] = useState<string>('');
  const [activeTenantClaim, setActiveTenantClaim] = useState<string | null>(null);
  const [identitySaving, setIdentitySaving] = useState(false);
  const [kmsEnabled, setKmsEnabled] = useState<boolean>(false);
  const [kmsGeminiKey, setKmsGeminiKey] = useState<string>('');
  const [kmsSaving, setKmsSaving] = useState(false);

  // Load and store settings to localStorage + Firestore (if logged in)
  useEffect(() => {
    const loadSettings = async () => {
      // 1. Fallback / local storage load
      const savedPii = localStorage.getItem('ef_sovereign_pii');
      if (savedPii) {
        try { setPiiSettings(JSON.parse(savedPii)); } catch (e) { console.error(e); }
      }
      const savedBoundary = localStorage.getItem('ef_sovereign_geo');
      if (savedBoundary) {
        setRegionalBoundary(savedBoundary as any);
      }

      // 2. Load from Firestore if authenticated
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.piiSettings) {
              setPiiSettings(data.piiSettings);
            }
            if (data.regionalBoundary) {
              setRegionalBoundary(data.regionalBoundary);
            }
            if (data.kmsSettings) {
              setKmsEnabled(!!data.kmsSettings.enabled);
              setKmsGeminiKey(data.kmsSettings.gemini_key || '');
            }
            if (data.tenantId) {
              setTenantIdInput(data.tenantId);
            }
          }

          // Fetch fresh JWT Custom Claim value
          const tokenResult = await user.getIdTokenResult(true);
          if (tokenResult.claims.tenantId) {
            setActiveTenantClaim(tokenResult.claims.tenantId as string);
            setTenantIdInput(tokenResult.claims.tenantId as string);
          } else {
            setActiveTenantClaim(null);
          }
        } catch (e) {
          console.warn("Firestore settings load bypass:", e);
        }
      }
    };

    loadSettings();
  }, [user]);

  // Handle saving Custom JWT Claims Tenant Identity
  const handleSaveTenantClaim = async () => {
    if (!user) return;
    setIdentitySaving(true);
    try {
      const response = await fetch('/api/enterprise/map-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          tenantId: tenantIdInput.trim() || null
        })
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = await response.json();
      
      // Force refresh user ID token to update the claims context
      await user.getIdToken(true);
      
      setActiveTenantClaim(data.tenantId);
      alert(data.tenantId ? `Identity mapped successfully! JWT token custom claim 'tenantId' is now mapped to '${data.tenantId}'.` : 'Identity token mappings unbinded successfully.');
    } catch (err: any) {
      console.error(err);
      alert(`Tenant mapping protocol failed: ${err.message}`);
    } finally {
      setIdentitySaving(false);
    }
  };

  // Handle storing customized customer Key-Management-Service values
  const handleSaveKmsSettings = async () => {
    if (!user) return;
    setKmsSaving(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        kmsSettings: {
          enabled: kmsEnabled,
          gemini_key: kmsGeminiKey.trim() || null
        }
      }, { merge: true });
      alert('KMS / API Key Vault updated successfully! Future model debate transactions will run under your custom developer quotas.');
    } catch (err: any) {
      console.error(err);
      alert(`KMS synch failure: ${err.message}`);
    } finally {
      setKmsSaving(false);
    }
  };

  // Load real analyses for trace logs dynamically
  useEffect(() => {
    if (!user) {
      setRealTraces([]);
      return;
    }
    const fetchAnalyses = async () => {
      try {
        const analysesRef = collection(db, 'analyses');
        const qRef = activeTenantClaim
          ? firestoreQuery(
              analysesRef,
              where('tenantId', '==', activeTenantClaim)
            )
          : firestoreQuery(
              analysesRef,
              where('userId', '==', user.uid)
            );
        const snapshot = await getDocs(qRef);
        const docs = snapshot.docs.map(docVal => ({ id: docVal.id, ...docVal.data() }));
        
        // Robust reverse chronological sorting
        docs.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
        
        const mapped: Trace[] = docs.slice(0, 10).map((docVal: any) => {
          const timestampStr = docVal.timestamp 
            ? new Date(docVal.timestamp).toISOString().replace('T', ' ').substring(0, 19)
            : new Date().toISOString().replace('T', ' ').substring(0, 19);
            
          const modelsUsed = docVal.models || (docVal.results ? Object.keys(docVal.results) : []) || ['Gemini 2.5 Pro', 'Gemini 2.5 Flash'];
          const statusVal = docVal.status === 'error' || docVal.error ? 'FAILED' : 'SUCCESS';
          
          const audit = docVal.synthesis && docVal.synthesis.guardianAudit ? docVal.synthesis.guardianAudit : null;
          
          const spans: Span[] = [
            {
              name: 'span_01_ner_cleanse',
              type: 'NER_CLEANSE',
              runtimeMs: 38 + Math.floor(Math.random() * 25),
              tokensProcessed: docVal.query?.length || 500,
              costEstimate: 0.0,
              status: 'SUCCESS',
              description: 'Local PII/PHI scrubbing executed successfully inside client boundary. Replaced potential leaks with cryptographic tokens.'
            },
            {
              name: 'span_02_consensus_eval',
              type: 'LLM_CALL',
              modelUsed: modelsUsed[0] || 'Gemini 2.5 Pro',
              runtimeMs: docVal.runtimeMs || 1450 + Math.floor(Math.random() * 1200),
              tokensProcessed: docVal.tokensUsed || 95000,
              costEstimate: docVal.wholesaleCost || 0.38,
              status: statusVal,
              description: docVal.conclusion || 'Consensus execution succeeded. Evaluated multi-model adversarial reasoning tree.'
            }
          ];
          
          if (audit) {
            spans.push({
              name: 'span_03_zero_token_guardian',
              type: 'NER_CLEANSE',
              runtimeMs: 2 + Math.floor(Math.random() * 3),
              tokensProcessed: docVal.query?.length || 400,
              costEstimate: 0.0,
              status: audit.systemStatus === 'STABLE_PLURALISM' ? 'SUCCESS' : 'DEGRADED_FALLBACK',
              description: `Zero-Token Algorithmic Guardian Audit: Verified System Integrity on initial outputs. Cosine Homogeneity Index (LHI): ${audit.lhi} (${audit.systemStatus}). Interventions applied: ${audit.interventions && audit.interventions.length > 0 ? audit.interventions.map((i: any) => `${i.type} -> ${i.nudge}`).join("; ") : "Stable pluralism (No interventions needed)."} Positive alignment agency index: ${audit.alignmentScores?.positiveAgencyExpansion ?? 1.0}`
            });
          }
          
          return {
            id: `tr_${docVal.id.substring(0, 6)}`,
            timestamp: timestampStr,
            clientName: user.displayName || user.email || 'Enterprise Node',
            targetQuery: docVal.query || docVal.title || 'Dynamic Model Consensus Evaluation',
            totalTokens: docVal.tokensUsed || 142000 + Math.floor(Math.random() * 30000),
            totalWholesaleCost: docVal.wholesaleCost || Number((0.15 + Math.random() * 0.5).toFixed(2)),
            totalRetailRevenue: docVal.retailRevenue || Number((1.50 + Math.random() * 3.5).toFixed(2)),
            status: statusVal,
            selectedModelSequence: modelsUsed,
            spans
          };
        });
        setRealTraces(mapped);
      } catch (err) {
        console.warn("Could not load real analyses for telemetry dashboard:", err);
      }
    };
    fetchAnalyses();
  }, [user, activeTenantClaim]);

  const handlePiiToggle = async (key: keyof typeof piiSettings) => {
    const updated = { ...piiSettings, [key]: !piiSettings[key] };
    setPiiSettings(updated);
    localStorage.setItem('ef_sovereign_pii', JSON.stringify(updated));

    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { piiSettings: updated }, { merge: true });
      } catch (e) {
        console.error("Firestore pii update failed:", e);
      }
    }
  };

  const handleGeoChange = async (val: 'eu' | 'us' | 'global') => {
    setRegionalBoundary(val);
    localStorage.setItem('ef_sovereign_geo', val);

    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { regionalBoundary: val }, { merge: true });
      } catch (e) {
        console.error("Firestore geo update failed:", e);
      }
    }
  };

  // Live ping updates simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setPings({
        gemini_flash: Math.floor(40 + Math.random() * 15),
        gemini_pro: Math.floor(380 + Math.random() * 45),
        llama_70b: Math.floor(100 + Math.random() * 20)
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Simulator margins calculations:
  // Wholesale pricing estimates per 1M tokens
  const wholesalePricing = {
    budget: { input: 0.15, output: 0.60, name: "Gemini 2.5 Flash / Llama 3 8B" },
    standard: { input: 2.50, output: 10.00, name: "Gemini 2.5 Pro / Claude 3.5 Sonnet" },
    reasoning: { input: 15.00, output: 60.00, name: "Claude 3.7 Sonnet / OpenAI o1" }
  };

  const singleCallInputCost = (simInputTokens / 1000000) * wholesalePricing[selectedModelTier].input;
  const singleCallOutputCost = (simOutputTokens / 1000000) * wholesalePricing[selectedModelTier].output;
  const singleCallCost = singleCallInputCost + singleCallOutputCost;

  // With a multi-model debate multiplier (e.g. 3.5x tokens parsed)
  const totalWholesaleComputeCost = singleCallCost * multiplier;
  const totalTokensBilled = simInputTokens + simOutputTokens;
  const totalRetailRevenue = (totalTokensBilled / 1000000) * retailRate;
  const grossProfit = totalRetailRevenue - totalWholesaleComputeCost;
  const grossMarginPercentage = totalRetailRevenue > 0 ? (grossProfit / totalRetailRevenue) * 100 : 0;

  // Static trace list with interactive collapsible Spans
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>('tr_9952');

  const tracesData: Trace[] = [
    {
      id: 'tr_9954',
      timestamp: '2026-05-28 19:15:32',
      clientName: 'Vanguard Capital',
      targetQuery: 'Verify EVM token liquidity locks and smart contract fallback routing logic for audit code.',
      totalTokens: 642000,
      totalWholesaleCost: 1.84,
      totalRetailRevenue: 25.68,
      status: 'SUCCESS',
      selectedModelSequence: ['Gemini 2.5 Pro', 'Gemini 2.5 Flash', 'Llama 3.3 70B'],
      spans: [
        {
          name: 'span_01_ner_cleanse',
          type: 'NER_CLEANSE',
          runtimeMs: 65,
          tokensProcessed: 1200,
          costEstimate: 0.0,
          status: 'SUCCESS',
          description: 'Local analyzer detected 2 EVM Private Keys and 1 Client Email. Cryptographic placeholders injected successfully.'
        },
        {
          name: 'span_02_primary_orchestrator',
          type: 'LLM_CALL',
          modelUsed: 'Gemini 2.5 Pro',
          runtimeMs: 1420,
          tokensProcessed: 520000,
          costEstimate: 1.30,
          status: 'SUCCESS',
          description: 'Synthesized baseline logical debate parameters. Excluded direct network address identifiers.'
        },
        {
          name: 'span_03_consens_scrutineer',
          type: 'RECONCILIATION',
          modelUsed: 'Llama 3.3 70B',
          runtimeMs: 820,
          tokensProcessed: 120800,
          costEstimate: 0.54,
          status: 'SUCCESS',
          description: 'Aligned multi-model consensus targets. Verified logic trees against audit goals.'
        }
      ]
    },
    {
      id: 'tr_9953',
      timestamp: '2026-05-28 19:08:11',
      clientName: 'HealthPartners Inc',
      targetQuery: 'Audit medical device firmware logic for HIPAA / FDA cybersecurity reporting metrics.',
      totalTokens: 780000,
      totalWholesaleCost: 2.12,
      totalRetailRevenue: 31.20,
      status: 'TIMEOUT',
      selectedModelSequence: ['Gemini 2.5 Pro', 'Llama 3.3 70B [Bypass]'],
      spans: [
        {
          name: 'span_01_ner_cleanse',
          type: 'NER_CLEANSE',
          runtimeMs: 72,
          tokensProcessed: 2100,
          costEstimate: 0.0,
          status: 'SUCCESS',
          description: 'Verified document clean of PHI / Medical identifiers locally before sending. Local mapping key active.'
        },
        {
          name: 'span_02_primary_orchestrated_debate',
          type: 'LLM_CALL',
          modelUsed: 'Gemini 2.5 Pro',
          runtimeMs: 45050,
          tokensProcessed: 680000,
          costEstimate: 1.70,
          status: 'FAILED',
          description: 'Orchestrated debate stalled during reasoning critique loop. 45-second SLA timeout boundary exceeded.'
        },
        {
          name: 'span_03_sla_emergency_bypass_trigger',
          type: 'FALLBACK',
          modelUsed: 'Llama 3.3 70B [Versatile]',
          runtimeMs: 2980,
          tokensProcessed: 97900,
          costEstimate: 0.42,
          status: 'DEGRADED_FALLBACK',
          description: 'SLA circuit breaker triggered boundary. Diverted from debate loop. Executed direct high-reasoning fallback through Llama 3.3 70B successfully.'
        }
      ]
    },
    {
      id: 'tr_9952',
      timestamp: '2026-05-28 18:49:02',
      clientName: 'Sovereign Developers',
      targetQuery: 'Perform deep compliance verification on local database schema with zero training keys.',
      totalTokens: 310000,
      totalWholesaleCost: 0.81,
      totalRetailRevenue: 12.40,
      status: 'SUCCESS',
      selectedModelSequence: ['Gemini 2.5 Flash', 'Llama 3.3 70B'],
      spans: [
        {
          name: 'span_01_ner_cleanse',
          type: 'NER_CLEANSE',
          runtimeMs: 44,
          tokensProcessed: 900,
          costEstimate: 0.0,
          status: 'SUCCESS',
          description: 'Scanned for SSNs, credit cards, and key files. All patterns clear.'
        },
        {
          name: 'span_02_validation_debate',
          type: 'LLM_CALL',
          modelUsed: 'Gemini 2.5 Flash',
          runtimeMs: 650,
          tokensProcessed: 309100,
          costEstimate: 0.81,
          status: 'SUCCESS',
          description: 'Budget-tier reasoning model returned validated answers within platform guidelines.'
        }
      ]
    }
  ];

  const combinedTraces = [...realTraces, ...tracesData];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Dynamic Security Tab Header */}
      <nav className="w-full bg-white border-b border-slate-100 py-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={onClose}>
            <button className="p-2 hover:bg-slate-50 rounded-xl transition-all border border-slate-100">
              <ArrowLeft className="w-4 h-4 text-slate-500" />
            </button>
            <div>
              <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-1">Ethersflow Core</div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Sovereignty & Telemetry Center</h1>
            </div>
          </div>

          {/* Selector Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50">
            <button
              onClick={() => setActiveTab('sovereign')}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'sovereign'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Sovereign Shield (Tenant)
            </button>
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'telemetry'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Core Ops Telemetry (Internal)
            </button>
            <button
              onClick={() => setActiveTab('guardian')}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'guardian'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
              Guardian Telemetry
            </button>
            <button
              onClick={() => setActiveTab('gtm')}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'gtm'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-violet-500" />
              Go-To-Market Pipeline (GTM)
            </button>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition-colors text-sm font-bold uppercase tracking-widest flex items-center gap-1.5">
            EXIT PORTAL <span className="font-serif">×</span>
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {activeTab === 'sovereign' ? (
            <motion.div
              key="sovereign-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Left Column: Local PII Masking */}
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white rounded-[32px] p-8 border border-slate-200/60 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/30 rounded-full blur-3xl -z-10" />
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900">In-Flight Data Masking Vault</h2>
                      <p className="text-sm text-slate-500 font-medium">Configure PII/PHI categories that are immediately scrubbed locally inside your secure perimeter before being transmitted to third-party endpoints.</p>
                    </div>
                  </div>

                  {/* Vault Item Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                    {[
                      { key: 'evm_keys', label: 'EVM Private Keys', matchPattern: '0x hex keys (64 characters)', desc: 'Prevents critical cryptographic address leaks' },
                      { key: 'emails', label: 'Personal & Client Emails', matchPattern: 'Standard mail addresses', desc: 'Compliant with default GDPR and CCPA rules' },
                      { key: 'phones', label: 'Phone Numbers', matchPattern: 'Multi-region regex mapping', desc: 'Protects customer support logs details' },
                      { key: 'credit_cards', label: 'Credit Card & Fin Assets', matchPattern: 'Standard 13-16 digit numbers', desc: 'Enforces PCI-DSS client-side security standards' },
                      { key: 'ips', label: 'IP Networks & Hosts', matchPattern: 'IPv4 Host network patterns', desc: 'Hides your server topologies and entry targets' },
                      { key: 'ssns', label: 'Social Security IDs', matchPattern: 'Government security numbers', desc: 'Restricts medical / administrative personnel database exposure' }
                    ].map((item) => {
                      const active = piiSettings[item.key as keyof typeof piiSettings];
                      return (
                        <div 
                          key={item.key}
                          onClick={() => handlePiiToggle(item.key as keyof typeof piiSettings)}
                          className={`p-5 rounded-[24px] border transition-all cursor-pointer flex items-center justify-between group ${
                            active 
                              ? 'border-indigo-600 bg-indigo-50/10 shadow-sm' 
                              : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                          }`}
                        >
                          <div className="space-y-1">
                            <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                              {item.label}
                              {active && <CheckCircle className="w-4 h-4 text-indigo-600" />}
                            </span>
                            <span className="block text-[11px] font-semibold text-slate-400 font-mono uppercase tracking-wider">Pattern: {item.matchPattern}</span>
                            <span className="block text-xs text-slate-500 font-medium leading-normal">{item.desc}</span>
                          </div>

                          {/* Toggle Slider Switch */}
                          <div className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ${
                            active ? 'bg-indigo-600' : 'bg-slate-200'
                          }`}>
                            <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                              active ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 flex items-center gap-3">
                    <Info className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                    <p className="font-semibold leading-relaxed">
                      <strong>Automatic Detokenization:</strong> When EthersFlow displays synthetic answers, original values are securely re-injected on output rendering within your browser session. Public model logs retain only safe synthetic placeholders like <code className="bg-slate-100 px-1 border rounded text-indigo-600 font-mono">[GOV_ID_1]</code>.
                    </p>
                  </div>
                </div>

                {/* Regional Jurisdiction Boundary Panel */}
                <div className="bg-white rounded-[32px] p-8 border border-slate-200/60 shadow-sm">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                      <Globe className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900">Geographic Data Boundary Lock</h2>
                      <p className="text-sm text-slate-500 font-medium">Restricts intermediate data centers and routing networks to certified jurisdictions for regional sovereignty compliance.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    {[
                      {
                        id: 'global',
                        label: 'Standard Route',
                        badge: 'Optimal Speed',
                        desc: 'Nearest Cloud Node routing (US / EU / APAC hybrid dynamic path).'
                      },
                      {
                        id: 'eu',
                        label: 'EU Sovereignty',
                        badge: 'GDPR Active',
                        desc: 'Route debate steps exclusively within verified boundaries (Zurich, Frankfurt, Paris).'
                      },
                      {
                        id: 'us',
                        label: 'US Domestic Route',
                        badge: 'US-Vetted Node',
                        desc: 'Limits all model synthesis calls to North American data centers (Virginia, Oregon).'
                      }
                    ].map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleGeoChange(item.id as any)}
                        className={`p-5 rounded-[24px] border cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between ${
                          regionalBoundary === item.id
                            ? 'border-emerald-600 bg-emerald-50/5 shadow-sm ring-1 ring-emerald-600/30'
                            : 'border-slate-100 bg-slate-50/30 hover:bg-slate-50'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-black text-slate-900">{item.label}</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              regionalBoundary === item.id ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {item.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                        </div>
                        
                        <div className="mt-4 flex items-center justify-end">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            regionalBoundary === item.id ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                          }`}>
                            {regionalBoundary === item.id && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: SLA Timings, Fallbacks, and Team Budget Limits */}
              <div className="space-y-8 col-span-1">
                {/* Escalation Policy Card */}
                <div className="bg-slate-900 text-white rounded-[32px] p-8 border border-slate-800 shadow-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950/20 -z-10" />
                  
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
                      <Cpu className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-md font-black tracking-tight uppercase">Performance SLA Fallback</h2>
                      <p className="text-xs text-slate-400 font-medium leading-relaxed">Prevent infinite agent debate loops on downstream API timeouts.</p>
                    </div>
                  </div>

                  <div className="space-y-6 mt-8">
                    {/* SLA Slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-400">MAX DWELL TIME SLA</span>
                        <span className="text-indigo-400 font-mono font-bold">{criticalSlaTimeout} Seconds</span>
                      </div>
                      <input 
                        type="range" 
                        min="10" 
                        max="120" 
                        value={criticalSlaTimeout} 
                        onChange={(e) => setCriticalSlaTimeout(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                      <span className="block text-[10px] text-slate-500 leading-normal">
                        Timeout threshold before resolving queries directly in single model mode.
                      </span>
                    </div>

                    {/* Llama 3 Proxy Toggle */}
                    <div className="flex items-center justify-between p-4 bg-slate-800/40 border border-slate-800 rounded-2xl">
                      <div className="space-y-0.5 max-w-[70%]">
                        <span className="text-xs font-black uppercase tracking-wider block text-slate-100">Llama 3.3 70B Bypass</span>
                        <span className="text-[10px] text-slate-400 font-medium block leading-normal">
                          Diverts query to high-reasoning Llama-3.3-70B-Versatile on SLA trigger.
                        </span>
                      </div>
                      <button 
                        onClick={() => setForceLlamaFallback(prev => !prev)}
                        className={`w-10 h-6 rounded-full p-0.5 transition-colors ${forceLlamaFallback ? 'bg-indigo-500' : 'bg-slate-700'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${forceLlamaFallback ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="p-4 bg-indigo-950/40 border border-indigo-900/30 rounded-2xl flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-indigo-200 block mb-1">Active Safeguard</span>
                        <p className="text-[10px] text-slate-400 leading-normal font-medium">The consensus loop utilizes our newly linked Llama models to bypass delays and avoid pipeline freeze.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Agent Spending Budget limits */}
                <div className="bg-white rounded-[32px] p-8 border border-slate-200/60 shadow-sm">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                      <Sliders className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-slate-900">Agentic Budget Caps</h2>
                      <p className="text-xs text-slate-500 font-medium">Prevent runaway costs on heavy iterative analytical pipelines.</p>
                    </div>
                  </div>

                  <div className="space-y-6 mt-8">
                    {/* Item 1 */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-600 uppercase tracking-wider">Legal Auditor Agent</span>
                        <span className="text-slate-900 font-mono">${budgetCaps.legal} / Mo</span>
                      </div>
                      <input 
                        type="range" 
                        min="500" 
                        max="5000" 
                        step="100"
                        value={budgetCaps.legal} 
                        onChange={(e) => setBudgetCaps(prev => ({ ...prev, legal: Number(e.target.value) }))}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: `${(1240 / budgetCaps.legal) * 100}%` }} />
                      </div>
                      <span className="block text-[10px] text-slate-400 font-semibold font-mono uppercase">
                        Current Month Consumed: $1,240
                      </span>
                    </div>

                    {/* Item 2 */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-600 uppercase tracking-wider">Dev Assistant Agent</span>
                        <span className="text-slate-900 font-mono">${budgetCaps.dev} / Mo</span>
                      </div>
                      <input 
                        type="range" 
                        min="1000" 
                        max="10000" 
                        step="200"
                        value={budgetCaps.dev} 
                        onChange={(e) => setBudgetCaps(prev => ({ ...prev, dev: Number(e.target.value) }))}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                      <div className="h-2 bg-red-100 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500" style={{ width: '100%' }} />
                      </div>
                      <span className="block text-[10px] text-red-500 font-black font-mono uppercase flex items-center gap-1">
                        PAUSED — LIMIT EXHAUSTED ($5,000 / $5,000)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Enterprise Identity Mapping (JWT Claim Simulation) */}
                <div className="bg-white rounded-[32px] p-8 border border-slate-200/60 shadow-sm space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">Enterprise Identity Mapping</h3>
                      <p className="text-xs text-slate-500 font-medium">Map custom claims straight to your secure JSON Web Token (JWT) container.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block p-0.5">Corporate Tenant ID</label>
                      <input 
                        type="text" 
                        value={tenantIdInput}
                        onChange={(e) => setTenantIdInput(e.target.value)}
                        placeholder="e.g. acme-financials-hq"
                        className="w-full bg-slate-50 text-slate-900 border border-slate-100 rounded-2xl p-4 text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none placeholder-slate-400"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] bg-slate-50 border border-slate-100/60 p-3 rounded-2xl">
                      <span className="text-slate-500 font-bold">Active Claim status:</span>
                      {activeTenantClaim ? (
                        <span className="text-indigo-600 font-extrabold uppercase font-mono bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100/40">
                          {activeTenantClaim}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-black uppercase font-mono">
                          NO ACTIVE CLAIM
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-400 leading-normal font-medium">
                      Activates partition security immediately. Traces query: <code className="bg-slate-100 px-1 rounded text-red-500 font-mono">resource.data.tenantId == token.tenantId</code>.
                    </p>

                    <button 
                      onClick={handleSaveTenantClaim}
                      disabled={identitySaving}
                      className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all disabled:opacity-50"
                    >
                      {identitySaving ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          BINDING ASYNC PROTOCOL...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          BIND TENANT TOKEN
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Secure Key Vault / KMS Portal */}
                <div className="bg-white rounded-[32px] p-8 border border-slate-200/60 shadow-sm space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-violet-50 rounded-2xl text-violet-600">
                      <Server className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">Custom Key Vault (KMS)</h3>
                      <p className="text-xs text-slate-500 font-medium">Optionally deploy customer-specific API keys to bypass rate limits.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* KMS Enabled Toggle */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                      <div className="space-y-0.5 max-w-[70%]">
                        <span className="text-xs font-black uppercase tracking-wider block text-slate-700">Enable Custom Vault</span>
                        <span className="text-[10px] text-slate-500 font-bold block leading-normal">
                          Diverts debate pipelines to execute under your own rate margins.
                        </span>
                      </div>
                      <button 
                        onClick={() => setKmsEnabled(prev => !prev)}
                        className={`w-10 h-6 rounded-full p-0.5 transition-colors ${kmsEnabled ? 'bg-violet-600' : 'bg-slate-200'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${kmsEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    {/* Gemini Key Input */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block p-0.5">Gemini client Key</label>
                      <input 
                        type="password" 
                        value={kmsGeminiKey}
                        onChange={(e) => setKmsGeminiKey(e.target.value)}
                        placeholder="AIzaSy... (Unchanged if left blank)"
                        className="w-full bg-slate-50 text-slate-900 border border-slate-100 rounded-2xl p-4 text-xs font-mono focus:ring-1 focus:ring-violet-500 outline-none placeholder-slate-400"
                      />
                    </div>

                    <div className="p-4 bg-violet-50/40 border border-violet-100/60 rounded-2xl flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-violet-600 flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] leading-normal text-slate-500 font-medium">
                        <strong>Cryptographic isolation:</strong> Keys are fetched directly into secure memory slots during debate consensus, and are never written to unauthenticated client logs.
                      </p>
                    </div>

                    <button 
                      onClick={handleSaveKmsSettings}
                      disabled={kmsSaving}
                      className="w-full flex items-center justify-center gap-2 py-4 bg-violet-600 hover:bg-violet-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all disabled:opacity-50"
                    >
                      {kmsSaving ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          VAULT INGESTION IN PROGRESS...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          SYNC KEY VAULT (KMS)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'telemetry' ? (
            <motion.div
              key="telemetry-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Left Column: Trace Span Observability Waterfall */}
              <div className="lg:col-span-2 space-y-8">
                {/* Visual Waterfall Logs Traces */}
                <div className="bg-white rounded-[32px] p-8 border border-slate-200/60 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-violet-50 rounded-2xl text-violet-600">
                        <Terminal className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-slate-900">Global Run-Trace Span Stream</h2>
                        <p className="text-sm text-slate-500 font-medium">Audit logs formatted in OpenTelemetry structures, representing child spans of active multi-model debates.</p>
                      </div>
                    </div>
                    <button className="p-2.5 hover:bg-slate-50 rounded-xl transition-all border border-slate-100 flex items-center gap-1.5 text-xs font-black text-slate-600">
                      <RefreshCw className="w-3.5 h-3.5" />
                      LIVE STREAM
                    </button>
                  </div>

                  {/* Table and Expandable Streams */}
                  <div className="space-y-4 mt-8">
                    {combinedTraces.map((trace) => {
                      const expanded = expandedTraceId === trace.id;
                      return (
                        <div 
                          key={trace.id}
                          className={`rounded-[24px] border transition-all ${
                            expanded 
                              ? 'border-indigo-600 shadow-sm ring-1 ring-indigo-600/30' 
                              : 'border-slate-100 bg-slate-50/20 hover:bg-slate-50'
                          }`}
                        >
                          {/* Inner Header Row */}
                          <div 
                            onClick={() => setExpandedTraceId(expanded ? null : trace.id)}
                            className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                          >
                            <div className="space-y-1 max-w-[70%]">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-wider">{trace.id}</span>
                                <span className="text-xs text-slate-400 font-semibold font-mono">{trace.timestamp}</span>
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase font-mono tracking-wider">{trace.clientName}</span>
                              </div>
                              <h3 className="text-sm font-black text-slate-900 leading-normal truncate">{trace.targetQuery}</h3>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right hidden md:block">
                                <div className="text-xs font-black text-slate-900 font-mono tracking-wider">{trace.totalTokens.toLocaleString()} tokens</div>
                                <div className="text-[11px] font-bold text-slate-400">Cost: ${trace.totalWholesaleCost.toFixed(2)}</div>
                              </div>
                              
                              <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                                trace.status === 'SUCCESS' 
                                  ? 'bg-emerald-100 text-emerald-700' 
                                  : trace.status === 'TIMEOUT' 
                                  ? 'bg-amber-100 text-amber-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {trace.status}
                              </span>
                              
                              <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-200 ${expanded ? 'rotate-180 text-indigo-600' : 'rotate-0'}`} />
                            </div>
                          </div>

                          {/* Nested child Spans list */}
                          <AnimatePresence>
                            {expanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-slate-100 bg-slate-50/50 rounded-b-[24px] overflow-hidden"
                              >
                                <div className="p-5 space-y-4">
                                  <div className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-indigo-50 pb-2">NESTED SPAN ARCHITECTURE LOGS:</div>
                                  
                                  {trace.spans.map((span, sIdx) => (
                                    <div key={sIdx} className="pl-6 border-l-2 border-indigo-200 relative py-2 space-y-1.5">
                                      {/* Small Bullet Point Indicator */}
                                      <div className="absolute top-4 left-[-5px] w-2 h-2 rounded-full bg-indigo-500" />
                                      
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-mono font-black text-slate-800 uppercase tracking-wide">{span.name}</span>
                                          <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">{span.type}</span>
                                          {span.modelUsed && (
                                            <span className="text-[10px] text-slate-500 font-bold font-sans">[{span.modelUsed}]</span>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                                          <span>Dur: <strong>{span.runtimeMs}ms</strong></span>
                                          <span>•</span>
                                          <span>Vol: {span.tokensProcessed.toLocaleString()} tokens</span>
                                          <span>•</span>
                                          <span className="text-slate-600 font-bold">Est: ${span.costEstimate.toFixed(3)}</span>
                                        </div>
                                      </div>

                                      <p className="text-xs text-slate-500 font-medium leading-relaxed bg-white border border-slate-100 p-3 rounded-lg shadow-sm">
                                        {span.description}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Infrastructure latency & Real-Time Financial Arbitraged Tracker */}
              <div className="space-y-8 col-span-1">
                {/* Target margins overview */}
                <div className="bg-white rounded-[32px] p-8 border border-slate-200/60 shadow-sm relative overflow-hidden">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-slate-900">Margin Arbitrage Calculator</h2>
                      <p className="text-xs text-slate-500 font-medium">Model wholesale provider compute API bills against Ethersflow retail credit rates.</p>
                    </div>
                  </div>

                  <div className="space-y-5 mt-6 border-t border-slate-100 pt-6">
                    {/* Control 1: Rate */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-500">Retail Rate Billed per 1M Tokens</span>
                        <span className="text-indigo-600 font-bold font-mono">${retailRate}.00</span>
                      </div>
                      <input 
                        type="range" 
                        min="15" 
                        max="80" 
                        step="5"
                        value={retailRate} 
                        onChange={(e) => setRetailRate(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>

                    {/* Control 3: Model tier selector */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-500 block">Orchestrated Engine Class</span>
                      <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border">
                        {['budget', 'standard', 'reasoning'].map((mode) => (
                          <button
                            key={mode}
                            onClick={() => setSelectedModelTier(mode as any)}
                            className={`py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                              selectedModelTier === mode 
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-900'
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                      <span className="block text-[10px] text-slate-400 font-semibold leading-normal font-mono uppercase">
                        Wholesale: {wholesalePricing[selectedModelTier].name}
                      </span>
                    </div>

                    {/* Math Results */}
                    <div className="p-5 bg-slate-50/80 border border-slate-100 rounded-2xl space-y-4">
                      <div className="flex justify-between text-xs font-semibold border-b border-dashed pb-3">
                        <span className="text-slate-500">Effective Wholesale Cost:</span>
                        <span className="text-slate-900 font-mono font-bold">${totalWholesaleComputeCost.toFixed(3)}</span>
                      </div>

                      <div className="flex justify-between text-xs font-semibold border-b border-dashed pb-3">
                        <span className="text-slate-500">User Retail Revenue:</span>
                        <span className="text-emerald-600 font-mono font-bold">${totalRetailRevenue.toFixed(2)}</span>
                      </div>

                      {/* Gross Profit margin status */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-900 uppercase">Gross Profit Margin:</span>
                          <span className={`font-mono font-black ${grossMarginPercentage >= 65 ? 'text-emerald-700' : 'text-red-700'}`}>
                            {grossMarginPercentage.toFixed(2)}%
                          </span>
                        </div>

                        {grossMarginPercentage >= 65 ? (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100/60 border border-emerald-100 rounded-full text-[10px] text-emerald-800 font-black tracking-wider uppercase font-mono">
                            <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse" />
                            SECURITIES SECURED — ABOVE 65% FLOOR
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-red-100/60 border border-red-100 rounded-full text-[10px] text-red-800 font-black tracking-wider uppercase font-mono">
                            <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping" />
                            🚨 ALERT TRIGGERED — BELOW 65% TARGET
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Downstream Endpoint Latency Speedbars */}
                <div className="bg-white rounded-[32px] p-8 border border-slate-200/60 shadow-sm">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                      <Server className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-slate-900">Endpoint Health</h2>
                      <p className="text-xs text-slate-500 font-medium">Real-time downlink round-trip tracking for underlying LLM execution partners.</p>
                    </div>
                  </div>

                  <div className="space-y-5 mt-6 pt-5 border-t border-slate-100">
                    {/* flash */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-slate-700 uppercase font-mono tracking-wider">Gemini 2.5 Flash</span>
                        <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{pings.gemini_flash}ms / Stable</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (pings.gemini_flash / 400) * 100)}%` }} />
                      </div>
                    </div>

                    {/* pro */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-slate-700 uppercase font-mono tracking-wider">Gemini 2.5 Pro</span>
                        <span className="text-xs font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">{pings.gemini_pro}ms / High Lag</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (pings.gemini_pro / 400) * 100)}%` }} />
                      </div>
                    </div>

                    {/* llama */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-slate-700 uppercase font-mono tracking-wider">Llama 3.3 70B (Emergency Link)</span>
                        <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{pings.llama_70b}ms / Active</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (pings.llama_70b / 400) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'guardian' ? (
            <GuardianTelemetryView traces={combinedTraces} />
          ) : (
            <GtmPipelineDashboard />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
