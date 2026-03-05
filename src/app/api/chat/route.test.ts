import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import { getVectorStore } from '@/lib/vectorStore';

// Mock the vectorStore module
vi.mock('@/lib/vectorStore', () => ({
  getVectorStore: vi.fn(),
}));

// Mock @langchain/google-genai to avoid initializing real models during tests
vi.mock('@langchain/google-genai', () => ({
  ChatGoogleGenerativeAI: vi.fn(),
}));

describe('Chat API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if vector store is null', async () => {
    // Arrange
    vi.mocked(getVectorStore).mockReturnValue(null);

    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello',
        history: [],
        standard: 'iso-13485',
        agentId: null,
      }),
    });

    // Act
    const response = await POST(req);

    // Assert
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ error: 'No document has been uploaded yet' });
  });
});
