import { NextRequest } from 'next/server';
import { POST } from './route';
import { describe, it, expect, vi } from 'vitest';

// Mock the LangChain model
vi.mock('@langchain/google-genai', () => {
  return {
    ChatGoogleGenerativeAI: class {
      invoke() {
        return Promise.resolve({
          content: 'This is not valid JSON'
        });
      }
    }
  };
});

describe('POST /api/fix', () => {
  it('returns a 500 error when AI response cannot be parsed as JSON', async () => {
    const req = new NextRequest('http://localhost:3000/api/fix', {
      method: 'POST',
      body: JSON.stringify({
        finding: {
          title: 'Test',
          description: 'Test',
          recommendation: 'Test'
        },
        standard: 'Test'
      })
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('Failed to parse the response from the AI model.');
  });
});
