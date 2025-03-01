const MODAL_API_URL =
  "https://cdirks4--face-analysis-api-v0-1-compare-face-with-ipfs.modal.run";

export class FaceApiService {
  static async compareFaceWithIpfs(formData: FormData) {
    try {
      // Debug log the form data before sending
      console.log("Sending form data to Modal:");
      for (const [key, value] of formData.entries()) {
        console.log(`${key}: ${value instanceof File ? value.name : value}`);
      }

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

  static async analyzeFace(formData: FormData) {
    try {
      const response = await fetch(
        "https://cdirks4--face-analysis-api-v0-1-analyze-face.modal.run",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Face analysis error:", error);
      throw error;
    }
  }
}
