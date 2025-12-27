'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  hidden?: boolean;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
  disabled?: boolean;
}

export default function ChatInterface({ messages, onSendMessage, isLoading, disabled }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const visibleMessages = messages.filter(m => !m.hidden);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || disabled) return;

    const content = input.trim();
    setInput('');
    await onSendMessage(content);
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-3xl mx-auto border rounded-xl bg-white shadow-sm">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {visibleMessages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-2 text-center p-8">
            <Bot className={cn("h-12 w-12 opacity-20", isLoading && "animate-pulse")} />
            {isLoading ? (
              <p className="max-w-xs">Hang on a second, we are comparing your document against the regulation and will provide a quick summary shortly...</p>
            ) : (
              <p>Upload a document and ask a compliance question.</p>
            )}
          </div>
        )}
        {visibleMessages.map((message, index) => (
          <div
            key={index}
            className={cn(
              'flex w-full',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'flex max-w-[80%] space-x-3 p-4 rounded-2xl',
                message.role === 'user'
                  ? 'bg-blue-100 text-blue-900 rounded-br-none'
                  : 'bg-gray-100 text-gray-900 rounded-bl-none'
              )}
            >
              <div className="flex-shrink-0">
                {message.role === 'user' ? (
                  <User className="h-5 w-5 text-blue-700" />
                ) : (
                  <Bot className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1 text-sm overflow-hidden">
                <div 
                  className={cn(
                    "prose prose-sm max-w-none break-words",
                    message.role === 'user' ? "prose-headings:text-blue-900 prose-p:text-blue-900 prose-strong:text-blue-900" : "prose-headings:text-gray-900 prose-p:text-gray-900 prose-strong:text-gray-900"
                  )}
                >
                  <ReactMarkdown>
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-4 rounded-2xl rounded-bl-none">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={disabled || isLoading}
            placeholder={disabled ? "Please upload a document first" : "Ask about compliance..."}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400 bg-gray-900 text-white placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={disabled || isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
