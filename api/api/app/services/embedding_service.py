import os
import requests
import numpy as np

TOKEN = os.getenv("HF_API_TOKEN")
MODEL = os.getenv(
    "HF_EMBEDDING_MODEL",
    "sentence-transformers/all-MiniLM-L6-v2",
)

URL = (
    "https://api-inference.huggingface.co/"
    f"pipeline/feature-extraction/{MODEL}"
)

HEADERS = {"Authorization": f"Bearer {TOKEN}"}


def embed(text: str):
    response = requests.post(
        URL,
        headers=HEADERS,
        json={"inputs": text},
        timeout=30,
    )

    response.raise_for_status()

    vector = response.json()

    if isinstance(vector[0], list):
        vector = np.mean(vector, axis=0)

    return np.array(vector)


def cosine_similarity(a, b):
    a = np.array(a)
    b = np.array(b)

    return float(
        np.dot(a, b)
        / (np.linalg.norm(a) * np.linalg.norm(b))
    )