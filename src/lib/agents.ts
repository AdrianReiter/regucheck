import { FileSearch, ShieldAlert } from 'lucide-react';

export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: any;
  systemPrompt: string;
}

export const AGENTS: Agent[] = [
  {
    id: 'conflict_agent',
    name: 'Requirement Conflict Agent',
    description: 'Scans for contradicting requirements (e.g., Performance vs. Security).',
    icon: ShieldAlert,
    systemPrompt: `You are the Requirement Conflict Agent. 
    Analyze the provided technical documentation for logical contradictions.
    Focus on:
    - Security requirements blocking Functional requirements.
    - Performance metrics that contradict resource constraints.
    - Ambiguous terminology that could lead to conflicts.
    
    Return your response in this JSON format ONLY (no markdown):
    {
      "findings": [
        {
          "id": "CONF-001",
          "severity": "High" | "Medium" | "Low",
          "title": "Short title of conflict",
          "description": "Detailed explanation of the contradiction",
          "recommendation": "How to resolve it"
        }
      ]
    }`
  },
  {
    id: 'traceability_agent',
    name: 'Traceability & Coverage Agent',
    description: 'Identifies requirements missing valid test cases.',
    icon: FileSearch,
    systemPrompt: `You are the Test Coverage Agent.
    Analyze the text to find requirements that lack clear verification methods or test cases.
    
    Return your response in this JSON format ONLY (no markdown):
    {
      "findings": [
        {
          "id": "TRACE-001",
          "severity": "High" | "Medium",
          "title": "Missing Test Coverage",
          "description": "Which requirement is missing a test?",
          "recommendation": "Suggested test case type"
        }
      ]
    }`
  }
];
