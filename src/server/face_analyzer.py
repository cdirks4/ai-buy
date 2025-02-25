import sys
import json
import insightface
import numpy as np
import cv2
from insightface.app import FaceAnalysis

def analyze_face(image_path):
    try:
        # Initialize face analyzer
        app = FaceAnalysis(name='buffalo_l')
        app.prepare(ctx_id=0, det_size=(640, 640))
        
        # Load and preprocess image
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Failed to load image: {image_path}")
        
        # Convert BGR to RGB (InsightFace expects RGB)
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Detect faces
        faces = app.get(img)
        if not faces:
            return json.dumps({})
            
        face = faces[0]
        return json.dumps({
            'embedding': face.embedding.tolist(),
            'landmarks': face.landmark_2d_106.tolist(),
            'bbox': face.bbox.tolist(),
            'det_score': float(face.det_score)
        })
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        return json.dumps({})

if __name__ == "__main__":
    if len(sys.argv) > 1:
        print(analyze_face(sys.argv[1]))