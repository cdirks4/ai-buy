from flow_py_sdk import flow_client, ProposalKey, Transaction
import json
from face_analyzer import analyze_face

async def store_person_on_chain(image_path):
    # Analyze face and get data
    face_data = json.loads(analyze_face(image_path))
    
    if not face_data or 'embedding' not in face_data:
        raise ValueError("Could not extract face data")
    
    # Convert numpy arrays to Flow-compatible format
    face_embedding = [float(x) for x in face_data['embedding']]
    landmarks = [[float(x) for x in landmark] for landmark in face_data['landmarks']]
    det_score = float(face_data['det_score'])
    
    # Create Flow transaction
    tx = Transaction(
        script="""
        transaction(embedding: [UFix64], landmarks: [[UFix64]], score: UFix64) {
            prepare(signer: AuthAccount) {
                let personId = uuid()
                PersonBounty.createPerson(
                    id: personId,
                    faceEmbedding: embedding,
                    landmarks: landmarks,
                    detectionScore: score
                )
            }
        }
        """,
        args=[face_embedding, landmarks, det_score],
        proposer=ProposalKey(
            address=flow_client.address,
            key_index=0,
            sequence_number=flow_client.get_account().keys[0].sequence_number
        )
    )
    
    # Sign and send transaction
    signed_tx = await flow_client.sign_transaction(tx)
    result = await flow_client.send_transaction(signed_tx)
    
    return result.id

async def create_bounty(person_id: str, reward: float):
    tx = Transaction(
        script="""
        transaction(personId: String, reward: UFix64) {
            prepare(signer: AuthAccount) {
                PersonBounty.createBounty(personId: personId, reward: reward)
            }
        }
        """,
        args=[person_id, reward],
        proposer=ProposalKey(
            address=flow_client.address,
            key_index=0,
            sequence_number=flow_client.get_account().keys[0].sequence_number
        )
    )
    
    signed_tx = await flow_client.sign_transaction(tx)
    result = await flow_client.send_transaction(signed_tx)
    
    return result.id