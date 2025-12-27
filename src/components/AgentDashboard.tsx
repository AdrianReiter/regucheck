'use client';

import React, { useState } from 'react';
import { AGENTS } from '@/lib/agents';
import { 
  Play, 
  AlertTriangle, 
  Loader2, 
  History, 
  FileCheck, 
  CheckCircle2, 
  XCircle,
  Wand2,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentDashboardProps {
  onRunAgent: (agentId: string) => Promise<any>;
  isLoading: boolean;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  agentName: string;
  status: 'Pass' | 'Fail' | 'Error';
  details: string;
  findings?: any[];
}

interface FixResult {
  fix: string;
  rationale: string;
}

export default function AgentDashboard({ onRunAgent, isLoading }: AgentDashboardProps) {
  const [activeResults, setActiveResults] = useState<any>(null);
  const [runningAgentId, setRunningAgentId] = useState<string | null>(null);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  
  // State for Auto-Fix
  const [fixingId, setFixingId] = useState<string | null>(null);
  const [fixes, setFixes] = useState<Record<string, FixResult>>({});

  const handleRun = async (agent: any) => {
    setRunningAgentId(agent.id);
    const runId = Math.random().toString(36).substr(2, 9).toUpperCase();
    const timestamp = new Date().toISOString();
    setFixes({}); // Clear fixes on new run

    try {
      const result = await onRunAgent(agent.id);
      
      // Parse result if it's a string, otherwise use as is
      let parsed;
      if (typeof result === 'string') {
        const cleaned = result.replace(/```json\n?|\n?```/g, '').trim();
        parsed = JSON.parse(cleaned);
      } else {
        parsed = result;
      }

      // Handle potential raw text responses gracefully
      if (!parsed.findings && typeof parsed === 'object') {
         parsed = { findings: [] }; 
      }

      setActiveResults(parsed);

      // Determine Pass/Fail based on findings
      const hasIssues = parsed.findings && parsed.findings.length > 0;
      
      const newEntry: AuditLogEntry = {
        id: runId,
        timestamp,
        agentName: agent.name,
        status: hasIssues ? 'Fail' : 'Pass',
        details: hasIssues 
          ? `${parsed.findings.length} issues identified` 
          : 'No issues found. Compliance verified.',
        findings: parsed.findings || []
      };

      setAuditLog(prev => [newEntry, ...prev]);

    } catch (e) {
      console.error("Agent execution failed", e);
      const errorEntry: AuditLogEntry = {
        id: runId,
        timestamp,
        agentName: agent.name,
        status: 'Error',
        details: 'Execution failed or response malformed.'
      };
      setAuditLog(prev => [errorEntry, ...prev]);
    } finally {
      setRunningAgentId(null);
    }
  };

  const handleAutoFix = async (finding: any) => {
    const id = finding.id || 'unknown';
    setFixingId(id);
    
    try {
      const response = await fetch('/api/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finding })
      });
      
      const data = await response.json();
      if (data.fix) {
        setFixes(prev => ({
          ...prev,
          [id]: data
        }));
      }
    } catch (error) {
      console.error("Auto-fix failed", error);
    } finally {
      setFixingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
      
      {/* LEFT COLUMN: Agent Selection & Results */}
      <div className="lg:col-span-2 space-y-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
           <FileCheck className="mr-2 h-6 w-6 text-blue-600"/> 
           GxP Verification Agents
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AGENTS.map((agent) => (
            <div 
              key={agent.id} 
              className={cn(
                "border rounded-xl p-4 bg-white transition-all shadow-sm",
                runningAgentId === agent.id ? "border-blue-500 ring-1 ring-blue-500" : "hover:border-blue-400"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={cn("p-2 rounded-lg", runningAgentId === agent.id ? "bg-blue-100 text-blue-700" : "bg-gray-50 text-gray-600")}>
                    <agent.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{agent.name}</h4>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{agent.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRun(agent)}
                  disabled={isLoading}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full disabled:opacity-50 transition-colors"
                >
                  {isLoading && runningAgentId === agent.id ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Play className="h-5 w-5 fill-current" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Results Area */}
        {activeResults && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-slate-50 border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4 border-b pb-2">
                <h3 className="text-lg font-bold text-gray-900">Analysis Findings</h3>
                {activeResults.findings?.length === 0 ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Clean
                  </span>
                ) : (
                   <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    <AlertTriangle className="w-3 h-3 mr-1" /> {activeResults.findings?.length} Issues
                  </span>
                )}
              </div>

              {activeResults.findings && activeResults.findings.length > 0 ? (
                <div className="space-y-3">
                  {activeResults.findings.map((item: any, idx: number) => {
                    const id = item.id || `ISSUE-${idx+1}`;
                    const hasFix = !!fixes[id];
                    const isFixing = fixingId === id;

                    return (
                      <div key={idx} className="bg-white border-l-4 border-amber-500 rounded-r-lg shadow-sm p-4 border-y border-r">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex space-x-2 mb-2">
                              <span className="inline-block px-2 py-1 text-[10px] font-bold bg-gray-100 text-gray-600 rounded">
                                {id}
                              </span>
                              <span className="inline-block px-2 py-1 text-[10px] font-bold bg-amber-100 text-amber-800 rounded">
                                {item.severity || 'Medium'}
                              </span>
                            </div>
                            <h5 className="font-semibold text-gray-900 text-sm">{item.title}</h5>
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          </div>
                          
                          {/* Auto-Fix Button */}
                          <div className="ml-4">
                             <button
                               onClick={() => handleAutoFix(item)}
                               disabled={isFixing || hasFix}
                               className={cn(
                                 "flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border",
                                 hasFix 
                                   ? "bg-green-50 text-green-700 border-green-200"
                                   : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                               )}
                             >
                               {isFixing ? (
                                 <Loader2 className="h-3 w-3 animate-spin" />
                               ) : hasFix ? (
                                 <Check className="h-3 w-3" />
                               ) : (
                                 <Wand2 className="h-3 w-3" />
                               )}
                               <span>{hasFix ? "Fixed" : "Auto-Fix"}</span>
                             </button>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">Recommendation</p>
                          <p className="text-sm text-gray-700">{item.recommendation}</p>
                        </div>
                        
                        {/* Render Generated Fix */}
                        {hasFix && (
                          <div className="mt-3 bg-green-50 rounded-lg p-3 border border-green-100 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-start">
                              <Wand2 className="h-4 w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-bold text-green-800 uppercase mb-1">AI Suggested Fix</p>
                                <div className="text-sm text-gray-800 font-medium bg-white p-2 rounded border border-green-100">
                                  {fixes[id].fix}
                                </div>
                                <p className="text-xs text-green-700 mt-2 italic">
                                  Rationale: {fixes[id].rationale}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3 opacity-20" />
                  <p className="text-gray-500">No compliance issues detected by this agent.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: The Audit Log */}
      <div className="lg:col-span-1">
        <div className="bg-white border rounded-xl shadow-sm sticky top-8 overflow-hidden">
          <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <History className="h-4 w-4 mr-2 text-gray-500"/> 
              Audit Trail
            </h3>
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Session Log</span>
          </div>
          
          <div className="max-h-[600px] overflow-y-auto p-4 space-y-4">
            {auditLog.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm italic">
                No actions recorded yet. <br/> Run an agent to generate logs.
              </div>
            )}
            
            {auditLog.map((log) => (
              <div key={log.id} className="relative pl-4 border-l-2 border-gray-200 pb-2 last:pb-0">
                {/* Timeline Dot */}
                <div className={cn(
                  "absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-white",
                  log.status === 'Pass' ? "bg-green-500" : log.status === 'Fail' ? "bg-amber-500" : "bg-red-500"
                )} />
                
                <div className="flex justify-between items-start">
                  <span className="text-xs font-mono text-gray-400">{log.id}</span>
                  <span className="text-[10px] text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                
                <p className="text-sm font-medium text-gray-900 mt-1">{log.agentName}</p>
                
                <div className={cn(
                  "mt-2 text-xs p-2 rounded",
                  log.status === 'Pass' ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800"
                )}>
                  <div className="flex items-center font-bold mb-1">
                     {log.status === 'Pass' ? <CheckCircle2 className="w-3 h-3 mr-1"/> : <XCircle className="w-3 h-3 mr-1"/>}
                     {log.status === 'Pass' ? 'COMPLIANT' : 'ISSUES FOUND'}
                  </div>
                  {log.details}
                </div>
              </div>
            ))}
          </div>
          
          {auditLog.length > 0 && (
            <div className="p-4 border-t bg-gray-50">
              <button 
                onClick={() => {
                  const headers = ["Run ID", "Timestamp", "Agent", "Status", "Finding ID", "Severity", "Title", "Description", "Recommendation"];
                  const rows: string[] = [];

                  auditLog.forEach(log => {
                    if (log.findings && log.findings.length > 0) {
                      log.findings.forEach(f => {
                        rows.push([
                          log.id,
                          new Date(log.timestamp).toLocaleString(),
                          `"${log.agentName}"`, // Added quotes for agent name
                          log.status,
                          `"${f.id || ''}"`, // Added quotes for finding ID
                          `"${f.severity || ''}"`, // Added quotes for severity
                          `"${(f.title || '').replace(/"/g, '""')}"`,
                          `"${(f.description || '').replace(/"/g, '""')}"`,
                          `"${(f.recommendation || '').replace(/"/g, '""')}"`
                        ].join(","));
                      });
                    } else {
                      rows.push([
                        log.id,
                        new Date(log.timestamp).toLocaleString(),
                        `"${log.agentName}"`,
                        log.status,
                        "N/A",
                        "N/A",
                        "No issues found",
                        "Compliance verified",
                        "N/A"
                      ].join(","));
                    }
                  });

                  const csvContent = [headers.join(","), ...rows].join("\n");
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const link = document.createElement("a");
                  const url = URL.createObjectURL(blob);
                  link.setAttribute("href", url);
                  link.setAttribute("download", `regucheck-audit-${new Date().toISOString().split('T')[0]}.csv`);
                  link.style.visibility = 'hidden';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="w-full py-2 text-xs font-medium text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
              >
                Download Signed Audit Report (CSV)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}