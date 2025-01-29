import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { Document } from "@langchain/core/documents";

export async function createVectorStore(docs: Document[]) {
  const embeddings = new HuggingFaceTransformersEmbeddings({
    // ใช้ model แทน modelName
    model: "sentence-transformers/paraphrase-multilingual-mpnet-base-v2",

    // ตัวเลือกเพิ่มเติม (ถ้าต้องการ)
    maxConcurrency: 5, // จำนวนการเรียกพร้อมกัน
    maxRetries: 3, // จำนวนครั้งที่ลองใหม่
  });

  return FaissStore.fromDocuments(docs, embeddings);
}
