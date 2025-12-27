import { NextRequest, NextResponse } from 'next/server';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { getVectorStore } from '@/lib/vectorStore';
import { STANDARDS } from '@/lib/standards';
import { AGENTS } from '@/lib/agents';
import { ChatMessage } from '@langchain/core/messages';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { message, history, standard: standardId, agentId } = await req.json();
    console.log('Received request:', { message, agentId });

    const vectorStore = getVectorStore();
    if (!vectorStore) {
      console.error('Vector store is null');
      return NextResponse.json({ error: 'No document has been uploaded yet' }, { status: 400 });
    }

    // 1. Determine System Prompt & Mode
    let systemInstruction = '';
    const isAgentMode = !!agentId;

    if (isAgentMode) {
      const agent = AGENTS.find(a => a.id === agentId);
      if (!agent) {
        return NextResponse.json({ error: 'Invalid Agent ID' }, { status: 400 });
      }
      systemInstruction = agent.systemPrompt;
    } else {
      const standard = STANDARDS.find(s => s.id === standardId) || STANDARDS[0];
      systemInstruction = `${standard.systemPrompt}
You are verifying technical documentation against the ${standard.name} standard.
Be skeptical, precise, and always cite the document content.`;
    }

    // 2. Retrieve relevant chunks
    // Increase k for Agents to see more context
    const k = isAgentMode ? 8 : 4;
    console.log(`Searching vector store with k=${k}...`);
    
    const searchResults = await vectorStore.similaritySearch(message || "full document analysis", k);
    console.log(`Found ${searchResults.length} chunks`);
    const context = searchResults.map(r => r.pageContent).join('\n\n');

    // 3. Construct Context-Aware System Instruction
    const fullSystemInstruction = `${systemInstruction}

CRITICAL INSTRUCTION FOR COMPLIANCE:
You are an "Audit-Ready" AI. You must not hallucinate. 
1. Base your analysis SOLELY on the Context provided below.
2. For every finding, cite the exact text snippet or section number from the Context.
3. If you find a requirement (e.g., "The system shall..."), check if it is specific and measurable.
4. If the user asks for "Traceability," look for ID numbers (e.g., REQ-001) and try to find matching Test IDs (e.g., TST-001).

Context from document:
${context}`;

    // 4. Map History to ChatMessage (Only for Chat Mode)
    const historyMessages: ChatMessage[] = [];
    if (!isAgentMode && Array.isArray(history)) {
      history.slice(-5).forEach((msg: any) => {
        if (!msg || !msg.content) return; 
        
        if (msg.role === 'user') {
          historyMessages.push(new ChatMessage({ role: 'human', content: msg.content }));
        } else if (msg.role === 'assistant' || msg.role === 'model') {
          historyMessages.push(new ChatMessage({ role: 'ai', content: msg.content }));
        }
      });

      if (historyMessages.length > 0 && historyMessages[0].role === 'ai') {
        historyMessages.shift();
      }
    }

    // 5. Construct Final Message List
    const finalMessages = [
      ...historyMessages,
      new ChatMessage({ 
        role: 'human', 
        content: `${fullSystemInstruction}\n\nUser Query: ${message || "Run full analysis."}` 
      })
    ];

    // 6. Generate Response
    console.log(`Invoking Gemini model via @langchain/google-genai (AgentMode: ${isAgentMode})...`);
    
    const model = new ChatGoogleGenerativeAI({
      model: 'gemini-3-flash-preview',
      temperature: isAgentMode ? 0.1 : 0, // Lower temp for structured agent tasks
      apiKey: process.env.GOOGLE_API_KEY,
      generationConfig: isAgentMode ? { responseMimeType: "application/json" } : undefined,
    } as any);

    const response = await model.invoke(finalMessages);
    console.log('Gemini response received');

    return NextResponse.json({ 
      reply: response.content,
      isAgentResponse: isAgentMode 
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}