import { describe, it, expect, vi } from 'vitest';
import { POST } from './route';
import { NextRequest, NextResponse } from 'next/server';

// Mock Next.js NextResponse
vi.mock('next/server', () => {
  return {
    NextResponse: {
      json: vi.fn((body, init) => {
        return { body, init };
      }),
    },
  };
});

// Mock @langchain/google-genai to prevent actual API calls
vi.mock('@langchain/google-genai', () => ({
  ChatGoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    invoke: vi.fn(),
  })),
}));

describe('Chat API POST Route', () => {
  it('should return 500 status when an exception is thrown', async () => {
    // Arrange
    const errorMessage = 'Simulated error during JSON parsing';

    // Create a mock request that throws an error when req.json() is called
    const mockReq = {
      json: vi.fn().mockRejectedValue(new Error(errorMessage)),
    } as unknown as NextRequest;

    // Act
    await POST(mockReq);

    // Assert
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: errorMessage },
      { status: 500 }
    );
  });
});
