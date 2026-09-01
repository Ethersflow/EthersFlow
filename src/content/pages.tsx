import React from 'react';
import { View } from '../types';

export const PAGE_CONTENT: Partial<Record<Exclude<View, 'main'>, { 
  title: string; 
  subtitle: string; 
  introduction: string; 
  sections: { title: string; content: string; icon?: React.ReactNode }[] 
}>> = {
  protocol: {
    title: "Review Protocol",
    subtitle: "A review protocol that makes AI decisions inspectable before they execute.",
    introduction: "EthersFlow routes a request through specialized reviewers, records disagreement and provenance, and returns a policy-aware result with evidence and escalation paths.",
    sections: [
      { 
        title: "1. Sanitize the Input", 
        content: "Prior to routing, sensitive inputs and credentials are sanitized locally to maintain data integrity and prevent unintended exposure across downstream providers." 
      },
      { 
        title: "2. Assign Reviewers", 
        content: "The request is assigned to independent reviewer roles across diverse model architectures (e.g. Transformer, Mixture-of-Experts, and Reasoning models) to evaluate the decision from distinct perspectives." 
      },
      { 
        title: "3. Cross-Examine the Decision", 
        content: "Reviewers independently cross-examine reasoning chains, surface contradictions, and identify unverified assumptions before any consequential action is approved." 
      },
      { 
        title: "4. Resolve with Evidence and Policy", 
        content: "The protocol resolves the review through policy-aware evaluation. The system calculates consensus alignment scores, verifies quorum, and attaches an inspectable review trace." 
      },
      {
        title: "Verification Metrics & Distinctions",
        content: "EthersFlow explicitly distinguishes Consensus Alignment Score (degree of inter-reviewer agreement), Confidence and Evidence Status (strength of empirical verification), Quorum (minimum required reviewer participation), and Action-Gate Outcome (policy approval, rejection, or human escalation)."
      }
    ]
  },
  pricing: {
    title: "Verification That Scales",
    subtitle: "Verification that scales with the consequence of the action.",
    introduction: "Choose the review configuration, latency class, and policy enforcement level matched to your workflow requirements.",
    sections: [
      { 
        title: "Sandbox Verification", 
        content: "Free exploration with 3 base reviewers. Test review policies and adversarial evaluation in an interactive, client-side environment." 
      },
      { 
        title: "Production Review", 
        content: "Starting at $49/mo per seat. Full access to independent review teams, audit evidence traces, API/MCP tool verification, and automated fallback routing." 
      },
      { 
        title: "Deep Analysis", 
        content: "Advanced multi-model review teams with deep grounding, comprehensive source reports, dissent analysis, and elevated throughput limits." 
      },
      { 
        title: "Team Control", 
        content: "Collaborative review policies, shared templates, role-based controls, team audit exports, and dedicated human escalation workflows." 
      },
      { 
        title: "Sovereign Deployment", 
        content: "Dedicated VPC instances, custom model routing, custom reviewer profiles, and isolated infrastructure for regulated enterprise environments." 
      }
    ]
  },
  about: {
    title: "About EthersFlow",
    subtitle: "The verification layer for agentic systems.",
    introduction: "EthersFlow builds the review, routing, and evidence systems that help teams inspect model disagreement, enforce policies before consequential actions, and preserve a record of how decisions were reached.",
    sections: [
      { 
        title: "Federated Adversarial Consensus (FAC)", 
        content: "Federated Adversarial Consensus is our protocol for coordinating independent reviewer roles, model routing, adversarial challenge, quorum evaluation, and evidence synthesis." 
      },
      { 
        title: "From Model Output to Accountable Action", 
        content: "We do not build models; we build the verification infrastructure that makes AI decisions inspectable, challengeable, evidence-backed, and controllable before execution." 
      },
      { 
        title: "Inspectable Review Traces", 
        content: "As autonomous agents take more consequential actions in production, EthersFlow ensures every decision is supported by visible disagreement, verified sources, and clear policy controls." 
      }
    ]
  },
  research: {
    title: "Research & Development",
    subtitle: "Studying how independent review can reduce single-model decision risk.",
    introduction: "This work supports the premise that independent review can expose errors that single-model self-correction may miss. It does not by itself validate every implementation or deployment outcome.",
    sections: [
      { 
        title: "External Research", 
        content: "Evaluating peer-reviewed studies on multi-agent debate, model dependency clusters, and self-correction failure modes across foundation models." 
      },
      { 
        title: "EthersFlow Protocol Specification", 
        content: "Formal specifications for Federated Adversarial Consensus, reviewer coordination, quorum evaluation, and evidence synthesis." 
      },
      { 
        title: "EthersFlow Benchmarks", 
        content: "Empirical testing measuring contradiction detection, latency tradeoffs, and fallback reliability across diverse model configurations." 
      }
    ]
  },
  careers: {
    title: "Join the Team",
    subtitle: "Build the infrastructure that makes AI actions accountable.",
    introduction: "We are building the review, routing, and evidence systems that help autonomous software operate safely under uncertainty.",
    sections: [
      { 
        title: "Distributed Consensus Engineer", 
        content: "Design resilient review pipelines, optimize model routing, and implement fallback continuity across asynchronous multi-agent workflows." 
      },
      { 
        title: "Adversarial Evaluation Engineer", 
        content: "Build automated adversarial testing frameworks to systematically stress-test reasoning chains and detect unverified assumptions." 
      },
      { 
        title: "Security & Governance Architect", 
        content: "Develop policy enforcement engines, evidence provenance logging, and zero-retention verification pipelines for enterprise deployments." 
      }
    ]
  },
  privacy: {
    title: "Privacy Policy",
    subtitle: "Data Handling, Privacy & Retention Policy",
    introduction: "EthersFlow is designed to minimize data retention and supports configurable zero-retention processing for eligible plans and routes. Data handling depends on the product surface, provider, deployment mode, and customer configuration.",
    sections: [
      { 
        title: "1. Product Surfaces & Data Flows", 
        content: "EthersFlow distinguishes data flows across the Console, API Gateway, MCP server, provider calls, fallback calls, source reports, webhooks, cryptographic hashes, customer support, and billing records." 
      },
      { 
        title: "2. Configurable Zero-Retention Processing", 
        content: "For eligible plans and API routes, customer queries and tool payloads are processed ephemerally in-memory and not retained on EthersFlow servers. Session histories in the Console are stored in local browser state unless explicitly saved." 
      },
      { 
        title: "3. Third-Party Model Providers", 
        content: "Review queries are routed to selected upstream model providers solely to generate reviewer evaluations. Requests are governed by provider data policies and applicable provider and enterprise data-processing terms." 
      },
      { 
        title: "4. Fallback Routing & Provenance", 
        content: "When a requested provider experiences rate limits, fallback routing records the requested model, resolved model, trigger cause, and quorum impact in the inspectable review trace." 
      },
      { 
        title: "5. Data Subject Rights & Local Controls", 
        content: "Users can clear local session data, custom reviewer configurations, and cached reports directly through platform settings at any time." 
      }
    ]
  },
  security: {
    title: "Security & Policy Enforcement",
    subtitle: "Defense-in-Depth for Autonomous and Agentic Systems",
    introduction: "EthersFlow provides policy-enforced, provenance-aware review at the tool boundary, ensuring AI actions are verified and auditable before execution.",
    sections: [
      { 
        title: "1. Tool Boundary Enforcement", 
        content: "Intercept agent actions, tool calls, and high-consequence outputs before execution, requiring policy evaluation and quorum approval." 
      },
      { 
        title: "2. Inspectable Review Traces", 
        content: "Every reviewer evaluation, dissent, source citation, and confidence score is recorded in an auditable review trace with cryptographic integrity verification." 
      },
      { 
        title: "3. Access Control, SSO & KMS", 
        content: "Enterprise clients benefit from SAML 2.0 / OIDC SSO, granular tenant isolation, and custom Key Management Service (KMS) integration for complete credential sovereignty." 
      }
    ]
  },
  terms: {
    title: "Terms of Service",
    subtitle: "Terms of Use for EthersFlow Verification Services",
    introduction: "These Terms of Service govern access to and use of EthersFlow's verification platform, APIs, and review protocols.",
    sections: [
      { 
        title: "1. Key Definitions", 
        content: "These Terms define Review Configuration (the configured roles, models, and thresholds), Quorum (minimum required reviewer participation), Fallback Routing (continuity routing when a provider is unavailable), Partial Result (a review where quorum was incomplete), Verified Result (a synthesis meeting all policy criteria), Human Escalation (routing unresolvable cases to human review), Source Report (the evidence, citations, and dissent breakdown), and Action Gate (the policy boundary enforcing verification before tool execution)." 
      },
      { 
        title: "2. Probabilistic Review & Human Oversight", 
        content: "EthersFlow provides a probabilistic multi-reviewer mechanism, not an absolute guarantee of correctness. The platform surfaces contradictions and evidence to assist decision-making; human operators remain ultimately responsible for high-impact or regulated actions." 
      },
      { 
        title: "3. Continuity & Fallback Routing", 
        content: "EthersFlow attempts to preserve continuity through configured fallback routes. If quorum cannot be reached, the result is marked incomplete and is not eligible for verified action approval." 
      },
      { 
        title: "4. Data Ownership & Customer Intellectual Property", 
        content: "Customers retain all rights, title, and interest in their input data, review configurations, custom prompts, and output reports. EthersFlow claims no ownership over reviewed results." 
      }
    ]
  },
  tutorials: {
    title: "Platform Guides",
    subtitle: "Configuring Independent Review Policies",
    introduction: "Step-by-step guides to designing review configurations, integrating tool-boundary verification, and inspecting review traces.",
    sections: [
      { title: "Review Configuration", content: "Learn how to select reviewer roles, configure model routing, and calibrate consensus alignment thresholds." },
      { title: "Tool Boundary Protection", content: "Techniques for wiring EthersFlow API and MCP action gates into autonomous agent execution loops." }
    ]
  },
  courses: {
    title: "Verification Engineering",
    subtitle: "Architecture for Agentic Reliability",
    introduction: "In-depth modules on multi-model review, adversarial challenge dynamics, and policy enforcement.",
    sections: [
      { title: "Independent Review Fundamentals", content: "Understanding single-model failure modes and the mechanics of multi-architecture cross-examination." },
      { title: "Production Enforcement", content: "Implementing inspectable review traces, quorum policies, and fallback continuity in enterprise workflows." }
    ]
  },
  help: {
    title: "Support Center",
    subtitle: "Technical & Integration Assistance",
    introduction: "Documentation, FAQs, and engineering support for deploying EthersFlow in production.",
    sections: [
      { title: "Documentation & FAQ", content: "Answers to common questions regarding API keys, model support, reviewer roles, and data handling." },
      { title: "Engineering Support", content: "Direct access to our architecture desk for custom integrations and deployment troubleshooting." }
    ]
  },
  contact: {
    title: "Get in touch with EthersFlow",
    subtitle: "Discuss a Protected Workflow or Request Assistance",
    introduction: "Connect with our team to discuss your review workflow, AI application, or agent architecture, verification policies, deployment modes, or technical questions.",
    sections: [
      { title: "General & Technical Inquiries", content: "For direct support, API access, or developer feedback, contact us at: ethersflow.dev@gmail.com" },
      { title: "Enterprise Deployments", content: "To discuss a protected workflow, custom SLAs, private VPC deployments, or high-volume action verification, contact: ethersflow.dev@gmail.com" }
    ]
  }
};
