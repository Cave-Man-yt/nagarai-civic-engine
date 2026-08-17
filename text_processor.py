"""
Text Extraction & Embedding Module for NagarAI Civic Complaint Intelligence Engine
PS-S05: Integrates LLM complaint parsing and sentence-transformers 384-dim embeddings.
"""

import os
import re
import json
import math
import logging
from typing import Dict, Any, List

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

_SENTENCE_TRANSFORMER_MODEL = None


def load_embedding_model():
    """Loads all-MiniLM-L6-v2 model lazily."""
    global _SENTENCE_TRANSFORMER_MODEL
    if _SENTENCE_TRANSFORMER_MODEL is not None:
        return _SENTENCE_TRANSFORMER_MODEL
    try:
        from sentence_transformers import SentenceTransformer
        logger.info("Loading sentence-transformers model (all-MiniLM-L6-v2)...")
        model = SentenceTransformer("all-MiniLM-L6-v2")
        _SENTENCE_TRANSFORMER_MODEL = model
        return _SENTENCE_TRANSFORMER_MODEL
    except Exception as e:
        logger.warning(f"Failed to load SentenceTransformer model: {e}")
        return None


def parse_complaint_text(raw_text: str) -> Dict[str, Any]:
    """
    Parses raw complaint text to extract clean summary, inferred category, and severity (1-5).

    Args:
        raw_text (str): Unstructured user text complaint or voice transcript

    Returns:
        Dict: {
            "summary": str,
            "category": str,
            "severity": int (1-5)
        }
    """
    if not raw_text or not raw_text.strip():
        return {
            "summary": "No description provided.",
            "category": "other",
            "severity": 1
        }

    clean_text = raw_text.strip()

    # 1. Attempt OpenAI API / LLM parsing if key available
    if os.environ.get("OPENAI_API_KEY"):
        try:
            from openai import OpenAI
            client = OpenAI()
            prompt = f"""Extract structured information from this civic complaint text.
Return ONLY valid JSON with keys: "summary", "category", "severity".
- "summary": A 1-2 sentence clean summary of the civic issue.
- "category": One of ["pothole", "garbage", "waterlogging", "streetlight", "open_manhole", "traffic_signal", "broken_road", "other"].
- "severity": Integer from 1 (minor issue) to 5 (critical danger/emergency).

Complaint text: "{clean_text}"
JSON output:"""
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0
            )
            content = response.choices[0].message.content.strip()
            data = json.loads(content)
            return {
                "summary": data.get("summary", clean_text),
                "category": data.get("category", "other").lower(),
                "severity": int(data.get("severity", 3))
            }
        except Exception as e:
            logger.warning(f"LLM parsing failed: {e}")

    # 2. Rule-based / Multilingual Keyword Fallback (English, Hindi, Tamil)
    text_lower = clean_text.lower()
    
    category = "other"
    if any(k in text_lower for k in ["pothole", "pit", "gadda", "road hole", "குழி", "பள்ளம்"]):
        category = "pothole"
        severity = 4
    elif any(k in text_lower for k in ["garbage", "kuchra", "trash", "waste", "dump", "குப்பை", "கழிவு"]):
        category = "garbage"
        severity = 3
    elif any(k in text_lower for k in ["water", "drain", "flood", "paani", "logging", "தண்ணீர்", "நீர்", "வெள்ளம்"]):
        category = "waterlogging"
        severity = 4
    elif any(k in text_lower for k in ["street", "light", "lamp", "dark", "bijli", "விளக்கு", "மின்சாரம்"]):
        category = "streetlight"
        severity = 2
    elif any(k in text_lower for k in ["manhole", "cover", "gutter", "sewer", "சாக்கடை", "மூடி"]):
        category = "open_manhole"
        severity = 5
    else:
        severity = 3


    return {
        "summary": clean_text,
        "category": category,
        "severity": severity
    }


def generate_text_embedding(text: str) -> List[float]:
    """
    Generates a text embedding vector. Uses sentence-transformers (all-MiniLM-L6-v2, 384-dim)
    with a deterministic 384-dim TF-IDF / hashing vectorizer fallback.

    Args:
        text (str): Complaint text or summary

    Returns:
        List[float]: 384-dimensional embedding vector
    """
    if not text or not text.strip():
        return [0.0] * 384

    model = load_embedding_model()
    if model is not None:
        try:
            embedding = model.encode(text, convert_to_numpy=True)
            return embedding.tolist()
        except Exception as e:
            logger.warning(f"Failed to generate text embedding: {e}")

    # Fallback: Deterministic feature hashing (384 dimensions)
    dim = 384
    vec = [0.0] * dim
    words = re.findall(r'\w+', text.lower())
    if not words:
        return vec

    for word in words:
        h = hash(word) % dim
        vec[h] += 1.0

    # L2 Normalize
    norm = math.sqrt(sum(x * x for x in vec))
    if norm > 0:
        vec = [x / norm for x in vec]

    return vec

