import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Logo } from './components/Logo';
import { NemotronVectorInspector } from './components/NemotronVectorInspector';
import { StreamingHeroText } from './components/StreamingHeroText';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Users, 
  Plus, 
  Play, 
  Trash2, 
  Settings, 
  Save,
  Edit2,
  ChevronDown, 
  ChevronLeft,
  ExternalLink,
  Check,
  AlertTriangle, 
  CheckCircle, 
  CreditCard,
  AlertCircle,
  HelpCircle,
  Copy,
  RotateCcw,
  ShieldCheck,
  Shield,
  Activity,
  Search,
  ArrowUp,
  ArrowDown,
  Upload,
  History as HistoryIcon, 
  LogOut, 
  User as UserIcon,
  Brain,
  Mic,
  Paperclip,
  Download,
  FileText,
  Camera,
  Cloud,
  CloudOff,
  Sparkles,
  AppWindow,
  Info,
  Command,
  MessageSquare,
  Folder,
  Blocks,
  ShieldAlert,
  Share2,
  Globe,
  Mail,
  X,
  ArrowRight,
  Briefcase,
  BookOpen,
  Award,
  Send,
  GraduationCap,
  Building,
  Scale,
  Rocket,
  TrendingUp,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Pause,
  Loader2,
  Code,
  Key,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, cleanHeadingText, stripMarkdown, normalizeAnalystReport, normalizeConsensus, parseAnalystReport, extractThinking, stripThinking } from './lib/utils';
import { useAuth } from './hooks/useAuth';
import { extractTextFromPdfClient } from './services/clientPdfExtractor';
import { fetchAudioBlobForText, cleanMarkdownForSpeech } from './services/ttsService';
import { runConsensus, type AnalystResponse, type SynthesisResult, type ChatMessage } from './services/consensusService';
import { fetchUsage, incrementUsage, createCheckoutSession, createPortalSession, type UsageInfo } from './services/billingService';
import { translations, languageCodeMap, type Language } from './lib/i18n';
import { 
  Model, 
  AnalystSlot, 
  SavedAnalysis, 
  AttachedFile, 
  View, 
  PlanTier,
  Project
} from './types';
import { 
  AVAILABLE_MODELS, 
  DEFAULT_PERSONAS, 
  PRESET_AGENTS, 
  EXAMPLE_QUERIES 
} from './constants';
import { PAGE_CONTENT } from './content/pages';
import { SharedView } from './components/SharedView';
import { ProtocolFlow } from './components/ProtocolFlow';
import { SecurityDashboard } from './components/SecurityDashboard';
import { 
  PricingOverviewPage, 
  ProPlanDetailedPage, 
  MaxPlanDetailedPage, 
  EnterprisePlanDetailedPage 
} from './components/PricingViews';

import { AboutPage } from './components/AboutPage';
import { CareersPage } from './components/CareersPage';
import { ContactPage } from './components/ContactPage';
import { ResearchPage } from './components/ResearchPage';
import { ProtocolPage } from './components/ProtocolPage';
import { B2bDeveloperPortal } from './components/B2bDeveloperPortal';
import { DevelopersPage } from './components/DevelopersPage';

import { 
  collection, 
  addDoc, 
  query as firestoreQuery, 
  where, 
  orderBy, 
  onSnapshot, 
  doc,
  getDocFromServer,
  limit,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  setDoc
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, getAccessToken, getDriveAccessToken } from './services/firebase';

const SECTOR_SUGGESTIONS = [
  {
    id: 'venture',
    name: 'Venture Capital',
    icon: 'TrendingUp',
    description: 'Vet deal-flow, SaaS cohort retention, competitive moats, and Series A/B valuation benchmarks.',
    prompts: [
      "Evaluate the competitive landscape and defensive moats of [Company Name] in the [Sector/Industry] space.",
      "Analyze the key market risks, growth assumptions, and competitive moats of an early-stage startup entering a highly competitive landscape.",
      "Model the potential venture returns, exit multiples, and cap-table dilution for an early-stage SaaS startup raising a Series A."
    ]
  },
  {
    id: 'economist',
    name: 'The Economist',
    icon: 'Globe',
    description: 'Stress-test macroeconomic policies, inflation indices, central bank rate pathways, and sovereign risk tolerances.',
    prompts: [
      "What is the current interest rate, inflation index, or macroeconomic status of [Country/Region]? Retrieve real-time data.",
      "Analyze the macroeconomic impact of prolonged high interest rates on global inflation, sovereign debt, and currency stability.",
      "Evaluate the systemic economic risks and supply chain impacts of rising trade tariffs and protectionist policies in global markets."
    ]
  },
  {
    id: 'finance',
    name: 'Finance',
    icon: 'Building',
    description: 'Audit corporate cash flow assumptions, WACC, debt covenants, and quantitative portfolio correlation matrices.',
    prompts: [
      "What is the current price and valuation trend of [Asset/Commodity/Equity]? Enforce live quote verification.",
      "Evaluate a Discounted Cash Flow (DCF) model and corporate valuation assumptions for a mid-market acquisition target.",
      "Perform a comprehensive credit risk and leverage analysis on corporate debt issuances in a tight monetary environment."
    ]
  },
  {
    id: 'entrepreneur',
    name: 'Entrepreneurs & Startups',
    icon: 'Rocket',
    description: 'Audit product-market fit, map customer personas, and optimize monetization models.',
    prompts: [
      "Generate a product-market fit roadmap and retention strategy for my business idea: [Insert Business Idea/Product].",
      "Identify the most common failure modes and product-market fit bottlenecks for an early-stage digital marketplace.",
      "Analyze customer acquisition cost (CAC) efficiencies, retention loops, and churn prevention methods for a digital subscription service."
    ]
  },
  {
    id: 'legal',
    name: 'Legal & Compliance',
    icon: 'Scale',
    description: 'Audit regulatory exposure, jurisdictional structures, and contract loopholes.',
    prompts: [
      "Audit the regulatory exposure and standard compliance requirements for [Business Type] operating in [Jurisdictions].",
      "Identify standard compliance risks, regulatory liabilities, and contract vulnerabilities for a multi-jurisdictional transaction.",
      "Audit a standard corporate joint-venture term sheet for regulatory governance exposure and liability loopholes."
    ]
  },
  {
    id: 'academic',
    name: 'Researchers & Academics',
    icon: 'GraduationCap',
    description: 'Stress-test causal claims, publication biases, and research methodologies.',
    prompts: [
      "Critically review the experimental methodology and statistical power of: [Insert Hypothesis/Paper Title].",
      "Critically review the experimental methodology, sample sizes, and statistical power of an empirical pilot study.",
      "Evaluate conflicting research publications on an emerging scientific breakthrough for potential confirmation bias."
    ]
  },
  {
    id: 'foundations',
    name: 'Foundations & Philanthropy',
    icon: 'Award',
    description: 'Evaluate grant proposals, track strategic Theory of Change, and assess systemic community impact.',
    prompts: [
      "Evaluate the Theory of Change and measurable social impact of a project addressing [Social Issue/Target Demographic].",
      "Evaluate a grant proposal targeting municipal educational disparities for logical consistency and measurable social metrics.",
      "Assess a proposed systemic healthcare initiative for long-term operational sustainability and potential unintended negative consequences."
    ]
  },
  {
    id: 'b2g',
    name: 'B2G & Government',
    icon: 'Briefcase',
    description: 'Stress-test public tenders, RFP drafts, procurement compliance, and legislative policy proposals.',
    prompts: [
      "Audit the public RFP compliance guidelines and performance risk metrics for [Agency/Project Type] bids.",
      "Audit an RFP procurement draft to ensure strict alignment with public policy mandates and comprehensive risk metrics.",
      "Stress-test a public grant application response for operational compliance, delivery capacity, and financial transparency."
    ]
  }
];

const getSectorIcon = (iconName: string) => {
  switch (iconName) {
    case 'TrendingUp': return <TrendingUp className="w-4 h-4" />;
    case 'Rocket': return <Rocket className="w-4 h-4" />;
    case 'Building': return <Building className="w-4 h-4" />;
    case 'Scale': return <Scale className="w-4 h-4" />;
    case 'GraduationCap': return <GraduationCap className="w-4 h-4" />;
    case 'Award': return <Award className="w-4 h-4" />;
    case 'Briefcase': return <Briefcase className="w-4 h-4" />;
    case 'Globe': return <Globe className="w-4 h-4" />;
    default: return <Briefcase className="w-4 h-4" />;
  }
};




function CommonFooter({ setView }: { setView: (v: View) => void }) {
  return (
    <footer className="w-full bg-[#1d1d1f] text-white py-24 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16 xl:px-24 grid grid-cols-1 md:grid-cols-4 gap-20">
        <div className="col-span-1 md:col-span-1">
          <a 
            href="#main"
            className="flex items-center gap-2 mb-8 cursor-pointer inline-flex"
            onClick={(e) => {
              e.preventDefault();
              setView('main');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <Logo size="md" theme="dark" />
          </a>
          <p className="text-[#86868b] font-bold text-sm leading-relaxed mb-8">
            Closing the AI trust gap through <br />
            verifiable adversarial consensus.
          </p>
        </div>
        
        <div>
          <h4 className="font-black text-xs uppercase tracking-[0.3em] mb-8 text-white">Platform</h4>
          <ul className="space-y-4 text-sm font-bold text-[#86868b]">
            <li><a href="#protocol" onClick={(e) => { e.preventDefault(); setView('protocol'); window.scrollTo({ top: 0, behavior: 'instant' }); }} className="hover:text-white transition-colors text-left font-bold block">Protocol</a></li>
            <li><a href="#pricing" onClick={(e) => { e.preventDefault(); setView('pricing_overview'); window.scrollTo({ top: 0, behavior: 'instant' }); }} className="hover:text-white transition-colors text-left font-bold block">Pricing</a></li>
            <li><a href="#developers" onClick={(e) => { e.preventDefault(); setView('developers'); window.scrollTo({ top: 0, behavior: 'instant' }); }} className="hover:text-white transition-colors text-left font-bold flex items-center gap-2"><span>Developers Hub</span><span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded text-[9px] font-black uppercase">SDK</span></a></li>
            <li><a href="#api" onClick={(e) => { e.preventDefault(); setView('api'); window.scrollTo({ top: 0, behavior: 'instant' }); }} className="hover:text-white transition-colors text-left font-bold flex items-center gap-2"><span>API Portal & Keys</span><span className="px-1.5 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-400/30 rounded text-[9px] font-black uppercase">API</span></a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-black text-xs uppercase tracking-[0.3em] mb-8 text-white">Company</h4>
          <ul className="space-y-4 text-sm font-bold text-[#86868b]">
            <li><a href="#about" onClick={(e) => { e.preventDefault(); setView('about'); window.scrollTo({ top: 0, behavior: 'instant' }); }} className="hover:text-white transition-colors text-left font-bold block">About</a></li>
            <li><a href="#research" onClick={(e) => { e.preventDefault(); setView('research'); window.scrollTo({ top: 0, behavior: 'instant' }); }} className="hover:text-white transition-colors text-left font-bold block">Research</a></li>
            <li><a href="#careers" onClick={(e) => { e.preventDefault(); setView('careers'); window.scrollTo({ top: 0, behavior: 'instant' }); }} className="hover:text-white transition-colors text-left font-bold block">Careers</a></li>
            <li><a href="#contact" onClick={(e) => { e.preventDefault(); setView('contact'); window.scrollTo({ top: 0, behavior: 'instant' }); }} className="hover:text-white transition-colors text-left font-bold block">Contact Us</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-black text-xs uppercase tracking-[0.3em] mb-8 text-white">Legal</h4>
          <ul className="space-y-4 text-sm font-bold text-[#86868b]">
            <li><a href="#privacy" onClick={() => setView('privacy')} className="hover:text-white transition-colors text-left font-bold block">Privacy Policy</a></li>
            <li><a href="#terms" onClick={() => setView('terms')} className="hover:text-white transition-colors text-left font-bold block">Terms of Service</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16 xl:px-24 mt-20 pt-10 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-[10px] font-black text-gray-500 tracking-[0.4em] uppercase">
          © 2026 EthersFlow Technologies. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}

function SectionPage({ title, onClose, setView }: { title: string; onClose: () => void; setView: (v: View) => void }) {
  const content = PAGE_CONTENT[title.toLowerCase() as Exclude<View, 'main'>];
  
  if (!content) return null;

  return (
    <div className="min-h-screen bg-white">
      <nav className="w-full max-w-7xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16 xl:px-24 py-6 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onClose}>
          <Logo size="md" />
          <span className="text-2xl font-black tracking-tighter italic">EthersFlow</span>
        </div>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
          <Plus className="w-6 h-6 rotate-45" />
        </button>
      </nav>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-24">
        <div className="mb-12 sm:mb-16 text-center sm:text-left">
          <div className="text-[10px] sm:text-xs font-black text-indigo-600 uppercase tracking-widest mb-4">PLATFORM // {title.toUpperCase()}</div>
          <h1 className="text-4xl sm:text-6xl font-black mb-6 tracking-tighter uppercase leading-[0.9]">{content.title}</h1>
          <p className="text-xl sm:text-2xl font-black text-[#1d1d1f] tracking-tight">{content.subtitle}</p>
        </div>

        <div className="space-y-10 sm:space-y-12 text-gray-600 font-medium text-base sm:text-lg leading-relaxed">
          <p className="text-lg sm:text-xl text-[#1d1d1f] font-bold">
            {content.introduction}
          </p>
          
          <div className="grid grid-cols-1 gap-6 sm:gap-8">
            {content.sections.map((section, idx) => (
              <div key={idx} className="bg-gray-50 rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 border border-gray-100">
                 <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-4 sm:mb-6">{section.title}</h2>
                 <p className="text-sm sm:text-base leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>
          
          <p className="border-t border-gray-100 pt-12 text-center text-sm text-gray-400 uppercase tracking-widest font-black">
            End of {title.toUpperCase()} Document — Institutional Grade
          </p>
        </div>
      </main>
      <CommonFooter setView={setView} />
    </div>
  );
}

function AgentLibrary({ 
  onSelect, 
  onClose, 
  slots, 
  setSlots, 
  plan, 
  setShowUpgradeModal,
  customAgents,
  archiveAgent,
  deleteCustomAgent,
  toggleShareCustomAgent
}: { 
  onSelect: (agent: any) => void, 
  onClose: () => void, 
  slots: AnalystSlot[], 
  setSlots: (s: AnalystSlot[]) => void, 
  plan: PlanTier, 
  setShowUpgradeModal: (show: boolean) => void,
  customAgents: AnalystSlot[],
  archiveAgent: (agent: AnalystSlot) => Promise<void>,
  deleteCustomAgent: (id: string) => Promise<void>,
  toggleShareCustomAgent: (agent: AnalystSlot) => Promise<void>
}) {
    const categories = [
      { id: 'all', name: 'All Agents', icon: <Blocks className="w-4 h-4" /> },
      { id: 'presets', name: 'Standard Presets', icon: <Brain className="w-4 h-4" /> },
      { id: 'custom', name: 'My Persona Archive', icon: <UserIcon className="w-4 h-4" /> },
      { id: 'venture', name: 'Venture & Finance', icon: <TrendingUp className="w-4 h-4" /> },
      { id: 'entrepreneur', name: 'Product & Venture', icon: <Rocket className="w-4 h-4" /> },
      { id: 'foundations', name: 'Foundations & Philanthropy', icon: <Award className="w-4 h-4" /> },
      { id: 'b2g', name: 'B2G & Government', icon: <Briefcase className="w-4 h-4" /> },
      { id: 'legal', name: 'Legal & Compliance', icon: <Scale className="w-4 h-4" /> },
      { id: 'academic', name: 'Academic Research', icon: <GraduationCap className="w-4 h-4" /> },
      { id: 'strategic', name: 'Strategic', icon: <Sparkles className="w-4 h-4" /> },
      { id: 'analytical', name: 'Analytical', icon: <Search className="w-4 h-4" /> },
      { id: 'adversarial', name: 'Adversarial', icon: <ShieldAlert className="w-4 h-4" /> },
    ];

    const [activeCategory, setActiveCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const { user: authUser } = useAuth();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingAgent, setEditingAgent] = useState<any | null>(null);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newModel, setNewModel] = useState<Model>('llama-3.3-70b-versatile');
    const [newSystemPrompt, setNewSystemPrompt] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const openCreateModal = () => {
      setEditingAgent(null);
      setNewName('');
      setNewDesc('');
      setNewModel('llama-3.3-70b-versatile');
      setNewSystemPrompt('Provide a unique perspective on the query. State your confidence (HIGH/MEDIUM/LOW) at the start.');
      setShowCreateModal(true);
    };

    const openEditModal = (agent: any) => {
      setEditingAgent(agent);
      setNewName(agent.name);
      setNewDesc(agent.desc || agent.description || '');
      setNewModel(agent.model);
      setNewSystemPrompt(agent.systemPrompt || `Analyze the query as ${agent.name}.`);
      setShowCreateModal(true);
    };

    const handleSaveCustomAgent = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newName.trim()) {
        alert("Please enter a name for your agent.");
        return;
      }
      setIsSaving(true);
      try {
        const agentData: AnalystSlot = {
          id: editingAgent ? editingAgent.id : ('custom-' + Math.random().toString(36).substr(2, 9)),
          name: newName.trim(),
          description: newDesc.trim() || 'Custom reasoning perspective',
          model: newModel,
          active: true,
          systemPrompt: newSystemPrompt.trim() || `Analyze the query as ${newName.trim()}.`
        };
        await archiveAgent(agentData);
        setShowCreateModal(false);
        // Clear fields
        setNewName('');
        setNewDesc('');
        setNewModel('llama-3.3-70b-versatile');
        setNewSystemPrompt('');
        setEditingAgent(null);
      } catch (err) {
        console.error("Error archiving custom agent:", err);
      } finally {
        setIsSaving(false);
      }
    };

    const presetAgents = [
      // venture
      { id: 'vc_generalist', name: 'Venture Capitalist (Generalist)', desc: 'Provides generalist venture investment analysis, funding thesis checks, and general business feedback. Mandated to actively cite and prioritize real-time grounding facts.', category: 'venture', model: 'openrouter/meta-llama/llama-3.3-70b-instruct' as Model, systemPrompt: 'You are a seasoned generalist Venture Capitalist. Evaluate the query from a high-level investment perspective. Analyze the general commercial opportunity, strategic viability, and capital efficiency. Keep your analysis high-level, clear, and accessible, avoiding overly narrow sub-specialist jargon unless requested. State your confidence level (HIGH/MEDIUM/LOW) at the start. CRITICAL REAL-TIME DATA DIRECTIVE: You MUST actively leverage, cite, and prioritize the real-time web grounding data (including prices, tickers, and current metrics) provided in the context. Avoid vague generalities or outdated cutoff knowledge; support specialized agents by referencing precise, live-verified facts and citing sources in [Source Name](URL) format.', source: 'preset' },
      { id: 'vc_partner', name: 'Venture Partner', desc: 'Specializes in venture fund thesis evaluation, TAM/SAM sizing, unit economics, and competitive moat strength.', category: 'venture', model: 'openrouter/meta-llama/llama-3.3-70b-instruct' as Model, systemPrompt: 'You are an elite Venture Capital Partner evaluating investment opportunities. Assess the market size (TAM/SAM/SOM), competitive landscape, scalability, network effects, and defensive moats. Challenge the founding team\'s underlying growth assumptions. Formulate a strong investment thesis or a clear dissenting view based on market risk, potential exit multiples, and unit economics. State your confidence level (HIGH/MEDIUM/LOW) at the start.', source: 'preset' },

      // entrepreneur
      { id: 'startup_generalist', name: 'Startup Advisor (Generalist)', desc: 'General entrepreneurship advice, product-market fit basics, and growth strategy guides. Mandated to actively cite and prioritize real-time grounding facts.', category: 'entrepreneur', model: 'openrouter/meta-llama/llama-3.3-70b-instruct' as Model, systemPrompt: 'You are a trusted, generalist Startup Advisor. Evaluate the query to help the builder clarify their business goals, validate initial demand, identify customer value, and formulate a simple execution roadmap. Provide practical, high-level guidance for early-stage startup hurdles. State your confidence level (HIGH/MEDIUM/LOW) at the start. CRITICAL REAL-TIME DATA DIRECTIVE: You MUST actively leverage, cite, and prioritize the real-time web grounding data (including prices, tickers, and current metrics) provided in the context. Avoid vague generalities or outdated cutoff knowledge; support specialized agents by referencing precise, live-verified facts and citing sources in [Source Name](URL) format.', source: 'preset' },
      { id: 'pmf_architect', name: 'Product-Market Fit Architect', desc: 'Specializes in entrepreneurship risk, customer pain-point validation, value proposition, and retention loops.', category: 'entrepreneur', model: 'openrouter/meta-llama/llama-3.3-70b-instruct' as Model, systemPrompt: 'You are a veteran Product-Market Fit Architect helping early-stage entrepreneurs discover product-market fit. Identify core target customer personas, dissect their pain points, and assess the clarity of the value proposition. Evaluate retention loops, organic viral mechanics, and acquisition costs (CAC vs. LTV). Challenge product design assumptions, suggest specific pilot/MVP metrics to track, and highlight friction points that typically kill early-stage ventures. State your confidence level (HIGH/MEDIUM/LOW) at the start.', source: 'preset' },

      // foundations
      { id: 'philanthropy_generalist', name: 'Philanthropy Advisor (Generalist)', desc: 'General charity and impact metrics evaluation, and social foundation support. Mandated to actively cite and prioritize real-time grounding facts.', category: 'foundations', model: 'openrouter/meta-llama/llama-3.3-70b-instruct' as Model, systemPrompt: 'You are a generalist Philanthropy Advisor. Evaluate the query or proposal with a focus on general social impact, organizational feasibility, and community alignment. Help guide high-level philanthropic strategies and simple metric tracking. State your confidence level (HIGH/MEDIUM/LOW) at the start. CRITICAL REAL-TIME DATA DIRECTIVE: You MUST actively leverage, cite, and prioritize the real-time web grounding data (including prices, tickers, and current metrics) provided in the context. Avoid vague generalities or outdated cutoff knowledge; support specialized agents by referencing precise, live-verified facts and citing sources in [Source Name](URL) format.', source: 'preset' },
      { id: 'grant_auditor', name: 'Grant Auditor', desc: 'Specializes in Theory of Change validation, philanthropic impact metrics, and systemic risk evaluations.', category: 'foundations', model: 'openrouter/meta-llama/llama-3.3-70b-instruct' as Model, systemPrompt: 'You are a senior Grant Auditor and Philanthropic Strategist. Evaluate the query or proposal through a rigorous Theory of Change framework. Audit for execution feasibility, long-term financial sustainability, and systemic risk (including unintended downstream dependencies or community friction). Assess the rigor of the proposed success metrics, demanding clear baseline comparisons and robust qualitative/quantitative verification methods. State your confidence level (HIGH/MEDIUM/LOW) at the start.', source: 'preset' },

      // b2g
      { id: 'public_sector_generalist', name: 'Public Sector Consultant (Generalist)', desc: 'General public-private partnership advice, compliance basics, and procurement checks. Mandated to actively cite and prioritize real-time grounding facts.', category: 'b2g', model: 'openrouter/meta-llama/llama-3.3-70b-instruct' as Model, systemPrompt: 'You are a generalist Public Sector Consultant. Evaluate the query to assess government project feasibility, high-level administrative barriers, public-private alignment, and regulatory compliance paths. Keep your suggestions practical and widely applicable. State your confidence level (HIGH/MEDIUM/LOW) at the start. CRITICAL REAL-TIME DATA DIRECTIVE: You MUST actively leverage, cite, and prioritize the real-time web grounding data (including prices, tickers, and current metrics) provided in the context. Avoid vague generalities or outdated cutoff knowledge; support specialized agents by referencing precise, live-verified facts and citing sources in [Source Name](URL) format.', source: 'preset' },
      { id: 'procurement_auditor', name: 'Procurement Auditor', desc: 'Specializes in Government RFP drafts, public sector compliance, and project delivery risk.', category: 'b2g', model: 'openrouter/meta-llama/llama-3.3-70b-instruct' as Model, systemPrompt: 'You are an elite Government Procurement and RFP Compliance Auditor. Analyze the draft, proposal, or procurement query against strict public sector standards, regulatory mandates, and execution criteria. Identify hidden administrative bottlenecks, delivery vulnerabilities, contract compliance loopholes, and resource gaps. Recommend clear risk-allocation clauses, performance benchmarks, and compliance safeguards to ensure seamless public-private execution. State your confidence level (HIGH/MEDIUM/LOW) at the start.', source: 'preset' },
      { id: 'policy_analyst', name: 'Policy Analyst', desc: 'Specializes in legislative impact, systemic policy risks, and public interest evaluations.', category: 'b2g', model: 'openrouter/meta-llama/llama-3.3-70b-instruct' as Model, systemPrompt: 'You are a veteran Public Policy Analyst. Evaluate the proposed initiative, policy, or legislative draft for socio-economic impact, structural alignment with municipal or federal laws, and stakeholder incentives. Audit for potential administrative friction, political risk, execution costs, and long-term unintended consequences. Challenge policy assumptions with evidence-based alternatives. State your confidence level (HIGH/MEDIUM/LOW) at the start.', source: 'preset' },

      // economist
      { id: 'economist_generalist', name: 'General Economist (Generalist)', desc: 'Provides high-level economic insights, supply/demand analyses, and simple macro market commentary. Mandated to actively cite and prioritize real-time grounding facts.', category: 'economist', model: 'openrouter/meta-llama/llama-3.3-70b-instruct' as Model, systemPrompt: 'You are a versatile, generalist Economist. Analyze the query using core economic principles (supply and demand, opportunity cost, market structures). Present a balanced, intuitive overview of the economic dynamics at play, suitable for general strategic planning. State your confidence level (HIGH/MEDIUM/LOW) at the start. CRITICAL REAL-TIME DATA DIRECTIVE: You MUST actively leverage, cite, and prioritize the real-time web grounding data (including prices, tickers, and current metrics) provided in the context. Avoid vague generalities or outdated cutoff knowledge; support specialized agents by referencing precise, live-verified facts and citing sources in [Source Name](URL) format.', source: 'preset' },
      { id: 'macro_analyst', name: 'Macro Economist', desc: 'Focuses on financial market microstructures, commodities, currency fluctuations, and interest rates.', category: 'economist', model: 'openrouter/meta-llama/llama-3.3-70b-instruct' as Model, systemPrompt: 'You are a seasoned Institutional Macro Economist. Analyze the query through the lens of macroeconomic policies, interest rates, inflationary indicators, and global asset pricing (such as currencies, equities, gold, and silver). IMPORTANT: You MUST strictly prioritize and adhere to verified, current real-time grounding facts provided in the analyst notes, actively rejecting stale assumptions or cutoff data. Build a rigorous macroeconomic thesis detailing hedge mechanisms and interest-rate vulnerabilities. State your confidence level (HIGH/MEDIUM/LOW) at the start.', source: 'preset' },

      // finance
      { id: 'finance_generalist', name: 'Finance Analyst (Generalist)', desc: 'General financial health auditor, basic cash-flow checks, and standard budgeting feedback. Mandated to actively cite and prioritize real-time grounding facts.', category: 'finance', model: 'openrouter/meta-llama/llama-3.3-70b-instruct' as Model, systemPrompt: 'You are a comprehensive Finance Generalist. Analyze the query using fundamental corporate finance principles. Provide high-level advice on financial health, standard capital budgeting, and general risk management without diving deep into overly quantitative debt covenant or DCF mechanics unless prompted. State your confidence level (HIGH/MEDIUM/LOW) at the start. CRITICAL REAL-TIME DATA DIRECTIVE: You MUST actively leverage, cite, and prioritize the real-time web grounding data (including prices, tickers, and current metrics) provided in the context. Avoid vague generalities or outdated cutoff knowledge; support specialized agents by referencing precise, live-verified facts and citing sources in [Source Name](URL) format.', source: 'preset' },

      // legal
      { id: 'legal_generalist', name: 'General Legal Counsel (Generalist)', desc: 'A generalist legal and compliance reviewer for high-level risk and general guidelines. Mandated to actively cite and prioritize real-time grounding facts.', category: 'legal', model: 'openrouter/meta-llama/llama-3.3-70b-instruct' as Model, systemPrompt: 'You are a generalist Legal Counsel. Analyze the query for high-level legal risk exposure, common compliance principles, and standard contractual guardrails. Provide structured guidelines to help identify legal questions that require specialized statutory analysis. State your confidence level (HIGH/MEDIUM/LOW) at the start. CRITICAL REAL-TIME DATA DIRECTIVE: You MUST actively leverage, cite, and prioritize the real-time web grounding data (including prices, tickers, and current metrics) provided in the context. Avoid vague generalities or outdated cutoff knowledge; support specialized agents by referencing precise, live-verified facts and citing sources in [Source Name](URL) format.', source: 'preset' },
      { id: 'legal_counsel', name: 'Regulatory Counsel', desc: 'Audits legal compliance, risk exposures, jurisdictional structures, and contract vulnerabilities.', category: 'legal', model: 'openrouter/meta-llama/llama-3.3-70b-instruct' as Model, systemPrompt: 'You are a corporate Regulatory and Compliance Counsel. Audit the query for regulatory exposure, SEC/CFTC compliance, legal liability, jurisdictional boundaries, contract loopholes, and risk management criteria. Analyze legal precedents, identify disclosure vulnerabilities, and recommend robust compliance frameworks. Be extremely rigorous and detail potential civil, administrative, or statutory exposures. State your confidence level (HIGH/MEDIUM/LOW) at the start.', source: 'preset' },

      // academic
      { id: 'academic_generalist', name: 'Academic Generalist (Generalist)', desc: 'A generalist researcher enforcing basic scientific methods, references, and logic rigor. Mandated to actively cite and prioritize real-time grounding facts.', category: 'academic', model: 'openrouter/meta-llama/llama-3.3-70b-instruct' as Model, systemPrompt: 'You are a generalist Academic Researcher. Review the query for standard methodological clarity, logical consistency, and reference-backed claims. Help outline standard academic approaches and general research methodologies. State your confidence level (HIGH/MEDIUM/LOW) at the start. CRITICAL REAL-TIME DATA DIRECTIVE: You MUST actively leverage, cite, and prioritize the real-time web grounding data (including prices, tickers, and current metrics) provided in the context. Avoid vague generalities or outdated cutoff knowledge; support specialized agents by referencing precise, live-verified facts and citing sources in [Source Name](URL) format.', source: 'preset' },
      { id: 'academic_reviewer', name: 'Academic Reviewer', desc: 'Enforces scientific and academic peer-review rigor, research methodology, and evidence standards.', category: 'academic', model: 'openrouter/meta-llama/llama-3.3-70b-instruct' as Model, systemPrompt: 'You are a rigorous Academic Peer Reviewer and Scientific Auditor. Evaluate the query or text through strict empirical methodologies. Audit statistical power, sample selection bias, confounding variables, and causal integrity. Challenge soft science assumptions, identify publication or confirmation biases, and demand robust double-blind controls. Formulate structured critiques of the empirical foundations of the arguments. State your confidence level (HIGH/MEDIUM/LOW) at the start.', source: 'preset' },

      // strategic
      { id: 'strategic_generalist', name: 'Strategic Consultant (Generalist)', desc: 'General strategic planning, high-level SWOT analysis, and long-term goal setting. Mandated to actively cite and prioritize real-time grounding facts.', category: 'strategic', model: 'openrouter/meta-llama/llama-3.3-70b-instruct' as Model, systemPrompt: 'You are a veteran Strategic Consultant. Evaluate the query to establish a high-level strategic direction, outlining core opportunities, potential risks, and basic operational recommendations. Focus on long-term goal alignment and clear prioritization. State your confidence level (HIGH/MEDIUM/LOW) at the start. CRITICAL REAL-TIME DATA DIRECTIVE: You MUST actively leverage, cite, and prioritize the real-time web grounding data (including prices, tickers, and current metrics) provided in the context. Avoid vague generalities or outdated cutoff knowledge; support specialized agents by referencing precise, live-verified facts and citing sources in [Source Name](URL) format.', source: 'preset' },
      { id: 'p1', name: 'Constructive Analyst', desc: 'Constructs the strongest case for a claim.', category: 'strategic', model: 'openrouter/meta-llama/llama-3.3-70b-instruct' as Model, systemPrompt: 'Present the strongest case FOR the main claim. Distinguish between evidence-based points and logical inferences. State your confidence level (HIGH/MEDIUM/LOW) at the start.', source: 'preset' },
      { id: 'p4', name: 'Ethicist', desc: 'Moral and social implications evaluator.', category: 'strategic', model: 'openrouter/meta-llama/llama-3.3-70b-instruct' as Model, systemPrompt: 'Evaluate the query through various ethical frameworks. State your confidence level (HIGH/MEDIUM/LOW) at the start.', source: 'preset' },
      { id: 'p7', name: 'Futurist', desc: 'Long-term trend and second-order effect evaluator.', category: 'strategic', model: 'openrouter/meta-llama/llama-3.3-70b-instruct' as Model, systemPrompt: 'Analyze the query through the lens of long-term trends and second-order effects. State your confidence level (HIGH/MEDIUM/LOW) at the start.', source: 'preset' },
      { id: 'p8', name: 'Out of the Box', desc: 'Specializes in high-entropy, unorthodox game-theoretic viewpoints and Shapley marginal information analysis.', category: 'strategic', model: 'openrouter/meta-llama/llama-3.3-70b-instruct' as Model, systemPrompt: 'You are the "Out of the Box" analyst. Your role is to think completely outside the standard paradigm. Introduce high-entropy, unorthodox, and dissenting perspectives. Utilize advanced game-theoretic principles and look for hidden assumptions or non-linear effects. Challenge conventional consensus and suggest creative, mathematically rigorous alternatives. State your confidence level (HIGH/MEDIUM/LOW) at the start.', source: 'preset' },

      // adversarial
      { id: 'adversarial_generalist', name: 'Devil\'s Advocate (Generalist)', desc: 'General adversarial stress testing, identifying obvious loopholes and counter-arguments. Mandated to actively cite and prioritize real-time grounding facts.', category: 'adversarial', model: 'openrouter/meta-llama/llama-3.3-70b-instruct' as Model, systemPrompt: 'You are a generalist Devil\'s Advocate. Your sole purpose is to challenge the core assumptions of the query in a constructive yet adversarial manner. Point out obvious flaws, unstated risks, and basic counter-arguments to prevent superficial thinking. State your confidence level (HIGH/MEDIUM/LOW) at the start. CRITICAL REAL-TIME DATA DIRECTIVE: You MUST actively leverage, cite, and prioritize the real-time web grounding data (including prices, tickers, and current metrics) provided in the context. Avoid vague generalities or outdated cutoff knowledge; support specialized agents by referencing precise, live-verified facts and citing sources in [Source Name](URL) format.', source: 'preset' },
      { id: 'p2', name: 'Red Team', desc: 'Aggressively finds flaws and contradictions.', category: 'adversarial', model: 'openrouter/meta-llama/llama-3.3-70b-instruct' as Model, systemPrompt: 'Your sole mission is to find contradictions, weak evidence, and logical fallacies in the arguments presented by other analysts. Be aggressive but logical. Your role is to prevent groupthink. State your confidence level (HIGH/MEDIUM/LOW) at the start.', source: 'preset' },

      // analytical
      { id: 'analytical_generalist', name: 'Analytical Thinker (Generalist)', desc: 'Provides general logical structures, structured reasoning, and rational problem solving. Mandated to actively cite and prioritize real-time grounding facts.', category: 'analytical', model: 'openrouter/meta-llama/llama-3.3-70b-instruct' as Model, systemPrompt: 'You are a generalist Analytical Thinker. Approach the query using structured logical thinking, systematic breakdowns, and evidence-based reasoning. Help turn complex problems into clear, sequential components. State your confidence level (HIGH/MEDIUM/LOW) at the start. CRITICAL REAL-TIME DATA DIRECTIVE: You MUST actively leverage, cite, and prioritize the real-time web grounding data (including prices, tickers, and current metrics) provided in the context. Avoid vague generalities or outdated cutoff knowledge; support specialized agents by referencing precise, live-verified facts and citing sources in [Source Name](URL) format.', source: 'preset' },
      { id: 'p3', name: 'The Skeptic', desc: 'Logical auditor for unsupported assumptions.', category: 'analytical', model: 'openrouter/meta-llama/llama-3.3-70b-instruct' as Model, systemPrompt: 'Stress-test and challenge claims. Find conceptual flaws, missing evidence, or alternative explanations. Be rigorous. State your confidence level (HIGH/MEDIUM/LOW) at the start.', source: 'preset' },
      { id: 'p5', name: 'Empiricist', desc: 'Extracts and verifies empirical claims.', category: 'analytical', model: 'openrouter/meta-llama/llama-3.3-70b-instruct' as Model, systemPrompt: 'Focus strictly on empirical evidence and statistical significance. State your confidence level (HIGH/MEDIUM/LOW) at the start.', source: 'preset' },
      { id: 'p6', name: 'Deep Investigator', desc: 'DeepSeek-powered logic-heavy analysis.', category: 'analytical', model: 'deepseek/deepseek-chat' as Model, systemPrompt: 'Analyze the query using deep step-by-step logic. State your confidence level (HIGH/MEDIUM/LOW) at the start.', source: 'preset' },
    ];

    const customAgentsList = customAgents.map(a => ({
      id: a.id,
      name: a.name,
      desc: a.description,
      category: a.category || 'custom',
      model: a.model,
      systemPrompt: a.systemPrompt,
      isShared: (a as any).isShared || false,
      source: 'custom'
    }));

    const combinedAgents = [...presetAgents, ...customAgentsList];

    // Category Filter
    const categoryFiltered = combinedAgents.filter(agent => {
      if (activeCategory === 'all') return true;
      if (activeCategory === 'presets') return agent.source === 'preset';
      if (activeCategory === 'custom') return agent.source === 'custom';
      return agent.category === activeCategory;
    });

    // Search Filter
    const filteredAgents = categoryFiltered.filter(agent => {
      const query = searchTerm.toLowerCase();
      const name = agent.name || '';
      const desc = agent.desc || '';
      const model = agent.model || '';
      return (
        name.toLowerCase().includes(query) ||
        desc.toLowerCase().includes(query) ||
        model.toLowerCase().includes(query)
      );
    });

    return (
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 sm:mb-12 gap-6 border-b border-gray-50 pb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter mb-2">Reviewer Agent Library</h2>
            <p className="text-gray-500 font-bold text-sm sm:text-base">Load specialized reviewer agent personalities into your collaborative consensus stack.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 sm:w-80">
              <input 
                type="text"
                placeholder="Search reviewer agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold placeholder:text-gray-300 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 outline-none transition-all"
              />
              <Search className="w-4 h-4 text-gray-300 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
            <button 
              onClick={openCreateModal}
              className="px-5 py-3 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center gap-2 text-xs uppercase tracking-widest cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Create Custom Reviewer Agent
            </button>
            <button onClick={onClose} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all cursor-pointer">
              <Plus className="w-5 h-5 rotate-45 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-8 sm:mb-12 overflow-x-auto pb-4 custom-scrollbar">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer",
                activeCategory === cat.id ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100/40" : "bg-white border border-gray-100 text-gray-400 hover:text-gray-600"
              )}
            >
              {cat.icon}
              {cat.name}
            </button>
          ))}
        </div>

        {filteredAgents.length === 0 ? (
          <div className="text-center py-20 bg-gray-50/50 rounded-[40px] border border-dashed border-gray-100">
            <Brain className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-black text-gray-900 mb-1">No matching reviewer agents found</h3>
            <p className="text-sm text-gray-400 font-bold">Try adjusting your search filters or create a new custom reviewer agent.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            {filteredAgents.map(agent => (
              <div key={agent.id} className="bg-white border border-gray-100 p-6 sm:p-8 rounded-[28px] sm:rounded-[40px] shadow-sm hover:shadow-2xl hover:shadow-indigo-50 transition-all group flex flex-col justify-between min-h-[300px]">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                      <Brain className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                    
                    {agent.source === 'custom' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(agent)}
                          title="Edit Reviewer Agent"
                          className="p-2 bg-gray-50 border border-gray-100 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleShareCustomAgent(agent as any)}
                          title={agent.isShared ? "Open share console" : "Share public link"}
                          className={cn(
                            "p-2 rounded-xl border transition-all cursor-pointer",
                            agent.isShared 
                              ? "bg-indigo-50 border-indigo-200 text-indigo-600 animate-pulse" 
                              : "bg-gray-50 border-gray-100 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                          )}
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${agent.name}" from your Reviewer Agent Library?`)) {
                              deleteCustomAgent(agent.id);
                            }
                          }}
                          title="Delete Reviewer Agent"
                          className="p-2 bg-gray-50 border border-gray-100 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg sm:text-xl font-black text-gray-900">{agent.name}</h3>
                    <span className={cn(
                      "text-[9px] font-mono uppercase px-2 py-0.5 rounded-md",
                      agent.source === 'custom' ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
                    )}>
                      {agent.source === 'custom' ? 'Custom' : 'System'}
                    </span>
                  </div>
                  
                  <p className="text-gray-400 text-xs sm:text-sm font-bold leading-relaxed mb-6 line-clamp-3">{agent.desc}</p>
                </div>

                <div className="space-y-4">
                  <div className="text-[10px] font-mono text-gray-300 truncate">
                    Engine: {agent.model}
                  </div>
                  <button 
                    onClick={() => {
                      const activeCount = slots.filter(s => s.active).length;
                      if (plan === 'free' && activeCount >= 3) {
                        alert("Free plan users are limited to 3 active analysts. Please upgrade to Pro or Max to activate more concurrent experts.");
                        setShowUpgradeModal(true);
                        return;
                      }
                      const newSlot: AnalystSlot = {
                        id: Math.random().toString(36).substr(2, 9),
                        name: agent.name,
                        description: agent.desc,
                        model: agent.model as any,
                        active: true,
                        systemPrompt: agent.systemPrompt || `Analyze the query as ${agent.name}.`
                      };
                      setSlots([...slots, newSlot]);
                      onSelect(agent);
                    }}
                    className="w-full py-3 bg-gray-50 hover:bg-indigo-600 hover:text-white rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Deploy to Stack
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create / Edit Custom Agent Modal Overlay */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-xl flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white rounded-[32px] sm:rounded-[40px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-10 relative custom-scrollbar text-left"
              >
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors z-20 cursor-pointer"
                >
                  <Plus className="w-5 h-5 rotate-45 text-gray-400" />
                </button>

                <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-2">
                  {editingAgent ? "Edit Custom Reviewer Agent" : "Create Custom Reviewer Agent"}
                </h3>
                <p className="text-xs text-gray-400 font-bold mb-6 sm:mb-8 uppercase tracking-wider">
                  {editingAgent ? "Modify saved reviewer agent details" : "Architect a new specialized reviewer agent"}
                </p>

                <form onSubmit={handleSaveCustomAgent} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Reviewer Agent Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Zero-Trust Auditor"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold placeholder:text-gray-300 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Brief Description
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Focuses on security and cryptographic validation"
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold placeholder:text-gray-300 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Underlying LLM Engine
                    </label>
                    <select
                      value={newModel}
                      onChange={(e) => setNewModel(e.target.value as Model)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all"
                    >
                      {AVAILABLE_MODELS.filter(m => !m.disabled).map(m => (
                        <option key={m.id} value={m.id}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                    {(() => {
                      const modelInfo = AVAILABLE_MODELS.find(m => m.id === newModel);
                      return modelInfo?.description ? (
                        <div className="mt-2 text-[10px] text-gray-500 font-medium leading-relaxed bg-gray-50/50 p-2.5 rounded-xl border border-gray-100/50">
                          {modelInfo.description}
                        </div>
                      ) : null;
                    })()}
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      System Instructions / Prompt
                    </label>
                    <textarea
                      required
                      rows={12}
                      placeholder="e.g. Focus strictly on cryptographic audit markers and protocol flows. Challenge assumptions with adversarial examples."
                      value={newSystemPrompt}
                      onChange={(e) => setNewSystemPrompt(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold placeholder:text-gray-300 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all resize-y min-h-[300px]"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 py-4 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 font-black rounded-2xl transition-all text-xs uppercase tracking-widest cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 py-4 bg-indigo-600 text-white hover:bg-indigo-700 font-black rounded-2xl transition-all text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isSaving ? "Saving..." : "Save to Archive"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
}

const SECTORS_FOR_LIBRARY = [
  { id: 'all', label: 'All Sectors' },
  { id: 'venture', label: 'Venture Capital' },
  { id: 'economist', label: 'The Economist' },
  { id: 'finance', label: 'Finance' },
  { id: 'entrepreneur', label: 'Startups & Growth' },
  { id: 'foundations', label: 'Foundations & Philanthropy' },
  { id: 'b2g', label: 'Public Sector & Policy' },
  { id: 'legal', label: 'Legal & Compliance' },
  { id: 'academic', label: 'Academic & Empirical' },
  { id: 'strategic', label: 'Strategic & Future' },
  { id: 'adversarial', label: 'Adversarial & Critique' },
  { id: 'analytical', label: 'Analytical & Logic' },
];

export default function App() {
  const { user: authUser, loading: authLoading, signInWithGoogle, signInWithGoogleDrive, logout, signInWithEmail, signUpWithEmail } = useAuth();
  const [loadingOverride, setLoadingOverride] = useState(false);
  const [bypassUser, setBypassUser] = useState<any>(null);

  const guestUser = useMemo(() => {
    let guestId = localStorage.getItem('ef_guest_id');
    if (!guestId) {
      guestId = 'guest_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('ef_guest_id', guestId);
    }
    return {
      uid: guestId,
      email: 'guest@ethersflow.ai',
      displayName: 'Guest Researcher',
      isGuest: true
    };
  }, []);

  const user = authUser || bypassUser || guestUser;
  const [showGooglePrompt, setShowGooglePrompt] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);

  // Global safety failsafe to ensure loading screen never persists indefinitely
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("[App] Final loading failsafe activated");
      setLoadingOverride(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // Separate debug log
  useEffect(() => {
    console.log(`[App] Auth status: authLoading=${authLoading}, user=${user ? 'Authenticated' : 'Anonymous/Null'}`);
  }, [authLoading, user]);

  const loading = authLoading && !loadingOverride && !bypassUser;

  const [currentPlan, setCurrentPlan] = useState<PlanTier>('free');
  const [view, setView] = useState<View>('auth');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const [showPricingDropdown, setShowPricingDropdown] = useState(false);
  const [showResourcesDropdown, setShowResourcesDropdown] = useState(false);
  const [securityActiveTab, setSecurityActiveTab] = useState<'sovereign' | 'telemetry' | 'guardian' | 'gtm'>('sovereign');

  // Synchronize view state with URL hash for direct mapping, search indexing, and Google OAuth Verification
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const validViews: View[] = [
        'main', 'auth', 'privacy', 'terms', 'security', 'about', 'research', 'protocol', 
        'pricing', 'careers', 'projects', 'project-detail', 'customize', 
        'agent-library', 'chats', 'tutorials', 'courses', 'help', 'welcome', 'shared', 'contact',
        'pricing_overview', 'pro_plan_page', 'max_plan_page', 'enterprise_plan_page', 'b2b_api_portal', 'developers', 'api'
      ];
      if (hash === 'sovereign-dashboard') {
        setSecurityActiveTab('sovereign');
        setView('security');
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else if (hash === 'ops-telemetry') {
        setSecurityActiveTab('telemetry');
        setView('security');
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else if (hash === 'guardian-telemetry') {
        setSecurityActiveTab('guardian');
        setView('security');
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else if (hash === 'gtm-pipeline' || hash === 'ops-gtm' || hash === 'sovereign-dashboard' + '#gtm-pipeline') {
        setSecurityActiveTab('gtm');
        setView('security');
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else if (hash && hash !== 'main' && hash !== 'auth' && validViews.includes(hash as View)) {
        setView(hash as View);
        // Scroll to the top when navigating via direct routes or deep links
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else {
        // Always default to landing page ('auth') on root/boot
        setView('auth');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Trigger on boot to capture nested link entry
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Set the window.location.hash whenever state-driven route navigation changes
  useEffect(() => {
    const currentHash = window.location.hash.replace('#', '');
    if (view && view !== currentHash) {
      if (view === 'main') {
        const cleanURL = window.location.pathname + window.location.search;
        window.history.pushState(null, '', cleanURL);
      } else if (view === 'security') {
        const targetHash = 
          securityActiveTab === 'sovereign' ? 'sovereign-dashboard' : 
          securityActiveTab === 'telemetry' ? 'ops-telemetry' :
          securityActiveTab === 'guardian' ? 'guardian-telemetry' : 'gtm-pipeline';
        if (currentHash !== targetHash) {
          window.location.hash = targetHash;
        }
      } else {
        window.location.hash = view;
      }
    }
  }, [view, securityActiveTab]);

  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [customizeActiveTab, setCustomizeActiveTab] = useState('Connectors');
  const [showAccountPopover, setShowAccountPopover] = useState(false);
  const [popoverScreen, setPopoverScreen] = useState<'main' | 'language' | 'learn-more'>('main');
  const [currentLanguage, setCurrentLanguage] = useState('English (United States)');

  const t = (key: string, fallback?: string): string => {
    const langCode = languageCodeMap[currentLanguage] || 'en';
    return translations[langCode]?.[key] || fallback || translations['en']?.[key] || key;
  };
  const [query, setQuery] = useState('');
  const [activePromptSector, setActivePromptSector] = useState<string | null>(null);
  const [showSectorPrompts, setShowSectorPrompts] = useState<boolean>(false);
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [showDrive, setShowDrive] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showAgentLibrary, setShowAgentLibrary] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      alert("Could not access camera.");
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
      setCapturedImage(dataUrl);
      
      // Stop the stream
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const savePhoto = () => {
    if (capturedImage) {
      setAttachedFiles(prev => [...prev, {
        name: `camera-capture-${Date.now()}.png`,
        content: "[Captured Image Data]",
        type: 'image/png'
      }]);
      setShowCamera(false);
      setCapturedImage(null);
    }
  };

  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [sharedDebate, setSharedDebate] = useState<any>(null);

  const handleShare = async (debateData: any) => {
    setIsSharing(true);
    try {
      const response = await fetch('/api/share/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ debate: debateData, userId: user?.uid || 'anonymous' })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const data = await response.json();
      if (data.url) {
        let finalUrl = data.url;
        if (!finalUrl.startsWith('http')) {
          const protocol = window.location.protocol;
          const host = window.location.host;
          finalUrl = `${protocol}//${host}${finalUrl.startsWith('/') ? '' : '/'}${finalUrl}`;
        }
        setShareUrl(finalUrl);
        setShowShareModal(true);
      } else {
        alert("Server failed to generate a share link. Please try again.");
      }
    } catch (error: any) {
      console.error('Share failed:', error);
      alert(`Could not generate share link: ${error.message || 'Unknown network error'}`);
    } finally {
      setIsSharing(false);
    }
  };

  const handleEmailShare = async () => {
    if (!shareEmail.trim()) {
      alert("Please enter a destination email.");
      return;
    }
    if (!results) {
      alert("No active results detected for distribution.");
      return;
    }

    setIsEmailSharing(true);
    try {
      const response = await fetch('/api/share/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: shareEmail, 
          debate: { query: results?.query || query || messages[0]?.content || 'Institutional Research', synthesis: results?.synthesis, analystResponses: results?.analystResponses }, 
          shareUrl,
          userId: user?.uid,
          userName: user?.displayName || 'A researcher',
          userEmail: user?.email || 'N/A'
        })
      });
      
      const data = await response.json();
      if (data.success) {
        if (data.simulated) {
          alert(`[Simulation Mode] Analysis report shared in simulated environment with ${shareEmail}.\n\nTo send live emails, define 'RESEND_API_KEY' in your Environment Settings.`);
        } else {
          alert(`Analysis report successfully shared with ${shareEmail}.`);
        }
        setShareEmail('');
      } else {
        throw new Error(data.error || "Failed to send report.");
      }
    } catch (error: any) {
      console.error('Email share failed:', error);
      alert(`Sharing failed: ${error.message}`);
    } finally {
      setIsEmailSharing(false);
    }
  };
    
  const closeCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
    setCapturedImage(null);
  };
  const [pricingTab, setPricingTab] = useState<'individual' | 'team'>('individual');
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showShareAgentModal, setShowShareAgentModal] = useState(false);
  const [sharedAgentLink, setSharedAgentLink] = useState('');
  const [sharingAgent, setSharingAgent] = useState<AnalystSlot | null>(null);
  const [shareAgentEmail, setShareAgentEmail] = useState('');
  const [isAgentEmailSharing, setIsAgentEmailSharing] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [upgradeBlockedUrl, setUpgradeBlockedUrl] = useState<string | null>(null);
  const [paymentNotification, setPaymentNotification] = useState<{
    message: string;
    type: 'success' | 'info' | 'cancel';
  } | null>(null);

  // Auto-dismiss standard secure payment notification after 7 seconds
  useEffect(() => {
    if (paymentNotification) {
      const timer = setTimeout(() => {
        setPaymentNotification(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [paymentNotification]);
  const [showContactSales, setShowContactSales] = useState(false);
  const [salesName, setSalesName] = useState('');
  const [salesEmail, setSalesEmail] = useState('');
  const [salesCompany, setSalesCompany] = useState('');
  const [salesMessage, setSalesMessage] = useState('');
  const [salesSubmitting, setSalesSubmitting] = useState(false);
  const [salesSuccess, setSalesSuccess] = useState(false);
  const [salesError, setSalesError] = useState('');
  const [slots, setSlots] = useState<AnalystSlot[]>(DEFAULT_PERSONAS);
  const [customAgents, setCustomAgents] = useState<AnalystSlot[]>([]);
  const [workspaceShowCreateModal, setWorkspaceShowCreateModal] = useState(false);
  const [workspaceNewName, setWorkspaceNewName] = useState('');
  const [workspaceNewDesc, setWorkspaceNewDesc] = useState('');
  const [workspaceNewModel, setWorkspaceNewModel] = useState<Model>('openrouter/google/gemini-3.7-flash');
  const [workspaceNewSystemPrompt, setWorkspaceNewSystemPrompt] = useState('Provide a unique perspective on the query. State your confidence (HIGH/MEDIUM/LOW) at the start.');
  const [workspaceIsSaving, setWorkspaceIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysts' | 'synthesis'>('analysts');
  const [synthesisStage, setSynthesisStage] = useState<number>(1);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [results, setResults] = useState<{
    analystResponses: AnalystResponse[];
    synthesis: SynthesisResult | null;
    query?: string;
  } | null>(null);
  const [synthesisTemp, setSynthesisTemp] = useState(0.2);
  const [synthesisEngineModel, setSynthesisEngineModel] = useState<Model>('openrouter/google/gemini-3.7-flash');
  const [history, setHistory] = useState<SavedAnalysis[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [completedAnalysts, setCompletedAnalysts] = useState<Record<string, AnalystResponse>>({});
  const [currentFlashIndex, setCurrentFlashIndex] = useState(0);
  const [debateProgress, setDebateProgress] = useState(0);

  // --- Text-to-Speech Audio State (Fish Audio S2.1 Pro Free) ---
  const [ttsAudioState, setTtsAudioState] = useState<{
    status: 'idle' | 'loading' | 'playing' | 'paused' | 'error';
    title: string;
    audioUrl: string | null;
    audioObj: HTMLAudioElement | null;
    errorMessage: string | null;
    currentTime: number;
    duration: number;
  }>({
    status: 'idle',
    title: '',
    audioUrl: null,
    audioObj: null,
    errorMessage: null,
    currentTime: 0,
    duration: 0
  });

  const summarizeTopicForSpeech = (rawQuery: string): string => {
    if (!rawQuery || !rawQuery.trim()) return "Adversarial Consensus Report";
    const cleaned = rawQuery.trim().replace(/\s+/g, ' ');
    if (cleaned.length <= 140) return cleaned;

    // Extract first 1-2 sentences if short enough
    const sentences = cleaned.split(/(?<=[.!?])\s+/);
    if (sentences.length > 0 && sentences[0].length <= 160) {
      let summary = sentences[0];
      if (sentences.length > 1 && (summary.length + sentences[1].length + 1) <= 200) {
        summary += ' ' + sentences[1];
      }
      return summary;
    }

    // Fallback word boundary truncation for single very long sentence
    return cleaned.slice(0, 140).replace(/\s+\S*$/, '') + '...';
  };

  const getComprehensiveBriefingText = (resultsObj: any, fallbackText: string = '') => {
    if (!resultsObj) return fallbackText || "EthersFlow Multi-Agent Consensus Platform";

    const parts: string[] = [];
    const rawTopic = resultsObj.query || query || "Adversarial Consensus Report";
    const abbreviatedTopic = summarizeTopicForSpeech(rawTopic);

    parts.push(`EthersFlow Intelligence Briefing on: ${abbreviatedTopic}.`);

    // Section 1: Consensus Engine Synthesis
    parts.push(`Section 1: Consensus Engine Synthesis.`);

    if (resultsObj.synthesis) {
      // Consensus Alignment Score Findings & Explanation
      const score = typeof resultsObj.synthesis.confidenceMetric === 'number'
        ? Math.round(resultsObj.synthesis.confidenceMetric)
        : null;

      if (score !== null) {
        let scoreMeaning = '';
        if (score >= 80) {
          scoreMeaning = `This high score reflects strong inter-agent alignment and high analytical conviction across our multi-model swarm.`;
        } else if (score >= 60) {
          scoreMeaning = `This moderate score indicates general alignment on primary market themes, with nuanced differences or minor dissents among analyst models.`;
        } else {
          scoreMeaning = `This score reflects significant debate, epistemic divergence, or contrasting risk scenarios among our specialized analysts.`;
        }
        parts.push(`Consensus Alignment Score: ${score} out of 100. ${scoreMeaning}`);
      }

      if (resultsObj.synthesis.verdict) {
        parts.push(`Strategic Verdict: ${resultsObj.synthesis.verdict}.`);
      }

      if (resultsObj.synthesis.consensus) {
        parts.push(`Consensus Narrative: ${resultsObj.synthesis.consensus}.`);
      }

      if (resultsObj.synthesis.dissents && Array.isArray(resultsObj.synthesis.dissents) && resultsObj.synthesis.dissents.length > 0) {
        const dissentsText = resultsObj.synthesis.dissents
          .map((d: any) => `${d.who || 'Contrarian Analyst'}: ${d.text}`)
          .join(" ");
        parts.push(`Key Dissents and Contrarian Perspectives: ${dissentsText}`);
      }

      if (resultsObj.synthesis.uncertainty) {
        parts.push(`Epistemic Uncertainty and Risk Factors: ${resultsObj.synthesis.uncertainty}.`);
      }
    }

    // Section 2: Individual Source Analyst Reports
    if (resultsObj.analystResponses && Array.isArray(resultsObj.analystResponses) && resultsObj.analystResponses.length > 0) {
      const count = resultsObj.analystResponses.length;
      parts.push(`Section 2: Source Analyst Reports. Presenting all ${count} custom agent reports from our multi-model swarm.`);

      resultsObj.analystResponses.forEach((r: any, idx: number) => {
        const agentTitle = r.persona || `Agent ${idx + 1}`;
        const specStr = r.specialization ? `, Specialization: ${r.specialization}` : '';
        const modelStr = r.model ? `, Powered by model: ${r.model}` : '';
        const confStr = r.confidence ? `, Confidence level: ${r.confidence}` : '';

        parts.push(`Source Report ${idx + 1} of ${count}. Custom Agent: ${agentTitle}${specStr}${modelStr}${confStr}.\n\nReport Findings:\n${r.text}`);
      });
    }

    return parts.join("\n\n");
  };

  const preloadedTtsCacheRef = useRef<Map<string, { promise: Promise<Blob>; blob?: Blob; url?: string }>>(new Map());

  const preloadAudioBrief = (resultsObj: any) => {
    if (!resultsObj || !resultsObj.synthesis) return;
    const textToSpeak = getComprehensiveBriefingText(resultsObj);
    if (!textToSpeak || !textToSpeak.trim()) return;

    const cacheKey = cleanMarkdownForSpeech(textToSpeak);
    if (!cacheKey) return;

    if (preloadedTtsCacheRef.current.has(cacheKey)) {
      console.log("[TTS Preloader] Audio briefing already preloaded or in-flight.");
      return;
    }

    console.log("[TTS Preloader] Starting background pre-synthesis of full briefing audio...");
    const promise = fetchAudioBlobForText(textToSpeak)
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const cachedEntry = preloadedTtsCacheRef.current.get(cacheKey);
        if (cachedEntry) {
          cachedEntry.blob = blob;
          cachedEntry.url = url;
        }
        console.log("[TTS Preloader] Background briefing pre-synthesis READY for instant playback!");
        return blob;
      })
      .catch((err) => {
        console.warn("[TTS Preloader] Background audio pre-synthesis warning:", err);
        preloadedTtsCacheRef.current.delete(cacheKey);
        throw err;
      });

    preloadedTtsCacheRef.current.set(cacheKey, { promise });
  };

  useEffect(() => {
    if (results && results.synthesis) {
      preloadAudioBrief(results);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results]);

  const handlePlayTts = async (textToSpeak: string, title: string = 'Consensus Synthesis Briefing') => {
    if (!textToSpeak || !textToSpeak.trim()) return;

    // Toggle pause/play if same title is active
    if (ttsAudioState.title === title && ttsAudioState.audioObj) {
      if (ttsAudioState.status === 'playing') {
        ttsAudioState.audioObj.pause();
        setTtsAudioState(prev => ({ ...prev, status: 'paused' }));
        return;
      } else if (ttsAudioState.status === 'paused') {
        ttsAudioState.audioObj.play();
        setTtsAudioState(prev => ({ ...prev, status: 'playing' }));
        return;
      }
    }

    // Stop previous audio if playing
    if (ttsAudioState.audioObj) {
      ttsAudioState.audioObj.pause();
      if (ttsAudioState.audioUrl) {
        URL.revokeObjectURL(ttsAudioState.audioUrl);
      }
    }

    setTtsAudioState({
      status: 'loading',
      title,
      audioUrl: null,
      audioObj: null,
      errorMessage: null,
      currentTime: 0,
      duration: 0
    });

    try {
      const cacheKey = cleanMarkdownForSpeech(textToSpeak);
      let blob: Blob;
      let url: string;

      const cachedEntry = preloadedTtsCacheRef.current.get(cacheKey);
      if (cachedEntry) {
        if (cachedEntry.blob && cachedEntry.url) {
          console.log("[TTS Playback] Instant 0ms playback from preloaded background synthesis cache!");
          blob = cachedEntry.blob;
          url = cachedEntry.url;
        } else {
          console.log("[TTS Playback] Awaiting in-flight background pre-synthesis...");
          blob = await cachedEntry.promise;
          url = cachedEntry.url || URL.createObjectURL(blob);
          cachedEntry.url = url;
        }
      } else {
        console.log("[TTS Playback] Fetching fresh TTS audio...");
        const promise = fetchAudioBlobForText(textToSpeak);
        preloadedTtsCacheRef.current.set(cacheKey, { promise });
        blob = await promise;
        url = URL.createObjectURL(blob);
        preloadedTtsCacheRef.current.set(cacheKey, { promise, blob, url });
      }

      const audio = new Audio(url);

      audio.onloadedmetadata = () => {
        setTtsAudioState(prev => ({ ...prev, duration: audio.duration }));
      };

      audio.ontimeupdate = () => {
        setTtsAudioState(prev => ({ ...prev, currentTime: audio.currentTime }));
      };

      audio.onended = () => {
        setTtsAudioState(prev => ({ ...prev, status: 'idle', currentTime: 0 }));
      };

      audio.onerror = () => {
        setTtsAudioState(prev => ({
          ...prev,
          status: 'error',
          errorMessage: 'Audio playback failed.'
        }));
      };

      await audio.play();
      setTtsAudioState({
        status: 'playing',
        title,
        audioUrl: url,
        audioObj: audio,
        errorMessage: null,
        currentTime: 0,
        duration: audio.duration || 0
      });
    } catch (err: any) {
      console.error("[TTS Playback Error]:", err);
      setTtsAudioState(prev => ({
        ...prev,
        status: 'error',
        errorMessage: err.message || 'Fish Audio generation error.'
      }));
    }
  };

  const handleStopTts = () => {
    if (ttsAudioState.audioObj) {
      ttsAudioState.audioObj.pause();
      if (ttsAudioState.audioUrl) {
        URL.revokeObjectURL(ttsAudioState.audioUrl);
      }
    }
    setTtsAudioState({
      status: 'idle',
      title: '',
      audioUrl: null,
      audioObj: null,
      errorMessage: null,
      currentTime: 0,
      duration: 0
    });
  };

  useEffect(() => {
    if (!isAnalyzing) {
      setDebateProgress(0);
      return;
    }
    
    // Set an initial 5% progress to show immediate activity right from the start
    setDebateProgress(5);

    const interval = setInterval(() => {
      setDebateProgress(prev => {
        // Use an exponential easing function towards 99% so it moves smoothly and never hits 100% until done
        const target = 99;
        const diff = target - prev;
        const easingFactor = 0.02; // Smooth 2% of the remaining distance per 100ms
        const step = diff * easingFactor;
        
        // Ensure a tiny, continuous progression so it feels alive and never stagnant
        const next = prev + Math.max(0.01, step);
        return Math.min(target, next);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isAnalyzing]);

  useEffect(() => {
    if (!isAnalyzing) return;
    const interval = setInterval(() => {
      setCurrentFlashIndex(prev => prev + 1);
    }, 2500);
    return () => clearInterval(interval);
  }, [isAnalyzing]);
  const [emailInput, setEmailInput] = useState('');
  const [passInput, setPassInput] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [config, setConfig] = useState<{ groq: boolean; openai: boolean; gemini: boolean; vertex: boolean } | null>(null);

  useEffect(() => {
    let isMounted = true;
    let attempts = 0;
    const maxAttempts = 3;

    const checkHealth = async () => {
      while (attempts < maxAttempts && isMounted) {
        try {
          const res = await fetch('/api/health');
          if (res.ok) {
            const data = await res.json();
            if (isMounted) {
              setConfig({
                groq: !!(data.groq ?? true),
                openai: !!(data.openai ?? true),
                gemini: !!(data.google ?? data.gemini ?? true),
                vertex: !!(data.vertex ?? false)
              });
            }
            return;
          }
        } catch {
          // Retry on network/cold-start error
        }
        attempts++;
        if (attempts < maxAttempts && isMounted) {
          await new Promise(r => setTimeout(r, 1000 * attempts));
        }
      }
      if (isMounted) {
        // Safe default config fallback when backend is starting or offline
        setConfig({ groq: true, openai: true, gemini: true, vertex: false });
      }
    };

    checkHealth();
    return () => {
      isMounted = false;
    };
  }, []);
  const [isCheckingQuota, setIsCheckingQuota] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authPermissionError, setAuthPermissionError] = useState(false);

  const [expandedAnalyst, setExpandedAnalyst] = useState<string | null>(null);
  const [expandedSpecs, setExpandedSpecs] = useState<Record<string, boolean>>({});
  const [showReasoning, setShowReasoning] = useState(false);
  const [showVectorInspector, setShowVectorInspector] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [analystCopyId, setAnalystCopyId] = useState<string | null>(null);
  const [isDriveConnected, setIsDriveConnected] = useState(() => {
    try {
      return localStorage.getItem('ethersflow_drive_connected') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [folderHistory, setFolderHistory] = useState<string[]>([]);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    let timeoutId: any;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowWidth((prev) => {
          if (prev === window.innerWidth) return prev;
          return window.innerWidth;
        });
      }, 150);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  const isSyncingWithFirestoreRef = useRef(false);
  const previousProjectsRef = useRef<Project[]>([]);
  const deletedCustomAgentIdsRef = useRef<Set<string>>(new Set());

  // Load and Migrate projects when authUser transitions (e.g., login or logout)
  useEffect(() => {
    const syncProjectsOnAuthChange = async () => {
      if (!authUser || !auth.currentUser || authUser.uid === 'dev-bypass-user') {
        // If guest (logged out), fall back strictly to local storage
        try {
          const stored = localStorage.getItem("ethersflow_projects");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              setProjects(parsed);
              previousProjectsRef.current = parsed;
              return;
            }
          }
          setProjects([]);
          previousProjectsRef.current = [];
        } catch (e) {
          console.warn("Local projects fallback load:", e);
        }
        return;
      }

      // If active user is signed in, ensure auth is fully ready and has a valid uid
      if (!authUser || !authUser.uid || !auth.currentUser || auth.currentUser.uid !== authUser.uid) {
        return;
      }

      try {
        isSyncingWithFirestoreRef.current = true;
        console.log(`[Firestore Sync] Synchronizing accounts projects for user: ${authUser.uid}`);
        
        const projColRef = collection(db, "users", authUser.uid, "projects");
        const querySnap = await getDocs(projColRef);
        
        const dbProjects: Project[] = [];
        querySnap.forEach((docSnap) => {
          dbProjects.push({
            id: docSnap.id,
            ...docSnap.data()
          } as Project);
        });

        // Guest-to-User Sync & Migration
        // Any projects created while in logged-out mode are populated into online account
        let localProjects: Project[] = [];
        try {
          const stored = localStorage.getItem("ethersflow_projects");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              localProjects = parsed;
            }
          }
        } catch (localErr) {
          console.error("Failed parsing local projects during guest-to-user migration:", localErr);
        }

        const mergedProjects = [...dbProjects];
        let hasMergedNew = false;

        if (Array.isArray(localProjects)) {
          for (const localProj of localProjects) {
            const alreadyExists = dbProjects.some(p => p.id === localProj.id);
            if (!alreadyExists && localProj.id && localProj.name) {
              console.log(`[Firestore Sync] Migrating offline project ${localProj.name} (${localProj.id}) to Firestore...`);
              const { setDoc, doc } = await import('firebase/firestore');
              await setDoc(doc(db, "users", authUser.uid, "projects", localProj.id), localProj);
              mergedProjects.push(localProj);
              hasMergedNew = true;
            }
          }
        }

        setProjects(mergedProjects);
        previousProjectsRef.current = mergedProjects;
        
        if (hasMergedNew) {
          console.log("[Firestore Sync] Successfully migrated guest projects to permanent cloud account storage.");
        }
      } catch (e: any) {
        console.warn("Notice: Firestore persistent user project sync unavailable, using local cache:", e?.message || e);
        // Resubscribe to local storage fallback
        try {
          const stored = localStorage.getItem("ethersflow_projects");
          if (stored) {
            const parsed = JSON.parse(stored) as Project[];
            setProjects(parsed);
            previousProjectsRef.current = parsed;
          }
        } catch (err) {}
      } finally {
        isSyncingWithFirestoreRef.current = false;
      }
    };

    syncProjectsOnAuthChange();
  }, [authUser]);

  // Synchronize state mutations with Firestore and LocalStorage safely without loops
  useEffect(() => {
    // 1. Always back up locally for instant boot latency
    try {
      localStorage.setItem("ethersflow_projects", JSON.stringify(projects));
    } catch (e) {
      console.error("Failed backing up projects to localStorage:", e);
    }

    // 2. If logged out, invalid session, or currently fetching projects from cloud, prevent update triggers
    if (!authUser || !authUser.uid || !auth.currentUser || auth.currentUser.uid !== authUser.uid || authUser.uid === 'dev-bypass-user' || isSyncingWithFirestoreRef.current) {
      previousProjectsRef.current = projects;
      return;
    }

    const syncMutationsToFirestore = async () => {
      try {
        const prevList = previousProjectsRef.current;
        const currentList = projects;
        
        const { setDoc, deleteDoc, doc } = await import('firebase/firestore');

        // Capture newly added or modified projects, saving individual records precisely
        for (const currentProj of currentList) {
          if (!currentProj.id) continue;
          
          const prevProj = prevList.find(p => p.id === currentProj.id);
          const hasChanged = !prevProj || JSON.stringify(prevProj) !== JSON.stringify(currentProj);
          
          if (hasChanged) {
            console.log(`[Firestore Sync] Saving project update to cloud: ${currentProj.name || currentProj.id}`);
            await setDoc(doc(db, "users", authUser.uid, "projects", currentProj.id), currentProj);
          }
        }

        // Capture completed deletions, matching state arrays
        for (const prevProj of prevList) {
          if (!prevProj.id) continue;
          
          const exists = currentList.some(p => p.id === prevProj.id);
          if (!exists) {
            console.log(`[Firestore Sync] Erasing project from cloud: ${prevProj.name || prevProj.id}`);
            await deleteDoc(doc(db, "users", authUser.uid, "projects", prevProj.id));
          }
        }

        previousProjectsRef.current = projects;
      } catch (err: any) {
        console.error("[Firestore Sync] Error saving project mutations to Firestore:", err);
      }
    };

    syncMutationsToFirestore();
  }, [projects, authUser]);
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [newResourceType, setNewResourceType] = useState<'link' | 'file' | 'drive' | 'text'>('link');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [isFetchingDrive, setIsFetchingDrive] = useState(false);
  const [hasFetchedDrive, setHasFetchedDrive] = useState(false);

  const fetchDriveFiles = async (folderId: string = 'root', forceAuth = false) => {
    const actualFolderId = typeof folderId === 'string' ? folderId : 'root';
    setIsFetchingDrive(true);
    setDriveError(null);
    try {
      let token = getDriveAccessToken();
      if (!token && forceAuth) {
        await signInWithGoogleDrive();
        token = getDriveAccessToken();
      }
      if (!token) {
        setIsDriveConnected(false);
        throw new Error("Please connect your Google Drive account first.");
      }

      const res = await fetch(`/api/drive/list?folderId=${actualFolderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.files) {
        setDriveFiles(data.files);
        setHasFetchedDrive(true);
        setIsDriveConnected(true);
        setCurrentFolderId(actualFolderId);
      } else {
        throw new Error(data.error || data.details?.message || "Failed to list files");
      }
    } catch (e: any) {
      console.error("Drive Fetch Error:", e);
      if (e.message.includes('401') || e.message.includes('403') || e.message.includes('token') || e.message.includes('connect')) {
        setIsDriveConnected(false);
      }
      setDriveError(e.message || "Failed to fetch files from Google Drive.");
    } finally {
      setIsFetchingDrive(false);
    }
  };

  const navigateUpDriveFolder = () => {
    if (folderHistory.length > 0) {
      const prev = [...folderHistory];
      const parentId = prev.pop()!;
      setFolderHistory(prev);
      fetchDriveFiles(parentId);
    }
  };

  const handleDriveItemClick = (file: any, forProject = false) => {
    if (file.mimeType === "application/vnd.google-apps.folder") {
      setFolderHistory(prev => [...prev, currentFolderId]);
      fetchDriveFiles(file.id);
    } else {
      downloadDriveFile(file.id, forProject);
    }
  };

  useEffect(() => {
    const isDriveActive = showDrive || (showAddResourceModal && newResourceType === 'drive');
    if (isDriveActive && isDriveConnected && driveFiles.length === 0 && !isFetchingDrive && !driveError) {
      fetchDriveFiles(currentFolderId || 'root', false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDrive, showAddResourceModal, newResourceType, isDriveConnected]);

  useEffect(() => {
    if (results && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [results]);

  useEffect(() => {
    const handleUrlLoading = async () => {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      
      if (path.startsWith('/share/')) {
        const shareId = path.split('/').pop();
        if (shareId) {
          setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Fetching shared consensus: ${shareId}`]);
          try {
            const res = await fetch(`/api/share/${shareId}`);
            const data = await res.json();
            if (data.debate) {
              setResults(data.debate);
              setPrompt(data.debate.query || '');
              setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Shared consensus loaded successfully.`]);
            }
          } catch (e) {
            console.error("Shared load failed", e);
          }
        }
      } else if (path.startsWith('/invite/')) {
        const projectId = path.split('/').pop();
        const projectName = params.get('projectName');
        if (projectId) {
          setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Accessing invited project: ${projectName || projectId}`]);
          try {
            const res = await fetch(`/api/project/${projectId}`);
            if (res.ok) {
              const sharedProject = await res.json();
              setProjects(prev => {
                if (prev.some(p => p.id === sharedProject.id)) return prev;
                return [...prev, sharedProject];
              });
              setActiveProjectId(sharedProject.id);
              setView('project-detail');
              setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Project context synced successfully.`]);
            } else {
              throw new Error("Project not found or expired");
            }
          } catch (e: any) {
            console.error("Invite load failed", e);
            setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] FAIL: Could not synchronize project context.`]);
          }
        }
      }
    };
    handleUrlLoading();
  }, []);

  const downloadDriveFile = async (fileId: string, forProject = false) => {
    setIsAddingResource(true);
    setIsExtracting(true);
    try {
      let token = getDriveAccessToken();
      if (!token) {
        await signInWithGoogleDrive();
        token = getDriveAccessToken();
      }
      if (!token) throw new Error("No token");

      const res = await fetch(`/api/drive/download/${fileId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.text) {
        if (forProject && activeProjectId) {
          setProjects(prev => prev.map(p => p.id === activeProjectId ? {
            ...p,
            resources: [...(p.resources || []), {
              id: Date.now().toString(),
              name: data.name,
              type: 'drive',
              updatedAt: Date.now(),
              content: data.text
            }]
          } : p));
          setShowAddResourceModal(false);
          setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Project Resource (Drive): ${data.name} synced.`]);
        } else {
          // Add to main workspace attachments
          const newFile: AttachedFile = {
            id: Date.now().toString() + Math.random(),
            name: data.name,
            size: data.text.length * 2, // approximation
            type: 'text/plain',
            content: data.text,
            status: 'ready'
          };
          setAttachedFiles(prev => [...prev, newFile]);
          setShowDrive(false);
          setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Workspace attachment synced from Drive: ${data.name}`]);
        }
      } else {
        throw new Error(data.error || "Failed to download content");
      }
    } catch (e: any) {
      console.error("Download error", e);
      alert(`Drive sync failed: ${e.message}`);
    } finally {
      setIsAddingResource(false);
      setIsExtracting(false);
    }
  };
  const [showSynthesisConfig, setShowSynthesisConfig] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showInviteTeamModal, setShowInviteTeamModal] = useState(false);
  const [showConfigureAgentsModal, setShowConfigureAgentsModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newResourceName, setNewResourceName] = useState('');
  const [newResourceContent, setNewResourceContent] = useState('');
  const [newTeamEmail, setNewTeamEmail] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [isEmailSharing, setIsEmailSharing] = useState(false);
  const [isInvitingTeam, setIsInvitingTeam] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [newProjectInstructions, setNewProjectInstructions] = useState('');
  const resultsRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const createProject = () => {
    if (!newProjectName.trim()) return;
    const newProjId = Date.now().toString();
    const newProject: Project = {
      id: newProjId,
      name: newProjectName,
      description: newProjectDesc,
      updatedAt: Date.now(),
      resources: [],
      team: [{ id: user?.uid || '1', email: user?.email || 'You', role: 'owner' }],
      instructions: ''
    };
    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProjId);
    setNewProjectName('');
    setNewProjectDesc('');
    setShowCreateProjectModal(false);
    setView('main');
    setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Project "${newProjectName}" created successfully. Grounding environment active.`]);
  };

  const [isAddingResource, setIsAddingResource] = useState(false);
  const resourceFileInputRef = React.useRef<HTMLInputElement>(null);

  const removeResource = (resId: string) => {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p => p.id === activeProjectId ? {
      ...p,
      resources: (p.resources || []).filter(r => r.id !== resId)
    } : p));
    setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Project Resource Removed.`]);
  };

  const addResource = async () => {
    if (!newResourceName.trim() || !activeProjectId) return;
    setIsAddingResource(true);
    
    try {
      let content = "";
      let finalName = newResourceName;

      if (newResourceType === 'link') {
        try {
          const res = await fetch('/api/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: newResourceName })
          });
          
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          
          const text = await res.text();
          let data;
          try {
            data = JSON.parse(text);
          } catch (jsonErr) {
            if (text.includes("Service Unavailable") || text.includes("Service Temp")) {
              throw new Error("The scraping service is temporarily unavailable. Institutional or secured reports should be added via 'Custom Text' instead.");
            }
            throw new Error(`Failed to parse response: ${text.substring(0, 100)}`);
          }
          
          if (data && data.text) {
            content = data.text;
            finalName = data.title || newResourceName;
          } else {
            throw new Error(data?.message || "No content extracted from URL.");
          }
        } catch (fetchErr: any) {
          console.warn("[Scraper Error] Falling back to manual content:", fetchErr);
          let confirmManual = false;
          try {
            confirmManual = window.confirm(
              `Automated link scraping failed: ${fetchErr.message || fetchErr}\n\nThis usually occurs if the institutional URL blocks external bots. Would you like to create this as a manual-paste resource instead?`
            );
          } catch (confirmErr) {
            console.warn("window.confirm blocked by sandbox/iframe:", confirmErr);
            // Default to true inside sandboxed iframes to gracefully guide the user to manual paste instead of crashing
            confirmManual = true;
          }
          if (confirmManual) {
            setNewResourceType('text');
            setIsAddingResource(false);
            return;
          }
          throw fetchErr;
        }
      } else if (newResourceType === 'text') {
        content = newResourceContent;
      }

      setProjects(prev => prev.map(p => p.id === activeProjectId ? {
        ...p,
        resources: [...(p.resources || []), {
          id: Date.now().toString(),
          name: finalName,
          type: newResourceType,
          updatedAt: Date.now(),
          content: content,
          url: newResourceType === 'link' ? newResourceName : undefined
        }]
      } : p));
      setNewResourceName('');
      setNewResourceContent('');
      setShowAddResourceModal(false);
      setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Project Resource Added: ${finalName} (${newResourceType})`]);
    } catch (e: any) {
      console.error("Resource error", e);
      alert(`Failed to process resource: ${e.message}`);
    } finally {
      setIsAddingResource(false);
    }
  };

  const handleResourceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeProjectId) return;
    
    setIsAddingResource(true);
    try {
      let extractedText = "";
      const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
      const isText = file.type.startsWith('text/') || file.name.toLowerCase().endsWith('.txt') || file.name.toLowerCase().endsWith('.json') || file.name.toLowerCase().endsWith('.md');

      if (isPdf) {
        setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] IN-BROWSER PIPELINE: Reading PDF locally and tokenizing ${file.name}...`]);
        try {
          extractedText = await extractTextFromPdfClient(file, (percent) => {
            setAgentLogs(prev => {
              const cleanLogs = prev.filter(log => !log.includes('Extraction Progress:'));
              return [...cleanLogs, `[${new Date().toLocaleTimeString()}] Extraction Progress: ${percent}%`];
            });
          });
        } catch (clientErr: any) {
          console.warn('[handleResourceFileUpload] Client PDF extraction fallback:', clientErr);
        }

        if (!extractedText || extractedText.length < 20) {
          setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] GATEWAY PIPELINE: Routing PDF to cloud parser...`]);
          const formData = new FormData();
          formData.append('pdf', file);
          const res = await fetch('/api/pdf/extract', { method: 'POST', body: formData }).catch(err => {
            if (err.message === 'Failed to fetch') {
              throw new Error("Network connection or proxy body size limit exceeded.");
            }
            throw err;
          });
          if (!res.ok) throw new Error(`Cloud extraction failed with status code ${res.status}`);
          const data = await res.json();
          extractedText = data.text;
        }
      } else if (isText) {
        setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] IN-BROWSER PIPELINE: Loading text content natively...`]);
        extractedText = await file.text();
      } else {
        setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] GATEWAY PIPELINE: Sending document for cloud preprocessing...`]);
        const formData = new FormData();
        formData.append('pdf', file);

        const res = await fetch('/api/pdf/extract', { method: 'POST', body: formData }).catch(err => {
          if (err.message === 'Failed to fetch') {
            throw new Error("Network connection or proxy body size limit exceeded.");
          }
          throw err;
        });
        
        if (!res.ok) {
          if (res.status === 413) {
            throw new Error(`The file (${(file.size / 1024 / 1024).toFixed(2)}MB) is too large for the network gateway. Standard PDFs are processed automatically on the client-side; please ensure your file is a digital document format.`);
          }
          throw new Error(`Cloud extraction failed with status code ${res.status}`);
        }
        
        const data = await res.json();
        extractedText = data.text;
      }
      
      setProjects(prev => prev.map(p => p.id === activeProjectId ? {
        ...p,
        resources: [...(p.resources || []), {
          id: Date.now().toString(),
          name: file.name,
          type: 'file',
          updatedAt: Date.now(),
          content: extractedText
        }]
      } : p));
      
      setShowAddResourceModal(false);
      setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Project Resource Created: ${file.name} (${extractedText.length} characters loaded)`]);
    } catch (e: any) {
      console.error("Upload error", e);
      const confirmManual = window.confirm(
        `Document analysis failed: ${e.message}\n\nWould you like to manually copy and paste the text content for this resource instead?`
      );
      if (confirmManual) {
        setNewResourceType('text');
        setNewResourceName(file.name.replace(/\.[^/.]+$/, "")); // strip extension as default title
        setNewResourceContent("");
        setShowAddResourceModal(true);
      }
    } finally {
      setIsAddingResource(false);
      if (resourceFileInputRef.current) resourceFileInputRef.current.value = '';
    }
  };

  const inviteTeam = async () => {
    setInviteError(null);
    setInviteSuccess(null);

    const emailToInvite = newTeamEmail.trim();
    if (!emailToInvite) {
      setInviteError("Please enter a destination email.");
      return;
    }
    
    if (!activeProjectId) {
      console.error("[Invite] activeProjectId is null");
      setInviteError("Please select a project first.");
      return;
    }

    const project = projects.find(p => p.id === activeProjectId);
    if (!project) {
      console.error("[Invite] project not found for id:", activeProjectId);
      setInviteError("Selected project context is missing.");
      return;
    }

    setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] sharing access for ${emailToInvite}...`]);
    
    setIsInvitingTeam(true);
    setInviteLink('');
    try {
      // Create project with current work context
      const projectWithContext = {
        ...project,
        activeAnalysis: results ? { query, results, analystResponses } : null
      };

      await fetch('/api/project/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: projectWithContext, userId: user?.uid })
      });

      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailToInvite,
          projectName: project.name,
          projectId: project.id,
          inviterName: user?.displayName || user?.email || 'A teammate'
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || data.message || "Invite delivery failed");
      }

      if (data.url) {
        setInviteLink(data.url);
      }
      
      setProjects(prev => prev.map(p => p.id === activeProjectId ? {
        ...p,
        team: [...(p.team || []), {
          id: Date.now().toString(),
          email: emailToInvite,
          role: 'contributor'
        }]
      } : p));
      
      setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Invitation confirmed by delivery protocol for ${emailToInvite}.`]);
      if (!data.simulated) {
        setInviteSuccess(`Invitation successfully sent to ${emailToInvite}.`);
        setNewTeamEmail('');
      } else {
        setInviteSuccess(`Simulation Mode: Partner registered for ${emailToInvite}. Since no RESEND_API_KEY is configured in your platform settings, a physical email was simulated. Feel free to copy and share the Direct Invite Link below.`);
        setNewTeamEmail('');
      }
    } catch (e: any) {
      console.error("Invite error", e);
      setInviteError(`Could not send invite: ${e.message}`);
    } finally {
      setIsInvitingTeam(false);
    }
  };

  const updateProjectInstructions = () => {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, instructions: newProjectInstructions } : p));
    setShowConfigureAgentsModal(false);
    alert("Global project instructions updated.");
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const uploadMenuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (uploadMenuRef.current && !uploadMenuRef.current.contains(event.target as Node)) {
        setShowUploadMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');
    const sessionId = urlParams.get('session_id');
    
    if (success && sessionId) {
      if (!user) return; // Wait until auth user is resolved to avoid undefined userId
      const verifySession = async () => {
        try {
          const response = await fetch('/api/verify-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, userId: user.uid })
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setPaymentNotification({
                message: `Upgrade successful! Your plan has been elevated to ${data.plan.toUpperCase()}.`,
                type: 'success'
              });
              setCurrentPlan(data.plan as any);
              if (user) {
                const refreshedUsage = await fetchUsage(user.uid);
                setUsage(refreshedUsage);
              }
            } else {
              setPaymentNotification({
                message: "Upgrade successful! Your new capabilities are being provisioned.",
                type: 'success'
              });
              if (user) {
                const refreshedUsage = await fetchUsage(user.uid);
                setUsage(refreshedUsage);
                setCurrentPlan(refreshedUsage.plan as any);
              }
            }
          }
        } catch (err) {
          console.error("Session verification failed:", err);
          setPaymentNotification({
            message: "Upgrade successful! We are syncing your account changes now.",
            type: 'info'
          });
          if (user) {
            fetchUsage(user.uid).then(data => {
              setUsage(data);
              setCurrentPlan(data.plan as any);
            });
          }
        } finally {
          window.history.replaceState({}, document.title, "/");
        }
      };
      verifySession();
    } else if (success) {
      setPaymentNotification({
        message: "Upgrade successful! Your new capabilities are being provisioned.",
        type: 'success'
      });
      // Clear URL params
      window.history.replaceState({}, document.title, "/");
      // Refresh usage manually
      if (user) {
        fetchUsage(user.uid).then(data => {
          setUsage(data);
          setCurrentPlan(data.plan as any);
        });
      }
    }
    
    if (canceled) {
      setPaymentNotification({
        message: "Upgrade canceled. You can try again whenever you are ready.",
        type: 'cancel'
      });
      window.history.replaceState({}, document.title, "/");
    }

    const shareId = urlParams.get('share');
    const inviteId = urlParams.get('invite') || window.location.pathname.match(/\/invite\/([^\/\?]+)/)?.[1];

    if (shareId) {
      const fetchShared = async () => {
        try {
          const res = await fetch(`/api/share/${shareId}`);
          if (res.ok) {
            const data = await res.json();
            setSharedDebate(data.debate);
            setView('shared');
          } else {
            console.error("Shared debate not found");
          }
        } catch (e) {
          console.error("Error fetching shared debate", e);
        }
      };
      fetchShared();
    }

    if (inviteId) {
      const fetchInvite = async () => {
        try {
          const res = await fetch(`/api/project/${inviteId}`);
          if (res.ok) {
            const projectData = await res.json();
            // If user is already logged in, we could add this project to their list
            // For now, let's just show it
            setProjects(prev => {
              if (prev.find(p => p.id === inviteId)) return prev;
              return [...prev, projectData];
            });
            setActiveProjectId(inviteId);
            setView('project-detail');
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname.replace(/\/invite\/[^\/]+/, ''));
          }
        } catch (e) {
          console.error("Error fetching invite", e);
        }
      };
      fetchInvite();
    }
  }, [user]);

  // Connection check & Usage fetch
  useEffect(() => {
    if (!user) {
      setHistory([]);
      setUsage(null);
      return;
    }

    // Bypass real Firebase for dev account to avoid "insufficient permissions" or "suspension" errors
    if (user.uid === 'dev-bypass-user') {
      setUsage({
        plan: 'pro',
        current: 5,
        limit: 100,
        remaining: 95,
        overLimit: false
      });
      setCurrentPlan('pro');
      setHistory([
        {
          id: 'mock-1',
          query: 'Is adversarial consensus effective for reducing AI hallucinations?',
          timestamp: Date.now() - 1000 * 60 * 60 * 2,
          analystResponses: [],
          synthesis: { 
            consensus: 'Based on multi-model debate, the consensus is that adversarial structures significantly reduce reasoning drift.', 
            dissents: [],
            uncertainty: 'Low-to-medium logic variance detected.',
            verdict: 'Deploy adversarial consensus for high-stakes decisions.',
            confidenceMetric: 88,
            uniformityWarning: false,
            sources: []
          },
          messages: []
        }
      ]);
      return;
    }

    const initUserData = async () => {
      try {
        let usageData = await fetchUsage(user.uid);
        const lowerEmail = user.email ? user.email.toLowerCase() : '';
        if (lowerEmail === 'ethersflow.dev@gmail.com' || lowerEmail === 'ryan.milisits@gmail.com' || lowerEmail === 'craig@beerwego.com' || lowerEmail === 'jim@brc-llc.com') {
          usageData = {
            plan: 'enterprise',
            limit: 100000,
            current: usageData.current || 0,
            remaining: 100000,
            overLimit: false
          };

          // Synchronize to Firestore to ensure permanent enterprise-level database tier
          try {
            const { setDoc, doc } = await import('firebase/firestore');
            const userDocRef = doc(db, "users", user.uid);
            await setDoc(userDocRef, {
              plan: 'enterprise',
              email: lowerEmail,
              updatedAt: new Date()
            }, { merge: true });
            console.log(`[Firestore Sync] Auto-upgraded user ${lowerEmail} to enterprise in database.`);
          } catch (dbSyncErr) {
            console.warn("[Firestore Sync] Firestore write of enterprise plan failed:", dbSyncErr);
          }
        }
        setUsage(usageData);
        setCurrentPlan(usageData.plan as any);

        // Retrieve the enterprise custom claims tenant key if set
        try {
          const tokenRes = await user.getIdTokenResult();
          if (tokenRes.claims?.tenantId) {
            setTenantId(tokenRes.claims.tenantId as string);
          } else {
            setTenantId(null);
          }
        } catch (claimsErr) {
          console.warn("[App] Claims retrieval bypass:", claimsErr);
        }
      } catch (e: any) {
        console.error("Failed to fetch initial usage", e);
        // If it's a 404 or something, maybe the server isn't ready. 
        // We can show a small warning or just log it.
        if (e.message.includes("404")) {
          console.warn("Usage API returned 404. Server might still be starting or route is missing.");
        }
      }
    };
    initUserData();

    if (!authUser || !auth.currentUser || authUser.uid === 'dev-bypass-user') {
      // For guest/unauthenticated users, rely on localStorage fallback (Firestore requires auth)
      try {
        const stored = localStorage.getItem(`ethersflow_history_${user.uid}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setHistory(parsed);
          }
        }
      } catch (e) {
        console.warn("Could not load history from localStorage", e);
      }
      return;
    }

    const q = tenantId
      ? firestoreQuery(
          collection(db, 'analyses'),
          where('tenantId', '==', tenantId)
        )
      : firestoreQuery(
          collection(db, 'analyses'),
          where('userId', '==', authUser.uid)
        );

     const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SavedAnalysis));
      // Perform robust sorting client-side to prevent Firestore "Missing or insufficient permissions" due to index requirements
      docs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      // Limit to 50 items max
      const limitedDocs = docs.slice(0, 50);
      setHistory(limitedDocs);
      try {
        localStorage.setItem(`ethersflow_history_${authUser.uid}`, JSON.stringify(limitedDocs));
      } catch (e) {
        console.warn("Could not cache history to localStorage", e);
      }
    }, (error) => {
      console.warn("Firestore collection subscription notice, active local storage fallback:", error);
      try {
        const stored = localStorage.getItem(`ethersflow_history_${authUser.uid}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setHistory(parsed);
          }
        }
      } catch (lsErr) {
        console.warn("Local storage history load:", lsErr);
      }
    });

    return unsubscribe;
  }, [authUser, user, tenantId]);

  // Synchronize Custom Saved Agents from Firestore
  useEffect(() => {
    const effectiveUserId = user?.uid || 'guest';

    // Load initial fallback from localStorage immediately for instantaneous UX
    try {
      const cached = localStorage.getItem(`ethersflow_custom_agents_${effectiveUserId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setCustomAgents(parsed);
        }
      } else {
        setCustomAgents([]);
      }
    } catch (err) {
      console.warn("Could not load custom agents from localStorage", err);
    }

    if (!authUser || !auth.currentUser || authUser.uid === 'dev-bypass-user') {
      // For guest or bypass users, rely purely on local state and localStorage
      return;
    }

    const q = firestoreQuery(
      collection(db, 'custom_agents'),
      where('userId', '==', authUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbAgents = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AnalystSlot));
      
      setCustomAgents((prevAgents) => {
        // Start with database-retrieved agents, filtering out any that have been marked deleted
        const activeDbAgents = dbAgents.filter(a => !deletedCustomAgentIdsRef.current.has(a.id));
        const merged = [...activeDbAgents];

        // Merge any local-only agents that are not yet on the server and have not been deleted
        prevAgents.forEach((localAgent) => {
          if (!deletedCustomAgentIdsRef.current.has(localAgent.id) && !merged.some((dbA) => dbA.id === localAgent.id)) {
            const localUserId = (localAgent as any).userId || (localAgent as any).ownerId;
            if (!localUserId || localUserId === authUser.uid) {
              merged.push(localAgent);
            }
          }
        });

        // Cache the fully merged and resolved list of custom agents to local storage
        try {
          localStorage.setItem(`ethersflow_custom_agents_${authUser.uid}`, JSON.stringify(merged));
        } catch (err) {
          console.warn("Could not cache custom agents to localStorage", err);
        }
        return merged;
      });
    }, (error) => {
      console.warn("Firestore custom agents subscription notice, active local storage fallback:", error);
      try {
        const cached = localStorage.getItem(`ethersflow_custom_agents_${authUser.uid}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            setCustomAgents(parsed);
          }
        }
      } catch (err) {
        console.warn("Local storage custom agents fallback:", err);
      }
    });

    return unsubscribe;
  }, [authUser, user]);

  // Load shared agent if present in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedAgentId = params.get('sharedAgent');
    if (sharedAgentId) {
      const fetchSharedAgent = async () => {
        try {
          const agentDoc = await getDoc(doc(db, 'custom_agents', sharedAgentId));
          if (agentDoc.exists()) {
            const agentData = agentDoc.data();
            // Check if already in slots to avoid duplicates
            if (!slots.some(s => s.name === agentData.name)) {
              let updatedSlots = [...slots];
              const activeSlots = updatedSlots.filter(s => s.active);
              if (currentPlan === 'free' && activeSlots.length >= 3) {
                // Find the first default agent that is active, and deactivate it to make space
                const defaultActiveIndex = updatedSlots.findIndex(s => s.active && s.id !== 'shared');
                if (defaultActiveIndex >= 0) {
                  updatedSlots[defaultActiveIndex] = { ...updatedSlots[defaultActiveIndex], active: false };
                }
              }

              const newSlot: AnalystSlot = {
                id: 'shared-' + Date.now().toString(),
                name: agentData.name || "Shared Agent",
                description: agentData.description || "Shared reasoning perspective",
                model: (agentData.model || "llama-3.3-70b-versatile") as Model,
                active: true,
                systemPrompt: agentData.systemPrompt || ""
              };
              setSlots([...updatedSlots, newSlot]);
              alert(`Imported shared agent "${agentData.name || 'Shared Agent'}" into your reasoning stack!`);
            }
          } else {
            console.warn("Shared agent not found");
          }
        } catch (error) {
          console.error("Error loading shared agent:", error);
        }
      };
      fetchSharedAgent();
      // Clear query param without refreshing page
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [slots, currentPlan]);

  const archiveAgent = async (agent: AnalystSlot) => {
    const effectiveUserId = user?.uid || 'guest';
    try {
      // Find if we already have this agent by ID or by name
      const existingAgent = customAgents.find(a => a.id === agent.id || (a.name.toLowerCase() === agent.name.toLowerCase() && (a as any).userId === effectiveUserId));
      
      // Determine the final Firestore ID we should use
      // 1. If existingAgent was found in our customAgents, keep its existing ID.
      // 2. Otherwise, if the agent has a valid custom ID (e.g. starting with "custom-"), use that!
      // 3. Otherwise, if it has a non-preset ID (not like "p1", "p2", "vc_partner" etc.), we can use it!
      // 4. Otherwise, generate a fresh unique custom agent ID.
      const isPresetId = (id: string) => !id || (id.startsWith('p') && !id.startsWith('project') && !id.startsWith('popup')) || id.includes('generalist') || id.includes('partner') || id.includes('reviewer') || id.includes('ethicist') || id.includes('futurist') || id.includes('skeptic') || id.includes('empiricist') || id.includes('investigator') || id.includes('architect') || id.includes('auditor') || id.includes('analyst');
      const finalId = existingAgent?.id || (agent.id && !isPresetId(agent.id) ? agent.id : ('custom-' + Math.random().toString(36).substr(2, 9)));

      // If this agent was previously deleted in this session, restore/unmark it
      deletedCustomAgentIdsRef.current.delete(finalId);

      const agentData = {
        userId: effectiveUserId,
        name: agent.name || "Custom Agent",
        description: agent.description || (agent as any).desc || "Custom reasoning perspective",
        model: agent.model || "llama-3.3-70b-versatile",
        systemPrompt: agent.systemPrompt || `Analyze the query as ${agent.name}.`,
        category: 'custom',
        createdAt: Date.now(),
        isShared: (agent as any).isShared || false
      };

      // Pessimistically update local state & localStorage first for instant visual feedback
      const updatedLocalAgents = [...customAgents];
      const matchIndex = updatedLocalAgents.findIndex(a => a.id === finalId);
      
      if (matchIndex >= 0) {
        updatedLocalAgents[matchIndex] = { ...updatedLocalAgents[matchIndex], ...agentData, id: finalId };
      } else {
        // Also check if we have a match by name (but different ID) to update instead of duplicate
        const nameMatchIndex = updatedLocalAgents.findIndex(a => a.name.toLowerCase() === agentData.name.toLowerCase() && (a as any).userId === effectiveUserId);
        if (nameMatchIndex >= 0) {
          updatedLocalAgents[nameMatchIndex] = { ...updatedLocalAgents[nameMatchIndex], ...agentData, id: updatedLocalAgents[nameMatchIndex].id };
        } else {
          updatedLocalAgents.push({ ...agentData, id: finalId });
        }
      }
      setCustomAgents(updatedLocalAgents);
      try {
        localStorage.setItem(`ethersflow_custom_agents_${effectiveUserId}`, JSON.stringify(updatedLocalAgents));
      } catch (err) {
        console.warn("Failed to update localStorage with new custom agent", err);
      }

      if (!user || user.uid === 'dev-bypass-user') {
        alert(`Successfully saved "${agent.name}" to your Local Persona Library!`);
        return;
      }

      try {
        // Save or Update custom agent in Firestore using setDoc with the unified ID
        const agentRef = doc(db, 'custom_agents', finalId);
        await setDoc(agentRef, agentData, { merge: true });
        console.log(`[Firebase Service] Successfully saved/updated custom agent ${agent.name} with ID: ${finalId}`);
        alert(`Successfully saved "${agent.name}" to your Persona Library!`);
      } catch (dbErr) {
        console.error("Firestore custom agent write failed, falling back to local storage:", dbErr);
        alert(`Successfully saved "${agent.name}" to your Local Persona Library (Offline Fallback)!`);
      }
    } catch (error) {
      console.error("Error saving custom agent:", error);
      handleFirestoreError(error, OperationType.WRITE, 'custom_agents');
    }
  };

  const deleteCustomAgent = async (id: string) => {
    const effectiveUserId = user?.uid || 'guest';
    // Track deleted IDs to prevent them from popping back into the list due to Firestore latency
    deletedCustomAgentIdsRef.current.add(id);
    try {
      // Optimistically update local state & localStorage
      const updatedLocalAgents = customAgents.filter(a => a.id !== id);
      setCustomAgents(updatedLocalAgents);
      try {
        localStorage.setItem(`ethersflow_custom_agents_${effectiveUserId}`, JSON.stringify(updatedLocalAgents));
      } catch (err) {
        console.warn("Failed to delete custom agent from localStorage", err);
      }

      if (!user || user.uid === 'dev-bypass-user') {
        alert("Successfully deleted agent from your library.");
        return;
      }

      try {
        await deleteDoc(doc(db, 'custom_agents', id));
        alert("Successfully deleted agent from your library.");
      } catch (dbErr) {
        console.warn("Firestore custom agent deletion failed, falling back to local storage:", dbErr);
        alert("Successfully deleted agent from your library.");
      }
    } catch (error) {
      console.error("Error deleting custom agent:", error);
      handleFirestoreError(error, OperationType.DELETE, `custom_agents/${id}`);
    }
  };

  const toggleShareCustomAgent = async (agent: AnalystSlot) => {
    const effectiveUserId = user?.uid || 'guest';
    setSharingAgent(agent);
    setShareAgentEmail('');
    const shareLink = `${window.location.origin}?sharedAgent=${agent.id}`;
    setSharedAgentLink(shareLink);

    const isAlreadyShared = (agent as any).isShared || false;
    if (!isAlreadyShared) {
      try {
        const updatedLocalAgents = customAgents.map(a => a.id === agent.id ? { ...a, isShared: true } : a);
        setCustomAgents(updatedLocalAgents);
        try {
          localStorage.setItem(`ethersflow_custom_agents_${effectiveUserId}`, JSON.stringify(updatedLocalAgents));
        } catch (err) {
          console.warn("Failed to cache custom agents sharing state in localStorage", err);
        }

        if (user && user.uid !== 'dev-bypass-user') {
          const { updateDoc, doc } = await import('firebase/firestore');
          const agentRef = doc(db, 'custom_agents', agent.id);
          await updateDoc(agentRef, { isShared: true });
        }
      } catch (error) {
        console.error("Error enabling sharing on custom agent:", error);
      }
    }
    
    setShowShareAgentModal(true);
    try {
      await navigator.clipboard.writeText(shareLink);
    } catch (clipErr) {
      console.warn("Clipboard access blocked by sandbox:", clipErr);
    }
  };

  const disableAgentSharing = async (agent: AnalystSlot) => {
    const effectiveUserId = user?.uid || 'guest';
    try {
      const updatedLocalAgents = customAgents.map(a => a.id === agent.id ? { ...a, isShared: false } : a);
      setCustomAgents(updatedLocalAgents);
      try {
        localStorage.setItem(`ethersflow_custom_agents_${effectiveUserId}`, JSON.stringify(updatedLocalAgents));
      } catch (err) {
        console.warn("Failed to cache custom agents sharing state in localStorage", err);
      }

      if (user && user.uid !== 'dev-bypass-user') {
        const { updateDoc, doc } = await import('firebase/firestore');
        const agentRef = doc(db, 'custom_agents', agent.id);
        await updateDoc(agentRef, { isShared: false });
      }

      setShowShareAgentModal(false);
      setSharingAgent(null);
      alert(`"${agent.name}" is now private. Sharing disabled.`);
    } catch (error) {
      console.error("Error disabling sharing on custom agent:", error);
    }
  };

  const handleAgentEmailShare = async () => {
    if (!shareAgentEmail.trim()) {
      alert("Please enter a destination email.");
      return;
    }
    if (!sharingAgent) {
      alert("No active agent selected for sharing.");
      return;
    }

    setIsAgentEmailSharing(true);
    try {
      const response = await fetch('/api/share/agent-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: shareAgentEmail, 
          agentName: sharingAgent.name,
          agentDesc: sharingAgent.description || (sharingAgent as any).desc,
          shareUrl: sharedAgentLink,
          userId: user?.uid,
          userName: user?.displayName || 'A researcher',
          userEmail: user?.email || 'N/A'
        })
      });
      
      const data = await response.json();
      if (data.success) {
        if (data.simulated) {
          alert(`[Simulation Mode] Custom Agent shared in simulated environment with ${shareAgentEmail}.\n\nTo send live emails, define 'RESEND_API_KEY' in your Environment Settings.`);
        } else {
          alert(`Custom Agent successfully shared with ${shareAgentEmail}.`);
        }
        setShareAgentEmail('');
      } else {
        throw new Error(data.error || "Failed to send agent invitation.");
      }
    } catch (error: any) {
      alert(`Email distribution failed: ${error.message}`);
    } finally {
      setIsAgentEmailSharing(false);
    }
  };

  const saveToHistory = async (analysis: Omit<SavedAnalysis, 'id'>) => {
    if (!user) return;
    if (user.isGuest) {
      const newAnalysis: SavedAnalysis = { ...analysis, id: 'guest_' + Date.now() };
      setHistory(prev => [newAnalysis, ...prev]);
      return;
    }
    try {
      await addDoc(collection(db, 'analyses'), {
        ...analysis,
        userId: user.uid,
        ...(tenantId ? { tenantId } : {})
      });
    } catch (error) {
      console.warn("Firestore saveToHistory skipped for guest user:", error);
    }
  };


function ProjectDetailView({ 
  project, 
  onUpdate, 
  onBack,
  onAddResource,
  onInviteTeam,
  onConfigureAgents,
  onStartAnalysis
}: { 
  project: Project, 
  onUpdate: (p: Project) => void, 
  onBack: () => void,
  onAddResource: () => void,
  onInviteTeam: () => void,
  onConfigureAgents: () => void,
  onStartAnalysis: () => void
}) {
  const [localName, setLocalName] = useState(project.name);
  const [localDesc, setLocalDesc] = useState(project.description);

  useEffect(() => {
    setLocalName(project.name);
    setLocalDesc(project.description);
  }, [project.id, project.name, project.description]);

  const handleUpdate = () => {
    if (localName !== project.name || localDesc !== project.description) {
      onUpdate({ ...project, name: localName, description: localDesc });
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 sm:py-12 px-4 sm:px-6 text-[#1d1d1f]">
      <div className="flex items-center gap-4 text-gray-400 mb-6 sm:mb-10">
        <button onClick={onBack} className="hover:text-indigo-600 transition-colors flex items-center gap-2 font-black text-[10px] sm:text-xs uppercase tracking-widest shrink-0">
          <Plus className="w-4 h-4 rotate-45" />
          Back to Projects
        </button>
      </div>

      <div className="bg-white rounded-[32px] sm:rounded-[56px] border border-gray-100 shadow-2xl p-6 sm:p-12 mb-8 sm:mb-10 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none hidden sm:block">
          <Folder className="w-64 h-64" />
        </div>
        
        <div className="relative z-10 space-y-4">
          <input 
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            onBlur={handleUpdate}
            placeholder="Project Name"
            className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tighter bg-transparent border-none p-0 focus:ring-0 w-full"
          />
          <textarea 
            value={localDesc}
            onChange={(e) => setLocalDesc(e.target.value)}
            onBlur={handleUpdate}
            className="text-lg sm:text-xl text-gray-500 font-bold bg-transparent border-none p-0 focus:ring-0 w-full resize-none min-h-[80px]"
            placeholder="Describe the objective of this project..."
          />
        </div>

        <div className="flex flex-wrap gap-3 sm:gap-4 mt-8 sm:mt-12 pt-8 sm:pt-12 border-t border-gray-50 relative z-10">
          <button 
            onClick={onAddResource}
            className="flex-1 sm:flex-none px-6 sm:px-8 py-3 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Resource
          </button>
          <button 
            onClick={onInviteTeam}
            className="flex-1 sm:flex-none px-6 sm:px-8 py-3 bg-gray-50 text-gray-600 font-black rounded-2xl hover:bg-gray-100 transition-all text-xs sm:text-sm"
          >
            Invite Team
          </button>
          <button 
            onClick={onStartAnalysis}
            className="flex-1 sm:flex-none px-6 sm:px-8 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black rounded-2xl border border-indigo-100 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
          >
            <Play className="w-4 h-4" />
            Start Analysis
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-4 px-4">
               <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Knowledge Base</h4>
               <button onClick={onAddResource}>
                <Plus className="w-4 h-4 text-gray-300 hover:text-indigo-600 transition-colors" />
               </button>
            </div>
            
            {project.resources && project.resources.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {project.resources.map(res => (
                  <div key={res.id} className="p-6 bg-white border border-gray-100 rounded-[32px] flex items-center justify-between group hover:border-indigo-100 transition-all shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        {(res.type === 'file' || res.type === 'text') ? <FileText className="w-5 h-5" /> : res.type === 'drive' ? <Cloud className="w-5 h-5" /> : <ExternalLink className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-gray-900 truncate max-w-[120px] sm:max-w-[150px]">{res.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className={cn("w-1.5 h-1.5 rounded-full", res.content ? "bg-green-500 animate-pulse" : "bg-gray-300")} />
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                            {res.content ? "Grounding Active" : "Metadata Only"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeResource(res.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50/50 rounded-[32px] sm:rounded-[40px] p-12 sm:p-20 border border-dashed border-gray-200 text-center">
                 <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-gray-300 mx-auto mb-6 shadow-sm">
                    <FileText className="w-8 h-8" />
                 </div>
                 <h5 className="text-xl font-black text-gray-900 mb-2">No data sources yet</h5>
                 <p className="text-gray-400 font-bold max-w-xs mx-auto text-sm">Upload documentation or connect sources to ground your analyses.</p>
              </div>
            )}

            <div className="pt-8">
              <div className="flex items-center justify-between mb-4 px-4">
                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Collaborators</h4>
                 <button onClick={onInviteTeam}>
                  <Users className="w-4 h-4 text-gray-300 hover:text-indigo-600 transition-colors" />
                 </button>
              </div>
              <div className="bg-white border border-gray-100 rounded-[32px] p-6 sm:p-8 space-y-4 shadow-sm">
                {project.team?.map(member => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-[10px] font-black">
                        {((member.email || "Y").trim().charAt(0) || "Y").toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-700">{member.email}</p>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">{member.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
         </div>
         
         <div className="space-y-6">
            <div className="flex items-center justify-between mb-4 px-4">
               <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Project Agents</h4>
               <Settings className="w-4 h-4 text-gray-300" />
            </div>
            <div className="bg-white border border-gray-100 rounded-[32px] p-6 sm:p-8 shadow-sm">
               <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                     <Brain className="w-5 h-5" />
                  </div>
                  <div>
                     <p className="text-sm font-black text-gray-900">Project Architect</p>
                     <p className="text-[10px] font-black text-indigo-400 uppercase">Default Persona</p>
                  </div>
               </div>
               <p className="text-xs text-gray-500 font-bold leading-relaxed mb-6">
                  This agent manages the structural integrity of all analyses within this project.
               </p>
               <button 
                onClick={onConfigureAgents}
                className="w-full py-3 border border-indigo-100 text-indigo-600 font-black rounded-2xl hover:bg-indigo-50 transition-all text-xs"
               >
                Configure Instructions
               </button>
            </div>

            <div className="bg-indigo-950 rounded-[32px] p-8 text-white relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <ShieldCheck className="w-24 h-24" />
              </div>
              <h5 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                Security Layer
              </h5>
              <p className="text-xs text-indigo-200 font-bold leading-relaxed">
                Adversarial protection is active for all communications within this workspace.
              </p>
            </div>
         </div>
      </div>
    </div>
  );
}

function ProjectsPortal({ 
  projects, 
  onCreateProject, 
  onSelectProject 
}: { 
  projects: Project[], 
  onCreateProject: () => void, 
  onSelectProject: (id: string) => void 
}) {
  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-12 px-4 sm:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-16 gap-6">
        <div className="text-center sm:text-left">
          <h2 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tighter mb-3 italic">Workspace Projects</h2>
          <p className="text-sm sm:text-lg text-gray-500 font-bold tracking-tight max-w-xl leading-relaxed">
            Organize your high-stakes analyses and custom agent configurations into isolated research workspaces.
          </p>
        </div>
        <button 
          onClick={onCreateProject}
          className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 sm:py-5 bg-indigo-600 text-white font-black rounded-2xl sm:rounded-[24px] hover:bg-indigo-700 shadow-2xl shadow-indigo-200 transition-all active:scale-95 text-sm uppercase tracking-widest"
        >
          <Plus className="w-5 h-5" />
          Create Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
        <div 
          onClick={onCreateProject}
          className="p-8 sm:p-10 rounded-[32px] sm:rounded-[48px] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center gap-4 text-gray-300 hover:text-indigo-400 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all cursor-pointer group min-h-[220px] sm:min-h-[320px]"
        >
          <div className="w-16 h-16 sm:w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-xl transition-all">
            <Plus className="w-10 h-10" />
          </div>
          <span className="text-xs font-black uppercase tracking-[0.2em]">Initialize New Project</span>
        </div>

        {projects.map((p) => (
          <div 
            key={p.id}
            onClick={() => onSelectProject(p.id)}
            className="p-8 sm:p-10 rounded-[32px] sm:rounded-[48px] border border-gray-50 bg-white shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all cursor-pointer flex flex-col justify-between group h-fit min-h-[220px] sm:min-h-[320px]"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Folder className="w-6 h-6" />
                </div>
                <div className="flex -space-x-2">
                  {p.team?.slice(0, 3).map((m, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-white border-2 border-white ring-2 ring-gray-50 flex items-center justify-center text-[10px] font-black text-gray-400 uppercase">
                      {((m.email || 'Y').trim().charAt(0) || 'Y').toUpperCase()}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-3 truncate group-hover:text-indigo-600 transition-colors">{p.name}</h3>
                <p className="text-sm text-gray-400 font-bold line-clamp-3 leading-relaxed">{p.description || "No description provided for this research workspace."}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-50">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Last Update</span>
                <span className="text-[10px] font-black text-gray-700">
                  {new Date(p.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-indigo-400 group-hover:text-indigo-600 transition-colors">
                <span className="text-xs font-black uppercase tracking-widest">Enter</span>
                <ChevronLeft className="w-4 h-4 rotate-180" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatsPortal({ 
  history, 
  onLoadChat, 
  onClose 
}: { 
  history: SavedAnalysis[], 
  onLoadChat: (item: SavedAnalysis) => void, 
  onClose: () => void 
}) {
  return (
    <div className="max-w-6xl mx-auto py-8 sm:py-12 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-12 gap-6">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter mb-2 text-center sm:text-left">Workspace Chats</h2>
          <p className="text-gray-500 font-bold text-center sm:text-left text-sm sm:text-base">Resurface and resume your adversarial reasoning chains.</p>
        </div>
        <button onClick={onClose} className="mx-auto sm:mx-0 p-4 bg-gray-50 hover:bg-gray-100 rounded-3xl transition-all">
          <Plus className="w-6 h-6 rotate-45 text-gray-400" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {history.map(item => (
          <button 
            key={item.id}
            onClick={() => onLoadChat(item)}
            className="text-left bg-white border border-gray-100 p-8 rounded-[32px] sm:rounded-[40px] shadow-sm hover:shadow-2xl hover:shadow-indigo-50 transition-all group relative overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(item.timestamp).toLocaleDateString()}</p>
                {item.projectId && (
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-indigo-600 uppercase tracking-wider mt-0.5">
                    <Folder className="w-3 h-3 text-indigo-500" />
                    <span className="truncate">{projects.find(p => p.id === item.projectId)?.name || "Project focus"}</span>
                  </div>
                )}
              </div>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-3 line-clamp-2 leading-tight relative z-10">{item.query}</h3>
            <div className="flex items-center gap-2 mt-auto relative z-10">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Resume Analysis →</span>
            </div>
            {item.analystResponses?.length > 0 && (
              <div className="absolute right-0 bottom-0 text-indigo-50/50 pointer-events-none opacity-20 sm:opacity-50">
                <Brain className="w-24 h-24 sm:w-32 h-32 -mr-6 -mb-6 sm:-mr-8 sm:-mb-8 rotate-12" />
              </div>
            )}
          </button>
        ))}
        {history.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-[32px] sm:rounded-[64px] bg-gray-50/20">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <MessageSquare className="w-8 h-8 text-gray-200" />
            </div>
            <p className="text-gray-400 font-bold italic">No reasoning chains detected.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function NestedAgentLibraryUnused() { return null; }

  const toggleSlot = (id: string) => {
    const slotToToggle = slots.find(s => s.id === id);
    if (slotToToggle && !slotToToggle.active && currentPlan === 'free') {
      const activeCount = slots.filter(s => s.active).length;
      if (activeCount >= 3) {
        alert("Free plan users are limited to 3 active analysts. Please upgrade to Pro or Max to activate more concurrent experts.");
        setShowUpgradeModal(true);
        return;
      }
    }
    setSlots(slots.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const updateSlotModel = (id: string, model: Model) => {
    setSlots(slots.map(s => s.id === id ? { ...s, model } : s));
  };

  const removeSlot = (id: string) => {
    if (slots.length <= 1) return;
    setSlots(slots.filter(s => s.id !== id));
  };

  const addSlot = (preset?: Partial<AnalystSlot>) => {
    const activeCount = slots.filter(s => s.active).length;
    if (currentPlan === 'free' && activeCount >= 3) {
      alert("Free plan users are limited to 3 active analysts. Please upgrade to Pro or Max to deploy more concurrent experts.");
      setShowUpgradeModal(true);
      return;
    }
    const newId = Date.now().toString();
    setSlots([...slots, {
      id: newId,
      name: preset?.name || 'New Agent',
      description: preset?.description || 'Custom perspective',
      model: (preset?.model as Model) || 'llama-3.3-70b-versatile',
      active: true,
      systemPrompt: preset?.systemPrompt || 'Provide a unique perspective on the query. State your confidence (HIGH/MEDIUM/LOW) at the start.'
    }]);
    setShowAgentLibrary(false);
  };

  const handleSaveWorkspaceCustomAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceNewName.trim()) {
      alert("Please enter a name for your agent.");
      return;
    }
    setWorkspaceIsSaving(true);
    try {
      const generatedId = 'custom-' + Math.random().toString(36).substr(2, 9);
      const agentData: AnalystSlot = {
        id: generatedId,
        name: workspaceNewName.trim(),
        description: workspaceNewDesc.trim() || 'Custom reasoning perspective',
        model: workspaceNewModel,
        active: true,
        systemPrompt: workspaceNewSystemPrompt.trim() || `Analyze the query as ${workspaceNewName.trim()}.`
      };
      
      // 1. Save to database / local archive
      await archiveAgent(agentData);
      
      // 2. Deploy slot immediately in workspace
      addSlot(agentData);

      // 3. Close create modal & close the add agent library modal
      setWorkspaceShowCreateModal(false);
      setShowAgentLibrary(false);
      
      // 4. Clear fields
      setWorkspaceNewName('');
      setWorkspaceNewDesc('');
      setWorkspaceNewModel('llama-3.3-70b-versatile');
      setWorkspaceNewSystemPrompt('Provide a unique perspective on the query. State your confidence (HIGH/MEDIUM/LOW) at the start.');
    } catch (err) {
      console.error("Error saving workspace custom agent:", err);
    } finally {
      setWorkspaceIsSaving(false);
    }
  };

  const handleRunAnalysis = async (customQuery?: string) => {
    if (isAnalyzing || !user) return;
    
    // Quota Check
    setIsCheckingQuota(true);
    try {
      const usageInfo = await fetchUsage(user.uid);
      setUsage(usageInfo);
      if (usageInfo.overLimit) {
        setShowUpgradeModal(true);
        setIsCheckingQuota(false);
        return;
      }
    } catch (e) {
      console.error("Quota check failed", e);
    } finally {
      setIsCheckingQuota(false);
    }

    if (!user) {
      setAuthError('You must be signed in to perform deep research analysis.');
      // Scroll to welcome/auth section or show a modal
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    let q = customQuery || query;
    
    // Automatically inject previously mapped 'Uncertainty & Gaps' data if the follow-up prompt
    // focuses on taking critical dissent and gaps into account.
    if (results?.synthesis?.uncertainty && (
      q === "Take critical dissent and epistemic gaps into account to challenge and refine findings." || 
      q.toLowerCase().includes("take critical dissent and gaps into account") ||
      q.toLowerCase().includes("take critical dissent and epistemic gaps into account")
    )) {
      q = `${q}\n\n[Previously Mapped Epistemic Gaps & Uncertainty to take into account:\n${results.synthesis.uncertainty}]`;
    }

    if (!q.trim() && attachedFiles.length > 0) {
      q = `Analyze the provided documents: ${attachedFiles.map(f => f.name).join(', ')}`;
    }
    if (!q.trim() && attachedFiles.length === 0) return;
    setIsAnalyzing(true);
    setCompletedAnalysts({});
    setError(null);
    setActiveTab('analysts');
    setAgentLogs([]);
    setTimeout(() => {
      const tracker = document.getElementById("consensus-loading-tracker");
      if (tracker) {
        tracker.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollBy({ top: 380, behavior: 'smooth' });
      }
    }, 180);
    
    try {
      const activeSlots = slots.filter(s => {
        if (!s.active) return false;
        const modelInfo = AVAILABLE_MODELS.find(m => m.id === s.model);
        return !modelInfo?.disabled;
      });

      // Quotas and rate limiting are handled dynamically via client-side fetchUsage status and server-side engine checks.

      if (currentPlan === 'free' && activeSlots.length > 3) {
        alert("The Free plan supports up to 3 concurrent active analysts. Please disable some analysts or upgrade to Pro/Max to run more concurrent experts.");
        setIsAnalyzing(false);
        setShowUpgradeModal(true);
        return;
      }

      if (activeSlots.length === 0) {
        throw new Error("No active analyst slots selected. Please enable at least one analyst.");
      }

      const currentHistory = [...messages];
      
      const project = projects.find(p => p.id === activeProjectId);
      const projectInstructions = project?.instructions || '';
      
      // Incorporate Project Resources as GROUNDING DATA
      const projectResources = (project?.resources || [])
        .filter(r => r.content)
        .map(r => ({ name: r.name, content: r.content!, type: r.type as string }));
      
      const combinedAttachedFiles = [...attachedFiles, ...projectResources];

      const activeSlotsWithProjectContext = activeSlots.map(s => {
        const customPersonaInstruction = `You are playing the role of analyst "${s.name}". Your core focus and description: "${s.description}". You MUST analyze the query and participate in the debate strictly through this specialized lens, incorporating any custom directives, frameworks, or methodologies implied by this description.`;
        
        let finalPrompt = `${customPersonaInstruction}\n\n${s.systemPrompt}`;
        if (projectInstructions) {
          finalPrompt = `[PROJECT_SPECIFIC_GUIDELINES: ${projectInstructions}]\n\n${finalPrompt}`;
        }
        
        return {
          ...s,
          systemPrompt: finalPrompt
        };
      });

      // Build full query with file contents
      const enrichedQuery = q;

      setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Orchestrating ${activeSlots.length} analysts... ${combinedAttachedFiles.length > 0 ? `(Analyzing ${combinedAttachedFiles.length} resource(s))` : '(No resources detected)'}`]);

      // Create a map to track state
      const results = await runConsensus(
        enrichedQuery, 
        currentHistory, 
        activeSlotsWithProjectContext, 
        synthesisTemp,
        (analyst) => {
          setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${analyst.persona} analysis received (${analyst.text.length} chars).`]);
          setCompletedAnalysts(prev => ({
            ...prev,
            [analyst.slotId]: analyst
          }));
        },
        synthesisEngineModel,
        combinedAttachedFiles,
        currentPlan,
        (chunk) => {
          // We can't easily show partial JSON, but we can show that activity is happening
          setAgentLogs(prev => {
            const last = prev[prev.length - 1];
            if (last?.includes('Synthesis')) return prev;
            return [...prev, `[${new Date().toLocaleTimeString()}] Synthesis logic stream initialized... generating final consensus.`];
          });
        },
        user?.uid
      );

      console.log("[Consensus] Result received from service:", results);
      const { analystResponses, synthesis } = results;
      
      const newResults = { analystResponses, synthesis, query: enrichedQuery };
      setResults(newResults);
      setSynthesisStage(1);
      setActiveTab('synthesis');
      
      // Increment Usage
      try {
        await incrementUsage(user.uid);
        if (usage) {
          setUsage({ 
            ...usage, 
            current: usage.current + 1, 
            remaining: Math.max(0, usage.remaining - 1), 
            overLimit: usage.current + 1 >= usage.limit 
          });
        }
      } catch (usageErr) {
        console.warn("Usage logging failed", usageErr);
      }

      const updatedMessages: ChatMessage[] = [
        ...currentHistory,
        { role: 'user', content: q + (attachedFiles.length > 0 ? ` (with ${attachedFiles.length} attachments)` : '') },
        { 
          role: 'assistant', 
          content: synthesis.consensus, 
          analystResponses: analystResponses,
          synthesis: synthesis
        }
      ];
      setMessages(updatedMessages);
      
      // Backup to localStorage immediately as a fallback and for anonymous local persistent users
      const newSavedItem: SavedAnalysis = {
        id: currentAnalysisId || `local-${Date.now()}`,
        userId: user?.uid || 'guest',
        query: q,
        timestamp: Date.now(),
        analystResponses,
        synthesis,
        messages: updatedMessages,
        ...(activeProjectId ? { projectId: activeProjectId } : {})
      };
      
      try {
        const storedKey = `ethersflow_history_${user?.uid || 'guest'}`;
        const stored = localStorage.getItem(storedKey);
        const currentLocalHistory: SavedAnalysis[] = stored ? JSON.parse(stored) : [];
        const index = currentLocalHistory.findIndex(item => item.id === (currentAnalysisId || 'non-existent'));
        if (index > -1) {
          currentLocalHistory[index] = newSavedItem;
        } else {
          currentLocalHistory.unshift(newSavedItem);
        }
        localStorage.setItem(storedKey, JSON.stringify(currentLocalHistory));
        if (!currentAnalysisId || user?.uid === 'dev-bypass-user') {
          setHistory(currentLocalHistory);
        }
      } catch (lsErr) {
        console.warn("Could not backup history to localStorage", lsErr);
      }

      if (user && user.uid !== 'dev-bypass-user') {
        if (currentAnalysisId) {
          // Update existing session
          const analysisRef = doc(db, 'analyses', currentAnalysisId);
          try {
            const { updateDoc } = await import('firebase/firestore');
            await updateDoc(analysisRef, {
              messages: updatedMessages,
              analystResponses,
              synthesis,
              timestamp: Date.now(),
              agents: slots, // Save the exact active agents configuration
              ...(activeProjectId ? { projectId: activeProjectId } : {}),
              ...(tenantId ? { tenantId } : {})
            });
          } catch (error) {
            console.error("Firestore Update Error", error);
            handleFirestoreError(error, OperationType.UPDATE, `analyses/${currentAnalysisId}`);
          }
        } else {
          // Create new session
          try {
            const { addDoc } = await import('firebase/firestore');
            const docRef = await addDoc(collection(db, 'analyses'), {
              userId: user.uid,
              query: q,
              timestamp: Date.now(),
              analystResponses,
              synthesis,
              messages: updatedMessages,
              agents: slots, // Save the exact active agents configuration
              ...(activeProjectId ? { projectId: activeProjectId } : {}),
              ...(tenantId ? { tenantId } : {})
            });
            setCurrentAnalysisId(docRef.id);
            // Update local backup with real document id
            try {
              const storedKey = `ethersflow_history_${user.uid}`;
              const stored = localStorage.getItem(storedKey);
              if (stored) {
                const currentLocalHistory: SavedAnalysis[] = JSON.parse(stored);
                if (currentLocalHistory.length > 0 && currentLocalHistory[0].id.startsWith('local-')) {
                  currentLocalHistory[0].id = docRef.id;
                  localStorage.setItem(storedKey, JSON.stringify(currentLocalHistory));
                }
              }
            } catch (innerLs) {
              console.warn("Could not update local storage id", innerLs);
            }
          } catch (error) {
            console.error("Firestore Create Error", error);
            handleFirestoreError(error, OperationType.CREATE, 'analyses');
          }
        }
      }
      
      setActiveTab('synthesis');
      setQuery(''); // Clear for next follow-up
      setAttachedFiles([]); // Clear attachments after use
    } catch (error: any) {
      console.error("Analysis failed:", error);
      setError(error.message || "An unexpected error occurred during analysis.");
      setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] SEVERE: Analysis aborted. ${error.message}`]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const convertMarkdownToWordHTML = (markdown: string) => {
    if (!markdown) return "";
    let processed = markdown;
    
    // Safely escape basic characters to avoid breaking HTML tree
    processed = processed
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    const lines = processed.split('\n');
    const resultLines: string[] = [];
    
    for (let line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }
      
      const parseInline = (text: string) => {
        return text
          .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: bold; color: #111827;">$1</strong>')
          .replace(/\*(.*?)\*/g, '<em style="font-style: italic; color: #374151;">$1</em>')
          .replace(/_(.*?)_/g, '<em style="font-style: italic; color: #374151;">$1</em>')
          .replace(/`(&lt;.*?&gt;|.*?)`/g, '<code style="font-family: \'Consolas\', \'Courier New\', monospace; background-color: #f3f4f6; padding: 2px 4px; border-radius: 4px; font-size: 9.5pt; color: #4338ca;">$1</code>');
      };

      if (trimmed.startsWith('### ')) {
        const content = parseInline(trimmed.substring(4).trim());
        resultLines.push(`<h3 style="color: #4338ca; font-family: 'Segoe UI Semibold', sans-serif; font-size: 13pt; margin-top: 14pt; margin-bottom: 6pt;">${content}</h3>`);
      }
      else if (trimmed.startsWith('## ')) {
        const content = parseInline(trimmed.substring(3).trim());
        resultLines.push(`<h2 style="color: #312e81; font-family: 'Segoe UI Semibold', sans-serif; font-size: 15pt; margin-top: 18pt; margin-bottom: 8pt; border-left: 4px solid #4f46e5; padding-left: 8pt;">${content}</h2>`);
      }
      else if (trimmed.startsWith('# ')) {
        const content = parseInline(trimmed.substring(2).trim());
        resultLines.push(`<h1 style="color: #1e1b4b; font-family: 'Segoe UI Semibold', sans-serif; font-size: 20pt; border-bottom: 2px solid #4f46e5; margin-bottom: 12pt; padding-bottom: 4pt;">${content}</h1>`);
      }
      else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
        const content = parseInline(trimmed.substring(2).trim());
        resultLines.push(`<li style="margin-left: 20pt; font-family: 'Segoe UI', sans-serif; font-size: 10.5pt; color: #374151; margin-bottom: 4pt; list-style-type: disc;">${content}</li>`);
      }
      else if (/^\d+[\.\)]\s+/.test(trimmed)) {
        const markerMatch = trimmed.match(/^(\d+[\.\)])\s+/);
        const marker = markerMatch ? markerMatch[1] : '';
        const content = parseInline(trimmed.substring(marker.length).trim());
        resultLines.push(`<li style="margin-left: 20pt; font-family: 'Segoe UI', sans-serif; font-size: 10.5pt; color: #374151; margin-bottom: 4pt; list-style-type: decimal;">${content}</li>`);
      }
      else {
        const content = parseInline(trimmed);
        resultLines.push(`<p style="margin: 0 0 8pt 0; text-align: justify; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 10.5pt; line-height: 1.5; color: #374151;">${content}</p>`);
      }
    }
    
    return resultLines.join('\n');
  };

  const downloadReport = () => {
    if (!results || !results.synthesis) return;
    
    // Create HTML structure for raw high-fidelity modern HTML document
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset='utf-8'>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EthersFlow - Institutional Consensus Report</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #f8fafc;
      color: #1e293b;
      line-height: 1.6;
      margin: 0;
      padding: 40px 20px;
    }
    .container {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
      padding: 48px;
    }
    .header {
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    h1 {
      color: #4f46e5;
      font-size: 26px;
      font-weight: 800;
      margin: 0 0 12px 0;
      letter-spacing: -0.025em;
    }
    h2 {
      color: #1e1b4b;
      font-size: 19px;
      font-weight: 700;
      margin-top: 36px;
      margin-bottom: 16px;
      border-left: 4px solid #4f46e5;
      padding-left: 12px;
    }
    h3 {
      color: #312e81;
      font-size: 15px;
      font-weight: 600;
      margin-top: 24px;
      margin-bottom: 12px;
    }
    .metadata-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      background: #f1f5f9;
      padding: 18px;
      border-radius: 12px;
      margin-top: 16px;
      font-size: 13.5px;
    }
    .metadata-item strong {
      color: #475569;
    }
    .box {
      background: #fdfdfd;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px;
      margin: 16px 0;
    }
    .box p {
      margin: 0 0 12px 0;
    }
    .box p:last-child {
      margin-bottom: 0;
    }
    .analyst-card {
      margin-bottom: 32px;
      border-left: 4px solid #4f46e5;
      padding-left: 18px;
      margin-top: 24px;
    }
    .analyst-title {
      margin: 0;
      color: #1e1b4b;
      font-size: 15px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .analyst-meta {
      color: #64748b;
      font-style: italic;
      font-size: 12px;
      margin-bottom: 12px;
      margin-top: 4px;
    }
    .gap-box {
      background: #fdf2f8;
      border-left: 4px solid #db2777;
      padding: 18px;
      border-radius: 8px;
      margin: 16px 0;
    }
    .dissent-card {
      margin-bottom: 12px;
      background: #fff5f5;
      border: 1px dashed #f87171;
      padding: 16px;
      border-radius: 8px;
    }
    .dissent-who {
      margin: 0 0 6px 0;
      font-weight: 700;
      color: #991b1b;
    }
    .dissent-text {
      margin: 0;
      font-size: 13.5px;
      color: #7f1d1d;
    }
    .badge {
      background: #e0e7ff;
      color: #4338ca;
      padding: 4px 8px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 11px;
      display: inline-block;
    }
    ul, ol {
      margin-top: 4px;
      margin-bottom: 12px;
      padding-left: 20px;
    }
    li {
      margin-bottom: 6px;
    }
    code {
      font-family: 'Consolas', 'Courier New', monospace;
      background-color: #f1f5f9;
      padding: 2px 4px;
      border-radius: 4px;
      font-size: 90%;
      color: #4338ca;
    }
    strong {
      color: #0f172a;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>EthersFlow Institutional Consensus Report</h1>
      <div class="metadata-grid">
        <div class="metadata-item"><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
        <div class="metadata-item"><strong>Confidence Metric:</strong> <span class="badge">${results.synthesis.confidenceMetric}/100</span></div>
        <div class="metadata-item" style="grid-column: span 2;"><strong>Original Query:</strong> ${results.query || messages[0]?.content || 'N/A'}</div>
      </div>
    </div>
    
    <h2>Consensus Narrative</h2>
    <div class="box">
      ${convertMarkdownToWordHTML(results.synthesis.consensus)}
    </div>
    
    <h2>Analyst Breakdown</h2>
    ${results.analystResponses.map(r => {
      return `
        <div class="analyst-card">
          <h4 class="analyst-title">
            ${r.persona.toUpperCase()}
          </h4>
          <p class="analyst-meta">
            Model Run: ${r.model.toUpperCase()} | Confidence: ${r.confidence}
          </p>
          <div style="margin-top: 5pt;">
            ${convertMarkdownToWordHTML(r.text)}
          </div>
        </div>
      `;
    }).join('')}
    
    <h2>Epistemic Gaps</h2>
    <div class="gap-box">
      ${convertMarkdownToWordHTML(results.synthesis.uncertainty)}
    </div>
    
    <h2>Dissenting Perspectives</h2>
    ${results.synthesis.dissents && results.synthesis.dissents.length > 0 ? results.synthesis.dissents.map(d => `
      <div class="dissent-card">
        <p class="dissent-who"><strong>${d.who}:</strong></p>
        <p class="dissent-text">${d.argument || d.text || ''}</p>
      </div>
    `).join('') : '<p style="font-size: 13.5px; color: #64748b; font-style: italic;">No significant dissenting minority paths recorded.</p>'}
    
    <div class="footer-note" style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #475569;">
      <p style="margin: 0 0 8px 0; font-weight: 700; color: #4f46e5; font-size: 14.5px;">🌌 EthersFlow Research Portal</p>
      <p style="margin: 0; line-height: 1.6;">
        This consensus report was compiled dynamically under the adversarial consensus infrastructure of <strong>EthersFlow</strong>. 
        Generated on behalf of the EthersFlow researcher account of: 
        <a href="${window.location.origin}?ref=${encodeURIComponent(user?.uid || '')}&email=${encodeURIComponent(user?.email || '')}" style="color: #4f46e5; font-weight: 700; text-decoration: underline;">
          ${user?.displayName || user?.email || 'Scholar'} (${user?.email || 'verified user'})
        </a>.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EthersFlow_Consensus_Report_${new Date().getTime()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadAnalystReport = (r: AnalystResponse) => {
    const slotInfo = slots.find(s => s.id === r.slotId);
    const { thinking, report } = extractThinking(r.text);
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset='utf-8'>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EthersFlow - ${r.persona} Analyst Source Report</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #f8fafc;
      color: #1e293b;
      line-height: 1.6;
      margin: 0;
      padding: 40px 20px;
    }
    .container {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
      padding: 48px;
    }
    .header {
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    h1 {
      color: #4f46e5;
      font-size: 24px;
      font-weight: 800;
      margin: 0 0 12px 0;
      letter-spacing: -0.025em;
    }
    h2 {
      color: #1e1b4b;
      font-size: 18px;
      font-weight: 700;
      margin-top: 32px;
      margin-bottom: 16px;
      border-left: 4px solid #4f46e5;
      padding-left: 12px;
    }
    .metadata-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      background: #f1f5f9;
      padding: 18px;
      border-radius: 12px;
      margin-top: 16px;
      font-size: 13.5px;
    }
    .metadata-item strong {
      color: #475569;
    }
    .box {
      background: #fdfdfd;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px;
      margin: 16px 0;
    }
    .box p {
      margin: 0 0 12px 0;
    }
    .box p:last-child {
      margin-bottom: 0;
    }
    .badge {
      background: #e0e7ff;
      color: #4338ca;
      padding: 4px 8px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 11px;
      display: inline-block;
    }
    ul, ol {
      margin-top: 4px;
      margin-bottom: 12px;
      padding-left: 20px;
    }
    li {
      margin-bottom: 6px;
    }
    code {
      font-family: 'Consolas', 'Courier New', monospace;
      background-color: #f1f5f9;
      padding: 2px 4px;
      border-radius: 4px;
      font-size: 90%;
      color: #4338ca;
    }
    strong {
      color: #0f172a;
    }
    .footer-note {
      font-size: 11.5px;
      color: #64748b;
      margin-top: 36px;
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Analyst Source Report: ${r.persona.toUpperCase()}</h1>
      
      <div class="metadata-grid">
        <div class="metadata-item"><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
        <div class="metadata-item"><strong>Original Query:</strong> ${results?.query || messages[0]?.content || 'N/A'}</div>
        <div class="metadata-item"><strong>Analyst Name:</strong> ${r.persona}</div>
        <div class="metadata-item"><strong>Informed Confidence Level:</strong> <span class="badge">${r.confidence === 'HIGH' ? 'HIGH CONFIDENCE' : r.confidence === 'MEDIUM' ? 'STABLE CONFIDENCE' : 'LOW CERTAINTY'}</span></div>
        <div class="metadata-item"><strong>Infrastructure Model Run:</strong> ${r.model.toUpperCase()}</div>
      </div>
    </div>
    
    <h2>Raw Analytical Intel & Findings</h2>
    ${thinking ? `
    <details style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0;">
      <summary style="font-weight: 800; font-size: 12px; color: #4f46e5; cursor: pointer; text-transform: uppercase; letter-spacing: 0.05em;">🧠 Internal Model Chain of Thought (Thinking Process)</summary>
      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-family: monospace; font-size: 11.5px; color: #475569; white-space: pre-wrap;">${thinking}</div>
    </details>
    ` : ''}
    <div class="box">
      ${convertMarkdownToWordHTML(report)}
    </div>
    
    <h2>Latent Metadata & Reasoning Flags</h2>
    <p style="font-size: 14px; color: #334155;">
      <strong>Semantic Verification Flags:</strong> ${r.flags.map(f => f.toUpperCase()).join(', ') || 'NONE DETECTED'}
    </p>
    <div class="footer-note" style="margin-top: 36px; border-top: 1px solid #e2e8f0; padding-top: 24px; font-style: italic;">
      <p style="margin: 0 0 10px 0; font-weight: 700; color: #4f46e5; font-size: 14px; font-style: normal;">🌌 EthersFlow Analytical Source Node</p>
      <p style="margin: 0 0 12px 0; line-height: 1.6; font-style: normal; font-size: 13px; color: #475569;">
        This document was downloaded from the adversarial consensus workspace on <strong>EthersFlow</strong>. 
        Sent by and linked to the EthersFlow researcher account at: 
        <a href="${window.location.origin}?ref=${encodeURIComponent(user?.uid || '')}&email=${encodeURIComponent(user?.email || '')}" style="color: #4f46e5; font-weight: 700; text-decoration: underline;">
          ${user?.displayName || user?.email || 'Authorized Lab User'} (${user?.email || 'verified node'})
        </a>.
      </p>
      <div style="font-size: 11px; color: #64748b; margin-top: 16px; border-top: 1px dashed #e2e8f0; padding-top: 12px;">
        This intelligence report is a direct, uncensored extraction of the analyst's dedicated slot outputs, compiled dynamically within the EthersFlow adversarial consensus engine.
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EthersFlow_${r.persona}_Source_Report_${new Date().getTime()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const loadFromHistory = (item: SavedAnalysis) => {
    setQuery('');
    setCurrentAnalysisId(item.id);
    setMessages(item.messages || [{ role: 'user', content: item.query }, { role: 'assistant', content: item.synthesis.consensus }]);
    setResults({ query: item.query, analystResponses: item.analystResponses, synthesis: item.synthesis });
    setSynthesisStage(1);
    setActiveTab('synthesis');
    setShowHistory(false);
    if (item.projectId) {
      setActiveProjectId(item.projectId);
    } else {
      setActiveProjectId(null);
    }
    if (item.agents && item.agents.length > 0) {
      setSlots(item.agents);
    }
  };


  const startSpeechToText = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser. Please use Chrome or Safari.");
      return;
    }
    
    // Check permissions if possible, otherwise just start
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true; // Set to true for better feedback
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      console.log("Listening started...");
    };
    
    recognition.onend = () => {
      setIsListening(false);
      console.log("Listening ended.");
    };
    
    recognition.onerror = (event: any) => {
      console.error("Speech error:", event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        alert("Microphone access denied. Please enable it in browser settings.");
      }
    };
    
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join("");
      
      setQuery(prev => {
        // Simple logic to avoid duplicates if continuous were true
        return transcript; 
      });
    };
    
    try {
      recognition.start();
    } catch (e) {
      console.error("Speech recognition start error:", e);
      setIsListening(false);
    }
  };


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsUploading(true);
      setIsExtracting(true);
      const fileList = Array.from(files);
      
      setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] AI Pipeline: Preparing ${fileList.length} files for analysis...`]);

      const uploadPromises = fileList.map(async (file) => {
        const lowerName = file.name.toLowerCase();
        const isPdf = file.type === 'application/pdf' || lowerName.endsWith('.pdf');
        const isDocx = file.type.includes('wordprocessingml') || lowerName.endsWith('.docx') || lowerName.endsWith('.doc');
        const isImage = file.type.startsWith('image/');
        const isText = file.type === 'text/plain' || lowerName.endsWith('.txt') || lowerName.endsWith('.md') || lowerName.endsWith('.csv');
        
        // Enforce 100MB limit for ultra-large documents
        if (file.size > 100 * 1024 * 1024) {
          const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
          setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ERROR: ${file.name} is too large (${fileSizeMB}MB). Limit is 100MB.`]);
          return;
        }

        try {
          if (isPdf) {
            setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] IN-BROWSER PIPELINE: Extracting PDF locally. Processing pages...`]);
            let extractedText = "";
            try {
              extractedText = await extractTextFromPdfClient(file, (percent) => {
                setAgentLogs(prev => {
                  const cleanLogs = prev.filter(log => !log.includes('Extraction Progress:'));
                  return [...cleanLogs, `[${new Date().toLocaleTimeString()}] Extraction Progress: ${percent}%`];
                });
              });
            } catch (clientErr: any) {
              console.warn('[handleFileUpload] Client PDF extraction notice:', clientErr);
            }

            if (extractedText && extractedText.length > 20) {
              setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] PIPELINE SUCCESS: ${file.name} - Extracted ${extractedText.length} characters locally.`]);
              setAttachedFiles(prev => [...prev, {
                name: file.name,
                content: extractedText,
                type: file.type || 'application/pdf'
              }]);
            } else {
              // Fallback seamlessly to cloud extraction route
              setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] AI Dispatch: ${file.name} routing to cloud document parser...`]);
              const formData = new FormData();
              formData.append('pdf', file);
              
              const res = await fetch('/api/pdf/extract', {
                method: 'POST',
                body: formData
              }).catch(err => {
                if (err.message === 'Failed to fetch') {
                  const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
                  throw new Error(`Connection failed. File (${fileSizeMB}MB) exceeds network limits. Try splitting or uploading a smaller PDF.`);
                }
                throw err;
              });

              if (!res.ok) {
                throw new Error(`Cloud extraction returned HTTP ${res.status}`);
              }

              const data = await res.json();
              if (data.text) {
                setAttachedFiles(prev => [...prev, {
                  name: file.name,
                  content: data.text,
                  type: file.type || 'application/pdf'
                }]);
                setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] PIPELINE SUCCESS: ${file.name} - Extracted ${data.text.length} characters via cloud parser.`]);
              } else {
                throw new Error(data.message || "Cloud parser returned success but no text content was found.");
              }
            }
          } else if (isDocx || isImage) {
            const typeLabel = isImage ? 'Vision AI' : 'Text Analysis';
            setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] AI Dispatch: ${file.name} sent for ${typeLabel}...`]);
            
            const formData = new FormData();
            formData.append('pdf', file);
            
            const res = await fetch('/api/pdf/extract', {
              method: 'POST',
              body: formData
            }).catch(err => {
              if (err.message === 'Failed to fetch') {
                const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
                throw new Error(`Connection failed. This usually occurs if the file (${fileSizeMB}MB) is too large for the current network connection or proxy. Try reducing the PDF size or splitting the document.`);
              }
              throw err;
            });
            
            if (!res.ok) {
              const text = await res.text();
              let errorMessage = `Server error (${res.status})`;
              try {
                const errBody = JSON.parse(text);
                errorMessage = errBody.message || errBody.error || errorMessage;
              } catch (e) {
                if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
                  errorMessage = `Server processing error. The server returned a 500 status page instead of result data. This often happens if the PDF is too complex to parse in the current memory limit.`;
                } else {
                  errorMessage = text.substring(0, 150) || errorMessage;
                }
              }
              throw new Error(errorMessage);
            }
            
            const rawBody = await res.text();
            let data;
            try {
              data = JSON.parse(rawBody);
            } catch (parseErr) {
              console.error("[Upload] JSON Parse Error. Raw body:", rawBody);
              // Handle very common proxy timeout or size limit errors which return HTML
              if (rawBody.includes('<!DOCTYPE html>') || rawBody.includes('<html') || rawBody.includes('502') || rawBody.includes('504')) {
                throw new Error("The application server is overloaded or the file is too complex for current resource limits. This usually happens with large pitch decks (>25MB). Please try splitting the PDF or uploading a smaller version.");
              }
              throw new Error(`The server returned an unparseable response (Length: ${rawBody.length}). This could be due to a connection break. Check logs.`);
            }
            
            if (data.text) {
              setAttachedFiles(prev => [...prev, {
                name: file.name,
                content: data.text,
                type: file.type || (isPdf ? 'application/pdf' : 'application/docx')
              }]);
              const vInfo = data.v ? ` [API ${data.v}]` : "";
              setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] PIPELINE SUCCESS: ${file.name}${vInfo} - Extracted ${data.text.length} characters using ${data.info?.method || 'neural analysis'}.`]);
            } else {
              throw new Error(data.message || "Server returned success but no text content was found.");
            }
          } else if (isText) {
            const content = await file.text();
            setAttachedFiles(prev => [...prev, {
              name: file.name,
              content: content || "Empty file content",
              type: file.type || 'text/plain'
            }]);
            setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] LOCAL READ: ${file.name} attached (${content.length} chars).`]);
          } else {
            console.warn(`Unsupported file type attempted: ${file.name} (${file.type})`);
            setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] UNSUPPORTED TYPE: ${file.name}. Please use PDF, Word, or Text files.`]);
            throw new Error(`Unsupported file type: ${file.type || 'unknown'}. Use PDF, DOCX, or TXT.`);
          }
        } catch (error: any) {
          console.error(`Upload error for ${file.name}:`, error);
          setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] EXTRACTION FAILED for ${file.name}: ${error.message}`]);
          setError(`File error (${file.name}): ${error.message}`);
        }
      });

      try {
        await Promise.all(uploadPromises);
      } finally {
        setIsExtracting(false);
        setIsUploading(false);
        if (e.target) e.target.value = '';
      }
    }
  };

  const getScoreExplanation = (score: number, analysts?: any[]) => {
    const isSingleAgent = analysts && analysts.length === 1;
    const singleAgentName = isSingleAgent ? (analysts[0]?.persona || "Specialist") : "";

    if (isSingleAgent) {
      return {
        title: "Single Expert Deployment Mode",
        desc: `At ${score}%, you have deployed a single expert analyst: ${singleAgentName}. Because only one analyst is active in this session, no adversarial peer debate, cross-agent critique, or consensus voting was initiated. This report presents a highly concentrated, specialized analysis delivered directly by ${singleAgentName} according to its custom directives and model parameters.`,
        color: "text-indigo-600 bg-indigo-50/50 border-indigo-200"
      };
    }

    if (score >= 85) {
      return {
        title: "Strong Convergence Mode",
        desc: `At ${score}%, we have achieved a highly resilient expert consensus. Active analysts display strong alignment across independent architectures, meaning the synthesized thesis has very low machine dependency bias and high stability. Red-team friction is minimal, implying negligible systemic vulnerabilities were identified.`,
        color: "text-green-600 bg-green-50/50 border-green-200"
      };
    } else if (score >= 70) {
      return {
        title: "Qualified Consensus Mode",
        desc: `At ${score}%, there is solid overall alignment but with key caveats. High-performance models generally agree on the core trajectory, but minor friction remains regarding specific secondary claims or boundary conditions. This is a reliable directive, but hedging is requested around dissenting points.`,
        color: "text-indigo-600 bg-indigo-50/50 border-indigo-200"
      };
    } else if (score >= 50) {
      return {
        title: "Active Friction Mode",
        desc: `At ${score}%, we observe active disagreement between empirical claims and adversarial stress-testers. Significant minority viewpoints were logged, indicating substantial risk, logical gaps, or source-data ambiguity. Direct action should be suspended until the identified friction points are resolved or audited.`,
        color: "text-amber-600 bg-amber-50/50 border-amber-200"
      };
    } else {
      return {
        title: "High Divergence Warning",
        desc: `At ${score}%, the reasoning stack is severely fragmented. Analysts are in direct opposition, or critical dependency overlaps and potential hallucination patterns were flagged. Groupthink is absent, but there is no reliable point of shared alignment. Proceed with extreme caution and audit raw materials.`,
        color: "text-red-600 bg-red-50/50 border-red-200"
      };
    }
  };

  const renderConfidenceCard = (isMobile: boolean) => {
    if (!results || !results.synthesis) return null;
    const score = results.synthesis.confidenceMetric || 0;
    const explanation = getScoreExplanation(score, results.analystResponses);

    return (
      <div className={cn(
        "bg-white border border-gray-100 rounded-3xl sm:rounded-[40px] shadow-xl shadow-indigo-50 relative group",
        isMobile ? "block xl:hidden mb-8 p-6 sm:p-10" : "hidden xl:block p-6 shadow-indigo-50/20"
      )}>
         <div className="relative z-10 w-full">
           <div className="flex items-center justify-between mb-6 sm:mb-8">
             <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('trust_rating', 'Consensus Trust Rating')}</div>
             <div className="relative">
                <HelpCircle className="w-4 h-4 text-gray-300 cursor-help peer" />
                <div className="absolute right-0 bottom-full mb-4 w-64 p-6 bg-gray-900 text-white rounded-3xl opacity-0 peer-hover:opacity-100 transition-opacity pointer-events-none z-[130] shadow-2xl">
                  <div className="text-[10px] font-black text-indigo-400 uppercase mb-2">Methodology</div>
                  <p className="text-[11px] font-bold leading-relaxed text-gray-300">
                    {t('confidence_metric_methodology', 'The Confidence Metric is a composite value derived from three key vectors:')}
                    <br /><br />
                    1. <b>{t('concordance_label', 'Concordance')}:</b> {t('concordance_desc', 'Statistical alignment across non-homogeneous model architectures.')}
                    <br />
                    2. <b>{t('rt_impact_label', 'Rt Impact')}:</b> {t('rt_impact_desc', 'Weighting of adversarial critiques identified by the Red Team.')}
                    <br />
                    3. <b>{t('dependency_cluster_label', 'Dependency Cluster')}:</b> {t('dependency_cluster_desc', 'Penalization for overlapping training set biases among active agents.')}
                  </p>
                </div>
             </div>
           </div>
           
           <div className={cn(
             "flex items-center gap-6 justify-center mb-6",
             isMobile ? "flex-col sm:flex-row sm:gap-8" : "flex-col"
           )}>
              <div className="relative flex-shrink-0">
                <svg className="w-36 h-36 transform -rotate-90">
                  <circle cx="72" cy="72" r="64" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                  <circle 
                    cx="72" cy="72" r="64" fill="none" stroke="#4f46e5" strokeWidth="8" 
                    strokeDasharray={64 * 2 * Math.PI}
                    strokeDashoffset={64 * 2 * Math.PI * (1 - score / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-gray-900 leading-none">{score}</span>
                  <span className="text-[9px] font-black text-indigo-500 mt-1 tracking-widest">VERIFIED</span>
                </div>
              </div>

              <div className={cn(
                "flex-1",
                isMobile ? "text-center sm:text-left" : "text-center"
              )}>
                <div className={cn("inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase mb-3 border", explanation.color)}>
                  {explanation.title}
                </div>
                <p className="text-gray-500 text-xs sm:text-sm font-semibold leading-relaxed">
                  {explanation.desc}
                </p>
              </div>
           </div>

           <p className={cn(
             "text-[9px] font-black text-gray-400 uppercase tracking-wider",
             isMobile ? "text-center sm:text-left" : "text-center"
           )}>
             MULTI-MODEL CONCORDANCE & VERIFICATION INDEX: SCORE DERIVED FROM INDEPENDENT MODEL ALIGNMENT, ADVERSARIAL RED-TEAM FRICTION, AND EVIDENCE CONSISTENCY.
           </p>
         </div>
      </div>
    );
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleGoogleAuth = async () => {
    setAuthError('');
    try {
      const userCred = await signInWithGoogle();
      if (userCred?.user) {
        setView('main');
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    } catch (err: any) {
      console.error("Google auth error:", err);
      let msg = 'Google authentication failed.';
      if (err.code === 'auth/popup-blocked') msg = 'Authentication popup was blocked by your browser. Please allow popups for this site.';
      if (err.code === 'auth/operation-not-allowed') msg = 'Google login is not enabled in Firebase Console.';
      if (err.code === 'auth/unauthorized-domain') msg = 'This domain is not authorized for Firebase Auth. Add it to Authorized Domains in Firebase Console.';
      if (err.message?.includes('suspended')) msg = 'Your project is reporting as "suspended". If you were recently reinstated, you MUST go to the Google Cloud Console (APIs & Services > Credentials), delete your current API key, and create a new one, as suspended keys often remain disabled even after account reinstatement.';
      setAuthError(msg + ` (${err.message})`);
      alert(msg);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    if (passInput.length < 6) {
      setAuthError('Password must be at least 6 characters');
      return;
    }

    try {
      if (isSignUp) {
        const userCred = await signUpWithEmail(emailInput, passInput);
        if (userCred?.user) {
          setView('main');
          window.scrollTo({ top: 0, behavior: 'instant' });
        }
      } else {
        const userCred = await signInWithEmail(emailInput, passInput);
        if (userCred?.user) {
          setView('main');
          window.scrollTo({ top: 0, behavior: 'instant' });
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let msg = 'Authentication failed';
      if (err.code === 'auth/email-already-in-use') msg = 'This email is already registered.';
      if (err.code === 'auth/invalid-credential') msg = 'Invalid email or password.';
      if (err.code === 'auth/operation-not-allowed') msg = 'Email/Password login is not enabled in Firebase Console.';
      if (err.code === 'auth/weak-password') msg = 'Password is too weak.';
      if (err.code === 'auth/user-not-found') msg = 'No account found with this email.';
      if (err.code === 'auth/wrong-password') msg = 'Incorrect password.';
      setAuthError(msg);
    }
  };

  const getAnalystDialogueSnippets = (analystResponse: AnalystResponse) => {
    if (!analystResponse || !analystResponse.text) return [];
    const sentences = analystResponse.text
      .split(/[.!?]\s+/)
      .map(s => s.trim().replace(/^[-*•\s\d.]+\s*/, ''))
      .filter(s => s.length > 30 && s.length < 200 && !s.includes('---') && !s.toLowerCase().startsWith('confidence:'));
    return sentences.slice(0, 4);
  };

  const renderDialogueFlash = () => {
    const activeSlots = slots.filter(s => {
      const modelInfo = AVAILABLE_MODELS.find(m => m.id === s.model);
      return s.active && !modelInfo?.disabled;
    });
    
    if (activeSlots.length === 0) return null;
    
    const completedList = Object.values(completedAnalysts);
    const flashes: { persona: string; role: string; quote: string; type: 'thought' | 'resolved'; color: string }[] = [];
    
    completedList.forEach(ca => {
      const caModelInfo = AVAILABLE_MODELS.find(m => m.id === ca.model);
      const modelName = caModelInfo?.name || ca.model;
      const snippets = getAnalystDialogueSnippets(ca);
      if (snippets.length > 0) {
        snippets.forEach(snip => {
          flashes.push({
            persona: ca.persona,
            role: `Verified Response via ${modelName}`,
            quote: snip,
            type: 'resolved',
            color: (ca.persona.toLowerCase().includes('steelman') || ca.persona.toLowerCase().includes('constructive')) ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                   ca.persona.toLowerCase().includes('red') ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
                   ca.persona.toLowerCase().includes('skeptic') ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                   'text-sky-400 bg-sky-500/10 border-sky-500/20'
          });
        });
      } else {
        flashes.push({
          persona: ca.persona,
          role: "Synthesis report finalized",
          quote: "Completed multi-dimensional reasoning and delivered the primary evidentiary brief.",
          type: 'resolved',
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
        });
      }
    });

    activeSlots.forEach(slot => {
      const isCompleted = !!completedAnalysts[slot.id];
      if (!isCompleted) {
        const qContext = query ? `on "${query.slice(0, 45)}..."` : 'for the active research thesis';
        let thought1 = "";
        let thought2 = "";
        if (slot.name.toLowerCase().includes('steelman') || slot.name.toLowerCase().includes('constructive')) {
          thought1 = `Synthesizing the strongest supportive empirical case ${qContext}.`;
          thought2 = `Constructing coherent argument outlines and resolving soft-form fallacies.`;
        } else if (slot.name.toLowerCase().includes('red')) {
          thought1 = `Aggressively analyzing potential blindspots and cognitive biases ${qContext}.`;
          thought2 = `Stress-testing assertions against negative historical constraints and boundaries.`;
        } else if (slot.name.toLowerCase().includes('skeptic')) {
          thought1 = `Evaluating the primary source logic and checking for correlation vs causation issues.`;
          thought2 = `Validating confidence bounds and adjusting predictive certainty metrics downwards.`;
        } else {
          thought1 = `Gleaning grounded primary evidence and matching key parameters ${qContext}.`;
          thought2 = `Indexing context tokens and assembling historical verification libraries.`;
        }

        flashes.push({
          persona: slot.name,
          role: "Active Dialectical Reasoning...",
          quote: thought1,
          type: 'thought',
          color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
        });
        flashes.push({
          persona: slot.name,
          role: "Internal Cross-Examination...",
          quote: thought2,
          type: 'thought',
          color: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
        });
      }
    });

    if (flashes.length === 0) {
      flashes.push({
        persona: "Orchestrator",
        role: "System Alignment",
        quote: "Initializing the inspectable multi-model adversarial review trace.",
        type: 'thought',
        color: 'text-indigo-450 bg-white/5 border-white/10'
      });
    }

    const flash = flashes[currentFlashIndex % flashes.length];

    return (
      <div className="relative z-10 bg-white/[0.03] border border-white/10 rounded-2xl p-4 transition-all duration-500">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-indigo-300">
              {flash.type === 'resolved' ? 'MEMBER DIALOGUE TRANSCRIPT FLASH' : 'IN-FLIGHT COGNITIVE DRAFT'}
            </span>
          </div>
          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-indigo-300/80 tracking-widest uppercase">
            {flash.persona}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className={cn("text-[9px] font-mono px-2 py-0.5 rounded-full border font-extrabold shrink-0", flash.color)}>
              {flash.persona.toUpperCase()}
            </div>
            <span className="text-[9px] text-slate-400 font-bold tracking-tight truncate">{flash.role}</span>
          </div>
          
          <p className="text-xs sm:text-sm text-gray-200 font-medium leading-relaxed italic border-l-2 border-indigo-500/30 pl-3">
            "{flash.quote}"
          </p>
        </div>
      </div>
    );
  };

  const Sidebar = () => {
    const NavItem = ({ 
      onClick, 
      icon: IconComp, 
      label, 
      active 
    }: { 
      onClick: () => void; 
      icon: any; 
      label: string; 
      active?: boolean;
    }) => (
      <div className="relative group overflow-visible">
        <button 
          onClick={onClick}
          className={cn(
            "w-full flex items-center gap-3 p-4 rounded-2xl transition-all font-bold text-sm",
            active ? "bg-white shadow-sm text-indigo-600 border border-indigo-100" : "text-gray-500 hover:bg-gray-200/50"
          )}
        >
          <div className="w-6 h-6 flex items-center justify-center">
            {IconComp}
          </div>
          {!sidebarCollapsed && <span>{label}</span>}
        </button>

        {sidebarCollapsed && (
          <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-x-[-8px] group-hover:translate-x-0 z-[500]">
            <div className="bg-gray-900 text-white text-[10px] font-black px-4 py-2.5 rounded-xl whitespace-nowrap shadow-2xl flex items-center gap-2 border border-white/10">
              <span className="uppercase tracking-[0.1em]">{label}</span>
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-gray-900" />
            </div>
          </div>
        )}
      </div>
    );

    return (
    <>
      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      <motion.aside 
        initial={false}
        animate={windowWidth < 1024 ? { x: sidebarOpen ? 0 : -320 } : { width: sidebarCollapsed ? 80 : 280 }}
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 flex flex-col bg-[#f9f9f9] border-r border-gray-200 h-screen",
          sidebarCollapsed ? "overflow-visible lg:items-center" : "overflow-hidden lg:items-stretch",
          windowWidth < 1024 ? "w-[280px]" : ""
        )}
      >
        <div className="flex-none p-6 flex items-center justify-between overflow-visible">
          <div className={cn("flex flex-col gap-1", sidebarCollapsed && windowWidth >= 1024 ? "hidden" : "flex")}>
            <div className="flex items-center gap-2">
              <Logo size="sm" />
              <span className="font-black italic tracking-tighter text-indigo-900">EthersFlow</span>
              <div className="ml-2 px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md text-[8px] font-black text-indigo-600 uppercase tracking-widest">
                {currentPlan}_Tier
              </div>
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-tight leading-tight mt-1 px-1">{t('hero_trustworthy') || "Making AI Trustworthy"}</p>
          </div>
          <div className="relative group overflow-visible">
            <button 
               onClick={() => {
                 if (windowWidth < 1024) setSidebarOpen(false);
                 else setSidebarCollapsed(!sidebarCollapsed);
               }}
               className="p-2 hover:bg-gray-200 rounded-xl text-gray-400 transition-colors"
            >
              {windowWidth < 1024 ? (
                <Plus className="w-5 h-5 rotate-45" />
              ) : (
                <div className="w-5 h-5 flex flex-col justify-between items-center px-0.5 py-1">
                   <div className="w-full h-0.5 bg-current" />
                   <div className="w-full h-0.5 bg-current" />
                   <div className="w-full h-0.5 bg-current" />
                </div>
              )}
            </button>
            {sidebarCollapsed && (
              <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-x-[-8px] group-hover:translate-x-0 z-[500]">
                <div className="bg-gray-900 text-white text-[10px] font-black px-4 py-2.5 rounded-xl whitespace-nowrap shadow-2xl flex items-center gap-2 border border-white/10">
                  <span className="uppercase tracking-[0.1em]">{t('expand_sidebar')}</span>
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-gray-900" />
                </div>
              </div>
            )}
          </div>
        </div>

      {/* Main Navigation - Scrolling Area */}
      <div className={cn("flex-1 px-4 py-2 space-y-2", sidebarCollapsed ? "overflow-visible" : "overflow-y-auto custom-scrollbar")}>
        <NavItem 
          onClick={() => {
            setView('main');
            setMessages([]);
            setResults(null);
            setQuery('');
            setActiveTab('analysts');
            setCurrentAnalysisId(null);
            if (windowWidth < 1024) setSidebarOpen(false);
          }}
          icon={<Plus className="w-5 h-5" />}
          label={t('new_analysis') || 'New Analysis'}
          active={view === 'main' && !currentAnalysisId}
        />

        <NavItem 
          onClick={() => setShowSearch(true)}
          icon={<Search className="w-5 h-5" />}
          label={t('search')}
        />

        <div className="pt-4">
          {!sidebarCollapsed && <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 mb-3">{t('workspace')}</p>}
          
          <NavItem 
            onClick={() => {
              setView('projects');
              if (windowWidth < 1024) setSidebarOpen(false);
            }}
            icon={<Folder className="w-5 h-5" />}
            label={t('projects')}
            active={view === 'projects'}
          />

          <NavItem 
            onClick={() => {
              setView('chats');
              if (windowWidth < 1024) setSidebarOpen(false);
            }}
            icon={<MessageSquare className="w-5 h-5" />}
            label={t('chats')}
            active={view === 'chats' || (view === 'main' && !!currentAnalysisId)}
          />
        </div>

        <div className="pt-4">
          {!sidebarCollapsed && <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 mb-3">{t('intelligence')}</p>}
          <NavItem 
            onClick={() => {
              setView('agent-library');
              if (windowWidth < 1024) setSidebarOpen(false);
            }}
            icon={<Brain className="w-5 h-5" />}
            label={t('agent_library')}
            active={view === 'agent-library'}
          />
          <NavItem 
            onClick={() => {
              setShowCustomizeModal(true);
              if (windowWidth < 1024) setSidebarOpen(false);
            }}
            icon={<Settings className="w-5 h-5" />}
            label={t('customize')}
            active={showCustomizeModal}
          />
        </div>

        {/* Security & Telemetry hidden from navigation sidebar to only be accessible via direct links */}
      </div>

      <div className="flex-none p-4 border-t border-gray-200">
         <div 
           onClick={() => setShowAccountPopover(!showAccountPopover)}
           className={cn(
             "flex items-center gap-3 p-4 rounded-2xl transition-all relative group overflow-visible cursor-pointer hover:bg-gray-100/50",
             sidebarCollapsed ? "justify-center" : "justify-between"
           )}
         >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-indigo-600 font-black text-xs uppercase shadow-sm group-hover:scale-110 transition-transform">
                {user?.email?.[0]}
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                   <p className="text-xs font-black text-gray-900 truncate">{user?.email?.split('@')?.[0] || 'User'}</p>
                   <div className="flex items-center gap-1.5">
                     <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{currentPlan} Tier</p>
                   </div>
                </div>
              )}
            </div>
            {!sidebarCollapsed && (
              <ChevronDown className={cn("w-4 h-4 text-gray-300 transition-transform", showAccountPopover && "rotate-180")} />
            )}

            {sidebarCollapsed && !showAccountPopover && (
              <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-x-[-8px] group-hover:translate-x-0 z-[500]">
                <div className="bg-gray-900 text-white text-[10px] font-black px-4 py-2.5 rounded-xl whitespace-nowrap shadow-2xl flex flex-col gap-1 border border-white/10">
                  <span className="uppercase tracking-[0.1em]">{user?.email}</span>
                  <span className="text-[8px] opacity-60 uppercase">{currentPlan} TIER ACTIVE</span>
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-gray-900" />
                </div>
              </div>
            )}
         </div>


         {/* Account Popover removed from here and moved to App root */}
 
         {!sidebarCollapsed && usage && (
           <div className="px-2 pt-2">
             <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
               <div className="flex justify-between items-end mb-2">
                 <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Usage Quota</span>
                 <span className="text-[9px] font-black text-indigo-600">{usage.current} / {usage.limit}</span>
               </div>
               <div className="h-1 bg-gray-50 rounded-full overflow-hidden">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${(usage.current / usage.limit) * 100}%` }}
                   className={cn(
                     "h-full rounded-full transition-all duration-1000",
                     usage.overLimit ? "bg-red-500" : "bg-indigo-500"
                   )}
                 />
               </div>
             </div>
           </div>
         )}
      </div>
    </motion.aside>
    </>
    );
  };

  const renderPublicHeader = () => {
    const isDark = view === 'enterprise_plan_page' || view === 'b2b_api_portal' || view === 'api' || view === 'developers';

    const navigateToSalesForm = () => {
      setShowResourcesDropdown(false);
      setView('enterprise_plan_page');
      setTimeout(() => {
        const element = document.getElementById('sales-form');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
        }
      }, 150);
    };

    return (
      <nav className="w-full max-w-7xl mx-auto px-3 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-3 sm:py-5 flex items-center justify-between font-sans relative z-50">
        <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 min-w-0">
          {/* Logo item */}
          <div 
            className="flex items-center gap-1 sm:gap-1.5 cursor-pointer shrink-0"
            onClick={() => {
              setMessages([]);
              setResults(null);
              setQuery('');
              setActiveTab('analysts');
              setCurrentAnalysisId(null);
              setView('main');
              window.scrollTo({ top: 0, behavior: 'instant' });
            }}
          >
            <Logo size="md" />
            <span className={`text-sm sm:text-base md:text-lg lg:text-xl font-black tracking-tighter italic whitespace-nowrap ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
              EthersFlow
            </span>
          </div>

          {/* Links */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-6 text-[13px] xl:text-[14px] font-bold">
            <button 
              onClick={() => { setView('developers'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
              className={`hover:opacity-85 transition-all bg-transparent border-none font-bold text-[14px] cursor-pointer flex items-center gap-1.5 ${
                view === 'developers' 
                  ? (isDark ? 'text-white font-extrabold border-b-2 border-indigo-400' : 'text-[#1d1d1f] font-extrabold border-b-2 border-indigo-600')
                  : (isDark ? 'text-gray-300' : 'text-gray-500')
              }`}
            >
              <Code className="w-4 h-4 text-indigo-500" />
              <span>Developers</span>
              <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded text-[9px] font-black uppercase">Hub</span>
            </button>

            <button 
              onClick={() => { setView('api'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
              className={`hover:opacity-85 transition-all bg-transparent border-none font-bold text-[14px] cursor-pointer flex items-center gap-1.5 ${
                (view === 'api' || view === 'b2b_api_portal')
                  ? (isDark ? 'text-white font-extrabold border-b-2 border-indigo-400' : 'text-[#1d1d1f] font-extrabold border-b-2 border-indigo-600')
                  : (isDark ? 'text-gray-300' : 'text-gray-500')
              }`}
            >
              <Key className="w-4 h-4 text-sky-500" />
              <span>API</span>
              <span className="px-1.5 py-0.5 bg-sky-50 text-sky-600 border border-sky-200 rounded text-[9px] font-black uppercase">Gateway</span>
            </button>

            {/* Pricing drop down trigger wrapper */}
            <div 
              className="relative"
              onMouseEnter={() => setShowPricingDropdown(true)}
              onMouseLeave={() => setShowPricingDropdown(false)}
            >
              <button 
                onClick={() => { setView('pricing_overview'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                className={`hover:opacity-85 transition-all flex items-center gap-1 font-bold cursor-pointer bg-transparent border-none text-[14px] py-1 ${
                  (view === 'pricing_overview' || view === 'pro_plan_page' || view === 'max_plan_page' || view === 'enterprise_plan_page')
                    ? (isDark ? 'text-white font-extrabold border-b-2 border-indigo-400' : 'text-[#1d1d1f] font-extrabold border-b-2 border-indigo-600')
                    : (isDark ? 'text-gray-300' : 'text-gray-500')
                }`}
              >
                {t('nav_pricing')} <ChevronDown className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showPricingDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 mt-2 w-72 bg-white border border-gray-150 rounded-[24px] shadow-2xl z-[100] p-4 text-left font-sans"
                    onMouseEnter={() => setShowPricingDropdown(true)}
                    onMouseLeave={() => setShowPricingDropdown(false)}
                  >
                    <div className="space-y-1">
                      {/* Overview */}
                      <button 
                        onClick={() => { setView('pricing_overview'); setShowPricingDropdown(false); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                        className="w-full text-left p-2.5 hover:bg-gray-50 rounded-xl transition-all block cursor-pointer group"
                      >
                        <span className="text-xs font-black text-gray-900 group-hover:text-indigo-600 block mb-0.5">Overview</span>
                        <span className="text-[10px] text-gray-455 font-bold block leading-normal">Compare individual & institutional plans side-by-side</span>
                      </button>

                      {/* API info pointing to alignment */}
                      <button 
                        onClick={() => { setView('pricing_overview'); setShowPricingDropdown(false); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                        className="w-full text-left p-2.5 hover:bg-gray-50 rounded-xl transition-all block cursor-pointer group"
                      >
                        <span className="text-xs font-black text-gray-900 group-hover:text-indigo-600 block mb-0.5">API Keys & Rates</span>
                        <span className="text-[10px] text-gray-455 font-bold block leading-normal">High-throughput trace audit engines & model token credits</span>
                      </button>

                      <div className="h-px bg-gray-100 my-2" />
                      
                      <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest px-2.5 block mb-1">Plans</span>

                      {/* Pro */}
                      <button 
                        onClick={() => { setView('pro_plan_page'); setShowPricingDropdown(false); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                        className="w-full text-left p-2.5 hover:bg-gray-50 rounded-xl transition-all block cursor-pointer group"
                      >
                        <span className="text-xs font-black text-gray-900 group-hover:text-indigo-600 block mb-0.5">Pro Console</span>
                        <span className="text-[10px] text-gray-455 font-bold block leading-normal font-sans">Standard audit console for active researchers ($20)</span>
                      </button>

                      {/* Max */}
                      <button 
                        onClick={() => { setView('max_plan_page'); setShowPricingDropdown(false); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                        className="w-full text-left p-2.5 hover:bg-gray-50 rounded-xl transition-all block cursor-pointer group"
                      >
                        <span className="text-xs font-black text-gray-900 group-hover:text-indigo-600 block mb-0.5">Max Audit</span>
                        <span className="text-[10px] text-gray-455 font-bold block leading-normal font-sans">Frontier model panels & heavy-token audits ($100)</span>
                      </button>

                      {/* Team */}
                      <button 
                        onClick={() => { setView('enterprise_plan_page'); setShowPricingDropdown(false); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                        className="w-full text-left p-2.5 hover:bg-gray-50 rounded-xl transition-all block cursor-pointer group"
                      >
                        <span className="text-xs font-black text-[#1d1d1f] group-hover:text-indigo-600 block mb-0.5 flex items-center gap-1.5">
                          Enterprise Team 
                          <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[8px] font-black uppercase tracking-wider">SSO</span>
                        </span>
                        <span className="text-[10px] text-gray-455 font-bold block leading-normal font-sans">Collaborative workspace & single billing ($20/user)</span>
                      </button>

                      {/* Enterprise custom */}
                      <button 
                        onClick={() => { setView('enterprise_plan_page'); setShowPricingDropdown(false); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                        className="w-full text-left p-2.5 hover:bg-gray-50 rounded-xl transition-all block cursor-pointer group"
                      >
                        <span className="text-xs font-black text-[#1d1d1f] group-hover:text-indigo-600 block mb-0.5 flex items-center gap-1.5 font-sans">
                          Sovereign Custom 
                          <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                        </span>
                        <span className="text-[10px] text-gray-455 font-bold block leading-normal font-sans">Dedicated cloud nodes, custom model weights & SLAs</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Resources drop down trigger wrapper */}
            <div 
              className="relative"
              onMouseEnter={() => setShowResourcesDropdown(true)}
              onMouseLeave={() => setShowResourcesDropdown(false)}
            >
              <button 
                onClick={() => { setView('about'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                className={`hover:opacity-85 transition-all flex items-center gap-1 font-bold cursor-pointer bg-transparent border-none text-[14px] py-1 ${
                  ['about', 'research', 'careers', 'protocol', 'contact'].includes(view)
                    ? (isDark ? 'text-white font-extrabold border-b-2 border-indigo-400' : 'text-[#1d1d1f] font-extrabold border-b-2 border-indigo-600')
                    : (isDark ? 'text-gray-300' : 'text-gray-500')
                }`}
              >
                {t('nav_resources') || 'Resources'} <ChevronDown className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showResourcesDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-1/2 -translate-x-[45%] mt-2 w-[540px] bg-white border border-gray-150 rounded-[24px] shadow-2xl z-[100] p-6 text-left font-sans"
                    onMouseEnter={() => setShowResourcesDropdown(true)}
                    onMouseLeave={() => setShowResourcesDropdown(false)}
                  >
                    <div className="grid grid-cols-3 gap-6">
                      {/* Column 1: Science */}
                      <div className="space-y-4">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] block px-2">Science</span>
                        <div className="space-y-1">
                          <button 
                            onClick={() => { setView('research'); setShowResourcesDropdown(false); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                            className="w-full text-left p-2 hover:bg-gray-50 rounded-xl transition-all block cursor-pointer group"
                          >
                            <span className="text-xs font-black text-gray-900 group-hover:text-indigo-600 block mb-0.5">Research</span>
                            <span className="text-[10px] text-gray-455 font-bold block leading-normal">Adversarial debate & peer publications</span>
                          </button>
                          
                          <button 
                            onClick={() => { setView('protocol'); setShowResourcesDropdown(false); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                            className="w-full text-left p-2 hover:bg-gray-50 rounded-xl transition-all block cursor-pointer group"
                          >
                            <span className="text-xs font-black text-gray-900 group-hover:text-indigo-600 block mb-0.5">Protocol</span>
                            <span className="text-[10px] text-gray-455 font-bold block leading-normal">FAC mathematical rules & node models</span>
                          </button>
                        </div>
                      </div>

                      {/* Column 2: Labs */}
                      <div className="space-y-4 pl-4 border-l border-gray-100">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] block px-2">Company</span>
                        <div className="space-y-1">
                          <button 
                            onClick={() => { setView('about'); setShowResourcesDropdown(false); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                            className="w-full text-left p-2 hover:bg-gray-50 rounded-xl transition-all block cursor-pointer group"
                          >
                            <span className="text-xs font-black text-gray-900 group-hover:text-indigo-600 block mb-0.5">About Us</span>
                            <span className="text-[10px] text-gray-455 font-bold block leading-normal">Our corporate mission & legal vision</span>
                          </button>

                          <button 
                            onClick={() => { setView('careers'); setShowResourcesDropdown(false); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                            className="w-full text-left p-2 hover:bg-gray-50 rounded-xl transition-all block cursor-pointer group"
                          >
                            <span className="text-xs font-black text-gray-900 group-hover:text-indigo-600 block mb-0.5 flex items-center gap-1.5">
                              Careers
                              <span className="px-1.5 py-0.5 bg-green-50 text-green-600 rounded text-[8px] font-black uppercase tracking-wider">Hiring</span>
                            </span>
                            <span className="text-[10px] text-gray-455 font-bold block leading-normal font-sans">Build trust systems at our Pittsburgh HQ</span>
                          </button>
                        </div>
                      </div>

                      {/* Column 3: Contact */}
                      <div className="space-y-4 pl-4 border-l border-gray-100">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] block px-2">Relations</span>
                        <div className="space-y-1">
                          <button 
                            onClick={() => { setView('contact'); setShowResourcesDropdown(false); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                            className="w-full text-left p-2 hover:bg-gray-50 rounded-xl transition-all block cursor-pointer group"
                          >
                            <span className="text-xs font-black text-gray-900 group-hover:text-indigo-600 block mb-0.5">Contact Us</span>
                            <span className="text-[10px] text-gray-455 font-bold block leading-normal">Connect with research directors</span>
                          </button>

                          <button 
                            onClick={navigateToSalesForm}
                            className="w-full text-left p-2 hover:bg-gray-50 rounded-xl transition-all block cursor-pointer group"
                          >
                            <span className="text-xs font-black text-gray-900 group-hover:text-indigo-600 block mb-0.5">Contact Sales</span>
                            <span className="text-[10px] text-gray-455 font-bold block leading-normal">Inquire about sovereign deployments</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Direct click on Contact Sales shows the interactive Sales modality */}
            <button 
              onClick={navigateToSalesForm}
              className={`hover:opacity-85 transition-colors bg-transparent border-none font-bold text-[14px] cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-500'}`}
            >
              {t('nav_contact_sales')}
            </button>
          </div>
        </div>

        {/* CTAs on the far right block */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {user && !user.isGuest ? (
            <button 
              onClick={() => { setView('main'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
              className={`px-2.5 sm:px-5 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[9px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isDark 
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
              }`}
            >
              Enter Console
            </button>
          ) : (
            <>
              <button 
                onClick={() => { setView('main'); setIsSignUp(false); setShowGooglePrompt(true); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                className={`hidden sm:inline-block hover:opacity-85 text-xs font-black uppercase tracking-wider bg-transparent border-none transition-colors cursor-pointer mr-2 whitespace-nowrap ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-500'}`}
              >
                Sign In
              </button>
              <button 
                onClick={() => { setView('main'); setShowGooglePrompt(true); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                className={`px-2.5 sm:px-5 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[9px] sm:text-xs font-black uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isDark 
                    ? 'bg-white hover:bg-gray-100 text-gray-950 shadow-md' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                }`}
              >
                Enter Console
              </button>
            </>
          )}

          {/* Black and White Theme Toggle / Sun Moon Icons - Last on the right */}
          <div className={`flex items-center gap-0.5 p-1 rounded-xl border shadow-sm transition-all ${
            isDark 
              ? 'bg-zinc-800/90 border-zinc-700/80' 
              : 'bg-gray-100 border-gray-200/80'
          }`}>
            <button
              onClick={() => setTheme('light')}
              className={cn(
                "p-1.5 rounded-lg transition-all cursor-pointer",
                theme === 'light'
                  ? "bg-white text-amber-500 shadow-sm font-bold"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              )}
              title="Light Mode"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={cn(
                "p-1.5 rounded-lg transition-all cursor-pointer",
                theme === 'dark'
                  ? "bg-zinc-700 text-yellow-400 shadow-sm font-bold"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              )}
              title="Dark Mode"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>
    );
  };

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-50 border-t-indigo-600 rounded-full animate-spin" />
    </div>;
  }

  if (view === 'security') {
    return (
      <SecurityDashboard 
        onClose={() => {
          setView('main');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }} 
        setView={setView} 
        initialTab={securityActiveTab}
        onTabChange={(tab) => setSecurityActiveTab(tab)}
      />
    );
  }

  if (view === 'pricing_overview') {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex flex-col justify-between font-sans">
        {renderPublicHeader()}
        <PricingOverviewPage 
          user={user} 
          setView={setView} 
          onSignUpOpen={() => { setView('main'); setIsSignUp(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
        />
        <CommonFooter setView={setView} />
      </div>
    );
  }

  if (view === 'pro_plan_page') {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex flex-col justify-between font-sans">
        {renderPublicHeader()}
        <ProPlanDetailedPage 
          user={user} 
          setView={setView} 
          onSignUpOpen={() => { setView('main'); setIsSignUp(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
        />
        <CommonFooter setView={setView} />
      </div>
    );
  }

  if (view === 'max_plan_page') {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex flex-col justify-between font-sans">
        {renderPublicHeader()}
        <MaxPlanDetailedPage 
          user={user} 
          setView={setView} 
          onSignUpOpen={() => { setView('main'); setIsSignUp(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
        />
        <CommonFooter setView={setView} />
      </div>
    );
  }

  if (view === 'enterprise_plan_page') {
    return (
      <div className="min-h-screen bg-[#161618] flex flex-col justify-between font-sans">
        {renderPublicHeader()}
        <EnterprisePlanDetailedPage 
          user={user} 
          setView={setView} 
          onSignUpOpen={() => { setView('main'); setIsSignUp(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
        />
        <CommonFooter setView={setView} />
      </div>
    );
  }

  if (view === 'developers') {
    return (
      <div className="min-h-screen bg-[#0d0e12] text-slate-100 flex flex-col justify-between font-sans">
        {renderPublicHeader()}
        <main className="flex-1 w-full">
          <DevelopersPage 
            onClose={() => {
              setView('main');
              window.scrollTo({ top: 0, behavior: 'instant' });
            }}
            setView={setView}
          />
        </main>
        <CommonFooter setView={setView} />
      </div>
    );
  }

  if (view === 'api' || view === 'b2b_api_portal') {
    return (
      <div className="min-h-screen bg-[#0b0c10] text-slate-100 flex flex-col justify-between font-sans">
        {renderPublicHeader()}
        <main className="flex-1 w-full py-6">
          <B2bDeveloperPortal userId={user?.uid || 'guest_user'} userEmail={user?.email} />
        </main>
        <CommonFooter setView={setView} />
      </div>
    );
  }

  if (view === 'about') {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex flex-col justify-between font-sans">
        {renderPublicHeader()}
        <AboutPage 
          onClose={() => {
            setView('main');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
        <CommonFooter setView={setView} />
      </div>
    );
  }

  if (view === 'careers') {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex flex-col justify-between font-sans">
        {renderPublicHeader()}
        <CareersPage 
          onClose={() => {
            setView('main');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
        <CommonFooter setView={setView} />
      </div>
    );
  }

  if (view === 'contact') {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex flex-col justify-between font-sans">
        {renderPublicHeader()}
        <ContactPage 
          onClose={() => {
            setView('main');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
        <CommonFooter setView={setView} />
      </div>
    );
  }

  if (view === 'research') {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex flex-col justify-between font-sans">
        {renderPublicHeader()}
        <ResearchPage 
          onClose={() => {
            setView('main');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
        <CommonFooter setView={setView} />
      </div>
    );
  }

  if (view === 'protocol') {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex flex-col justify-between font-sans">
        {renderPublicHeader()}
        <ProtocolPage 
          onClose={() => {
            setView('main');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
        <CommonFooter setView={setView} />
      </div>
    );
  }

  if ((PAGE_CONTENT as any)[view]) {
    return (
      <SectionPage 
        title={view} 
        onClose={() => {
          setView('main');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }} 
        setView={setView} 
      />
    );
  }

  if (view === 'auth') {
    return (
      <div className="min-h-screen bg-[#F9F8F6] font-sans text-[#1d1d1f] flex flex-col pt-4">
        {/* Navigation */}
        {renderPublicHeader()}
        <div className="hidden pointer-events-none opacity-0 h-0">
          <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <div 
              className="flex items-center gap-1 sm:gap-1.5 cursor-pointer shrink-0"
              onClick={() => {
                setMessages([]);
                setResults(null);
                setQuery('');
                setActiveTab('analysts');
                setCurrentAnalysisId(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <Logo size="md" />
              <span className="text-sm sm:text-base md:text-lg lg:text-xl font-black tracking-tighter italic whitespace-nowrap">EthersFlow</span>
            </div>
            <div className="hidden lg:flex items-center gap-8 text-[14px] font-bold text-gray-500">
              <a href="#" className="hover:text-gray-900 transition-colors">{t('nav_platform')}</a>
              <div 
                className="relative"
                onMouseEnter={() => setShowPricingDropdown(true)}
                onMouseLeave={() => setShowPricingDropdown(false)}
              >
                <button 
                  onClick={() => { setView('pricing_overview'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                  className="hover:text-gray-900 transition-colors flex items-center gap-1 font-bold cursor-pointer bg-transparent border-none text-[14px] text-gray-500 py-1"
                >
                  {t('nav_pricing')} <ChevronDown className="w-4 h-4" />
                </button>
                <AnimatePresence>
                  {showPricingDropdown && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute left-0 mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-4 font-sans"
                    >
                      <div className="space-y-1">
                        <button 
                          onClick={() => { setView('pricing_overview'); setShowPricingDropdown(false); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                          className="w-full text-left p-3 hover:bg-gray-50 rounded-xl transition-all block cursor-pointer"
                        >
                          <span className="text-xs font-black text-indigo-600 block mb-0.5">Overview</span>
                          <span className="text-[11px] text-gray-550 font-bold block">Compare all individual, team & custom plans</span>
                        </button>

                        <div className="h-px bg-gray-100 my-1" />
                        <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider px-3 block my-1">Individual plans</span>

                        <button 
                          onClick={() => { setView('pro_plan_page'); setShowPricingDropdown(false); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                          className="w-full text-left p-3 hover:bg-gray-50 rounded-xl transition-all block cursor-pointer"
                        >
                          <span className="text-xs font-black text-gray-800 block">Pro Plan — $20</span>
                          <span className="text-[11px] text-gray-550 font-bold block">Everyday reasoning & unlimited consensus</span>
                        </button>

                        <button 
                          onClick={() => { setView('max_plan_page'); setShowPricingDropdown(false); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                          className="w-full text-left p-3 hover:bg-gray-50 rounded-xl transition-all block cursor-pointer"
                        >
                          <span className="text-xs font-black text-gray-800 block">Max Plan — $100</span>
                          <span className="text-[11px] text-gray-550 font-bold block">Frontier expert model panels & max tokens</span>
                        </button>

                        <div className="h-px bg-gray-100 my-1" />
                        <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider px-3 block my-1">Teams & Enterprise</span>

                        <button 
                          onClick={() => { setView('enterprise_plan_page'); setShowPricingDropdown(false); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                          className="w-full text-left p-3 hover:bg-gray-50 rounded-xl transition-all block cursor-pointer"
                        >
                          <span className="text-xs font-black text-indigo-600 block flex items-center gap-1">
                            Enterprise Suite <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                          </span>
                          <span className="text-[11px] text-gray-550 font-bold block font-sans">Teams ($20) / custom setup, SSO & OTel</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button 
                onClick={() => setShowContactSales(true)}
                className="hover:text-gray-900 transition-colors bg-transparent border-none font-bold text-[14px] cursor-pointer text-gray-500"
              >
                {t('nav_contact_sales')}
              </button>
            </div>
          </div>
        </nav>
        </div>

        {/* Hero Section */}
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16 xl:px-24 py-12 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-7 text-center lg:text-left py-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Use the Console to run reviews. Developers can extend the same capability through API or MCP.</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-black text-[#1d1d1f] mb-6 sm:mb-8 tracking-tight leading-[1.05]">
              Make AI actions reviewable{' '}
              <StreamingHeroText text="before they execute." />
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 font-bold mb-6 sm:mb-8 leading-relaxed max-w-2xl">
              Choose reviewer roles and the LLM behind each perspective, inspect disagreement and evidence, and—if you are building an agent—extend the same review through API or MCP before a consequential action.
            </p>

            <p className="text-sm sm:text-base text-gray-500 font-medium mb-8 sm:mb-10 leading-relaxed max-w-2xl">
              EthersFlow is a verification layer for agentic systems.
            </p>

            {/* Primary and Secondary Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-8">
              <button 
                onClick={() => {
                  setMessages([]);
                  setResults(null);
                  setQuery('');
                  setActiveTab('analysts');
                  setCurrentAnalysisId(null);
                  setView('main');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <span>Try the Console</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button 
                onClick={() => {
                  setView('developers');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-gray-200 hover:border-gray-900 text-gray-800 font-black rounded-2xl transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>PROTECT AN AGENT ACTION</span>
              </button>
            </div>
            
            {/* Problem Accordion */}
            <div className="mb-6 max-w-2xl">
               <details className="group bg-gray-50/80 rounded-2xl border border-gray-100 p-4 transition-all">
                  <summary className="flex items-center justify-between cursor-pointer text-xs font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors list-none">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Important AI answers need more than one perspective
                    </span>
                    <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform text-gray-400" />
                  </summary>
                  <div className="mt-3 text-xs sm:text-sm text-gray-600 font-medium leading-relaxed text-left border-t border-gray-200/60 pt-3">
                    Single-model AI systems can produce plausible yet flawed reasoning, missing edge-case risks and creating liability for mission-critical operations. EthersFlow coordinates independent reviewer roles into structured adversarial cross-examination—exposing contradictions, recording provenance, and enforcing verification policy before an agent executes.
                  </div>
               </details>
            </div>
          </div>

          {/* Right Column: Instant Access Auth / Sign-in Card */}
          <div className="lg:col-span-5 w-full">
            <div className="bg-white rounded-[36px] sm:rounded-[44px] p-6 sm:p-8 lg:p-10 shadow-2xl shadow-indigo-100/60 border border-indigo-50">
              <div className="text-center mb-6">
                <h3 className="text-xl font-black text-gray-900 mb-1">Access the Review Console</h3>
                <p className="text-xs font-bold text-gray-400">Launch an interactive review session</p>
              </div>

              {isSignUp && (
                <div className="bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-indigo-50/80 rounded-2xl p-4 mb-6 border border-indigo-100 text-left">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="bg-indigo-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-sm">
                      Instant Access
                    </span>
                    <span className="text-xs font-black text-indigo-950">No Credit Card Required</span>
                  </div>
                  <p className="text-xs text-gray-600 font-medium leading-relaxed">
                    Test adversarial reviewer configurations and decision verification immediately.
                  </p>
                </div>
              )}

               <button 
                onClick={handleGoogleAuth}
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 py-3.5 rounded-2xl font-black text-gray-900 hover:bg-gray-50 hover:border-indigo-100 transition-all mb-4 shadow-sm cursor-pointer text-sm"
              >
                <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                {isSignUp ? "Continue with Google" : t('continue_google')}
              </button>

              <div className="flex items-center gap-4 mb-4">
                <div className="h-px bg-gray-100 flex-1" />
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{t('or')}</span>
                <div className="h-px bg-gray-100 flex-1" />
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-3">
                <input 
                  type="email"
                  required
                  placeholder={t('email_placeholder')}
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all font-bold text-gray-700 text-sm"
                />
                <input 
                  type="password"
                  required
                  placeholder={t('password_placeholder')}
                  value={passInput}
                  onChange={(e) => setPassInput(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all font-bold text-gray-700 text-sm"
                />
                {authError && <p className="text-xs text-red-500 font-bold px-2">{authError}</p>}
                <button 
                  type="submit"
                  className="w-full bg-indigo-600 text-white font-black py-3.5 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all cursor-pointer text-sm uppercase tracking-wider"
                >
                  {isSignUp ? "Create Instant Account" : t('continue_email')}
                </button>
              </form>
              
              <div className="mt-6 text-center space-y-3">
                <button 
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-xs font-black text-indigo-500 hover:text-indigo-700 underline tracking-wider uppercase transition-colors block w-full cursor-pointer"
                >
                  {isSignUp ? t('already_account') : t('new_to_ethersflow')}
                </button>
              </div>

              <p className="mt-6 text-center text-[10px] text-gray-400 font-medium px-2 leading-relaxed tracking-wide">
                By continuing, you acknowledge EthersFlow's <button type="button" onClick={() => { setView('privacy'); window.scrollTo({ top: 0, behavior: 'instant' }); }} className="text-indigo-500 hover:text-indigo-600 font-bold underline cursor-pointer bg-transparent border-none p-0 inline">Privacy Policy</button> and agree to get occasional operational updates and notifications.
              </p>
            </div>
          </div>
        </div>

        {/* 3-Step Verification Pipeline on Homepage */}
        <div className="w-full bg-slate-50/70 border-y border-gray-100 py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16 xl:px-24">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="text-[10px] sm:text-xs font-black text-indigo-600 uppercase tracking-[0.4em] mb-4">Verification Flow</div>
              <h2 className="text-3xl sm:text-4xl font-black text-[#1d1d1f] tracking-tight mb-4">
                A review protocol that makes AI decisions inspectable before they execute.
              </h2>
              <p className="text-sm sm:text-base text-gray-500 font-semibold leading-relaxed">
                EthersFlow routes a request through specialized reviewers, records disagreement and provenance, and returns a policy-aware result with evidence and escalation paths.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 font-black text-lg flex items-center justify-center mb-6">
                    1
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-3">Configure Reviewer Roles</h3>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed mb-4">
                    Choose reviewer roles in the Console across diverse model architectures. Assign independent domain perspectives, calibrate evidence requirements, and set quorum thresholds.
                  </p>
                </div>
                <div className="pt-4 border-t border-gray-100 text-[11px] font-black text-indigo-600 uppercase tracking-widest">
                  Console & Policy Setup
                </div>
              </div>

              <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 font-black text-lg flex items-center justify-center mb-6">
                    2
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-3">Inspect Disagreement & Evidence</h3>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed mb-4">
                    Reviewers independently cross-examine reasoning chains. Inspect the disagreement conflict map, cited documentation, critical dissent, and consensus alignment scores in an inspectable trace.
                  </p>
                </div>
                <div className="pt-4 border-t border-gray-100 text-[11px] font-black text-indigo-600 uppercase tracking-widest">
                  Inspectable Review Trace
                </div>
              </div>

              <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 font-black text-lg flex items-center justify-center mb-6">
                    3
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-3">Understand the Reviewed Result</h3>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed mb-4">
                    Receive a synthesized, policy-aware result with consensus alignment scores, verified quorum status, dissenting viewpoints, and clear policy resolution before taking action.
                  </p>
                </div>
                <div className="pt-4 border-t border-gray-100 text-[11px] font-black text-indigo-600 uppercase tracking-widest">
                  Verified Outcome & Evidence
                </div>
              </div>
            </div>

            {/* Separate Developer Extension Card */}
            <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-indigo-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 text-left">
              <div className="space-y-1 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Developer Extension: API & MCP Action Gating</span>
                </div>
                <h4 className="text-lg font-black text-gray-900 pt-1">Enforce Verification Policies Before Autonomous Agent Actions</h4>
                <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed">
                  Put verification directly in your agent's execution path. Extend the same review capability through compatible SDK, REST API (<code className="text-indigo-600 font-mono">/api/v1/verify</code>), or native Model Context Protocol (MCP) server before high-stakes tool calls execute.
                </p>
              </div>
              <button
                onClick={() => {
                  setView('developers');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="shrink-0 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
              >
                Developer Hub →
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div id="pricing" className="w-full bg-[#1d1d1f] py-16 sm:py-32 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-indigo-600/10 blur-[120px] rounded-full translate-x-1/2" />
          <div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16 xl:px-24 relative z-10 text-center">
            <div className="text-center mb-10 sm:mb-16">
              <div className="text-[10px] sm:text-[12px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-4 sm:mb-6">Verification That Scales</div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4 tracking-tight leading-tight">Verification that scales with the consequence of the action.</h2>
              <p className="text-sm sm:text-base text-gray-400 font-semibold max-w-2xl mx-auto">Choose the review configuration, latency class, and policy enforcement level matched to your workflow requirements.</p>
            </div>

            <div className="flex flex-col items-center mb-12 sm:mb-20 space-y-8">
              <div className="bg-gray-800/60 p-1 rounded-2xl sm:rounded-3xl flex items-center border border-gray-700/50">
                 <button 
                   onClick={() => setPricingTab('individual')}
                   className={cn(
                     "px-6 sm:px-10 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all",
                     pricingTab === 'individual' ? "bg-white text-[#1d1d1f] shadow-lg" : "text-gray-400 hover:text-white"
                   )}
                 >
                   Individual Plans
                 </button>
                 <button 
                   onClick={() => setPricingTab('team')}
                   className={cn(
                     "px-6 sm:px-10 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all",
                     pricingTab === 'team' ? "bg-white text-[#1d1d1f] shadow-lg" : "text-gray-400 hover:text-white"
                   )}
                 >
                   Teams & Enterprise
                 </button>
              </div>

              {pricingTab === 'individual' && (
                <div className="flex items-center gap-4">
                  <span className={cn("text-xs font-black transition-colors uppercase tracking-widest", billingInterval === 'month' ? "text-white" : "text-gray-500")}>Monthly</span>
                  <button 
                    onClick={() => setBillingInterval(prev => prev === 'month' ? 'year' : 'month')}
                    className="w-12 h-6 bg-gray-700 rounded-full p-1 transition-all flex items-center"
                  >
                    <motion.div 
                      layout
                      className={cn("w-4 h-4 rounded-full shadow-sm", billingInterval === 'year' ? "bg-indigo-400 ml-auto" : "bg-white")}
                    />
                  </button>
                  <span className={cn("text-xs font-black transition-colors uppercase tracking-widest flex items-center gap-2", billingInterval === 'year' ? "text-white" : "text-gray-500")}>
                    Yearly
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-[8px] rounded-md border border-indigo-500/20">Save 15%</span>
                  </span>
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {pricingTab === 'individual' ? (
                <motion.div 
                  key="indiv"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-end"
                >
                  {/* Free / Sandbox */}
                  <div className="bg-gray-800/40 backdrop-blur-md border border-gray-700 p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] text-left">
                    <h3 className="text-lg sm:text-xl font-black text-white mb-2">Sandbox Verification</h3>
                    <p className="text-[10px] sm:text-xs text-gray-400 font-bold mb-4">Initial multi-agent exploration & verification</p>
                    <div className="flex items-baseline gap-1 mb-8">
                       <span className="text-3xl sm:text-4xl font-black text-white">$0</span>
                    </div>
                    <ul className="space-y-3 sm:space-y-4 mb-10">
                      {['3 reviewer roles per review', 'Interactive review sandbox', 'Contradiction & disagreement mapping', 'Local input sanitization'].map((feat, i) => (
                        <li key={i} className="flex items-center gap-3 text-xs sm:text-sm font-bold text-gray-300">
                          <CheckCircle className="w-4 h-4 text-indigo-400" />
                          {feat}
                        </li>
                      ))}
                    </ul>
                    <button 
                      onClick={() => {
                        if (user) {
                           setView('main');
                           window.scrollTo({ top: 0, behavior: 'smooth' });
                        } else {
                           setIsSignUp(true);
                           window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className="w-full py-4 bg-white text-[#1d1d1f] font-black rounded-2xl hover:bg-gray-100 transition-all text-sm uppercase tracking-wider"
                    >
                      {user ? 'Go to Workbench' : 'Try the Console'}
                    </button>
                  </div>

                  {/* Pro / Production Review */}
                  <div className="bg-white p-8 sm:p-12 rounded-[40px] sm:rounded-[56px] text-left shadow-2xl shadow-indigo-900/40 relative transform sm:scale-105 lg:scale-110">
                    <h3 className="text-xl sm:text-2xl font-black text-[#1d1d1f] mb-2 uppercase tracking-tight">Production Review</h3>
                    <p className="text-xs sm:text-sm text-gray-500 font-bold mb-4">Everyday audit, verification & policy enforcement</p>
                    <div className="flex items-baseline gap-1 mb-8">
                      <span className="text-4xl sm:text-5xl font-black text-[#1d1d1f]">
                        ${billingInterval === 'year' ? '17' : '20'}
                      </span>
                      <span className="text-gray-500 font-bold text-[10px] sm:text-xs ml-2">
                        / seat / mo {billingInterval === 'year' ? 'billed annually' : ''}
                      </span>
                    </div>
                    <ul className="space-y-5 mb-12">
                      {['Unlimited review configurations', 'Contradiction & disagreement mapping', 'Inspectable review traces & export', 'Zero data retention mode (ZDR)', 'Custom reviewer role builder'].map((feat, i) => (
                        <li key={i} className="flex items-center gap-4 text-sm font-bold text-gray-600 font-sans tracking-tight">
                          <CheckCircle className="w-5 h-5 text-indigo-600" />
                          {feat}
                        </li>
                      ))}
                    </ul>
                    <button 
                      onClick={() => {
                        if (user) {
                          setUpgradeError(null);
                          setShowUpgradeModal(true);
                        } else {
                          setIsSignUp(true);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all text-sm uppercase tracking-wider"
                    >
                      {currentPlan === 'pro' ? 'Current Plan' : 'Subscribe Pro'}
                    </button>
                  </div>

                  {/* Max / Deep Analysis */}
                  <div className="bg-gray-800/40 backdrop-blur-md border border-gray-700 p-10 rounded-[48px] text-left">
                    <h3 className="text-xl font-black text-white mb-2">Deep Analysis</h3>
                    <p className="text-xs text-gray-400 font-bold mb-4">Deep consensus for complex multi-model vectors</p>
                    <div className="flex items-baseline gap-1 mb-8">
                      <span className="text-4xl font-black text-white">${billingInterval === 'year' ? '80' : '100'}</span>
                      <span className="text-gray-500 font-bold text-xs ml-2">/ seat / month</span>
                    </div>
                    <ul className="space-y-4 mb-10">
                      {['High-throughput review limits', 'Deep multi-model reviews', 'Zero-downtime provider failover', 'Inspectable audit & attestation traces', 'Direct report & trace exports'].map((feat, i) => (
                        <li key={i} className="flex items-center gap-3 text-xs sm:text-sm font-bold text-gray-300">
                          <CheckCircle className="w-4 h-4 text-indigo-400" />
                          {feat}
                        </li>
                      ))}
                    </ul>
                    <button 
                      onClick={() => {
                        if (user) {
                          setUpgradeError(null);
                          setShowUpgradeModal(true);
                        } else {
                          setIsSignUp(true);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className="w-full py-4 bg-transparent border-2 border-gray-600 text-white font-black rounded-2xl hover:bg-gray-700 transition-all uppercase tracking-wider text-sm"
                    >
                      Subscribe Max
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="team"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto"
                >
                  <div className="bg-gray-800/40 backdrop-blur-md border border-gray-700 p-12 rounded-[56px] text-left">
                    <h3 className="text-2xl font-black text-white mb-2">Team Control</h3>
                    <p className="text-sm text-gray-400 font-bold mb-8 italic">Centralized reasoning, verification routing, and identity management for teams.</p>
                    <ul className="space-y-5 mb-12">
                      {['Centralized Billing & Admin Controls', 'Shared Team Knowledge Corpi', 'Local Zero-Trust Compliance Controls', 'SAML SSO & OIDC Integrations'].map((feat, i) => (
                        <li key={i} className="flex items-center gap-4 text-base font-bold text-gray-300">
                          <CheckCircle className="w-5 h-5 text-indigo-400" />
                          {feat}
                        </li>
                      ))}
                    </ul>
                    <button 
                      onClick={() => {
                        setView('enterprise_plan_page');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full py-5 bg-white text-[#1d1d1f] font-black rounded-3xl hover:bg-gray-100 transition-all text-sm uppercase tracking-wider"
                    >
                      Configure Team Page
                    </button>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 backdrop-blur-md border border-indigo-500/30 p-12 rounded-[56px] text-left">
                    <h3 className="text-2xl font-black text-white mb-2">Sovereign Deployment</h3>
                    <p className="text-sm text-indigo-300 font-bold mb-8 italic">Fully isolated, policy-enforced deployment on client hardware or dedicated VPC nodes.</p>
                    <ul className="space-y-5 mb-12">
                      {['Custom Agent Fine-Tuning & Weights', 'Isolated Dedicated Private VPC Nodes', 'Active 180s Multi-Agent Maximum SLA Limit', 'ZDR Sovereign Storage Certification'].map((feat, i) => (
                        <li key={i} className="flex items-center gap-4 text-base font-bold text-gray-200">
                          <CheckCircle className="w-5 h-5 text-indigo-400" />
                          {feat}
                        </li>
                      ))}
                    </ul>
                    <button 
                      onClick={() => {
                        setShowContactSales(true);
                      }}
                      className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all text-sm uppercase tracking-wider"
                    >
                      Discuss a protected workflow
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="w-full bg-white py-32 mt-20 border-t border-gray-100">
          <div className="max-w-3xl mx-auto px-6">
            <div className="text-center mb-20">
              <div className="text-[12px] font-black text-indigo-600 uppercase tracking-[0.4em] mb-6">{t('discovery') || "Discovery"}</div>
              <h2 className="text-4xl lg:text-5xl font-black text-[#1d1d1f] mb-4 tracking-tighter">{t('everything_you_need_to_know') || "Everything you need to know"}</h2>
              <p className="text-gray-400 font-bold tracking-widest uppercase text-[10px]">{t('faq', 'Frequently Asked Questions')}</p>
            </div>
            
            <div className="space-y-4">
              {[
                { 
                  q: "What is EthersFlow?", 
                  a: "EthersFlow is a verification layer for agentic systems. Configure independent reviewer roles in the Console, inspect disagreement and evidence in an inspectable review trace, and enforce the resulting policy through API or MCP before an agent calls a tool or changes the world." 
                },
                { 
                  q: "Why is independent review necessary before AI agents execute actions?", 
                  a: "Single-model AI systems can produce plausible yet flawed reasoning, missing edge-case risks and creating liability for mission-critical operations. EthersFlow solves this by coordinating independent reviewer roles into structured adversarial cross-examination—exposing contradictions, recording provenance, and enforcing verification policy before an agent executes." 
                },
                { 
                  q: "How does EthersFlow enforce policies at the tool boundary?", 
                  a: "Using our REST API, TypeScript/Python SDKs, or MCP server, agent actions and proposed tool executions are routed through policy verification gates. Reviewers cross-examine the proposal, evaluate evidence, calculate a Consensus Alignment Score, and enforce policy rules before allowing tool execution." 
                },
                { 
                  q: "Is customer data preserved or used for training?", 
                  a: "No. EthersFlow is designed for zero-retention processing. For eligible plans and routes, customer inputs and tool payloads are processed ephemerally in-memory and not retained on EthersFlow servers or used to train foundation models." 
                },
                { 
                  q: "How do I interpret the Consensus Alignment Score and Evidence Status?", 
                  a: "The Consensus Alignment Score measures statistical agreement across non-homogeneous reviewer models. Evidence Status reflects the strength of empirical citations and grounding. If critical dissent or an evidentiary gap is surfaced, the action gate blocks execution and routes the review for human oversight." 
                }
              ].map((item, i) => (
                <div key={i} className="border-b border-gray-100 last:border-0">
                  <button 
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className="w-full py-8 flex items-center justify-between text-left group"
                  >
                    <span className={cn(
                      "text-xl font-black transition-colors",
                      expandedFaq === i ? "text-indigo-600" : "text-[#1d1d1f] group-hover:text-indigo-500"
                    )}>{item.q}</span>
                    <Plus className={cn(
                      "w-6 h-6 text-gray-300 transition-transform duration-300",
                      expandedFaq === i ? "rotate-45 text-indigo-600" : ""
                    )} />
                  </button>
                  <AnimatePresence>
                    {expandedFaq === i && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <p className="pb-8 text-gray-500 font-bold leading-relaxed text-lg">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Real Footer for Landing */}
        <CommonFooter setView={setView} />
      </div>
    );
  }


  return (
    <div className="flex min-h-screen bg-white dark:bg-[#0c0d10] overflow-hidden relative">
      {/* Floating Google Sign-In Pop-up Card for Guest Users (ChatGPT style) */}
      {!authUser && showGooglePrompt && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[999] bg-white rounded-3xl p-5 sm:p-6 w-[340px] sm:w-[380px] shadow-2xl border border-gray-200/90 text-gray-900 font-sans leading-normal"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-4">
            <div className="flex items-center gap-2.5">
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span className="text-xs font-bold text-gray-800">Sign in to ethersflow.ai with google.com</span>
            </div>
            <button
              onClick={() => setShowGooglePrompt(false)}
              className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-full transition-colors cursor-pointer font-black text-xs"
              title="Dismiss"
            >
              ✕
            </button>
          </div>

          {/* Profile / Guest Account Info */}
          <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-150 flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black text-base flex items-center justify-center flex-shrink-0 shadow-sm">
              E
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-gray-900 truncate">EthersFlow Instant Guest</p>
              <p className="text-[11px] text-gray-500 font-medium truncate">ethersflow.dev@gmail.com</p>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={() => signInWithGoogle()}
            className="w-full py-3 px-4 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mb-3"
          >
            <span>Continue as EthersFlow</span>
          </button>

          {/* Disclaimer */}
          <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
            To continue, Google will share your name, email address, and profile picture with this site. See this site's{' '}
            <button onClick={() => setView('privacy')} className="text-indigo-600 hover:underline font-bold bg-transparent border-none p-0 inline">privacy policy</button>{' '}
            and{' '}
            <button onClick={() => setView('terms')} className="text-indigo-600 hover:underline font-bold bg-transparent border-none p-0 inline">terms of service</button>.
          </p>
        </motion.div>
      )}

      <Sidebar />
      
      <div id="main-app-scroll-pane" className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto overflow-x-hidden relative bg-white dark:bg-[#0c0d10]">
        <div id="scroll-anchor-top" className="w-0 h-0 pointer-events-none" />
        {/* Project Context Header (Dynamic) */}
        {activeProjectId && (
          <div className="hidden lg:flex px-8 py-3 bg-indigo-50/50 border-b border-indigo-100/50 items-center justify-between sticky top-[73px] z-10 backdrop-blur-sm">
            <div className="flex items-center gap-3 overflow-hidden">
               <div className="flex-none w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                 <Folder className="w-4 h-4" />
               </div>
               <div className="min-w-0">
                 <div className="flex items-center gap-2">
                   <h2 className="text-xs font-black text-indigo-900 tracking-tight truncate uppercase">Project Focus</h2>
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                 </div>
                 <p className="text-[10px] font-bold text-indigo-400 truncate uppercase mt-0.5">{projects.find(p => p.id === activeProjectId)?.name}</p>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex -space-x-2">
                 {projects.find(p => p.id === activeProjectId)?.team?.slice(0, 3).map((m, i) => (
                   <div key={i} className="w-6 h-6 rounded-full bg-white border-2 border-indigo-50 flex items-center justify-center text-[8px] font-black text-indigo-600 shadow-sm" title={m.email}>
                     {((m.email || 'Y').trim().charAt(0) || 'Y').toUpperCase()}
                   </div>
                 ))}
                 {(projects.find(p => p.id === activeProjectId)?.team?.length || 0) > 3 && (
                   <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-gray-400 shadow-sm">
                     +{(projects.find(p => p.id === activeProjectId)?.team?.length || 0) - 3}
                   </div>
                 )}
               </div>
               <button 
                 onClick={() => setView('projects')}
                 className="px-3 py-1 bg-white border border-indigo-200 rounded-lg text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:bg-indigo-50 transition-colors shadow-sm"
               >
                 Switch Project
               </button>
            </div>
          </div>
        )}

        {/* Mobile Header */}
        <header className="lg:hidden border-b border-gray-100 dark:border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-[#0c0d10]/80 backdrop-blur-md z-20">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
                title="Open Side Menu"
              >
                <div className="w-6 h-5 flex flex-col justify-between">
                  <div className="w-full h-0.5 bg-current rounded-full" />
                  <div className="w-full h-0.5 bg-current rounded-full" />
                  <div className="w-full h-0.5 bg-current rounded-full" />
                </div>
              </button>
              <Logo size="sm" />
              <h1 className="text-lg font-black tracking-tighter italic text-gray-900 dark:text-white">EthersFlow</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Theme Toggle Buttons (Light / Dark) */}
              <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl border border-gray-200/80 dark:border-zinc-700/80 shadow-sm">
                <button
                  onClick={() => setTheme('light')}
                  className={cn(
                    "p-1.5 rounded-lg transition-all cursor-pointer",
                    theme === 'light'
                      ? "bg-white text-amber-500 shadow-sm font-bold"
                      : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  )}
                  title="Light Mode"
                >
                  <Sun className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={cn(
                    "p-1.5 rounded-lg transition-all cursor-pointer",
                    theme === 'dark'
                      ? "bg-zinc-700 text-yellow-400 shadow-sm font-bold"
                      : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  )}
                  title="Dark Mode"
                >
                  <Moon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex border-b border-gray-100 dark:border-zinc-800/60 px-8 py-4 items-center justify-between sticky top-0 bg-white/70 dark:bg-[#0c0d10]/70 backdrop-blur-md z-20">
          {/* Left Side: Side Menu Toggle when Sidebar is Collapsed */}
          <div className="flex items-center gap-3">
            {sidebarCollapsed && (
              <button 
                onClick={() => setSidebarCollapsed(false)}
                className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800"
                title="Expand Side Menu"
              >
                <div className="w-5 h-4 flex flex-col justify-between">
                  <div className="w-full h-0.5 bg-current rounded-full" />
                  <div className="w-full h-0.5 bg-current rounded-full" />
                  <div className="w-full h-0.5 bg-current rounded-full" />
                </div>
              </button>
            )}
          </div>

          {/* Right Side Controls: Theme Toggle & Run Consensus */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle Buttons (Light / Dark) */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl border border-gray-200/80 dark:border-zinc-700/80 shadow-sm">
              <button
                onClick={() => setTheme('light')}
                className={cn(
                  "p-1.5 rounded-lg transition-all cursor-pointer",
                  theme === 'light'
                    ? "bg-white text-amber-500 shadow-sm font-bold"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                )}
                title="Light Mode"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={cn(
                  "p-1.5 rounded-lg transition-all cursor-pointer",
                  theme === 'dark'
                    ? "bg-zinc-700 text-yellow-400 shadow-sm font-bold"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                )}
                title="Dark Mode"
              >
                <Moon className="w-4 h-4" />
              </button>
            </div>

            <button 
              disabled={isAnalyzing || (!query.trim() && !results)}
              onClick={() => {
                if (results && !isAnalyzing && !query.trim()) {
                  // Scroll to results
                  const resultsElem = document.getElementById('results-section');
                  if (resultsElem) resultsElem.scrollIntoView({ behavior: 'smooth' });
                } else {
                  handleRunAnalysis();
                }
              }}
              className={cn(
                "flex items-center gap-3 px-6 sm:px-8 py-2.5 rounded-2xl font-black text-xs uppercase tracking-[0.15em] transition-all shadow-lg active:scale-95",
                isAnalyzing
                  ? "bg-indigo-500 text-white shadow-indigo-200 animate-pulse"
                  : (!query.trim() && !results)
                  ? "bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed shadow-none"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100"
              )}
            >
              {isAnalyzing ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Review in Progress...</span>
                </>
              ) : results && !query.trim() ? (
                <>
                  <Eye className="w-4 h-4" />
                  <span>View Decision Evidence</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Run Independent Review</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Global Overlays */}
        {/* Camera Overlay */}
        <AnimatePresence>
          {showCamera && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
            >
              <div className="bg-white rounded-[48px] overflow-hidden w-full max-w-2xl relative shadow-2xl">
                <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tighter">Optical Capture</h3>
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">Direct Neural Input</p>
                  </div>
                  <button onClick={closeCamera} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all">
                    <Plus className="w-6 h-6 rotate-45 text-gray-400" />
                  </button>
                </div>

                <div className="aspect-video bg-black relative">
                  {!capturedImage ? (
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img src={capturedImage} className="w-full h-full object-cover" alt="Captured" />
                  )}
                  
                  <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6">
                    {!capturedImage ? (
                      <button 
                        onClick={capturePhoto}
                        className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl scale-110 border-8 border-white/20 active:scale-95 transition-all"
                      >
                        <div className="w-12 h-12 rounded-full border-4 border-indigo-600" />
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={() => setCapturedImage(null)}
                          className="bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-white/20 transition-all"
                        >
                          Retake
                        </button>
                        <button 
                          onClick={savePhoto}
                          className="bg-indigo-600 text-white px-12 py-4 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all"
                        >
                          Attach to Session
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* Payment Success/Cancel Global Banner */}
      <AnimatePresence>
        {paymentNotification && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] w-full max-w-md px-4"
          >
            <div className={`p-5 rounded-[28px] shadow-2xl border-2 flex items-center justify-between gap-4 text-xs font-semibold backdrop-blur-md ${
              paymentNotification.type === 'success' 
                ? 'bg-emerald-50/95 border-emerald-200 text-emerald-950 shadow-emerald-500/10' 
                : paymentNotification.type === 'cancel'
                ? 'bg-amber-50/95 border-amber-200 text-amber-950 shadow-amber-500/10'
                : 'bg-indigo-50/95 border-indigo-200 text-indigo-950 shadow-indigo-500/10'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full shrink-0 ${
                  paymentNotification.type === 'success' 
                    ? 'bg-emerald-100 text-emerald-600 font-bold' 
                    : paymentNotification.type === 'cancel'
                    ? 'bg-amber-100 text-amber-600 font-bold'
                    : 'bg-indigo-100 text-indigo-600 font-bold'
                }`}>
                  <CheckCircle className="w-4 h-4" />
                </div>
                <p className="leading-relaxed font-bold">{paymentNotification.message}</p>
              </div>
              <button 
                onClick={() => setPaymentNotification(null)}
                className="px-3 py-1.5 hover:bg-black/5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors shrink-0 cursor-pointer border border-[#1d1d1f]/10"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mandatory 7-Day Free Trial Gate Modal (Commented out to allow instant free testing)
      <AnimatePresence>
        {user && currentPlan === 'free' && user.uid !== 'dev-bypass-user' && 
         !['ethersflow.dev@gmail.com', 'ryan.milisits@gmail.com', 'craig@beerwego.com', 'jim@brc-llc.com'].includes(user.email?.toLowerCase() || '') && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1200] bg-[#1d1d1f]/80 backdrop-blur-2xl flex items-center justify-center p-6 cursor-default"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[32px] sm:rounded-[48px] shadow-[0_32px_80px_rgba(0,0,0,0.5)] w-full max-w-lg p-6 sm:p-10 border border-indigo-100 relative text-center overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600" />
              
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mx-auto mb-6 shadow-sm border border-indigo-100/60">
                <CreditCard className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600" />
              </div>

              <div className="inline-block bg-indigo-600 text-white text-[11px] font-black uppercase px-3 py-1 rounded-full tracking-wider mb-3 shadow-md shadow-indigo-200">
                7-Day Free Trial • Card Authorization Required
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-[#1d1d1f] tracking-tight mb-3">
                Activate Your Free Trial ($0 Today)
              </h3>

              <p className="text-gray-600 font-bold text-xs sm:text-sm leading-relaxed mb-6 max-w-md mx-auto">
                Welcome! No charges are made today ($0.00). Please authorize your payment card to activate your 7-day free trial on the EthersFlow Pro plan. Standard $20/month pricing applies automatically after 7 days unless canceled in your settings.
              </p>

              <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 text-left mb-6 space-y-2">
                <div className="flex items-center gap-2.5 text-xs text-gray-700 font-bold">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Full Pro Access: Multi-model consensus & reasoning</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-gray-700 font-bold">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>$0.00 charged today during your 7-day trial</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-gray-700 font-bold">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Cancel anytime in settings before trial ends</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 mb-6">
                <span className={cn("text-[10px] font-black tracking-widest uppercase transition-colors", billingInterval === 'month' ? "text-indigo-600" : "text-gray-400")}>Monthly ($20/mo after trial)</span>
                <button 
                  type="button"
                  onClick={() => setBillingInterval(prev => prev === 'month' ? 'year' : 'month')}
                  className="w-10 h-5 bg-gray-200 rounded-full p-1 transition-all flex items-center border border-gray-300 cursor-pointer"
                >
                  <motion.div 
                    layout
                    className={cn("w-3 h-3 rounded-full shadow-sm", billingInterval === 'year' ? "bg-indigo-600 ml-auto" : "bg-white")}
                  />
                </button>
                <span className={cn("text-[10px] font-black tracking-widest uppercase transition-colors", billingInterval === 'year' ? "text-indigo-600" : "text-gray-400")}>Yearly ($17/mo after trial)</span>
              </div>

              {upgradeError && (
                <div className="mb-4 p-3 bg-red-50 text-red-800 border border-red-100 rounded-2xl text-xs font-bold text-left">
                  {upgradeError}
                </div>
              )}

              {upgradeBlockedUrl && (
                <a 
                  href={upgradeBlockedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full mb-4 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer text-center shadow-md"
                >
                  <span>Click Here to Proceed to Stripe Checkout</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              <button 
                onClick={async () => {
                  setUpgradeError(null);
                  setUpgradeBlockedUrl(null);
                  const isIframe = window.self !== window.top;
                  let checkoutWindow: Window | null = null;
                  if (isIframe) {
                    checkoutWindow = window.open('about:blank', '_blank');
                    if (checkoutWindow) {
                      checkoutWindow.document.write('<html><body style="font-family:sans-serif; text-align:center; padding-top:40px; color:#1d1d1f; background:#F9F8F6;"><p style="font-size:16px; font-weight:bold;">Initializing Secure 7-Day Trial Authorization...</p><p style="color:#86868b; font-size:14px;">Connecting to Stripe...</p></body></html>');
                    }
                  }

                  try {
                    const result = await createCheckoutSession(user.uid, 'pro', billingInterval, 7);
                    if (isIframe) {
                      if (checkoutWindow) {
                        checkoutWindow.location.href = result.url;
                      } else {
                        setUpgradeBlockedUrl(result.url);
                        setUpgradeError("Browser popup was blocked. Click the button above to complete authorization.");
                      }
                    } else {
                      window.location.href = result.url;
                    }
                  } catch (err: any) {
                    if (checkoutWindow) checkoutWindow.close();
                    setUpgradeError(err.message || "Failed to launch Stripe Checkout.");
                  }
                }}
                className="w-full py-4 sm:py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-200/60 transition-all text-xs sm:text-sm uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Start Your 7-Day Free Trial</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="mt-4">
                <button 
                  type="button"
                  onClick={() => logout()}
                  className="text-[11px] font-bold text-gray-400 hover:text-gray-600 underline cursor-pointer bg-transparent border-none"
                >
                  Sign out of workspace
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      */}

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowUpgradeModal(false); setUpgradeError(null); setUpgradeBlockedUrl(null); }}
            className="fixed inset-0 z-[1000] bg-[#1d1d1f]/60 backdrop-blur-xl flex items-center justify-center p-6 cursor-pointer"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[32px] sm:rounded-[56px] shadow-[0_32px_80px_rgba(0,0,0,0.4)] w-full max-w-lg max-h-[92vh] overflow-y-auto relative cursor-default custom-scrollbar"
            >
              <button 
                onClick={() => { setShowUpgradeModal(false); setUpgradeError(null); setUpgradeBlockedUrl(null); }}
                className="absolute top-4 right-4 sm:top-8 sm:right-8 p-2.5 sm:p-3.5 hover:bg-gray-100 rounded-full transition-all group z-[210] shadow-sm border border-gray-100 bg-white"
                aria-label="Close modal"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 group-hover:text-gray-900 transition-colors" />
              </button>

              <div className="p-6 sm:p-12 text-center">
                <div className="w-14 h-14 sm:w-20 sm:h-20 bg-indigo-50 rounded-[20px] sm:rounded-[32px] flex items-center justify-center text-indigo-600 mx-auto mb-4 sm:mb-8">
                  <ShieldCheck className="w-7 h-7 sm:w-10 sm:h-10" />
                </div>
                <h3 className="text-2xl sm:text-4xl font-black text-[#1d1d1f] tracking-tighter mb-2 sm:mb-4 leading-tight">{t('elevate_reasoning')}</h3>
                <p className="text-gray-500 font-bold mb-6 sm:mb-10 leading-relaxed max-w-sm mx-auto text-xs sm:text-sm">
                  {t('unlock_unlimited')}
                </p>

                {upgradeError && (
                  <div className="mb-6 sm:mb-8 p-4 bg-red-50 text-red-800 border border-red-100 rounded-3xl text-left flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-550" />
                    <div>
                      <p className="font-extrabold text-xs uppercase tracking-wider text-red-900">Stripe Integration Notice</p>
                      <p className="text-xs font-bold mt-1 text-red-700 leading-relaxed">{upgradeError}</p>
                    </div>
                  </div>
                )}

                {upgradeBlockedUrl && (
                  <div className="mb-6 sm:mb-8 p-5 bg-amber-50 text-amber-950 border border-amber-200 rounded-3xl text-left flex items-start gap-3 flex-col">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 animate-pulse" />
                      <div>
                        <p className="font-extrabold text-xs uppercase tracking-wider text-amber-950">Redirection Blocked</p>
                        <p className="text-xs font-medium mt-1 text-amber-800 leading-relaxed">
                          Your browser's popup blocker stopped the checkout tab from opening automatically. Click the link below to load Stripe.
                        </p>
                      </div>
                    </div>
                    <a 
                      href={upgradeBlockedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full mt-3 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer text-center shadow-md"
                    >
                      <span>Proceed to Stripe Checkout</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                <div className="flex items-center justify-center gap-4 mb-6 sm:mb-8">
                  <span className={cn("text-[10px] font-black tracking-widest uppercase transition-colors", billingInterval === 'month' ? "text-indigo-600" : "text-gray-400")}>Monthly</span>
                  <button 
                    onClick={() => setBillingInterval(prev => prev === 'month' ? 'year' : 'month')}
                    className="w-10 h-5 bg-gray-100 rounded-full p-1 transition-all flex items-center border border-gray-200"
                  >
                    <motion.div 
                      layout
                      className={cn("w-3 h-3 rounded-full shadow-sm", billingInterval === 'year' ? "bg-indigo-600 ml-auto" : "bg-white")}
                    />
                  </button>
                  <span className={cn("text-[10px] font-black tracking-widest uppercase transition-colors", billingInterval === 'year' ? "text-indigo-600" : "text-gray-400")}>Yearly <span className="text-[8px] text-green-500 font-black">(-15%)</span></span>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <button 
                    onClick={async () => {
                      setUpgradeError(null);
                      setUpgradeBlockedUrl(null);
                      if (user?.uid === 'dev-bypass-user') {
                        setUsage(prev => prev ? { ...prev, plan: 'pro' } : null);
                        setCurrentPlan('pro');
                        setShowUpgradeModal(false);
                        setPaymentNotification({
                          message: "Dev Bypass: Mock upgrade to PRO successful!",
                          type: "success"
                        });
                        return;
                      }

                      const isIframe = window.self !== window.top;
                      let checkoutWindow: Window | null = null;
                      if (isIframe) {
                        checkoutWindow = window.open('about:blank', '_blank');
                        if (checkoutWindow) {
                          checkoutWindow.document.write('<html><body style="font-family:sans-serif; text-align:center; padding-top:40px; color:#1d1d1f; background:#F9F8F6;"><p style="font-size:16px; font-weight:bold;">Initializing Secure Upgrade...</p><p style="color:#86868b; font-size:14px;">Connecting to Stripe...</p></body></html>');
                        }
                      }

                      try {
                        const result = await createCheckoutSession(user?.uid || '', 'pro', billingInterval);
                        if (isIframe) {
                          if (checkoutWindow) {
                            checkoutWindow.location.href = result.url;
                          } else {
                            setUpgradeBlockedUrl(result.url);
                            setUpgradeError("Your browser blocked the Stripe popup from opening. Please use the direct link below.");
                          }
                        } else {
                          window.location.href = result.url;
                        }
                      } catch (err: any) {
                        console.error("Upgrade Modal Pro click error:", err);
                        if (checkoutWindow) {
                          checkoutWindow.close();
                        }
                        setUpgradeError(err.message || "Failed to start Stripe session.");
                      }
                    }}
                    className="w-full py-4 sm:py-5 bg-indigo-600 text-white font-black rounded-3xl hover:bg-indigo-700 shadow-xl shadow-indigo-100/40 transition-all flex items-center justify-center gap-3 group text-sm uppercase tracking-wider cursor-pointer"
                  >
                    <span>Upgrade to Pro Plan — ${billingInterval === 'year' ? '17' : '20'}/mo</span>
                    <ArrowUp className="w-4 h-4 group-hover:translate-y-[-2px] transition-transform" />
                  </button>
                  <button 
                    onClick={async () => {
                      setUpgradeError(null);
                      setUpgradeBlockedUrl(null);
                      if (user?.uid === 'dev-bypass-user') {
                        setUsage(prev => prev ? { ...prev, plan: 'max' } : null);
                        setCurrentPlan('max');
                        setShowUpgradeModal(false);
                        setPaymentNotification({
                          message: "Dev Bypass: Mock upgrade to MAX successful!",
                          type: "success"
                        });
                        return;
                      }

                      const isIframe = window.self !== window.top;
                      let checkoutWindow: Window | null = null;
                      if (isIframe) {
                        checkoutWindow = window.open('about:blank', '_blank');
                        if (checkoutWindow) {
                          checkoutWindow.document.write('<html><body style="font-family:sans-serif; text-align:center; padding-top:40px; color:#1d1d1f; background:#F9F8F6;"><p style="font-size:16px; font-weight:bold;">Initializing Secure Upgrade...</p><p style="color:#86868b; font-size:14px;">Connecting to Stripe...</p></body></html>');
                        }
                      }

                      try {
                        const result = await createCheckoutSession(user?.uid || '', 'max', billingInterval);
                        if (isIframe) {
                          if (checkoutWindow) {
                            checkoutWindow.location.href = result.url;
                          } else {
                            setUpgradeBlockedUrl(result.url);
                            setUpgradeError("Your browser blocked the Stripe popup from opening. Please use the direct link below.");
                          }
                        } else {
                          window.location.href = result.url;
                        }
                      } catch (err: any) {
                        console.error("Upgrade Modal Max click error:", err);
                        if (checkoutWindow) {
                          checkoutWindow.close();
                        }
                        setUpgradeError(err.message || "Failed to start Stripe session.");
                      }
                    }}
                    className="w-full py-4 sm:py-5 bg-gray-900 text-white font-black rounded-3xl hover:bg-black shadow-xl shadow-gray-250 transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-wider cursor-pointer"
                  >
                    <span>Upgrade to Max Plan — ${billingInterval === 'year' ? '80' : '100'}/mo</span>
                  </button>
                  <button 
                    onClick={() => setShowContactSales(true)}
                    className="w-full py-4 sm:py-5 bg-white border-2 border-dashed border-gray-300 text-gray-700 hover:text-gray-900 font-extrabold rounded-3xl hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-wider cursor-pointer"
                  >
                    <span>Enterprise Plan — Contact Sales</span>
                  </button>
                  
                  <button 
                    onClick={() => setShowUpgradeModal(false)}
                    className="w-full py-3.5 text-gray-400 hover:text-gray-600 font-extrabold text-xs uppercase tracking-widest transition-all mt-2 hover:underline cursor-pointer"
                  >
                    Maybe Later
                  </button>
                </div>

                <div className="mt-6 pt-6 sm:mt-10 sm:pt-10 border-t border-gray-100 flex items-center justify-center gap-6">
                  {['SOC2', 'GDPR', 'HIPAA'].map(standard => (
                    <div key={standard} className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">{standard}</div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact Sales Modal */}
      <AnimatePresence>
        {showContactSales && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowContactSales(false);
              setSalesSuccess(false);
              setSalesError('');
            }}
            className="fixed inset-0 z-[220] bg-[#1d1d1f]/60 backdrop-blur-xl flex items-center justify-center p-6 cursor-pointer"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[40px] shadow-[0_32px_80px_rgba(0,0,0,0.4)] w-full max-w-lg overflow-hidden relative cursor-default border border-gray-100 p-8 sm:p-10 text-left"
            >
              <button 
                onClick={() => {
                  setShowContactSales(false);
                  setSalesSuccess(false);
                  setSalesError('');
                }}
                className="absolute top-6 right-6 p-2.5 hover:bg-gray-100 rounded-full transition-colors group"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-gray-400 group-hover:text-gray-900" />
              </button>

              {salesSuccess ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black tracking-tight mb-2 uppercase text-[#1d1d1f]">Inquiry Received</h3>
                  <p className="text-gray-500 font-bold text-sm mb-6 max-w-sm mx-auto leading-relaxed">
                    Your inquiry has been successfully dispatched to our client relation engines in real time. Our representative will contact you via email shortly.
                  </p>
                  <button
                    onClick={() => {
                      setShowContactSales(false);
                      setSalesSuccess(false);
                    }}
                    className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl transition-all text-xs uppercase tracking-wider"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!salesName || !salesEmail || !salesMessage) {
                      setSalesError('Please complete all required fields.');
                      return;
                    }
                    setSalesSubmitting(true);
                    setSalesError('');
                    try {
                      const res = await fetch('/api/contact-sales', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          name: salesName,
                          email: salesEmail,
                          company: salesCompany,
                          message: salesMessage
                        })
                      });
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(err.message || 'Inquiry propagation failed.');
                      }
                      setSalesSuccess(true);
                      setSalesName('');
                      setSalesEmail('');
                      setSalesCompany('');
                      setSalesMessage('');
                    } catch (err: any) {
                      setSalesError(err.message || 'An unexpected boundary error occurred.');
                    } finally {
                      setSalesSubmitting(false);
                    }
                  }}
                  className="space-y-5"
                >
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-650 rounded-[18px] flex items-center justify-center mb-4">
                    <Mail className="w-6 h-6" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-black tracking-tight uppercase text-[#1d1d1f]">Contact Sales</h3>
                    <p className="text-gray-500 font-bold text-xs mt-1 leading-relaxed">
                      Initialize deep reasoning weight setup, custom service-level SLAs, or dedicated RPC nodes.
                    </p>
                  </div>

                  {salesError && (
                    <div className="p-4 bg-red-50 rounded-2xl text-xs font-bold text-red-650 flex items-center gap-2">
                      <span>{salesError}</span>
                    </div>
                  )}

                  <div className="space-y-4 font-mono text-xs">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-450 mb-1.5 tracking-wider">Full Name *</label>
                      <input 
                        type="text" 
                        required
                        value={salesName}
                        onChange={(e) => setSalesName(e.target.value)}
                        placeholder="e.g. Satoshi Nakamoto"
                        className="w-full bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:bg-white rounded-2xl p-3 px-4 font-bold text-gray-900 outline-none transition-all placeholder:text-gray-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-450 mb-1.5 tracking-wider">Work Email *</label>
                      <input 
                        type="email" 
                        required
                        value={salesEmail}
                        onChange={(e) => setSalesEmail(e.target.value)}
                        placeholder="e.g. satoshi@bitcoin.org"
                        className="w-full bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:bg-white rounded-2xl p-3 px-4 font-bold text-gray-900 outline-none transition-all placeholder:text-gray-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-450 mb-1.5 tracking-wider">Company / Institution (Optional)</label>
                      <input 
                        type="text" 
                        value={salesCompany}
                        onChange={(e) => setSalesCompany(e.target.value)}
                        placeholder="e.g. Decentralized Labs"
                        className="w-full bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:bg-white rounded-2xl p-3 px-4 font-bold text-[#1d1d1f] outline-none transition-all placeholder:text-gray-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-450 mb-1.5 tracking-wider">Message *</label>
                      <textarea 
                        required
                        rows={3}
                        value={salesMessage}
                        onChange={(e) => setSalesMessage(e.target.value)}
                        placeholder="Custom architecture requirements or desired TPS arrays..."
                        className="w-full bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:bg-white rounded-2xl p-3 px-4 font-bold text-[#1d1d1f] outline-none transition-all placeholder:text-gray-400 resize-none"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={salesSubmitting}
                    className="w-full py-4 px-6 bg-indigo-600 disabled:bg-indigo-400 text-white font-extrabold rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-wider shadow-lg shadow-indigo-150 cursor-pointer"
                  >
                    <span>{salesSubmitting ? 'Dispatching...' : 'Submit Inquiry'}</span>
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workspace Create Custom Agent Modal Overlay */}
      <AnimatePresence>
        {workspaceShowCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[32px] sm:rounded-[40px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-10 relative custom-scrollbar text-left"
            >
              <button
                type="button"
                onClick={() => setWorkspaceShowCreateModal(false)}
                className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors z-20 cursor-pointer"
              >
                <Plus className="w-5 h-5 rotate-45 text-gray-400" />
              </button>

              <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-2">
                Create Custom Persona
              </h3>
              <p className="text-xs text-gray-400 font-bold mb-6 sm:mb-8 uppercase tracking-wider">
                Architect a new specialized reasoning perspective for your workspace library
              </p>

              <form onSubmit={handleSaveWorkspaceCustomAgent} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    Agent Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Zero-Trust Auditor"
                    value={workspaceNewName}
                    onChange={(e) => setWorkspaceNewName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold placeholder:text-gray-300 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    Brief Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Focuses on security and cryptographic validation"
                    value={workspaceNewDesc}
                    onChange={(e) => setWorkspaceNewDesc(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold placeholder:text-gray-300 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    Underlying LLM Engine
                  </label>
                  <select
                    value={workspaceNewModel}
                    onChange={(e) => setWorkspaceNewModel(e.target.value as Model)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all"
                  >
                    {AVAILABLE_MODELS.filter(m => !m.disabled).map(m => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  {(() => {
                    const modelInfo = AVAILABLE_MODELS.find(m => m.id === workspaceNewModel);
                    return modelInfo?.description ? (
                      <div className="mt-2 text-[10px] text-gray-500 font-medium leading-relaxed bg-gray-50/50 p-2.5 rounded-xl border border-gray-100/50">
                        {modelInfo.description}
                      </div>
                    ) : null;
                  })()}
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    System Instructions / Prompt
                  </label>
                  <textarea
                    required
                    placeholder="Detailed system prompt instructions..."
                    value={workspaceNewSystemPrompt}
                    onChange={(e) => setWorkspaceNewSystemPrompt(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold placeholder:text-gray-300 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all resize-y min-h-[140px] max-h-[220px] custom-scrollbar"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setWorkspaceShowCreateModal(false)}
                    className="px-6 py-3 border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-wider text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={workspaceIsSaving}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-100 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    {workspaceIsSaving ? "Saving..." : "Save & Deploy"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Agent Share Modal */}
      <AnimatePresence>
        {showShareAgentModal && sharingAgent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowShareAgentModal(false);
              setSharingAgent(null);
            }}
            className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-md flex items-center justify-center p-6 cursor-pointer"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg bg-white rounded-[48px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.3)] border border-white/20 p-12 cursor-default"
            >
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center">
                  <Brain className="w-10 h-10 text-indigo-600 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Share Expert Persona</h3>
                  <p className="text-gray-500 font-bold mb-1">
                    {sharingAgent.name}
                  </p>
                  <p className="text-xs text-gray-400 font-medium leading-relaxed max-w-sm">
                    {sharingAgent.description || (sharingAgent as any).desc || "Custom reasoning perspective."}
                  </p>
                </div>

                <div className="w-full space-y-8">
                  <div className="space-y-3 text-left">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Persona Import Link</label>
                    <div className="relative group">
                      <input 
                        readOnly 
                        value={sharedAgentLink}
                        className="w-full bg-gray-50 border border-gray-100 rounded-3xl px-6 py-5 text-xs font-mono text-gray-600 pr-32 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                      <button 
                        onClick={() => {
                          copyToClipboard(sharedAgentLink);
                          alert("Link copied!");
                        }}
                        className="absolute right-2 top-2 bottom-2 bg-gray-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest px-6 rounded-2xl transition-all cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="w-full h-px bg-gray-50" />

                  <div className="space-y-4 text-left">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Email Invitation</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input 
                        type="email"
                        value={shareAgentEmail}
                        onChange={(e) => setShareAgentEmail(e.target.value)}
                        placeholder="researcher@institutional.edu"
                        className="flex-1 bg-white border border-gray-100 rounded-3xl px-6 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                      />
                      <button 
                        disabled={isAgentEmailSharing}
                        onClick={handleAgentEmailShare}
                        className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white rounded-3xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isAgentEmailSharing ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                        Share
                      </button>
                    </div>
                    <p className="text-[9px] font-bold text-gray-400 pl-1 uppercase tracking-tight">Allows immediate one-click import into reasoning stack.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full mt-6">
                  <button 
                    onClick={() => disableAgentSharing(sharingAgent)}
                    className="flex-1 py-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-3xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Make Private
                  </button>
                  <button 
                    onClick={() => {
                      setShowShareAgentModal(false);
                      setSharingAgent(null);
                    }}
                    className="flex-1 py-4 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-3xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Close Relay
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDrive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
            onClick={() => setShowDrive(false)}
          >
             <div 
               className="bg-white rounded-[32px] sm:rounded-[48px] overflow-hidden w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh]"
               onClick={(e) => e.stopPropagation()}
             >
                {!isDriveConnected ? (
                  <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center overflow-y-auto custom-scrollbar">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-50 rounded-[24px] sm:rounded-[32px] flex items-center justify-center text-indigo-600 mx-auto mb-6 sm:mb-8 shrink-0">
                       <Cloud className="w-8 h-8 sm:w-10 sm:h-10" />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tighter mb-3 sm:mb-4">Connect Google Drive</h3>
                    <p className="text-gray-500 font-bold mb-8 sm:mb-10 leading-relaxed text-xs sm:text-sm">
                      EthersFlow requires read-only access to your Drive documents to synthesize knowledge from your private corpus.
                    </p>
                    <button 
                      onClick={async () => {
                        try {
                          await signInWithGoogleDrive();
                          setIsDriveConnected(true);
                          await fetchDriveFiles('root', true);
                        } catch (err: any) {
                          setDriveError(err.message || "Authorization failed.");
                        }
                      }}
                      className="w-full py-4 sm:py-5 bg-indigo-600 text-white font-black rounded-3xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 text-xs sm:text-sm cursor-pointer"
                    >
                      <img src="https://www.google.com/favicon.ico" className="w-5 h-5 brightness-0 invert" alt="Google" />
                      Authorize Neural Sync
                    </button>
                    <button onClick={() => setShowDrive(false)} className="mt-6 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors cursor-pointer">Cancel</button>
                  </div>
                ) : (
                  <>
                    <div className="p-6 sm:p-8 border-b border-gray-100 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                          <Cloud className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tighter">Drive Explorer</h3>
                          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-0.5 sm:mt-1">Select source documentation</p>
                        </div>
                      </div>
                      <button onClick={() => setShowDrive(false)} className="p-2.5 sm:p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all cursor-pointer">
                        <Plus className="w-5 h-5 sm:w-6 sm:h-6 rotate-45 text-gray-400" />
                      </button>
                    </div>
                    
                    <div className="p-6 sm:p-8 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                      <div className="space-y-3 pr-2">
                        {driveError && (
                          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-bold leading-relaxed">
                            Error syncing Drive: {driveError}
                          </div>
                        )}

                        {folderHistory.length > 0 && (
                          <button 
                            onClick={navigateUpDriveFolder}
                            className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-dashed border-gray-200 hover:bg-gray-50 transition-all text-xs font-black text-indigo-600 uppercase tracking-widest mb-2 cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            Back to Parent Folder
                          </button>
                        )}

                        {isFetchingDrive ? (
                           <div className="text-center py-16">
                             <RotateCcw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
                             <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Accessing Verifiable Documents...</p>
                           </div>
                        ) : driveFiles.length === 0 ? (
                          <div className="text-center py-10">
                            <CloudOff className="w-10 h-10 text-gray-200 mx-auto mb-4" />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No accessible files found in Drive</p>
                            <div className="flex gap-4 justify-center mt-6">
                              <button 
                                onClick={() => fetchDriveFiles(currentFolderId || 'root', false)}
                                className="px-5 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl cursor-pointer"
                              >
                                Retry
                              </button>
                              <button 
                                onClick={async () => {
                                  try {
                                    await signInWithGoogleDrive();
                                    await fetchDriveFiles(currentFolderId || 'root', true);
                                  } catch (err: any) {
                                    setDriveError(err.message || "Authorization failed.");
                                  }
                                }}
                                className="px-5 py-2 bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest rounded-xl cursor-pointer"
                              >
                                Re-Authorize
                              </button>
                            </div>
                          </div>
                        ) : (
                          driveFiles.map(file => {
                            const isFolder = file.mimeType === "application/vnd.google-apps.folder";
                            return (
                              <button 
                                  key={file.id}
                                  onClick={() => handleDriveItemClick(file, false)}
                                  className="w-full flex items-center justify-between p-3.5 rounded-[20px] border border-gray-50 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all text-left group cursor-pointer"
                              >
                                  <div className="flex items-center gap-3 sm:gap-4">
                                    {isFolder ? (
                                      <Folder className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 fill-amber-100" />
                                    ) : (
                                      <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
                                    )}
                                    <div className="min-w-0">
                                      <p className="text-xs sm:text-sm font-black text-gray-900 truncate max-w-[160px] sm:max-w-[240px]">{file.name}</p>
                                      <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase">
                                        {isFolder ? "Folder" : new Date(file.modifiedTime).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                  {isFolder ? (
                                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                                  ) : (
                                    <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-200 group-hover:text-indigo-600 transition-colors" />
                                  )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <div className="p-6 sm:p-8 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-3 sm:gap-0 items-center justify-between shrink-0">
                        <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest truncate max-w-full">Signed in as {user?.email}</p>
                        <div className="flex gap-4 shrink-0">
                          <button onClick={() => fetchDriveFiles(currentFolderId)} className="text-xs font-black text-indigo-600 uppercase tracking-tight cursor-pointer">Refresh List</button>
                          <button onClick={() => setIsDriveConnected(false)} className="text-xs font-black text-gray-400 uppercase tracking-tight cursor-pointer">Switch Account</button>
                        </div>
                    </div>
                  </>
                )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
       <AnimatePresence>
        {showVectorInspector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[220] bg-black/60 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto relative my-auto custom-scrollbar"
            >
              <button
                onClick={() => setShowVectorInspector(false)}
                className="absolute top-4 right-4 z-30 p-2.5 bg-white dark:bg-zinc-900 rounded-full shadow-md text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                aria-label="Close"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
              <NemotronVectorInspector
                initialDocuments={attachedFiles.map(f => f.content)}
                onInjectContext={(groundedText) => {
                  setPromptInput((prev) => (prev ? `${prev}\n\n[NEMOTRON GROUNDING CONTEXT]: ${groundedText}` : `[NEMOTRON GROUNDING CONTEXT]: ${groundedText}`));
                  setShowVectorInspector(false);
                }}
              />
            </motion.div>
          </motion.div>
        )}
        {showAgentLibrary && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[32px] sm:rounded-[56px] shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto md:overflow-hidden relative flex flex-col md:flex-row custom-scrollbar"
            >
              <button 
                onClick={() => setShowAgentLibrary(false)}
                className="absolute top-4 right-4 sm:top-8 sm:right-8 p-2.5 sm:p-3 hover:bg-gray-100 rounded-full sm:rounded-2xl transition-colors z-20 shadow-sm border border-gray-100 bg-white"
                aria-label="Close"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 rotate-45 text-gray-500 hover:text-gray-900 transition-colors" />
              </button>

              <div className="w-full md:w-1/3 bg-indigo-50/50 p-6 sm:p-12 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col justify-between shrink-0">
                <div>
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-2xl sm:rounded-3xl flex items-center justify-center text-indigo-600 shadow-xl mb-4 sm:mb-8">
                    <Plus className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-black text-[#1d1d1f] tracking-tighter mb-2 sm:mb-4 leading-tight">Reviewer Agent Library</h3>
                  <p className="text-gray-500 font-bold leading-relaxed text-xs sm:text-sm">
                    Deploy specialized reviewer perspectives from our validated reviewer agent gallery or architect your own.
                  </p>
                </div>
                
                <div className="space-y-4 pt-6 sm:pt-12 mt-6 sm:mt-0 border-t border-indigo-100">
                  <button 
                    onClick={() => {
                      setWorkspaceNewName('');
                      setWorkspaceNewDesc('');
                      setWorkspaceNewModel('qwen/qwen3.6-27b');
                      setWorkspaceNewSystemPrompt('Provide a unique perspective on the query. State your confidence (HIGH/MEDIUM/LOW) at the start.');
                      setWorkspaceShowCreateModal(true);
                    }}
                    className="w-full py-3.5 sm:py-4 bg-indigo-600 text-white font-black rounded-xl sm:rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100/40 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm uppercase tracking-wider"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    Custom Reviewer Agent
                  </button>
                </div>
              </div>

              <div className="flex-1 p-6 sm:p-12 overflow-y-auto md:max-h-[92vh] custom-scrollbar">
                {customAgents && customAgents.length > 0 && (
                  <div className="mb-8">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">My Reviewer Agent Archive</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {customAgents.map((agent, i) => (
                        <button 
                          key={`popup-custom-${agent.id || i}`}
                          onClick={() => addSlot(agent)}
                          className="group p-5 sm:p-6 rounded-[24px] sm:rounded-[32px] border border-emerald-100 bg-emerald-50/10 hover:bg-white hover:border-emerald-300 hover:shadow-xl transition-all text-left cursor-pointer"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors border border-emerald-100">
                              <UserIcon className="w-5 h-5" />
                            </div>
                            <Plus className="w-5 h-5 text-emerald-300 group-hover:text-emerald-500 transition-colors" />
                          </div>
                          <h4 className="text-sm sm:text-lg font-black text-gray-900 group-hover:text-emerald-600 transition-colors">{agent.name}</h4>
                          <p className="text-xs text-gray-400 font-bold mt-1 line-clamp-2 leading-relaxed">{agent.description || 'Custom reasoning perspective'}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 sm:mb-6">Reviewer Agent Gallery</div>
                
                {/* Sector Filter Bar */}
                <div className="flex flex-wrap gap-1.5 mb-8 border-b border-gray-100 pb-6">
                  {SECTORS_FOR_LIBRARY.map(sec => {
                    const isSel = selectedSector === sec.id;
                    return (
                      <button
                        key={sec.id}
                        onClick={() => setSelectedSector(sec.id)}
                        className={cn(
                          "px-3.5 py-2 rounded-full text-[10px] sm:text-xs font-bold transition-all border cursor-pointer",
                          isSel
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100 scale-[1.03]"
                            : "bg-gray-50 border-gray-150 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                        )}
                      >
                        {sec.label}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {PRESET_AGENTS.filter(preset => selectedSector === 'all' || preset.category === selectedSector).map((preset, i) => (
                    <button 
                      key={i}
                      onClick={() => addSlot(preset)}
                      className="group p-5 sm:p-6 rounded-[24px] sm:rounded-[32px] border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-indigo-100 hover:shadow-xl transition-all text-left cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors border border-gray-100">
                          <Brain className="w-5 h-5" />
                        </div>
                        <Plus className="w-5 h-5 text-gray-200 group-hover:text-indigo-400 transition-colors" />
                      </div>
                      <h4 className="text-sm sm:text-lg font-black text-gray-900 group-hover:text-indigo-600 transition-colors">{preset.name}</h4>
                      <p className="text-xs text-gray-400 font-bold mt-1 line-clamp-2 leading-relaxed">{preset.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Modal */}
      <AnimatePresence>
        {showSearch && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[220] bg-black/60 backdrop-blur-xl flex items-start justify-center pt-[10vh] px-6"
            onClick={() => setShowSearch(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -20 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100 flex items-center gap-4">
                <Search className="w-6 h-6 text-indigo-500" />
                <input 
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chats, projects, agents..."
                  className="flex-1 bg-transparent border-none text-xl font-medium focus:ring-0 placeholder:text-gray-300"
                />
                <button 
                  onClick={() => setShowSearch(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <Plus className="w-5 h-5 rotate-45 text-gray-400" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
                {searchQuery.trim() ? (
                  <>
                    <div className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Results</div>
                    {/* Mock Search Results */}
                    {history.filter(h => h.query.toLowerCase().includes(searchQuery.toLowerCase())).map(h => (
                      <button 
                        key={h.id}
                        onClick={() => {
                          loadFromHistory(h);
                          setView('main');
                          setShowSearch(false);
                        }}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-indigo-50 transition-all text-left group"
                      >
                        <MessageSquare className="w-5 h-5 text-indigo-400" />
                        <span className="font-bold text-gray-700 group-hover:text-indigo-600 truncate">{h.query}</span>
                      </button>
                    ))}
                    {projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                      <button 
                        key={p.id}
                        onClick={() => {
                          setActiveProjectId(p.id);
                          setView('project-detail');
                          setShowSearch(false);
                        }}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-indigo-50 transition-all text-left group"
                      >
                        <Folder className="w-5 h-5 text-indigo-400" />
                        <span className="font-bold text-gray-700 group-hover:text-indigo-600 truncate">{p.name}</span>
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="py-12 text-center text-gray-400 font-bold">
                    {t('start_typing_search', 'Start typing to search your account...')}
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400">
                    <span className="px-1.5 py-0.5 bg-white border border-gray-200 rounded-md">ENTER</span>
                    {t('select_label', 'SELECT')}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400">
                    <span className="px-1.5 py-0.5 bg-white border border-gray-200 rounded-md">ESC</span>
                    {t('close_label', 'CLOSE')}
                  </div>
                </div>
                <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{t('neural_index_active', 'Neural Index Active')}</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCustomizeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[210] bg-black/60 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl overflow-hidden relative flex flex-col md:flex-row h-[80vh]"
            >
              <button 
                onClick={() => setShowCustomizeModal(false)}
                className="absolute top-8 right-8 p-3 hover:bg-gray-100 rounded-2xl transition-colors z-10"
              >
                <Plus className="w-5 h-5 rotate-45 text-gray-400" />
              </button>

              <div className="md:w-72 bg-[#f9f9f9] p-10 border-r border-gray-100 flex flex-col justify-between">
                 <div>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter mb-8 italic">{t('customize')}</h3>
                    <nav className="space-y-2">
                       {['Profile', 'Skills', 'Connectors', 'Security', 'Billing'].map(item => (
                         <button 
                           key={item} 
                           onClick={() => setCustomizeActiveTab(item)}
                           className={cn(
                           "w-full text-left p-4 rounded-2xl font-black text-sm transition-all",
                           customizeActiveTab === item ? "bg-white shadow-sm text-indigo-600" : "text-gray-400 hover:text-gray-600"
                         )}>
                            {t(item.toLowerCase())}
                         </button>
                       ))}
                    </nav>
                 </div>
                 <div className="p-6 bg-indigo-600 rounded-3xl text-white">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">{t('active_plan', 'Active Plan')}</p>
                    <p className="text-xl font-black">{currentPlan.toUpperCase()}</p>
                 </div>
              </div>

              <div className="flex-1 p-12 overflow-y-auto custom-scrollbar">
                {customizeActiveTab === 'Connectors' && (
                  <>
                    <div className="mb-10">
                      <h4 className="text-2xl font-black text-gray-900 tracking-tighter mb-2">{t('knowledge_connectors', 'Knowledge Connectors')}</h4>
                      <p className="text-gray-500 font-bold">{t('connectors_desc', 'Augment your agents with private data sources for context-aware reasoning.')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { name: 'Google Drive', desc: 'Sync docs for neural retrieval', icon: <Cloud className="w-6 h-6" />, connected: true },
                        { name: 'Notion', desc: 'Reason across your workspace', icon: <FileText className="w-6 h-6" />, connected: false },
                        { name: 'GitHub', desc: 'Audit codebases with consensus', icon: <HistoryIcon className="w-6 h-6" />, connected: false },
                        { name: 'Slack', desc: 'Monitor logic in conversations', icon: <MessageSquare className="w-6 h-6" />, connected: false }
                      ].map(conn => (
                        <div key={conn.name} className="p-6 rounded-[32px] border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-indigo-100 transition-all group">
                          <div className="flex items-center justify-between mb-6">
                              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                                {conn.icon}
                              </div>
                              {conn.connected ? (
                                <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded-lg uppercase tracking-widest">Active</span>
                              ) : (
                                <button className="text-xs font-black text-indigo-600 hover:underline">Connect</button>
                              )}
                          </div>
                          <h5 className="font-black text-gray-900 mb-1">{conn.name}</h5>
                          <p className="text-xs text-gray-400 font-bold leading-relaxed">{conn.desc}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-12 pt-12 border-t border-gray-100">
                      <h4 className="text-2xl font-black text-gray-900 tracking-tighter mb-6">Synthesis Parameters</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-6 bg-gray-50 rounded-[32px]">
                          <div>
                            <p className="font-black text-gray-900">Auto-Debate Mode</p>
                            <p className="text-xs text-gray-400 font-bold">Agents prioritize finding flaws over agreement</p>
                          </div>
                          <div className="w-12 h-6 bg-indigo-600 rounded-full flex items-center px-1">
                            <div className="w-4 h-4 bg-white rounded-full ml-auto" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {customizeActiveTab === 'Profile' && (
                  <div className="space-y-12">
                    <div>
                      <h4 className="text-2xl font-black text-gray-900 tracking-tighter mb-2">{t('profile')}</h4>
                      <p className="text-gray-500 font-bold">Manage your identities and credentials.</p>
                    </div>
                    
                    <div className="flex items-center gap-6 p-8 bg-gray-50 rounded-[40px]">
                      <div className="w-24 h-24 rounded-full bg-white border border-gray-200 flex items-center justify-center text-indigo-600 text-3xl font-black uppercase">
                        {user?.email?.[0]}
                      </div>
                      <div>
                        <p className="text-xl font-black text-gray-900">{user?.email?.split('@')?.[0] || 'User'}</p>
                        <p className="text-gray-400 font-bold">{user?.email}</p>
                        <button className="mt-4 px-6 py-2 bg-white border border-gray-100 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-50 transition-all">Change Avatar</button>
                      </div>
                    </div>

                  <div className="space-y-4">
                    <div className="p-6 border border-gray-100 rounded-[32px]">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('display_name') || "Display Name"}</p>
                      <input className="w-full bg-transparent border-none p-0 text-xl font-black text-gray-900 focus:ring-0" placeholder={t('set_name_placeholder', 'Set your name...')} />
                    </div>
                    <div className="p-6 border border-gray-100 rounded-[32px]">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('institutional_id', 'Institutional ID')}</p>
                      <input className="w-full bg-transparent border-none p-0 text-xl font-black text-gray-900 focus:ring-0" value="EF-8923-CORE" readOnly />
                    </div>
                  </div>
                  </div>
                )}

                {customizeActiveTab === 'Skills' && (
                  <div className="space-y-12">
                    <div>
                      <h4 className="text-2xl font-black text-gray-900 tracking-tighter mb-2">{t('neural_skills', 'Neural Skills')}</h4>
                      <p className="text-gray-500 font-bold">{t('skills_desc', 'Configure the logic primitives available to your agent stack.')}</p>
                    </div>

                    <div className="space-y-4">
                      {[
                        { name: 'Adversarial Deduction', active: true },
                        { name: 'Multi-model Synthesis', active: true },
                        { name: 'Institutional Policy Logic', active: false },
                        { name: 'Zero-Knowledge Auditing', active: false }
                      ].map(skill => (
                        <div key={skill.name} className="p-6 border border-gray-100 rounded-[32px] flex items-center justify-between">
                          <div>
                            <p className="font-black text-gray-900">{skill.name}</p>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Available</p>
                          </div>
                          <div className={cn(
                            "w-12 h-6 rounded-full flex items-center px-1 transition-colors",
                            skill.active ? "bg-indigo-600" : "bg-gray-200"
                          )}>
                            <div className={cn("w-4 h-4 bg-white rounded-full transition-transform", skill.active ? "ml-auto" : "ml-0")} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {customizeActiveTab === 'Security' && (
                  <div className="space-y-12">
                    <div>
                      <h4 className="text-2xl font-black text-gray-900 tracking-tighter mb-2">{t('gatekeeper_security', 'Gatekeeper Security')}</h4>
                      <p className="text-gray-500 font-bold">{t('security_desc', 'Zero-trust architecture for your reasoning tokens.')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-8 bg-gray-900 rounded-[40px] text-white">
                        <ShieldCheck className="w-8 h-8 text-indigo-400 mb-6" />
                        <h5 className="text-xl font-black mb-2">{t('two_fa_active', '2FA Active')}</h5>
                        <p className="text-indigo-200/60 text-sm font-bold">{t('managed_via_iam', 'Managed via Google Cloud IAM.')}</p>
                      </div>
                      <div className="p-8 border border-gray-100 rounded-[40px]">
                         <LogOut className="w-8 h-8 text-red-400 mb-6" />
                         <h5 className="text-xl font-black mb-2 text-gray-900">{t('session_audit', 'Session Audit')}</h5>
                         <p className="text-gray-400 text-sm font-bold">{t('session_audit_desc', 'Monitor your neural reasoning access points.')}</p>
                      </div>
                    </div>

                    <div className="p-8 border border-gray-100 rounded-[40px]">
                      <h5 className="text-lg font-black text-gray-900 mb-6 uppercase tracking-tight">{t('api_tokens', 'API Tokens')}</h5>
                      <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100">
                        <code className="text-xs font-mono text-gray-500 truncate mr-4">ef_sk_live_************************</code>
                        <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-[10px] font-black uppercase tracking-widest">{t('reveal', 'Reveal')}</button>
                      </div>
                    </div>
                  </div>
                )}

                {customizeActiveTab === 'Billing' && (
                  <div className="space-y-12">
                    <div>
                      <h4 className="text-2xl font-black text-gray-900 tracking-tighter mb-2">{t('billing')}</h4>
                      <p className="text-gray-500 font-bold">{t('manage_subscriptions_desc') || 'Manage your compute quota and enterprise subscriptions.'}</p>
                    </div>

                    {!usage ? (
                      <div className="p-10 bg-gray-50 border border-gray-100 rounded-[48px] animate-pulse flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest italic">{t('loading_usage') || 'Synchronizing with Core Engine...'}</p>
                      </div>
                    ) : (
                      <div className="p-10 bg-indigo-50 border border-indigo-100 rounded-[48px]">
                        <div className="flex justify-between items-end mb-8">
                          <div>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">{t('compute_usage')}</p>
                            <h5 className="text-4xl font-black text-gray-900">{usage?.current ?? 0} <span className="text-base text-gray-400">/ {usage?.limit ?? 10}</span></h5>
                          </div>
                          <span className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-2 italic">{t('refreshes_soon') || 'Refreshes soon'}</span>
                        </div>
                        <div className="h-4 w-full bg-indigo-100 rounded-full overflow-hidden mb-8">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, ((usage?.current ?? 0) / (usage?.limit ?? 10)) * 100)}%` }}
                            className="h-full bg-indigo-600 rounded-full"
                          />
                        </div>
                        
                        <div className="flex flex-col gap-3">
                          <button 
                            onClick={() => setShowUpgradeModal(true)}
                            className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all uppercase tracking-widest text-xs"
                          >
                            {t('upgrade_capacity')}
                          </button>
                          
                          {usage?.plan !== 'free' && (
                           <button 
                              onClick={async () => {
                                try {
                                  await createPortalSession(user?.uid || '');
                                } catch (err: any) {
                                  alert(err.message);
                                }
                              }}
                              className="w-full py-4 bg-white border border-indigo-100 text-indigo-600 font-black rounded-2xl hover:bg-indigo-50 transition-all uppercase tracking-widest text-[10px]"
                            >
                              {t('manage_subscription')}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Drive Overlay */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 w-full">
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-red-50 border border-red-100 rounded-[32px] flex items-center justify-between gap-4 shadow-xl shadow-red-50"
          >
            <div className="flex items-center gap-4 text-red-700">
              <div className="bg-red-100 p-3 rounded-2xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <p className="font-black text-sm uppercase tracking-widest mb-1">FILE ERROR DETECTED</p>
                <p className="text-sm font-bold text-red-600/80">{error}</p>
              </div>
            </div>
            <button 
              onClick={() => setError(null)}
              className="p-3 hover:bg-red-100 rounded-2xl transition-colors text-red-400"
            >
              <Plus className="w-5 h-5 rotate-45" />
            </button>
          </motion.div>
        )}
        {view === 'main' ? (
          <>
            {/* Onboarding Directive */}
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-[#1d1d1f] mb-3 tracking-tight leading-tight">
            {t('onboarding_title') || "Set up a review configuration."}
          </h2>
          <p className="text-gray-500 font-semibold text-sm sm:text-base leading-relaxed">
            {t('onboarding_desc', 'Choose reviewer roles, assign models, set evidence requirements, and define how many responses are required before a result can be returned.')}
          </p>
        </div>

        {/* Analyst Slots - Mobile Stack/Grid vs Desktop Flex */}
        <div className="mb-10 w-full overflow-hidden">
          <div className="px-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:flex lg:flex-row lg:flex-wrap gap-4 items-stretch">
              {slots.map((slot) => (
                <motion.div 
                  layout
                  key={slot.id}
                  className={cn(
                    "p-5 rounded-[28px] border transition-all relative group min-w-0 lg:w-72 lg:flex-shrink-0 flex flex-col justify-between",
                    slot.active 
                      ? "bg-white border-indigo-200 shadow-xl shadow-indigo-50/50" 
                      : "bg-gray-50 border-gray-100 opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
                  )}
                >
                <div 
                  onClick={() => toggleSlot(slot.id)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">
                      Reviewer Role
                    </span>
                    <span className={cn(
                      "text-[9px] font-black px-2 py-0.5 rounded-full border transition-all",
                      slot.active
                        ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                        : "bg-gray-100 text-gray-400 border-gray-200"
                    )}>
                      {slot.active ? "Active in Review Set" : "Excluded"}
                    </span>
                  </div>

                  <div className="flex justify-between items-start gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <input 
                        value={slot.name}
                        onChange={(e) => setSlots(slots.map(s => s.id === slot.id ? { ...s, name: e.target.value } : s))}
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                          "bg-transparent border-none p-0 focus:ring-0 text-lg font-black w-full outline-none leading-snug",
                          slot.active ? "text-indigo-900" : "text-gray-400"
                        )}
                        placeholder="Persona Name"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button 
                        onClick={(e) => { e.stopPropagation(); archiveAgent(slot); }}
                        title="Save to Personal Agent Library"
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeSlot(slot.id); }}
                        title="Delete Slot"
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-4" onClick={(e) => e.stopPropagation()}>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
                      Review Mandate
                    </label>
                    <textarea 
                      value={slot.description}
                      onChange={(e) => setSlots(slots.map(s => s.id === slot.id ? { ...s, description: e.target.value } : s))}
                      placeholder="What this reviewer should look for, challenge, and require..."
                      className="w-full text-xs font-semibold text-gray-600 bg-gray-50/70 border border-gray-100 hover:border-gray-200 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50/50 rounded-2xl px-3.5 py-3 outline-none transition-all resize-y min-h-[120px] max-h-[200px] custom-scrollbar placeholder:text-gray-300"
                    />
                  </div>
                </div>

                <div 
                  className="mt-4 pt-4 border-t border-gray-100"
                >
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 block">
                    {t('intelligence_architecture') || "Reasoning Model"}
                  </label>
                  <div className="relative">
                    <select 
                      value={slot.model}
                      onChange={(e) => {
                        const modelId = e.target.value as Model;
                        updateSlotModel(slot.id, modelId);
                      }}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-100 transition-all appearance-none cursor-pointer"
                    >
                      {AVAILABLE_MODELS.map(m => {
                        return (
                          <option key={m.id} value={m.id} disabled={m.disabled}>
                            {m.label}{m.disabled ? ` — ${t('coming_soon')}` : ''}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {(() => {
                    const modelInfo = AVAILABLE_MODELS.find(m => m.id === slot.model);
                    return modelInfo?.description ? (
                      <div className="mt-2 text-[10px] text-gray-500 font-medium leading-relaxed bg-gray-50/50 p-2 rounded-xl border border-gray-100/50">
                        {modelInfo.description}
                      </div>
                    ) : null;
                  })()}
                </div>
              </motion.div>
            ))}
            
              {/* Add Agent Shortcut Card */}
              <motion.button 
                layout
                onClick={() => setShowAgentLibrary(true)}
                className="p-8 rounded-[28px] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center gap-4 text-gray-300 hover:text-indigo-400 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group min-h-[220px] lg:w-72 w-full lg:flex-shrink-0"
              >
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-lg transition-all">
                  <Plus className="w-8 h-8" />
                </div>
                <span className="text-sm font-black uppercase tracking-widest">{t('add_agent')}</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Query Input */}
        <div id="query-input-section" className="relative mb-12 max-w-4xl mx-auto px-4">
          <div className="absolute left-10 top-8 text-gray-300">
            <Search className="w-6 h-6" />
          </div>
      <div className="space-y-4">
        {/* Dynamic Sector-Based Prompt Suggestions (Redesigned GPT-style) */}
        <div className="w-full text-center pb-2">
          {!showSectorPrompts ? (
            <button
              onClick={() => {
                setShowSectorPrompts(true);
                setActivePromptSector(null); // Keep prompts hidden initially until category is selected
              }}
              className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors cursor-pointer inline-flex items-center gap-1.5 py-2"
            >
              <span>Explore Sector-Specific Consensus Prompts</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          ) : (
            <div className="space-y-4 text-center animate-in fade-in slide-in-from-top-2">
              {/* Sector Selection Tabs */}
              <div className="flex flex-wrap gap-1.5 justify-center">
                {SECTOR_SUGGESTIONS.map((sec) => {
                  const isActive = activePromptSector === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => {
                        setActivePromptSector(sec.id);
                      }}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border shadow-sm cursor-pointer",
                        isActive
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-indigo-100 scale-105 font-extrabold"
                          : "bg-white border-gray-250 text-gray-500 hover:border-gray-350 hover:bg-gray-50/50"
                      )}
                    >
                      {getSectorIcon(sec.icon)}
                      <span>{sec.name}</span>
                    </button>
                  );
                })}
                <button
                  onClick={() => {
                    setShowSectorPrompts(false);
                    setActivePromptSector(null);
                  }}
                  className="px-3 py-1.5 rounded-full text-[11px] font-bold border border-gray-250 text-gray-400 hover:text-gray-600 cursor-pointer hover:bg-gray-50"
                >
                  Hide
                </button>
              </div>

              {/* Selected Sector Description & Prompts Grid */}
              {activePromptSector && (
                <div className="bg-slate-50/40 rounded-2xl p-4 border border-gray-100/50 max-w-5xl mx-auto text-left animate-in fade-in slide-in-from-top-2">
                  <div className="text-center text-[10px] text-gray-400 font-bold mb-3 italic">
                    "{SECTOR_SUGGESTIONS.find(s => s.id === activePromptSector)?.description}"
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    {SECTOR_SUGGESTIONS.find(s => s.id === activePromptSector)?.prompts.map((p, idx) => (
                      <button
                        key={`${activePromptSector}-prompt-${idx}`}
                        onClick={() => {
                          setQuery(p);
                        }}
                        className="p-3.5 rounded-xl border border-gray-150 bg-white hover:bg-white hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-50/30 transition-all text-left text-xs text-gray-500 hover:text-indigo-950 group relative flex flex-col justify-between cursor-pointer min-h-[80px] active:scale-[0.98]"
                      >
                        <span className="font-semibold leading-relaxed mb-2 line-clamp-3">{p}</span>
                        <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest group-hover:text-indigo-600 transition-colors flex items-center gap-1 mt-auto">
                          Load Prompt <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {activeProjectId && (
          <div className="flex items-center justify-between bg-indigo-50/70 border border-indigo-100/70 rounded-3xl px-6 py-4 animate-in fade-in slide-in-from-top-2 text-xs sm:text-sm">
            <div className="flex items-center gap-3 text-indigo-900 font-bold min-w-0">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-indigo-100">
                <Folder className="w-4 h-4" />
              </div>
              <span className="truncate">
                Focus Workspace: <span className="text-indigo-600 font-extrabold hover:underline cursor-pointer" onClick={() => setView('project-detail')}>{projects.find(p => p.id === activeProjectId)?.name || "Current Project"}</span>
              </span>
            </div>
            <button 
              onClick={() => {
                setActiveProjectId(null);
                setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Cleared project focus`]);
              }} 
              className="text-indigo-500 hover:text-indigo-800 font-black text-[10px] sm:text-xs uppercase tracking-widest flex-shrink-0"
            >
              Clear Focus
            </button>
          </div>
        )}
        {/* Attached Files Preview - Now inside the query container for unified context */}
        {(attachedFiles.length > 0 || isExtracting || isUploading) && (
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-[24px] p-4 flex flex-wrap gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Attached Research Documents</span>
              <span className="text-[10px] font-bold text-indigo-400">{attachedFiles.length} file{attachedFiles.length !== 1 ? 's' : ''} loaded</span>
            </div>
            {attachedFiles.map((file, i) => (
              <div key={i} className="flex items-center gap-2 bg-white border border-indigo-200 px-4 py-2.5 rounded-2xl text-[12px] font-bold text-indigo-800 shadow-sm hover:shadow-md transition-all group">
                <FileText className="w-4 h-4 text-indigo-500" />
                <span className="max-w-[200px] truncate">{file.name}</span>
                <button 
                  onClick={() => {
                    setAttachedFiles(prev => prev.filter((_, idx) => idx !== i));
                    setAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Detached document: ${file.name}`]);
                  }}
                  className="p-1 hover:bg-red-50 hover:text-red-500 rounded-full transition-all"
                >
                  <Plus className="w-4 h-4 rotate-45" />
                </button>
              </div>
            ))}
            {(isExtracting || isUploading) && (
              <div className="flex items-center gap-3 bg-indigo-600 px-5 py-2.5 rounded-2xl text-[12px] font-bold text-white shadow-lg animate-pulse">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {isExtracting ? "UPLOADING DOCUMENT..." : "UPLOADING DOCUMENT..."}
              </div>
            )}
          </div>
        )}
        
        <div className="relative group">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleRunAnalysis();
              }
            }}
            placeholder={t('prompt_placeholder')}
            className="w-full bg-white border border-gray-100 rounded-[40px] px-8 pt-10 pb-24 pl-16 text-xl font-medium text-gray-800 shadow-2xl shadow-indigo-50/50 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all placeholder:text-gray-200 min-h-[220px] resize-none"
          />
            
            <div className="absolute right-6 bottom-6 flex items-center gap-3">
               <button 
                onClick={startSpeechToText}
                className={cn(
                  "w-12 h-12 flex items-center justify-center rounded-2xl transition-all group relative border border-gray-50 bg-gray-50/50 hover:bg-white hover:shadow-md",
                  isListening ? "text-red-500 bg-red-50 border-red-100 animate-pulse" : "text-gray-400 hover:text-indigo-600"
                )}
               >
                  <Mic className={cn("w-5 h-5", isListening && "fill-current")} />
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-black px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {isListening ? "Listening..." : "Speech to Text"}
                  </span>
               </button>
               
               <div className="relative">
                 <button 
                  onClick={() => setShowUploadMenu(!showUploadMenu)}
                  className={cn(
                    "w-12 h-12 flex items-center justify-center rounded-2xl transition-all group relative border border-gray-50 bg-gray-50/50 hover:bg-white hover:shadow-md",
                    showUploadMenu ? "text-indigo-600 bg-indigo-50 border-indigo-100" : "text-gray-400 hover:text-indigo-600"
                  )}
                 >
                    <Plus className={cn("w-5 h-5 transition-transform", showUploadMenu && "rotate-45")} />
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-black px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Upload Files</span>
                 </button>

                 <AnimatePresence>
                   {showUploadMenu && (
                     <motion.div 
                      ref={uploadMenuRef}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-16 right-0 bg-white border border-gray-100 rounded-3xl shadow-2xl p-2 min-w-[200px] z-30"
                     >
                        <button 
                          onClick={() => {
                            setShowDrive(true);
                            setShowUploadMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 transition-all text-sm font-bold"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 3H15L21 13L18 19H6L3 13L9 3Z" />
                          </svg>
                          {t('drive') || 'Drive'}
                        </button>
                        <button 
                          onClick={() => { fileInputRef.current?.click(); setShowUploadMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 transition-all text-sm font-bold"
                        >
                          <Upload className="w-5 h-5" />
                          {t('upload_files') || 'Upload Files'}
                        </button>
                        <button 
                          onClick={() => { startCamera(); setShowUploadMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 transition-all text-sm font-bold"
                        >
                          <Camera className="w-5 h-5" />
                          {t('camera') || 'Camera'}
                        </button>
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>

                <button 
                  disabled={isAnalyzing || isUploading || isExtracting || (!query.trim() && attachedFiles.length === 0)}
                  onClick={() => handleRunAnalysis()}
                  className={cn(
                    "w-12 h-12 flex items-center justify-center rounded-2xl transition-all shadow-lg active:scale-95 relative",
                    isAnalyzing || isUploading || isExtracting || (!query.trim() && attachedFiles.length === 0)
                      ? "bg-gray-100 text-gray-300 shadow-none cursor-not-allowed" 
                      : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100"
                  )}
                >
                  {isAnalyzing ? (
                    <RotateCcw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <ArrowUp className="w-6 h-6" />
                      {attachedFiles.length > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-md font-black">
                          {attachedFiles.length}
                        </span>
                      )}
                    </>
                  )}
                </button>
            </div>
            
            {/* Hidden Inputs */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              multiple
            />
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              ref={cameraInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              multiple
            />
          </div>
        </div>
      </div>

      {/* Results Area */}
      <AnimatePresence mode="wait">
          {isAnalyzing ? (
            <motion.div 
              id="consensus-loading-tracker"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-4xl mx-auto px-4 py-6 sm:py-12 space-y-6"
            >
              {/* Dynamic Glass Box Main Capsule */}
              <div className="bg-gradient-to-br from-indigo-950 via-slate-905 to-slate-950 text-white rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden border border-indigo-500/15">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[85px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-500/5 rounded-full blur-[70px] pointer-events-none" />
                
                {/* 1. Header with integrated circular aggregation */}
                <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-white/5">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-indigo-500/15 border border-indigo-500/20 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-200">
                        INDEPENDENT ADVERSARIAL REVIEW
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                      <Brain className="w-5 h-5 text-indigo-400 animate-pulse" />
                      Adversarial Review in Progress
                    </h2>
                    <p className="text-xs text-indigo-200/80 font-medium leading-relaxed pt-1">
                      Reviewers are analyzing the proposal across independent mandates and models. Agreement is not assumed; disagreement, missing evidence, and unresolved risk remain transparent.
                    </p>
                  </div>

                  {/* High Tech Compact Circular Loader */}
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl backdrop-blur-sm">
                    <div className="relative flex items-center justify-center">
                      <div className="w-9 h-9 rounded-full border-2 border-indigo-500/20 border-t-indigo-400 animate-spin" />
                      <div className="absolute text-[10px] font-black tracking-tighter text-indigo-150">
                        {Math.round(debateProgress)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[8px] font-black text-indigo-300 uppercase tracking-widest leading-none mb-0.5">QUORUM STATUS</div>
                      <div className="text-xs font-black text-white">
                        {Object.keys(completedAnalysts).length} / {slots.filter(s => {
                          const modelInfo = AVAILABLE_MODELS.find(m => m.id === s.model);
                          return s.active && !modelInfo?.disabled;
                        }).length} Reviewers
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Compact Live Agents Matrix - One Single Beautiful Horizontal/Grid Status Line */}
                <div className="relative z-10 space-y-3 mb-6">
                  <div className="text-[9px] font-black tracking-[0.15em] text-indigo-300 uppercase">ACTIVE COGNITIVE NODES</div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {slots.filter(s => {
                      const modelInfo = AVAILABLE_MODELS.find(m => m.id === s.model);
                      return s.active && !modelInfo?.disabled;
                    }).map((slot, index) => {
                      const completed = completedAnalysts[slot.id];
                      const isProcessing = !completed && Object.keys(completedAnalysts).length >= index;
                      
                      let nodeIcon = "⏳";
                      let nodeStatusText = "Pending";
                      let borderClass = "border-white/5 bg-white/[0.02]";
                      let badgeText = slot.model.split('/')[1] || slot.model;

                      if (completed) {
                        nodeIcon = "✓";
                        nodeStatusText = "RESOLVED";
                        borderClass = "border-emerald-500/20 bg-emerald-500/5";
                      } else if (isProcessing) {
                        nodeIcon = "⚡";
                        nodeStatusText = "DEBATING...";
                        borderClass = "border-indigo-500/30 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.08)]";
                      }

                      return (
                        <div key={slot.id} className={cn("p-3 rounded-xl border flex flex-col justify-between transition-all gap-1.5", borderClass)}>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-white truncate">{slot.name}</span>
                            <span className="text-[10px] shrink-0">{nodeIcon}</span>
                          </div>
                          
                          <div className="flex items-center justify-between text-[8px] font-extrabold font-mono text-indigo-300/60 mt-1">
                            <span>{badgeText.slice(0, 15).toUpperCase()}</span>
                            <span className={cn(
                              "px-1 rounded-sm uppercase tracking-wider text-[8px]",
                              completed ? "text-emerald-400 bg-emerald-500/20" : isProcessing ? "text-indigo-300 bg-indigo-500/20 animate-pulse" : "text-gray-400 bg-white/5"
                            )}>
                              {nodeStatusText}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Inquiry Subject Summary */}
                <div className="relative z-10 bg-black/20 border border-white/5 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-indigo-200/60 font-semibold mb-6">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-extrabold text-indigo-400 text-[9px] uppercase tracking-wider shrink-0">Inquiry:</span>
                    <span className="text-white truncate font-mono italic">"{query || t('untitled_query', 'Inquiry Context')}"</span>
                  </div>
                  {attachedFiles.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-indigo-500/15 px-2 py-0.5 rounded-lg border border-indigo-500/20 text-indigo-400 shrink-0 text-[10px]">
                      <Paperclip className="w-2.5 h-2.5 text-indigo-450" />
                      <span>{attachedFiles.length} Grounding Files</span>
                    </div>
                  )}
                </div>

                {/* 3.5. Real-Time Glass Box Dialogue Flash Panel */}
                <div className="mb-6">
                  {renderDialogueFlash()}
                </div>

                {/* 4. Live System Stream Console */}
                <div className="relative z-10 bg-[#07080c] border border-slate-800/80 rounded-2xl p-4 shadow-inner">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500/80" />
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500/80" />
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
                      <span className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.15em] font-mono ml-1.5">
                        GLASS-BOX DISPATCH LOGGER
                      </span>
                    </div>
                    <span className="text-[8px] font-semibold text-slate-500 font-mono">
                      {currentAnalysisId || 'LIVE_LOG'}
                    </span>
                  </div>

                  <div className="font-mono text-[9px] sm:text-xs text-indigo-300 space-y-2 max-h-[110px] overflow-y-auto leading-relaxed custom-scrollbar">
                    {agentLogs.length === 0 ? (
                      <div className="text-slate-500 italic animate-pulse">Establishing communication pipeline with neural nodes...</div>
                    ) : (
                      agentLogs.map((log, i) => (
                        <div key={i} className="flex gap-2 items-start hover:text-white transition-colors">
                          <span className="text-indigo-500/60 select-none shrink-0">&gt;</span>
                          <span className="break-all">{log.toUpperCase()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          ) : results ? (
            <motion.div 
              ref={resultsRef}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-10 px-1.5 sm:px-4"
            >
              {/* Submitted Prompt Reference Card & Multi-turn Session Timeline */}
              <div id="query-results-anchor" className="max-w-6xl mx-auto space-y-4">
                <div className="bg-gradient-to-r from-indigo-50/70 via-white to-sky-50/70 dark:bg-none dark:bg-[#12131a] border border-indigo-100 dark:border-zinc-800/80 p-6 sm:p-8 rounded-3xl shadow-sm relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-100/10 dark:bg-indigo-900/5 rounded-full blur-2xl z-0" />
                  <div className="flex items-center gap-2 mb-3 relative z-10">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.22em]">QUERY</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-indigo-950 dark:text-zinc-100 tracking-tight leading-snug relative z-10">
                    {results.query || query}
                  </h3>
                </div>

                {(() => {
                  const turns = messages.reduce<Array<{ query: string; analystResponses: AnalystResponse[]; synthesis: SynthesisResult }>>((acc, msg, idx) => {
                    if (msg.role === 'assistant' && msg.synthesis) {
                      const prevMsg = messages[idx - 1];
                      const turnQuery = prevMsg && prevMsg.role === 'user' ? prevMsg.content : (results.query || "Inquiry turn");
                      acc.push({
                        query: turnQuery,
                        analystResponses: msg.analystResponses || [],
                        synthesis: msg.synthesis
                      });
                    }
                    return acc;
                  }, []);

                  if (turns.length > 1) {
                    return (
                      <div className="bg-white/65 p-3 rounded-2xl border border-gray-150 shadow-sm flex items-center flex-wrap gap-2.5 backdrop-blur-md">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-2">Dialogue Turns:</span>
                        <div className="flex items-center gap-2 overflow-x-auto py-1">
                          {turns.map((turn, idx) => {
                            const isActive = results && results.query === turn.query;
                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  setResults({
                                    query: turn.query,
                                    analystResponses: turn.analystResponses,
                                    synthesis: turn.synthesis
                                  });
                                  setSynthesisStage(1);
                                  setActiveTab('synthesis');
                                }}
                                className={cn(
                                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap",
                                  isActive 
                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-100" 
                                    : "bg-gray-50 border-gray-100 text-gray-400 hover:text-gray-950 hover:bg-gray-100"
                                )}
                              >
                                Turn {idx + 1}: {turn.query.length > 25 ? turn.query.substring(0, 25) + "..." : turn.query}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Tab Switcher & Relationship Banner */}
              <div className="flex flex-col items-center gap-3">
                <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 text-center max-w-xl">
                  Consensus Engine explains the outcome. Source Reports show the evidence, provenance, dissent, and limitations behind it.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <div className="flex items-center gap-1 bg-gray-50 dark:bg-zinc-800/80 p-2 rounded-2xl border border-gray-100 dark:border-zinc-700/60 shadow-sm">
                    <button 
                      onClick={() => setActiveTab('synthesis')}
                      title="Inspect synthesized consensus findings, divergence points, and points of convergence"
                      className={cn(
                        "px-6 sm:px-8 py-3 rounded-xl text-sm font-black tracking-tight transition-all flex items-center gap-2 cursor-pointer",
                        activeTab === 'synthesis' ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-50 dark:shadow-none border border-indigo-100 dark:border-indigo-500/30" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      )}
                    >
                      <Brain className="w-4 h-4" />
                      {t('consensus_engine') || "Consensus Engine"}
                    </button>
                    <button 
                      onClick={() => setActiveTab('analysts')}
                      title="Inspect individual reviewer evidence, models, citations, and gaps"
                      className={cn(
                        "px-6 sm:px-8 py-3 rounded-xl text-sm font-black tracking-tight transition-all flex items-center gap-2 cursor-pointer",
                        activeTab === 'analysts' ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-50 dark:shadow-none border border-indigo-100 dark:border-indigo-500/30" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      )}
                    >
                      <Users className="w-4 h-4" />
                      {t('source_reports') || "Source Reports"}
                    </button>
                  </div>

                  {/* Speaker Icon inside CI Workspace Page Toolbar */}
                  {(() => {
                    const speakableText = getComprehensiveBriefingText(results, messages[messages.length - 1]?.content || query || "EthersFlow Multi-Agent Consensus Platform");
                    const speakableTitle = results?.synthesis ? "Consensus Synthesis Briefing" : "EthersFlow Overview";
                    const isAudioActive = ttsAudioState.status !== 'idle';

                    return (
                      <button
                        onClick={() => {
                          if (isAudioActive) {
                            handleStopTts();
                          } else {
                            handlePlayTts(speakableText, speakableTitle);
                          }
                        }}
                        title={isAudioActive ? "Turn Audio Off" : "Listen to Voice Briefing (Fish Audio S2.1 Pro)"}
                        className={cn(
                          "px-4 py-3 rounded-2xl flex items-center gap-2 text-xs font-black transition-all border shadow-sm active:scale-95 cursor-pointer",
                          ttsAudioState.status === 'loading'
                            ? "bg-indigo-50 border-indigo-200 text-indigo-600 animate-pulse"
                            : isAudioActive
                            ? "bg-indigo-600 border-indigo-500 text-white shadow-indigo-100 ring-2 ring-indigo-200"
                            : "bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-200 hover:text-indigo-600"
                        )}
                      >
                        {ttsAudioState.status === 'loading' ? (
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                        ) : isAudioActive ? (
                          <VolumeX className="w-4 h-4 text-white" />
                        ) : (
                          <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        )}
                        <span>{isAudioActive ? "Audio Active (Click to Off)" : "Voice Briefing"}</span>
                      </button>
                    );
                  })()}
                </div>
              </div>

              <div className="max-w-6xl mx-auto">
                {activeTab === 'synthesis' && results?.synthesis && (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    <div className="xl:col-span-8 space-y-8">
                      {/* SCORECARD ON MOBILE VIEW (at top of results) */}
                      {renderConfidenceCard(true)}

                      {/* 1. Consensus Narrative & Verdict */}
                      <div className="space-y-8 animate-fadeIn">
                        {/* Main Narrative Card */}
                        <div className="bg-white border border-gray-100 rounded-3xl sm:rounded-[40px] p-6 sm:p-10 shadow-2xl shadow-indigo-50/20">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-10">
                            <div>
                              <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">UNIFIED STRATEGIC POSITION</div>
                              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-indigo-950">
                                {(() => {
                                  if (!results.analystResponses || results.analystResponses.length <= 1) {
                                    return "Single Expert Review Briefing";
                                  }
                                  if (results.synthesis?.dissent && results.synthesis.dissent.length > 30) {
                                    return "Adversarial Consensus with Unresolved Dissent";
                                  }
                                  if (results.synthesis?.score && results.synthesis.score >= 80) {
                                    return "Consensus Reached: Supporting Evidence Synthesized";
                                  }
                                  return t('consensus_narrative') || "Consensus Narrative & Verdict";
                                })()}
                              </h2>
                            </div>
                            <div className="flex items-center gap-2">
                               {/* Speaker Button inside Narrative Header */}
                               {(() => {
                                 const speakableText = getComprehensiveBriefingText(results, messages[messages.length - 1]?.content || query || "EthersFlow Multi-Agent Consensus Platform");
                                 const speakableTitle = results?.synthesis ? "Consensus Synthesis Briefing" : "EthersFlow Overview";
                                 const isAudioActive = ttsAudioState.status !== 'idle' && ttsAudioState.title === speakableTitle;

                                 return (
                                   <button
                                     onClick={() => {
                                       if (ttsAudioState.status !== 'idle') {
                                         handleStopTts();
                                       } else {
                                         handlePlayTts(speakableText, speakableTitle);
                                       }
                                     }}
                                     className={cn(
                                       "p-2.5 sm:p-3 rounded-2xl transition-all group relative shadow-sm border cursor-pointer",
                                       ttsAudioState.status !== 'idle'
                                         ? "bg-indigo-600 text-white border-indigo-500 shadow-indigo-100 ring-2 ring-indigo-200"
                                         : "text-gray-400 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-zinc-800 border-gray-100 dark:border-zinc-800"
                                     )}
                                   >
                                     {ttsAudioState.status === 'loading' ? (
                                       <Loader2 className="w-5 h-5 animate-spin text-indigo-600 dark:text-indigo-400" />
                                     ) : ttsAudioState.status !== 'idle' ? (
                                       <VolumeX className="w-5 h-5 text-white" />
                                     ) : (
                                       <Volume2 className="w-5 h-5" />
                                     )}
                                     <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-black px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                       {ttsAudioState.status !== 'idle' ? "Turn Audio Off" : "Listen to Voice Briefing (Fish Audio S2.1 Pro)"}
                                     </span>
                                   </button>
                                 );
                               })()}

                               <button 
                                onClick={() => copyToClipboard(results.synthesis?.consensus || '')}
                                className={cn(
                                  "p-2.5 sm:p-3 rounded-2xl transition-all group relative shadow-sm border border-gray-100",
                                  copySuccess ? "bg-green-50 text-green-600 border-green-200" : "text-gray-400 hover:text-indigo-600 hover:bg-gray-50"
                                )}
                              >
                                {copySuccess ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-black px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  {copySuccess ? t('copied') : t('copy_results')}
                                </span>
                               </button>

                               <button 
                                onClick={downloadReport}
                                className="p-2.5 sm:p-3 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 rounded-2xl transition-all group relative shadow-sm border border-gray-100"
                              >
                                <Download className="w-5 h-5" />
                                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-black px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{t('download_report', 'Download Report')}</span>
                               </button>

                               <button 
                                onClick={() => handleShare({ query: results?.query || query || messages[0]?.content || 'Adversarial Consensus Report', synthesis: results?.synthesis, analystResponses: results?.analystResponses })}
                                disabled={isSharing}
                                className="p-2.5 sm:p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition-all group relative shadow-lg shadow-indigo-100 border border-indigo-500 disabled:opacity-50"
                              >
                                {isSharing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Share2 className="w-5 h-5" />}
                                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-black px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{t('share_analysis', 'Share Analysis')}</span>
                               </button>
                            </div>
                          </div>

                          <div className="space-y-10">

                            <div className="relative">
                              <div className="absolute -left-10 top-0 w-1 h-full bg-green-200 rounded-full hidden sm:block" />
                              <div className="text-xs font-bold text-green-700 tracking-wide mb-4 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                {t('zero_resistance_point', 'Point of Zero Resistance')}
                              </div>
                              <div className="text-lg text-gray-800 leading-relaxed font-medium whitespace-pre-wrap markdown-content">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
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
                                    ),
                                    table: ({ children }: any) => (
                                      <div className="overflow-x-auto my-6 rounded-2xl border border-gray-100 shadow-sm">
                                        <table className="w-full text-left border-collapse text-[13px] sm:text-sm">
                                          {children}
                                        </table>
                                      </div>
                                    ),
                                    thead: ({ children }: any) => (
                                      <thead className="bg-slate-50 border-b border-gray-100 text-[11px] font-black uppercase tracking-wider text-slate-700">
                                        {children}
                                      </thead>
                                    ),
                                    tbody: ({ children }: any) => (
                                      <tbody className="divide-y divide-gray-50 bg-white">
                                        {children}
                                      </tbody>
                                    ),
                                    tr: ({ children }: any) => (
                                      <tr className="hover:bg-slate-50/50 transition-colors">
                                        {children}
                                      </tr>
                                    ),
                                    th: ({ children }: any) => (
                                      <th className="px-4 py-3 font-bold text-slate-800">
                                        {children}
                                      </th>
                                    ),
                                    td: ({ children }: any) => (
                                      <td className="px-4 py-3 text-gray-700 leading-relaxed">
                                        {children}
                                      </td>
                                    )
                                  }}
                                >
                                  {normalizeConsensus(results.synthesis.consensus)}
                                </ReactMarkdown>
                              </div>
                            </div>

                            {results.synthesis.sources && results.synthesis.sources.length > 0 && (
                              <div className="pt-8 border-t border-gray-100">
                                 <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">{t('cited_documentation', 'Cited Documentation')}</div>
                                 <div className="flex flex-wrap gap-3">
                                   {results.synthesis.sources.map((source, i) => {
                                     let faviconUrl = "";
                                     if (source.url && (source.url.startsWith("http://") || source.url.startsWith("https://"))) {
                                       try {
                                         const urlObj = new URL(source.url);
                                         faviconUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
                                       } catch (e) {
                                         // Ignore
                                       }
                                     }
                                     return (
                                       <a 
                                         key={i} 
                                         href={source.url || '#'} 
                                         target="_blank" 
                                         rel="noreferrer"
                                         className="bg-gray-100 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 px-4 py-2 rounded-xl text-xs font-black text-gray-600 hover:text-indigo-600 transition-all flex items-center gap-2"
                                       >
                                         {faviconUrl && (
                                           <img 
                                             src={faviconUrl} 
                                             alt="" 
                                             className="w-3.5 h-3.5 rounded-sm inline-block object-contain mr-1"
                                             onError={(e) => {
                                               (e.target as HTMLImageElement).style.display = 'none';
                                             }}
                                             referrerPolicy="no-referrer"
                                           />
                                         )}
                                         <span>{source.title}</span>
                                         {source.url && <LogOut className="w-3 h-3 rotate-[-45deg]" />}
                                       </a>
                                     );
                                   })}
                                 </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 2. Agent Conflict Map */}
                      <div className="space-y-6">
                        <div className="bg-white border border-gray-100 rounded-3xl sm:rounded-[40px] p-6 sm:p-10 shadow-xl shadow-indigo-50/20">
                          <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Adversarial Alignment Mapping</div>
                          <h2 className="text-2xl font-black text-indigo-950 tracking-tight mb-3">Agent Conflict Map</h2>
                          <p className="text-gray-500 font-bold mb-8 text-sm sm:text-base leading-relaxed">
                            {(() => {
                              const totalAgents = results.analystResponses?.length || 0;
                              const dissentingAgents = results.analystResponses?.filter(res => {
                                return results.synthesis?.dissents?.some(d => {
                                  const who = d.who.toLowerCase();
                                  const persona = res.persona.toLowerCase();
                                  return who.includes(persona) || persona.includes(who) || 
                                         (who.includes('steelman') && persona.includes('steelman')) ||
                                         (who.includes('constructive') && persona.includes('constructive')) ||
                                         (who.includes('red') && persona.includes('red')) ||
                                         (who.includes('skeptic') && persona.includes('skeptic')) ||
                                         (who.includes('empiricist') && persona.includes('empiricist'));
                                });
                              }) || [];
                              const dissentingCount = dissentingAgents.length;
                              const alignedCount = totalAgents - dissentingCount;

                              if (totalAgents === 0) {
                                return "No active research slots were mapped for this session.";
                              } else if (totalAgents === 1) {
                                return `Single expert deployment active. Because you have deployed only one analyst (${results.analystResponses[0].persona}), no adversarial peer debate or cross-agent conflict took place. The synthesized findings represent the direct, focused findings from this specialized analyst.`;
                              } else if (dissentingCount === 0) {
                                return `Perfect consensus achieved. All ${totalAgents} active research slots are in complete alignment on the primary thesis, with zero active challenges or dissenting points of friction recorded.`;
                              } else if (dissentingCount === totalAgents) {
                                return `Extreme divergence detected. All ${totalAgents} active research slots have raised critical minority dissents or alternative interpretations, signaling substantial uncertainty and high challenge density.`;
                              } else {
                                const dissentPercentage = Math.round((dissentingCount / totalAgents) * 100);
                                return `An active alignment mapping of ${totalAgents} research slots reveals healthy intellectual friction (${dissentPercentage}% divergence). While ${alignedCount} slots successfully converged on the primary consensus, ${dissentingCount} slots actively challenged key assumptions.`;
                              }
                            })()}
                          </p>

                          <div className="flex items-center justify-start sm:justify-center gap-4 h-32 relative overflow-x-auto min-w-full py-2 bg-gray-50/40 rounded-2xl border border-gray-100 px-4">
                            {results.analystResponses?.map((res, i) => {
                              const hasDissent = results.synthesis?.dissents?.some(d => {
                                const who = d.who.toLowerCase();
                                const persona = res.persona.toLowerCase();
                                return who.includes(persona) || persona.includes(who) || 
                                       (who.includes('steelman') && persona.includes('steelman')) ||
                                       (who.includes('constructive') && persona.includes('constructive')) ||
                                       (who.includes('red') && persona.includes('red')) ||
                                       (who.includes('skeptic') && persona.includes('skeptic')) ||
                                       (who.includes('empiricist') && persona.includes('empiricist'));
                              });
                              return (
                                <div key={i} className="flex flex-col items-center gap-3 relative z-10 flex-shrink-0">
                                  <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black transition-all duration-500",
                                    hasDissent ? "bg-red-50 text-red-600 border-2 border-red-200" : "bg-green-50 text-green-600 border-2 border-green-200"
                                  )}>
                                    {res.persona.charAt(0)}
                                  </div>
                                  <div className="flex flex-col items-center">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{res.persona}</span>
                                    <span className="text-[7px] font-bold text-gray-300 uppercase tracking-tight line-clamp-1 max-w-[60px] text-center">
                                      {(res.specialization || slots?.find(s => s.id === res.slotId)?.description || "Specialist").split(' ')[0]}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                            {/* Connection Lines */}
                            <div className="absolute inset-x-20 top-1/2 -translate-y-1/2 h-0.5 bg-gray-50 -z-0 hidden sm:block" />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-6 border-t border-gray-100">
                            <div className="bg-green-50/50 rounded-xl p-4 border border-green-150">
                              <div className="text-[9px] font-black text-green-600 uppercase tracking-wider mb-1">Aligned Experts (Consensus)</div>
                              <p className="text-xs text-green-700 font-bold leading-relaxed">
                                These specialized agents shared baseline assumptions and merged findings into our primary strategic alignment thesis.
                              </p>
                            </div>
                            <div className="bg-red-50/50 rounded-xl p-4 border border-red-150">
                              <div className="text-[9px] font-black text-red-650 uppercase tracking-wider mb-1">Counter-Perspectives (Dissent)</div>
                              <p className="text-xs text-red-700 font-bold leading-relaxed">
                                These agents identified friction or edge-case limitations to challenge bias and increase alignment metrics.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 3. Critical Minority Dissent */}
                      <div className="space-y-6">
                        <div className="bg-red-50/20 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 rounded-3xl sm:rounded-[40px] p-6 sm:p-10 relative overflow-hidden shadow-xl shadow-red-50/10 dark:shadow-none">
                          <div className="absolute right-0 top-0 w-32 h-32 bg-red-100/10 dark:bg-red-900/5 rounded-full blur-[40px] translate-x-1/3 -translate-y-1/3" />
                          <div className="text-[10px] font-black text-red-650 dark:text-red-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400" />
                            {t('critical_dissent', 'Critical Minority Dissent')}
                          </div>
                          
                          {results.synthesis.dissents && results.synthesis.dissents.length > 0 ? (
                            <div className="space-y-6">
                              <p className="text-sm font-bold text-gray-500 dark:text-zinc-450 leading-relaxed mb-6">
                                Our active slot systems raised the following minority concerns to challenge biases before confirming final synthesis parameters:
                              </p>
                              <div className="space-y-4">
                                {results.synthesis.dissents.map((d, i) => (
                                  <div key={i} className="flex flex-col items-start gap-3 sm:gap-4 bg-white/60 dark:bg-zinc-900/60 p-4 sm:p-6 rounded-2xl border border-red-50 dark:border-red-900/20 shadow-sm">
                                    <span className="text-[9px] sm:text-[10px] font-black text-red-650 dark:text-red-300 bg-red-50 dark:bg-red-950/80 px-2.5 py-1 rounded-lg h-fit w-fit whitespace-nowrap uppercase tracking-wider shrink-0">
                                      Agent: {d.who}
                                    </span>
                                    <p className="text-gray-800 dark:text-zinc-200 font-bold leading-relaxed text-sm sm:text-base w-full">
                                      {d.text}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-10">
                              <span className="text-3xl">🛡️</span>
                              <p className="text-indigo-950 dark:text-indigo-300 font-black mt-4">Zero Instances of Dissent Identified</p>
                              <p className="text-xs text-gray-400 dark:text-zinc-500 font-bold mt-1">Both specialist and peer validation systems aligned with stable agreement metrics on this prompt turn.</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 4. Epistemic Gaps */}
                      <div className="space-y-6">
                        <div className="bg-amber-50/20 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-3xl sm:rounded-[40px] p-6 sm:p-10 relative overflow-hidden shadow-xl shadow-amber-50/10 dark:shadow-none">
                          <div className="absolute right-0 top-0 w-32 h-32 bg-amber-100/10 dark:bg-amber-900/5 rounded-full blur-[40px] translate-x-1/3 -translate-y-1/3" />
                          <div className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                            {t('epistemic_gaps', 'Epistemic Gaps & Uncertainty Analysis')}
                          </div>
                          <p className="text-sm font-bold text-gray-500 dark:text-zinc-450 leading-relaxed mb-6">
                            The consensus parser identified the following limitations, information variables, and systemic assumptions inherent in this investigation:
                          </p>
                          <p className="text-gray-800 dark:text-zinc-200 font-bold leading-relaxed text-base sm:text-lg bg-white/70 dark:bg-zinc-900/60 p-6 rounded-2xl border border-amber-100/40 dark:border-amber-950/30 shadow-sm italic">
                            {results.synthesis.uncertainty || "No outstanding epistemic gaps identified for this dataset."}
                          </p>
                        </div>
                      </div>

                      {/* Call-to-action block */}
                      <div className="pt-4">
                        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 shadow-2xl border border-indigo-900/30 flex flex-col gap-6 relative overflow-hidden">
                          <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] translate-x-1/3 -translate-y-1/3" />
                          <div className="space-y-3 relative z-10 w-full">
                            <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                              Consensus Analysis Complete
                            </h4>
                            <p className="text-sm sm:text-base text-indigo-200 font-medium leading-relaxed max-w-4xl">
                              Want to inspect the raw intelligence behind this verdict? Let's proceed to the **Source Reports** section. Here, you can review the independent, uncensored arguments and confidence profiles submitted by each specialized analyst in your workspace.
                            </p>
                          </div>
                          <div className="relative z-10 pt-2 w-full">
                            <button
                              onClick={() => {
                                setActiveTab('analysts');
                                const el = document.getElementById("query-results-anchor");
                                if (el) {
                                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                } else {
                                  window.scrollTo({ top: 380, behavior: 'smooth' });
                                }
                              }}
                              className="w-full sm:w-auto px-8 py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-black text-sm tracking-tight rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2 border border-indigo-400"
                            >
                              <span>{t('view_source_reports_btn', 'Review Analyst Source Reports')}</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Follow-up Section */}
                      <div id="continue-analysis-section" className="bg-white border border-gray-100 rounded-3xl sm:rounded-[40px] p-4 sm:p-10 shadow-2xl shadow-indigo-50/30">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">{t('continue_analysis', 'Continue Analysis')}</div>
                        <div className="relative">
                           <textarea
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={t('follow_up_placeholder', 'Ask a clarifying question or challenge the synthesis...')}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 pr-20 text-md sm:text-lg font-semibold text-gray-800 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all min-h-[120px] resize-none"
                          />
                          <button 
                            disabled={isAnalyzing || isUploading || isExtracting || !query.trim()}
                            onClick={() => handleRunAnalysis()}
                            className={cn(
                              "absolute right-4 bottom-4 p-4 rounded-2xl shadow-lg transition-all active:scale-95",
                              isAnalyzing || isUploading || isExtracting || !query.trim() 
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200"
                            )}
                          >
                            <Play className="w-5 h-5 fill-current" />
                          </button>
                        </div>
                        
                        {/* Ongoing prompt suggestions */}
                        <div className="mt-6">
                          <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Suggested Follow-ups</div>
                          <div className="flex flex-wrap gap-2">
                            {[
                              {
                                label: "🎯 Take critical dissent and gaps into account",
                                queryText: "Take critical dissent and epistemic gaps into account to challenge and refine findings."
                              },
                              {
                                label: "📋 Write detailed action plan",
                                queryText: "Generate a concrete, step-by-step strategic action plan based on this consensus verdict."
                              },
                              {
                                label: "🔍 Explore alternative scenarios",
                                queryText: "What are the alternative scenarios or black-swan risks that have not been fully addressed?"
                              }
                            ].map((item, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleRunAnalysis(item.queryText)}
                                className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-full text-xs font-bold text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm active:scale-95 cursor-pointer"
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="xl:col-span-4 space-y-8 animate-fadeIn">
                      {/* Confidence Metric Card */}
                      {renderConfidenceCard(false)}

                      {/* Synthesis Tuning Toggle */}
                      <div className="mt-8 flex justify-center">
                        <button 
                          onClick={() => setShowSynthesisConfig(!showSynthesisConfig)}
                          className="px-8 py-3 bg-white border border-gray-100 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all shadow-sm flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                        >
                          <Settings className={cn("w-4 h-4 transition-transform", showSynthesisConfig && "rotate-90")} />
                          {showSynthesisConfig ? "Hide Synthesis Tuning" : "Tune Synthesis Parameters"}
                        </button>
                      </div>

                      {/* Config Sidebar (Conditional) */}
                      {showSynthesisConfig && (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gray-50 rounded-[40px] p-8 border border-gray-100 relative"
                        >
                          <div className="flex items-center justify-between mb-8">
                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Synthesis Configuration</h4>
                            <div className="relative group/tooltip">
                              <HelpCircle className="w-4 h-4 text-gray-300 cursor-help" />
                              <div className="absolute right-0 bottom-full mb-4 w-64 p-6 bg-gray-900 text-white rounded-3xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
                                 <div className="text-[10px] font-black text-indigo-400 uppercase mb-2">Synthesis Tuning</div>
                                 <p className="text-[11px] font-bold leading-relaxed text-gray-300">
                                   Adjust the parameters used to merge analyst reports. You can change the model or temperature and re-run the synthesis for a different perspective.
                                 </p>
                              </div>
                            </div>
                          </div>
                         <div className="space-y-8">
                           <div>
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block">
                                Synthesis Engine
                              </label>
                              <div className="relative">
                                <select 
                                  value={synthesisEngineModel}
                                  onChange={(e) => {
                                    const modelId = e.target.value as Model;
                                    setSynthesisEngineModel(modelId);
                                  }}
                                  className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-100 transition-all appearance-none cursor-pointer"
                                >
                                  {AVAILABLE_MODELS.map(m => {
                                    return (
                                      <option key={m.id} value={m.id} disabled={m.disabled}>
                                        {m.label}
                                      </option>
                                    );
                                  })}
                                </select>
                                <ChevronDown className="w-3 h-3 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                              </div>
                              {(() => {
                                const modelInfo = AVAILABLE_MODELS.find(m => m.id === synthesisEngineModel);
                                return modelInfo?.description ? (
                                  <div className="mt-2 text-[10px] text-gray-500 font-medium leading-relaxed bg-white/50 p-2.5 rounded-xl border border-gray-100/50">
                                    {modelInfo.description}
                                  </div>
                                ) : null;
                              })()}
                           </div>
                            <div>
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block">
                                Reasoning Synthesis Mode
                              </label>
                              <div className="relative">
                                <select 
                                  value={synthesisTemp > 0.5 ? 'explorative' : 'standard'}
                                  onChange={(e) => {
                                    // All users can access all modes
                                  }}
                                  className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-100 transition-all appearance-none cursor-pointer"
                                >
                                  <option value="standard">Standard Consensus</option>
                                  <option value="audit">Deep Contradiction Audit</option>
                                  <option value="adversarial">Adversarial Synthesis</option>
                                  <option value="executive">Institutional Executive</option>
                                </select>
                                <ChevronDown className="w-3 h-3 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                              </div>
                            </div>
                           <div>
                              <div className="flex justify-between text-xs font-black mb-4">
                                <span className="text-gray-500 tracking-wider">CREATIVE VARIANCE</span>
                                <span className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">{synthesisTemp}</span>
                              </div>
                              <input 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.1" 
                                value={synthesisTemp}
                                onChange={(e) => setSynthesisTemp(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
                              />
                              <div className="flex justify-between mt-3 px-1">
                                <span className="text-[9px] font-black text-gray-300">STRICT</span>
                                <span className="text-[9px] font-black text-gray-300">EXPLORATIVE</span>
                              </div>
                           </div>
                         </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'analysts' && (
                  <div className="space-y-8">
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
                            item.label.includes('High') || item.label.includes('Verified') ? "ring-green-50" : 
                            item.label.includes('Inferred') ? "ring-blue-50" : "ring-orange-50"
                          )} />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-800 uppercase tracking-tight">{item.label}</span>
                            <span className="text-[9px] font-medium text-gray-400 hidden sm:block">{item.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {results.analystResponses.map((r, i) => {
                      const modelInfo = AVAILABLE_MODELS.find(m => m.id === r.model);
                      const slotInfo = slots.find(s => s.id === r.slotId);
                      const isError = r.flags.includes('error');
                      return (
                        <motion.div 
                        layoutId={`analyst-${r.persona}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={r.slotId}
                        onClick={() => setExpandedAnalyst(expandedAnalyst === r.persona ? null : r.persona)}
                        className={cn(
                          "bg-white dark:bg-zinc-950 border transition-all relative overflow-hidden flex flex-col group cursor-pointer",
                          expandedAnalyst === r.persona 
                            ? "col-span-full border-indigo-200 dark:border-zinc-800 shadow-2xl shadow-indigo-100 dark:shadow-none rounded-2xl sm:rounded-[48px] p-2 sm:p-6 lg:p-10" 
                            : "border-gray-100 dark:border-zinc-800/80 rounded-[24px] sm:rounded-[36px] shadow-sm hover:shadow-2xl hover:shadow-indigo-50 dark:hover:shadow-none min-h-[280px]"
                        )}
                      >
                        {expandedAnalyst === r.persona ? (
                          <div className="px-3 sm:px-8 py-4 sm:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-950 relative z-10 border-b border-gray-50 dark:border-zinc-900 mb-2 sm:mb-6">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl flex items-center justify-center text-sm font-black text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                                {r.persona.charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-base font-black tracking-tight text-gray-900 dark:text-zinc-100 uppercase leading-none">{r.persona}</h3>
                                  <ShieldCheck className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                                </div>
                                <div className="flex items-start md:items-center flex-col md:flex-row gap-1.5 md:gap-2 mt-1">
                                  <span className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-tighter flex-shrink-0 mt-0.5 md:mt-0">SPECIALIZATION:</span>
                                  <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase">
                                    {(() => {
                                      const specText = r.specialization || slotInfo?.description || "Independent Analyst";
                                      const isLong = specText.length > 80;
                                      const isExpanded = !!expandedSpecs[r.slotId];
                                      const displayed = isLong && !isExpanded ? `${specText.slice(0, 80)}...` : specText;
                                      return (
                                        <>
                                          {displayed}
                                          {isLong && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedSpecs(prev => ({ ...prev, [r.slotId]: !prev[r.slotId] }));
                                              }}
                                              className="ml-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-black cursor-pointer uppercase text-[9px] underline focus:outline-none"
                                            >
                                              {isExpanded ? "[show less]" : "[learn more]"}
                                            </button>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center flex-wrap gap-3 self-end md:self-auto">
                              <div className="relative group/conf">
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
                                <div className="absolute right-0 top-full mt-2 w-48 p-3 bg-gray-900 text-white text-[10px] font-bold rounded-xl opacity-0 group-hover/conf:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-gray-800 dark:border-zinc-850">
                                  {r.confidence === 'HIGH' ? "Agent has high certainty based on direct evidence alignment." :
                                   r.confidence === 'MEDIUM' ? "Agent found partial alignment but requires inference." :
                                   "Agent identified significant data gaps or contradictions."}
                                </div>
                              </div>

                              {/* Core Operations for Analyst Report */}
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (ttsAudioState.title === `${r.persona} Report` && ttsAudioState.status !== 'idle') {
                                      handleStopTts();
                                    } else {
                                      const cleanText = stripThinking(r.text);
                                      const reportText = `Source Analyst Report from Custom Agent ${r.persona}${r.specialization ? `, Specialization: ${r.specialization}` : ''}${r.model ? `, Powered by model: ${r.model}` : ''}${r.confidence ? `, Confidence level: ${r.confidence}` : ''}.\n\nReport Findings:\n${cleanText}`;
                                      handlePlayTts(reportText, `${r.persona} Report`);
                                    }
                                  }}
                                  className={cn(
                                    "p-2 rounded-xl transition-all group relative border shadow-sm cursor-pointer",
                                    ttsAudioState.title === `${r.persona} Report` && ttsAudioState.status !== 'idle'
                                      ? "bg-indigo-600 text-white border-indigo-500 shadow-indigo-100"
                                      : "text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-zinc-900 border-gray-100 dark:border-zinc-800"
                                  )}
                                  title={ttsAudioState.title === `${r.persona} Report` && ttsAudioState.status !== 'idle' ? "Turn Audio Off" : `Listen to ${r.persona} Report`}
                                >
                                  {ttsAudioState.title === `${r.persona} Report` && ttsAudioState.status === 'loading' ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                                  ) : ttsAudioState.title === `${r.persona} Report` && ttsAudioState.status !== 'idle' ? (
                                    <VolumeX className="w-4 h-4 text-white" />
                                  ) : (
                                    <Volume2 className="w-4 h-4" />
                                  )}
                                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-black px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[60]">
                                    {ttsAudioState.title === `${r.persona} Report` && ttsAudioState.status !== 'idle' ? "Click to Turn Off Audio" : `Listen to ${r.persona} Report`}
                                  </span>
                                </button>

                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(r.text);
                                    setAnalystCopyId(r.slotId);
                                    setTimeout(() => setAnalystCopyId(null), 2000);
                                  }}
                                  className={cn(
                                    "p-2 rounded-xl transition-all group relative border shadow-sm",
                                    analystCopyId === r.slotId ? "bg-green-50 text-green-600 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30" : "text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-zinc-900 border-gray-100 dark:border-zinc-800"
                                  )}
                                >
                                  {analystCopyId === r.slotId ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-black px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[60]">
                                    {analystCopyId === r.slotId ? t('copied') : t('copy_report', 'Copy Source Report')}
                                  </span>
                                </button>

                                <button 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    downloadAnalystReport(r); 
                                  }}
                                  className="p-2 text-gray-400 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-zinc-900 rounded-xl transition-all group relative border border-gray-100 dark:border-zinc-800 shadow-sm"
                                >
                                  <Download className="w-4 h-4" />
                                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-black px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[60]">{t('download_report', 'Download Report (HTML)')}</span>
                                </button>

                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleShare({ query: results?.query || messages[0]?.content || '', synthesis: results?.synthesis, analystResponses: results?.analystResponses });
                                  }}
                                  className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all group relative border border-indigo-500 shadow-lg shadow-indigo-100"
                                >
                                  <Share2 className="w-4 h-4" />
                                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-black px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[60]">{t('share_analysis', 'Share Analysis')}</span>
                                </button>
                              </div>

                              <button 
                                onClick={(e) => { e.stopPropagation(); setExpandedAnalyst(null); }}
                                className="p-2 text-gray-400 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-100"
                              >
                                <Plus className="w-6 h-6 rotate-45" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="px-6 py-5 flex flex-col gap-4 bg-white dark:bg-zinc-950 relative z-10 border-b border-gray-50 dark:border-zinc-900">
                            {/* Avatar & Details */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl flex items-center justify-center text-xs font-black text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                                  {r.persona.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <h3 className="text-xs sm:text-sm font-black tracking-tight text-gray-900 dark:text-zinc-100 uppercase truncate leading-none">{r.persona}</h3>
                                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                                  </div>
                                  <div className="text-[10px] sm:text-[11px] font-bold text-indigo-500 dark:text-indigo-400 uppercase truncate mt-1">
                                    {r.specialization || slotInfo?.description || "Independent Analyst"}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Verification Pill Footer inside the header */}
                            <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-50 dark:border-zinc-900">
                              <span className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">VERIFICATION</span>
                              <div className="relative group/conf flex-shrink-0">
                                <span className={cn(
                                  "text-[9px] px-2.5 py-1.5 rounded-lg font-black tracking-wider border flex items-center gap-1.5 transition-all select-none",
                                  r.confidence === 'HIGH' ? "bg-green-50 text-green-600 border-green-100 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30" : 
                                  r.confidence === 'MEDIUM' ? "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30" :
                                  "bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30"
                                )}>
                                  <div className={cn(
                                    "w-1.5 h-1.5 rounded-full flex-shrink-0",
                                    r.confidence === 'HIGH' ? "bg-green-500" : 
                                    r.confidence === 'MEDIUM' ? "bg-blue-500" :
                                    "bg-orange-500"
                                  )} />
                                  {r.confidence === 'HIGH' ? 'HIGH CONFIDENCE' : r.confidence === 'MEDIUM' ? 'STABLE CONFIDENCE' : 'LOW CERTAINTY'}
                                </span>
                                <div className="absolute right-0 top-full mt-2 w-48 p-3 bg-gray-900 text-white text-[10px] font-bold rounded-xl opacity-0 group-hover/conf:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-gray-800 dark:border-zinc-800">
                                  {r.confidence === 'HIGH' ? "Agent has high certainty based on direct evidence alignment." :
                                   r.confidence === 'MEDIUM' ? "Agent found partial alignment but requires inference." :
                                   "Agent identified significant data gaps or contradictions."}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className={cn(
                          "p-2.5 sm:p-6 lg:p-8 flex-1 transition-colors flex flex-col justify-between",
                          expandedAnalyst === r.persona ? "bg-white dark:bg-zinc-950" : "bg-gray-50/20 dark:bg-zinc-900/10 group-hover:bg-white dark:group-hover:bg-zinc-900/40"
                        )}>
                          {expandedAnalyst === r.persona && (
                            <div className="mb-6 text-xs font-bold text-indigo-950 dark:text-indigo-300 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-900/50 p-3 sm:p-4 rounded-xl flex items-center gap-2 select-none italic">
                              <span className="text-[14px]">💡</span>
                              <span>
                                The confidence level from the {r.persona} is {r.confidence === 'HIGH' ? 'High' : r.confidence === 'MEDIUM' ? 'Stable' : 'Low'}.
                              </span>
                            </div>
                          )}

                          <div className={cn(
                            "text-gray-600 leading-relaxed font-medium markdown-content",
                            expandedAnalyst === r.persona ? "text-sm sm:text-base space-y-4" : "text-xs sm:text-sm"
                          )}>
                            {expandedAnalyst === r.persona ? (
                              (() => {
                                const { thinking, report } = extractThinking(r.text);
                                const parsed = parseAnalystReport(report);
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
                                      </a>
                                    );
                                  },
                                  h1: ({ ...props }: any) => (
                                    <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 mt-6 mb-2">
                                      {cleanHeadingText(props.children)}
                                    </h3>
                                  ),
                                  h2: ({ ...props }: any) => (
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-5 mb-2">
                                      {cleanHeadingText(props.children)}
                                    </h4>
                                  ),
                                  h3: ({ ...props }: any) => (
                                    <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 mt-4 mb-2">
                                      {cleanHeadingText(props.children)}
                                    </h5>
                                  ),
                                  h4: ({ ...props }: any) => {
                                    const cleanText = cleanHeadingText(props.children);
                                    const isThesis = typeof cleanText === 'string' && (
                                      cleanText.toLowerCase().includes('thesis') || 
                                      cleanText.toLowerCase().includes('confidence quotient')
                                    );
                                    
                                    if (isThesis) {
                                      return (
                                        <div className="mt-6 mb-3 flex items-center gap-2 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-900/50 px-3 py-1.5 rounded-xl w-fit">
                                          <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
                                          <span className="text-[11px] sm:text-xs font-bold text-indigo-950 dark:text-indigo-300">
                                            Thesis & Confidence Quotient
                                          </span>
                                        </div>
                                      );
                                    }
                                    
                                    return (
                                      <h5 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200 mt-4 mb-2">
                                        {cleanHeadingText(props.children)}
                                      </h5>
                                    );
                                  },
                                  h5: ({ ...props }: any) => (
                                    <h5 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-250 mt-4 mb-2">
                                      {cleanHeadingText(props.children)}
                                    </h5>
                                  ),
                                  h6: ({ ...props }: any) => (
                                    <h6 className="text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-zinc-400 mt-3 mb-1">
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
                                  ),
                                  table: ({ children }: any) => (
                                    <div className="overflow-x-auto my-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                                      <table className="w-full text-left border-collapse text-[13px] sm:text-sm">
                                        {children}
                                      </table>
                                    </div>
                                  ),
                                  thead: ({ children }: any) => (
                                    <thead className="bg-slate-50 dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-zinc-350">
                                      {children}
                                    </thead>
                                  ),
                                  tbody: ({ children }: any) => (
                                    <tbody className="divide-y divide-gray-50 dark:divide-zinc-850 bg-white dark:bg-zinc-950">
                                      {children}
                                    </tbody>
                                  ),
                                  tr: ({ children }: any) => (
                                    <tr className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                                      {children}
                                    </tr>
                                  ),
                                  th: ({ children }: any) => (
                                    <th className="px-4 py-3 font-bold text-slate-800 dark:text-zinc-200">
                                      {children}
                                    </th>
                                  ),
                                  td: ({ children }: any) => (
                                    <td className="px-4 py-3 text-gray-700 dark:text-zinc-300 leading-relaxed">
                                      {children}
                                    </td>
                                  )
                                };

                                return (
                                  <div className="space-y-4 sm:space-y-8 mt-2 sm:mt-4">
                                    {thinking && (
                                      <details className="group bg-indigo-50/40 dark:bg-zinc-900/60 rounded-xl sm:rounded-2xl border border-indigo-100/70 dark:border-zinc-800 p-4 transition-all mb-4 sm:mb-6">
                                        <summary className="flex items-center justify-between cursor-pointer text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors list-none">
                                          <span className="flex items-center gap-2">
                                            <Brain className="w-4 h-4 text-indigo-500 shrink-0" />
                                            <span>Model Chain of Thought (Thinking Process)</span>
                                          </span>
                                          <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform text-indigo-400 dark:text-zinc-500 shrink-0" />
                                        </summary>
                                        <div className="mt-3 text-xs text-gray-600 dark:text-zinc-300 font-mono leading-relaxed text-left border-t border-indigo-100/60 dark:border-zinc-800/80 pt-3 whitespace-pre-wrap max-h-96 overflow-y-auto">
                                          {thinking}
                                        </div>
                                      </details>
                                    )}

                                    {parsed.other && (
                                      <div className="text-gray-700 dark:text-zinc-350 whitespace-pre-wrap leading-relaxed text-[13px] sm:text-sm bg-gray-50/50 dark:bg-zinc-900/45 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-zinc-800 mb-4 sm:mb-6">
                                        {parsed.other}
                                      </div>
                                    )}

                                    {parsed.thesis && (
                                      <div className="bg-slate-50/60 dark:bg-zinc-900/20 border border-slate-100 dark:border-zinc-800/80 rounded-xl sm:rounded-2xl p-3 sm:p-7 shadow-sm">
                                        <div className="flex items-center gap-2 mb-3 sm:mb-4">
                                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                                            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                          </div>
                                          <h4 className="text-xs sm:text-sm font-black text-indigo-950 dark:text-indigo-300 uppercase tracking-wider">Thesis & Confidence Quotient</h4>
                                        </div>
                                        <div className="text-gray-700 dark:text-zinc-300 leading-relaxed text-[13px] sm:text-sm markdown-content">
                                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{parsed.thesis}</ReactMarkdown>
                                        </div>
                                      </div>
                                    )}

                                    {parsed.findings && (
                                      <div className="bg-white dark:bg-zinc-900/20 border border-gray-100 dark:border-zinc-800/80 rounded-xl sm:rounded-2xl p-3 sm:p-7 shadow-sm">
                                        <div className="flex items-center gap-2 mb-3 sm:mb-4">
                                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-450 shrink-0">
                                            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                          </div>
                                          <h4 className="text-xs sm:text-sm font-black text-emerald-950 dark:text-emerald-300 uppercase tracking-wider">Key Findings & Evidence Grounding</h4>
                                        </div>
                                        <div className="text-gray-700 dark:text-zinc-300 leading-relaxed text-[13px] sm:text-sm markdown-content">
                                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{parsed.findings}</ReactMarkdown>
                                        </div>
                                      </div>
                                    )}

                                    {parsed.peerDebate && (
                                      <div className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/25 dark:to-purple-950/25 border border-indigo-150 dark:border-indigo-900/55 rounded-xl sm:rounded-2xl p-3 sm:p-7 shadow-md relative overflow-hidden group">
                                        <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full blur-2xl -mr-6 -mt-6 group-hover:scale-125 transition-transform duration-700" />
                                        <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4 relative z-10">
                                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100/10 ring-2 sm:ring-4 ring-indigo-50 dark:ring-indigo-950/50 shrink-0">
                                            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                                          </div>
                                          <div className="flex flex-col">
                                            <h4 className="text-xs sm:text-sm font-black text-indigo-950 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                                              Peer Debate Alignment
                                              <span className="bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest animate-pulse">Debate Hub</span>
                                            </h4>
                                            <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold">Adversarial peer exchange & consensus pressure points</span>
                                          </div>
                                        </div>
                                        <div className="text-gray-800 dark:text-zinc-100 leading-relaxed text-[13px] sm:text-sm relative z-10 markdown-content p-2.5 sm:p-5 bg-white/70 dark:bg-zinc-900/70 rounded-lg sm:rounded-xl border border-white dark:border-zinc-850 shadow-inner">
                                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{parsed.peerDebate}</ReactMarkdown>
                                        </div>
                                      </div>
                                    )}

                                    {parsed.uncertainty && (
                                      <div className="bg-orange-50/30 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/20 rounded-xl sm:rounded-2xl p-3 sm:p-7 shadow-sm">
                                        <div className="flex items-center gap-2 mb-3 sm:mb-4">
                                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-50/80 dark:bg-orange-950/40 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                                            <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                          </div>
                                          <h4 className="text-xs sm:text-sm font-black text-orange-950 dark:text-orange-300 uppercase tracking-wider">Uncertainty & Gaps</h4>
                                        </div>
                                        <div className="text-gray-700 dark:text-zinc-300 leading-relaxed text-[13px] sm:text-sm markdown-content">
                                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{parsed.uncertainty}</ReactMarkdown>
                                        </div>
                                      </div>
                                    )}

                                    {parsed.conclusion && (
                                      <div className="bg-slate-50/40 dark:bg-zinc-900/20 border border-slate-100 dark:border-zinc-800/80 rounded-xl sm:rounded-2xl p-3 sm:p-7 shadow-sm">
                                        <div className="flex items-center gap-2 mb-3 sm:mb-4">
                                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-600 dark:bg-zinc-800 flex items-center justify-center text-white shrink-0">
                                            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                          </div>
                                          <h4 className="text-xs sm:text-sm font-black text-slate-950 dark:text-zinc-200 uppercase tracking-wider">Conclusion</h4>
                                        </div>
                                        <div className="text-gray-700 dark:text-zinc-300 leading-relaxed text-[13px] sm:text-sm markdown-content">
                                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{parsed.conclusion}</ReactMarkdown>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()
                            ) : (
                              <p className="line-clamp-5 text-gray-500 text-[13px] leading-relaxed font-medium">
                                {stripMarkdown(r.text)}
                              </p>
                            )}
                          </div>

                          {expandedAnalyst === r.persona && (
                            <motion.div 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-12 space-y-10"
                            >
                              <div className="p-10 bg-indigo-950 rounded-[40px] text-white overflow-hidden relative">
                                <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-800/30 blur-[60px] rounded-full" />
                                <div className="flex items-center gap-3 mb-6">
                                  <Brain className="w-5 h-5 text-indigo-400" />
                                  <span className="text-xs font-black tracking-[0.3em] uppercase">Latent Reasoning Space</span>
                                </div>
                                <p className="text-indigo-200 font-mono text-sm leading-relaxed mb-8">
                                  [SYSTEM]: Model {r.model} initialized reasoning chain... <br/>
                                  [SEARCH]: Cross-referencing {r.flags.join(', ')}... <br/>
                                  [VERDICT]: Identified semantic instability in training distribution regarding target claim. Applying adversarial compensation.
                                </p>
                                <div className="space-y-4">
                                  <div className="h-1 w-full bg-indigo-900 rounded-full overflow-hidden">
                                    <motion.div 
                                      animate={{ x: ['-100%', '100%'] }}
                                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                      className="h-full w-1/3 bg-indigo-400"
                                    />
                                  </div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-8 border border-gray-100 rounded-[32px]">
                                   <h4 className="text-[10px] font-black text-gray-400 tracking-widest uppercase mb-4">{t('semantic_flags')}</h4>
                                   <div className="flex flex-wrap gap-2">
                                      {r.flags.map(f => (
                                        <span key={f} className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black text-gray-600 tracking-tight">
                                          {f.toUpperCase()}
                                        </span>
                                      ))}
                                   </div>
                                </div>
                                <div className="p-8 border border-gray-100 rounded-[32px]">
                                   <h4 className="text-[10px] font-black text-gray-400 tracking-widest uppercase mb-4">{t('infrastructure')}</h4>
                                   <div className="flex items-center gap-3">
                                      <div className="bg-indigo-50 p-2 rounded-lg">
                                        <ShieldCheck className="w-4 h-4 text-indigo-600" />
                                      </div>
                                      <span className="text-sm font-black text-gray-900">{r.model.toUpperCase()}</span>
                                   </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>

                        {expandedAnalyst !== r.persona && (
                          <div className="px-8 py-6 bg-white border-t border-gray-50 flex items-center justify-between">
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1 truncate">{modelInfo?.label || 'Custom'}</span>
                              <span className="text-[8px] font-mono text-gray-300 truncate">{r.model}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 mr-4 flex-shrink-0 relative z-20">
                              {/* Quick Copy */}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(r.text);
                                  setAnalystCopyId(r.slotId);
                                  setTimeout(() => setAnalystCopyId(null), 2000);
                                }}
                                className={cn(
                                  "p-1.5 rounded-lg transition-all border",
                                  analystCopyId === r.slotId ? "bg-green-50 text-green-600 border-green-200" : "text-gray-400 hover:text-indigo-600 hover:bg-gray-50 border-gray-100"
                                )}
                              >
                                {analystCopyId === r.slotId ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>

                              {/* Quick Download */}
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  downloadAnalystReport(r); 
                                }}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 rounded-lg transition-all border border-gray-100"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>

                              {/* Quick Share */}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShare({ query: results?.query || messages[0]?.content || '', synthesis: results?.synthesis, analystResponses: results?.analystResponses });
                                }}
                                className="p-1.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all border border-indigo-500"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <span className="text-[10px] font-black text-indigo-600 transition-colors uppercase tracking-widest flex items-center gap-1 group-hover:text-indigo-800 flex-shrink-0">
                              SEE MORE <span className="transition-transform group-hover:translate-x-1">→</span>
                            </span>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                  </div>

                  {/* Continue Analyst team Research / Cooperative Analysis Console */}
                  <div className="mt-10 bg-white border border-gray-100 rounded-3xl sm:rounded-[40px] p-4 sm:p-10 shadow-2xl shadow-indigo-50/30">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">{t('continue_analysis', 'Continue Analysis')}</div>
                    <div className="relative">
                       <textarea
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t('follow_up_placeholder_analysts', 'Instruct the analyst team on how to continue or deepen their research...')}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 pr-20 text-md sm:text-lg font-semibold text-gray-800 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all min-h-[120px] resize-none"
                      />
                      <button 
                        disabled={isAnalyzing || isUploading || isExtracting || !query.trim()}
                        onClick={() => handleRunAnalysis()}
                        className={cn(
                          "absolute right-4 bottom-4 p-4 rounded-2xl shadow-lg transition-all active:scale-95",
                          isAnalyzing || isUploading || isExtracting || !query.trim() 
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                            : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200"
                        )}
                      >
                        <Play className="w-5 h-5 fill-current" />
                      </button>
                    </div>
                    
                    {/* Ongoing prompt suggestions */}
                    <div className="mt-6">
                      <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Suggested Follow-ups</div>
                      <div className="flex flex-wrap gap-2">
                        {[
                          {
                            label: "🎯 Take critical dissent and gaps into account",
                            queryText: "Take critical dissent and epistemic gaps into account to challenge and refine findings."
                          },
                          {
                            label: "📋 Write detailed action plan",
                            queryText: "Generate a concrete, step-by-step strategic action plan based on this consensus verdict."
                          },
                          {
                            label: "🔍 Explore alternative scenarios",
                            queryText: "What are the alternative scenarios or black-swan risks that have not been fully addressed?"
                          }
                        ].map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleRunAnalysis(item.queryText)}
                            className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-full text-xs font-bold text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm active:scale-95 cursor-pointer"
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              )}
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-gray-100 rounded-[64px] bg-gray-50/20 mx-4">
              <div className="w-20 h-20 bg-white border border-gray-100 rounded-[32px] flex items-center justify-center mb-8 shadow-xl shadow-gray-100/50">
                <Search className="w-10 h-10 text-gray-200" />
              </div>
            </div>
          )}
        </AnimatePresence>
      </>
    ) : view === 'projects' ? (
      <ProjectsPortal 
        projects={projects}
        onCreateProject={() => setShowCreateProjectModal(true)}
        onSelectProject={(id: string) => { setActiveProjectId(id); setView('project-detail'); }}
      />
    ) : view === 'chats' ? (
      <ChatsPortal 
        history={history}
        onLoadChat={(item) => { loadFromHistory(item); setView('main'); }}
        onClose={() => setView('main')}
      />
    ) : view === 'project-detail' ? (
      (() => {
        const activeProj = projects.find(p => p.id === activeProjectId);
        if (!activeProj) {
          return (
            <div className="max-w-md mx-auto py-24 text-center">
              <p className="text-gray-500 font-bold mb-4">Project workspace loading or unavailable...</p>
              <button 
                onClick={() => setView('projects')} 
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all"
              >
                Back to Projects
              </button>
            </div>
          );
        }
        return (
          <ProjectDetailView 
            project={activeProj}
            onBack={() => setView('projects')}
            onUpdate={(updated) => setProjects(prev => prev.map(p => p.id === updated.id ? updated : p))}
            onAddResource={() => setShowAddResourceModal(true)}
            onInviteTeam={() => {
              setInviteError(null);
              setInviteSuccess(null);
              setInviteLink('');
              setShowInviteTeamModal(true);
            }}
            onConfigureAgents={() => {
              setNewProjectInstructions(activeProj.instructions || '');
              setShowConfigureAgentsModal(true);
            }}
            onStartAnalysis={() => {
              setView('main');
              setMessages([]);
              setResults(null);
              setQuery('');
              setActiveTab('analysts');
              setCurrentAnalysisId(null);
            }}
          />
        );
      })()
    ) : view === 'agent-library' ? (
      <AgentLibrary 
        onSelect={() => setView('main')} 
        onClose={() => setView('main')} 
        slots={slots} 
        setSlots={setSlots} 
        plan={currentPlan} 
        setShowUpgradeModal={setShowUpgradeModal}
        customAgents={customAgents}
        archiveAgent={archiveAgent}
        deleteCustomAgent={deleteCustomAgent}
        toggleShareCustomAgent={toggleShareCustomAgent}
      />
        ) : view === 'shared' ? (
          <SharedView debate={sharedDebate} onClose={() => setView('welcome' as any)} />
        ) : null}
      </main>

      <CommonFooter setView={setView} />

      <AnimatePresence>
        {showAccountPopover && (
          <>
            <div 
              className="fixed inset-0 z-[60]" 
              onClick={() => {
                setShowAccountPopover(false);
                setPopoverScreen('main');
              }}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="fixed bottom-[100px] left-6 w-[280px] bg-white rounded-[24px] shadow-2xl border border-gray-100 z-[100] overflow-hidden"
            >
              {popoverScreen === 'main' && (
                <div className="p-2">
                  <div className="px-4 py-3 border-b border-gray-50 mb-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Account</p>
                    <p className="text-xs font-black text-gray-900 truncate">{user?.email}</p>
                  </div>

                  <div className="space-y-0.5">
                    <button 
                      onClick={() => { setShowCustomizeModal(true); setShowAccountPopover(false); }}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-gray-400 group-hover:text-indigo-600 transition-colors"><Settings className="w-4 h-4" /></div>
                        <span className="text-sm font-bold text-gray-600">{t('settings')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Command className="w-3 h-3 text-gray-200" />
                        <span className="text-[10px] font-mono text-gray-300">,</span>
                      </div>
                    </button>

                    <button 
                      onClick={() => setPopoverScreen('language')}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-gray-400 group-hover:text-indigo-600 transition-colors"><Globe className="w-4 h-4" /></div>
                        <span className="text-sm font-bold text-gray-600">{t('language')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-300">{(currentLanguage || '').split(' ')[0]}</span>
                        <ChevronDown className="w-3 h-3 text-gray-300 -rotate-90" />
                      </div>
                    </button>

                    <button 
                      onClick={() => { setView('help'); setShowAccountPopover(false); }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-all group"
                    >
                      <div className="text-gray-400 group-hover:text-indigo-600 transition-colors"><HelpCircle className="w-4 h-4" /></div>
                      <span className="text-sm font-bold text-gray-600">{t('help')}</span>
                    </button>

                    <div className="h-px bg-gray-50 my-1 mx-2" />

                    <button 
                      onClick={() => { setShowUpgradeModal(true); setShowAccountPopover(false); }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-indigo-50 rounded-xl transition-all group"
                    >
                      <div className="text-indigo-400 group-hover:text-indigo-600 transition-colors"><Sparkles className="w-4 h-4" /></div>
                      <span className="text-sm font-bold text-gray-600">{t('upgrade')}</span>
                    </button>

                    <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-all group">
                      <div className="text-gray-400 group-hover:text-indigo-600 transition-colors"><AppWindow className="w-4 h-4" /></div>
                      <span className="text-sm font-bold text-gray-600">Get apps & extensions</span>
                    </button>

                    <button 
                      onClick={() => setPopoverScreen('learn-more')}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-gray-400 group-hover:text-indigo-600 transition-colors"><Info className="w-4 h-4" /></div>
                        <span className="text-sm font-bold text-gray-600">{t('learn_more')}</span>
                      </div>
                      <ChevronDown className="w-3 h-3 text-gray-300 -rotate-90" />
                    </button>

                    <div className="h-px bg-gray-50 my-1 mx-2" />

                    <button 
                      onClick={logout}
                      className="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-xl transition-all group text-red-500"
                    >
                      <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      <span className="text-sm font-bold">{t('logout')}</span>
                    </button>

                    <div className="h-px bg-gray-50 my-1 mx-2" />

                    <div className="flex items-center justify-between p-3 select-none">
                      <span className="text-sm font-bold text-gray-500">Theme</span>
                      <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg">
                        <button
                          onClick={() => setTheme('light')}
                          className={`p-1.5 rounded-md transition-all ${theme === 'light' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                          title="Light Mode"
                        >
                          <Sun className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setTheme('dark')}
                          className={`p-1.5 rounded-md transition-all ${theme === 'dark' ? 'bg-zinc-700 text-yellow-400 shadow-sm' : 'text-gray-400 hover:text-gray-300'}`}
                          title="Dark Mode"
                        >
                          <Moon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {popoverScreen === 'language' && (
                <motion.div 
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="p-2"
                >
                  <div className="flex items-center gap-2 px-1 py-1 mb-2 border-b border-gray-50 pb-2">
                    <button onClick={() => setPopoverScreen('main')} className="p-2 hover:bg-gray-50 rounded-lg">
                      <ChevronLeft className="w-4 h-4 text-gray-400" />
                    </button>
                    <span className="text-xs font-black text-gray-900 uppercase tracking-widest">{t('language')}</span>
                  </div>
                  <div className="space-y-0.5 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                    {Object.keys(languageCodeMap).map(lang => (
                      <button 
                        key={lang}
                        onClick={() => {
                          setCurrentLanguage(lang);
                          setPopoverScreen('main');
                        }}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-all text-sm font-bold text-gray-600"
                      >
                        <span>{lang}</span>
                        {currentLanguage === lang && <Check className="w-4 h-4 text-indigo-600" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {popoverScreen === 'learn-more' && (
                <motion.div 
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="p-2"
                >
                  <div className="flex items-center gap-2 px-1 py-1 mb-2 border-b border-gray-50 pb-2">
                    <button onClick={() => setPopoverScreen('main')} className="p-2 hover:bg-gray-50 rounded-lg">
                      <ChevronLeft className="w-4 h-4 text-gray-400" />
                    </button>
                    <span className="text-xs font-black text-gray-900 uppercase tracking-widest">{t('learn_more')}</span>
                  </div>
                  <div className="space-y-0.5">
                    {[
                      { label: t('api_console'), icon: <Command className="w-4 h-4" />, target: 'protocol' },
                      { label: t('about_ethersflow'), icon: <Info className="w-4 h-4" />, target: 'about' },
                      { label: t('tutorials'), icon: <Plus className="w-4 h-4" />, target: 'tutorials' },
                      { label: t('courses'), icon: <Brain className="w-4 h-4" />, target: 'courses' },
                      { label: t('usage_policy'), icon: <ShieldAlert className="w-4 h-4" />, target: 'protocol' },
                      { label: t('privacy_policy'), icon: <ShieldCheck className="w-4 h-4" />, target: 'privacy' },
                      { label: t('privacy_choices'), icon: <Settings className="w-4 h-4" />, target: 'security' },
                      { label: t('keyboard_shortcuts'), icon: <Command className="w-4 h-4" />, shortcut: 'Ctrl/' }
                    ].map(item => (
                      <button 
                        key={item.label}
                        onClick={() => {
                          if (item.target) {
                            setView(item.target as View);
                            setShowAccountPopover(false);
                            setPopoverScreen('main');
                          }
                        }}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-gray-400 group-hover:text-indigo-600 transition-colors">{item.icon}</div>
                          <span className="text-sm font-bold text-gray-600">{item.label}</span>
                        </div>
                        {item.shortcut ? (
                            <span className="text-[10px] font-mono text-gray-300">{item.shortcut}</span>
                        ) : (
                          <ChevronDown className="w-3 h-3 text-gray-300 -rotate-90" />
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateProjectModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateProjectModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] overflow-hidden shadow-2xl border border-gray-100 p-8 sm:p-12"
            >
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">New Workspace Project</h3>
                  <button onClick={() => setShowCreateProjectModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                    <Plus className="w-6 h-6 rotate-45 text-gray-400" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Project Name</label>
                    <input 
                      autoFocus
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="e.g. Legal Discovery Q4"
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Description (Optional)</label>
                    <textarea 
                      value={newProjectDesc}
                      onChange={(e) => setNewProjectDesc(e.target.value)}
                      placeholder="Project scope and goals..."
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all min-h-[100px] resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setShowCreateProjectModal(false)}
                    className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={!newProjectName.trim()}
                    onClick={createProject}
                    className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-100"
                  >
                    Create Project
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfigureAgentsModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfigureAgentsModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[40px] overflow-hidden shadow-2xl border border-gray-100 p-8 sm:p-12"
            >
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Project Reasoning Guidelines</h3>
                  <button onClick={() => setShowConfigureAgentsModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                    <Plus className="w-6 h-6 rotate-45 text-gray-400" />
                  </button>
                </div>
                
                <p className="text-sm text-gray-500 font-bold leading-relaxed">
                  These instructions will be prepended to every agent in this project, providing institutional context or specific research constraints.
                </p>

                <textarea 
                  autoFocus
                  value={newProjectInstructions}
                  onChange={(e) => setNewProjectInstructions(e.target.value)}
                  placeholder="e.g. Always prioritize GAAP accounting standards. Focus on long-term implications over immediate growth..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-6 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all min-h-[300px] resize-none font-mono"
                />

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setShowConfigureAgentsModal(false)}
                    className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={updateProjectInstructions}
                    className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-100"
                  >
                    Save Guidelines
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddResourceModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddResourceModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] overflow-hidden shadow-2xl border border-gray-100 p-8 sm:p-12"
            >
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Add Resource</h3>
                  <button onClick={() => setShowAddResourceModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                    <Plus className="w-6 h-6 rotate-45 text-gray-400" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {newResourceType === 'link' ? (
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Resource URL</label>
                      <input 
                        autoFocus
                        value={newResourceName}
                        onChange={(e) => setNewResourceName(e.target.value)}
                        placeholder="https://example.com/article"
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                  ) : newResourceType === 'file' ? (
                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50 group hover:border-indigo-200 transition-all cursor-pointer"
                      onClick={() => resourceFileInputRef.current?.click()}
                    >
                      <input 
                        type="file"
                        ref={resourceFileInputRef}
                        className="hidden"
                        accept=".pdf,.docx,.doc,.txt"
                        onChange={handleResourceFileUpload}
                      />
                      <Upload className="w-10 h-10 text-gray-300 mb-4 group-hover:text-indigo-400 group-hover:scale-110 transition-all" />
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Select PDF or Document</p>
                      <p className="text-[10px] text-gray-300 mt-2">Max 100MB</p>
                    </div>
                  ) : newResourceType === 'text' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Resource Name / Title</label>
                        <input 
                          autoFocus
                          value={newResourceName}
                          onChange={(e) => setNewResourceName(e.target.value)}
                          placeholder="e.g. Pittsburgh Digital Equity Plan"
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Document Content (Paste text here)</label>
                        <textarea 
                          value={newResourceContent}
                          onChange={(e) => setNewResourceContent(e.target.value)}
                          placeholder="Paste results, PDF text extracts, or copy of website text here..."
                          rows={6}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-y min-h-[150px]"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {driveError && (
                        <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[10px] font-bold leading-normal">
                          Error syncing Drive: {driveError}
                        </div>
                      )}

                      {!isDriveConnected ? (
                        <div className="p-8 bg-indigo-50/50 rounded-2xl text-center">
                          <Cloud className="w-10 h-10 text-indigo-500 mx-auto mb-4" />
                          <h4 className="text-xs font-black text-indigo-950 uppercase tracking-widest mb-2">Google Drive Connected</h4>
                          <p className="text-[10px] text-indigo-400 leading-relaxed font-bold mb-4">
                            Connect your Google Drive to search, view, and directly attach documents to this project.
                          </p>
                          <button 
                            onClick={async () => {
                              try {
                                await signInWithGoogleDrive();
                                setIsDriveConnected(true);
                                await fetchDriveFiles('root', true);
                              } catch (err: any) {
                                setDriveError(err.message || "Authorization failed.");
                              }
                            }}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg inline-block cursor-pointer"
                          >
                            Authorize Google Drive
                          </button>
                        </div>
                      ) : (
                        <>
                          {folderHistory.length > 0 && (
                            <button 
                              onClick={navigateUpDriveFolder}
                              className="w-full flex items-center justify-center gap-2 p-2 rounded-xl border border-dashed border-indigo-100 hover:bg-indigo-50/40 text-[10px] font-black text-indigo-600 uppercase tracking-widest transition-all"
                            >
                              <ChevronLeft className="w-3 h-3" />
                              Back to Parent Folder
                            </button>
                          )}

                          {isFetchingDrive ? (
                            <div className="p-12 text-center">
                              <RotateCcw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Protocol: Synchronizing Drive Library...</p>
                            </div>
                          ) : driveFiles.length === 0 ? (
                            <div className="p-8 bg-indigo-50 rounded-2xl text-center">
                              <Cloud className="w-10 h-10 text-indigo-400 mx-auto mb-4" />
                              <p className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-2">No Files Detected</p>
                              <p className="text-[10px] text-indigo-400 leading-relaxed font-bold">We couldn't find any documents in your Drive account or permissions were not granted.</p>
                              <div className="flex gap-2 justify-center mt-4">
                                <button 
                                  onClick={() => fetchDriveFiles(currentFolderId || 'root', false)}
                                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg"
                                >
                                  Retry Sync
                                </button>
                                <button 
                                  onClick={async () => {
                                    try {
                                      await signInWithGoogleDrive();
                                      setIsDriveConnected(true);
                                      await fetchDriveFiles(currentFolderId || 'root', true);
                                    } catch (err: any) {
                                      setDriveError(err.message || "Authorization failed.");
                                    }
                                  }}
                                  className="px-4 py-2 bg-white border border-indigo-200 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-lg"
                                >
                                  Re-Authorize
                                </button>
                              </div>
                            </div>
                          ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recent Files</p>
                            <button onClick={() => fetchDriveFiles(currentFolderId)} className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:underline">Refresh</button>
                          </div>
                          {driveFiles.map(file => {
                            const isFolder = file.mimeType === "application/vnd.google-apps.folder";
                            return (
                              <div 
                                key={file.id}
                                onClick={() => handleDriveItemClick(file, true)}
                                className="group flex items-center justify-between p-3 bg-gray-50 hover:bg-indigo-50 rounded-xl border border-gray-100 hover:border-indigo-100 transition-all cursor-pointer"
                              >
                                <div className="flex items-center gap-3 overflow-hidden">
                                  {isFolder ? (
                                    <Folder className="w-5 h-5 text-amber-500 fill-amber-100/40" />
                                  ) : (
                                    <FileText className="w-5 h-5 text-gray-400 group-hover:text-indigo-500" />
                                  )}
                                  <div className="min-w-0">
                                    <p className="text-[11px] font-bold text-gray-800 truncate">{file.name}</p>
                                    <p className="text-[9px] text-gray-400 font-bold">
                                      {isFolder ? "Folder" : new Date(file.modifiedTime).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                {isFolder ? (
                                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                                ) : (
                                  <ArrowUp className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                        </>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Source Engine Type</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['link', 'file', 'drive', 'text'] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => setNewResourceType(type)}
                          className={cn(
                            "py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border",
                            newResourceType === type ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-400 border-gray-100 hover:bg-gray-50"
                          )}
                        >
                          {type === 'text' ? 'paste text' : type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    disabled={isAddingResource || ((newResourceType === 'link' || newResourceType === 'text') && !newResourceName.trim()) || (newResourceType === 'text' && !newResourceContent.trim())}
                    onClick={addResource} 
                    className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                  >
                    {isAddingResource ? 'Processing...' : 'Add to Project'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInviteTeamModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInviteTeamModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] overflow-hidden shadow-2xl border border-gray-100 p-8 sm:p-12"
            >
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Invite Collaborator</h3>
                  <button onClick={() => setShowInviteTeamModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                    <Plus className="w-6 h-6 rotate-45 text-gray-400" />
                  </button>
                </div>
                
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Email Address</label>
                  <input 
                    autoFocus
                    value={newTeamEmail}
                    onChange={(e) => {
                      setNewTeamEmail(e.target.value);
                      if (inviteError) setInviteError(null);
                    }}
                    placeholder="teammate@company.com"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />

                  {inviteError && (
                    <div className="text-xs font-bold text-red-600 mt-3 p-4 bg-red-50 rounded-2xl border border-red-100/50 leading-relaxed">
                      {inviteError}
                    </div>
                  )}

                  {inviteSuccess && (
                    <div className="text-xs font-bold text-green-700 mt-3 p-4 bg-green-50 rounded-2xl border border-green-100/50 leading-relaxed">
                      {inviteSuccess}
                    </div>
                  )}
                </div>

                {inviteLink && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Direct Invitation Link</label>
                    <div className="relative group">
                      <input 
                        readOnly 
                        value={inviteLink}
                        className="w-full bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3 text-[10px] font-mono text-indigo-900 pr-20"
                      />
                      <button 
                        onClick={() => {
                          copyToClipboard(inviteLink);
                          setInviteSuccess("Direct invite link successfully copied to clipboard.");
                        }}
                        className="absolute right-1 top-1 bottom-1 bg-white border border-indigo-200 text-indigo-600 text-[8px] font-black uppercase px-3 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider italic">
                      The invited user will see your current context when they use this link.
                    </p>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button 
                    disabled={isInvitingTeam}
                    onClick={inviteTeam} 
                    className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    {isInvitingTeam ? <RotateCcw className="w-4 h-4 animate-spin" /> : null}
                    {isInvitingTeam ? 'Sharing...' : 'Send Invitation'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 sm:p-0">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[48px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.3)] border border-white/20 p-12"
            >
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center">
                  <Share2 className="w-10 h-10 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Share Analysis</h3>
                  <p className="text-gray-500 font-medium leading-relaxed">
                    Generate a permanent link or share a structured report directly via institutional relay.
                  </p>
                </div>

                <div className="w-full space-y-8">
                  <div className="space-y-3 text-left">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Knowledge Link</label>
                    <div className="relative group">
                      <input 
                        readOnly 
                        value={shareUrl}
                        className="w-full bg-gray-50 border border-gray-100 rounded-3xl px-6 py-5 text-sm font-bold text-gray-800 pr-32 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <button 
                        onClick={() => {
                          copyToClipboard(shareUrl);
                          alert("Link copied!");
                        }}
                        className="absolute right-2 top-2 bottom-2 bg-gray-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest px-6 rounded-2xl transition-all"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="w-full h-px bg-gray-50" />

                  <div className="space-y-4 text-left">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Email Synthesis Report</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input 
                        value={shareEmail}
                        onChange={(e) => setShareEmail(e.target.value)}
                        placeholder="researcher@institutional.edu"
                        className="flex-1 bg-white border border-gray-100 rounded-3xl px-6 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                      />
                      <button 
                        disabled={isEmailSharing}
                        onClick={handleEmailShare}
                        className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white rounded-3xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
                      >
                        {isEmailSharing ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                        Share
                      </button>
                    </div>
                    <p className="text-[9px] font-bold text-gray-400 pl-1 uppercase tracking-tight">Syncs consensus narrative & verdict automatically.</p>
                  </div>
                </div>

                <button 
                  onClick={() => setShowShareModal(false)}
                  className="w-full py-5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-3xl font-black text-sm uppercase tracking-widest transition-all mt-4"
                >
                  Close Relay
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Anchor for Scroll Navigation */}
      <div id="scroll-anchor-bottom" className="w-0 h-0 pointer-events-none mt-2" />

      {/* Scroll Navigation Arrows are placed inside scroll pane to avoid clipping on mobile viewports */}
      {results && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="fixed right-5 bottom-28 sm:right-6 sm:bottom-24 flex flex-col gap-2.5 z-[9999] pointer-events-auto"
        >
          <button 
            id="scroll-btn-top"
            onClick={() => {
              const queryAnchor = document.getElementById("query-input-section");
              if (queryAnchor) {
                queryAnchor.scrollIntoView({ behavior: "smooth", block: "start" });
              } else {
                const topAnchor = document.getElementById("scroll-anchor-top");
                if (topAnchor) {
                  topAnchor.scrollIntoView({ behavior: "smooth", block: "start" });
                } else {
                  const pane = document.getElementById("main-app-scroll-pane");
                  if (pane) pane.scrollTo({ top: 0, behavior: "smooth" });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }
            }}
            className="w-10 h-10 sm:w-9 sm:h-9 bg-white/95 backdrop-blur-md border border-gray-200/85 text-gray-500 hover:text-indigo-650 hover:border-indigo-200/60 rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center cursor-pointer group relative"
            title="Scroll to Query"
          >
            <ArrowUp className="w-5 h-5 sm:w-4 sm:h-4 text-gray-500 group-hover:text-indigo-600 transition-colors" />
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900/95 backdrop-blur-sm text-white text-[8px] font-bold px-2 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none tracking-wider">To Query</span>
          </button>
          <button 
            id="scroll-btn-bottom"
            onClick={() => {
              const continueAnchor = document.getElementById("continue-analysis-section");
              if (continueAnchor) {
                continueAnchor.scrollIntoView({ behavior: "smooth", block: "start" });
              } else {
                const bottomAnchor = document.getElementById("scroll-anchor-bottom");
                if (bottomAnchor) {
                  bottomAnchor.scrollIntoView({ behavior: "smooth", block: "end" });
                } else {
                  const pane = document.getElementById("main-app-scroll-pane");
                  if (pane) pane.scrollTo({ top: pane.scrollHeight, behavior: "smooth" });
                  window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
                }
              }
            }}
            className="w-10 h-10 sm:w-9 sm:h-9 bg-white/95 backdrop-blur-md border border-gray-200/85 text-gray-500 hover:text-indigo-650 hover:border-indigo-200/60 rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center cursor-pointer group relative"
            title="Scroll to Continue Analysis"
          >
            <ArrowDown className="w-5 h-5 sm:w-4 sm:h-4 text-gray-500 group-hover:text-indigo-600 transition-colors" />
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900/95 backdrop-blur-sm text-white text-[8px] font-bold px-2 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none tracking-wider">To Continue</span>
          </button>
        </motion.div>
      )}

      {/* Global Floating Audio Player Bar */}
      <AnimatePresence>
        {ttsAudioState.status !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 left-6 z-[99999] bg-slate-900/95 text-white border border-indigo-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-xl flex items-center gap-4 max-w-sm sm:max-w-md"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
              {ttsAudioState.status === 'loading' ? (
                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
              ) : (
                <Volume2 className="w-5 h-5 text-indigo-400 animate-pulse" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30">
                  Fish Audio S2.1 Pro
                </span>
                {ttsAudioState.status === 'loading' && (
                  <span className="text-[9px] font-bold text-amber-300 animate-pulse">
                    Synthesizing...
                  </span>
                )}
              </div>
              <div className="text-xs font-bold text-white truncate mt-1">
                {ttsAudioState.title}
              </div>
              {ttsAudioState.errorMessage && (
                <div className="text-[10px] text-red-400 mt-0.5 truncate">
                  {ttsAudioState.errorMessage}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  const speakableText = getComprehensiveBriefingText(results, messages[messages.length - 1]?.content || query || "EthersFlow Multi-Agent Consensus Platform");
                  handlePlayTts(speakableText, ttsAudioState.title || "Consensus Synthesis Briefing");
                }}
                className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                title={ttsAudioState.status === 'playing' ? "Pause" : "Play"}
              >
                {ttsAudioState.status === 'playing' ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button
                onClick={handleStopTts}
                className="p-2 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white rounded-xl transition-all active:scale-95 cursor-pointer"
                title="Stop Audio"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div> {/* Closes main-app-scroll-pane */}
  </div> // Closes outer App container
  );
}
