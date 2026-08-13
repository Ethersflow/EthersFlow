import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle, ArrowLeft, ArrowRight, Shield, Zap, Database, Cpu, 
  Settings, Key, BarChart3, Cloud, Users, Globe, Building, Check, Sparkles, AlertCircle, ExternalLink
} from 'lucide-react';
import { createCheckoutSession } from '../services/billingService';

interface PricingViewProps {
  user: any;
  setView: (view: any) => void;
  onSignUpOpen: () => void;
  billingInterval?: 'month' | 'year';
  setBillingInterval?: (interval: 'month' | 'year') => void;
}

// ----------------------------------------------------
// 1. PRICING OVERVIEW PAGE
// ----------------------------------------------------
export const PricingOverviewPage: React.FC<PricingViewProps> = ({ 
  user, setView, onSignUpOpen 
}) => {
  const [toggle, setToggle] = useState<'individual' | 'enterprise'>('individual');
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [error, setError] = useState<string | null>(null);
  const [blockedUrl, setBlockedUrl] = useState<string | null>(null);

  const initiateCheckout = async (plan: 'pro' | 'max') => {
    setError(null);
    setBlockedUrl(null);
    if (!user) {
      onSignUpOpen();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const isIframe = window.self !== window.top;
    let checkoutWindow: Window | null = null;

    if (isIframe) {
      // Open immediate blank tab inside synchronous user click context to bypass popup blockers
      checkoutWindow = window.open('about:blank', '_blank');
      if (checkoutWindow) {
        checkoutWindow.document.write('<html><body style="font-family:sans-serif; text-align:center; padding-top:40px; color:#1d1d1f; background:#F9F8F6;"><p style="font-size:16px; font-weight:bold;">Initializing Secure Checkout...</p><p style="color:#86868b; font-size:14px;">Connecting to Stripe...</p></body></html>');
      }
    }

    try {
      const result = await createCheckoutSession(user.uid, plan, billingInterval);
      if (isIframe) {
        if (checkoutWindow) {
          checkoutWindow.location.href = result.url;
        } else {
          setBlockedUrl(result.url);
          setError("Your browser blocked the Stripe popup from opening. Please use the direct link below.");
        }
      } else {
        window.location.href = result.url;
      }
    } catch (err: any) {
      console.error("Pricing page billing redirect error:", err);
      if (checkoutWindow) {
        checkoutWindow.close();
      }
      setError(err.message || "Failed to start Stripe Session. Please check your backend configuration.");
    }
  };

  return (
    <div className="w-full bg-[#F9F8F6] text-[#1d1d1f] py-16 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Navigation Breadcrumb */}
        <button 
          onClick={() => { setView('main'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#86868b] hover:text-indigo-600 transition-colors mb-8 cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Platform
        </button>

        {/* Error Banner */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-5 bg-red-55 text-red-800 border-2 border-red-100 rounded-[24px] flex items-start gap-4 shadow-sm"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-650" />
            <div className="flex-1">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-red-900">Stripe Billing Gateway Error</h4>
              <p className="text-xs font-bold mt-1 text-red-700 leading-relaxed max-w-2xl">{error}</p>
              <p className="text-[10px] uppercase font-black tracking-widest mt-2 text-red-500">Suggested Action: Verify your stripe secret api key is valid in settings.</p>
            </div>
            <button 
              onClick={() => setError(null)} 
              className="text-xs font-bold text-red-400 hover:text-red-700 cursor-pointer"
            >
              Dismiss
            </button>
          </motion.div>
        )}

        {/* Popup Blocked Warning & Checkout Button */}
        {blockedUrl && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-amber-50 text-amber-900 border-2 border-amber-200 rounded-[24px] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 animate-pulse" />
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-amber-950">Action Needed: Complete Secure Payment</h4>
                <p className="text-xs font-semibold mt-1 text-amber-800 leading-relaxed max-w-2xl">
                  Your browser blocked Stripe from opening automatically. Click the button to proceed securely to the Stripe Checkout page.
                </p>
              </div>
            </div>
            <a 
              href={blockedUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => { setBlockedUrl(null); }}
              className="px-6 py-3.5 bg-indigo-600 text-white font-extrabold uppercase tracking-wider text-xs rounded-xl hover:bg-indigo-700 transition-colors text-center inline-flex items-center gap-2 cursor-pointer self-start md:self-auto shadow-md"
            >
              Open Stripe Checkout
              <ExternalLink className="w-4 h-4" />
            </a>
          </motion.div>
        )}

        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-black text-indigo-600 uppercase tracking-[0.4em] mb-4">Pricing Strategy</div>
          <h1 className="text-4xl lg:text-6xl font-black text-[#1d1d1f] tracking-tighter mb-6">
            Rigor, mapped to scale.
          </h1>
          <p className="text-lg text-gray-500 font-medium leading-relaxed">
            From single-agent researchers to globally isolated corporate clusters. Explore our adversarial consensus plans below.
          </p>
        </div>

        {/* Custom Segment Selector */}
        <div className="flex justify-center mb-16">
          <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-[24px] flex items-center border border-gray-200 shadow-md">
            <button
              onClick={() => setToggle('individual')}
              className={`px-8 py-3 rounded-[18px] text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                toggle === 'individual' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-indigo-600'
              }`}
            >
              Individual Plans
            </button>
            <button
              onClick={() => setToggle('enterprise')}
              className={`px-8 py-3 rounded-[18px] text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                toggle === 'enterprise' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-indigo-600'
              }`}
            >
              Teams & Enterprise
            </button>
          </div>
        </div>

        {/* Content Tabs */}
        {toggle === 'individual' ? (
          <div>
            {/* Interval Toggle */}
            <div className="flex items-center justify-center gap-4 mb-12">
              <span className={`text-xs font-black uppercase tracking-widest ${billingInterval === 'month' ? 'text-indigo-600' : 'text-gray-400'}`}>Monthly</span>
              <button 
                onClick={() => setBillingInterval(prev => prev === 'month' ? 'year' : 'month')}
                className="w-12 h-6 bg-gray-200 rounded-full p-1 transition-all flex items-center border border-gray-300 cursor-pointer"
              >
                <div className={`w-4 h-4 rounded-full shadow-md transition-all ${billingInterval === 'year' ? 'bg-indigo-600 ml-6' : 'bg-white'}`} />
              </button>
              <span className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${billingInterval === 'year' ? 'text-indigo-600' : 'text-gray-400'}`}>
                Yearly <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[9px] font-black rounded uppercase">Save 15%</span>
              </span>
            </div>

            {/* Individual Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-24">
              
              {/* Free Card */}
              <div className="bg-white border border-gray-100 p-8 sm:p-10 rounded-[36px] flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                <div>
                  <h3 className="text-xl font-black text-[#1d1d1f] mb-2">Free Sandbox</h3>
                  <p className="text-xs text-gray-400 font-bold mb-6">Initial multi-agent exploration</p>
                  <div className="text-4xl font-black text-[#1d1d1f] mb-8">$0</div>
                  <ul className="space-y-4 mb-8 text-sm font-bold text-gray-500">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-500" /> 3 Active Intelligence Agents</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-500" /> Standard Sandbox Environment</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-500" /> Basic Consensus Layer</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-500" /> On-Device Sanitizer Trial</li>
                  </ul>
                </div>
                <button 
                  onClick={() => { setView('main'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                  className="w-full py-4 bg-gray-50 hover:bg-gray-100 text-gray-850 font-black rounded-2xl transition-all text-xs uppercase tracking-widest border border-gray-200 cursor-pointer text-center"
                >
                  Enter Sandbox
                </button>
              </div>

              {/* Pro Card */}
              <div className="bg-white border-2 border-indigo-600 p-8 sm:p-10 rounded-[36px] flex flex-col justify-between shadow-xl relative transform scale-102">
                <div className="absolute top-0 right-10 -translate-y-1/2 bg-indigo-600 text-white font-black text-[9px] uppercase tracking-widest px-4 py-1 rounded-full shadow-md">Popular Tier</div>
                <div>
                  <h3 className="text-xl font-black text-[#1d1d1f] mb-2">Pro Console</h3>
                  <p className="text-xs text-gray-400 font-bold mb-6">Everyday audit & analytical power</p>
                  <div className="mb-8">
                    <span className="text-4xl font-black text-[#1d1d1f]">${billingInterval === 'year' ? '17' : '20'}</span>
                    <span className="text-xs font-bold text-gray-400 ml-1">/ seat / month</span>
                  </div>
                  <ul className="space-y-4 mb-8 text-sm font-bold text-gray-600">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-600" /> Unlimited Deployed Agents</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-600" /> Advanced Discordance Logic</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-600" /> Local Zero-Trust Secure Vault</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-600" /> Zero-Data-Retention Storage</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-600" /> Custom Persona Builder</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <button 
                    onClick={() => initiateCheckout('pro')}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-widest shadow-lg cursor-pointer"
                  >
                    Subscribe Pro
                  </button>
                  <button 
                    onClick={() => setView('pro_plan_page')}
                    className="w-full py-3 bg-transparent hover:underline text-indigo-600 font-bold text-xs uppercase tracking-widest cursor-pointer text-center block"
                  >
                    View Plan Details →
                  </button>
                </div>
              </div>

              {/* Max Card */}
              <div className="bg-white border border-gray-100 p-8 sm:p-10 rounded-[36px] flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                <div>
                  <h3 className="text-xl font-black text-[#1d1d1f] mb-2">Max Audit</h3>
                  <p className="text-xs text-gray-400 font-bold mb-6">Deep consensus for complex vectors</p>
                  <div className="mb-8">
                    <span className="text-4xl font-black text-[#1d1d1f]">${billingInterval === 'year' ? '80' : '100'}</span>
                    <span className="text-xs font-bold text-gray-400 ml-1">/ seat / month</span>
                  </div>
                  <ul className="space-y-4 mb-8 text-sm font-bold text-gray-500">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-500" /> 5-20x high-token agent limits</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-500" /> Frontier Model expert panel access</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-500" /> Sovereign Recovery routing SLA</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-500" /> E2E Cryptographic Audit Trails</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-500" /> Direct CSV/PDF multi-file exports</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <button 
                    onClick={() => initiateCheckout('max')}
                    className="w-full py-4 bg-[#1d1d1f] hover:bg-gray-855 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-widest cursor-pointer"
                  >
                    Subscribe Max
                  </button>
                  <button 
                    onClick={() => setView('max_plan_page')}
                    className="w-full py-3 bg-transparent hover:underline text-gray-700 font-bold text-xs uppercase tracking-widest cursor-pointer text-center block"
                  >
                    View Plan Details →
                  </button>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-24">
            
            {/* Enterprise Team Card @ $20 */}
            <div className="bg-white border border-gray-150 p-10 rounded-[40px] flex flex-col justify-between shadow-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl translate-x-4 -translate-y-4 group-hover:bg-indigo-500/20 transition-all duration-500" />
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
                    <Building className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#86868b]">Collaborative Scale</span>
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Enterprise Team</h3>
                <p className="text-xs text-gray-400 font-bold mb-6 leading-relaxed">Centralized reasoning and identity management for corporate teams.</p>
                <div className="mb-8">
                  <span className="text-4xl font-black text-gray-950">$20</span>
                  <span className="text-xs font-bold text-gray-400 ml-1">/ user / mo (min. 5 seats)</span>
                </div>
                <ul className="space-y-4 mb-8 text-sm font-bold text-gray-600">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-500" /> Central billing & master dashboard</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-500" /> Shared corporate agent libraries</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-500" /> SAML Single-Sign On (SSO)</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-500" /> SOC2-compliant logging schemas</li>
                </ul>
              </div>
              <button 
                onClick={() => { setView('enterprise_plan_page'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-widest shadow-md cursor-pointer"
              >
                Configure Team Page
              </button>
            </div>

            {/* Custom Setup */}
            <div className="bg-gradient-to-br from-[#1d1d1f] to-[#121214] border border-gray-800 p-10 rounded-[40px] flex flex-col justify-between shadow-2xl relative overflow-hidden text-white group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full blur-3xl translate-x-8 -translate-y-8" />
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-white/10 p-2.5 rounded-xl text-indigo-400">
                    <Shield className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Custom Infrastructure</span>
                </div>
                <h3 className="text-2xl font-black mb-2">Sovereign Custom</h3>
                <p className="text-xs text-indigo-200/60 font-medium mb-6 leading-relaxed">Fully isolated, custom-weighted deployment on client hardware or dedicated VPC nodes.</p>
                <div className="mb-8">
                  <span className="text-3xl font-black">Tailored Plan</span>
                  <span className="text-xs text-indigo-300 font-bold block mt-1">SLA contracts + Enterprise vaulting</span>
                </div>
                <ul className="space-y-4 mb-10 text-sm font-bold text-indigo-100/80">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-400" /> Local KMS AWS Key Vaulting</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-400" /> OpenTelemetry data lake pipeline</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-400" /> Dedicated VPC deployment nodes</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-400" /> Active 45-second Maximum SLA</li>
                </ul>
              </div>
              <button 
                onClick={() => { setView('enterprise_plan_page'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                className="w-full py-4 bg-white text-gray-950 hover:bg-indigo-100 font-black rounded-2xl transition-all text-xs uppercase tracking-widest cursor-pointer shadow-lg text-center"
              >
                Inquire Sales setup
              </button>
            </div>

          </div>
        )}

        {/* COMPARISON ASPECT TABLE */}
        <div className="bg-white rounded-[32px] p-6 sm:p-10 border border-gray-100 shadow-sm max-w-6xl mx-auto">
          <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-8 text-center sm:text-left">Feature Deployment Grid</h3>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-4 text-xs font-black uppercase tracking-wider text-gray-400">Functional Area</th>
                  <th className="py-4 text-xs font-black uppercase tracking-wider text-gray-400 text-center">Free Sandbox</th>
                  <th className="py-4 text-xs font-black uppercase tracking-wider text-indigo-600 text-center">Pro Console</th>
                  <th className="py-4 text-xs font-black uppercase tracking-wider text-gray-400 text-center">Max System</th>
                  <th className="py-4 text-xs font-black uppercase tracking-wider text-amber-600 text-center">Enterprise Tiers</th>
                </tr>
              </thead>
              <tbody className="text-xs font-bold text-gray-600">
                <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-4 text-gray-950 font-black">Active AI Agents</td>
                  <td className="py-4 text-center">3 Slots</td>
                  <td className="py-4 text-indigo-600 text-center">Unlimited</td>
                  <td className="py-4 text-center">Unlimited</td>
                  <td className="py-4 text-amber-600 text-center">Unlimited + Custom Persona Corpuses</td>
                </tr>
                <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-4 text-gray-950 font-black">Adversarial Consensus Level</td>
                  <td className="py-4 text-center">Baseline Models</td>
                  <td className="py-4 text-center">Dynamic red-teaming</td>
                  <td className="py-4 text-center">FRONTIER Models exp panel</td>
                  <td className="py-4 text-amber-600 text-center">Fine-tuned models / Dedicated Node Weights</td>
                </tr>
                <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-4 text-gray-950 font-black">Identity Partitioning</td>
                  <td className="py-4 text-center">LocalStorage device bias</td>
                  <td className="py-4 text-center">SignedIn user uid</td>
                  <td className="py-4 text-center">SignedIn user uid</td>
                  <td className="py-4 text-amber-600 text-center">Enterprise JWT Tenant Claim Partitioning</td>
                </tr>
                <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-4 text-gray-950 font-black">Security Vault Compliance</td>
                  <td className="py-4 text-center">Standard local purge</td>
                  <td className="py-4 text-center">ZDR sovereign storage</td>
                  <td className="py-4 text-center">E2E Cryptographic Vaults</td>
                  <td className="py-4 text-amber-600 text-center">SOC-2 Isolated KMS Key Vault integrations</td>
                </tr>
                <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-4 text-gray-950 font-black">Operations Telemetry</td>
                  <td className="py-4 text-center">None</td>
                  <td className="py-4 text-center">Simple logs</td>
                  <td className="py-4 text-center">Detailed graphs</td>
                  <td className="py-4 text-amber-600 text-center">OpenTelemetry server proxy log pipeline</td>
                </tr>
                <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-4 text-gray-950 font-black">SLA processing guarantees</td>
                  <td className="py-4 text-center">Best effort</td>
                  <td className="py-4 text-center">Standard priorities</td>
                  <td className="py-4 text-center">High SLA prioritization</td>
                  <td className="py-4 text-amber-600 text-center">Active 45-second hard consensus timeout</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

// ----------------------------------------------------
// 2. PRO PLAN DETAILED PAGE
// ----------------------------------------------------
export const ProPlanDetailedPage: React.FC<PricingViewProps> = ({
  user, setView, onSignUpOpen
}) => {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [error, setError] = useState<string | null>(null);
  const [blockedUrl, setBlockedUrl] = useState<string | null>(null);

  const initiateCheckout = async () => {
    setError(null);
    setBlockedUrl(null);
    if (!user) {
      onSignUpOpen();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const isIframe = window.self !== window.top;
    let checkoutWindow: Window | null = null;

    if (isIframe) {
      checkoutWindow = window.open('about:blank', '_blank');
      if (checkoutWindow) {
        checkoutWindow.document.write('<html><body style="font-family:sans-serif; text-align:center; padding-top:40px; color:#1d1d1f; background:#F9F8F6;"><p style="font-size:16px; font-weight:bold;">Initializing Secure Checkout...</p><p style="color:#86868b; font-size:14px;">Connecting to Stripe...</p></body></html>');
      }
    }

    try {
      const result = await createCheckoutSession(user.uid, 'pro', billingInterval);
      if (isIframe) {
        if (checkoutWindow) {
          checkoutWindow.location.href = result.url;
        } else {
          setBlockedUrl(result.url);
          setError("Your browser blocked the Stripe popup from opening. Please use the direct link below.");
        }
      } else {
        window.location.href = result.url;
      }
    } catch (err: any) {
      console.error("Pro detailed page checkout error:", err);
      if (checkoutWindow) {
        checkoutWindow.close();
      }
      setError(err.message || "Failed to start checkout. Check your API configuration.");
    }
  };

  return (
    <div className="w-full bg-[#F9F8F6] text-[#1d1d1f] py-16 px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Nav */}
        <button 
          onClick={() => { setView('pricing_overview'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#86868b] hover:text-[#1d1d1f] transition-colors mb-12 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Plans
        </button>

        {/* Error Banner */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-5 bg-red-55 text-red-800 border-2 border-red-100 rounded-[24px] flex items-start gap-4 shadow-sm"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-650" />
            <div className="flex-1">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-red-900">Stripe Billing Gateway Error</h4>
              <p className="text-xs font-bold mt-1 text-red-700 leading-relaxed max-w-2xl">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)} 
              className="text-xs font-bold text-red-400 hover:text-red-700 cursor-pointer"
            >
              Dismiss
            </button>
          </motion.div>
        )}

        {/* Popup Blocked Warning & Checkout Button */}
        {blockedUrl && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-amber-50 text-amber-900 border-2 border-amber-200 rounded-[24px] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 animate-pulse" />
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-amber-950">Action Needed: Complete Secure Payment</h4>
                <p className="text-xs font-semibold mt-1 text-amber-800 leading-relaxed max-w-2xl">
                  Your browser blocked Stripe from opening automatically. Click the button to proceed securely to the Stripe Checkout page.
                </p>
              </div>
            </div>
            <a 
              href={blockedUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => { setBlockedUrl(null); }}
              className="px-6 py-3.5 bg-indigo-600 text-white font-extrabold uppercase tracking-wider text-xs rounded-xl hover:bg-indigo-700 transition-colors text-center inline-flex items-center gap-2 cursor-pointer self-start md:self-auto shadow-md"
            >
              Open Stripe Checkout
              <ExternalLink className="w-4 h-4" />
            </a>
          </motion.div>
        )}

        {/* Hero */}
        <div className="border border-gray-150 p-10 bg-white rounded-[40px] shadow-sm mb-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-8 border-b border-gray-100 mb-8">
            <div>
              <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Workspace Class</div>
              <h1 className="text-3xl sm:text-4xl font-black text-[#1d1d1f] tracking-tight">EthersFlow Pro</h1>
              <p className="text-sm text-gray-400 font-medium">The standard and trusted reasoning tool for power users.</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-indigo-600">${billingInterval === 'year' ? '17' : '20'}</div>
              <div className="text-[10px] font-bold text-gray-400 capitalize">per user / month (billed {billingInterval}ly)</div>
            </div>
          </div>

          <div className="flex justify-center mb-8">
            <div className="bg-gray-100 p-1 rounded-2xl flex items-center border border-gray-200">
              <button onClick={() => setBillingInterval('month')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${billingInterval === 'month' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500'}`}>Monthly</button>
              <button onClick={() => setBillingInterval('year')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${billingInterval === 'year' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500'}`}>Yearly</button>
            </div>
          </div>

          <p className="text-base text-gray-500 font-medium leading-relaxed mb-8">
            EthersFlow Pro provides unlimited access to EthersFlow's robust adversarial consensus engines. By evaluating multiple active agents at once, Pro exposes logical contradictions, resolves hallucinations, and guarantees total confidentiality with on-device Zero-Data-Retention filters.
          </p>

          <button 
            onClick={initiateCheckout}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-sm uppercase tracking-widest shadow-xl transition-all mb-8 cursor-pointer text-center block"
          >
            Activate Pro Access
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl">
              <h3 className="font-black text-sm text-[#1d1d1f] mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                Zero-Data Retention (ZDR)
              </h3>
              <p className="text-xs text-gray-500">None of your prompts, files, or synthesized debate trees are ever stored in remote logs or used to train third-party LLMs.</p>
            </div>
            <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl">
              <h3 className="font-black text-sm text-[#1d1d1f] mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-600" />
                Unlimited Consensus Rounds
              </h3>
              <p className="text-xs text-gray-500">Conduct as many multi-agent debates as you want. Perfect for validating financial audits, technical queries, or legal drafts with high rigor.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// ----------------------------------------------------
// 3. MAX PLAN DETAILED PAGE
// ----------------------------------------------------
export const MaxPlanDetailedPage: React.FC<PricingViewProps> = ({
  user, setView, onSignUpOpen
}) => {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [error, setError] = useState<string | null>(null);
  const [blockedUrl, setBlockedUrl] = useState<string | null>(null);

  const initiateCheckout = async () => {
    setError(null);
    setBlockedUrl(null);
    if (!user) {
      onSignUpOpen();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const isIframe = window.self !== window.top;
    let checkoutWindow: Window | null = null;

    if (isIframe) {
      checkoutWindow = window.open('about:blank', '_blank');
      if (checkoutWindow) {
        checkoutWindow.document.write('<html><body style="font-family:sans-serif; text-align:center; padding-top:40px; color:#1d1d1f; background:#F9F8F6;"><p style="font-size:16px; font-weight:bold;">Initializing Secure Checkout...</p><p style="color:#86868b; font-size:14px;">Connecting to Stripe...</p></body></html>');
      }
    }

    try {
      const result = await createCheckoutSession(user.uid, 'max', billingInterval);
      if (isIframe) {
        if (checkoutWindow) {
          checkoutWindow.location.href = result.url;
        } else {
          setBlockedUrl(result.url);
          setError("Your browser blocked the Stripe popup from opening. Please use the direct link below.");
        }
      } else {
        window.location.href = result.url;
      }
    } catch (err: any) {
      console.error("Max detailed page checkout error:", err);
      if (checkoutWindow) {
        checkoutWindow.close();
      }
      setError(err.message || "Failed to start checkout. Check your API configuration.");
    }
  };

  return (
    <div className="w-full bg-[#F9F8F6] text-[#1d1d1f] py-16 px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Nav */}
        <button 
          onClick={() => { setView('pricing_overview'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#86868b] hover:text-[#1d1d1f] transition-colors mb-12 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Plans
        </button>

        {/* Error Banner */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-5 bg-red-55 text-red-800 border-2 border-red-100 rounded-[24px] flex items-start gap-4 shadow-sm"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-650" />
            <div className="flex-1">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-red-900">Stripe Billing Gateway Error</h4>
              <p className="text-xs font-bold mt-1 text-red-700 leading-relaxed max-w-2xl">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)} 
              className="text-xs font-bold text-red-400 hover:text-red-700 cursor-pointer"
            >
              Dismiss
            </button>
          </motion.div>
        )}

        {/* Popup Blocked Warning & Checkout Button */}
        {blockedUrl && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-amber-50 text-amber-900 border-2 border-amber-200 rounded-[24px] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 animate-pulse" />
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-amber-950">Action Needed: Complete Secure Payment</h4>
                <p className="text-xs font-semibold mt-1 text-amber-800 leading-relaxed max-w-2xl">
                  Your browser blocked Stripe from opening automatically. Click the button to proceed securely to the Stripe Checkout page.
                </p>
              </div>
            </div>
            <a 
              href={blockedUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => { setBlockedUrl(null); }}
              className="px-6 py-3.5 bg-indigo-600 text-white font-extrabold uppercase tracking-wider text-xs rounded-xl hover:bg-indigo-700 transition-colors text-center inline-flex items-center gap-2 cursor-pointer self-start md:self-auto shadow-md"
            >
              Open Stripe Checkout
              <ExternalLink className="w-4 h-4" />
            </a>
          </motion.div>
        )}

        {/* Hero */}
        <div className="border border-gray-150 p-10 bg-white rounded-[40px] shadow-sm mb-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-8 border-b border-gray-100 mb-8">
            <div>
              <div className="text-[10px] font-black text-[#1d1d1f] uppercase tracking-widest mb-2">High Performance Tier</div>
              <h1 className="text-3xl sm:text-4xl font-black text-[#1d1d1f] tracking-tight">EthersFlow Max</h1>
              <p className="text-sm text-gray-400 font-medium font-mono">Max token limits for complex context analyses.</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-indigo-600">${billingInterval === 'year' ? '80' : '100'}</div>
              <div className="text-[10px] font-bold text-gray-400 capitalize">per seat / month (billed {billingInterval}ly)</div>
            </div>
          </div>

          <div className="flex justify-center mb-8">
            <div className="bg-gray-100 p-1 rounded-2xl flex items-center border border-gray-200">
              <button onClick={() => setBillingInterval('month')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${billingInterval === 'month' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500'}`}>Monthly</button>
              <button onClick={() => setBillingInterval('year')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${billingInterval === 'year' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500'}`}>Yearly</button>
            </div>
          </div>

          <p className="text-base text-gray-500 font-medium leading-relaxed mb-8">
            EthersFlow Max is engineered for power users handling enormous file volumes, long context vectors, and security operations. It unlocks access to premium frontier intelligence panels (leveraging Claude 3.5 Sonnet, GPT-4o, and Gemini 2.0 Pro) with dedicated high-priority CPU queues and sovereign SLA rerouting guarantees.
          </p>

          <button 
            onClick={initiateCheckout}
            className="w-full py-5 bg-[#1d1d1f] hover:bg-gray-855 text-white font-black rounded-2xl text-sm uppercase tracking-widest shadow-xl transition-all mb-8 cursor-pointer text-center block"
          >
            Activate Max License
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl">
              <h3 className="font-black text-sm text-[#1d1d1f] mb-2 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-600" />
                Frontier Expert Panel
              </h3>
              <p className="text-xs text-gray-500">Unlocks our specialized panel of elite reasoning architectures, combining advanced models across Google, Anthropic, and Grok for robust cognitive cross-examination.</p>
            </div>
            <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl">
              <h3 className="font-black text-sm text-[#1d1d1f] mb-2 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                Full Cryptographic Trace Trails
              </h3>
              <p className="text-xs text-gray-500">Gain deep insights into your operations telemetry. View detailed execution steps, latency times, and token distribution indexes per reasoning block.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// ----------------------------------------------------
// 4. ENTERPRISE PLAN DETAILED PAGE
// ----------------------------------------------------
export const EnterprisePlanDetailedPage: React.FC<PricingViewProps> = ({
  user, setView
}) => {
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState(user?.email || '');
  const [inquiryCompany, setInquiryCompany] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquiryStatus, setInquiryStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInquiryStatus('loading');
    setTimeout(() => {
      setInquiryStatus('success');
    }, 1200);
  };

  return (
    <div className="w-full bg-[#161618] text-[#e8e8ed] py-20 px-6 sm:px-12 relative overflow-hidden">
      {/* Background Visual Sparkles */}
      <div className="absolute top-0 right-0 w-2/3 h-2/3 bg-indigo-600/5 blur-[140px] rounded-full translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-purple-600/5 blur-[120px] rounded-full -translate-x-1/3 translate-y-1/3" />

      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* Nav Breadcrumb */}
        <button 
          onClick={() => { setView('pricing_overview'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#86868b] hover:text-white transition-colors mb-12 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Plans
        </button>

        {/* Header Header */}
        <div className="max-w-2xl mb-20 text-left">
          <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-4">Enterprise Division</div>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tighter mb-6 leading-[1.05]">
            EthersFlow <span className="text-indigo-400">Enterprise</span>
          </h1>
          <p className="text-lg text-gray-400 font-medium leading-relaxed">
            Unifying multi-agent reasoning, zero-trust cryptographic vaults, and isolated data routing into a sovereign compliance core. Inspired by the absolute standard of enterprise privacy.
          </p>
        </div>

        {/* TWO CLEAR LEVEL PLANS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch mb-24">
          
          {/* Card 1: Enterprise Team Scale ($20) */}
          <div className="bg-gray-900/40 border border-gray-800 p-10 rounded-[40px] flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-black uppercase tracking-widest mb-4">
                <Users className="w-4 h-4" /> Team Tier
              </div>
              <h3 className="text-2xl font-black text-white mb-2">Enterprise Team</h3>
              <p className="text-xs text-gray-400 font-medium mb-8 leading-relaxed">
                Unlock collaborative multi-agent workspaces, single-billing management, and active corporate directories (minimum 5 seats setup).
              </p>
              
              <div className="mb-10 pb-6 border-b border-gray-800">
                <span className="text-5xl font-black text-white">$20</span>
                <span className="text-xs font-bold text-gray-400 ml-1">/ user / mo</span>
              </div>

              <ul className="space-y-4 mb-8 text-sm font-bold text-gray-300">
                <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-indigo-400" /> Centralized workspace directory</li>
                <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-indigo-400" /> Master dashboard telemetry logs</li>
                <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-indigo-400" /> SAML SSO and Google Workspace Login</li>
                <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-indigo-400" /> Shared team personas & agent logic</li>
              </ul>
            </div>
            
            <a 
              href="#sales-form"
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-xs uppercase tracking-widest text-center shadow-lg transition-all"
            >
              Get Started Team
            </a>
          </div>

          {/* Card 2: Custom Client Scale (Custom Setup) */}
          <div className="bg-gradient-to-br from-[#121214] to-[#1c1c20] border-2 border-indigo-500/30 p-10 rounded-[40px] flex flex-col justify-between shadow-2xl relative">
            <div className="absolute top-0 right-10 -translate-y-1/2 bg-indigo-505 text-white bg-indigo-600 font-black text-[9px] uppercase tracking-widest px-4 py-1 rounded-full shadow-md">Complete Sovereignty</div>
            <div>
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-black uppercase tracking-widest mb-4">
                <Shield className="w-4 h-4" /> Sovereign Scale
              </div>
              <h3 className="text-2xl font-black text-white mb-2">Custom Setup</h3>
              <p className="text-xs text-indigo-200/60 font-medium mb-8 leading-relaxed">
                Configure isolated VPC execution layers, client-owned cryptographic KMS tokens, and strict legal compliance alignments.
              </p>
              
              <div className="mb-10 pb-6 border-b border-gray-800">
                <span className="text-3xl font-black text-indigo-300">Custom Contract</span>
                <span className="text-xs font-bold block text-gray-500 mt-1">SLA guarantees + On-premises capabilities</span>
              </div>

              <ul className="space-y-4 mb-8 text-sm font-bold text-gray-200">
                <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-indigo-400" /> Fully custom LLM model deployments</li>
                <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-indigo-400" /> Dedicated Cloud Run VPC Nodes</li>
                <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-indigo-400" /> Master OpenTelemetry event logging</li>
                <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-indigo-400" /> HashiCorp Vault / Cloud KMS support</li>
              </ul>
            </div>
            
            <a 
              href="#sales-form"
              className="w-full py-4 bg-white text-gray-950 hover:bg-indigo-150 font-black rounded-2xl text-xs uppercase tracking-widest text-center shadow"
            >
              Contact Sales Core
            </a>
          </div>

        </div>

        {/* ENTERPRISE ONBOARDING DEPLOYMENT PIPELINE VISUAL */}
        <div className="bg-gray-900/20 border border-gray-800 rounded-[36px] p-8 sm:p-12 mb-24">
          <div className="text-center mb-12">
            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-4">Onboarding Protocols</div>
            <h2 className="text-3xl font-black text-white tracking-tighter">Operationalizing at Scale</h2>
            <p className="text-sm text-gray-400 max-w-2xl mx-auto mt-2 font-medium">
              EthersFlow facilitates instant SaaS onboarding. Below is the active architecture that ensures client isolation and regulatory defense.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Step 1 */}
            <div className="p-6 bg-[#1a1a1c] border border-gray-800/60 rounded-2xl relative text-left">
              <span className="absolute top-4 right-4 text-xs font-black text-indigo-500 font-mono">STEP 01</span>
              <div className="bg-indigo-500/10 p-3 rounded-xl text-indigo-400 w-11 h-11 flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="font-black text-sm text-white mb-2">Tenant Mapping</h4>
              <p className="text-xs text-gray-400/95 leading-relaxed">
                Setting a custom <strong className="text-indigo-300">tenantId</strong> JWT claim so Firestore rules partition logs automatically.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 bg-[#1a1a1c] border border-gray-800/60 rounded-2xl relative text-left">
              <span className="absolute top-4 right-4 text-xs font-black text-indigo-500 font-mono">STEP 02</span>
              <div className="bg-indigo-500/10 p-3 rounded-xl text-indigo-400 w-11 h-11 flex items-center justify-center mb-4">
                <Key className="w-5 h-5" />
              </div>
              <h4 className="font-black text-sm text-white mb-2">Client KMS Vault</h4>
              <p className="text-xs text-gray-400/95 leading-relaxed">
                Connect your AWS KMS or Vault to use your own LLM API keys and hardware compute budgets.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 bg-[#1a1a1c] border border-gray-800/60 rounded-2xl relative text-left">
              <span className="absolute top-4 right-4 text-xs font-black text-indigo-500 font-mono">STEP 03</span>
              <div className="bg-indigo-500/10 p-3 rounded-xl text-indigo-400 w-11 h-11 flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h4 className="font-black text-sm text-white mb-2">OTel Telemetry</h4>
              <p className="text-xs text-gray-400/95 leading-relaxed">
                Consensus proxy logs are streamed as trace spans directly into your enterprise metrics tables.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 bg-[#1a1a1c] border border-gray-800/60 rounded-2xl relative text-left">
              <span className="absolute top-4 right-4 text-xs font-black text-amber-500 font-mono">SSO LIVE</span>
              <div className="bg-amber-500/10 p-3 rounded-xl text-amber-400 w-11 h-11 flex items-center justify-center mb-4">
                <Globe className="w-5 h-5" />
              </div>
              <h4 className="font-black text-sm text-white mb-2">Dedicated VPC</h4>
              <p className="text-xs text-gray-400/95 leading-relaxed">
                Boot isolated server arrays, private endpoints, and 45s maximum SLA routing guarantee.
              </p>
            </div>

          </div>
        </div>

        {/* INTERACTIVE SALES FORM */}
        <div id="sales-form" className="bg-[#1c1c1e] border-2 border-gray-800 rounded-[48px] p-8 sm:p-14 max-w-3xl mx-auto shadow-2xl">
          <div className="text-center mb-10">
            <h3 className="text-2xl sm:text-3xl font-black text-white">Consensus Sales Hub</h3>
            <p className="text-sm text-gray-400 mt-2 font-medium">Initiate your dedicated sandbox setup or procure Enterprise Team licenses.</p>
          </div>

          {inquiryStatus === 'success' ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-8 bg-indigo-650/20 border border-indigo-500/30 rounded-3xl text-center text-white"
            >
              <Sparkles className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
              <h4 className="text-xl font-black mb-2">Proposal Initiated!</h4>
              <p className="text-xs text-gray-300 max-w-md mx-auto leading-relaxed">
                Thank you. Our executive engineering team will contact you within 4 business hours to set up your isolated VPC deployment trial.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleInquirySubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-450 mb-2">Name</label>
                  <input 
                    type="text" 
                    required
                    value={inquiryName} 
                    onChange={e => setInquiryName(e.target.value)}
                    placeholder="E.g., Dr. Alan Turing" 
                    className="w-full bg-[#161618] border border-gray-800 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-450 mb-2">Corporate Email</label>
                  <input 
                    type="email" 
                    required
                    value={inquiryEmail} 
                    onChange={e => setInquiryEmail(e.target.value)}
                    placeholder="you@enterprise.com" 
                    className="w-full bg-[#161618] border border-gray-800 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-450 mb-2">Organization</label>
                <input 
                  type="text" 
                  required
                  value={inquiryCompany} 
                  onChange={e => setInquiryCompany(e.target.value)}
                  placeholder="E.g., Sovereign Analytics, Inc." 
                  className="w-full bg-[#161618] border border-gray-800 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-450 mb-2">Specific Requirements / Notes</label>
                <textarea 
                  rows={4}
                  value={inquiryMessage} 
                  onChange={e => setInquiryMessage(e.target.value)}
                  placeholder="E.g., We require customized VPC hosting on Google Cloud with dedicated model nodes and HashiCorp Vault key mapping..." 
                  className="w-full bg-[#161618] border border-gray-800 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              </div>

              <button 
                type="submit" 
                disabled={inquiryStatus === 'loading'}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {inquiryStatus === 'loading' ? 'Processing Alignment...' : 'Align Setup Protocol'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
