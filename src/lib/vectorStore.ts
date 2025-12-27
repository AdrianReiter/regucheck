import { MemoryVectorStore } from 'langchain/vectorstores/memory';

// Singleton for demo purposes
let vectorStore: MemoryVectorStore | null = null;

export const setVectorStore = (store: MemoryVectorStore) => {
  vectorStore = store;
};

export const getVectorStore = () => {
  return vectorStore;
};
