import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Brain, 
  FileText, 
  FileCode, 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  ArrowRight, 
  ArrowLeft,
  Download, 
  RefreshCw, 
  Trash2, 
  Plus, 
  Copy, 
  Sun, 
  Moon, 
  Sparkles, 
  Eye, 
  ChevronRight, 
  Briefcase, 
  GraduationCap, 
  Award,
  BookOpen,
  Info,
  Layers,
  LayoutDashboard,
  Lock,
  Mail,
  User,
  History,
  AlertOctagon,
  FileSignature,
  FileCheck
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'motion/react';
import { AuditReport, HindsightRule, AgentStep } from './types';

// Default guidelines database
const DEFAULT_RULES: HindsightRule[] = [
  { id: '1', text: 'Non-compete restrictive term must not exceed 6 months.', category: 'Competition', isActive: true },
  { id: '2', text: 'Payment terms must be Net 30 days or sooner (no Net 45 or Net 60 days).', category: 'Payment', isActive: true },
  { id: '3', text: 'No training bonds, repayment penalties, or cash deposits required to leave.', category: 'Exit Penalty', isActive: true },
  { id: '4', text: 'Termination without cause must be mutual and require at least 14 days notice.', category: 'Termination', isActive: true }
];

// CascadeFlow Agent definitions
const INITIAL_AGENTS = (): AgentStep[] => [
  { id: 'parsing', name: 'DocumentParsingAgent', role: 'Ingestion & Formatting', status: 'idle', message: 'Ready to ingest contract draft' },
  { id: 'extraction', name: 'ClauseExtractionAgent', role: 'Parameter Harvester', status: 'idle', message: 'Waiting for normalized output' },
  { id: 'risks', name: 'RiskAnalysisAgent', role: 'Safety Benchmarking', status: 'idle', message: 'Waiting to scan extracted clauses' },
  { id: 'memory', name: 'MemoryRetrievalAgent', role: 'Hindsight Alignment Checker', status: 'idle', message: 'Waiting to cross-reference guidelines' },
  { id: 'recommendation', name: 'RecommendationAgent', role: 'Negotiation Strategy & Script', status: 'idle', message: 'Waiting to formulate strategies' },
  { id: 'reporting', name: 'ReportGenerationAgent', role: 'Scorecard Compiler', status: 'idle', message: 'Waiting to assign Safety Index score' }
];

// Preset simulated contract texts
const PRESETS = {
  freelance_dev: `SOFTWARE SERVICES AGREEMENT
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
Client reserves the right to terminate this agreement immediately and without cause, without any severance or penalty, at any time. Contractor must deliver all partial work within 24 hours of notice.`,

  internship: `INTERNSHIP OFFER LETTER
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
Termination may occur at-will by either party.`,

  executive: `EXECUTIVE EMPLOYMENT AGREEMENT
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
};

export default function App() {
  // Page Routing & Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'auditor' | 'memory' | 'history' | 'guide'>('dashboard');
  
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Auth/Login Session state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  // Hindsight Memory rules list
  const [rules, setRules] = useState<HindsightRule[]>([]);
  const [newRuleText, setNewRuleText] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState('Payment');

  // Input contract text & custom upload state
  const [contractInput, setContractInput] = useState(PRESETS.freelance_dev);
  const [selectedTemplate, setSelectedTemplate] = useState<'freelance_dev' | 'internship' | 'executive' | 'custom'>('freelance_dev');
  const [customFileName, setCustomFileName] = useState('');
  const [isParsingFile, setIsParsingFile] = useState(false);

  // CascadeFlow Agents processing state
  const [agents, setAgents] = useState<AgentStep[]>(INITIAL_AGENTS());
  const [isAuditing, setIsAuditing] = useState(false);
  const [currentRunningAgentIndex, setCurrentRunningAgentIndex] = useState<number | null>(null);

  // Completed Audit report
  const [currentReport, setCurrentReport] = useState<AuditReport | null>(null);
  const [auditHistory, setAuditHistory] = useState<AuditReport[]>([]);

  // UI copy feedback trigger
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Fresh login/session isolation: checks if initialized inside this browser session
  useEffect(() => {
    // Session state
    const isSessionInit = sessionStorage.getItem('legalite_session_initialized');
    const savedUser = sessionStorage.getItem('legalite_username');
    if (savedUser) {
      setUsername(savedUser);
      setIsAuthenticated(true);
    }
    
    // If a brand new session, wipe previous audits/rules for a fresh "Try Demo" experience
    if (!isSessionInit) {
      localStorage.removeItem('legalite_rules');
      localStorage.removeItem('legalite_history');
      setRules(DEFAULT_RULES);
      setAuditHistory([]);
      sessionStorage.setItem('legalite_session_initialized', 'true');
    } else {
      // Load rules and history from localStorage
      const savedRules = localStorage.getItem('legalite_rules');
      if (savedRules) {
        setRules(JSON.parse(savedRules));
      } else {
        setRules(DEFAULT_RULES);
      }

      const savedHistory = localStorage.getItem('legalite_history');
      if (savedHistory) {
        setAuditHistory(JSON.parse(savedHistory));
      }
    }

    // Load theme
    const savedTheme = localStorage.getItem('legalite_theme');
    if (savedTheme === 'light') {
      setTheme('light');
    }
  }, []);

  // Save rules helper
  const saveRules = (newRules: HindsightRule[]) => {
    setRules(newRules);
    localStorage.setItem('legalite_rules', JSON.stringify(newRules));
  };

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('legalite_theme', newTheme);
  };

  // Auth Handling
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!emailInput.trim() || !passwordInput.trim()) {
      setAuthError('Please fill out all mandatory fields.');
      return;
    }

    // High quality simulation authentication
    const userDisplayName = isSignUp ? (username.trim() || 'Guest Counsel') : emailInput.split('@')[0];
    setUsername(userDisplayName);
    setIsAuthenticated(true);
    sessionStorage.setItem('legalite_username', userDisplayName);
  };

  const handleDemoSignIn = () => {
    setUsername('Sandbox Advocate');
    setIsAuthenticated(true);
    sessionStorage.setItem('legalite_username', 'Sandbox Advocate');
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('legalite_username');
    setActiveTab('dashboard');
  };

  // Template select handler
  const handleTemplateChange = (type: 'freelance_dev' | 'internship' | 'executive' | 'custom') => {
    setSelectedTemplate(type);
    if (type !== 'custom') {
      setContractInput(PRESETS[type]);
      setCustomFileName('');
    }
  };

  // File drop/upload handler with PDF parse support
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomFileName(file.name);
      setSelectedTemplate('custom');
      
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setIsParsingFile(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            if (event.target?.result) {
              const base64Data = (event.target.result as string).split(',')[1];
              const response = await fetch('/api/parse-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ base64: base64Data, fileName: file.name })
              });
              if (response.ok) {
                const data = await response.json();
                setContractInput(data.text || '');
              } else {
                const errData = await response.json().catch(() => ({}));
                alert(errData.error || "Failed to parse PDF file. Please try copying the text manually.");
              }
            }
          } catch (err) {
            console.error("PDF upload/parsing error:", err);
            alert("Error uploading PDF file.");
          } finally {
            setIsParsingFile(false);
          }
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setContractInput(event.target.result as string);
          }
        };
        reader.readAsText(file);
      }
    }
  };

  // Rule additions
  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleText.trim()) return;

    const newRule: HindsightRule = {
      id: Date.now().toString(),
      text: newRuleText,
      category: newRuleCategory,
      isActive: true
    };

    const updated = [...rules, newRule];
    saveRules(updated);
    setNewRuleText('');
  };

  // Toggle guideline active state
  const toggleRuleActive = (id: string) => {
    const updated = rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r);
    saveRules(updated);
  };

  // Delete guideline
  const deleteRule = (id: string) => {
    const updated = rules.filter(r => r.id !== id);
    saveRules(updated);
  };

  // Reset demo session completely
  const handleResetSession = () => {
    localStorage.removeItem('legalite_rules');
    localStorage.removeItem('legalite_history');
    setRules(DEFAULT_RULES);
    setAuditHistory([]);
    setContractInput(PRESETS.freelance_dev);
    setSelectedTemplate('freelance_dev');
    setCurrentReport(null);
    setCustomFileName('');
    setAgents(INITIAL_AGENTS());
    alert("Session refreshed with pristine demo databases!");
  };

  // Run CascadeFlow Cooperative Multi-Agent Pipeline
  const handleStartAudit = async () => {
    if (!contractInput.trim()) {
      alert("Please provide contract text to audit!");
      return;
    }

    setIsAuditing(true);
    setCurrentReport(null);
    setCurrentRunningAgentIndex(0);

    const freshAgents = INITIAL_AGENTS();
    setAgents(freshAgents);

    const activeRules = rules.filter(r => r.isActive);
    let apiFinished = false;

    // Dynamic CascadeFlow orchestration simulator
    const runAgentChain = async (index: number): Promise<any> => {
      if (index >= freshAgents.length) {
        return;
      }

      setCurrentRunningAgentIndex(index);
      setAgents(prev => {
        const copy = [...prev];
        copy[index].status = 'running';
        copy[index].message = getAgentProgressMessage(copy[index].id);
        return copy;
      });

      // Snappy base duration which is fast-tracked (120ms) if API already returned, otherwise 450ms for a quick but visible sequence
      const duration = apiFinished ? 120 : (450 + Math.random() * 150);
      await new Promise(resolve => setTimeout(resolve, duration));

      setAgents(prev => {
        const copy = [...prev];
        copy[index].status = 'completed';
        copy[index].durationMs = Math.round(duration);
        copy[index].outputSummary = getAgentOutputSummary(copy[index].id, selectedTemplate);
        copy[index].message = 'Analysis block fully resolved';
        return copy;
      });

      await runAgentChain(index + 1);
    };

    try {
      const visualThread = runAgentChain(0);

      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractText: contractInput,
          hindsightRules: activeRules,
          contractType: selectedTemplate === 'custom' ? 'custom' : selectedTemplate
        })
      });

      if (!response.ok) {
        throw new Error("Audit request failed.");
      }

      const result: AuditReport = await response.json();
      
      if (selectedTemplate === 'custom' && customFileName) {
        result.fileName = customFileName;
      }

      apiFinished = true; // Signal the visual thread to fast-track remaining agents
      await visualThread;

      setCurrentReport(result);
      
      const updatedHistory = [result, ...auditHistory];
      setAuditHistory(updatedHistory);
      localStorage.setItem('legalite_history', JSON.stringify(updatedHistory));

      setIsAuditing(false);
      setCurrentRunningAgentIndex(null);
    } catch (err) {
      console.error(err);
      alert("The multi-agent sequence encountered an error. Intitialising secure fallback audit...");
      setIsAuditing(false);
      setCurrentRunningAgentIndex(null);
    }
  };

  const getAgentProgressMessage = (id: string): string => {
    switch (id) {
      case 'parsing': return 'Parsing draft stream, normalising character encoding...';
      case 'extraction': return 'Locating clauses: Notice, Non-Compete, Exit Repayments...';
      case 'risks': return 'Measuring risks against statutory thresholds and limits...';
      case 'memory': return 'Probing memory cache for active guideline matches...';
      case 'recommendation': return 'Synthesizing mutual compromises and drafting templates...';
      case 'reporting': return 'Summing severity vectors and baking compliance scorecard...';
      default: return 'Active';
    }
  };

  const getAgentOutputSummary = (id: string, type: string): string => {
    switch (id) {
      case 'parsing': return 'Successfully extracted full plaintext from raw input draft.';
      case 'extraction': return 'Captured Compensation, Notice Period, Exit Bonds, and Liability limitations.';
      case 'risks': return 'Finished auditing parameters. Identified severity risks.';
      case 'memory': return 'Hindsight guidelines cross-referenced against draft text.';
      case 'recommendation': return 'Compiled copy-ready counter-proposal scripts and email models.';
      case 'reporting': return 'Completed compilation. Scorecard baked successfully.';
      default: return 'Done';
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // PDF Export using jsPDF
  const downloadReportPDF = (report: AuditReport) => {
    const doc = new jsPDF();
    
    // Header banner
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.rect(0, 0, 210, 42, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("LEGALITE AI - COMPLIANCE SCORECARD", 15, 23);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Chained Multi-Agent Audit Report | Executed: ${report.auditTimestamp}`, 15, 32);
    doc.text(`Contract Evaluated: ${report.fileName}`, 15, 37);

    // Score Circle replacement
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("CONTRACT SAFETY INDEX:", 15, 55);

    let scoreColor = [239, 68, 68]; // Red
    let scoreText = `${report.safetyIndex}/100 (HIGH RISK)`;
    if (report.safetyIndex >= 80) {
      scoreColor = [34, 197, 94]; // Green
      scoreText = `${report.safetyIndex}/100 (SAFE / OPTIMAL)`;
    } else if (report.safetyIndex >= 60) {
      scoreColor = [234, 179, 8]; // Yellow
      scoreText = `${report.safetyIndex}/100 (CAUTION / BALANCED)`;
    }

    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.text(scoreText, 85, 55);

    // Summary box
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.rect(15, 62, 180, 28, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text("Audit Executive Summary:", 18, 68);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    const splitSummary = doc.splitTextToSize(report.summary, 172);
    doc.text(splitSummary, 18, 74);

    // Key Extracted Terms
    let y = 100;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text("Key Extracted Clauses & Terms", 15, y);
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.line(15, y + 2, 195, y + 2);
    y += 8;

    const fields = report.extractedFields;
    const terms = [
      ["Salary / Hourly Compensation", fields.salary],
      ["Payment Schedule & Terms", fields.payment_terms],
      ["Notice Duration For Exit", fields.notice_period],
      ["Training Bonds / Financial Penalty", fields.bond_clause],
      ["Post-Termination Non-Compete Ban", fields.non_compete],
      ["Confidentiality Restrictions", fields.confidentiality_clause],
      ["Client Termination Privileges", fields.termination_clause]
    ];

    doc.setFontSize(9);
    terms.forEach(([label, value]) => {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text(`${label}:`, 15, y);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      const splitVal = doc.splitTextToSize(value || "Not stipulated", 120);
      doc.text(splitVal, 75, y);
      y += Math.max(6, splitVal.length * 4.5 + 2);
    });

    // Custom Guideline Violations
    y += 5;
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text("Hindsight Memory Alignment Audit", 15, y);
    doc.line(15, y + 2, 195, y + 2);
    y += 8;

    doc.setFontSize(9);
    report.memoryViolations.forEach(v => {
      if (y > 270) { doc.addPage(); y = 20; }
      
      if (v.status === 'Violated') {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(239, 68, 68);
        doc.text(`[VIOLATION TRIGGERED]`, 15, y);
        doc.setTextColor(30, 41, 59);
        doc.text(v.ruleText, 55, y);
      } else {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(34, 197, 94);
        doc.text(`[COMPLIANT / ALIGNED]`, 15, y);
        doc.setTextColor(71, 85, 105);
        doc.text(v.ruleText, 55, y);
      }
      y += 4.5;
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      const splitDetail = doc.splitTextToSize(v.matchDetail, 175);
      doc.text(splitDetail, 20, y);
      y += splitDetail.length * 4.5 + 4;
    });

    // Risks & Remedies
    if (report.risks.length > 0) {
      if (y > 230) { doc.addPage(); y = 20; }
      y += 5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text("Critical Risk Assessments & Remedies", 15, y);
      doc.line(15, y + 2, 195, y + 2);
      y += 8;

      doc.setFontSize(9);
      report.risks.forEach((risk, i) => {
        if (y > 250) { doc.addPage(); y = 20; }
        
        doc.setFont("helvetica", "bold");
        const severityColor = risk.severity === 'High' ? [239, 68, 68] : risk.severity === 'Medium' ? [234, 179, 8] : [59, 130, 246];
        doc.setTextColor(severityColor[0], severityColor[1], severityColor[2]);
        doc.text(`${i+1}. [Severity: ${risk.severity}] - ${risk.summary}`, 15, y);
        y += 4.5;

        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text("Original Text: ", 18, y);
        doc.setFont("helvetica", "oblique");
        doc.setTextColor(100, 116, 139);
        const splitQuote = doc.splitTextToSize(`"${risk.originalText}"`, 165);
        doc.text(splitQuote, 42, y);
        y += splitQuote.length * 4.5;

        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text("Explanation: ", 18, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        const splitExpl = doc.splitTextToSize(risk.explanation, 165);
        doc.text(splitExpl, 42, y);
        y += splitExpl.length * 4.5;

        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text("Suggested Remedy: ", 18, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        const splitRemedy = doc.splitTextToSize(risk.remedy, 165);
        doc.text(splitRemedy, 50, y);
        y += splitRemedy.length * 4.5 + 4;
      });
    }

    // Add Negotiation Counter-Proposal Email page
    const emailText = report.counterProposalEmail || report.negotiationScript;
    if (emailText) {
      doc.addPage();
      y = 20;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text("Negotiation & Counter-Proposal Email", 15, y);
      doc.setDrawColor(99, 102, 241); // Indigo-500
      doc.line(15, y + 2, 195, y + 2);
      y += 12;

      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text("The following professional counter-proposal was prepared based on detected risks:", 15, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
      
      const emailLines = doc.splitTextToSize(emailText, 165);
      let startY = y;
      emailLines.forEach((line: string) => {
        if (y > 270) {
          // Draw left vertical line for the quote block on the current page
          doc.setDrawColor(226, 232, 240); // Slate-200
          doc.setLineWidth(1.5);
          doc.line(18, startY - 2, 18, y - 2);
          
          doc.addPage();
          y = 20;
          startY = y;
        }
        doc.text(line, 22, y);
        y += 5.5;
      });
      
      // Draw left vertical line for the last page's segment
      if (y > startY) {
        doc.setDrawColor(226, 232, 240); // Slate-200
        doc.setLineWidth(1.5);
        doc.line(18, startY - 2, 18, y - 2);
      }
    }

    doc.save(`Legalite_Scorecard_${report.fileName.split('.')[0]}.pdf`);
  };

  // Dashboard calculation helpers
  const averageSafetyScore = auditHistory.length > 0 
    ? Math.round(auditHistory.reduce((acc, curr) => acc + curr.safetyIndex, 0) / auditHistory.length)
    : 0;

  const totalRisksFlagged = auditHistory.reduce((acc, curr) => acc + curr.risks.length, 0);
  
  const highSeverityCount = auditHistory.reduce((acc, curr) => acc + curr.risks.filter(r => r.severity === 'High').length, 0);

  // If not authenticated, render splash login page
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-sans ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} transition-all duration-300 p-4 relative overflow-hidden`}>
        {/* Abstract glow effects in dark mode */}
        {theme === 'dark' && (
          <>
            <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
          </>
        )}

        <div className="absolute top-6 right-6">
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-lg border ${theme === 'dark' ? 'border-slate-800 hover:bg-slate-800 text-amber-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'} transition-all`}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className={`w-full max-w-md p-8 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'}`}
        >
          {/* Brand Identity */}
          <div className="flex flex-col items-center gap-3 text-center mb-8">
            <div className="p-3 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-xl shadow-lg text-white">
              <Shield className="h-8 w-8 animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">Legalite AI</h2>
              <p className="text-xs text-slate-400 mt-1">Multi-Agent Legal Intelligence Platform</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
            {authError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold text-center">
                {authError}
              </div>
            )}

            {isSignUp && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="E.g., Advocate Stark" 
                    className={`w-full pl-10 pr-4 py-2 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-violet-500 ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-400">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input 
                  type="email" 
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@firm.com" 
                  className={`w-full pl-10 pr-4 py-2 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-violet-500 ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-400">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input 
                  type="password" 
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••" 
                  className={`w-full pl-10 pr-4 py-2 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-violet-500 ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm shadow-lg shadow-violet-600/10 transition-all cursor-pointer mt-2"
            >
              {isSignUp ? 'Create Legalite Account' : 'Authenticate Session'}
            </button>
          </form>

          {/* Toggle / Quick Demo Link */}
          <div className="mt-6 flex flex-col gap-3 text-center">
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-violet-400 hover:underline transition-all"
            >
              {isSignUp ? 'Already registered? Sign In' : 'Need an account? Sign Up'}
            </button>

            <div className="relative my-2 flex items-center justify-center">
              <div className="border-t border-slate-800/80 w-full" />
              <span className="absolute px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900">or</span>
            </div>

            <button
              onClick={handleDemoSignIn}
              className={`w-full py-2 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                theme === 'dark' ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Sparkles className="h-3 w-3 text-indigo-400" />
              Instant Try Sandbox Demo (No Sign Up)
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex font-sans ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} transition-colors duration-300`}>
      
      {/* 1. LEFT NAVIGATION SIDEBAR */}
      <aside className={`w-64 border-r shrink-0 hidden md:flex flex-col justify-between ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 shadow-sm'
      } transition-colors`}>
        <div className="flex flex-col gap-6 p-6">
          
          {/* Brand Shield Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-lg text-white shadow-md">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                <span className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Legalite AI</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-violet-500/20 text-violet-400">Sandbox</span>
              </h1>
              <p className="text-[10px] text-slate-500">Multi-Agent Legal Intel</p>
            </div>
          </div>

          {/* User Profile Pill */}
          <div className={`p-3 rounded-xl flex items-center justify-between border ${
            theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'
          }`}>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-xs uppercase">
                {username.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold truncate max-w-[120px]">{username}</span>
                <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-wider">Demo User</span>
              </div>
            </div>
            <button 
              onClick={handleSignOut}
              className="text-[9px] font-bold text-slate-500 hover:text-red-400 transition-colors uppercase tracking-wider"
              title="Sign out of sandbox session"
            >
              Log Out
            </button>
          </div>

          {/* Menu Sections */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-bold text-slate-500 tracking-wider uppercase mb-1">Counsels Command Center</span>
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center gap-3 transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/10'
                  : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-100'
              }`}
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              Executive Dashboard
            </button>

            <button
              onClick={() => setActiveTab('auditor')}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center gap-3 transition-all ${
                activeTab === 'auditor'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/10'
                  : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-100'
              }`}
            >
              <FileSignature className="h-4 w-4 shrink-0" />
              CascadeFlow Auditor
            </button>

            <button
              onClick={() => setActiveTab('memory')}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center gap-3 transition-all ${
                activeTab === 'memory'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/10'
                  : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-100'
              }`}
            >
              <Brain className="h-4 w-4 shrink-0" />
              Hindsight Memory Hub
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center gap-3 transition-all ${
                activeTab === 'history'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/10'
                  : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-100'
              }`}
            >
              <History className="h-4 w-4 shrink-0" />
              Audit Repository ({auditHistory.length})
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center gap-3 transition-all ${
                activeTab === 'guide'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/10'
                  : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-100'
              }`}
            >
              <BookOpen className="h-4 w-4 shrink-0" />
              Multi-Agent Manual
            </button>
          </div>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-6 border-t border-slate-800 flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Dark / Light theme</span>
            <button 
              onClick={toggleTheme}
              className={`p-1.5 rounded border transition-all ${theme === 'dark' ? 'border-slate-800 text-amber-400 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}
            >
              {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
          </div>
          <button 
            onClick={handleResetSession}
            className={`w-full text-center py-2 border rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all ${
              theme === 'dark' 
                ? 'border-slate-800 hover:border-red-500/40 hover:bg-red-500/5 text-slate-500 hover:text-red-400' 
                : 'border-slate-200 hover:bg-red-50 text-slate-600'
            }`}
          >
            Reset Sandbox
          </button>
        </div>
      </aside>

      {/* 2. MAIN APPLICATION WORKSPACE FRAME */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Mobile Header / Quick View Tabs */}
        <header className={`md:hidden sticky top-0 z-40 p-4 border-b flex items-center justify-between backdrop-blur-md ${
          theme === 'dark' ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded text-white">
              <Shield className="h-4 w-4" />
            </div>
            <span className="font-black text-sm tracking-tight">Legalite AI</span>
          </div>
          
          <select 
            value={activeTab} 
            onChange={(e) => setActiveTab(e.target.value as any)}
            className={`text-xs font-bold py-1 px-2.5 rounded border focus:outline-none ${
              theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <option value="dashboard">Dashboard</option>
            <option value="auditor">Auditor</option>
            <option value="memory">Hindsight Memory</option>
            <option value="history">Repository</option>
            <option value="guide">Agent Manual</option>
          </select>
        </header>

        {/* Global Alert for server key status */}
        <div className={`p-4 border-b ${
          theme === 'dark' ? 'bg-indigo-500/5 border-slate-800 text-slate-300' : 'bg-indigo-50 border-indigo-100 text-indigo-950'
        } flex items-center justify-between`}>
          <div className="flex items-center gap-2.5 text-xs">
            <Sparkles className="h-4 w-4 text-indigo-400 shrink-0" />
            <span>
              <strong>CascadeFlow Agent Engine:</strong> Server initialized securely. Key status: fallback sandbox simulator active.
            </span>
          </div>
          <button 
            onClick={() => setActiveTab('guide')}
            className="text-[10px] font-bold text-violet-400 hover:underline shrink-0"
          >
            How agents cooperate →
          </button>
        </div>

        {/* Scrollable workspace content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <AnimatePresence mode="wait">
            
            {/* VIEW A: EXECUTIVE DASHBOARD */}
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-8"
              >
                {/* Hero Greeting card */}
                <div className={`p-6 rounded-2xl border bg-gradient-to-r relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 ${
                  theme === 'dark' 
                    ? 'from-slate-900 to-indigo-950/40 border-slate-800' 
                    : 'from-violet-50 to-indigo-50/50 border-slate-200 shadow-sm'
                }`}>
                  <div className="flex flex-col gap-1 text-center md:text-left relative z-10">
                    <h2 className="text-xl font-black tracking-tight flex items-center gap-2 justify-center md:justify-start">
                      <span>Welcome back, Counsel</span>
                      <Sparkles className="h-5 w-5 text-amber-400" />
                    </h2>
                    <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
                      Evaluate drafts against active guidelines instantly. Your multi-agent CascadeFlow model is primed to harvest, check, and flag compliance.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('auditor')}
                    className="py-2.5 px-4 rounded-xl text-xs font-black bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-500/10 flex items-center gap-2 cursor-pointer z-10 shrink-0"
                  >
                    <span>Audit New Contract Draft</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Dashboard statistics counters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  {/* Metric 1 */}
                  <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} flex flex-col gap-2`}>
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Evaluated Agreements</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black">{auditHistory.length}</span>
                      <span className="text-xs text-slate-400 font-medium">total files</span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-2">
                      <FileCheck className="h-3.5 w-3.5 text-emerald-400" />
                      <span>History logs stored on sandbox storage</span>
                    </div>
                  </div>

                  {/* Metric 2 */}
                  <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} flex flex-col gap-2`}>
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Average Safety Rating</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black">{averageSafetyScore || '0'}%</span>
                      <span className="text-xs text-slate-400 font-medium">average scorecard</span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-2">
                      <div className="h-2 w-2 rounded-full bg-violet-400" />
                      <span>Evaluated based on historical runs</span>
                    </div>
                  </div>

                  {/* Metric 3 */}
                  <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} flex flex-col gap-2`}>
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Guidelines Flagged</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-amber-500">{totalRisksFlagged}</span>
                      <span className="text-xs text-slate-400 font-medium">issues spotted</span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                      <span>{highSeverityCount} classified high risk</span>
                    </div>
                  </div>

                  {/* Metric 4 */}
                  <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} flex flex-col gap-2`}>
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Memory Checklist Guideline Cover</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-emerald-400">{rules.length}</span>
                      <span className="text-xs text-slate-400 font-medium">active directives</span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-2">
                      <Brain className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Exclusions checked automatically</span>
                    </div>
                  </div>
                </div>

                {/* Main Dashboard bento sections */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Recent Audit Activities */}
                  <div className={`lg:col-span-8 p-6 rounded-2xl border flex flex-col gap-4 ${
                    theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-base">Historical Scorecards</h3>
                        <p className="text-xs text-slate-400">Review results of previously uploaded agreements</p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('history')}
                        className="text-xs text-violet-400 hover:underline font-bold"
                      >
                        Browse repository →
                      </button>
                    </div>

                    {auditHistory.length === 0 ? (
                      <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-3">
                        <FileText className="h-10 w-10 text-slate-700" />
                        <span className="text-xs">No contract logs found. Audit your first document!</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {auditHistory.slice(0, 3).map((report, idx) => (
                          <div 
                            key={idx}
                            className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                              theme === 'dark' ? 'bg-slate-950 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-100 hover:border-slate-200 shadow-sm'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`p-2 rounded-lg shrink-0 ${
                                report.safetyIndex >= 80 
                                  ? 'bg-emerald-500/10 text-emerald-400' 
                                  : report.safetyIndex >= 60 
                                  ? 'bg-amber-500/10 text-amber-400' 
                                  : 'bg-rose-500/10 text-rose-400'
                              }`}>
                                <FileCheck className="h-5 w-5" />
                              </div>
                              <div className="min-w-0 flex flex-col">
                                <span className="text-xs font-bold truncate max-w-[200px]">{report.fileName}</span>
                                <span className="text-[10px] text-slate-500">Compliance Index Score: {report.safetyIndex}% | Flags: {report.risks.length}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => downloadReportPDF(report)}
                                className="p-2 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                                title="Download compliance report PDF"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setCurrentReport(report);
                                  setActiveTab('auditor');
                                }}
                                className="py-1.5 px-3 rounded-lg text-[10px] font-bold bg-violet-600 hover:bg-violet-500 text-white transition-all"
                              >
                                Open
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Active Hindsight checklist status sidebar */}
                  <div className={`lg:col-span-4 p-6 rounded-2xl border flex flex-col gap-4 ${
                    theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-base">Hindsight Guard</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/15 text-emerald-400">Ready</span>
                    </div>
                    <p className="text-xs text-slate-400">Active rules checked during every CascadeFlow audit session:</p>
                    
                    <div className="flex flex-col gap-2 mt-2">
                      {rules.map((rule) => (
                        <div 
                          key={rule.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                            rule.isActive 
                              ? theme === 'dark' ? 'bg-slate-950 border-slate-800/80 text-slate-300' : 'bg-emerald-50/50 border-emerald-100 text-emerald-950'
                              : 'opacity-50 text-slate-500 bg-slate-950/20 border-transparent'
                          }`}
                        >
                          <span className="line-clamp-1">{rule.text}</span>
                          <div className={`h-2 w-2 rounded-full shrink-0 ${rule.isActive ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                        </div>
                      ))}
                    </div>

                    <button 
                      onClick={() => setActiveTab('memory')}
                      className="text-xs text-violet-400 hover:underline font-bold mt-2 text-center"
                    >
                      Manage Memory Rules →
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* VIEW B: CASCADEFLOW AUDITOR TOOL */}
            {activeTab === 'auditor' && (
              <motion.div 
                key="auditor-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                {/* PHASE 1: PRE-AUDIT SETUP & INPUT FORM */}
                {!isAuditing && !currentReport && (
                  <div className="max-w-4xl mx-auto flex flex-col gap-6">
                    <div className={`p-6 md:p-8 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} flex flex-col gap-6`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-black text-xl flex items-center gap-2.5">
                            <FileSignature className="text-violet-400 h-6 w-6" />
                            1. Select & Load Contract Draft
                          </h3>
                          <p className="text-xs text-slate-400 mt-1">
                            Load one of our high-risk templates or import a custom PDF/text draft to start the audit.
                          </p>
                        </div>
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-violet-600/10 text-violet-400 border border-violet-500/20">Step 1 of 3</span>
                      </div>

                      {/* Pre-packaged Contract Sandboxes */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-400">Choose a Contract Template preset:</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <button
                            onClick={() => handleTemplateChange('freelance_dev')}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all cursor-pointer ${
                              selectedTemplate === 'freelance_dev' 
                                ? 'border-violet-500 bg-violet-500/10 text-violet-400' 
                                : theme === 'dark' ? 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            <Briefcase className="h-5 w-5 shrink-0 text-violet-400" />
                            <div className="flex flex-col">
                              <span className="text-xs font-bold">Freelance Agreement</span>
                              <span className="text-[9px] text-slate-500 mt-0.5">High-Risk Non-Compete</span>
                            </div>
                          </button>
                          <button
                            onClick={() => handleTemplateChange('internship')}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all cursor-pointer ${
                              selectedTemplate === 'internship' 
                                ? 'border-violet-500 bg-violet-500/10 text-violet-400' 
                                : theme === 'dark' ? 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            <GraduationCap className="h-5 w-5 shrink-0 text-emerald-400" />
                            <div className="flex flex-col">
                              <span className="text-xs font-bold">Internship Offer</span>
                              <span className="text-[9px] text-slate-500 mt-0.5">$5,000 Training Penalty</span>
                            </div>
                          </button>
                          <button
                            onClick={() => handleTemplateChange('executive')}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all cursor-pointer ${
                              selectedTemplate === 'executive' 
                                ? 'border-violet-500 bg-violet-500/10 text-violet-400' 
                                : theme === 'dark' ? 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            <Award className="h-5 w-5 shrink-0 text-amber-400" />
                            <div className="flex flex-col">
                              <span className="text-xs font-bold">Executive Contract</span>
                              <span className="text-[9px] text-slate-500 mt-0.5 font-medium">Balanced / Multi-Clause</span>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Drag & Drop PDF Ingestion with Real PDF Parsing Support */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-400">Or import custom agreement file:</label>
                        <label className={`group cursor-pointer border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center transition-all ${
                          isParsingFile
                            ? 'border-indigo-500 bg-indigo-500/5 text-indigo-400 animate-pulse'
                            : customFileName 
                            ? 'border-violet-500 bg-violet-500/5 text-violet-400' 
                            : theme === 'dark' ? 'border-slate-800 hover:border-slate-600 bg-slate-950 text-slate-400' : 'border-slate-300 hover:border-slate-400 bg-slate-50 text-slate-600'
                        }`}>
                          <input 
                            type="file" 
                            accept=".txt,.doc,.docx,.pdf" 
                            onChange={handleFileUpload} 
                            disabled={isParsingFile}
                            className="hidden" 
                          />
                          {isParsingFile ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-2">
                              <RefreshCw className="h-6 w-6 text-indigo-400 animate-spin" />
                              <span className="text-xs font-bold text-indigo-400">Extracting PDF text content...</span>
                              <span className="text-[10px] text-slate-500">Processing on local server</span>
                            </div>
                          ) : (
                            <>
                              <Upload className="h-6 w-6 text-slate-500 group-hover:scale-110 group-hover:text-violet-400 transition-all mb-2" />
                              {customFileName ? (
                                <div className="flex flex-col items-center">
                                  <span className="text-xs font-bold text-violet-400">Ingested</span>
                                  <span className="text-[10px] text-slate-400 line-clamp-1 max-w-[300px]">{customFileName}</span>
                                </div>
                              ) : (
                                <div className="flex flex-col">
                                  <span className="text-xs font-semibold">Drop or Click to Upload Custom Document</span>
                                  <span className="text-[10px] text-slate-500 mt-0.5">Supports .txt, .pdf, .doc, .docx formats</span>
                                </div>
                              )}
                            </>
                          )}
                        </label>
                      </div>

                      {/* Manual Pasteboard editor */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-400">Raw Agreement Document Contents:</label>
                        <textarea
                          value={contractInput}
                          onChange={(e) => {
                            setContractInput(e.target.value);
                            setSelectedTemplate('custom');
                          }}
                          placeholder="Paste agreement text here..."
                          rows={14}
                          className={`p-4 rounded-xl border text-xs font-mono resize-y focus:outline-none focus:ring-1 focus:ring-violet-500 ${
                            theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                        />
                      </div>

                      {/* Submit Button to trigger sequence */}
                      <button
                        onClick={handleStartAudit}
                        disabled={isAuditing}
                        className={`w-full py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all ${
                          isAuditing 
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none' 
                            : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 hover:scale-[1.01]'
                        }`}
                      >
                        <Sparkles className="h-4.5 w-4.5" />
                        Run CascadeFlow™ Cooperative Agent Audits
                      </button>
                    </div>
                  </div>
                )}

                {/* PHASE 2: RUNNING PIPELINE WORKFLOW (FULL SCREEN DISPATCHER) */}
                {isAuditing && (
                  <div className="max-w-3xl mx-auto flex flex-col gap-6 animate-pulse">
                    <div className={`p-6 md:p-8 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} flex flex-col gap-6`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-black text-lg flex items-center gap-2.5">
                            <Layers className="h-6 w-6 text-violet-400 animate-spin" />
                            CascadeFlow™ Multi-Agent Sequence running
                          </h3>
                          <p className="text-xs text-slate-400 mt-1">Cooperative autonomous agents parsing parameters sequentially</p>
                        </div>
                        <span className="text-xs font-mono font-bold bg-violet-600/10 text-violet-400 px-3 py-1 rounded-full border border-violet-500/20 animate-pulse">
                          {currentRunningAgentIndex !== null ? `${Math.round(((currentRunningAgentIndex) / 6) * 100)}%` : '0%'}
                        </span>
                      </div>

                      {/* Global Progress Bar */}
                      <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800/50">
                        <div 
                          className="bg-gradient-to-r from-violet-500 to-indigo-500 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${currentRunningAgentIndex !== null ? ((currentRunningAgentIndex) / 6) * 100 : 0}%` }}
                        />
                      </div>

                      {/* Visual Agent list */}
                      <div className="flex flex-col gap-3">
                        {agents.map((agent, idx) => {
                          const isRunning = agent.status === 'running';
                          const isCompleted = agent.status === 'completed';

                          return (
                            <div 
                              key={agent.id}
                              className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                                isRunning 
                                  ? 'border-violet-500 bg-violet-500/5 shadow-md shadow-violet-500/5 scale-[1.01]' 
                                  : isCompleted 
                                  ? theme === 'dark' ? 'border-slate-800 text-slate-300 bg-slate-900/40' : 'border-slate-100 text-slate-700 bg-slate-50/50'
                                  : 'border-slate-800/30 text-slate-600 bg-slate-950/20 opacity-40'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`p-2 rounded-lg shrink-0 ${
                                  isCompleted 
                                    ? 'bg-emerald-500/10 text-emerald-400' 
                                    : isRunning 
                                    ? 'bg-violet-500/20 text-violet-400 animate-pulse' 
                                    : 'bg-slate-950 text-slate-500'
                                }`}>
                                  <Shield className="h-4.5 w-4.5" />
                                </div>
                                <div className="min-w-0 flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold truncate">{agent.name}</span>
                                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{agent.role}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 truncate mt-0.5">{agent.message}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {isCompleted && <span className="text-[9px] font-mono text-slate-400">{agent.durationMs}ms</span>}
                                {isCompleted ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : isRunning ? <div className="h-3 w-3 border border-violet-500 border-t-transparent rounded-full animate-spin" /> : <div className="h-2 w-2 rounded-full bg-slate-800" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* PHASE 3: COMPLETED COMPLIANCE REPORT */}
                {!isAuditing && currentReport && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col gap-6 w-full"
                  >
                    {/* Top Control Bar with Audit Navigation */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <button
                        onClick={() => setCurrentReport(null)}
                        className="py-2 px-4 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Audit Another Contract Draft
                      </button>

                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => downloadReportPDF(currentReport)}
                          className="py-2.5 px-4 rounded-xl text-xs font-black bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white flex items-center gap-2 shadow-lg shadow-violet-500/10 cursor-pointer"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download PDF Report (With Email)
                        </button>
                      </div>
                    </div>

                    {/* Rating Banner Header */}
                    <div className={`p-6 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-6 ${
                      theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                    }`}>
                      <div className="text-center sm:text-left">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Audit Scorecard Results</span>
                        <h3 className="text-xl font-black mt-1">{currentReport.fileName}</h3>
                        <span className="text-xs text-slate-400">Successfully evaluated on standard compliance baselines</span>
                      </div>

                      {/* Gauge Score */}
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="relative h-20 w-24 flex items-center justify-center">
                          <svg className="h-full w-full" viewBox="0 0 36 36">
                            <path
                              className="text-slate-850"
                              strokeWidth="3.2"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className={`${
                                currentReport.safetyIndex >= 80 ? 'text-emerald-500' : currentReport.safetyIndex >= 60 ? 'text-amber-500' : 'text-rose-500'
                              }`}
                              strokeDasharray={`${currentReport.safetyIndex}, 100`}
                              strokeWidth="3.2"
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xl font-black">{currentReport.safetyIndex}</span>
                            <span className="text-[7px] text-slate-500 font-bold uppercase">Safety Index</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold">Safety Score Index</span>
                          <span className={`text-[10px] font-bold uppercase ${
                            currentReport.safetyIndex >= 80 ? 'text-emerald-400' : currentReport.safetyIndex >= 60 ? 'text-amber-400' : 'text-rose-400'
                          }`}>
                            {currentReport.safetyIndex >= 80 ? 'SAFE / OPTIMAL' : currentReport.safetyIndex >= 60 ? 'CAUTION / BALANCED' : 'HIGH RISK'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Brief executive overview */}
                    <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-950 border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Executive Audit Summary</span>
                      <p className="text-xs text-slate-300 leading-relaxed mt-1.5">{currentReport.summary}</p>
                    </div>

                    {/* Scorecard Extracted Terms */}
                    <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} flex flex-col gap-4`}>
                      <h4 className="font-bold text-sm flex items-center gap-2 text-white">
                        <FileCode className="h-4.5 w-4.5 text-violet-400" />
                        Harvested Clause Terms
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                        {Object.entries(currentReport.extractedFields).map(([key, value]) => (
                          <div key={key} className="p-3 rounded-xl border border-slate-800/60 bg-slate-950 flex flex-col gap-1">
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                              {key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            </span>
                            <span className="font-medium text-slate-300 leading-relaxed line-clamp-2" title={value}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Guideline violations */}
                    <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} flex flex-col gap-4`}>
                      <h4 className="font-bold text-sm flex items-center gap-2 text-white">
                        <Brain className="h-4.5 w-4.5 text-emerald-400" />
                        Hindsight Memory Violations
                      </h4>

                      {currentReport.memoryViolations.length === 0 ? (
                        <span className="text-xs text-slate-500 text-center p-4">No guidelines configured. Add memory rules to check.</span>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {currentReport.memoryViolations.map((v, i) => (
                            <div key={i} className={`p-3.5 rounded-xl border flex flex-col gap-1.5 ${
                              v.status === 'Violated' ? 'border-rose-500/20 bg-rose-500/5' : 'border-emerald-500/20 bg-emerald-500/5'
                            }`}>
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold">{v.ruleText}</span>
                                <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                                  v.status === 'Violated' ? 'bg-rose-500/15 text-rose-400' : 'bg-emerald-500/15 text-emerald-400'
                                }`}>{v.status}</span>
                              </div>
                              <p className="text-[11px] text-slate-400 leading-relaxed">{v.matchDetail}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Risks flags & Counter Proposals */}
                    <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} flex flex-col gap-4`}>
                      <h4 className="font-bold text-sm flex items-center gap-2 text-white">
                        <AlertTriangle className="h-4.5 w-4.5 text-amber-400" />
                        Risk Assessments & Remedies
                      </h4>

                      {currentReport.risks.length === 0 ? (
                        <div className="text-center p-6 text-slate-500 text-xs flex flex-col items-center gap-2">
                          <CheckCircle className="h-8 w-8 text-emerald-400" />
                          <span>This contract draft contains zero critical liability flags!</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {currentReport.risks.map((risk, idx) => (
                            <div key={idx} className="p-4 rounded-xl border border-slate-800 bg-slate-950 flex flex-col gap-3">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-black text-slate-200">{risk.summary}</span>
                                <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-widest ${
                                  risk.severity === 'High' ? 'bg-rose-500/10 text-rose-400' : risk.severity === 'Medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                                }`}>{risk.severity} severity</span>
                              </div>

                              <div className="flex flex-col gap-1.5 text-xs text-slate-400 leading-relaxed">
                                <span>Original Clause Quote:</span>
                                <p className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] italic font-mono text-slate-400 leading-relaxed">
                                  "{risk.originalText}"
                                </p>
                              </div>

                              <div className="flex flex-col gap-1 text-xs leading-relaxed">
                                <span className="font-bold text-slate-400">Risk Explanation:</span>
                                <p className="text-[11px] text-slate-400">{risk.explanation}</p>
                              </div>

                              <div className="p-3.5 rounded-lg bg-violet-600/5 border border-violet-500/20 text-xs flex items-start gap-2.5">
                                <Info className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
                                <div className="flex flex-col gap-1">
                                  <span className="font-bold text-violet-400">Suggested Actionable Remedy:</span>
                                  <p className="text-[11px] text-slate-400 leading-relaxed">{risk.remedy}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Ready negotiation email script */}
                    <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} flex flex-col gap-4`}>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm flex items-center gap-2 text-white">
                          <Mail className="h-4.5 w-4.5 text-indigo-400" />
                          Negotiation Email Model Template
                        </h4>
                        <button
                          onClick={() => handleCopyText(currentReport.negotiationScript)}
                          className="py-1 px-2.5 rounded border border-slate-800 hover:bg-slate-800 text-[10px] font-bold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Copy className="h-3 w-3" />
                          {copyFeedback ? 'Copied!' : 'Copy Script'}
                        </button>
                      </div>
                      <pre className="p-4 rounded-xl border border-slate-800 bg-slate-950 font-mono text-[10px] leading-relaxed overflow-x-auto text-slate-400 whitespace-pre-wrap">
                        {currentReport.negotiationScript}
                      </pre>
                    </div>

                  </motion.div>
                )}
              </motion.div>
            )}

            {/* VIEW C: HINDSIGHT MEMORY HUB */}
            {activeTab === 'memory' && (
              <motion.div 
                key="memory-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Rule Creator */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} flex flex-col gap-4`}>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Brain className="h-5 w-5 text-emerald-400" />
                      New Guideline
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">Add guidelines to check during contract evaluations.</p>

                    <form onSubmit={handleAddRule} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-400">Category Tag</label>
                        <select
                          value={newRuleCategory}
                          onChange={(e) => setNewRuleCategory(e.target.value)}
                          className={`p-2.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-violet-500 ${
                            theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                        >
                          <option value="Payment">Payment</option>
                          <option value="Competition">Competition</option>
                          <option value="Exit Penalty">Exit Penalty</option>
                          <option value="Termination">Termination</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-400">Exclusion Rule Text</label>
                        <textarea
                          value={newRuleText}
                          onChange={(e) => setNewRuleText(e.target.value)}
                          placeholder="E.g., No non-compete terms must bind me after termination of service."
                          rows={4}
                          className={`p-3 rounded-lg border text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-violet-500 ${
                            theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className="py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Persist Guideline
                      </button>
                    </form>
                  </div>
                </div>

                {/* Rules List Catalog */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                  <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} flex flex-col gap-4`}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-base">Hindsight Guard Catalog</h3>
                        <p className="text-xs text-slate-400">Enable or disable guidelines below. These are stored on your local sandbox cache.</p>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded bg-slate-800 font-mono text-emerald-400">
                        {rules.filter(r => r.isActive).length} active
                      </span>
                    </div>

                    {rules.length === 0 ? (
                      <div className="text-center p-8 text-slate-500 text-xs">No custom rules defined yet. Create your first guideline!</div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {rules.map((rule) => (
                          <div 
                            key={rule.id}
                            className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                              rule.isActive 
                                ? theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-emerald-50/40 border-emerald-100 text-emerald-950'
                                : 'opacity-40 bg-slate-950/20 border-transparent text-slate-500'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-[9px] font-bold font-mono tracking-widest uppercase py-0.5 px-2 rounded bg-slate-800 text-slate-400 shrink-0">
                                {rule.category}
                              </span>
                              <span className="text-xs font-medium leading-relaxed">{rule.text}</span>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <button
                                onClick={() => toggleRuleActive(rule.id)}
                                className={`py-1 px-2.5 rounded text-[10px] font-bold uppercase transition-all ${
                                  rule.isActive 
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                    : 'bg-slate-800 text-slate-500 border border-transparent'
                                }`}
                              >
                                {rule.isActive ? 'Active' : 'Disabled'}
                              </button>
                              <button
                                onClick={() => deleteRule(rule.id)}
                                className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors"
                                title="Delete rule"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* VIEW D: AUDIT HISTORY/REPOSITORY */}
            {activeTab === 'history' && (
              <motion.div 
                key="history-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-6"
              >
                <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} flex flex-col gap-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-lg">Audit Repository</h3>
                      <p className="text-xs text-slate-400">View and restore compliance scorecards processed during your demo session.</p>
                    </div>
                    {auditHistory.length > 0 && (
                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to purge all historical audits?")) {
                            setAuditHistory([]);
                            localStorage.removeItem('legalite_history');
                          }
                        }}
                        className="py-1 px-3 border border-red-500/20 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/5 transition-all"
                      >
                        Purge Repository
                      </button>
                    )}
                  </div>

                  {auditHistory.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 text-xs flex flex-col items-center gap-3">
                      <FileText className="h-12 w-12 text-slate-700" />
                      <span>The audit repository is currently empty. Run an audit on a contract draft first!</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {auditHistory.map((report, idx) => (
                        <div 
                          key={idx} 
                          className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 transition-all ${
                            theme === 'dark' ? 'bg-slate-950 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex flex-col gap-1">
                              <span className="font-bold text-sm text-slate-200 truncate">{report.fileName}</span>
                              <span className="text-[10px] text-slate-500">Processed: {report.auditTimestamp}</span>
                              <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">{report.summary}</p>
                            </div>
                            
                            <div className={`h-11 w-11 rounded-full shrink-0 flex items-center justify-center font-black text-xs ${
                              report.safetyIndex >= 80 ? 'bg-emerald-500/10 text-emerald-400' : report.safetyIndex >= 60 ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                            }`}>
                              {report.safetyIndex}%
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">{report.risks.length} flagged risks</span>
                            
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => downloadReportPDF(report)}
                                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                                title="Download compliance report PDF"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setCurrentReport(report);
                                  setActiveTab('auditor');
                                }}
                                className="py-1 px-3 rounded-md text-[10px] font-bold bg-violet-600 hover:bg-violet-500 text-white transition-all"
                              >
                                Restore Board
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* VIEW E: MULTI-AGENT MANUAL / GUIDE */}
            {activeTab === 'guide' && (
              <motion.div 
                key="guide-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-6"
              >
                <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} flex flex-col gap-6`}>
                  <div>
                    <h3 className="font-bold text-lg">CascadeFlow™ Multi-Agent Manual</h3>
                    <p className="text-xs text-slate-400 mt-1">Understand how each autonomous agent sequence coordinates to audit your agreements.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Agent 1 */}
                    <div className="p-5 rounded-xl border border-slate-800 bg-slate-950 flex flex-col gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 text-sm font-bold font-mono">01</div>
                        <span className="font-bold text-sm">DocumentParsingAgent</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Ingests uploaded files or character strings, normalizes unicode spacing, filters formatting tags, and exports standard plain characters for downstream processing.
                      </p>
                    </div>

                    {/* Agent 2 */}
                    <div className="p-5 rounded-xl border border-slate-800 bg-slate-950 flex flex-col gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 text-sm font-bold font-mono">02</div>
                        <span className="font-bold text-sm">ClauseExtractionAgent</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Identifies base parameters using regex metrics and context indexes. Harvests salary, notice timelines, exit bonds, non-competes, and confidentiality clauses.
                      </p>
                    </div>

                    {/* Agent 3 */}
                    <div className="p-5 rounded-xl border border-slate-800 bg-slate-950 flex flex-col gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 text-sm font-bold font-mono">03</div>
                        <span className="font-bold text-sm">RiskAnalysisAgent</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Evaluates parsed metrics against common law limits. Flags long-term post-employment bans, one-sided termination terms, or punitive exit stipend requirements.
                      </p>
                    </div>

                    {/* Agent 4 */}
                    <div className="p-5 rounded-xl border border-slate-800 bg-slate-950 flex flex-col gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm font-bold font-mono">04</div>
                        <span className="font-bold text-sm">MemoryRetrievalAgent</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Acts as the alignment guard. Intercepts harvested variables and cross-references active user memory rules to flag personalized violations.
                      </p>
                    </div>

                    {/* Agent 5 */}
                    <div className="p-5 rounded-xl border border-slate-800 bg-slate-950 flex flex-col gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 text-sm font-bold font-mono">05</div>
                        <span className="font-bold text-sm">RecommendationAgent</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Formulates specific mutual compromises to solve flagged risks. Drafts a ready-to-use, polite negotiation letter and email script the user can copy.
                      </p>
                    </div>

                    {/* Agent 6 */}
                    <div className="p-5 rounded-xl border border-slate-800 bg-slate-950 flex flex-col gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 text-sm font-bold font-mono">06</div>
                        <span className="font-bold text-sm">ReportGenerationAgent</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Bakes the final dashboard results. Computes the algorithmic Safety Index score, writes the executive summary overview, and formats the downloadable scorecard.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
