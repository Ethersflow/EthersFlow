import React, { useState } from 'react';
import { Logo } from './Logo';
import { Mail, Globe, MapPin, Send, AlertCircle, CheckCircle, ArrowLeft, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';

interface ContactPageProps {
  onClose: () => void;
}

export function ContactPage({ onClose }: ContactPageProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    topic: "Protected Workflow",
    company: "",
    workflowType: "Tool Execution & Agentic Actions",
    deploymentMode: "API Gateway & MCP Server",
    actionVolume: "10,000 - 100,000 / month",
    regulatedEnv: "SOC 2 / Enterprise Security",
    message: ""
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit contact message");
      }

      setSuccess(true);
      setFormData({
        name: "",
        email: "",
        topic: "Protected Workflow",
        company: "",
        workflowType: "Tool Execution & Agentic Actions",
        deploymentMode: "API Gateway & MCP Server",
        actionVolume: "10,000 - 100,000 / month",
        regulatedEnv: "SOC 2 / Enterprise Security",
        message: ""
      });
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#F9F8F6] text-[#1d1d1f] font-sans relative overflow-hidden"
    >
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 sm:py-24">
        {/* Navigation */}
        <button 
          onClick={onClose}
          className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#86868b] hover:text-[#1d1d1f] transition-all mb-16 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Return to EthersFlow
        </button>

        {/* Hero */}
        <div className="max-w-2xl mb-16">
          <h1 className="text-5xl sm:text-6xl font-sans font-black tracking-tight uppercase leading-[0.95] mb-6">
            Get in touch <br />
            <span className="text-indigo-600">with EthersFlow.</span>
          </h1>
          <p className="text-lg sm:text-xl font-bold text-gray-700 leading-relaxed max-w-2xl">
            Discuss a protected workflow, API/MCP integration, or enterprise deployment with our engineering team.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Left Column: Coordinates & Channels */}
          <div className="lg:col-span-5 space-y-10">
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#86868b] mb-6">// CHANNELS</h3>
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm flex items-start gap-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-1">Direct Correspondence</h4>
                    <p className="text-sm font-black text-gray-950">
                      <a href="mailto:ethersflow.dev@gmail.com" className="hover:text-indigo-600 transition-colors">ethersflow.dev@gmail.com</a>
                    </p>
                    <p className="text-[11px] font-bold text-gray-500 mt-1">General inquiries, feedback, and enterprise partnerships.</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#86868b] mb-6">// PHYSICAL HQ</h3>
              <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm flex items-start gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-1">EthersFlow Technologies Co.</h4>
                  <p className="text-sm font-black text-gray-950">Pittsburgh, Pennsylvania</p>
                  <p className="text-[11px] font-bold text-gray-500 mt-1">Our central office and engineering headquarters.</p>
                </div>
              </div>
            </div>

            {/* Quick path for individual Console users */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-6 border border-indigo-100 shadow-sm">
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-900 mb-1">Looking to use the Console?</h4>
              <p className="text-xs text-gray-600 font-medium leading-relaxed mb-4">
                You can run multi-perspective reviews and adversarial evaluations directly in your browser without contacting sales.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                Start a Review in Console →
              </button>
            </div>
          </div>

          {/* Right Column: Interactive Correspondence Form */}
          <div className="lg:col-span-7 bg-white border border-gray-150 rounded-[36px] p-8 sm:p-10 shadow-sm relative">
            <div className="mb-8">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-700 mb-2">// WORKFLOW INQUIRY</h3>
              <h2 className="text-3xl font-sans font-black uppercase text-gray-950">Discuss a Protected Workflow</h2>
              <p className="text-xs font-semibold text-gray-550 leading-relaxed mt-2">
                Provide details about your review workflow, AI application, or agent architecture. Messages route directly to our deployment desk.
              </p>
            </div>

            {success ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-50 border border-emerald-150 rounded-2xl p-8 text-center"
              >
                <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-4 animate-pulse" />
                <h4 className="text-lg font-black text-emerald-950 uppercase">Inquiry Received</h4>
                <p className="text-xs font-bold text-emerald-700/80 leading-relaxed mt-2 max-w-sm mx-auto">
                  Thank you! Your inquiry has been securely routed. A member of our engineering team will follow up shortly.
                </p>
                <button 
                  onClick={() => setSuccess(false)}
                  className="mt-6 text-xs text-indigo-600 font-bold uppercase tracking-wider hover:underline cursor-pointer"
                >
                  Send another inquiry
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-700 uppercase tracking-widest mb-2">Full Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Jane Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-[#fcfbfa] border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm font-bold placeholder-gray-400 outline-none transition-all text-[#1d1d1f]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-700 uppercase tracking-widest mb-2">Work Email</label>
                    <input 
                      type="email" 
                      required
                      placeholder="jane@organization.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-[#fcfbfa] border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm font-bold placeholder-gray-400 outline-none transition-all text-[#1d1d1f]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-700 uppercase tracking-widest mb-2">Company / Organization</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Acme Financial Technologies"
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      className="w-full bg-[#fcfbfa] border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm font-bold placeholder-gray-400 outline-none transition-all text-[#1d1d1f]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-700 uppercase tracking-widest mb-2">Workflow Being Protected</label>
                    <select 
                      value={formData.workflowType}
                      onChange={(e) => setFormData({...formData, workflowType: e.target.value})}
                      className="w-full bg-[#fcfbfa] border border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm font-bold outline-none cursor-pointer text-[#1d1d1f]"
                    >
                      <option value="Tool Execution & Agentic Actions">Tool Execution & Agentic Actions</option>
                      <option value="Financial Operations & Settlements">Financial Operations & Settlements</option>
                      <option value="Legal & Regulatory Evaluation">Legal & Regulatory Evaluation</option>
                      <option value="Infrastructure / DevOps Operations">Infrastructure / DevOps Operations</option>
                      <option value="Customer-Facing Agent Workflows">Customer-Facing Agent Workflows</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-700 uppercase tracking-widest mb-2">Deployment Mode</label>
                    <select 
                      value={formData.deploymentMode}
                      onChange={(e) => setFormData({...formData, deploymentMode: e.target.value})}
                      className="w-full bg-[#fcfbfa] border border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm font-bold outline-none cursor-pointer text-[#1d1d1f]"
                    >
                      <option value="API Gateway & MCP Server">API Gateway & MCP Server</option>
                      <option value="Console Only">Console Only</option>
                      <option value="Dedicated VPC / Sovereign Node">Dedicated VPC / Sovereign Node</option>
                      <option value="Combined Deployment">Combined Deployment</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-700 uppercase tracking-widest mb-2">Approximate Monthly Actions</label>
                    <select 
                      value={formData.actionVolume}
                      onChange={(e) => setFormData({...formData, actionVolume: e.target.value})}
                      className="w-full bg-[#fcfbfa] border border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm font-bold outline-none cursor-pointer text-[#1d1d1f]"
                    >
                      <option value="< 10,000 / month">&lt; 10,000 / month</option>
                      <option value="10,000 - 100,000 / month">10,000 - 100,000 / month</option>
                      <option value="100,000 - 1,000,000 / month">100,000 - 1,000,000 / month</option>
                      <option value="1,000,000+ / month">1,000,000+ / month</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-700 uppercase tracking-widest mb-2">Workflow Requirements & Questions</label>
                  <textarea 
                    required
                    rows={4}
                    placeholder="Describe your current agent architecture, verification policies, or latency / compliance needs..."
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full bg-[#fcfbfa] border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm font-bold placeholder-gray-400 outline-none transition-all text-[#1d1d1f] resize-none"
                  />
                </div>

                {error && (
                  <div className="flex gap-2 text-xs text-rose-650 bg-rose-50 border border-rose-100 p-3 rounded-xl font-bold items-start">
                    <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full uppercase text-xs tracking-widest font-black py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Routing inquiry...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Discuss a Protected Workflow
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
