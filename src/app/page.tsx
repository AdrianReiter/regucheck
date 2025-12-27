'use client';

import React, { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import ChatInterface, { Message } from '@/components/ChatInterface';
import { ShieldCheck, Settings } from 'lucide-react';
import { STANDARDS } from '@/lib/standards';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDocumentReady, setIsDocumentReady] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [selectedStandard, setSelectedStandard] = useState(STANDARDS[0].id);

  const generateSummary = async (fileName: string) => {
    setIsLoading(true);
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

      if (!response.ok) throw new Error('Summary generation failed');

      const data = await response.json();
      
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
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm sorry, I couldn't generate a summary at this time. Please ask me anything about the document.",
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

      if (!response.ok) throw new Error('Chat failed');

      const data = await response.json();
      
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-12">
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
                  }}
                  className="w-full mt-6 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Upload New Document
                </button>
              </div>
            </div>
            <div className="lg:col-span-3">
              <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}