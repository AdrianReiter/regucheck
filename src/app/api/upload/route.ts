import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
import pdf from 'pdf-parse/lib/pdf-parse.js';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { addDocumentsToStore } from '@/lib/vectorStore';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const standard = formData.get('standard') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // 1. Parse PDF
    const data = await pdf(buffer);
    const text = data.text;

    // 2. Chunk Text with Metadata
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    
    // We explicitly tag the source so the AI knows which file is which
    const docs = await splitter.createDocuments(
        [text], 
        [{ source: file.name, standard, uploadTime: new Date().toISOString() }]
    );

    // 3. Embed and Append to Store
    await addDocumentsToStore(docs);

    return NextResponse.json({ 
      success: true, 
      message: 'Document processed and added to context.',
      fileName: file.name 
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
