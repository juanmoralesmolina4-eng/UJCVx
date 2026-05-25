import sys
from faster_whisper import WhisperModel

# Use small model for good balance speed/quality
model = WhisperModel("small", device="cpu", compute_type="int8")

files = [
    "WhatsApp Ptt 2026-05-24 at 11.35.48 PM.ogg",
    "WhatsApp Ptt 2026-05-24 at 11.36.29 PM.ogg",
    "WhatsApp Ptt 2026-05-24 at 11.41.30 PM.ogg",
]

for f in files:
    print(f"\n===== {f} =====", flush=True)
    segments, info = model.transcribe(f, language="es", beam_size=5)
    print(f"[lang={info.language} prob={info.language_probability:.2f} dur={info.duration:.1f}s]", flush=True)
    for seg in segments:
        print(f"[{seg.start:6.1f} -> {seg.end:6.1f}] {seg.text}", flush=True)
