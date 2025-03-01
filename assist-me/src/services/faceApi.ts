const MODAL_API_URL =
  "https://cdirks4--face-analysis-api-v0-1-compare-face-with-ipfs.modal.run";
const ANALYZE_FACE_URL =
  "https://cdirks4--face-analysis-api-analyze-face.modal.run";

export class FaceApiService {
  static async compareFaceWithIpfs(formData: FormData) {
    try {
      // Debug log the form data before sending
      console.log("Sending form data to Modal:", {
        ipfsHash: formData.get('ipfs_hash'),
        threshold: formData.get('threshold'),
        hasFile: formData.has('file')
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
}
