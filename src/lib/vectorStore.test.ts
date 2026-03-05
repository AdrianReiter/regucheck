import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getVectorStore, clearVectorStore, addDocumentsToStore } from './vectorStore';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Document } from '@langchain/core/documents';

vi.mock('langchain/vectorstores/memory', () => {
  return {
    MemoryVectorStore: {
      fromDocuments: vi.fn().mockResolvedValue({
        addDocuments: vi.fn().mockResolvedValue(undefined),
      }),
    },
  };
});

vi.mock('@langchain/google-genai', () => {
  return {
    GoogleGenerativeAIEmbeddings: vi.fn(),
  };
});

describe('vectorStore', () => {
  beforeEach(() => {
    clearVectorStore();
  });

  it('should initially return null', () => {
    expect(getVectorStore()).toBeNull();
  });

  it('should initialize the store when documents are added', async () => {
    const docs = [new Document({ pageContent: 'test' })];
    await addDocumentsToStore(docs);
    expect(getVectorStore()).not.toBeNull();
  });

  it('should clear the store when clearVectorStore is called', async () => {
    const docs = [new Document({ pageContent: 'test' })];
    await addDocumentsToStore(docs);
    expect(getVectorStore()).not.toBeNull();

    clearVectorStore();
    expect(getVectorStore()).toBeNull();
  });
});
