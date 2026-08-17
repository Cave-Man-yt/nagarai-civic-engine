"""
Configuration Settings for NagarAI Civic Intelligence Engine
PS-S05
"""

import os

# Spatial Radius Threshold (in meters)
SPATIAL_RADIUS_METERS = float(os.environ.get("SPATIAL_RADIUS_METERS", "50.0"))

# Semantic Cosine Similarity Threshold
SEMANTIC_SIMILARITY_THRESHOLD = float(os.environ.get("SEMANTIC_SIMILARITY_THRESHOLD", "0.80"))

# Model Configurations
INDIC_CONFORMER_MODEL_NAME = "ai4bharat/indic-conformer-600m-multilingual"
WHISPER_LOCAL_MODEL_NAME = "openai/whisper-tiny"
SENTENCE_TRANSFORMER_MODEL_NAME = "all-MiniLM-L6-v2"
YOLO_MODEL_NAME = "yolov8n.pt"
CLIP_MODEL_NAME = "ViT-B/32"

# Priority Score Weights
SEVERITY_WEIGHT = 15.0
CITIZEN_MULTIPLIER = 5.0
MAX_CITIZEN_SCORE = 40.0
SENSITIVE_LOCATION_WEIGHT = 20.0
NORMAL_LOCATION_WEIGHT = 10.0
TIME_URGENCY_MULTIPLIER = 0.5
MAX_TIME_SCORE = 25.0
MAX_TOTAL_PRIORITY = 100.0
