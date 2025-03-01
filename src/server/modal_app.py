import modal
from fastapi import FastAPI, UploadFile, File, Form  # Added Form import
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import cv2
from insightface.app import FaceAnalysis
from typing import Dict, Any, List
import tempfile
import os
import requests

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
app = modal.App("face-analysis-api-v0.1")

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

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    a_norm = a / np.linalg.norm(a)
    b_norm = b / np.linalg.norm(b)
    return float(np.dot(a_norm, b_norm))

@app.function(
    image=image,
    gpu="T4",
    timeout=60
)
@modal.web_endpoint(method="post")
async def compare_embeddings(
    embedding1: List[float],
    embedding2: List[float]
) -> Dict[str, Any]:
    try:
        # Convert lists to numpy arrays
        emb1 = np.array(embedding1)
        emb2 = np.array(embedding2)

        # Calculate similarity
        similarity = cosine_similarity(emb1, emb2)

        return {
            "similarity": similarity,
            "match": similarity > 0.5  # Adjust threshold as needed
        }

    except Exception as e:
        return {"error": f"Embedding comparison failed: {str(e)}"}

@app.function(
    image=image,
    gpu="T4",
    timeout=60
)
@modal.web_endpoint(method="post")
async def compare_face_with_ipfs(
    file: UploadFile = File(...),
    ipfs_hash: str = Form(...),  # Change from None default to required Form parameter
    threshold: float = 0.5
) -> Dict[str, Any]:
    temp_files = []
    try:
        # Initial parameter logging
        print(f"[Modal] Starting face comparison with parameters:")
        print(f"- IPFS Hash: {ipfs_hash}")
        print(f"- Threshold: {threshold}")
        print(f"- File name: {file.filename}")
        print(f"- Content type: {file.content_type}")

        if not ipfs_hash:
            return {
                "success": False,
                "error": "IPFS hash is required"
            }

        # Read file content
        content = await file.read()
        file_size = len(content)
        print(f"[Modal] File size: {file_size} bytes")

        # Save uploaded file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            temp_file.write(content)
            temp_files.append(temp_file.name)
            print(f"[Modal] Saved temp file: {temp_file.name}")

        # Fetch IPFS content with detailed logging
        ipfs_gateway = "https://gray-accepted-thrush-827.mypinata.cloud"  # Remove /ipfs from base URL
        ipfs_url = f"{ipfs_gateway}/ipfs/{ipfs_hash}"  # Add /ipfs/ in the path
        print(f"[Modal] Fetching IPFS content from: {ipfs_url}")
        
        # Add headers for Pinata gateway
        headers = {
            'Accept': 'application/json',
            'Usser-Agent': 'Modal-Face-Comparison/1.0'
        }
        
        ipfs_response = requests.get(ipfs_url, headers=headers)
        print(f"[Modal] IPFS Response Status: {ipfs_response.status_code}")
        print(f"[Modal] IPFS Response Headers: {dict(ipfs_response.headers)}")

        if not ipfs_response.ok:
            error_content = ipfs_response.text[:500]
            print(f"[Modal] IPFS fetch failed with status {ipfs_response.status_code}")
            print(f"[Modal] Error response content: {error_content}")
            return {
                "success": False,
                "error": f"Failed to fetch IPFS content: {ipfs_response.status_code}",
                "details": {
                    "status": ipfs_response.status_code,
                    "headers": dict(ipfs_response.headers),
                    "content": error_content
                }
            }

        ipfs_data = ipfs_response.json()
        print(f"[Modal] Successfully fetched IPFS data:")
        print(f"- Has embedding: {'embedding' in ipfs_data}")
        print(f"- Embedding length: {len(ipfs_data['embedding']) if 'embedding' in ipfs_data else 'N/A'}")
        
        # Initialize face analyzer
        analyzer = FaceAnalysis(name='buffalo_l')
        analyzer.prepare(ctx_id=0, det_size=(640, 640))

        # Process uploaded image
        img = cv2.imread(temp_files[0])
        if img is None:
            return {"error": "Failed to load uploaded image"}

        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        faces = analyzer.get(img)
        if not faces:
            return {"error": "No faces detected in uploaded image"}

        uploaded_embedding = faces[0].embedding

        # Compare with IPFS embedding
        if 'embedding' not in ipfs_data:
            return {"error": "No face embedding found in IPFS data"}

        ipfs_embedding = np.array(ipfs_data['embedding'])
        similarity = cosine_similarity(uploaded_embedding, ipfs_embedding)

        return {
            "success": True,
            "similarity": float(similarity),
            "match": similarity > threshold,
            "det_score": float(faces[0].det_score)
        }

    except Exception as e:
        import traceback
        print(f"[Modal] Error in face comparison:")
        print(f"- Error type: {type(e).__name__}")
        print(f"- Error message: {str(e)}")
        print(f"- Traceback:\n{traceback.format_exc()}")
        return {
            "success": False,
            "error": f"Face comparison failed: {str(e)}",
            "details": {
                "type": type(e).__name__,
                "traceback": traceback.format_exc()
            }
        }

    finally:
        for temp_file_path in temp_files:
            if os.path.exists(temp_file_path):
                try:
                    os.unlink(temp_file_path)
                    print(f"[Modal] Cleaned up temp file: {temp_file_path}")
                except Exception as e:
                    print(f"[Modal] Failed to clean up temp file: {str(e)}")

@app.function(image=image)
@modal.web_endpoint(method="get")  # Explicitly set method to "get"
async def health() -> Dict[str, str]:
    return {"status": "healthy"}