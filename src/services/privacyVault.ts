/**
 * EthersFlow Data Privacy Vault
 * Specialized sanitization and detokenization utility to enforce Zero-Trust Multi-Agent pipelines.
 * 
 * Provides automated PII masking, tokenization, and subsequent detokenization layers 
 * to ensure sensitive enterprise data is never exposed to external public LLM APIs.
 */

export interface TokenizedResult {
  sanitizedText: string;
  vault: Map<string, string>; // Maps randomized tokens (e.g., "[PII_EMAIL_1]") to original values
}

// Simple deterministic and safe PII matching patterns
const PII_PATTERNS = {
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  PHONE: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  CREDIT_CARD: /\b(?:\d[ -]*?){13,16}\b/g, // Handles standard 13-16 digit cards
  IP_ADDRESS: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
  US_SSN: /\b\d{3}-\d{2}-\d{4}\b/g,
  // Proprietary Ethereum/EVM Private Key (64-character hexadecimal, optional 0x prefix)
  EVM_PRIVATE_KEY: /\b(?:0x)?[a-fA-F0-9]{64}\b/g,
};

/**
 * Automator to mask all sensitive variables in a raw text prompt
 * before dispatching to external model vendors (OpenAI, Gemini, Anthropic, Groq).
 */
export function maskSensitiveData(text: string): TokenizedResult {
  const vault = new Map<string, string>();
  let sanitizedText = text;
  
  let emailCount = 0;
  let phoneCount = 0;
  let ccCount = 0;
  let ipCount = 0;
  let ssnCount = 0;
  let keyCount = 0;

  // 1. Mask EVM Private Keys
  sanitizedText = sanitizedText.replace(PII_PATTERNS.EVM_PRIVATE_KEY, (match) => {
    keyCount++;
    const token = `[SECRET_KEY_${keyCount}]`;
    vault.set(token, match);
    return token;
  });

  // 2. Mask Emails
  sanitizedText = sanitizedText.replace(PII_PATTERNS.EMAIL, (match) => {
    emailCount++;
    const token = `[CLIENT_EMAIL_${emailCount}]`;
    vault.set(token, match);
    return token;
  });

  // 3. Mask Phone Numbers
  sanitizedText = sanitizedText.replace(PII_PATTERNS.PHONE, (match) => {
    phoneCount++;
    const token = `[CLIENT_PHONE_${phoneCount}]`;
    vault.set(token, match);
    return token;
  });

  // 4. Mask Credit Cards
  sanitizedText = sanitizedText.replace(PII_PATTERNS.CREDIT_CARD, (match) => {
    ccCount++;
    const token = `[FIN_CARD_${ccCount}]`;
    vault.set(token, match);
    return token;
  });

  // 5. Mask IPs
  sanitizedText = sanitizedText.replace(PII_PATTERNS.IP_ADDRESS, (match) => {
    ipCount++;
    const token = `[NET_IP_${ipCount}]`;
    vault.set(token, match);
    return token;
  });

  // 6. Mask SSN
  sanitizedText = sanitizedText.replace(PII_PATTERNS.US_SSN, (match) => {
    ssnCount++;
    const token = `[GOV_ID_${ssnCount}]`;
    vault.set(token, match);
    return token;
  });

  return { sanitizedText, vault };
}

/**
 * Detokenizes modeled response text returned from public vendors, 
 * filling the masked entities back with their original real values.
 */
export function restoreSensitiveData(tokenizedText: string, vault: Map<string, string>): string {
  let restoredText = tokenizedText;
  
  // Iterate and replace back each placeholder securely
  for (const [token, originalValue] of vault.entries()) {
    // Escape string for safety in global regex replacement
    const escapedToken = token.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(escapedToken, 'g');
    restoredText = restoredText.replace(regex, originalValue);
  }

  return restoredText;
}
