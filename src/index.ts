import { config } from "dotenv";
import OpenAI from "openai";
import { serve } from "bun";

// Load environment variables
config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define analysis types
enum AnalysisType {
  CLOTHING = "clothing",
  FOOD = "food",
  TECH = "tech",
  ART = "art",
  SCENE = "scene",
}

// Create server
const server = serve({
  port: process.env.PORT || 3001,
  async fetch(req) {
    // Enable CORS
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Handle POST requests for image analysis
    if (req.method === "POST") {
      try {
        const body = await req.json();
        const { imageUrl, type } = body;

        if (!imageUrl || !type) {
          return new Response(
            JSON.stringify({ error: "Missing imageUrl or type" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        // Validate analysis type
        if (!Object.values(AnalysisType).includes(type as AnalysisType)) {
          return new Response(
            JSON.stringify({ error: "Invalid analysis type" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        // Get analysis prompt based on type
        const prompt = getAnalysisPrompt(type as AnalysisType);

        // Call OpenAI Vision API
        const response = await openai.chat.completions.create({
          model: "gpt-4-vision-preview",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", url: imageUrl },
              ],
            },
          ],
          max_tokens: 500,
        });

        return new Response(JSON.stringify(response.choices[0].message), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (error) {
        console.error("Error processing request:", error);
        return new Response(
          JSON.stringify({ error: "Internal server error" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response("Method not allowed", { status: 405 });
  },
});

// Helper function to get analysis prompt
function getAnalysisPrompt(type: AnalysisType): string {
  switch (type) {
    case AnalysisType.CLOTHING:
      return "Analyze this clothing item. Describe its style, material, fit, and provide shopping recommendations.";
    case AnalysisType.FOOD:
      return "Analyze this food item. Describe its ingredients, cuisine type, and provide nutritional insights.";
    case AnalysisType.TECH:
      return "Analyze this tech product. Describe its features, specifications, and provide comparison with similar products.";
    case AnalysisType.ART:
      return "Analyze this artwork. Describe its style, medium, composition, and provide artistic insights.";
    case AnalysisType.SCENE:
      return "Analyze this scene. Describe the environment, notable elements, and provide context.";
  }
}

console.log(`Vision Shop Assistant API Server running on port ${server.port}`);
