import React, { useState } from 'react';
import { Logo } from './Logo';
import { Briefcase, MapPin, Building, Calendar, ArrowLeft, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface CareersPageProps {
  onClose: () => void;
}

const OPEN_ROLES = [
  {
    id: "dist-consensus-eng",
    title: "Senior Distributed Consensus Engineer",
    department: "Reasoning Architecture",
    location: "US Hybrid (Pittsburgh)",
    type: "Full-Time (FAC-H)",
    description: "Design federated arbitration pipelines and optimize structural weights across asynchronous multi-agent logical queries.",
    requirements: [
      "5+ years of experience with distributed systems, low-latency microservices, and system-level TypeScript/Node.js or Rust.",
      "In-depth research experience in game theory, proof mechanisms, or multi-agent validation protocols.",
      "Obsessive focus on logical execution limits and memory boundaries."
    ]
  },
  {
    id: "red-team-analyst",
    title: "Red-Team AI Adversarial Analyst",
    department: "Vulnerability & Hallucination Labs",
    location: "Remote (Pittsburgh)",
    type: "Contract or Full-time",
    description: "Build robust, automated red-teaming mechanisms to intentionally probe and break logic safety frameworks inside integrated LLM APIs.",
    requirements: [
      "Demonstrate structured cognitive probing methodologies, prompt hacking, and logical deduction tracking.",
      "Background in natural language processing (NLP), cognitive sciences, or software penetration testing.",
      "Proven ability to systematize un-structured LLM output failures into reproducible benchmarks."
    ]
  },
  {
    id: "verification-crypto",
    title: "Cryptography & Integrity Architect",
    department: "Sovereign Engineering",
    location: "US Hybrid (Pittsburgh) or Remote",
    type: "Full-Time (Sovereignty Clause)",
    description: "Pioneer end-to-end client-side data sanitization vaults and secure on-device proxy tunnels safeguarding institutional context repositories.",
    requirements: [
      "Extensive background in asymmetric encryption algorithms, TLS 1.3 proxy tunneling, and zero-knowledge logic representation.",
      "Experience auditing Web2 or Web3 privacy architectures for fin-tech or regulatory agency endpoints.",
      "Active commitment to zero-data-retention engineering best practices."
    ]
  }
];

export function CareersPage({ onClose }: CareersPageProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: OPEN_ROLES[0].title,
    portfolio: "",
    coverLetter: ""
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      const response = await fetch('/api/careers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit application");
      }

      setSuccess(formData.name);
      setFormData({
        name: "",
        email: "",
        role: OPEN_ROLES[0].title,
        portfolio: "",
        coverLetter: ""
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
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 sm:py-24">
        {/* Navigation */}
        <button 
          onClick={onClose}
          className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#86868b] hover:text-[#1d1d1f] transition-all mb-16 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Terminal
        </button>

        {/* Hero */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 mb-6">
            <span className="w-2 h-2 rounded-full bg-indigo-650 animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-black text-indigo-700">Joint Forces Pipeline</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-sans font-black tracking-tight uppercase leading-[0.95] mb-8">
            Build the architecture <br />
            <span className="text-indigo-600">of synthetic truth.</span>
          </h1>
          <p className="text-lg sm:text-xl font-bold text-gray-700 leading-relaxed max-w-2xl">
            We are looking for individuals obsessed with mathematical precision, adversarial game theory, and building the safeguards that keep neural intelligence aligned and accurate.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Left Column: Roles Info & Contacts */}
          <div className="lg:col-span-7 space-y-12">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 mb-2">// CURRENT ROLES</h3>
              <h2 className="text-3xl font-sans font-black uppercase text-gray-900">Open Positions</h2>
            </div>

            <div className="space-y-8">
              {OPEN_ROLES.map((role) => (
                <div 
                  key={role.id}
                  className="bg-white rounded-[24px] p-8 border border-gray-150 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md">
                      {role.department}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {role.location}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 px-2.5 py-1 rounded-md">
                      {role.type}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-gray-950 group-hover:text-indigo-600 transition-colors mb-4">
                    {role.title}
                  </h3>
                  
                  <p className="text-sm text-gray-550 leading-relaxed font-semibold mb-6">
                    {role.description}
                  </p>

                  <div className="border-t border-gray-100 pt-5 space-y-3">
                    <h5 className="text-[11px] font-black uppercase text-gray-400 tracking-wider">Candidate Requirements:</h5>
                    <ul className="text-xs font-bold text-gray-600 space-y-2 list-disc list-inside">
                      {role.requirements.map((req, idx) => (
                        <li key={idx} className="leading-relaxed">{req}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* Direct Contact Info */}
            <div className="bg-[#1d1d1f] text-white rounded-[32px] p-8 sm:p-10 border border-gray-800">
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400 mb-4">// GENERAL INQUIRIES & FELLOWSHIPS</h4>
              <h3 className="text-2xl font-sans font-black uppercase mb-4">Have a custom research proposal?</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-8 font-semibold">
                If you are a graduate researcher or independent specialist addressing LLM validation, consensus networks, or neural probing mechanisms, we offer independent funding grants and collaborative fellowships.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 border-t border-gray-810 pt-6">
                <div>
                  <span className="text-[9px] font-black uppercase text-gray-550 block tracking-widest mb-1">Human Resources Desk</span>
                  <a href="mailto:careers@ethersflow.com" className="text-sm font-black text-indigo-300 hover:text-white transition-colors">careers@ethersflow.com</a>
                </div>
                <div className="sm:border-l border-gray-810 sm:pl-6">
                  <span className="text-[9px] font-black uppercase text-gray-550 block tracking-widest mb-1">Architecture Inbox</span>
                  <a href="mailto:ethersflow.dev@gmail.com" className="text-sm font-black text-indigo-300 hover:text-white transition-colors">ethersflow.dev@gmail.com</a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Careers application Form */}
          <div className="lg:col-span-5 bg-white border border-gray-150 rounded-[36px] p-8 sm:p-10 shadow-sm relative">
            <div className="mb-8">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-605 mb-2">// SECURE RETRIEVAL PIPELINE</h3>
              <h4 className="text-2xl font-sans font-black uppercase text-gray-950">Intake Portal</h4>
              <p className="text-xs font-semibold text-gray-500 leading-relaxed mt-2">
                Submit your candidacy to our system. All data and portfolio attachments are safely processed through Resend routing directly to our human capital managers.
              </p>
            </div>

            {success ? (
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-emerald-50 border border-emerald-150 rounded-2xl p-6 text-center"
              >
                <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-4 animate-bounce" />
                <h5 className="text-[15px] font-black text-emerald-900 uppercase">Transmission Successful</h5>
                <p className="text-xs font-bold text-emerald-700/80 leading-relaxed mt-2">
                  Thank you, <strong>{success}</strong>. Your career credentials and cover file have been safely delivered to EthersFlow Recruitment. Our team will review your application soon.
                </p>
                <button 
                  onClick={() => setSuccess(null)}
                  className="mt-6 text-xs text-emerald-600 font-bold uppercase tracking-wider hover:underline"
                >
                  Send another application
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[11px] font-black text-gray-700 uppercase tracking-widest mb-2">Applicant Full Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Dr. Alexis Vance"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-[#fcfbfa] border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm font-bold placeholder-gray-400 outline-none transition-all text-[#1d1d1f]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-gray-700 uppercase tracking-widest mb-2">Secure Correspondence Email</label>
                  <input 
                    type="email" 
                    required
                    placeholder="e.g. alexis.v@mit.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-[#fcfbfa] border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm font-bold placeholder-gray-400 outline-none transition-all text-[#1d1d1f]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-gray-700 uppercase tracking-widest mb-2">Desired Role Focus</label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full bg-[#fcfbfa] border border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm font-bold outline-none cursor-pointer text-[#1d1d1f]"
                  >
                    {OPEN_ROLES.map((r) => (
                      <option key={r.id} value={r.title}>{r.title}</option>
                    ))}
                    <option value="Independent Research Fellowship">Independent Research Fellowship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-gray-700 uppercase tracking-widest mb-2">Portfolio / LinkedIn / GitHub URL</label>
                  <input 
                    type="url" 
                    placeholder="e.g. https://github.com/vance-alexis"
                    value={formData.portfolio}
                    onChange={(e) => setFormData({...formData, portfolio: e.target.value})}
                    className="w-full bg-[#fcfbfa] border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm font-bold placeholder-gray-400 outline-none transition-all text-[#1d1d1f]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-gray-700 uppercase tracking-widest mb-2">Statement of Intent / Cover Letter</label>
                  <textarea 
                    required
                    rows={5}
                    placeholder="Briefly summarize your thesis or describe why you are interested in adversarial consensus models..."
                    value={formData.coverLetter}
                    onChange={(e) => setFormData({...formData, coverLetter: e.target.value})}
                    className="w-full bg-[#fcfbfa] border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm font-bold placeholder-gray-400 outline-none transition-all text-[#1d1d1f] resize-none"
                  />
                </div>

                {error && (
                  <div className="flex gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-lg font-bold items-start">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full uppercase text-xs tracking-widest font-black py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Securing Transmission...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Application
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
