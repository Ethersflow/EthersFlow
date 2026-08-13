import { AnalystResponse, ChatMessage, SynthesisResult } from "./services/consensusService";

export type Model = 
  | 'gemini-3.5-flash'
  | 'gemini-3.1-pro-preview'
  | 'models/gemini-2.0-flash'
  | 'models/gemini-2.0-pro-exp-02-05'
  | 'llama-3.3-70b-versatile' 
  | 'llama-3.1-8b-instant'
  | 'meta-llama/llama-3.3-70b-instruct'
  | 'openai/gpt-4o'
  | 'x-ai/grok-2'
  | 'deepseek/deepseek-chat'
  | 'anthropic/claude-3-5-sonnet'
  | 'openrouter/google/gemma-4-31b-it:free'
  | 'openrouter/openai/gpt-oss-20b:free'
  | 'openrouter/nvidia/nemotron-3-ultra-550b-a55b:free'
  | 'openrouter/nvidia/nemotron-3-super-120b-a12b:free'
  | 'openrouter/google/gemma-4-31b'
  | 'openrouter/openai/gpt-oss-20b'
  | 'openrouter/nvidia/nemotron-3-ultra-550b-a55b'
  | 'openrouter/nvidia/nemotron-3-super-120b-a12b'
  | 'auto-select'
  | 'none';

export interface AnalystSlot {
  id: string;
  name: string;
  description: string;
  model: Model;
  active: boolean;
  systemPrompt: string;
  category?: string;
}

export interface SavedAnalysis {
  id: string;
  query: string;
  timestamp: number;
  analystResponses: AnalystResponse[];
  synthesis: SynthesisResult;
  messages: ChatMessage[];
  projectId?: string;
  agents?: AnalystSlot[];
}

export type View = 'main' | 'privacy' | 'terms' | 'security' | 'about' | 'research' | 'protocol' | 'pricing' | 'careers' | 'projects' | 'project-detail' | 'customize' | 'agent-library' | 'chats' | 'tutorials' | 'courses' | 'help' | 'welcome' | 'shared' | 'contact' | 'pricing_overview' | 'pro_plan_page' | 'max_plan_page' | 'enterprise_plan_page' | 'b2b_api_portal' | 'developers' | 'api' | 'auth';

export type PlanTier = 'free' | 'pro' | 'max' | 'enterprise';

export interface ProjectResource {
  id: string;
  name: string;
  type: 'file' | 'link' | 'drive' | 'text';
  updatedAt: number;
  content?: string;
  url?: string;
}

export interface ProjectTeamMember {
  id: string;
  email: string;
  role: 'owner' | 'contributor' | 'viewer';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  updatedAt: number;
  instructions?: string;
  resources?: ProjectResource[];
  team?: ProjectTeamMember[];
  agents?: AnalystSlot[];
}

export interface AttachedFile {
  id: string;
  name: string;
  content: string;
  type: string;
  size: number;
  status: 'processing' | 'ready' | 'error';
}
