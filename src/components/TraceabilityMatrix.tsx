'use client';

import React, { useState, useEffect } from 'react';
import { 
  Table, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Link as LinkIcon, 
  Loader2,
  PieChart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TraceMatrixData } from '@/lib/traceability';

interface TraceabilityMatrixProps {
  isLoading: boolean;
  onGenerate: () => Promise<TraceMatrixData | null>;
}

export default function TraceabilityMatrix({ isLoading: parentLoading, onGenerate }: TraceabilityMatrixProps) {
  const [data, setData] = useState<TraceMatrixData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await onGenerate();
      if (result) {
        setData(result);
      }
    } catch (err) {
      setError('Failed to generate traceability matrix.');
    } finally {
      setLoading(false);
    }
  };

  const isLoading = parentLoading || loading;

  if (!data && !isLoading && !error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white border border-dashed rounded-xl">
        <div className="bg-blue-50 p-4 rounded-full mb-4">
          <LinkIcon className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Traceability Matrix</h3>
        <p className="text-gray-500 text-center max-w-sm mt-2 mb-6">
          Generate a matrix to visualize the links between your Requirements and Test Cases. 
          Identify gaps in coverage instantly.
        </p>
        <button
          onClick={handleGenerate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          Generate Matrix
        </button>
      </div>
    );
  }

  if (isLoading && !data) {
     return (
      <div className="flex flex-col items-center justify-center p-24 bg-white border rounded-xl">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500">Scanning documents for relationships...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-red-50 rounded-xl border border-red-200">
        <p className="text-red-600">{error}</p>
        <button onClick={handleGenerate} className="mt-4 text-sm text-red-700 underline">Try Again</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Stats Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <p className="text-xs text-gray-500 font-medium uppercase">Total Requirements</p>
            <p className="text-2xl font-bold text-gray-900">{data.stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <p className="text-xs text-gray-500 font-medium uppercase">Verified</p>
            <p className="text-2xl font-bold text-green-600">{data.stats.verified}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <p className="text-xs text-gray-500 font-medium uppercase">Unverified (Gaps)</p>
            <p className="text-2xl font-bold text-amber-600">{data.stats.unverified}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <p className="text-xs text-gray-500 font-medium uppercase">Coverage</p>
            <div className="flex items-center">
              <PieChart className={cn("h-5 w-5 mr-2", data.stats.coverage < 100 ? "text-amber-500" : "text-green-500")} />
              <p className={cn("text-2xl font-bold", data.stats.coverage < 100 ? "text-amber-600" : "text-green-600")}>
                {data.stats.coverage}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* The Matrix Table */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requirement
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Linked Tests
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-gray-400 mr-2" />
                      {item.id}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                    {item.content}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.coveredBy.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {item.coveredBy.map(testId => (
                          <span key={testId} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {testId}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.status === 'Verified' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        <XCircle className="w-3 h-3 mr-1" /> Unverified
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
