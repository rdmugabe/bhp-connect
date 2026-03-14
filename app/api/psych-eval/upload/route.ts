import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToS3 } from "@/lib/s3";
import { extractTextFromPDF } from "@/lib/pdf-extract";
import { extractPsychEvalData } from "@/lib/ai/psych-eval-extraction";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  console.log("[PsychEval] Starting upload...");
  try {
    const session = await getServerSession(authOptions);
    console.log("[PsychEval] Session:", session?.user?.id ? "authenticated" : "not authenticated");

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is BHRF
    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
      include: { facility: true },
    });
    console.log("[PsychEval] BHRF Profile:", bhrfProfile ? "found" : "not found");

    if (!bhrfProfile) {
      return NextResponse.json(
        { error: "Only BHRF users can upload psych evaluations" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const residentName = formData.get("residentName") as string;
    console.log("[PsychEval] File:", file?.name, "Size:", file?.size, "Resident:", residentName);

    if (!file || !residentName) {
      return NextResponse.json(
        { error: "File and resident name are required" },
        { status: 400 }
      );
    }

    // Validate file type (PDF only)
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are supported for psych evaluations" },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    console.log("[PsychEval] Converting file to buffer...");
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log("[PsychEval] Buffer size:", buffer.length);

    // Extract text from PDF
    console.log("[PsychEval] Extracting text from PDF...");
    let pdfResult;
    try {
      pdfResult = await extractTextFromPDF(buffer);
      console.log("[PsychEval] PDF extracted. Pages:", pdfResult.pageCount, "Text length:", pdfResult.text?.length);
    } catch (error) {
      console.error("[PsychEval] PDF extraction error:", error);
      return NextResponse.json(
        { error: "Failed to extract text from PDF. The file may be corrupted, password-protected, or contain only images." },
        { status: 400 }
      );
    }

    if (!pdfResult.text || pdfResult.text.trim().length < 100) {
      return NextResponse.json(
        { error: "PDF appears to be empty or contains insufficient text content. Scanned image PDFs are not supported." },
        { status: 400 }
      );
    }

    // Generate S3 key for the file
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileKey = `psych-evals/${session.user.id}/${timestamp}-${sanitizedFilename}`;

    // Upload to S3
    console.log("[PsychEval] Uploading to S3...");
    await uploadToS3({
      key: fileKey,
      body: buffer,
      contentType: file.type,
    });
    console.log("[PsychEval] S3 upload complete");

    // Extract data using AI
    console.log("[PsychEval] Starting AI extraction...");
    let extractedData;
    try {
      extractedData = await extractPsychEvalData(pdfResult.text, residentName);
      console.log("[PsychEval] AI extraction complete");
    } catch (error) {
      console.error("[PsychEval] AI extraction error:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      return NextResponse.json(
        { error: `Failed to extract data from document: ${errorMsg}` },
        { status: 500 }
      );
    }

    // Generate a processing ID for tracking
    const processingId = randomUUID();

    return NextResponse.json({
      extractedData: {
        intake: extractedData.intake,
        asam: extractedData.asam,
        confidence: extractedData.confidence,
        warnings: extractedData.warnings,
      },
      fileKey,
      fileName: file.name,
      processingId,
      pageCount: pdfResult.pageCount,
    });
  } catch (error) {
    console.error("Psych eval upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to process psych evaluation: ${errorMessage}` },
      { status: 500 }
    );
  }
}
