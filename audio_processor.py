"""
Audio Processing Module for NagarAI Civic Complaint Intelligence Engine
PS-S05: Integrates IndicConformer & OpenAI/Whisper ASR models for multilingual voice complaints.
"""

import os
import logging
from pathlib import Path
from typing import Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Global model cache to avoid re-loading weights on every call
_INDIC_MODEL = None
_WHISPER_PIPELINE = None


def load_indic_conformer():
    """Loads AI4Bharat's IndicConformer 600M Multilingual model lazily."""
    global _INDIC_MODEL
    if _INDIC_MODEL is not None:
        return _INDIC_MODEL
    
    try:
        import torch
        import torchaudio
        from transformers import AutoModel

        logger.info("Loading IndicConformer model (ai4bharat/indic-conformer-600m-multilingual)...")
        # Set local_files_only or fast load if available
        model = AutoModel.from_pretrained(
            "ai4bharat/indic-conformer-600m-multilingual",
            trust_remote_code=True
        )
        model.eval()
        _INDIC_MODEL = model
        logger.info("IndicConformer loaded successfully.")
        return _INDIC_MODEL
    except Exception as e:
        logger.warning(f"Failed to load IndicConformer model: {e}")
        return None


def load_whisper_pipeline():
    """Loads lightweight OpenAI Whisper model via HuggingFace transformers pipeline lazily."""
    global _WHISPER_PIPELINE
    if _WHISPER_PIPELINE is not None:
        return _WHISPER_PIPELINE

    try:
        from transformers import pipeline
        logger.info("Loading Whisper pipeline (openai/whisper-tiny)...")
        asr_pipe = pipeline("automatic-speech-recognition", model="openai/whisper-tiny")
        _WHISPER_PIPELINE = asr_pipe
        logger.info("Whisper pipeline loaded successfully.")
        return _WHISPER_PIPELINE
    except Exception as e:
        logger.warning(f"Failed to load Whisper pipeline: {e}")
        return None


def convert_to_wav(audio_path: str) -> str:
    """
    Convert any audio format (WebM, M4A, OGG, MP3, etc.) to 16kHz mono WAV
    using ffmpeg. Returns path to the converted WAV file.
    If the file is already a valid WAV, returns it as-is.
    """
    import subprocess
    import tempfile

    path = Path(audio_path)
    suffix = path.suffix.lower()

    # Formats that soundfile can read natively without conversion
    native_formats = {'.wav', '.flac', '.ogg', '.aiff'}

    # Quick check: try reading with soundfile first
    if suffix in native_formats:
        try:
            import soundfile as sf
            sf.info(audio_path)
            return audio_path  # Already readable
        except Exception:
            pass  # Fall through to ffmpeg conversion

    # Convert to WAV using ffmpeg
    wav_path = str(path.with_suffix('.converted.wav'))
    try:
        result = subprocess.run(
            [
                'ffmpeg', '-y',           # overwrite output
                '-i', audio_path,         # input file
                '-ar', '16000',           # 16kHz sample rate (optimal for Whisper)
                '-ac', '1',               # mono channel
                '-sample_fmt', 's16',     # 16-bit PCM
                wav_path
            ],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0 and os.path.exists(wav_path) and os.path.getsize(wav_path) > 100:
            logger.info(f"Converted {suffix} → WAV: {wav_path} ({os.path.getsize(wav_path)} bytes)")
            return wav_path
        else:
            logger.warning(f"ffmpeg conversion failed (exit {result.returncode}): {result.stderr[:300]}")
    except FileNotFoundError:
        logger.warning("ffmpeg not installed — cannot convert audio. Install with: brew install ffmpeg")
    except Exception as e:
        logger.warning(f"Audio conversion error: {e}")

    return audio_path  # Return original path as fallback


def audio_to_text(audio_path: str, lang: str = "hi", decoding_mode: str = "ctc", backend: str = "auto") -> str:
    """
    Transcribes audio file into cleaned transcript text.

    Args:
        audio_path (str): Path to local audio file (.wav, .flac, .mp3, .ogg, .webm, .m4a, etc.)
        lang (str): Language code ('hi' for Hindi, 'ta' for Tamil, 'en' for English, etc.)
        decoding_mode (str): ASR decoding mode for IndicConformer ('ctc' or 'rnnt')
        backend (str): Backend choice ('indic_conformer', 'openai_api', 'whisper_local', or 'auto')

    Returns:
        str: Cleaned transcript string or "Unclear audio" on error/failure.
    """
    if not audio_path or not os.path.exists(audio_path):
        logger.error(f"Audio file does not exist: {audio_path}")
        return "Unclear audio"

    # Check file size — if 0 bytes or unreadable, fail fast
    try:
        if os.path.getsize(audio_path) == 0:
            logger.error(f"Audio file is empty: {audio_path}")
            return "Unclear audio"
    except Exception as e:
        logger.error(f"Error checking audio file size: {e}")
        return "Unclear audio"

    # === CRITICAL: Convert to WAV first (handles WebM, M4A, OGG Opus, etc.) ===
    audio_path = convert_to_wav(audio_path)

    # 1. Try OpenAI API if backend is requested or key exists
    if backend in ["openai_api", "auto"] and os.environ.get("OPENAI_API_KEY"):
        try:
            from openai import OpenAI
            client = OpenAI()
            with open(audio_path, "rb") as audio_file:
                transcription = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language=lang if lang in ["en", "hi", "ta"] else None
                )
            text = transcription.text.strip()
            if text:
                return text
        except Exception as e:
            logger.warning(f"OpenAI API transcription failed: {e}")

    # 2. Try local Whisper model pipeline via Transformers
    if backend in ["whisper_local", "auto"]:
        whisper_pipe = load_whisper_pipeline()
        if whisper_pipe is not None:
            try:
                # Load audio data directly using soundfile/torchaudio to avoid requiring system ffmpeg
                import soundfile as sf
                audio_data, sr = sf.read(audio_path)
                if len(audio_data.shape) > 1:
                    audio_data = audio_data.mean(axis=1) # Convert stereo to mono

                result = whisper_pipe({"raw": audio_data, "sampling_rate": sr})
                if isinstance(result, dict) and "text" in result:
                    text = result["text"].strip()
                    if text:
                        return text
            except Exception as e:
                logger.warning(f"Whisper local pipeline failed: {e}")


    # 3. Try IndicConformer model (AI4Bharat) if explicitly selected or as fallback
    if backend in ["indic_conformer"]:
        indic_model = load_indic_conformer()
        if indic_model is not None:
            try:
                import torch
                import torchaudio

                wav, sr = torchaudio.load(audio_path)
                if wav.shape[0] > 1:
                    wav = torch.mean(wav, dim=0, keepdim=True)

                target_sr = 16000
                if sr != target_sr:
                    resampler = torchaudio.transforms.Resample(orig_freq=sr, new_freq=target_sr)
                    wav = resampler(wav)

                transcription = indic_model(wav, lang, decoding_mode)
                if isinstance(transcription, (list, tuple)) and len(transcription) > 0:
                    text = str(transcription[0]).strip()
                else:
                    text = str(transcription).strip()

                if text and text != "[]":
                    return text
            except Exception as e:
                logger.warning(f"IndicConformer transcription failed: {e}")

    # 4. Graceful handling if all ASR backends fail or audio is unintelligible
    logger.warning(f"All ASR backends returned empty or failed for {audio_path}")
    return "Unclear audio"



if __name__ == "__main__":
    import sys
    test_path = sys.argv[1] if len(sys.argv) > 1 else "sample.wav"
    result = audio_to_text(test_path)
    print("Transcript:", result)
