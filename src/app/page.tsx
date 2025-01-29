"use client";

import { useState } from "react";
import { Message } from "@/types";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (content: string) => {
    const newUserMessage: Message = {
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, newUserMessage] }),
      });

      const data = await response.json();

      if (response.ok) {
        const assistantMessage: Message = {
          role: "assistant",
          content: data.response,
          timestamp: new Date(data.timestamp),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-6 min-h-screen ">
      <div className="bg-white rounded-2xl shadow-xl flex flex-col h-[80vh] border border-purple-200 overflow-hidden">
        <header className="p-6 bg-purple-500 rounded-t-2xl text-white text-center">
          <h1 className="text-3xl font-extrabold">PEA Assistant</h1>
          <p className="text-sm opacity-90 mt-1">ระบบผู้ช่วยอัจฉริยะสำหรับพนักงาน PEA</p>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-purple-50">
          {messages.map((msg, idx) => (
            <ChatMessage key={idx} message={msg} />
          ))}
          {isLoading && (
            <div className="text-center text-gray-500 animate-pulse">
              กำลังคิดคำตอบ...
            </div>
          )}
        </div>

        <footer className="p-4 bg-white border-t border-purple-200">
          <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
        </footer>
      </div>
    </main>
  );
}
