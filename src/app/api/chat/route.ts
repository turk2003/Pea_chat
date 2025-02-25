import { NextResponse } from "next/server";
import { HuggingFaceInference } from "@langchain/community/llms/hf";
import { ConversationChain } from "langchain/chains";
import { ChatMessageHistory, BufferMemory } from "langchain/memory";
import {
  SystemMessage,
  HumanMessage,
  AIMessage,
} from "@langchain/core/messages";

import { systemPrompt } from "@/utils/prompts";
import { MODEL_NAME, TEMPERATURE, MAX_TOKENS, topP } from "@/utils/constants";
import { Message } from "@/types";
import pdf from "pdf-parse";
import fs from "fs";
import path from "path";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
async function loadPDFContent() {
  const pdfPath = path.join(process.cwd(), "public", "pea_1.pdf");

  try {
    const { default: pdf } = await import("pdf-parse");
    console.log("PDF file path:", pdfPath);
    if (!fs.existsSync(pdfPath)) {
      console.warn("PDF file not found at:", pdfPath);
      return "";
    }

    const fileBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(fileBuffer);
    return data.text;
  } catch (error) {
    console.error("Error loading PDF:", error);
    console.log("PDF file path:", pdfPath);
    return "";
  }
}

// โหลดเนื้อหา PDF เมื่อเซิร์ฟเวอร์เริ่มต้น
// const pdfContentPromise = loadPDFContent();

export async function createRAGChain(pdfContent: string) {
  // 1. Split text into chunks
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const chunks = await textSplitter.createDocuments([pdfContent]);

  // 2. Create embeddings and vector store
  const embeddings = new HuggingFaceInferenceEmbeddings({
    apiKey: process.env.HUGGINGFACE_API_KEY,
    model: "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2", // หรือ model ที่เหมาะสมกับภาษาไทย
  });
  const vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);

  return async function generateResponse(
    messages: Message[],
    latestQuestion: string
  ) {
    // 3. Retrieve relevant chunks
    const relevantDocs = await vectorStore.similaritySearch(latestQuestion, 3);
    const relevantContent = relevantDocs
      .map((doc) => doc.pageContent)
      .join("\n");

    // 4. Create LLM instance
    const llm = new HuggingFaceInference({
      model: MODEL_NAME,
      temperature: TEMPERATURE,
      maxTokens: MAX_TOKENS,
      topP: topP,
      stopSequences: ["\nHuman:", "\n\nHuman:"],
      apiKey: process.env.HUGGINGFACE_API_KEY,
    });

    // 5. Setup conversation history with system prompt
    const memory = new BufferMemory({
      returnMessages: true,
      memoryKey: "history",
      inputKey: "input",
      outputKey: "response",
    });

    // Add system prompt first
    await memory.chatHistory.addMessage(new SystemMessage(systemPrompt));

    // Add conversation history
    for (const msg of messages.slice(0, -1)) {
      await memory.chatHistory.addMessage(
        msg.role === "user"
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content)
      );
    }

    // 6. Create chain
    const chain = new ConversationChain({
      llm: llm,
      memory: memory,
      verbose: true,
    });

    // 7. Generate response with combined context
    const prompt = `
      System Instructions: ${systemPrompt}

      Relevant Context:
      ${relevantContent}
      
      User Question: ${latestQuestion}
      
      Please provide a response that takes into account both the system instructions and the relevant context.
    `;

    return await chain.call({ input: prompt });
  };
}

// api/chat/route.ts
export async function POST(req: Request) {
  try {
    const { messages }: { messages: Message[] } = await req.json();
    const pdfContent = await loadPDFContent();

    // Create RAG chain with PDF content
    const generateResponse = await createRAGChain(pdfContent);

    // Get response using the chain
    const latestQuestion = messages[messages.length - 1].content;
    const result = await generateResponse(messages, latestQuestion);

    const cleanedResponse = result.response
      .split("\nHuman:")[0]
      .trim()
      .replace(/(\n{2,})/g, "\n")
      .replace(/Human:$/, "")
      .replace(/<[^>]+>/g, "") // ลบ HTML tags
      .replace(/(ตอบ|คำตอบ):\s*/i, "") // ลบคำขึ้นต้น
      .replace(/\n{2,}/g, "\n")
      .trim();

    return NextResponse.json({
      response: cleanedResponse,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in chat route:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }
}
