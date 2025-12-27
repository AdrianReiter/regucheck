# ReguCheck: AI-Powered Regulatory Compliance Assistant

**ReguCheck** is a full-stack AI SaaS application designed to automate the manual burden of checking technical documentation against complex regulatory standards. Built with **Next.js (TypeScript)**, **LangChain**, and **Google Gemini**, it empowers regulatory professionals to validate documents instantly.

## 🚀 Key Features

*   **Automated Document Analysis:** Upload technical PDFs and receive instant, structured compliance summaries (Executive Summary, Risks, Compliance Status).
*   **Intelligent Chat Interface:** A stateful, context-aware chat assistant that answers complex regulatory questions based *only* on the provided document evidence.
*   **Multi-Standard Support:** Switch seamlessly between international standards:
    *   **FDA 510(k)** (Premarket Notification)
    *   **ISO 13485** (Quality Management)
    *   **IEC 62304** (Medical Device Software)
*   **Agentic AI Workflow:** Proactive AI Agents that scan documents for specific issues:
    *   **Requirement Conflict Agent:** Detects contradicting requirements (e.g., Security vs. Performance).
    *   **Traceability Agent:** Identifies requirements missing validation test cases.
*   **Evidence-Based Answers:** All AI responses are grounded in the uploaded text to prevent hallucinations ("RAG" - Retrieval Augmented Generation).

## 🛠️ Tech Stack

*   **Frontend:** Next.js 14+ (App Router), React, Tailwind CSS, Lucide Icons.
*   **Backend:** Next.js API Routes (Serverless).
*   **AI & Logic:** 
    *   **LangChain.js** for orchestration and RAG.
    *   **Google Gemini Pro** (via `@langchain/google-genai`) for LLM inference.
    *   **Vector Search:** In-memory vector store for document retrieval.
*   **Processing:** `pdf-parse` for document ingestion.

## 🏃‍♂️ Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/regucheck.git
    cd regucheck
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env.local` file and add your Google Gemini API key:
    ```env
    GOOGLE_API_KEY=your_google_api_key_here
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) with your browser.

## 🛡️ Compliance & Safety

ReguCheck is designed to be a "Human-in-the-loop" tool. It assists regulatory experts by flagging potential risks and ambiguities but does not replace professional judgment.