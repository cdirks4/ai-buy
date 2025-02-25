import numpy as np
from face_analyzer import analyze_face
import json

def cosine_similarity(a, b):
    # Normalize vectors before computing similarity
    a_norm = a / np.linalg.norm(a)
    b_norm = b / np.linalg.norm(b)
    return np.dot(a_norm, b_norm)

def compare_faces(image_paths):
    """
    Compare three face images and determine which two are most likely the same person.
    Returns tuple of (matching_pair_indices, similarity_score, all_similarities)
    """
    # Get embeddings for all images
    embeddings = []
    for path in image_paths:
        result = json.loads(analyze_face(path))
        if not result or 'embedding' not in result:
            raise ValueError(f"Could not extract face embedding from {path}")
        embeddings.append(np.array(result['embedding']))
    
    # Normalize embeddings
    embeddings = [emb / np.linalg.norm(emb) for emb in embeddings]
    
    # Compare all pairs using cosine similarity
    similarities = []
    for i in range(len(embeddings)):
        for j in range(i + 1, len(embeddings)):
            sim = cosine_similarity(embeddings[i], embeddings[j])
            similarities.append((i, j, sim))
    
    # Find the pair with highest similarity
    max_sim = max(similarities, key=lambda x: x[2])
    
    # Create dictionary of all similarity scores
    all_sims = {f"{i}-{j}": sim for i, j, sim in similarities}
    
    return (max_sim[0], max_sim[1]), max_sim[2], all_sims