import { NextRequest, NextResponse } from 'next/server';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatMessage } from '@langchain/core/messages';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { finding, standard } = await req.json();

    if (!finding) {
      return NextResponse.json({ error: 'No finding provided' }, { status: 400 });
    }

    const systemInstruction = `You are a Senior Regulatory Compliance Specialist.
    Your task is to propose a CONCRETE FIX for a compliance issue found in a technical document.
    
    The User will provide a specific "Finding" (Issue).
    You must generate:
    1. A "Suggested Rewrite" or "Action Item" that resolves the issue.
    2. A brief "Rationale" explaining why this fixes the compliance gap.
    
    Standard Context: ${standard || 'General GxP'}

    Input Finding:
    Title: ${finding.title}
    Description: ${finding.description}
    Recommendation: ${finding.recommendation}

    Return a JSON object with this EXACT structure:
    {
      "fix": "The specific new text or action...",
      "rationale": "Why this works..."
    }
    `;

    const finalMessages = [
      new ChatMessage({
        role: 'human',
        content: systemInstruction
      })
    ];

    const model = new ChatGoogleGenerativeAI({
      model: 'gemini-3-flash-preview',
      temperature: 0.1,
      apiKey: process.env.GOOGLE_API_KEY,
      generationConfig: { responseMimeType: "application/json" },
    } as any);

    const response = await model.invoke(finalMessages);
    const textResponse = response.content as string;
    
    const cleaned = textResponse.replace(/```json\n?|\n?```/g, '').trim();
    const data = JSON.parse(cleaned);

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Auto-Fix error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
