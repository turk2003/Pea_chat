// // src/utils/pdfLoader.ts

// import path from "path";
// import fs from "fs";
// import pdf from "pdf-parse";

// interface PdfData {
//   text: string;
// }

// export async function loadPDFContent(): Promise<string> {
//   try {
//     // ตั้งค่า path ให้ถูกต้อง
//     const pdfPath = path.join(process.cwd(), "public", "pea_1.pdf");

//     // ตรวจสอบการมีอยู่ของไฟล์
//     if (!fs.existsSync(pdfPath)) {
//       throw new Error(`PDF file not found at: ${pdfPath}`);
//     }

//     // Dynamic import สำหรับ pdf-parse
//     const { default: pdf } = await import("pdf-parse");
//     const fileBuffer = fs.readFileSync(pdfPath);
//     const data: PdfData = await pdf(fileBuffer);

//     return data.text;
//   } catch (error) {
//     console.error("PDF Loader Error:", error);
//     return "";
//   }
// }
