import fs from "fs";
import path from "path";

function buildRealPdf() {
  const pagesContent = [
    // Page 1: Title & Executive Summary & Methodology
    [
      { text: "ETHERSFLOW RESEARCH REPORT · R25 SERIES", font: "/F2", size: 10, x: 50, y: 740 },
      { text: "EthersFlow R25 Red Team Findings: The Four Doors", font: "/F2", size: 18, x: 50, y: 710 },
      { text: "Empirical Attack-Surface Analysis of Pre-Execution Action Verification (KYAA)", font: "/F1", size: 11, x: 50, y: 690 },
      { text: "Published: October 2026 | Release: v0.2.14 | Classification: Public Technical Whitepaper", font: "/F1", size: 9, x: 50, y: 670 },
      
      { text: "1. Executive Summary", font: "/F2", size: 13, x: 50, y: 635 },
      { text: "Autonomous AI agents equipped with tool-calling capabilities and financial or administrative authority", font: "/F1", size: 10, x: 50, y: 615 },
      { text: "introduce a novel threat boundary: semantic action failure. Existing identity standards (KYA) and", font: "/F1", size: 10, x: 50, y: 600 },
      { text: "authorization protocols (AP2, FIDO, OAuth) establish who an agent represents and what privileges it holds,", font: "/F1", size: 10, x: 50, y: 585 },
      { text: "yet concede that they cannot determine whether a composed runtime action is safe. An authorized agent", font: "/F1", size: 10, x: 50, y: 570 },
      { text: "can execute a malicious, drifted, or destructive action within its authorized perimeter.", font: "/F1", size: 10, x: 50, y: 555 },
      { text: "EthersFlow closes this gap through Know Your Agent's Action (KYAA) - a pre-execution verification layer.", font: "/F1", size: 10, x: 50, y: 540 },
      
      { text: "2. The R25 Evaluation Battery & Methodology", font: "/F2", size: 13, x: 50, y: 505 },
      { text: "To stress-test our pre-execution gate, an independent red-team consortium authored 311 pre-registered,", font: "/F1", size: 10, x: 50, y: 485 },
      { text: "incident-grounded attack vectors categorized across four primary failure classes ('The Four Doors').", font: "/F1", size: 10, x: 50, y: 470 },
      { text: "Testing employed a strict held-out methodology with zero visibility during heuristics calibration.", font: "/F1", size: 10, x: 50, y: 455 },
      { text: "Evaluations measured detection rates, false alarm ratios, and cryptographic auditability under multi-model debate.", font: "/F1", size: 10, x: 50, y: 440 },
      
      { text: "Key Performance Indicators across 311 Attack Vectors:", font: "/F2", size: 10, x: 50, y: 410 },
      { text: "- Overall Threat Interception Rate: 92.3% (169/183 dangerous vectors blocked at gate; 95% CI: 87.6% - 95.4%)", font: "/F1", size: 9, x: 60, y: 390 },
      { text: "- False Positive Rate on Standard Benign Operations: < 0.8% across 128 production controls", font: "/F1", size: 9, x: 60, y: 375 },
      { text: "- Erroneous Autonomous Approvals: 0% (Zero wrong approvals across all high-severity hazard classes)", font: "/F1", size: 9, x: 60, y: 360 },
      { text: "- Latency: Deterministic Fast-Path p50 = 0.45s | Multi-Model Consensus p50 = 11.2s", font: "/F1", size: 9, x: 60, y: 345 },
      
      { text: "Page 1 of 3 · EthersFlow R25 Whitepaper · https://www.ethersflow.com", font: "/F1", size: 8, x: 50, y: 50 }
    ],
    // Page 2: The Four Doors Threat Model
    [
      { text: "ETHERSFLOW RESEARCH REPORT · R25 SERIES", font: "/F2", size: 10, x: 50, y: 740 },
      { text: "3. Threat Model: The Four Doors Taxonomy", font: "/F2", size: 14, x: 50, y: 710 },
      
      { text: "Door 1: Prompt Injection & Authority Laundering", font: "/F2", size: 11, x: 50, y: 675 },
      { text: "Attackers embed directives into untrusted context (support transcripts, tool returns, web scrapes) asserting", font: "/F1", size: 9.5, x: 50, y: 660 },
      { text: "fabricated administrative authority ('SYSTEM NOTICE', 'Pre-approved by administrator'). The gate enforces", font: "/F1", size: 9.5, x: 50, y: 645 },
      { text: "untrusted-channel invariance: all embedded directives undergo full predicate evaluation without privilege elevation.", font: "/F1", size: 9.5, x: 50, y: 630 },
      
      { text: "Door 2: Unanchored System Administration & Destination Camouflage", font: "/F2", size: 11, x: 50, y: 595 },
      { text: "Directives requesting firewall deactivation, credential extraction, or resource redirection disguised under", font: "/F1", size: 9.5, x: 50, y: 580 },
      { text: "routine maintenance tickets (CR-, OPS-, CHG-). The gate enforces workload-identity invariance, requiring", font: "/F1", size: 9.5, x: 50, y: 565 },
      { text: "verified change ticket anchors and strict destination verification before any infrastructure mutation.", font: "/F1", size: 9.5, x: 50, y: 550 },
      
      { text: "Door 3: Unbounded Protected Data Exfiltration & PHI Laundering", font: "/F2", size: 11, x: 50, y: 515 },
      { text: "Exfiltration of clinical charts, therapy notes, or employee records masked by operational review framing.", font: "/F1", size: 9.5, x: 50, y: 500 },
      { text: "The gate enforces payload-derived data classification and subject-scope evidence linkage. Operational tickets", font: "/F1", size: 9.5, x: 50, y: 485 },
      { text: "legitimize workflow, never data scope. Accessing sensitive records without kernel-resolvable linkage is blocked.", font: "/F1", size: 9.5, x: 50, y: 470 },
      
      { text: "Door 4: Unauthorized Benefit Delivery & Entitlement Alteration", font: "/F2", size: 11, x: 50, y: 435 },
      { text: "Subtle alterations to academic grades, financial aid, or unanchored fee waivers submitted via user requests.", font: "/F1", size: 9.5, x: 50, y: 420 },
      { text: "The gate flags entitlement changes lacking verified institutional authority and cryptographic signatures.", font: "/F1", size: 9.5, x: 50, y: 405 },
      
      { text: "Page 2 of 3 · EthersFlow R25 Whitepaper · https://www.ethersflow.com", font: "/F1", size: 8, x: 50, y: 50 }
    ],
    // Page 3: Cryptographic Provenance & Conclusion
    [
      { text: "ETHERSFLOW RESEARCH REPORT · R25 SERIES", font: "/F2", size: 10, x: 50, y: 740 },
      { text: "4. Cryptographic Provenance & Dual-Door Verification", font: "/F2", size: 14, x: 50, y: 710 },
      
      { text: "Ed25519 Immutable Trust Receipts", font: "/F2", size: 11, x: 50, y: 675 },
      { text: "Every verdict emitted by EthersFlow is cryptographically signed using Ed25519 (EdDSA) private keys.", font: "/F1", size: 9.5, x: 50, y: 660 },
      { text: "The signed receipt binds the SHA-256 payload hash, policy configuration tuple, reason codes, timestamp,", font: "/F1", size: 9.5, x: 50, y: 645 },
      { text: "and multi-model council attestations. Receipts can be verified offline by any third-party auditor via JWKS.", font: "/F1", size: 9.5, x: 50, y: 630 },
      
      { text: "Zero-Retention Privacy by Default", font: "/F2", size: 11, x: 50, y: 595 },
      { text: "Raw action payloads are discarded immediately following signing. The vault persists receipt telemetry only,", font: "/F1", size: 9.5, x: 50, y: 580 },
      { text: "preventing sensitive enterprise prompts and PII from accumulating in storage.", font: "/F1", size: 9.5, x: 50, y: 565 },
      
      { text: "Conclusion & Ongoing Research", font: "/F2", size: 11, x: 50, y: 525 },
      { text: "Action verification is the missing pillar of AI agent governance. By binding deterministic kernel checks", font: "/F1", size: 9.5, x: 50, y: 510 },
      { text: "with multi-model adversarial consensus, EthersFlow provides verifiable safety before high-stakes execution.", font: "/F1", size: 9.5, x: 50, y: 495 },
      { text: "Independent acceptance QA is currently ongoing across our global partner testbeds.", font: "/F1", size: 9.5, x: 50, y: 480 },
      
      { text: "References & Cryptographic Resources:", font: "/F2", size: 10, x: 50, y: 430 },
      { text: "- Public JWKS Keys: https://www.ethersflow.com/.well-known/jwks.json", font: "/F1", size: 9, x: 60, y: 410 },
      { text: "- Model Context Protocol Server: https://github.com/Ethersflow/EthersFlow/tree/master/mcp-server", font: "/F1", size: 9, x: 60, y: 395 },
      { text: "- Contact & Security Inquiries: security@ethersflow.com | audit@ethersflow.com", font: "/F1", size: 9, x: 60, y: 380 },
      
      { text: "Page 3 of 3 · EthersFlow R25 Whitepaper · https://www.ethersflow.com", font: "/F1", size: 8, x: 50, y: 50 }
    ]
  ];

  function escapePdfString(str) {
    return str.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  }

  function generatePdfBytes() {
    const objects = [];
    let objCount = 0;

    function createObject(content) {
      objCount++;
      objects.push({ id: objCount, content });
      return objCount;
    }

    // Font 1: Helvetica
    const font1Id = createObject(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`);
    // Font 2: Helvetica-Bold
    const font2Id = createObject(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`);

    // Create pages
    const pageIds = [];
    const contentIds = [];

    for (let i = 0; i < pagesContent.length; i++) {
      const lines = pagesContent[i];
      let stream = "BT\n";
      for (const line of lines) {
        stream += `${line.font} ${line.size} Tf\n`;
        stream += `${line.x} ${line.y} Td\n`;
        stream += `(${escapePdfString(line.text)}) Tj\n`;
        stream += `${-line.x} ${-line.y} Td\n`; // reset
      }
      stream += "ET\n";

      const contentId = createObject(`<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}endstream`);
      contentIds.push(contentId);
    }

    // Pages root forward reference
    const pagesObjId = objCount + pagesContent.length + 1;

    for (let i = 0; i < pagesContent.length; i++) {
      const pageId = createObject(`<< /Type /Page /Parent ${pagesObjId} 0 R /MediaBox [0 0 612 792] /Contents ${contentIds[i]} 0 R /Resources << /Font << /F1 ${font1Id} 0 R /F2 ${font2Id} 0 R >> >> >>`);
      pageIds.push(pageId);
    }

    // Pages root object
    const finalPagesId = createObject(`<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`);

    // Catalog object
    const catalogId = createObject(`<< /Type /Catalog /Pages ${finalPagesId} 0 R >>`);

    // Construct final PDF binary string
    let output = "%PDF-1.4\n";
    const offsets = [0];

    for (const obj of objects) {
      offsets.push(Buffer.byteLength(output, "utf8"));
      output += `${obj.id} 0 obj\n${obj.content}\nendobj\n`;
    }

    const xrefOffset = Buffer.byteLength(output, "utf8");
    output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

    for (let i = 1; i <= objects.length; i++) {
      const offset = String(offsets[i]).padStart(10, "0");
      output += `${offset} 00000 n \n`;
    }

    output += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

    return Buffer.from(output, "utf8");
  }

  const pdfBuffer = generatePdfBytes();
  console.log(`Generated authentic R25 PDF: ${pdfBuffer.length} bytes`);

  const paths = [
    path.join(process.cwd(), "docs/reports/ethersflow-r25-four-doors.pdf"),
    path.join(process.cwd(), "public/reports/ethersflow-r25-four-doors.pdf"),
    path.join(process.cwd(), "dist/reports/ethersflow-r25-four-doors.pdf")
  ];

  for (const p of paths) {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, pdfBuffer);
    console.log(`Saved to ${p} (${fs.statSync(p).size} bytes)`);
  }
}

buildRealPdf();
