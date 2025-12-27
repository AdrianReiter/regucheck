import { Document } from '@langchain/core/documents';

export interface TraceItem {
  id: string; 
  content: string;
  source: string;
  coveredBy: string[];
  status: 'Verified' | 'Unverified';
  testStatus?: 'Pass' | 'Fail' | 'Pending';
}

export interface TraceMatrixData {
  items: TraceItem[];
  stats: {
    total: number;
    verified: number;
    unverified: number;
    coverage: number;
  }
}
