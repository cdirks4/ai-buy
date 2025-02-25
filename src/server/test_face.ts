import { readFile } from "fs/promises";
import { join } from "path";
import { extractBiometricMetadata } from "./index";

async function testFaceAnalyzer() {
  try {
    const imagePath = join(process.cwd(), "public", "images", "selfie.webp");
    const imageBuffer = await readFile(imagePath);

    console.log("Testing face analyzer with selfie.webp...");
    const biometricData = await extractBiometricMetadata(imageBuffer);

    console.log("Biometric Results:");
    console.log(JSON.stringify(biometricData, null, 2));
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testFaceAnalyzer();
