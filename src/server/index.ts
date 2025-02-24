import { readFile, writeFile, mkdir } from "fs/promises";
import { dirname, join } from "path";

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
  GPT_4_VISION = "gpt-4-vision-preview-v2", // Updated to latest version
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
const SAVED_DATA = "../public/data.json";
const IMAGES_DIR = "../public/images";

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

async function handleVisionRequest(request: Request) {
  if (
    request.method !== "POST" ||
    request.headers.get("Content-Type") !== "application/json"
  ) {
    return new Response("Invalid request", { status: 400 });
  }

  try {
    const { imageUrl, type = AnalysisType.SCENE } = await request.json();
    const responseContent = await analyzeImage(imageUrl, type);
    await saveData(imageUrl, responseContent, type);
    return new Response(
      JSON.stringify({
        content: responseContent,
        timeReceived: new Date().toISOString(),
        type,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

async function analyzeImage(imageUrl: string, type: AnalysisType) {
  const token = process.env.OPENAI_API_KEY;
  if (!token) {
    throw new Error("OPENAI_API_KEY not found in environment variables");
  }

  const body = {
    model: VISION_MODEL,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: PROMPTS[type] },
          {
            type: "image_url",
            image_url: { url: imageUrl },
          },
        ],
      },
    ],
    max_tokens: 500,
    temperature: 0.7,
  };

  console.log("Sending request to OpenAI Vision API for clothing analysis");
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    console.log("Vision API Request Failed");
    const errorText = await response.text();
    console.error("Error details:", errorText);
    throw new Error(`API request failed with status: ${response.status}`);
  }

  console.log("Vision Analysis Successful");
  const data = await response.json();
  return data.choices[0].message.content;
}

async function saveData(
  imageUrl: string,
  description: string,
  type: AnalysisType
) {
  try {
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

    const createdObject = {
      time: new Date().toISOString(),
      type,
      description,
      originalImageUrl: imageUrl,
      localImagePath: `/images/${imageFileName}`,
      searchableTerms: description.split("\n").filter(Boolean),
      targetSearchReady: true,
    };

    let data = [];
    try {
      console.log("Reading stored clothing data");
      const storedData = await readFile(SAVED_DATA, "utf8");
      data = JSON.parse(storedData);
    } catch (readError) {
      console.log("Creating new clothing data file");
    }

    data.push(createdObject);
    await writeFile(SAVED_DATA, JSON.stringify(data, null, 2));

    console.log(`Clothing analysis saved to ${imagePath}`);
    return createdObject;
  } catch (error) {
    console.error(`Failed to save ${type} data:`, error);
    throw error;
  }
}

console.log(`Listening on localhost:${server.port}`);
