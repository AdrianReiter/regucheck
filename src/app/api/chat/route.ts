import { NextRequest, NextResponse } from 'next/server';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { getVectorStore } from '@/lib/vectorStore';
import { STANDARDS } from '@/lib/standards';
import { ChatMessage } from '@langchain/core/messages';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { message, history, standard: standardId } = await req.json();
    console.log('Received chat request:', message);

    const vectorStore = getVectorStore();
    if (!vectorStore) {
      console.error('Vector store is null');
      return NextResponse.json({ error: 'No document has been uploaded yet' }, { status: 400 });
    }

    const standard = STANDARDS.find(s => s.id === standardId) || STANDARDS[0];

    // 1. Retrieve relevant chunks
    console.log('Searching vector store...');
    const searchResults = await vectorStore.similaritySearch(message, 4);
    console.log(`Found ${searchResults.length} chunks`);
    const context = searchResults.map(r => r.pageContent).join('\n\n');

    // 2. Construct System Instruction
    const systemInstruction = `${standard.systemPrompt}
You are verifying technical documentation against the ${standard.name} standard.
Be skeptical, precise, and always cite the document content.

Context from document:
${context}`;

    // 3. Map History to ChatMessage with LangChain-specific roles
    // We MUST use 'human' and 'ai' roles here. The adapter maps these to 'user' and 'model' for the API.
    // Passing 'user' directly causes the "Unknown / unsupported author" error.
    const historyMessages: ChatMessage[] = [];
    
    if (Array.isArray(history)) {
      history.slice(-5).forEach((msg: any) => {
        if (!msg || !msg.content) return; 
        
        if (msg.role === 'user') {
          historyMessages.push(new ChatMessage({ role: 'human', content: msg.content }));
        } else if (msg.role === 'assistant' || msg.role === 'model') {
          historyMessages.push(new ChatMessage({ role: 'ai', content: msg.content }));
        }
      });
    }

    // Gemini Requirement: Conversation must start with a user (human) message.
    // If the first message in history is from the AI, remove it.
    if (historyMessages.length > 0 && historyMessages[0].role === 'ai') {
      historyMessages.shift();
    }

    // 4. Construct Final Message List
    // We attach the system instruction/context to the final user message.
    const finalMessages = [
      ...historyMessages,
      new ChatMessage({ 
        role: 'human', 
        content: `${systemInstruction}\n\nUser Query: ${message}` 
      })
    ];

    // 5. Generate Response
    console.log('Invoking Gemini model via @langchain/google-genai...');
    
    // Restored 'gemini-3-flash-preview' as it is the correct model for your environment.
    const model = new ChatGoogleGenerativeAI({
      model: 'gemini-3-flash-preview',
      temperature: 0,
      apiKey: process.env.GOOGLE_API_KEY,
    });

    const response = await model.invoke(finalMessages);
    console.log('Gemini response received');

    return NextResponse.json({ reply: response.content });
  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}