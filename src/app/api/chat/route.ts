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
// import { loadPDFContent } from "@/utils/pdf/loader";
async function loadPDFContent() {
  const pdfPath = path.join(process.cwd(), "public", "pea_1.pdf");
  // const pdfPath =
  //   "C:Users\turkmOneDriveเดสก์ท็อปdevpea_chat\frontendpea-chatpublicpea_1.pdf";
  try {
    // Dynamic import เพื่อป้องกันปัญหาใน build process
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
const pdfContentPromise = loadPDFContent();

export async function POST(req: Request) {
  try {
    const { messages }: { messages: Message[] } = await req.json();
    const pdfContent = await pdfContentPromise; // ใช้ข้อมูล PDF ที่โหลดไว้

    // สร้างโมเดล Hugging Face
    const chat = new HuggingFaceInference({
      model: MODEL_NAME,
      temperature: TEMPERATURE,
      maxTokens: MAX_TOKENS,
      topP: topP,
      stopSequences: ["\nHuman:", "\n\nHuman:"],
      apiKey: process.env.HUGGINGFACE_API_KEY,
    });

    // สร้าง chat history
    const chatHistory = new ChatMessageHistory();

    // รวม System Prompt กับเนื้อหา PDF
    const combinedSystemPrompt = `${systemPrompt}\n\nข้อมูลจากเอกสารภายใน:\n${pdfContent}`;
    await chatHistory.addMessage(new SystemMessage(combinedSystemPrompt));

    // เพิ่มประวัติการสนทนา
    for (const msg of messages.slice(0, -1)) {
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
      verbose: true,
    });

    // ส่งข้อความล่าสุดเข้าไป
    const result = await chain.call({
      input: messages[messages.length - 1].content,
    });

    const rawResponse = result.response || "";
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
