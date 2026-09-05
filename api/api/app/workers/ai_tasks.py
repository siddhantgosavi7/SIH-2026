from functools import lru_cache
import logging

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.models import Complaint, ComplaintEmbedding, ComplaintRelation, utcnow

logger = logging.getLogger(__name__)

def _session_factory():
    engine = create_engine(settings.database_url, pool_pre_ping=True)
    return sessionmaker(bind=engine, autocommit=False, autoflush=False)

_session_factory = lru_cache(maxsize=1)(_session_factory)

def _session():
    return _session_factory()()

def process_ai(complaint_id: str) -> None:
    db = _session()
    try:
        complaint = db.get(Complaint, complaint_id)
        if not complaint:
            return
            
        text = f"{complaint.title} {complaint.description}".strip()
        if not text:
            return
            
        try:
            from app.services.embedding_service import embed
            embedding = embed(text)
        except Exception as e:
            logger.error(f"Failed to load embedding model or generate embedding: {e}")
            return
            
        if db.bind and db.bind.dialect.name == "postgresql":
            # Using vector_cosine_ops, the `<->` operator computes cosine distance
            distance = ComplaintEmbedding.embedding.l2_distance(embedding).label("distance")
            
            # Find up to 5 nearest neighbors
            neighbors = (
                db.query(ComplaintEmbedding, distance)
                .filter(ComplaintEmbedding.complaint_id != complaint.id)
                .order_by(distance)
                .limit(5)
                .all()
            )
            
            for neighbor_emb, dist in neighbors:
                # Cosine distance < 0.15 => Cosine similarity > 0.85
                similarity = 1.0 - dist
                if similarity >= 0.85:
                    rel_type = "DUPLICATE"
                elif similarity >= 0.70:
                    rel_type = "RELATED"
                else:
                    continue
                    
                # Create relation
                relation = ComplaintRelation(
                    source_complaint_id=complaint.id,
                    target_complaint_id=neighbor_emb.complaint_id,
                    relation_type=rel_type,
                    similarity_score=similarity,
                    explanation=f"semantic similarity {similarity:.2f}"
                )
                db.add(relation)
                
                # Also set duplicate_of_id for the closest duplicate if not already set
                if rel_type == "DUPLICATE" and not complaint.duplicate_of_id:
                    complaint.duplicate_of_id = neighbor_emb.complaint_id
                    
        if not db.query(ComplaintEmbedding).filter_by(complaint_id=complaint.id).one_or_none():
            db.add(ComplaintEmbedding(complaint_id=complaint.id, embedding=embedding))
            
        db.commit()
    except Exception as e:
        logger.error(f"Error in process_ai: {e}")
        db.rollback()
    finally:
        db.close()
