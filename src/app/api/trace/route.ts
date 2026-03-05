import { NextRequest, NextResponse } from 'next/server';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { getVectorStore } from '@/lib/vectorStore';
import { ChatMessage } from '@langchain/core/messages';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const vectorStore = getVectorStore();
    if (!vectorStore) {
      return NextResponse.json({ error: 'No document has been uploaded yet' }, { status: 400 });
    }

    // 1. Retrieve Context (Get a broad sample of chunks to find IDs)
    // In a real app with DB, we'd query the "Requirements" table.
    // Here we scan the top K most relevant chunks or just grab many.
    // We'll search for "shall verify test" to get relevant chunks.
    const searchResults = await vectorStore.similaritySearch("requirement shall test verify", 20);
    const context = searchResults.map(r => `[Source: ${r.metadata.source}] ${r.pageContent}`).join('\n\n');

    // 2. System Prompt for Traceability
    const systemInstruction = `You are a Traceability Matrix Generator.
    Analyze the provided technical documentation text.
    Your goal is to map Requirements to Test Cases.

    Task:
    1. Identify every Requirement ID (e.g., REQ-xxx, SRS-xxx) and its text.
    2. Search for any Test Case ID (e.g., TST-xxx, VER-xxx) that references it.
    3. If a requirement has a linked test, mark it as 'Verified'. If not, 'Unverified'.
    4. If you see a test result (Pass/Fail), include that.

    Return a JSON object with this EXACT structure:
    {
      "items": [
        {
          "id": "REQ-001",
          "content": "The system shall...",
          "source": "filename.pdf",
          "coveredBy": ["TST-001"],
          "status": "Verified", 
          "testStatus": "Pass"
        }
      ]
    }
    
    IMPORTANT: 
    - Only return the JSON. 
    - If you can't find specific IDs, try to infer relationships from context or generate placeholder IDs based on the text (e.g., inferred-req-1).
    - Be strict about coverage.`;

    // 3. Construct Messages
    const finalMessages = [
      new ChatMessage({
        role: 'human', 
        content: `${systemInstruction}\n\nCONTEXT:\n${context}` 
      })
    ];

    // 4. Invoke Model
    const model = new ChatGoogleGenerativeAI({
      model: 'gemini-3-flash-preview',
      temperature: 0,
      apiKey: process.env.GOOGLE_API_KEY,
      generationConfig: { responseMimeType: "application/json" },
    } as any);

    const response = await model.invoke(finalMessages);
    const textResponse = response.content as string;
    
    // Clean and Parse
    const cleaned = textResponse.replace(/```json\n?|\n?```/g, '').trim();

    let data;
    try {
      data = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('Failed to parse model response as JSON:', parseError);
      return NextResponse.json(
        { error: 'Failed to process traceability data. Please try again.' },
        { status: 500 }
      );
    }

    // Calculate Stats
    const total = data.items?.length || 0;
    const verified = (data.items || []).filter((i: any) => i.status === 'Verified').length;
    
    const result = {
      items: data.items || [],
      stats: {
        total,
        verified,
        unverified: total - verified,
        coverage: total > 0 ? Math.round((verified / total) * 100) : 0
      }
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Traceability error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
