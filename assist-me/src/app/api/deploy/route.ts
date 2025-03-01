import { NextResponse } from "next/server";
import { ContractService } from "@/services/contractService";
import { FaceApiService } from "@/services/faceApi";

export async function POST(request: Request) {
  try {
    console.log("Deploy endpoint called");

    const formData = await request.formData();
    const image = formData.get("image") as File;
    const reward = formData.get("reward") as string;

    console.log("Request data received:", {
      hasImage: !!image,
      imageType: image?.type,
      imageSize: image?.size,
      reward,
    });

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

    // Convert File to Buffer
    console.log("Converting file to buffer...");
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log("Buffer created, size:", buffer.length);

    // Analyze the face using the Python API
    console.log("Analyzing face...");
    const response = await FaceApiService.analyzeFace(buffer);
    console.log("Face analysis response:", {
      hasEmbedding: !!response?.embedding,
      embeddingLength: response?.embedding?.length,
      embeddingSample: response?.embedding?.slice(0, 5),
      hasLandmarks: !!response?.landmarks,
      landmarksLength: response?.landmarks?.length,
      landmarksSample: response?.landmarks?.slice(0, 2),
      detScore: response?.det_score
    });

    // Check for error in response
    if (response.error) {
      console.error("Face analysis failed:", response.error);
      return NextResponse.json(
        { error: `Face analysis failed: ${response.error}` },
        { status: 400 }
      );
    }

    // Validate face data structure more thoroughly
    if (!response || typeof response !== "object") {
      console.error("Invalid face data received:", response);
      return NextResponse.json(
        { error: "Invalid face data received" },
        { status: 400 }
      );
    }

    if (!response.embedding || !Array.isArray(response.embedding)) {
      console.error("Missing or invalid embedding data");
      return NextResponse.json(
        { error: "Missing or invalid embedding data" },
        { status: 400 }
      );
    }

    if (!response.landmarks || !Array.isArray(response.landmarks)) {
      console.error("Missing or invalid landmarks data");
      return NextResponse.json(
        { error: "Missing or invalid landmarks data" },
        { status: 400 }
      );
    }

    if (typeof response.det_score !== "number") {
      console.error("Missing or invalid detection score");
      return NextResponse.json(
        { error: "Missing or invalid detection score" },
        { status: 400 }
      );
    }

    const faceData = {
      embedding: response.embedding,
      landmarks: response.landmarks,
      det_score: response.det_score,
    };

    console.log("Face data prepared for IPFS:", {
      dataSize: JSON.stringify(faceData).length,
      embeddingLength: faceData.embedding.length,
      landmarksLength: faceData.landmarks.length,
      sample: {
        embedding: faceData.embedding.slice(0, 5),
        landmarks: faceData.landmarks.slice(0, 2)
      }
    });

    // Generate unique person ID
    const personId = `person_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    console.log("Generated personId:", personId);

    // Create person and bounty with detailed logging
    console.log("Creating person and bounty...");
    const result = await ContractService.createPersonAndBounty(
      personId,
      faceData,
      parseFloat(reward)
    );
    console.log("Creation result:", {
      personId: result.personId,
      transactionHash: result.transactionHash,
      ipfsData: result.ipfsHash ? {
        hash: result.ipfsHash,
        gateway: `https://gray-accepted-thrush-827.mypinata.cloud/ipfs/${result.ipfsHash}`
      } : 'No IPFS hash'
    });

    return NextResponse.json({
      success: true,
      personId: result.personId,
      transactionHash: result.transactionHash,
    });
  } catch (error) {
    console.error("Deployment error:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Deployment failed",
      },
      { status: 500 }
    );
  }
}
