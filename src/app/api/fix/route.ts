import { NextRequest, NextResponse } from 'next/server';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatMessage } from '@langchain/core/messages';

export const dynamic = 'force-dynamic';

/**
 * Escapes XML/HTML characters to prevent prompt injection
 * when embedding user input into XML-like tags within the prompt.
 */
function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(req: NextRequest) {
  try {
    const { finding, standard } = await req.json();

    if (!finding) {
      return NextResponse.json({ error: 'No finding provided' }, { status: 400 });
    }

    const safeStandard = sanitizeInput(standard || 'General GxP');
    const safeTitle = sanitizeInput(finding.title);
    const safeDescription = sanitizeInput(finding.description);
    const safeRecommendation = sanitizeInput(finding.recommendation);

    const systemInstruction = `You are a Senior Regulatory Compliance Specialist.
    Your task is to propose a CONCRETE FIX for a compliance issue found in a technical document.
    
    The User will provide a specific "Finding" (Issue). The finding and standard context are provided in XML tags below.
    You must generate:
    1. A "Suggested Rewrite" or "Action Item" that resolves the issue.
    2. A brief "Rationale" explaining why this fixes the compliance gap.
    
    <standard>${safeStandard}</standard>

    <finding>
      <title>${safeTitle}</title>
      <description>${safeDescription}</description>
      <recommendation>${safeRecommendation}</recommendation>
    </finding>

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
