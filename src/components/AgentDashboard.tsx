'use client';
import React, { useState } from 'react';
import { AGENTS } from '@/lib/agents';
import { Play, AlertTriangle, Loader2 } from 'lucide-react';

interface AgentDashboardProps {
  onRunAgent: (agentId: string) => Promise<any>;
  isLoading: boolean;
}

export default function AgentDashboard({ onRunAgent, isLoading }: AgentDashboardProps) {
  const [activeResults, setActiveResults] = useState<any>(null);
  const [runningAgentId, setRunningAgentId] = useState<string | null>(null);

  const handleRun = async (agentId: string) => {
    setRunningAgentId(agentId);
    try {
      const result = await onRunAgent(agentId);
      if (typeof result === 'string') {
        const parsed = JSON.parse(result);
        setActiveResults(parsed);
      } else {
        setActiveResults(result);
      }
    } catch (e) {
      console.error("Failed to parse agent JSON", e);
    } finally {
      setRunningAgentId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AGENTS.map((agent) => (
          <div key={agent.id} className="border rounded-xl p-4 bg-white hover:border-blue-400 transition-all shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <agent.icon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{agent.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">{agent.description}</p>
                </div>
              </div>
              <button
                onClick={() => handleRun(agent.id)}
                disabled={isLoading}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full disabled:opacity-50 transition-colors"
              >
                {isLoading && runningAgentId === agent.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Results Section - Issue Cards */}
      {activeResults && activeResults.findings && activeResults.findings.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
            Agent Findings
          </h3>
          <div className="space-y-3">
            {activeResults.findings.map((item: any, idx: number) => (
              <div key={idx} className="bg-white border-l-4 border-amber-500 rounded-r-lg shadow-sm p-4 border-y border-r">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="inline-block px-2 py-1 text-xs font-bold bg-amber-100 text-amber-800 rounded mb-2">
                      {item.id} • {item.severity}
                    </span>
                    <h5 className="font-semibold text-gray-900">{item.title}</h5>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase">Recommendation</p>
                  <p className="text-sm text-blue-700">{item.recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {activeResults && activeResults.findings && activeResults.findings.length === 0 && (
         <div className="text-center p-8 bg-white rounded-xl border border-dashed border-gray-300">
           <p className="text-gray-500">No issues found by this agent.</p>
         </div>
      )}
    </div>
  );
}
