import sys
import json
import numpy as np
import cv2
import os
from insightface.app import FaceAnalysis

def analyze_face(image_path):
    try:
        print(f"[Analyzer] Starting face analysis for: {image_path}", file=sys.stderr)
        
        # File verification checks with more detailed logging
        print(f"[Analyzer] File verification details:", file=sys.stderr)
        print(f"- Absolute path: {os.path.abspath(image_path)}", file=sys.stderr)
        print(f"- File exists: {os.path.exists(image_path)}", file=sys.stderr)
        print(f"- Is file: {os.path.isfile(image_path)}", file=sys.stderr)
        print(f"- File permissions: {oct(os.stat(image_path).st_mode)[-3:]}", file=sys.stderr)
        
        if not os.path.exists(image_path):
            print(f"[Analyzer] File does not exist: {image_path}", file=sys.stderr)
            return json.dumps({"error": "File does not exist"})
            
        if not os.path.isfile(image_path):
            print(f"[Analyzer] Not a file: {image_path}", file=sys.stderr)
            return json.dumps({"error": "Not a valid file"})
            
        file_size = os.path.getsize(image_path)
        if file_size == 0:
            print(f"[Analyzer] Empty file: {image_path}", file=sys.stderr)
            return json.dumps({"error": "File is empty"})
            
        print(f"[Analyzer] File verification passed: {file_size} bytes", file=sys.stderr)
        
        # Initialize face analyzer
        print("[Analyzer] Initializing FaceAnalysis...", file=sys.stderr)
        app = FaceAnalysis(name='buffalo_l')
        app.prepare(ctx_id=0, det_size=(640, 640))
        
        # Load image with OpenCV instead of PIL
        print("[Analyzer] Loading image with OpenCV...", file=sys.stderr)
        # Try multiple methods to load the image
        print("[Analyzer] Attempting to load image with numpy...", file=sys.stderr)
        try:
            # Read file as binary
            with open(image_path, 'rb') as f:
                file_bytes = np.frombuffer(f.read(), dtype=np.uint8)
                print(f"[Analyzer] Read {len(file_bytes)} bytes", file=sys.stderr)
                
            # Decode image
            img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
            if img is None:
                print("[Analyzer] Failed to decode image bytes", file=sys.stderr)
                # Try to identify file format
                with open(image_path, 'rb') as f:
                    header = f.read(12)
                    print(f"[Analyzer] File header bytes: {header.hex()}", file=sys.stderr)
                return json.dumps({"error": "Failed to decode image"})
            
            print(f"[Analyzer] Successfully decoded image: shape={img.shape}, dtype={img.dtype}", file=sys.stderr)
            
            # Convert BGR to RGB for InsightFace
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            print("[Analyzer] Converted to RGB format", file=sys.stderr)
            
        except Exception as e:
            print(f"[Analyzer] Image load failed: {str(e)}", file=sys.stderr)
            print(f"[Analyzer] Error type: {type(e).__name__}", file=sys.stderr)
            import traceback
            print(f"[Analyzer] Image load traceback: {traceback.format_exc()}", file=sys.stderr)
            return json.dumps({"error": f"Failed to load image: {str(e)}"})

        # Detect faces
        print("[Analyzer] Detecting faces...", file=sys.stderr)
        faces = app.get(img)
        print(f"[Analyzer] Found {len(faces)} faces", file=sys.stderr)
        
        if not faces:
            print("[Analyzer] No faces detected", file=sys.stderr)
            return json.dumps({"error": "No faces detected in image"})
            
        face = faces[0]
        result = {
            'embedding': face.embedding.tolist(),
            'landmarks': face.landmark_2d_106.tolist(),
            'bbox': face.bbox.tolist(),
            'det_score': float(face.det_score)
        }
        print("[Analyzer] Face analysis completed successfully", file=sys.stderr)
        print(f"[Analyzer] Result summary:", file=sys.stderr)
        print(f"- Embedding size: {len(result['embedding'])}", file=sys.stderr)
        print(f"- Landmarks points: {len(result['landmarks'])}", file=sys.stderr)
        print(f"- Detection score: {result['det_score']}", file=sys.stderr)
        
        return json.dumps(result)
        
    except Exception as e:
        print(f"[Analyzer] Error in analyze_face: {str(e)}", file=sys.stderr)
        import traceback
        print(f"[Analyzer] Traceback: {traceback.format_exc()}", file=sys.stderr)
        return json.dumps({"error": str(e)})

if __name__ == "__main__":
    if len(sys.argv) > 1:
        result = analyze_face(sys.argv[1])
        print(result)  # Print to stdout for PythonShell to capture