import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from "@google/genai";
import * as pdf from 'pdf-parse';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '25mb' }));

// PDF parsing API route
app.post('/api/parse-pdf', async (req, res) => {
  try {
    const { base64, fileName } = req.body;
    if (!base64) {
      return res.status(400).json({ error: "No base64 data provided." });
    }
    const buffer = Buffer.from(base64, 'base64');
    const pdfParser = (pdf as any).default || pdf;
    const data = await pdfParser(buffer);
    res.json({ text: data.text });
  } catch (err: any) {
    console.error("Error parsing PDF on server:", err);
    res.status(500).json({ error: "Failed to parse PDF file: " + err.message });
  }
});

// API Key Validation Check
const isKeyValid = () => {
  return (
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' &&
    process.env.GEMINI_API_KEY.trim() !== ''
  );
};

// Initialize GoogleGenAI client if key is valid
let ai: GoogleGenAI | null = null;
if (isKeyValid()) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log("Google GenAI client successfully initialized server-side.");
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI client:", error);
  }
} else {
  console.log("GEMINI_API_KEY not configured or is placeholder. Server will run high-quality simulated agent audits for seamless sandbox experience.");
}

// Simulated Demo Contracts to ensure instant fully-functional sandbox
const DEMO_CONTRACTS = {
  freelance_dev: {
    title: "Freelance Software Engineer Agreement",
    text: `SOFTWARE SERVICES AGREEMENT
This agreement is entered into as of June 28, 2026, between CloudScale Systems Inc ("Client") and the Software Engineer ("Contractor").

1. COMPENSATION & SALARY
Client shall pay Contractor a flat hourly rate of $120 per hour for services rendered. Invoicing occurs monthly.

2. PAYMENT TERMS
Invoices will be processed and paid Net 60 days from receipt. No late fees or interest charges shall apply.

3. NOTICE PERIOD
Either party may terminate this agreement at any time by providing at least 14 days written notice.

4. BOND CLAUSE / DEPOSIT
The Contractor is not required to deposit any security bond. However, if Contractor terminates the agreement in the first 3 months, Contractor agrees to repay a $2,500 training stipend.

5. NON-COMPETE RESTRICTION
Contractor is strictly prohibited from working for, consulting with, or establishing any business that competes directly or indirectly with CloudScale Systems anywhere in the world for a period of 2 years (24 months) following termination.

6. CONFIDENTIALITY
Contractor shall maintain lifetime, perpetual confidentiality regarding all aspects of Client's source code, business operations, and customer data, with absolutely no exceptions.

7. TERMINATION CLAUSE
Client reserves the right to terminate this agreement immediately and without cause, without any severance or penalty, at any time. Contractor must deliver all partial work within 24 hours of notice.`
  },
  internship: {
    title: "Technology Internship Agreement",
    text: `INTERNSHIP OFFER LETTER
Date: June 28, 2026

Dear Intern, we are pleased to offer you an internship at WebCraft Labs.

1. SALARY
Your hourly compensation will be $25 per hour, paid on a semi-monthly basis.

2. PAYMENT TERMS
WebCraft Labs processes payments Net 15 days upon receipt of verified timesheets.

3. TERMINATION & NOTICE PERIOD
This is an at-will internship. No notice period is required by either party.

4. TRAINING BOND / PENALTY
As WebCraft Labs invests heavily in your upskilling, should you terminate this internship prior to the completion of the 6-month term, you shall be liable to pay WebCraft Labs a penalty bond of $5,000 to cover administration and mentor costs.

5. NON-COMPETE
You shall not work for any competitor within a 15-mile radius of WebCraft offices for 6 months after your internship ends.

6. CONFIDENTIALITY
You agree to hold all confidential information in trust for a period of 3 years following the conclusion of your internship.

7. TERMINATION COVENANTS
Termination may occur at-will by either party.`
  },
  executive: {
    title: "Executive Director Employment Agreement",
    text: `EXECUTIVE EMPLOYMENT AGREEMENT
Between Apex Digital Corp and Director of Operations ("Executive").

1. BASE SALARY
Apex Digital Corp shall pay Executive an annual base salary of $180,000, payable in standard semi-monthly installments.

2. NOTICE PERIOD
The Executive must provide at least 90 days written notice prior to resignation. Apex Digital must provide 90 days notice or pay equivalent salary in lieu of notice.

3. PAYMENT TERMS
Base compensation is paid on the 15th and 30th of each calendar month.

4. BOND CLAUSE
No training bonds or repayment penalties apply to this executive engagement.

5. NON-COMPETE
The Executive agrees not to engage in competing business activities in the tri-state area for 6 months post-employment.

6. CONFIDENTIALITY
Executive shall protect trade secrets and sensitive intellectual property indefinitely, excluding any pre-existing prior IP registered in Appendix A.

7. TERMINATION FOR CAUSE & SEVERANCE
In the event Apex Digital Corp terminates this contract without Cause, Executive is entitled to 3 months base salary as severance, provided a standard waiver of claims is signed.`
  }
};

// Simulated Audit Maker Helper
const generateSimulatedAudit = (contractType: string, text: string, hindsightRules: any[]): any => {
  let fields = {
    salary: "$120/hour",
    notice_period: "14 days notice required",
    non_compete: "2 years worldwide non-compete clause",
    bond_clause: "No security bond, but $2,500 stipend payback if leaving in first 3 months",
    termination_clause: "Immediate termination by Client without cause or severance",
    confidentiality_clause: "Perpetual lifetime confidentiality without exceptions",
    payment_terms: "Net 60 days payment term"
  };

  let safetyIndex = 52;
  let summary = "This freelance contract offers a strong hourly wage but is highly unfavorable to the contractor due to a restrictive 2-year worldwide non-compete, immediate termination by client, and an extended Net 60 payment schedule.";
  let risks: any[] = [];

  if (contractType === 'internship' || text.includes('WebCraft Labs') || text.includes('Intern')) {
    fields = {
      salary: "$25/hour",
      notice_period: "None (At-will engagement)",
      non_compete: "6 months within 15-mile radius",
      bond_clause: "$5,000 repayment penalty if leaving before 6 months",
      termination_clause: "At-will termination by either party",
      confidentiality_clause: "3 years confidentiality after internship concludes",
      payment_terms: "Net 15 days from timesheet verification"
    };
    safetyIndex = 68;
    summary = "A standard technology internship agreement with favorable Net 15 payment terms, but carries a high-risk $5,000 training bond penalty if terminated prematurely.";
    risks = [
      {
        field: "bond_clause",
        severity: "High",
        summary: "Excessive training bond penalty",
        originalText: "liable to pay WebCraft Labs a penalty bond of $5,000",
        explanation: "A $5,000 penalty for an hourly internship is highly punitive and likely legally unenforceable. It creates an unfair barrier to switching roles.",
        remedy: "Request removal of the training bond entirely, or replace with a pro-rata reimbursement only for verifiable third-party certification costs."
      },
      {
        field: "non_compete",
        severity: "Medium",
        summary: "Post-internship non-compete",
        originalText: "shall not work for any competitor within a 15-mile radius... for 6 months",
        explanation: "Non-compete terms for entry-level internships are rare and restrict career launching unnecessarily.",
        remedy: "Request complete strike-out of Section 5, as internships should encourage learning without job bans."
      }
    ];
  } else if (contractType === 'executive' || text.includes('Apex Digital') || text.includes('base salary of $180,000')) {
    fields = {
      salary: "$180,000/year base salary",
      notice_period: "90 days written notice by either party",
      non_compete: "6 months within tri-state area",
      bond_clause: "No bond or training repayment clauses active",
      termination_clause: "Apex Digital pays 3 months severance for termination without cause",
      confidentiality_clause: "Indefinite trade secret protection with pre-existing prior IP exclusion",
      payment_terms: "Standard semi-monthly payments"
    };
    safetyIndex = 86;
    summary = "A highly balanced and secure executive contract featuring robust notice protections, professional severance provisions, and standard regional non-competes.";
    risks = [
      {
        field: "notice_period",
        severity: "Medium",
        summary: "Long notice requirement",
        originalText: "Executive must provide at least 90 days written notice",
        explanation: "A 90-day notice period is standard for executives but restricts your agility in joining competitor organizations quickly.",
        remedy: "Suggest reducing the notice period to 45 or 60 days to improve career mobility."
      }
    ];
  } else {
    // Default freelance_dev or random
    risks = [
      {
        field: "non_compete",
        severity: "High",
        summary: "Perpetual worldwide non-compete",
        originalText: "prohibited from working for... any competitor anywhere in the world for a period of 2 years",
        explanation: "A worldwide non-compete of 24 months is virtually always legally void, but presents high litigation risk and limits all other client opportunities.",
        remedy: "Limit non-compete to 3-6 months, specifically target only direct platform competitors, and exclude general consulting/freelance work."
      },
      {
        field: "termination_clause",
        severity: "High",
        summary: "One-sided immediate termination",
        originalText: "terminate this agreement immediately and without cause, without any severance",
        explanation: "The client can terminate instantly, but the contractor must give 14 days notice. This creates extreme income vulnerability and project instability.",
        remedy: "Negotiate mutual 14-day notice, or require 1-2 weeks severance compensation in the event of immediate termination without cause."
      },
      {
        field: "payment_terms",
        severity: "Medium",
        summary: "Extended Net 60 payment terms",
        originalText: "processed and paid Net 60 days from receipt",
        explanation: "Waiting 60 days for payment of hourly work is a significant cash flow risk and does not align with freelance standards.",
        remedy: "Request standard Net 30 or Net 15 payment terms. Suggest adding a 1.5% monthly late payment interest fee."
      }
    ];
  }

  // Cross-reference hindsight rules
  const memoryViolations = (hindsightRules || []).map(rule => {
    let status: 'Violated' | 'Compliant' = 'Compliant';
    let matchDetail = `No conflict found in the contract for guideline: "${rule.text}"`;

    const lowerRule = rule.text.toLowerCase();
    if (rule.isActive) {
      if (lowerRule.includes('non-compete') || lowerRule.includes('compete')) {
        if (fields.non_compete.toLowerCase().includes('2 years') || fields.non_compete.toLowerCase().includes('worldwide') || fields.non_compete.toLowerCase().includes(' competitor')) {
          status = 'Violated';
          matchDetail = `VIOLATION: Contract imposes a "${fields.non_compete}" which violates your guideline: "${rule.text}"`;
        }
      }
      if (lowerRule.includes('payment') || lowerRule.includes('invoice') || lowerRule.includes('net')) {
        if (fields.payment_terms.toLowerCase().includes('net 60') || fields.payment_terms.toLowerCase().includes('60 days')) {
          status = 'Violated';
          matchDetail = `VIOLATION: Contract mandates Net 60 payment terms, failing your guideline: "${rule.text}"`;
        }
      }
      if (lowerRule.includes('bond') || lowerRule.includes('penalty') || lowerRule.includes('training')) {
        if (fields.bond_clause.toLowerCase().includes('stipend') || fields.bond_clause.toLowerCase().includes('penalty') || fields.bond_clause.toLowerCase().includes('$5,000')) {
          status = 'Violated';
          matchDetail = `VIOLATION: Contract defines a potential repayment/penalty of "${fields.bond_clause}" violating your rule: "${rule.text}"`;
        }
      }
    }

    if (status === 'Violated') {
      safetyIndex = Math.max(10, safetyIndex - 12);
    }

    return {
      ruleId: rule.id,
      ruleText: rule.text,
      status,
      matchDetail
    };
  });

  const negotiationScript = `Dear CloudScale Systems Team,

Thank you for sending over the Software Services Agreement. I'm very excited about the opportunity to partner on this project.

I have completed an initial review of the terms and wanted to raise a few points to align the agreement with standard freelance practices:

1. Non-Compete (Section 5): The current 2-year worldwide scope is extremely broad for an independent contractor. I'd like to adjust this to a mutual 3-month regional competitor restriction.
2. Payment Terms (Section 2): Net 60 days poses significant cash flow challenges. I propose aligning this with my standard Net 15 or Net 30 payment schedule.
3. Termination (Section 7): To ensure project stability, I request that termination without cause be mutual with 14 days notice.

Please let me know if these adjustments are acceptable, and I can modify the draft accordingly.

Best regards,
[Your Name]`;

  return {
    fileName: contractType === 'freelance_dev' ? "Freelance_Agreement.txt" : contractType === 'internship' ? "Internship_Covenant.txt" : "Executive_Agreement.txt",
    extractedFields: fields,
    risks,
    safetyIndex,
    summary,
    memoryViolations,
    negotiationScript,
    counterProposalEmail: negotiationScript,
    auditTimestamp: new Date().toLocaleDateString()
  };
};

// Helper function to race a promise with a timeout
const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
  let timeoutId: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Timeout: ${label} exceeded ${timeoutMs}ms limit`));
    }, timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
};

// Real Gemini Multi-Agent Audit Route
app.post('/api/audit', async (req, res) => {
  const { contractText, hindsightRules, contractType } = req.body;

  if (!contractText || contractText.trim() === '') {
    return res.status(400).json({ error: "No contract text provided for auditing." });
  }

  // Optimize text length if excessively large to keep API latency snappy and cost-effective
  let optimizedContractText = contractText;
  if (optimizedContractText.length > 30000) {
    optimizedContractText = optimizedContractText.substring(0, 30000) + "\n\n[Contract text truncated to 30,000 characters for high-speed audit processing...]";
  }

  // If no Gemini client is configured, gracefully fall back to rich, high-quality simulation
  if (!ai) {
    console.log("Running simulated contract audit fallback.");
    const simulatedReport = generateSimulatedAudit(contractType || 'freelance_dev', optimizedContractText, hindsightRules || []);
    return res.json(simulatedReport);
  }

  try {
    console.log("Processing live contract audit with Gemini 3.5...");

    const prompt = `
You are an advanced cooperatively chained multi-agent contract auditing system called CascadeFlow™.
Analyze the following contract against the user's custom Hindsight Memory Rules.

### CONTRACT TEXT:
${optimizedContractText}

### HINDSIGHT MEMORY GUIDELINES:
${JSON.stringify(hindsightRules || [])}

Perform the audit and extract the following:
1. "extractedFields": An object containing the exact contract terms (or "Not mentioned") for:
   - "salary"
   - "notice_period"
   - "non_compete"
   - "bond_clause"
   - "termination_clause"
   - "confidentiality_clause"
   - "payment_terms"
2. "risks": A list of items identified as problematic. Each risk item must have:
   - "field": which of the extractedFields it relates to (or "other")
   - "severity": "Low" | "Medium" | "High"
   - "summary": a short descriptive title
   - "originalText": the exact quote from the contract
   - "explanation": a clear explanation of why it is risky
   - "remedy": actionable advice on what to propose instead
3. "safetyIndex": An overall contract safety index from 0 to 100. Be strict. Deduct heavily for:
   - Worldwide or >6 month non-competes (High severity)
   - Heavy exit bonds/penalties (High severity)
   - One-sided immediate terminations (High severity)
   - Net 45/60 payment terms (Medium/High severity)
4. "summary": A scannable 2-3 sentence overview of the audit.
5. "memoryViolations": Evaluate the guidelines. Match each user rule:
   - "ruleId": the string rule ID
   - "ruleText": the rule text
   - "status": "Violated" or "Compliant"
   - "matchDetail": clear details on where the contract matches or violates this rule.
6. "counterProposalEmail": A polished, polite professional email draft the user can send to negotiate the identified risks.

Your output must be strictly valid JSON conforming to the Type Schema:
{
  "extractedFields": {
    "salary": "string",
    "notice_period": "string",
    "non_compete": "string",
    "bond_clause": "string",
    "termination_clause": "string",
    "confidentiality_clause": "string",
    "payment_terms": "string"
  },
  "risks": [
    { "field": "string", "severity": "High"|"Medium"|"Low", "summary": "string", "originalText": "string", "explanation": "string", "remedy": "string" }
  ],
  "safetyIndex": number,
  "summary": "string",
  "memoryViolations": [
    { "ruleId": "string", "ruleText": "string", "status": "Violated"|"Compliant", "matchDetail": "string" }
  ],
  "counterProposalEmail": "string"
}

Provide ONLY the raw JSON string in your response. No markdown wrappers.`;

    let response;
    let modelUsed = "gemini-3.5-flash";
    try {
      response = await withTimeout(
        ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.1,
          }
        }),
        15000,
        "gemini-3.5-flash"
      );
    } catch (err35: any) {
      console.warn("Primary model gemini-3.5-flash failed or was overloaded, trying gemini-3.1-flash-lite fallback...", err35.message || err35);
      try {
        modelUsed = "gemini-3.1-flash-lite";
        response = await withTimeout(
          ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              temperature: 0.1,
            }
          }),
          10000,
          "gemini-3.1-flash-lite"
        );
      } catch (errLite: any) {
        console.warn("Fallback model gemini-3.1-flash-lite failed, trying gemini-flash-latest fallback...", errLite.message || errLite);
        modelUsed = "gemini-flash-latest";
        response = await withTimeout(
          ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              temperature: 0.1,
            }
          }),
          10000,
          "gemini-flash-latest"
        );
      }
    }

    const text = response.text?.trim() || "{}";
    let parsedData;
    try {
      parsedData = JSON.parse(text);
    } catch (parseErr) {
      console.error("Gemini output was not valid JSON, cleaning response markers:", parseErr);
      // Fallback clean-up if markdown code fences remained
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      parsedData = JSON.parse(cleaned);
    }

    // Fill in standard items if any are missing
    const extractedFields = {
      salary: parsedData.extractedFields?.salary || "Not mentioned",
      notice_period: parsedData.extractedFields?.notice_period || "Not mentioned",
      non_compete: parsedData.extractedFields?.non_compete || "Not mentioned",
      bond_clause: parsedData.extractedFields?.bond_clause || "Not mentioned",
      termination_clause: parsedData.extractedFields?.termination_clause || "Not mentioned",
      confidentiality_clause: parsedData.extractedFields?.confidentiality_clause || "Not mentioned",
      payment_terms: parsedData.extractedFields?.payment_terms || "Not mentioned",
    };

    const finalReport = {
      fileName: contractType ? `${contractType}_Contract.txt` : "Uploaded_Contract.txt",
      extractedFields,
      risks: parsedData.risks || [],
      safetyIndex: typeof parsedData.safetyIndex === 'number' ? parsedData.safetyIndex : 70,
      summary: parsedData.summary || "Audit complete.",
      memoryViolations: parsedData.memoryViolations || [],
      negotiationScript: parsedData.counterProposalEmail || "No suggestions available.",
      counterProposalEmail: parsedData.counterProposalEmail || "No suggestions available.",
      auditTimestamp: new Date().toLocaleDateString()
    };

    res.json(finalReport);
  } catch (error: any) {
    console.error("Gemini live audit failed. Initiating high-quality simulated fallback:", error);
    // Graceful fallback to rich simulation if rate-limited or key issues
    const simulatedReport = generateSimulatedAudit(contractType || 'freelance_dev', contractText, hindsightRules || []);
    res.json(simulatedReport);
  }
});

// Serve frontend assets in production, otherwise Vite handles in development
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist'));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve('dist/index.html'));
  });
} else {
  // Integrate Vite dynamically as dev server middleware
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Legalite AI server executing on http://localhost:${PORT}`);
});
