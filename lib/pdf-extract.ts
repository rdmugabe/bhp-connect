import { PDFParse } from "pdf-parse";

export interface PDFExtractionResult {
  text: string;
  pageCount: number;
}

export async function extractTextFromPDF(
  buffer: Buffer
): Promise<PDFExtractionResult> {
  try {
    // Convert Buffer to Uint8Array as required by pdf-parse v2
    const uint8Array = new Uint8Array(buffer);
    const parser = new PDFParse(uint8Array);
    const result = await parser.getText();

    // Combine all page texts
    const fullText = result.pages
      ?.map((page: { text: string }) => page.text)
      .join("\n\n") || "";

    return {
      text: fullText,
      pageCount: result.pages?.length || 0,
    };
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error("Failed to extract text from PDF. The file may be corrupted or password-protected.");
  }
}
