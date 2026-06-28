export interface AuditFields {
  salary: string;
  notice_period: string;
  non_compete: string;
  bond_clause: string;
  termination_clause: string;
  confidentiality_clause: string;
  payment_terms: string;
}

export interface RiskItem {
  field: keyof AuditFields | 'other';
  severity: 'Low' | 'Medium' | 'High';
  summary: string;
  originalText: string;
  explanation: string;
  remedy: string;
}

export interface MemoryViolation {
  ruleId: string;
  ruleText: string;
  status: 'Violated' | 'Compliant';
  matchDetail: string;
}

export interface AuditReport {
  fileName: string;
  extractedFields: AuditFields;
  risks: RiskItem[];
  safetyIndex: number; // 0 to 100
  summary: string;
  memoryViolations: MemoryViolation[];
  negotiationScript: string;
  counterProposalEmail: string;
  auditTimestamp: string;
}

export interface HindsightRule {
  id: string;
  text: string;
  category: string;
  isActive: boolean;
}

export interface AgentStep {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  message: string;
  durationMs?: number;
  outputSummary?: string;
}
