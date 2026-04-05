import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ── Rutas base ──
STUDIO_DIR = Path(__file__).parent
ANIMACIONES_DIR = STUDIO_DIR / "animaciones"
OUTPUT_DIR = STUDIO_DIR / "output"
OUTPUT_DIR.mkdir(exist_ok=True)

# ── Firebase ──
FIREBASE_CREDENTIALS = os.getenv("FIREBASE_CREDENTIALS", "./firebase-credentials.json")
FIREBASE_BUCKET = os.getenv("FIREBASE_BUCKET", "portal-de-recuerdos.firebasestorage.app")

# ── Manim ──
MANIM_QUALITY = "high_quality"   # low_quality | medium_quality | high_quality | production_quality
MANIM_FPS = 60

# ── Video ──
VIDEO_WIDTH = 1080
VIDEO_HEIGHT = 1920  # 9:16 vertical para móvil

# ── Audio ──
AUDIO_VOZ_VOLUME = 1.0
AUDIO_MUSICA_VOLUME = 0.12   # música de fondo suave
AUDIO_DUCKING_VOLUME = 0.06  # durante la voz
