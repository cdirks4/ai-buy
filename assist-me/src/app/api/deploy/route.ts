import { NextResponse } from "next/server";
import { FaceApiService } from "@/services/faceApi";
import { ContractService } from "@/services/contractService"; // Change to use ContractService

export async function POST(request: Request) {
  try {
    console.log("Deploy endpoint called");

    const formData = await request.formData();
    const image = formData.get("image") as File;
    const reward = formData.get("reward") as string;

    if (!image) {
      console.error("No image provided");
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!reward) {
      console.error("No reward specified");
      return NextResponse.json(
        { error: "No reward specified" },
        { status: 400 }
      );
    }

    // Convert File to Buffer for face analysis
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Analyze face using FaceApiService
    const faceAnalysis = await FaceApiService.analyzeFace(buffer);

    if (!faceAnalysis || !faceAnalysis.embedding) {
      return NextResponse.json(
        { error: "Face analysis failed or no face detected" },
        { status: 400 }
      );
    }

    // Generate unique person ID
    const personId = `person_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Create person and bounty using ContractService instead of PersonBountyService
    const result = await ContractService.createPersonAndBounty(
      personId,
      faceAnalysis,
      parseFloat(reward)
    );

    return NextResponse.json({
      success: true,
      personId: result.personId,
      transactionHash: result.transactionHash,
    });

  } catch (error) {
    console.error("Deploy API error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to deploy bounty"
    }, { status: 500 });
  }
}
