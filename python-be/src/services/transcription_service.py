import os
import logging
from pathlib import Path
import subprocess  # For ffmpeg
import requests

from config import (
    AZURE_SPEECH_KEY,
    PROMTE_API_KEY,
    MODEL_URL_MAP,
)

logger = logging.getLogger(__name__)


def transcribe_audio(audio_path: str, model_key: str, from_lang: str) -> str:
    """
    Transcribe *once* with the requested model.

    model_key must be either:
      • "promte_whisper"
      • "azure_speech"

    No automatic fall-backs are attempted.
    """
    logger.debug("=== TRANSCRIBE_AUDIO START ===")
    logger.debug(
        "Params -> audio_path='%s', model_key='%s', from_lang='%s'",
        audio_path,
        model_key,
        from_lang,
    )

    # --- basic validation ----------------------------------------------------
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found: {audio_path}")
    logger.debug("Audio size: %d bytes", os.path.getsize(audio_path))

    transcribe_url = MODEL_URL_MAP.get(model_key)
    if not transcribe_url:
        raise ValueError(f"Transcription model URL not found for {model_key}")

    # --- delegate to the selected engine -------------------------------------
    if model_key == "promte_whisper":
        return _transcribe_promte_whisper(audio_path, transcribe_url, from_lang)

    if model_key == "azure_speech":
        return _transcribe_azure_speech(audio_path, from_lang)

    raise ValueError(f"Unknown transcribe model: {model_key}")


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------


def convert_to_wav(src_path: str, dest_path: str) -> None:
    """Convert any audio file to 16 kHz mono WAV using ffmpeg."""
    logger.debug("Converting '%s' → '%s'", src_path, dest_path)
    subprocess.run(
        [
            "ffmpeg",
            "-y",  # overwrite
            "-i",
            src_path,  # input
            "-ar",
            "16000",  # sample-rate
            "-ac",
            "1",  # mono
            dest_path,
        ],
        check=True,
    )
    logger.debug("Converted size: %d bytes", os.path.getsize(dest_path))


def _guess_mime_type(audio_path: str) -> str:
    """Infer a MIME type from file extension."""
    ext = os.path.splitext(audio_path.lower())[1]
    return {
        ".webm": "audio/webm",
        ".mp3": "audio/mpeg",
        ".wav": "audio/wav",
    }.get(ext, "audio/wav")


# ---- PROMTE ---------------------------------------------------------------


def _transcribe_promte_whisper(path: str, url: str, from_lang: str) -> str:
    headers = {"Authorization": f"Bearer {PROMTE_API_KEY}"}

    with open(path, "rb") as fp:
        files = {"file": (Path(path).name, fp)}
        data = {"language": from_lang}
        r = requests.post(url, headers=headers, data=data, files=files, timeout=30)
    r.raise_for_status()

    try:
        return r.json()["text"].strip()
    except (KeyError, ValueError) as exc:
        raise RuntimeError(f"Bad JSON: {r.text}") from exc


# ---- AZURE ----------------------------------------------------------------


def _transcribe_azure_speech(audio_path: str, from_lang: str) -> str:
    logger.debug("=== _transcribe_azure_speech ===")
    transcribe_url = MODEL_URL_MAP.get("azure_speech")
    if not transcribe_url:
        raise ValueError("Azure speech URL missing in MODEL_URL_MAP")

    # Convert if needed
    if not audio_path.lower().endswith(".wav"):
        wav_path = audio_path + ".converted.wav"
        convert_to_wav(audio_path, wav_path)
        audio_path = wav_path

    headers = {
        "Ocp-Apim-Subscription-Key": AZURE_SPEECH_KEY,
        "Content-Type": "audio/wav",
    }
    params = {"language": from_lang}

    with open(audio_path, "rb") as f:
        resp = requests.post(transcribe_url, headers=headers, params=params, data=f)

    logger.debug("Status: %s — %s", resp.status_code, resp.text)
    if resp.status_code != 200:
        raise RuntimeError(f"Azure speech failed: {resp.text}")

    return resp.json().get("DisplayText", "").strip()
