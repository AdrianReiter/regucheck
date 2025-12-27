export interface Standard {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
}

export const STANDARDS: Standard[] = [
  {
    id: 'fda',
    name: 'FDA 510(k)',
    description: 'Premarket Notification for medical devices.',
    systemPrompt: 'You are an FDA reviewer. Focus on safety and effectiveness. Be skeptical of claims without data. Do NOT include email headers (TO/FROM/DATE) in your response. Just provide the content.',
  },
  {
    id: 'iso13485',
    name: 'ISO 13485',
    description: 'Quality management systems for medical devices.',
    systemPrompt: 'You are a Quality Management Auditor. Focus on process compliance and traceability. Do NOT include email headers (TO/FROM/DATE) in your response. Just provide the content.',
  },
  {
    id: 'iec62304',
    name: 'IEC 62304',
    description: 'Medical device software lifecycle processes.',
    systemPrompt: 'You are a Software Safety Engineer. Focus on software risk management and lifecycle documentation. Do NOT include email headers (TO/FROM/DATE) in your response. Just provide the content.',
  },
];
