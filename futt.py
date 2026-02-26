#!/usr/bin/env python3
"""Read text aloud using a local TTS model (Coqui TTS).

Usage:
    python3 readaloud.py hello world, this is read by an ai model
    python3 readaloud.py --list-models
    python3 readaloud.py --model tts_models/en/ljspeech/tacotron2-DDC "Hello!"
    python3 readaloud.py --output speech.wav "Save to file"

Requires:
    pip install TTS

Models are downloaded automatically on first use (~100MB-1GB depending on model).
"""

import sys
import argparse
import tempfile
import subprocess
import shutil

from TTS.api import TTS


DEFAULT_MODEL = "tts_models/en/ljspeech/vits"  # Fast, good quality, single speaker


def play_audio(path: str):
    """Play a wav/mp3 file using available system player."""
    for player in ["ffplay", "mpv", "aplay", "paplay", "pw-play"]:
        if shutil.which(player):
            args = {
                "ffplay": [player, "-nodisp", "-autoexit", "-loglevel", "quiet", path],
                "mpv":    [player, "--no-video", path],
                "aplay":  [player, "-q", path],
                "paplay": [player, path],
                "pw-play":[player, path],
            }[player]
            subprocess.run(args)
            return
    print(f"No audio player found. Audio saved at: {path}")


def main():
    parser = argparse.ArgumentParser(description="Local TTS using Coqui TTS models")
    parser.add_argument("text", nargs="*", help="Text to speak")
    parser.add_argument("--model", "-m", default=DEFAULT_MODEL, help=f"TTS model (default: {DEFAULT_MODEL})")
    parser.add_argument("--output", "-o", help="Save to wav file instead of playing")
    parser.add_argument("--list-models", action="store_true", help="List available models")
    parser.add_argument("--gpu", action="store_true", help="Use GPU if available")
    args = parser.parse_args()

    if args.list_models:
        print("Available models:\n")
        manager = TTS().list_models()
        for m in manager:
            print(f"  {m}")
        return

    text = " ".join(args.text).strip()
    if not text:
        print("Reading from stdin (Ctrl+D to finish)...")
        text = sys.stdin.read().strip()

    if not text:
        print("Error: No text provided.", file=sys.stderr)
        sys.exit(1)

    print(f"🔊 Model: {args.model}")
    print(f"📝 \"{text[:80]}{'...' if len(text) > 80 else ''}\"")
    print("⏳ Loading model (first run downloads it)...")

    tts = TTS(model_name=args.model, gpu=args.gpu)

    if args.output:
        out_path = args.output
    else:
        out_path = tempfile.mktemp(suffix=".wav")

    tts.tts_to_file(text=text, file_path=out_path)
    print(f"✅ Generated audio ({out_path})")

    if not args.output:
        play_audio(out_path)


if __name__ == "__main__":
    main()