import React from 'react';
import { View } from './types';

export const PAGE_CONTENT: Partial<Record<Exclude<View, 'main'>, { 
  title: string; 
  subtitle: string; 
  introduction: string; 
  sections: { title: string; content: string; icon?: React.ReactNode }[] 
}>> = {
  protocol: {
    title: "Adversarial Consensus Protocol",
    subtitle: "Federated Adversarial Consensus (FAC) Mechanism",
    introduction: "EthersFlow operates on a zero-trust reasoning architecture designed to mitigate model-specific bias and synthetic hallucinations.",
    sections: [
      { title: "Multi-Model Arbitration", content: "Our protocol mandates that every institutional query must be processed by at least three independent model architectures (e.g., Transformer, mOE, and Reasoning-Distilled) to ensure non-homogeneous logic chains." },
      { title: "Adversarial Weighting", content: "Confidence Metrics are dynamically adjusted based on the 'Red Team' impact. If an adversarial agent identifies a verifiable contradiction that others missed, the overall concordant score is penalized, forcing a logic re-evaluation." }
    ]
  },
  pricing: {
    title: "Intelligence Tiers",
    subtitle: "Scalable access to verifiable reasoning",
    introduction: "Choose the level of rigor required for your workspace operations.",
    sections: [
      { title: "Individual Console", content: "Free access to 3 base agents. Ideal for researchers and developers exploring adversarial consensus with device-level tokenization protection." },
      { title: "Institutional Suite", content: "Starting at $49/mo per seat. Includes unlimited agents, custom persona tuning, SOC2-compliant history auditing, active SLA pipelines, and dedicated consensus VPC setups." }
    ]
  },
  about: {
    title: "Our Mission",
    subtitle: "Closing the AI Trust Gap",
    introduction: "EthersFlow is a multi-model reasoning platform designed to eliminate the AI trust gap through verifiable adversarial consensus. Our platform forces independent expert AI agents to cross-examine and debate complex queries in order to expose logical contradictions across frontier models and distill objective, trustworthy answers.",
    sections: [
      { title: "The Transparency Crisis", content: "As AI becomes a black box in enterprise stacks, EthersFlow provides the glass-box alternative where every decision is a result of visible, traced debate." },
      { title: "Integrity First", content: "We do not build models; we build the systems that hold models accountable. Our neutrality is our greatest asset." }
    ]
  },
  research: {
    title: "Research & Development",
    subtitle: "Frontiers of Algorithmic Rigor",
    introduction: "Exploring the intersections of model dependency, hallucination fingerprints, and synthetic reasoning.",
    sections: [
      { title: "Model Dependency Clusters", content: "Our latest whitepaper identifies how different LLMs share systemic blind spots based on overlapping training sets." },
      { title: "Verification Benchmarks", content: "We are developing the EF-Audit benchmark, a new standard for measuring the logical consistency of AI consensus engines." }
    ]
  },
  careers: {
    title: "Join the Rigor",
    subtitle: "Build the Future of Verifiable Trust",
    introduction: "We are looking for individuals who are obsessed with precision, adversarial thinking, and the architecture of truth.",
    sections: [
      { title: "Adversarial Engineer", content: "Help us design agents that are more effective at breaking the logic of the world's most powerful LLMs." },
      { title: "Consensus Architect", content: "Optimize our federated weighting systems for faster, more reliable institutional outcomes." }
    ]
  },
  privacy: {
    title: "Privacy Policy",
    subtitle: "Protecting Institutional and Individual Intelligence",
    introduction: "EthersFlow is committed to protecting the privacy of our users. This Privacy Policy outlines our strict data sovereignty standards, on-device Zero-Trust local tokenization, and our platform-wide Zero-Data-Retention (ZDR) Sovereign Storage Clause.",
    sections: [
      { title: "1. Device-Level Zero-Trust Privacy Vault", content: "We operate on a zero-vulnerability data model. Prior to routing any query or uploaded document to outer API providers, EthersFlow executes pre-dispatch local tokenization on your localized device. Your sensitive credentials, wallet addresses, and private names are sanitized and swapped with dummy placeholders in-memory—ensuring PII never leaves your machine." },
      { title: "2. Zero-Data-Retention (ZDR) & Zero-Training Mandate", content: "Under our Sovereign Storage Clause, we enforce absolute Zero-Data-Retention on our servers. Your proprietary prompts, files, and conversation histories are persisted only within your local client state (e.g. localStorage) and never written to permanent backend logs or shared for LLM model training. All session transactions are processed in-memory and discarded instantly on connection shutdown." },
      { title: "3. Enterprise Isolated Consensus Tunnels", content: "For team and institutional clients, we provide isolated private VPC nodes. Outgoing API transfers are piped via TLS 1.3 secure tunnels with end-to-end data sanitization, verifying that institutional knowledge deposits never mix with standard public queues." },
      { title: "4. Information Disclosure and API Governance", content: "Inference queries are federated across third-party expert model providers (Google, Anthropic, OpenAI) solely to perform real-time adversarial debate. All outbound routes are shielded by our neural proxies, contractual agreements, and immediate garbage-collection pipelines." },
      { title: "5. Your Global Rights and Controls", content: "Whether subject to GDPR, CCPA, or professional fin-tech frameworks, EthersFlow gives you total localized command. You have the right to wipe your entire localized database, custom persona profiles, and shared consensus states instantly with a single button click in your settings." }
    ]
  },
  security: {
    title: "Security & Compliance",
    subtitle: "Defense-in-Depth for Enterprise Reasoning",
    introduction: "EthersFlow is engineered for sectors where information integrity is non-negotiable. Our security posture is validated against SOC2 Type II standards and modeled after high-performance computing benchmarks, ensuring that logical debate is never compromised by infrastructure vulnerabilities.",
    sections: [
      { title: "1. Neural Proxy Architecture", content: "All outgoing requests to model providers are handled via our proprietary secure-proxy layer. This layer enforces TLS 1.3, strips identifying headers, and applies 'Adversarial Cleansing' to outbound prompts to prevent data leakage and ensure privacy." },
      { title: "2. Evidence-Based Logic Log", content: "Every logical step taken by every agent in the EthersFlow FAC protocol is logged in a verified, integrity-protected analysis trail. This ensures that the provenance of every 'Confidence Metric' can be reviewed by institutional compliance officers." },
      { title: "3. Access Control & SSO", content: "Enterprise clients benefit from SAML 2.0 and OIDC integrations, allowing for centralized management of reasoning permissions. Our Internal Access policy is 'Zero-Standard-Access', meaning EthersFlow engineers cannot view customer data without explicit, time-bounded approval." }
    ]
  },
  terms: {
    title: "Terms of Service",
    subtitle: "Governing the Verifiable Reasoning Workspace",
    introduction: "These Terms of Service govern your access to and use of EthersFlow's adversarial reasoning platform. By using our services, you agree to these terms, which are constructed to defend absolute client data sovereignty, privacy protocols, and high SLA-backed performance guarantees.",
    sections: [
      { title: "1. Intellectual Property & 100% Data Sovereignty", content: "You retain all rights, title, and ownership over any files, inputs, and custom personas uploaded to EthersFlow. EthersFlow claims no ownership over the generated Consensus Verdicts, reports, or synthesis assets. All compiled analytical evidence products belong strictly to you." },
      { title: "2. SLA Performance & Sovereign Recovery Guarantee", content: "Our services are wrapped with an active 45-second Multi-Agent Maximum processing SLA limit. To ensure reasoning integrity never impedes active operations, any consensus sub-tasks exceeding 45,000 ms of execution are automatically failed over and rerouted via secondary backup Sovereign Recovery pipelines, ensuring stable completion metrics." },
      { title: "3. Acceptable Use and Neutrality Protection", content: "EthersFlow is a decision support mechanism. You agree not to exploit our platform to feed malicious inputs, execute Denial-of-Service attacks against integrated frontier APIs, or inject training poisons. We enforce automated rate limits to preserve structural alignment for all participants." },
      { title: "4. No Financial Liability", content: "EthersFlow provides probabilistic consensus synthesis for educational, auditing, and research activities. It does not issue official investment advice. Decisions made using EthersFlow reports are the sole responsibility of the human operators and analysts." }
    ]
  },
  tutorials: {
    title: "Platform Tutorials",
    subtitle: "Mastering Adversarial Consensus",
    introduction: "New to adversarial reasoning? These guides will help you deploy multi-model intelligence stacks.",
    sections: [
      { title: "Getting Started", content: "Learn the basics of issuing directives, configuring agent personas, and interpreting the consensus engine's confidence metrics." },
      { title: "Advanced Prompting", content: "Techniques for crafting complex queries that maximize the adversarial impact of your Red Team agents." }
    ]
  },
  courses: {
    title: "Consensus Certification",
    subtitle: "Professional Reasoning Architecture",
    introduction: "In-depth courses on the philosophy and engineering behind federated adversarial consensus.",
    sections: [
      { title: "AI Rigor 101", content: "A foundational course on identified model biases and the necessity of independent verification in enterprise AI." },
      { title: "Enterprise Deployment", content: "How to integrate EthersFlow into existing institutional decision-making pipelines." }
    ]
  },
  help: {
    title: "Support Center",
    subtitle: "Institutional Grade Assistance",
    introduction: "Need help navigating EthersFlow? Our support team and documentation are here to ensure your reasoning never halts.",
    sections: [
      { title: "FAQ", content: "Answers to common questions about billing, agent configurations, and data privacy." },
      { title: "Contact Support", content: "Reach out to our engineering team for deep technical assistance or custom deployment needs." }
    ]
  },
  contact: {
    title: "Contact Us",
    subtitle: "Inquiries & Institutional Relations",
    introduction: "Have inquiries or want to integrate EthersFlow into your workspace? Get in touch with our team for custom deployments, deep technical assistance, or general questions.",
    sections: [
      { title: "General & Support Email", content: "For direct support, partnership opportunities, or media inquiries, reach out to us at: ethersflow.dev@gmail.com" },
      { title: "Enterprise Integrations", content: "To arrange dedicated node deployments, custom SLAs, or premium training session packages, reach our architecture desk at: ethersflow.dev@gmail.com" }
    ]
  }
};
