'use client';

import React, { useState } from 'react';

import FileUpload from '@/components/FileUpload';

import ChatInterface, { Message } from '@/components/ChatInterface';

import AgentDashboard from '@/components/AgentDashboard';

import TraceabilityMatrix from '@/components/TraceabilityMatrix';

import { ShieldCheck, Settings, AlertCircle } from 'lucide-react';

import { STANDARDS } from '@/lib/standards';

import { cn } from '@/lib/utils';

import { TraceMatrixData } from '@/lib/traceability';

import { AgentResponse } from '@/lib/agents';



export default function Home() {

  const [messages, setMessages] = useState<Message[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  const [isDocumentReady, setIsDocumentReady] = useState(false);

  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const [selectedStandard, setSelectedStandard] = useState(STANDARDS[0].id);

  const [activeTab, setActiveTab] = useState<'chat' | 'agents' | 'traceability'>('chat');

  const [quotaError, setQuotaError] = useState(false);



  const generateSummary = async (fileName: string) => {

    setIsLoading(true);

    setQuotaError(false);

    const standardName = STANDARDS.find(s => s.id === selectedStandard)?.name || 'Unknown Standard';

    const summaryPrompt = `Please analyze the uploaded document (${fileName}) against ${standardName}. 

Provide a comprehensive structured summary in Markdown format.

Include:

1.  **Executive Summary**: A brief overview.

2.  **Compliance Status**: Pass, Fail, or Partial (with reasoning).

3.  **Key Risks & Gaps**: Bullet points of potential issues.

4.  **Recommendations**: Actionable steps to improve compliance.

`;



    const hiddenMessage: Message = {

      role: 'user',

      content: summaryPrompt,

      timestamp: new Date(),

      hidden: true,

    };



    setMessages([hiddenMessage]);



    try {

      const response = await fetch('/api/chat', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

          message: summaryPrompt,

          history: [], 

          standard: selectedStandard,

        }),

      });



      const data = await response.json();



      if (!response.ok) {

        if (response.status === 429 || data.error?.includes('quota')) {

          setQuotaError(true);

        }

        throw new Error(data.error || 'Summary generation failed');

      }

      

      setMessages((prev) => [

        ...prev,

        {

          role: 'assistant',

          content: data.reply,

          timestamp: new Date(),

        },

      ]);

    } catch (error) {

      console.error(error);

      const isQuota = (error as Error).message.toLowerCase().includes('quota');

      setMessages((prev) => [

        ...prev,

        {

          role: 'assistant',

          content: isQuota 

            ? "⚠️ **Quota Limit Reached:** This demo has reached its free-tier usage limit for the Gemini AI. Please try again later or tomorrow."

            : "I'm sorry, I couldn't generate a summary at this time. Please ask me anything about the document.",

          timestamp: new Date(),

        }

      ]);

    } finally {

      setIsLoading(false);

    }

  };



  const handleUpload = async (file: File) => {

    const formData = new FormData();

    formData.append('file', file);

    formData.append('standard', selectedStandard);



    const response = await fetch('/api/upload', {

      method: 'POST',

      body: formData,

    });



    if (!response.ok) {

      throw new Error('Upload failed');

    }



    setUploadedFileName(file.name);

    setIsDocumentReady(true);

    await generateSummary(file.name);

  };



  const handleSendMessage = async (content: string) => {

    setQuotaError(false);

    const newMessage: Message = {

      role: 'user',

      content,

      timestamp: new Date(),

    };



    const newHistory = [...messages, newMessage];

    setMessages(newHistory);

    setIsLoading(true);



    try {

      const response = await fetch('/api/chat', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

          message: content,

          history: newHistory,

          standard: selectedStandard,

        }),

      });



      const data = await response.json();



      if (!response.ok) {

        if (response.status === 429 || data.error?.includes('quota')) {

          setQuotaError(true);

        }

        throw new Error(data.error || 'Chat failed');

      }

      

      setMessages((prev) => [

        ...prev,

        {

          role: 'assistant',

          content: data.reply,

          timestamp: new Date(),

        },

      ]);

    } catch (error) {

      console.error(error);

      const isQuota = (error as Error).message.toLowerCase().includes('quota');

      setMessages((prev) => [

        ...prev,

        {

          role: 'assistant',

          content: isQuota 

            ? "⚠️ **Quota Limit Reached:** The Gemini AI free-tier limit has been reached. Please try again later."

            : "I'm sorry, there was an error processing your request.",

          timestamp: new Date(),

        },

      ]);

    } finally {

      setIsLoading(false);

    }

  };



  const handleRunAgent = async (agentId: string): Promise<AgentResponse | string> => {

    setIsLoading(true);

    setQuotaError(false);

    try {

      const response = await fetch('/api/chat', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

          message: "Run analysis", 

          agentId: agentId, 

          standard: selectedStandard

        })

      });

      const data = await response.json();

      if (!response.ok) {

        if (response.status === 429 || data.error?.includes('quota')) {

          setQuotaError(true);

        }

        throw new Error(data.error || 'Agent execution failed');

      }

      return data.reply; 

    } catch (error) {

      console.error(error);

      return JSON.stringify({

        findings: [{

          id: "ERROR",

          severity: "High",

          title: "Execution Error",

          description: (error as Error).message.includes('quota') 

            ? "Free-tier quota exceeded for Gemini AI." 

            : "There was an error running the agent.",

          recommendation: "Please try again later."

        }]

      });

    } finally {

      setIsLoading(false);

    }

  };



  const handleGenerateTrace = async (): Promise<TraceMatrixData | null> => {

    try {

      setQuotaError(false);

      const response = await fetch('/api/trace', {

        method: 'POST',

      });

      

      const data = await response.json();



      if (!response.ok) {

        if (response.status === 429 || data.error?.includes('quota')) {

          setQuotaError(true);

        }

        throw new Error(data.error || 'Traceability generation failed');

      }

      return data;

    } catch (error) {

      console.error(error);

      return null;

    }

  };



  return (

    <main className="min-h-screen bg-gray-50 pb-12">

      {/* Demo Banner */}

      <div className="bg-blue-600 text-white py-2 px-4 text-center text-sm font-medium">

        This is a Demo Application. Note: Gemini AI Free Tier usage is limited to 20 requests per day.

      </div>

      

      {quotaError && (

        <div className="bg-amber-50 border-b border-amber-200 p-4">

          <div className="max-w-7xl mx-auto flex items-center text-amber-800">

            <AlertCircle className="h-5 w-5 mr-2" />

            <p className="text-sm font-medium">

              Quota Limit Reached: The free tier of Gemini AI has been exceeded due to popularity. Please try again tomorrow.

            </p>

          </div>

        </div>

      )}



      {/* Header */}

      <nav className="bg-white border-b sticky top-0 z-10">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          <div className="flex items-center space-x-2">

            <ShieldCheck className="h-8 w-8 text-blue-600" />

            <span className="text-xl font-bold text-gray-900 tracking-tight">ReguCheck</span>

          </div>

          <div className="flex items-center space-x-4">

            <div className="flex items-center space-x-2 bg-gray-50 border rounded-lg px-3 py-1.5">

              <Settings className="h-4 w-4 text-gray-500" />

              <select

                value={selectedStandard}

                onChange={(e) => setSelectedStandard(e.target.value)}

                className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none"

              >

                {STANDARDS.map((s) => (

                  <option key={s.id} value={s.id}>

                    {s.name}

                  </option>

                ))}

              </select>

            </div>

          </div>

        </div>

      </nav>



      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {!isDocumentReady ? (

          <div className="py-12">

            <div className="text-center mb-12">

              <h1 className="text-4xl font-extrabold text-gray-900 mb-4">

                AI Compliance Assistant

              </h1>

              <p className="text-lg text-gray-600 max-w-2xl mx-auto">

                Upload your technical specifications and verify compliance with international safety standards instantly.

              </p>

            </div>

            <FileUpload onUpload={handleUpload} />

          </div>

        ) : (

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

            <div className="lg:col-span-1">

              <div className="bg-white p-6 rounded-xl border shadow-sm sticky top-24">

                <h3 className="font-semibold text-gray-900 mb-4">Document Stats</h3>

                <div className="space-y-4 text-sm">

                  <div className="flex flex-col py-2 border-b">

                    <span className="text-gray-500 mb-1">Uploaded Document</span>

                    <span className="font-medium text-gray-900 break-words">

                      {uploadedFileName}

                    </span>

                  </div>

                  <div className="flex justify-between py-2 border-b">

                    <span className="text-gray-500">Standard</span>

                    <span className="font-medium text-blue-600">

                      {STANDARDS.find(s => s.id === selectedStandard)?.name}

                    </span>

                  </div>

                </div>

                <button

                  onClick={() => {

                    setIsDocumentReady(false);

                    setUploadedFileName(null);

                    setMessages([]);

                    setActiveTab('chat');

                  }}

                  className="w-full mt-6 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border rounded-lg hover:bg-gray-50 transition-colors"

                >

                  Upload New Document

                </button>

              </div>

            </div>

            <div className="lg:col-span-3">

              <div className="flex space-x-2 mb-4 bg-gray-100 p-1 rounded-lg w-fit">

                <button 

                  onClick={() => setActiveTab('chat')}

                  className={cn("px-4 py-2 rounded-md font-medium text-sm transition-all", activeTab === 'chat' ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900")}

                >

                  Chat Assistant

                </button>

                <button 

                  onClick={() => setActiveTab('agents')}

                  className={cn("px-4 py-2 rounded-md font-medium text-sm transition-all", activeTab === 'agents' ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900")}

                >

                  AI Agents

                </button>

                <button 

                  onClick={() => setActiveTab('traceability')}

                  className={cn("px-4 py-2 rounded-md font-medium text-sm transition-all", activeTab === 'traceability' ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900")}

                >

                  Traceability Matrix

                </button>

              </div>



              {activeTab === 'chat' && (

                <ChatInterface

                  messages={messages}

                  onSendMessage={handleSendMessage}

                  isLoading={isLoading}

                />

              )}

              

              {activeTab === 'agents' && (

                <AgentDashboard onRunAgent={handleRunAgent} isLoading={isLoading} />

              )}

              

              {activeTab === 'traceability' && (

                <TraceabilityMatrix 

                  onGenerate={handleGenerateTrace} 

                  isLoading={isLoading} 

                />

              )}

            </div>

          </div>

        )}

      </div>

    </main>

  );

}
