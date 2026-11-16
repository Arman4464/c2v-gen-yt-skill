import os
import sys
import argparse
import json
import base64
import subprocess
import urllib.request
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from project root or parent directories
load_dotenv()

DEFAULT_API_KEY = os.getenv("GEMINI_API_KEY")

def normalize_audio(file_path: str):
    """Normalizes voiceover audio to standard YouTube loudness (-14 LUFS) via bundled ffmpeg."""
    root = Path(__file__).resolve().parent.parent
    bundled_ffmpeg = root / "node_modules" / "@remotion" / "compositor-win32-x64-msvc" / "ffmpeg.exe"
    ffmpeg_exe = str(bundled_ffmpeg) if bundled_ffmpeg.exists() else "ffmpeg"

    tmp_path = str(file_path) + ".tmp.wav"
    cmd = [
        ffmpeg_exe, "-y", "-hide_banner", "-loglevel", "error",
        "-i", str(file_path),
        "-af", "loudnorm=I=-14:TP=-1.5:LRA=7",
        "-ar", "44100",
        tmp_path
    ]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode == 0 and os.path.exists(tmp_path):
            os.replace(tmp_path, file_path)
            print(f"Normalized audio to -14 LUFS (EBU R128 standard): {file_path}")
        elif os.path.exists(tmp_path):
            os.remove(tmp_path)
    except Exception as ex:
        print(f"Audio normalization skipped (warning): {ex}")

def generate_tts(text: str, output_path: str, voice: str = "Puck", model: str = "gemini-3.8-flash-tts", api_key: str = None):
    key = api_key or DEFAULT_API_KEY
    if not key:
        raise ValueError("GEMINI_API_KEY is not set.")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
    payload = {
        "contents": [{"parts": [{"text": text}]}],
        "generationConfig": {
            "speechConfig": {
                "voiceConfig": {
                    "prebuiltVoiceConfig": {
                        "voiceName": voice
                    }
                }
            }
        }
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )

    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            candidates = data.get("candidates", [])
            if not candidates:
                raise RuntimeError(f"No response candidates returned: {data}")
            
            parts = candidates[0].get("content", {}).get("parts", [])
            audio_bytes = None
            for p in parts:
                if "inlineData" in p:
                    b64 = p["inlineData"].get("data")
                    audio_bytes = base64.b64decode(b64)
                    break
            
            if not audio_bytes:
                raise RuntimeError(f"No audio data found in response: {candidates}")

            out = Path(output_path)
            out.parent.mkdir(parents=True, exist_ok=True)
            with open(out, "wb") as f:
                f.write(audio_bytes)
            print(f"Successfully generated TTS audio ({len(audio_bytes)} bytes) -> {out}")
            normalize_audio(str(out))
            return str(out)

    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        # If gemini-3.8-flash-tts fails with 404 or similar, fallback to gemini-2.5-flash-preview-tts
        if model != "gemini-2.5-flash-preview-tts":
            print(f"Model {model} failed, falling back to gemini-2.5-flash-preview-tts...")
            return generate_tts(text, output_path, voice=voice, model="gemini-2.5-flash-preview-tts", api_key=key)
        raise RuntimeError(f"HTTP {e.code} Error: {err_msg}")

def main():
    parser = argparse.ArgumentParser(description="Generate voiceover using Gemini TTS")
    parser.add_argument("--text", "-t", required=True, help="Text to convert to speech")
    parser.add_argument("--out", "-o", default="public/voiceover.wav", help="Output file path (default: public/voiceover.wav)")
    parser.add_argument("--voice", "-v", default="Puck", choices=["Puck", "Charon", "Kore", "Fenrir", "Aoede"], help="Prebuilt voice name")
    parser.add_argument("--model", "-m", default="gemini-3.8-flash-tts", help="TTS Model name")
    parser.add_argument("--key", "-k", default=None, help="Gemini API Key override")

    args = parser.parse_args()
    generate_tts(text=args.text, output_path=args.out, voice=args.voice, model=args.model, api_key=args.key)

if __name__ == "__main__":
    main()
