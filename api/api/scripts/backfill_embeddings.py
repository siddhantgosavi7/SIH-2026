import os
import sys

# Ensure the app module can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.models import Complaint, ComplaintEmbedding
from app.services.embedding_service import embed_batch

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine)

def backfill():
    db = SessionLocal()
    try:
        # Find complaints without embeddings or that we want to regenerate
        # Because we changed the dimension, we truncated the table via alembic,
        # so all complaints need new embeddings.
        complaints = db.query(Complaint).outerjoin(ComplaintEmbedding).filter(ComplaintEmbedding.id == None).all()
        
        print(f"Found {len(complaints)} complaints needing embeddings.")
        
        batch_size = 32
        for i in range(0, len(complaints), batch_size):
            batch = complaints[i:i+batch_size]
            texts = [f"{c.title} {c.description}".strip() for c in batch]
            
            # Remove empty texts
            valid_indices = [idx for idx, t in enumerate(texts) if t]
            valid_texts = [texts[idx] for idx in valid_indices]
            
            if not valid_texts:
                continue
                
            embeddings = embed_batch(valid_texts)
            
            for emb_idx, comp_idx in enumerate(valid_indices):
                complaint = batch[comp_idx]
                embedding_vector = embeddings[emb_idx]
                db.add(ComplaintEmbedding(complaint_id=complaint.id, embedding=embedding_vector))
            
            db.commit()
            print(f"Processed batch {i//batch_size + 1}")
            
        print("Backfill complete.")
    except Exception as e:
        print(f"Error during backfill: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    backfill()
