import { NextResponse } from "next/server";
import { HuggingFaceInference } from "@langchain/community/llms/hf";

import { ConversationChain } from "langchain/chains";
import { ChatMessageHistory } from "langchain/memory";
import { BufferMemory } from "langchain/memory";
import {
  SystemMessage,
  HumanMessage,
  AIMessage,
} from "@langchain/core/messages";
import { systemPrompt } from "@/utils/prompts";
import {
  MODEL_NAME,
  TEMPERATURE,
  MAX_TOKENS,
  topP,
  streaming,
} from "@/utils/constants";
import { Message } from "@/types";
import { extractTextFromPDF, splitText } from "@/utils/pdf/loader";
import { createVectorStore } from "@/utils/pdf/vector";
import { RetrievalQAChain } from "langchain/chains";
import { PromptTemplate } from "@langchain/core/prompts";
export async function POST(req: Request) {
  try {
    const { messages }: { messages: Message[] } = await req.json();

    // สร้างโมเดล Hugging Face
    const chat = new HuggingFaceInference({
      model: MODEL_NAME,
      temperature: TEMPERATURE,
      maxTokens: MAX_TOKENS,
      topP: topP,
      stopSequences: ["\nHuman:", "\n\nHuman:"],
      apiKey: process.env.HUGGINGFACE_API_KEY, // ใช้ API Key ของ Hugging Face
    });

    // สร้าง chat history
    const chatHistory = new ChatMessageHistory();

    // เพิ่ม system prompt
    await chatHistory.addMessage(new SystemMessage(systemPrompt));

    // เพิ่มประวัติการสนทนา
    for (const msg of messages.slice(0, -1)) {
      // ไม่รวมข้อความล่าสุด
      if (msg.role === "user") {
        await chatHistory.addMessage(new HumanMessage(msg.content));
      } else {
        await chatHistory.addMessage(new AIMessage(msg.content));
      }
    }

    // สร้าง memory
    const memory = new BufferMemory({
      chatHistory,
      returnMessages: true,
      memoryKey: "history",
      inputKey: "input",
      outputKey: "response",
    });

    // สร้าง chain
    const chain = new ConversationChain({
      llm: chat,
      memory: memory,
      verbose: true, // เพื่อดู debug log
    });

    // ส่งข้อความล่าสุดเข้าไป
    const result = await chain.call({
      input: messages[messages.length - 1].content,
    });
    const rawResponse = result.response || ""; // กำหนดค่า default เป็น string ว่าง
    const cleanedResponse = rawResponse
      .split("\nHuman:")[0]
      .trim()
      .replace(/(\n{2,})/g, "\n")
      .replace(/Human:$/, "");

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
