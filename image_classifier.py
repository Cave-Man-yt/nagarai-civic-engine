"""
Image Classification Module for NagarAI Civic Complaint Intelligence Engine
PS-S05: Integrates YOLOv8 civic issue detection & CLIP image embedding.
"""

import os
import logging
from typing import Dict, Any, List

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

_YOLO_MODEL = None
_CLIP_MODEL = None
_CLIP_PREPROCESS = None

# Default civic issue mapping for severity rating (1-5)
CIVIC_SEVERITY_MAP = {
    "pothole": 4,
    "garbage_dump": 3,
    "waterlogging": 4,
    "broken_streetlight": 2,
    "broken_road": 3,
    "open_manhole": 5,
    "traffic_signal": 4,
    "fallen_tree": 3,
    "stray_animals": 2,
    "illegal_parking": 2
}


def load_yolo_model():
    """Loads YOLOv8 model lazily."""
    global _YOLO_MODEL
    if _YOLO_MODEL is not None:
        return _YOLO_MODEL
    try:
        from ultralytics import YOLO
        logger.info("Loading YOLOv8 model (yolov8n.pt)...")
        model = YOLO("yolov8n.pt")
        _YOLO_MODEL = model
        return _YOLO_MODEL
    except Exception as e:
        logger.warning(f"Failed to load YOLOv8 model: {e}")
        return None


def load_clip_model():
    """Loads CLIP model lazily for zero-shot classification and embedding generation."""
    global _CLIP_MODEL, _CLIP_PREPROCESS
    if _CLIP_MODEL is not None:
        return _CLIP_MODEL, _CLIP_PREPROCESS
    try:
        import torch
        import clip
        if torch.cuda.is_available():
            device = "cuda"
        elif torch.backends.mps.is_available():
            device = "mps"
        else:
            device = "cpu"

        logger.info(f"Loading CLIP model (ViT-B/32) on {device}...")
        model, preprocess = clip.load("ViT-B/32", device=device)
        _CLIP_MODEL = model
        _CLIP_PREPROCESS = preprocess
        return _CLIP_MODEL, _CLIP_PREPROCESS
    except Exception as e:
        logger.warning(f"Failed to load CLIP model: {e}")
        return None, None



def classify_image(image_path: str) -> Dict[str, Any]:
    """
    Detects civic issues in input image using zero-shot CLIP classification.

    Args:
        image_path (str): Path to local image file (.jpg, .png, etc.)

    Returns:
        Dict: { "category": str, "severity": int (1-5), "confidence": float }
    """
    if not image_path or not os.path.exists(image_path):
        logger.error(f"Image file not found: {image_path}")
        return {"category": "unknown", "severity": 1, "confidence": 0.0}

    # Primary: Zero-shot classification using CLIP (Much better than YOLO COCO for zero-shot civic issues)
    clip_model, clip_preprocess = load_clip_model()
    if clip_model is not None and clip_preprocess is not None:
        try:
            import torch
            import clip
            from PIL import Image
            categories = ["pothole", "garbage dump", "waterlogging", "broken streetlight", "open manhole", "traffic signal", "fallen tree", "stray animals", "illegal parking", "normal street"]
            device = next(clip_model.parameters()).device

            image = clip_preprocess(Image.open(image_path)).unsqueeze(0).to(device)
            text_tokens = clip.tokenize([f"a photo of a {c}" for c in categories]).to(device)


            with torch.no_grad():
                logits_per_image, _ = clip_model(image, text_tokens)
                probs = logits_per_image.softmax(dim=-1).cpu().numpy()[0]

            best_idx = int(probs.argmax())
            best_cat = categories[best_idx]
            best_conf = float(probs[best_idx])
            
            if best_cat == "normal street":
                 return {"category": "other", "severity": 1, "confidence": round(best_conf, 4)}

            severity = CIVIC_SEVERITY_MAP.get(best_cat.replace(" ", "_"), 3)

            return {
                "category": best_cat.replace(" ", "_"),
                "severity": severity,
                "confidence": round(best_conf, 4)
            }
        except Exception as e:
            logger.warning(f"CLIP classification failed: {e}")

    return {"category": "civic_issue", "severity": 3, "confidence": 0.5}


def generate_image_embedding(image_path: str) -> List[float]:
    """
    Generates a visual embedding vector for the image using CLIP.

    Args:
        image_path (str): Path to image file

    Returns:
        List[float]: 512-dimensional embedding vector or empty list on error.
    """
    if not image_path or not os.path.exists(image_path):
        return []

    clip_model, clip_preprocess = load_clip_model()
    if clip_model is not None and clip_preprocess is not None:
        try:
            import torch
            from PIL import Image
            device = next(clip_model.parameters()).device
            image = clip_preprocess(Image.open(image_path)).unsqueeze(0).to(device)

            with torch.no_grad():
                image_features = clip_model.encode_image(image)
                # Normalize vector
                image_features /= image_features.norm(dim=-1, keepdim=True)
                vector = image_features.cpu().numpy()[0].tolist()
                return vector
        except Exception as e:
            logger.warning(f"Failed to generate CLIP image embedding: {e}")

    return []

