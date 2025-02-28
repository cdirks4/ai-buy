import modal
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import cv2
from insightface.app import FaceAnalysis
from typing import Dict, Any
import tempfile
import os

# Create FastAPI app
web_app = FastAPI()

# Configure CORS
web_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create Modal app
app = modal.App("face-analysis-api")

# Create image with dependencies
image = (
    modal.Image.debian_slim()
    .apt_install(
        "libgl1-mesa-glx",
        "libglib2.0-0",
        "libsm6",
        "libxext6",
        "libxrender-dev"
    )
    .pip_install(
        "fastapi",
        "python-multipart",
        "uvicorn",
        "insightface==0.7.3",
        "opencv-python-headless==4.8.1.78",
        "numpy==1.26.2",
        "onnxruntime-gpu==1.20.1"
    )
)

@app.function(
    image=image,
    gpu="T4",
    timeout=60
)
@modal.web_endpoint(method="post")  # Explicitly set method to "post"
async def analyze_face(file: UploadFile = File(...)) -> Dict[str, Any]:
    try:
        # Save uploaded file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        try:
            # Initialize face analyzer
            
            analyzer = FaceAnalysis(name='buffalo_l')

            analyzer.prepare(ctx_id=0, det_size=(640, 640))

            # Read and process image
            img = cv2.imread(temp_file_path)
            if img is None:
                return {"error": "Failed to load image"}

            # Convert to RGB
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

            # Detect faces
            faces = analyzer.get(img)
            if not faces:
                return {"error": "No faces detected"}

            # Process first face
            face = faces[0]
            result = {
                'embedding': face.embedding.tolist(),
                'landmarks': face.landmark_2d_106.tolist(),
                'bbox': face.bbox.tolist(),
                'det_score': float(face.det_score)
            }

            return result

        except Exception as e:
            return {"error": f"Face analysis failed: {str(e)}"}

    finally:
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)

@app.function(image=image)
@modal.web_endpoint(method="get")  # Explicitly set method to "get"
async def health() -> Dict[str, str]:
    return {"status": "healthy"}