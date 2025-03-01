const MODAL_API_URL =
  "https://cdirks4--face-analysis-api-v0-1-compare-face-with-ipfs.modal.run";
const ANALYZE_FACE_URL =
  "https://cdirks4--face-analysis-api-analyze-face.modal.run";

export class FaceApiService {
  static async compareFaceWithIpfs(formData: FormData) {
    try {
      // Debug log the form data before sending
      console.log("Sending form data to Modal:", {
        ipfsHash: formData.get("ipfs_hash"),
        threshold: formData.get("threshold"),
        hasFile: formData.has("file"),
      });

      const response = await fetch(MODAL_API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Modal API error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Face comparison error:", error);
      throw error;
    }
  }
  static async compareTwoFacesWithIpfs(formData: FormData) {
    try {
      // Debug log the form data before sending
      console.log("Sending form data to Modal for two-face comparison:", {
        ipfsHash: formData.get("ipfs_hash"),
        threshold: formData.get("threshold"),
        hasFile: formData.has("file"),
      });

      const response = await fetch(
        "https://cdirks4--face-analysis-api-v0-2-compare-two-faces-with-ipfs.modal.run",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Modal API error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log("Two-face comparison response:", result);
      return result;
    } catch (error) {
      console.error("Two-face comparison error:", error);
      throw error;
    }
  }
  static async analyzeFace(buffer: Buffer | FormData) {
    try {
      let formData: FormData;

      if (buffer instanceof FormData) {
        formData = buffer;
      } else {
        formData = new FormData();
        const blob = new Blob([buffer], { type: "image/jpeg" });
        formData.append("file", blob, "image.jpg");
      }

      const response = await fetch(ANALYZE_FACE_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Face analysis error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log("Face analysis response:", result);
      return result;
    } catch (error) {
      console.error("Face analysis error:", error);
      throw error;
    }
  }

  static async healthCheck() {
    try {
      const response = await fetch(`${ANALYZE_FACE_URL}/health`);
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Health check failed:", error);
      throw error;
    }
  }

  static async findFaceWallet(
    imageFile: File,
    registryIpfsHash: string
  ): Promise<{
    success: boolean;
    match?: boolean;
    similarity?: number;
    error?: string;
  }> {
    try {
      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("registry_ipfs_hash", registryIpfsHash);
      formData.append("threshold", "0.85");

      console.log("Sending face-wallet matching request:", {
        registryIpfsHash,
        hasFile: true,
        fileSize: imageFile.size,
      });

      const response = await fetch(`${MODAL_API_URL}/find_face_wallet`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      console.log("Face-wallet matching response:", result);

      return result;
    } catch (error) {
      console.error("Error in face-wallet matching:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Face-wallet matching failed",
      };
    }
  }

  static async compareEmbeddingWithIpfs(
    embedding: number[],
    ipfsHash: string,
    threshold: number = 0.85
  ): Promise<{
    success: boolean;
    match?: boolean;
    similarity?: number;
    error?: string;
  }> {
    try {
      const formData = new FormData();
      formData.append("embedding", JSON.stringify(embedding));
      formData.append("ipfs_hash", ipfsHash);
      formData.append("threshold", threshold.toString());

      console.log("Sending embedding comparison request:", {
        ipfsHash,
        embeddingLength: embedding.length,
        threshold,
      });

      const response = await fetch(
        "https://cdirks4--face-analysis-api-v0-2-compare-embeddings-with-ipfs.modal.run",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log("Embedding comparison response:", result);

      return result;
    } catch (error) {
      console.error("Error in embedding comparison:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Embedding comparison failed",
      };
    }
  }
}
