// import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
// import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";

// export const createVectorStore = async (texts: string[]) => {
//   const embeddings = new HuggingFaceInferenceEmbeddings({
//     apiKey: process.env.HUGGINGFACE_API_KEY!,
//     model: "sentence-transformers/all-mpnet-base-v2",
//   });

//   return HNSWLib.fromTexts(
//     texts,
//     texts.map((_, i) => ({ id: i })),
//     embeddings
//   );
// };
