import { PythonShell } from "python-shell";
import path from "path";
import fs from "fs";
import axios from 'axios';

export interface FaceAnalysisResult {
  embedding: number[];
  landmarks: number[][];
  bbox: number[];
  det_score: number;
}

const FACE_API_URL = 'http://localhost:8000';

export async function analyzeFace(imageBuffer: Buffer): Promise<FaceAnalysisResult> {
  try {
    console.log("Starting face analysis...");
    
    // Create form data with the image
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    formData.append('file', blob, 'image.jpg');

    // Send request to FastAPI endpoint
    const response = await axios.post(`${FACE_API_URL}/analyze-face`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.error) {
      throw new Error(response.data.error);
    }

    console.log("Face analysis completed successfully");
    return response.data;
  } catch (error) {
    console.error("Face analysis error:", error);
    throw error;
  }
}

export async function compareFaces(image1: Buffer, image2: Buffer): Promise<number> {
  try {
    // Create form data with both images
    const formData = new FormData();
    formData.append('file1', new Blob([image1], { type: 'image/jpeg' }), 'image1.jpg');
    formData.append('file2', new Blob([image2], { type: 'image/jpeg' }), 'image2.jpg');

    const response = await axios.post(`${FACE_API_URL}/compare-faces`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.error) {
      throw new Error(response.data.error);
    }

    return response.data.similarity;
  } catch (error) {
    console.error("Face comparison error:", error);
    throw error;
  }
}

// Add this function at the top of the file
async function getPythonPath(): Promise<string> {
  const venvPath = path.join(process.cwd(), ".venv", "bin", "python3");
  if (fs.existsSync(venvPath)) {
    return venvPath;
  }

  return new Promise((resolve, reject) => {
    const { exec } = require("child_process");
    exec("which python3", (error: any, stdout: string) => {
      if (error) {
        console.warn("Python3 not found in PATH, falling back to default");
        resolve("python3");
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

export async function analyzeFace(
  imageBuffer: Buffer
): Promise<FaceAnalysisResult> {
  try {
    console.log("Starting face analysis...");
    const pythonPath = await getPythonPath();
    console.log("Using Python path:", pythonPath);

    const tempDir = path.join(process.cwd(), "temp");
    await fs.promises.mkdir(tempDir, { recursive: true });

    const tempImagePath = path.join(tempDir, `${Date.now()}.jpg`);
    await fs.promises.writeFile(tempImagePath, imageBuffer);
    console.log("Saved image to:", tempImagePath);

    const options = {
      mode: "text",
      pythonPath,
      scriptPath: path.join(process.cwd(), "..", "src", "server"),
      args: [tempImagePath],
    };
    console.log("Python script options:", options);

    // Run the Python script
    const results = await new Promise<FaceAnalysisResult>((resolve, reject) => {
      console.log("Running face_analyzer.py...");
      PythonShell.run("face_analyzer.py", options, (err, results) => {
        // Clean up temp file
        require("fs").unlink(tempImagePath, () => {
          console.log("Cleaned up temp file:", tempImagePath);
        });

        if (err) {
          console.error("Python script error:", err);
          reject(err);
          return;
        }

        if (!results || results.length === 0) {
          console.error("No results from Python script");
          reject(new Error("No face detected"));
          return;
        }

        console.log("Raw Python output:", results[0]);

        try {
          const parsedResult = JSON.parse(results[0]);
          console.log("Parsed result:", parsedResult);
          resolve(parsedResult);
        } catch (parseError) {
          console.error(
            "JSON Parse Error:",
            parseError,
            "Raw output:",
            results[0]
          );
          reject(new Error("Invalid response format from face analyzer"));
        }
      });
    });

    console.log("Face analysis completed successfully");
    return results;
  } catch (error) {
    console.error("Face analysis error:", error);
    throw error;
  }
}

// Similarly update the compareFaces function
export async function compareFaces(
  image1: Buffer,
  image2: Buffer
): Promise<number> {
  try {
    // Get Python path
    const pythonPath = await getPythonPath();

    // Save buffers to temporary files
    const tempImage1Path = path.join(
      process.cwd(),
      "temp",
      `${Date.now()}_1.jpg`
    );
    const tempImage2Path = path.join(
      process.cwd(),
      "temp",
      `${Date.now()}_2.jpg`
    );

    await Promise.all([
      require("fs").promises.writeFile(tempImage1Path, image1),
      require("fs").promises.writeFile(tempImage2Path, image2),
    ]);

    const options = {
      mode: "text", // Change to text mode
      pythonPath,
      scriptPath: path.join(process.cwd(), "..", "src", "server"),
      args: [tempImage1Path, tempImage2Path],
    };

    const similarity = await new Promise<number>((resolve, reject) => {
      PythonShell.run("face_comparison.py", options, (err, results) => {
        // Clean up temp files
        require("fs").unlink(tempImage1Path, () => {});
        require("fs").unlink(tempImage2Path, () => {});

        if (err) reject(err);
        if (!results || results.length === 0) {
          reject(new Error("Comparison failed"));
        }

        try {
          const parsedResult = JSON.parse(results[0]);
          resolve(parsedResult.similarity);
        } catch (parseError) {
          console.error(
            "JSON Parse Error:",
            parseError,
            "Raw output:",
            results[0]
          );
          reject(new Error("Invalid response format from face comparison"));
        }
      });
    });

    return similarity;
  } catch (error) {
    console.error("Face comparison error:", error);
    throw error;
  }
}
