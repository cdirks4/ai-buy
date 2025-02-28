from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from face_analyzer import analyze_face
import tempfile
import os
from typing import Dict, Any
import json
import asyncio
app = FastAPI()

# Configure CORS for Next.js development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze-face")
async def analyze_face_endpoint(file: UploadFile = File(...)) -> Dict[str, Any]:
    try:
        print(f"[API] Received file: {file.filename}, type: {file.content_type}, size: {file.size}")
        
        # Ensure the file is an image
        if not file.content_type.startswith('image/'):
            print(f"[API] Invalid file type: {file.content_type}")
            return {"error": "File must be an image"}

        # Create a temporary file with proper extension
        ext = file.content_type.split('/')[-1].lower()
        if ext not in ['jpeg', 'jpg', 'png']:
            ext = 'jpg'  # default to jpg if unknown format
            
        temp_file_path = None
        try:
            # Create temp file in binary write mode
            with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{ext}', mode='wb') as temp_file:
                temp_file_path = temp_file.name
                print(f"[API] Created temp file at: {temp_file_path}")
                
                # Read the entire file content at once and verify size
                content = await file.read()
                content_size = len(content)
                print(f"[API] Read file content, size: {content_size} bytes")
                
                if content_size == 0:
                    return {"error": "Uploaded file is empty"}
                
                temp_file.write(content)
                temp_file.flush()
                os.fsync(temp_file.fileno())

            # Verify the temp file
            if not os.path.exists(temp_file_path):
                return {"error": "Failed to create temporary file"}
                
            temp_file_size = os.path.getsize(temp_file_path)
            if temp_file_size == 0:
                return {"error": "Temporary file is empty"}
                
            print(f"[API] Temp file verification:")
            print(f"- Path: {temp_file_path}")
            print(f"- Size: {temp_file_size} bytes")
            print(f"- Readable: {os.access(temp_file_path, os.R_OK)}")
            
            # Debug information
            print(f"[API] Temp file details:")
            print(f"- Exists: {os.path.exists(temp_file_path)}")
            print(f"- Size: {os.path.getsize(temp_file_path)} bytes")
            print(f"- Permissions: {oct(os.stat(temp_file_path).st_mode)[-3:]}")
            
            # Analyze the face
            print("[API] Calling face analyzer...")
            result = analyze_face(temp_file_path)
            print(f"[API] Face analysis result: {result[:200]}...")  # Print first 200 chars
            
            parsed_result = json.loads(result)
            if "error" in parsed_result:
                print(f"[API] Face analysis error: {parsed_result['error']}")
                return {"error": parsed_result["error"]}
            
            return parsed_result
            
        finally:
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.unlink(temp_file_path)
                    print(f"[API] Cleaned up temp file: {temp_file_path}")
                except Exception as e:
                    print(f"[API] Error deleting temp file: {e}")
                
    except Exception as e:
        print(f"[API] Error processing image: {str(e)}")
        import traceback
        print(f"[API] Traceback: {traceback.format_exc()}")
        return {"error": str(e)}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)