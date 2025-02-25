import { readFile, writeFile, mkdir } from "fs/promises";
import { dirname, join } from "path";
import * as insightface from "@insightface/node";
import { PythonShell } from "python-shell";
import { tmpdir } from "os";
import { writeFile as writeFileTemp } from "fs/promises";
import { join as joinPath } from "path";

// Use this pre-prompt to customize what you want your specified vision model todo
const PRE_PROMPT = `Describe any clothing items visible in this image in a way that could be used for online shopping searches. Focus on:
1. Type of clothing (e.g., t-shirt, dress, jeans)
2. Color and patterns
3. Style details (e.g., crew neck, v-neck, button-up)
4. Fit (e.g., slim fit, relaxed, oversized)
5. Material if visible (e.g., denim, cotton, knit)

Format the response as a shopping-friendly description. If multiple items are visible, list them separately.`;

//enum for the different models
enum VisionModel {
  GPT_4_VISION = "gpt-4o-mini", // Updated to latest version
}

enum AiProviderEndpoints {
  OPENAI = "https://api.openai.com/v1/chat/completions",
  ANTHROPIC = "https://api.anthropic.com/v1/messages",
  GEMINI = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent",
  DEEPSEEK = "https://api.deepseek.com/v1/chat/completions",
  QWEN = "https://api.qwen.aliyun.com/v1/chat/completions",
}

const VISION_MODEL = VisionModel.GPT_4_VISION;
const VISION_ENDPOINT = AiProviderEndpoints.OPENAI;
const SAVED_DATA = join(process.cwd(), "public", "data.json");
const IMAGES_DIR = join(process.cwd(), "public", "images");

//Facebook Messenger whitelists this localhost port so is the only one you can currently use
const PORT = 3103;

const CORS_HEADERS = {
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS, POST",
    "Access-Control-Allow-Headers": "Content-Type",
  },
};

const server = Bun.serve({
  port: PORT,
  fetch(request) {
    console.log("Request received", request.method, request.url);
    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      const res = new Response("Departed", CORS_HEADERS);
      return res;
    }
    const url = new URL(request.url);
    switch (url.pathname) {
      case "/api/vision":
        console.log("Vision Request");
        return handleVisionRequest(request);
      case "/api/status":
        console.log("API Status Request");
        return new Response("Server Up!", { status: 200 });
      default:
        console.log("Not Found Request");
        return new Response("Not Found", { status: 404 });
    }
  },
});

enum AnalysisType {
  CLOTHING = "clothing",
  FOOD = "food",
  TECH = "tech",
  ART = "art",
  SCENE = "scene",
}

const PROMPTS = {
  [AnalysisType.CLOTHING]: `Describe any clothing items visible in this image...`,
  [AnalysisType.FOOD]: `Analyze this food image and provide:
    1. Dish identification
    2. Main ingredients
    3. Cuisine type
    4. Estimated calories
    5. Presentation quality`,
  [AnalysisType.TECH]: `Analyze this tech-related image and identify:
    1. Device types and brands
    2. Technical specifications visible
    3. Software or UI elements
    4. Setup quality and ergonomics`,
  [AnalysisType.ART]: `Analyze this artwork and describe:
    1. Style and medium
    2. Color palette
    3. Subject matter
    4. Mood and atmosphere
    5. Artistic techniques used`,
  [AnalysisType.SCENE]: `Analyze this scene and describe:
    1. Location type
    2. Time of day
    3. Weather conditions
    4. Notable objects/landmarks
    5. Activity or event occurring`,
};

// Add these interfaces near the top of the file, after the enums
interface VisionRequestBody {
  imageUrl: string;
  type?: AnalysisType;
  metadata?: any; // Add metadata to request body
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// Add this function after the interfaces and before handleVisionRequest
async function processImageUrl(url: string): Promise<string> {
  if (url.startsWith("blob:")) {
    // For blob URLs, download and convert to base64
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = blob.type || "image/jpeg";
    return `data:${mimeType};base64,${base64}`;
  }
  return url;
}

async function handleVisionRequest(request: Request) {
  if (
    request.method !== "POST" ||
    request.headers.get("Content-Type") !== "application/json"
  ) {
    return new Response("Invalid request", { status: 400 });
  }

  try {
    const body = (await request.json()) as VisionRequestBody;
    if (!body.imageUrl) {
      return new Response("imageUrl is required", { status: 400 });
    }

    // Use the metadata from the request if available
    const metadata =
      body.metadata || (await extractImageMetadata(body.imageUrl));
    console.log("Received metadata:", metadata);

    return new Response(
      JSON.stringify({
        content: {
          metadata,
          timestamp: new Date().toISOString(),
          message: "Original metadata from browser",
        },
        timeReceived: new Date().toISOString(),
        type: body.type || AnalysisType.SCENE,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS.headers,
        },
      }
    );
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

interface BiometricMetadata {
  faceEmbedding?: number[];
  faceQuality?: number;
  landmarks?: number[][];
  deterministic_id?: string;
}

interface ImageMetadata {
  dimensions?: { width: number; height: number };
  format?: string;
  size?: number;
  created?: Date;
  biometric?: BiometricMetadata;
}

// Initialize InsightFace model
const faceAnalyzer = await insightface.create({
  name: "buffalo_l",
  modelPath: "./models",
});

// Add export keyword to the function
export async function extractBiometricMetadata(
  imageBuffer: Buffer
): Promise<BiometricMetadata> {
  try {
    // Save image to temp file
    const tempPath = joinPath(tmpdir(), `face_${Date.now()}.jpg`);
    await writeFileTemp(tempPath, imageBuffer);

    // Run Python script
    const result = await new Promise((resolve, reject) => {
      PythonShell.run(
        "src/server/face_analyzer.py",
        {
          args: [tempPath],
          pythonPath: "python3",
        },
        (err, output) => {
          if (err) reject(err);
          resolve(output ? JSON.parse(output[0]) : {});
        }
      );
    });

    // Create deterministic hash from face embedding
    const embedding = (result as any).embedding;
    if (!embedding) return {};

    const deterministicId = crypto
      .createHash("sha256")
      .update(Buffer.from(embedding))
      .digest("hex");

    return {
      faceEmbedding: embedding,
      landmarks: (result as any).landmarks,
      faceQuality: (result as any).det_score,
      deterministic_id: deterministicId,
    };
  } catch (error) {
    console.error("Failed to extract biometric data:", error);
    return {};
  }
}

// Update the existing extractImageMetadata function
async function extractImageMetadata(imageUrl: string): Promise<ImageMetadata> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(buffer);

    const metadata: ImageMetadata = {
      size: buffer.byteLength,
      format: response.headers.get("content-type") || undefined,
      biometric: await extractBiometricMetadata(imageBuffer),
    };

    // Create an image in memory to get dimensions
    if (typeof Image !== "undefined") {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          metadata.dimensions = {
            width: img.width,
            height: img.height,
          };
          resolve(metadata);
        };
        img.src = imageUrl;
      });
    }

    return metadata;
  } catch (error) {
    console.error("Failed to extract image metadata:", error);
    return {};
  }
}

async function analyzeImage(imageUrl: string, type: AnalysisType) {
  // Extract metadata before processing
  const metadata = await extractImageMetadata(imageUrl);
  console.log("Image metadata:", metadata);

  // For testing: Return metadata as description instead of making API call
  return JSON.stringify(
    {
      metadata,
      type,
      timestamp: new Date().toISOString(),
      message: "Metadata extraction test - No API call made",
    },
    null,
    2
  );
}

async function saveData(
  imageUrl: string,
  description: string,
  type: AnalysisType
) {
  try {
    // Create directories if they don't exist
    await mkdir(dirname(SAVED_DATA), { recursive: true });
    await mkdir(IMAGES_DIR, { recursive: true });

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }

    const timestamp = new Date().getTime();
    const imageFileName = `${type}_${timestamp}.jpg`;
    const imagePath = join(IMAGES_DIR, imageFileName);

    const imageBuffer = await imageResponse.arrayBuffer();
    await writeFile(imagePath, Buffer.from(imageBuffer));

    // Initialize data array
    let data = [];
    try {
      if (await exists(SAVED_DATA)) {
        console.log("Reading existing data from", SAVED_DATA);
        const storedData = await readFile(SAVED_DATA, "utf8");
        data = JSON.parse(storedData);
      } else {
        console.log("Creating new data file at", SAVED_DATA);
      }
    } catch (readError) {
      console.error("Error reading data file:", readError);
      // Continue with empty array if file doesn't exist or is corrupt
    }

    if (!Array.isArray(data)) {
      console.log("Existing data is not an array, resetting to empty array");
      data = [];
    }

    const createdObject = {
      time: new Date().toISOString(),
      type,
      description,
      originalImageUrl: imageUrl,
      localImagePath: `/images/${imageFileName}`,
      searchableTerms: description.split("\n").filter(Boolean),
      targetSearchReady: true,
    };

    data.push(createdObject);

    // Ensure the directory exists before writing
    await mkdir(dirname(SAVED_DATA), { recursive: true });
    await writeFile(SAVED_DATA, JSON.stringify(data, null, 2));

    console.log(`Data saved to ${SAVED_DATA}`);
    console.log(`Image saved to ${imagePath}`);
    return createdObject;
  } catch (error) {
    console.error(`Failed to save ${type} data:`, error);
    throw error;
  }
}

// Add this helper function at the top with other imports
async function exists(path: string): Promise<boolean> {
  try {
    await readFile(path);
    return true;
  } catch {
    return false;
  }
}

console.log(`Listening on localhost:${server.port}`);
