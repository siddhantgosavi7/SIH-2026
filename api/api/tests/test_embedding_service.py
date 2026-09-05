import pytest
import numpy as np

# Skip if sentence_transformers isn't installed properly or torch fails
try:
    from app.services.embedding_service import embed, embed_batch, cosine_similarity
    HAS_EMBEDDINGS = True
except ImportError:
    HAS_EMBEDDINGS = False


@pytest.mark.skipif(not HAS_EMBEDDINGS, reason="sentence-transformers not installed")
def test_embed_returns_correct_dimension():
    result = embed("This is a test sentence.")
    assert isinstance(result, list)
    assert len(result) == 384
    assert isinstance(result[0], float)

@pytest.mark.skipif(not HAS_EMBEDDINGS, reason="sentence-transformers not installed")
def test_embed_batch_returns_correct_dimensions():
    texts = ["First sentence", "Second sentence", "Third sentence"]
    results = embed_batch(texts)
    assert isinstance(results, list)
    assert len(results) == 3
    for res in results:
        assert isinstance(res, list)
        assert len(res) == 384

@pytest.mark.skipif(not HAS_EMBEDDINGS, reason="sentence-transformers not installed")
def test_semantic_similarity():
    # Semantically similar texts
    text1 = "Water is leaking from the pipe in the computer lab."
    text2 = "There is a pipeline leakage in the CSE laboratory."
    
    # Semantically dissimilar text
    text3 = "The internet is not working in hostel block B."
    
    emb1 = embed(text1)
    emb2 = embed(text2)
    emb3 = embed(text3)
    
    sim_similar = cosine_similarity(emb1, emb2)
    sim_dissimilar = cosine_similarity(emb1, emb3)
    
    # Sentence-transformers should recognize the similar meaning despite different words
    assert sim_similar > 0.50, f"Expected high similarity, got {sim_similar}"
    
    # Should be higher than dissimilar texts
    assert sim_similar > sim_dissimilar, "Similar texts should score higher than dissimilar texts"
    
    # Dissimilar should ideally be lower
    assert sim_dissimilar < 0.30, f"Expected low similarity, got {sim_dissimilar}"
