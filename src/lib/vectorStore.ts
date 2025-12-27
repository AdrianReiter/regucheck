import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Document } from '@langchain/core/documents';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

let vectorStore: MemoryVectorStore | null = null;

// Initialize or Append to the store
export const addDocumentsToStore = async (docs: Document[]) => {
  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GOOGLE_API_KEY,
    model: "text-embedding-004",
  });

  if (!vectorStore) {
    vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
  } else {
    await vectorStore.addDocuments(docs);
  }
  return vectorStore;
};

export const getVectorStore = () => {
  return vectorStore;
};

// Clear store (useful for "New Session")
export const clearVectorStore = () => {
  vectorStore = null;
};
