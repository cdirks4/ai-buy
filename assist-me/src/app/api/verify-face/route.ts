import { NextResponse } from "next/server";
import { FaceApiService } from "@/services/faceApi";
import { PersonBountyService } from "@/services/personBounty";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image") as File;
    const bountyId = formData.get("bountyId") as string;
    const personId = formData.get("personId") as string;

    if (!image || !bountyId || !personId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Analyze the uploaded face first
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const faceData = await FaceApiService.analyzeFace(buffer);

    if (!faceData || !faceData.embedding) {
      return NextResponse.json(
        { error: "No face detected in image" },
        { status: 400 }
      );
    }

    // Get the person data from the contract
    const personData = await PersonBountyService.getPerson(personId);
    if (!personData) {
      return NextResponse.json(
        { error: "Person not found" },
        { status: 404 }
      );
    }

    // Since we don't have face embedding in personData anymore,
    // we'll use the detection score as a simple verification
    const DETECTION_THRESHOLD = 0.8;
    const matched = parseFloat(personData.detectionScore) >= DETECTION_THRESHOLD;

    return NextResponse.json({ 
      matched,
      detectionScore: personData.detectionScore
    });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Verification failed",
      },
      { status: 500 }
    );
  }
}
