import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Code, 
  Shield, 
  Terminal, 
  Zap, 
  Check, 
  Copy, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Download,
  Clock, 
  Server, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Send,
  Layers,
  Cpu,
  Activity,
  Sliders,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface B2bDeveloperPortalProps {
  userId: string;
  userEmail?: string;
}

interface ApiKeyItem {
  id: string;
  name: string;
  key: string;
  maskedKey: string;
  organization: string;
  zeroRetention: boolean;
  createdAt: string;
  lastUsedAt: string | null;
  totalRequests: number;
  status: 'active' | 'revoked';
}

interface ApiLogItem {
  id: string;
  timestamp: string;
  endpoint: string;
  model: string;
  latencyMs: number;
  alignmentScore: number;
  status: number;
  zeroRetention: boolean;
  webhookStatus: string;
  isSample?: boolean;
}

export const B2bDeveloperPortal: React.FC<B2bDeveloperPortalProps> = ({ userId, userEmail }) => {
  const [activeTab, setActiveTab] = useState<'snippets' | 'agent_verify' | 'mcp_server' | 'keys' | 'playground' | 'logs'>('snippets');
  const [snippetLang, setSnippetLang] = useState<'ts' | 'python' | 'anthropic' | 'curl' | 'verify' | 'mcp'>('ts');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Key Generation State
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyOrg, setNewKeyOrg] = useState('');
  const [newKeyZdr, setNewKeyZdr] = useState(true);
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);

  // Agent Action Gate State (/api/v1/verify)
  const [agentActionPrompt, setAgentActionPrompt] = useState('Execute $250,000 wire transfer to Vendor X based on invoice PO-8841');
  const [agentReasoningChain, setAgentReasoningChain] = useState('Invoice PO-8841 matched vendor payment record; approval threshold under $500k auto-limit.');
  const [agentCount, setAgentCount] = useState<number>(3);
  const [agentPersonaPreset, setAgentPersonaPreset] = useState<'clinical_safety' | 'financial_compliance' | 'legal_citation' | 'cybersecurity_auditor' | 'general_adversarial'>('financial_compliance');
  const [agentExecuting, setAgentExecuting] = useState(false);
  const [agentVerifyResponse, setAgentVerifyResponse] = useState<any | null>(null);

  // MCP Protocol Server State (/api/mcp)
  const [mcpMethod, setMcpMethod] = useState<'initialize' | 'tools/list' | 'tools/call'>('tools/call');
  const [mcpExecuting, setMcpExecuting] = useState(false);
  const [mcpResponse, setMcpResponse] = useState<any | null>(null);

  // Playground State
  const [playgroundPrompt, setPlaygroundPrompt] = useState('Verify compliance and identify operational risks in our automated fund transfer process.');
  const [customCouncil, setCustomCouncil] = useState<string>('["Legal Compliance Auditor", "Risk Analyst", "Pragmatic Auditor"]');
  const [slaTimeout, setSlaTimeout] = useState(8000);
  const [zeroDataRetention, setZeroDataRetention] = useState(true);
  const [useWebhook, setUseWebhook] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState('https://webhook.site/demo-ethersflow-callback');
  const [enforceJson, setEnforceJson] = useState(false);
  
  const [apiExecuting, setApiExecuting] = useState(false);
  const [apiResponse, setApiResponse] = useState<any | null>(null);

  // Logs State
  const [logs, setLogs] = useState<ApiLogItem[]>([]);

  // Execute Agent Verification Gate Call
  const handleRunAgentVerify = async () => {
    setAgentExecuting(true);
    setAgentVerifyResponse(null);
    const activeKey = generatedSecret || apiKeys.find(k => k.status === 'active')?.key || '';
    try {
      const res = await fetch('/api/v1/verify', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeKey}`
        },
        body: JSON.stringify({
          agent_action: agentActionPrompt,
          reasoning_chain: agentReasoningChain,
          agent_count: agentCount,
          persona_preset: agentPersonaPreset,
          grounding_enabled: true,
          zero_retention: true
        })
      });
      const data = await res.json();
      setAgentVerifyResponse({ status: res.status, data });
      fetchLogs();
    } catch (e: any) {
      setAgentVerifyResponse({ status: 500, error: e.message || 'Request failed' });
    } finally {
      setAgentExecuting(false);
    }
  };

  // Execute MCP Protocol Request
  const handleRunMcp = async () => {
    setMcpExecuting(true);
    setMcpResponse(null);
    const activeKey = generatedSecret || apiKeys.find(k => k.status === 'active')?.key || '';
    try {
      let bodyPayload: any = { jsonrpc: '2.0', id: 1, method: mcpMethod };
      if (mcpMethod === 'tools/call') {
        bodyPayload.params = {
          name: 'verify_agent_action',
          arguments: {
            agent_action: agentActionPrompt,
            reasoning_chain: agentReasoningChain,
            agent_count: agentCount,
            persona_preset: agentPersonaPreset
          }
        };
      }
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeKey}`
        },
        body: JSON.stringify(bodyPayload)
      });
      const data = await res.json();
      setMcpResponse({ status: res.status, data });
    } catch (e: any) {
      setMcpResponse({ status: 500, error: e.message || 'MCP Request failed' });
    } finally {
      setMcpExecuting(false);
    }
  };

  // Load API Keys
  const fetchKeys = React.useCallback(async () => {
    setLoadingKeys(true);
    try {
      const res = await fetch(`/api/v1/keys/list?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (data.keys && data.keys.length > 0) {
        setApiKeys(data.keys);
      } else {
        setApiKeys([]);
      }
    } catch (e) {
      console.error("Failed to load keys:", e);
      setApiKeys([]);
    } finally {
      setLoadingKeys(false);
    }
  }, [userId]);

  // Load Telemetry Logs
  const fetchLogs = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/keys/logs?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (Array.isArray(data.logs)) {
        setLogs(data.logs);
      } else {
        setLogs([]);
      }
    } catch (e) {
      console.error("Failed to load logs:", e);
      setLogs([]);
    }
  }, [userId]);

  useEffect(() => {
    fetchKeys();
    fetchLogs();
  }, [fetchKeys, fetchLogs]);

  // Handle Create Key
  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    try {
      const res = await fetch('/api/v1/keys/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: newKeyName,
          organization: newKeyOrg || 'Enterprise Client Org',
          zeroRetention: newKeyZdr
        })
      });
      const data = await res.json();
      if (data.success && data.key) {
        setGeneratedSecret(data.key.key);
        fetchKeys();
      }
    } catch (e) {
      console.error("Failed to create key:", e);
    }
  };

  // Handle Revoke Key
  const handleRevokeKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this API key? Applications using this key will immediately be denied access.")) return;
    try {
      await fetch('/api/v1/keys/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId, userId })
      });
      fetchKeys();
    } catch (e) {
      console.error("Failed to revoke key:", e);
    }
  };

  // Handle Execute Playground Proxy Call
  const handleRunPlayground = async () => {
    setApiExecuting(true);
    setApiResponse(null);
    const activeKey = generatedSecret || apiKeys.find(k => k.status === 'active')?.key || '';

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${activeKey}`,
        'X-EthersFlow-Review-Set': customCouncil,
        'X-EthersFlow-SLA-Timeout': String(slaTimeout),
        'X-EthersFlow-Zero-Retention': String(zeroDataRetention)
      };

      if (useWebhook && callbackUrl) {
        headers['X-EthersFlow-Callback-URL'] = callbackUrl;
      }

      const bodyPayload: any = {
        model: 'ethersflow-adversarial-consensus-v1',
        messages: [{ role: 'user', content: playgroundPrompt }],
        sla_timeout_ms: slaTimeout,
        zero_data_retention: zeroDataRetention
      };

      if (enforceJson) {
        bodyPayload.response_format = { type: 'json_object' };
      }

      if (useWebhook && callbackUrl) {
        bodyPayload.callback_url = callbackUrl;
        bodyPayload.async = true;
      }

      const res = await fetch('/v1/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload)
      });

      const data = await res.json();
      setApiResponse({ status: res.status, headers: Object.fromEntries(res.headers.entries()), data });
      fetchLogs();
    } catch (e: any) {
      setApiResponse({ status: 500, error: e.message || "Request failed" });
    } finally {
      setApiExecuting(false);
    }
  };

  // Code Snippet Templates
  const getCodeSnippet = () => {
    const keyPlaceholder = generatedSecret || (apiKeys.find(k => k.status === 'active')?.key) || 'YOUR_API_KEY';
    
    if (snippetLang === 'ts') {
      return `import OpenAI from 'openai';

// Compatible SDK Integration: Point your existing OpenAI SDK to EthersFlow Proxy
const client = new OpenAI({
  baseURL: 'https://www.ethersflow.com/v1', // or http://localhost:3000/v1
  apiKey: '${keyPlaceholder}',
  defaultHeaders: {
    'X-EthersFlow-Review-Set': '${customCouncil}', // Custom Reviewer Roles
    'X-EthersFlow-SLA-Timeout': '${slaTimeout}', // Latency Budget Ceiling (ms)
    'X-EthersFlow-Zero-Retention': '${zeroDataRetention}' // Zero Data Retention (ZDR)
  }
});

async function main() {
  const completion = await client.chat.completions.create({
    model: 'ethersflow-adversarial-consensus-v1',
    messages: [{ role: 'user', content: 'Verify compliance for automated transaction routing.' }]
  });

  console.log('Review Result:', completion.choices[0].message.content);
  console.log('Adversarial Alignment Score:', (completion as any).ethersflow_consensus_metadata.alignment_score);
}

main();`;
    }

    if (snippetLang === 'python') {
      return `from openai import OpenAI

# Compatible SDK Integration for Python Services
client = OpenAI(
    base_url="https://www.ethersflow.com/v1",
    api_key="${keyPlaceholder}",
    default_headers={
        "X-EthersFlow-Review-Set": '${customCouncil}',
        "X-EthersFlow-SLA-Timeout": "${slaTimeout}",
        "X-EthersFlow-Zero-Retention": "${zeroDataRetention}"
    }
)

response = client.chat.completions.create(
    model="ethersflow-adversarial-consensus-v1",
    messages=[
        {"role": "user", "content": "Audit risk profile for cross-border settlement payload."}
    ]
)

print("Review Result:", response.choices[0].message.content)
print("Metadata:", response.ethersflow_consensus_metadata)`;
    }

    if (snippetLang === 'anthropic') {
      return `import Anthropic from '@anthropic-ai/sdk';

// Anthropic SDK Compatible Integration (Point baseURL directly to gateway root)
const anthropic = new Anthropic({
  baseURL: 'https://www.ethersflow.com',
  apiKey: '${keyPlaceholder}',
  defaultHeaders: {
    'X-EthersFlow-Review-Set': '${customCouncil}',
    'X-EthersFlow-Zero-Retention': 'true'
  }
});

async function main() {
  const msg = await anthropic.messages.create({
    model: 'ethersflow-adversarial-consensus-v1',
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'Analyze logical consistency of financial audit model.' }]
  });

  console.log('Review Result:', msg.content[0].text);
  console.log('Consensus Metadata:', (msg as any).ethersflow_consensus_metadata);
}

main();`;
    }

    if (snippetLang === 'verify') {
      return `curl -X POST "https://www.ethersflow.com/api/v1/verify" \\
  -H "Authorization: Bearer ${keyPlaceholder}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_action": "${agentActionPrompt}",
    "reasoning_chain": "${agentReasoningChain}",
    "agent_count": ${agentCount},
    "persona_preset": "${agentPersonaPreset}",
    "grounding_enabled": true,
    "zero_retention": true
  }'`;
    }

    if (snippetLang === 'mcp') {
      return `curl -X POST "https://www.ethersflow.com/api/mcp" \\
  -H "Authorization: Bearer ${keyPlaceholder}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "verify_agent_action",
      "arguments": {
        "agent_action": "${agentActionPrompt}",
        "reasoning_chain": "${agentReasoningChain}",
        "agent_count": ${agentCount},
        "persona_preset": "${agentPersonaPreset}"
      }
    }
  }'`;
    }

    return `curl -X POST "https://www.ethersflow.com/v1/chat/completions" \\
  -H "Authorization: Bearer ${keyPlaceholder}" \\
  -H "Content-Type: application/json" \\
  -H "X-EthersFlow-Review-Set: ${customCouncil}" \\
  -H "X-EthersFlow-SLA-Timeout: ${slaTimeout}" \\
  -H "X-EthersFlow-Zero-Retention: ${zeroDataRetention}" \\
  -d '{
    "model": "ethersflow-adversarial-consensus-v1",
    "messages": [
      {"role": "user", "content": "Execute multi-analyst consensus on credit risk model."}
    ]
  }'`;
  };

  const copyToClipboard = (text: string, keyIdentifier?: string | boolean) => {
    navigator.clipboard.writeText(text);
    if (keyIdentifier) {
      const id = typeof keyIdentifier === 'string' ? keyIdentifier : text;
      setCopiedKey(id);
      setTimeout(() => setCopiedKey(null), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 font-sans text-slate-100">
      
      {/* Header Banner */}
      <div className="relative bg-[#12131a] rounded-3xl p-6 sm:p-10 text-white overflow-hidden shadow-2xl border border-slate-800">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-xs font-black uppercase tracking-widest">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>Developer Gateway & MCP Protocol</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            Put verification between your agent and its next action.
          </h1>

          <p className="text-slate-300 font-medium text-sm sm:text-base leading-relaxed">
            Add EthersFlow to an existing model workflow through a compatible API, or call the MCP server directly from an agent. Review responses, verify tool calls, preserve provenance, and route unresolved cases to a human.
          </p>

          <div className="pt-2 flex flex-wrap gap-3 text-xs font-bold">
            <span className="bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl text-indigo-300 flex items-center gap-1.5 shadow-sm">
              <Code className="w-3.5 h-3.5 text-indigo-400" /> Compatible SDK Integration
            </span>
            <span className="bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl text-emerald-300 flex items-center gap-1.5 shadow-sm">
              <Lock className="w-3.5 h-3.5 text-emerald-400" /> Zero Data Retention (ZDR)
            </span>
            <span className="bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl text-purple-300 flex items-center gap-1.5 shadow-sm">
              <Sliders className="w-3.5 h-3.5 text-purple-400" /> SLA Budget & Review Set
            </span>
            <span className="bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl text-amber-300 flex items-center gap-1.5 shadow-sm">
              <Globe className="w-3.5 h-3.5 text-amber-400" /> SSE Streaming & Webhooks
            </span>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-slate-800 overflow-x-auto no-scrollbar gap-2 sm:gap-6">
        {[
          { id: 'snippets', label: 'Compatible SDK Integration', icon: Code },
          { id: 'agent_verify', label: 'Agent Action Gate (/verify)', icon: Shield },
          { id: 'mcp_server', label: 'MCP Protocol Server (/mcp)', icon: Server },
          { id: 'keys', label: 'API Keys & Vault', icon: Key },
          { id: 'playground', label: 'Interactive API Sandbox', icon: Terminal },
          { id: 'logs', label: 'Request log', icon: Activity }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3.5 px-4 text-xs sm:text-sm font-black transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                isActive 
                  ? 'border-indigo-400 text-indigo-300 font-extrabold' 
                  : 'border-transparent text-slate-400 hover:text-slate-100 hover:border-slate-700'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Code Snippets & Integration */}
      {activeTab === 'snippets' && (
        <div className="space-y-6">
          <div className="bg-[#12131a] rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  Seamless SDK Handshake
                </h3>
                <p className="text-xs sm:text-sm font-medium text-slate-400 mt-1">
                  Zero codebase rewriting required. Simply set <code className="bg-indigo-950 text-indigo-300 border border-indigo-800/60 px-2 py-0.5 rounded font-mono text-xs">baseURL: "https://www.ethersflow.com/v1"</code> in your existing client SDK.
                </p>
              </div>

              {/* Language Switcher */}
              <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs font-bold self-stretch sm:self-auto flex-wrap">
                {[
                  { id: 'ts', label: 'TypeScript' },
                  { id: 'python', label: 'Python' },
                  { id: 'anthropic', label: 'Anthropic SDK' },
                  { id: 'curl', label: 'cURL / REST' },
                  { id: 'verify', label: 'Agent Verify API' },
                  { id: 'mcp', label: 'MCP Server JSON-RPC' }
                ].map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => setSnippetLang(lang.id as any)}
                    className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      snippetLang === lang.id ? 'bg-indigo-600 text-white shadow-md font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Block Container */}
            <div className="relative rounded-2xl bg-slate-950 p-4 sm:p-6 text-slate-100 font-mono text-xs leading-relaxed overflow-x-auto shadow-2xl border border-slate-800">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-[11px] font-sans font-bold text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 font-mono text-indigo-300">{snippetLang.toUpperCase()} SDK Drop-In Snippet</span>
                </div>
                <button
                  onClick={() => copyToClipboard(getCodeSnippet())}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-1.5 rounded-xl text-[11px] font-sans font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-300" />}
                  <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="whitespace-pre-wrap text-slate-100 font-mono text-xs leading-relaxed">{getCodeSnippet()}</pre>
            </div>

            {/* Architecture Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
                  <Cpu className="w-5 h-5" />
                </div>
                <h4 className="font-black text-sm text-white">Configurable Reviewer Roles</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Pass custom reviewer roles in request headers (<code className="text-indigo-300 font-mono">X-EthersFlow-Review-Set</code>) to deploy specialized domain perspectives tailored to your specific application requirements.
                </p>
              </div>

              <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                  <Shield className="w-5 h-5" />
                </div>
                <h4 className="font-black text-sm text-white">Zero Data Retention (ZDR)</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Client prompts undergo automatic local PII/PHI scrubbing before passing to underlying model providers. Prompts are never cached or used for model training.
                </p>
              </div>

              <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <h4 className="font-black text-sm text-white">SLA & Webhook Async Mode</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Specify SLA latency ceilings in request headers or submit queries with a <code className="text-purple-300 font-mono">callback_url</code> for deep asynchronous multi-round background audits.
                </p>
              </div>
            </div>

            {/* Phase 2 Developer Assets & Distribution Specs */}
            <div className="pt-4 border-t border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
                    <Download className="w-4 h-4 text-indigo-400" />
                    <span>Distribution & Integration Specification Assets (Phase 2)</span>
                  </h4>
                  <p className="text-xs text-slate-400">Download canonical OpenAPI specs, MCP manifests, and SDK integration wrappers.</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-[10px] font-black uppercase">
                  Open Standards
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <a
                  href="/openapi.json"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 bg-slate-900 hover:bg-slate-850 rounded-2xl border border-slate-800 flex items-center justify-between text-xs transition-all hover:border-indigo-500/50"
                >
                  <div className="space-y-0.5">
                    <div className="font-black text-white">OpenAPI 3.0 Spec</div>
                    <div className="text-[10px] text-slate-400 font-mono">/openapi.json</div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-indigo-400 shrink-0" />
                </a>

                <a
                  href="/mcp_manifest.json"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 bg-slate-900 hover:bg-slate-850 rounded-2xl border border-slate-800 flex items-center justify-between text-xs transition-all hover:border-purple-500/50"
                >
                  <div className="space-y-0.5">
                    <div className="font-black text-white">MCP Registry Manifest</div>
                    <div className="text-[10px] text-slate-400 font-mono">/mcp_manifest.json</div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-purple-400 shrink-0" />
                </a>

                <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="font-black text-white">Python Standard SDK</div>
                    <div className="text-[10px] text-emerald-400 font-mono">pip install openai requests</div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[9px] font-black uppercase">Standard SDK</span>
                </div>

                <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="font-black text-white">TypeScript Standard SDK</div>
                    <div className="text-[10px] text-indigo-400 font-mono">npm i openai @anthropic-ai/sdk</div>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-[9px] font-black uppercase">Standard SDK</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Agent Action Verification Gate (/api/v1/verify) */}
      {activeTab === 'agent_verify' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Controls Panel */}
          <div className="lg:col-span-5 bg-[#12131a] rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white tracking-tight">Agent Action Gate Tester</h3>
                <p className="text-xs font-medium text-slate-400">Endpoint: <code className="text-indigo-400 font-mono">POST /api/v1/verify</code></p>
              </div>
              <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-[10px] font-black uppercase">
                Agentic Gate
              </span>
            </div>

            {/* Proposed Agent Action */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-300 uppercase tracking-wider">Proposed Agent Action</label>
              <textarea
                rows={3}
                value={agentActionPrompt}
                onChange={(e) => setAgentActionPrompt(e.target.value)}
                placeholder="e.g. Execute $250,000 wire transfer to Vendor X"
                className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-700 text-xs font-medium text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Reasoning Chain */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-300 uppercase tracking-wider">Agent Reasoning Chain</label>
              <textarea
                rows={3}
                value={agentReasoningChain}
                onChange={(e) => setAgentReasoningChain(e.target.value)}
                placeholder="e.g. Invoice PO-8841 matched vendor payment record"
                className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Persona Preset */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-300 uppercase tracking-wider">Industry Audit Persona Preset</label>
              <select
                value={agentPersonaPreset}
                onChange={(e) => setAgentPersonaPreset(e.target.value as any)}
                className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-700 text-xs font-bold text-indigo-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="financial_compliance">FinServ Compliance (FINRA / SEC / SR 11-7)</option>
                <option value="clinical_safety">Clinical Safety (HIPAA / FDA / Pharmacology)</option>
                <option value="legal_citation">Legal & Citation (Sanctions / Statutory Check)</option>
                <option value="cybersecurity_auditor">Cybersecurity Auditor (Zero-Trust / IAM)</option>
                <option value="general_adversarial">General Adversarial (Pragmatist / Skeptic / Red Team)</option>
              </select>
            </div>

            {/* Agent Audit Node Count */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-black text-slate-300">
                <span>Adversarial Audit Nodes (Agent Count)</span>
                <span className="text-indigo-400 font-mono font-bold">{agentCount} Agents</span>
              </div>
              <input
                type="range"
                min={2}
                max={7}
                step={1}
                value={agentCount}
                onChange={(e) => setAgentCount(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>2 (Light)</span>
                <span>3 (Standard)</span>
                <span>5 (Deep)</span>
                <span>7 (Exhaustive)</span>
              </div>
            </div>

            {/* Execute Button */}
            <button
              onClick={handleRunAgentVerify}
              disabled={agentExecuting}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-lg shadow-indigo-900/40 text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {agentExecuting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Auditing Agent Decision Chain...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Verify Agent Action (/api/v1/verify)</span>
                </>
              )}
            </button>
          </div>

          {/* Response & Debate Viewer */}
          <div className="lg:col-span-7 bg-slate-950 rounded-3xl p-6 text-slate-200 border border-slate-800 font-mono text-xs space-y-4 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Agent Action Verification Verdict</span>
                </span>
                {agentVerifyResponse && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    agentVerifyResponse.data?.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    agentVerifyResponse.data?.status === 'FLAGGED_HUMAN_REVIEW' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {agentVerifyResponse.data?.status || 'RESPONSE_OK'}
                  </span>
                )}
              </div>

              {!agentVerifyResponse ? (
                <div className="py-20 text-center text-slate-500 font-sans text-xs space-y-3">
                  <Shield className="w-10 h-10 text-slate-700 mx-auto" />
                  <p className="font-bold text-slate-300">Ready to Gate Proposed Agent Action</p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Configure your agent's proposed action and reasoning chain on the left, then click "Verify Agent Action" to test multi-agent adversarial cross-examination.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 overflow-x-auto font-sans">
                  {/* Verdict Card */}
                  <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase font-black text-indigo-400 tracking-wider">Consensus Alignment Metric</span>
                      <span className="text-xs font-mono font-bold text-slate-400">Latency: {agentVerifyResponse.data?.latency_ms} ms</span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-400 uppercase font-black">Consensus Score</div>
                        <div className="text-xl font-black text-emerald-400 font-mono mt-1">
                          {agentVerifyResponse.data?.consensus_score}%
                        </div>
                      </div>

                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-400 uppercase font-black">Calculated Risk Index</div>
                        <div className="text-xl font-black text-amber-400 font-mono mt-1">
                          {agentVerifyResponse.data?.risk_index}%
                        </div>
                      </div>

                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-400 uppercase font-black">Data Retention</div>
                        <div className="text-sm font-black text-emerald-400 font-mono mt-2">
                          ZERO (ZDR)
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 text-xs text-slate-300 font-medium leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                      <strong className="text-indigo-300 block mb-1">Verdict Summary:</strong>
                      {agentVerifyResponse.data?.verdict_summary}
                    </div>
                  </div>

                  {/* Adversarial Debate Transcript — Flagship Distinguishing Feature */}
                  {agentVerifyResponse.data?.adversarial_debate && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 p-3 rounded-2xl border border-indigo-500/30">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-indigo-500/20 rounded-lg border border-indigo-400/30">
                            <Shield className="w-4 h-4 text-indigo-400" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black uppercase text-white tracking-wider">
                              Adversarial Debate Transcript ({agentVerifyResponse.data.adversarial_debate.length} Audit Nodes)
                            </h4>
                            <p className="text-[10px] text-slate-400 font-sans">
                              Models cross-examining proposed action & exposing reasoning flaws
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                          Live Debate Verified
                        </span>
                      </div>

                      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                        {agentVerifyResponse.data.adversarial_debate.map((debateItem: any, idx: number) => (
                          <div key={idx} className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs space-y-1.5 hover:border-indigo-500/40 transition-all">
                            <div className="flex items-center justify-between font-bold text-indigo-300">
                              <span className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700 flex items-center justify-center text-[10px] font-mono">
                                  {idx + 1}
                                </span>
                                <span>{debateItem.role}</span>
                              </span>
                              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold ${
                                debateItem.node_status === 'ALIGNED' 
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}>
                                {debateItem.node_status}
                              </span>
                            </div>
                            <p className="text-slate-200 text-[11px] leading-relaxed font-sans pl-7">
                              {debateItem.perspective}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="text-[11px] font-sans text-slate-500 border-t border-slate-900 pt-3 flex items-center justify-between">
              <span>Gate Endpoint: <code className="text-indigo-400 font-mono">POST /api/v1/verify</code></span>
              <span>Zero Data Retention Enforced</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Model Context Protocol Server (/api/mcp) */}
      {activeTab === 'mcp_server' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Controls Panel */}
          <div className="lg:col-span-5 bg-[#12131a] rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white tracking-tight">MCP Protocol Server Tester</h3>
                <p className="text-xs font-medium text-slate-400">Endpoint: <code className="text-purple-400 font-mono">POST /api/mcp</code></p>
              </div>
              <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-xl text-[10px] font-black uppercase">
                MCP JSON-RPC 2.0
              </span>
            </div>

            {/* MCP Method Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-300 uppercase tracking-wider">MCP Protocol Method</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'initialize', label: 'initialize' },
                  { id: 'tools/list', label: 'tools/list' },
                  { id: 'tools/call', label: 'tools/call' }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMcpMethod(m.id as any)}
                    className={`py-2 px-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                      mcpMethod === m.id 
                        ? 'bg-purple-600 border-purple-500 text-white font-black shadow' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Tool Details */}
            {mcpMethod === 'tools/call' && (
              <div className="space-y-3 p-4 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-black text-purple-300 uppercase tracking-wider text-[10px]">Tool to Invoke</span>
                  <code className="text-emerald-400 font-mono font-bold">verify_agent_action</code>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Agent Action</label>
                  <input
                    type="text"
                    value={agentActionPrompt}
                    onChange={(e) => setAgentActionPrompt(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Persona Preset</label>
                  <select
                    value={agentPersonaPreset}
                    onChange={(e) => setAgentPersonaPreset(e.target.value as any)}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-indigo-300"
                  >
                    <option value="financial_compliance">financial_compliance</option>
                    <option value="clinical_safety">clinical_safety</option>
                    <option value="legal_citation">legal_citation</option>
                    <option value="cybersecurity_auditor">cybersecurity_auditor</option>
                    <option value="general_adversarial">general_adversarial</option>
                  </select>
                </div>
              </div>
            )}

            {/* Execute Button */}
            <button
              onClick={handleRunMcp}
              disabled={mcpExecuting}
              className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-2xl shadow-lg shadow-purple-900/40 text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {mcpExecuting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Processing MCP Request...</span>
                </>
              ) : (
                <>
                  <Server className="w-4 h-4 text-purple-300" />
                  <span>Dispatch MCP Request ({mcpMethod})</span>
                </>
              )}
            </button>
          </div>

          {/* Response Viewer */}
          <div className="lg:col-span-7 bg-slate-950 rounded-3xl p-6 text-slate-200 border border-slate-800 font-mono text-xs space-y-4 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Server className="w-4 h-4 text-purple-400" />
                  <span>MCP Server Response (JSON-RPC 2.0)</span>
                </span>
                {mcpResponse && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    HTTP {mcpResponse.status}
                  </span>
                )}
              </div>

              {!mcpResponse ? (
                <div className="py-20 text-center text-slate-500 font-sans text-xs space-y-3">
                  <Server className="w-10 h-10 text-slate-700 mx-auto" />
                  <p className="font-bold text-slate-300">Model Context Protocol Endpoint Ready</p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Any agent on LangChain, CrewAI, AutoGPT, Google A2A, or Cloudflare Workers can plug in EthersFlow as an MCP server tool.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800">
                  <div className="text-[10px] uppercase tracking-wider text-purple-400 font-bold mb-2">Raw JSON-RPC Response</div>
                  <pre className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto font-mono">
                    {JSON.stringify(mcpResponse.data || mcpResponse, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="text-[11px] font-sans text-slate-500 border-t border-slate-900 pt-3 flex items-center justify-between">
              <span>MCP Protocol: <code className="text-purple-400 font-mono">2024-11-05</code></span>
              <span>Supported Tools: <code className="text-emerald-400 font-mono">verify_agent_action</code></span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: API Keys Vault */}
      {activeTab === 'keys' && (
        <div className="space-y-6">
          <div className="bg-[#12131a] rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  Tenant API Keys Vault
                </h3>
                <p className="text-xs sm:text-sm font-medium text-slate-400 mt-1">
                  Manage cryptographically isolated API keys (<code className="text-indigo-400 font-mono">ef_live_...</code>) for your organization's backend microservices.
                </p>
              </div>

              <button
                onClick={() => {
                  setNewKeyName('');
                  setNewKeyOrg('');
                  setGeneratedSecret(null);
                  setShowNewKeyModal(true);
                }}
                className="py-3 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl flex items-center gap-2 shadow-lg shadow-indigo-900/40 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Live API Key</span>
              </button>
            </div>

            {/* Keys Table */}
            {loadingKeys ? (
              <div className="p-8 text-center text-slate-400 font-bold text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Loading API Keys...</span>
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="p-10 border-2 border-dashed border-slate-800 rounded-2xl text-center space-y-3">
                <Key className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-black text-slate-200">No B2B API Keys Generated Yet</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">
                  Create a live key above to start proxying queries through EthersFlow's adversarial consensus engine.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-900/50">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-black uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Key Name</th>
                      <th className="py-3 px-4">API Key Token</th>
                      <th className="py-3 px-4">Organization</th>
                      <th className="py-3 px-4">Security Mode</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-medium text-slate-200">
                    {apiKeys.map((key) => (
                      <tr key={key.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">
                          {key.name}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-400 flex items-center gap-2">
                          <span>{key.maskedKey}</span>
                          <button
                            onClick={() => copyToClipboard(key.maskedKey, key.id)}
                            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer"
                            title="Copy key token"
                          >
                            {copiedKey === key.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-bold">
                          {key.organization}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <Shield className="w-3 h-3 text-emerald-400" /> ZDR Enforced
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {key.status === 'active' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Active
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-red-400">
                              Revoked
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {key.status === 'active' && (
                            <button
                              onClick={() => handleRevokeKey(key.id)}
                              className="text-red-400 hover:text-red-300 font-bold text-[11px] hover:underline cursor-pointer"
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Interactive Sandbox / API Tester */}
      {activeTab === 'playground' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Controls Panel */}
          <div className="lg:col-span-5 bg-[#12131a] rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white tracking-tight">API Proxy Configuration</h3>
              <p className="text-xs font-medium text-slate-400">Test parameters sent in request headers and body payload.</p>
            </div>

            {/* Prompt */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-300 uppercase tracking-wider">Test Prompt Directive</label>
              <textarea
                rows={4}
                value={playgroundPrompt}
                onChange={(e) => setPlaygroundPrompt(e.target.value)}
                className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-700 text-xs font-medium text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Custom Council Roster Header */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Custom Council Header</span>
                <span className="text-[10px] text-indigo-400 font-mono">X-EthersFlow-Council</span>
              </label>
              <input
                type="text"
                value={customCouncil}
                onChange={(e) => setCustomCouncil(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-indigo-300 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* SLA Timeout Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-black text-slate-300">
                <span>SLA Latency Budget</span>
                <span className="text-indigo-400 font-mono">{slaTimeout} ms</span>
              </div>
              <input
                type="range"
                min={2000}
                max={30000}
                step={1000}
                value={slaTimeout}
                onChange={(e) => setSlaTimeout(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Security & Webhook Toggles */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={zeroDataRetention}
                  onChange={(e) => setZeroDataRetention(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div className="text-xs">
                  <p className="font-bold text-white">Zero Data Retention (ZDR)</p>
                  <p className="text-slate-400 text-[11px]">Mask PII/PHI locally before transmitting to vendor models.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useWebhook}
                  onChange={(e) => setUseWebhook(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div className="text-xs">
                  <p className="font-bold text-white">Asynchronous Webhook Callback</p>
                  <p className="text-slate-400 text-[11px]">Return 202 Accepted and post result to callback endpoint.</p>
                </div>
              </label>

              {useWebhook && (
                <div className="space-y-1 pl-6">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Callback Endpoint URL</label>
                  <input
                    type="text"
                    value={callbackUrl}
                    onChange={(e) => setCallbackUrl(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200"
                  />
                </div>
              )}
            </div>

            {/* Execute Button */}
            <button
              onClick={handleRunPlayground}
              disabled={apiExecuting}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-lg shadow-indigo-900/40 text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {apiExecuting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Executing Adversarial Consensus...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Execute Proxy Request (/v1/chat/completions)</span>
                </>
              )}
            </button>
          </div>

          {/* Response Viewer */}
          <div className="lg:col-span-7 bg-slate-950 rounded-3xl p-6 text-slate-200 border border-slate-800 font-mono text-xs space-y-4 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  <span>API Response Payload</span>
                </span>
                {apiResponse && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    apiResponse.status === 200 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : apiResponse.status === 202
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    HTTP {apiResponse.status}
                  </span>
                )}
              </div>

              {!apiResponse ? (
                <div className="py-20 text-center text-slate-500 font-sans text-xs space-y-2">
                  <Server className="w-8 h-8 text-slate-700 mx-auto" />
                  <p className="font-bold text-slate-300">Ready to Dispatch Proxy Query</p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    Click "Execute Proxy Request" to send a query through the drop-in consensus layer and inspect the returned payload.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 overflow-x-auto">
                  {apiResponse.data?.ethersflow_consensus_metadata ? (
                    <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                      <div className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold">Consensus Metadata Highlights</div>
                      <div className="grid grid-cols-2 gap-3 text-slate-300 font-sans text-xs">
                        <div>
                          <span className="text-slate-500">Alignment Score:</span>{' '}
                          <strong className="text-emerald-400 font-mono font-bold">
                            {apiResponse.data.ethersflow_consensus_metadata.alignment_score}%
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Execution Latency:</span>{' '}
                          <strong className="text-purple-400 font-mono font-bold">
                            {apiResponse.data.ethersflow_consensus_metadata.sla_latency_ms} ms
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Consensus Verdict:</span>{' '}
                          <strong className="text-indigo-300 font-mono font-bold">
                            {apiResponse.data.ethersflow_consensus_metadata.verdict}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-500 font-sans">Zero Data Retention:</span>{' '}
                          <strong className="text-emerald-400 font-mono font-bold">
                            {apiResponse.data.ethersflow_consensus_metadata.zero_data_retention ? 'ENFORCED' : 'OFF'}
                          </strong>
                        </div>
                      </div>
                    </div>
                  ) : apiResponse.status === 202 ? (
                    <div className="bg-slate-900/90 p-4 rounded-2xl border border-blue-500/30 space-y-2">
                      <div className="text-[10px] uppercase tracking-wider text-blue-400 font-bold">Async Verification Dispatched (HTTP 202)</div>
                      <p className="text-xs text-slate-300 font-sans">
                        Task ID: <code className="text-indigo-300 font-mono">{apiResponse.data?.id}</code>. Request queued for asynchronous consensus synthesis.
                      </p>
                    </div>
                  ) : apiResponse.status >= 400 || apiResponse.error ? (
                    <div className="bg-red-950/40 p-4 rounded-2xl border border-red-500/40 space-y-2">
                      <div className="text-[10px] uppercase tracking-wider text-red-400 font-bold">Request Error (HTTP {apiResponse.status})</div>
                      <p className="text-xs text-red-300 font-mono">
                        {apiResponse.data?.error?.message || apiResponse.data?.message || apiResponse.error || "Authentication or request validation failed."}
                      </p>
                    </div>
                  ) : null}

                  <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">Raw JSON Response</div>
                    <pre className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                      {JSON.stringify(apiResponse.data || apiResponse, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="text-[11px] font-sans text-slate-500 border-t border-slate-900 pt-3 flex items-center justify-between">
              <span>Endpoint: <code className="text-indigo-400">POST /v1/chat/completions</code></span>
              <span>EthersFlow Proxy Active</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Request log */}
      {activeTab === 'logs' && (
        <div className="bg-[#12131a] rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white tracking-tight">Request log</h3>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-black uppercase">
                  Live
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-400 mt-1">
                Real-time audit record of proxy calls, alignment scores, and webhook delivery status.
              </p>
            </div>

            <button
              onClick={fetchLogs}
              className="p-2.5 hover:bg-slate-800 rounded-xl text-slate-300 transition-colors cursor-pointer border border-slate-700"
              title="Refresh Logs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
              <Activity className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-400">
                No calls yet — your first verified action will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-900/50">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-black uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Endpoint</th>
                    <th className="py-3 px-4">Model</th>
                    <th className="py-3 px-4">Latency</th>
                    <th className="py-3 px-4">Alignment Score</th>
                    <th className="py-3 px-4">ZDR Status</th>
                    <th className="py-3 px-4">Webhook Delivery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-medium text-slate-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">
                        <div className="flex items-center gap-2">
                          <span>{log.endpoint}</span>
                          {log.isSample && (
                            <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded text-[9px] font-mono font-normal">
                              Sample
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">
                        {log.model}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-purple-400 font-bold">
                        {log.latencyMs} ms
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        {log.alignmentScore}%
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                          <Lock className="w-2.5 h-2.5 text-emerald-400" /> Sanitized
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-xs">
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-black text-indigo-300 bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                          <CheckCircle2 className="w-3 h-3 text-indigo-400" /> {log.webhookStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* New Key Creation Modal */}
      <AnimatePresence>
        {showNewKeyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-[#12131a] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-800 space-y-6 text-slate-100"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-white font-black text-lg">
                  <Key className="w-5 h-5 text-indigo-400" />
                  <span>Generate B2B Live API Key</span>
                </div>
                <button
                  onClick={() => setShowNewKeyModal(false)}
                  className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {!generatedSecret ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-300 uppercase tracking-wider">Key Label / Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Production Risk Engine Proxy"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-300 uppercase tracking-wider">Organization / Tenant Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Acme AI Solutions"
                      value={newKeyOrg}
                      onChange={(e) => setNewKeyOrg(e.target.value)}
                      className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newKeyZdr}
                      onChange={(e) => setNewKeyZdr(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-white">Enforce Zero Data Retention (ZDR)</p>
                      <p className="text-slate-400 text-[11px]">Automatically strip PII/PHI on all calls originating from this key.</p>
                    </div>
                  </label>

                  <button
                    onClick={handleCreateKey}
                    disabled={!newKeyName.trim()}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-900/40 transition-all cursor-pointer disabled:opacity-50"
                  >
                    Generate Secret Key Token
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-500/10 text-amber-200 border border-amber-500/30 rounded-2xl text-xs space-y-1 font-medium">
                    <p className="font-bold flex items-center gap-1.5 text-amber-300">
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                      <span>Save Your API Key Secret Now</span>
                    </p>
                    <p className="text-amber-200/90">
                      For security reasons, this key will not be shown again in full. Copy and store it securely in your application environment.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-950 text-slate-200 font-mono text-xs rounded-2xl border border-slate-800 flex items-center justify-between break-all">
                    <span>{generatedSecret}</span>
                    <button
                      onClick={() => copyToClipboard(generatedSecret, 'secret')}
                      className="ml-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-white text-xs font-sans font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedKey === 'secret' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'secret' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setShowNewKeyModal(false)}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
