"""
whisper_transcribe.py — Transcripción de audio con timestamps por palabra

Uso:
    python whisper_transcribe.py output/pluma2_voz_final.wav
    python whisper_transcribe.py output/pluma2_voz_final.wav --modelo large-v3
    python whisper_transcribe.py output/pluma2_voz_final.wav --salida output/mi_transcript.json

Genera un archivo JSON con cada palabra y su timestamp exacto.
"""

import argparse
import json
import sys
from pathlib import Path


def transcribir(audio_path: Path, modelo: str = "large-v3", salida: Path = None):
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print("[ERROR] faster-whisper no está instalado.")
        print("        Instala con: pip install faster-whisper")
        sys.exit(1)

    if not audio_path.exists():
        print(f"[ERROR] No existe el archivo: {audio_path}")
        sys.exit(1)

    # Salida por defecto al lado del audio
    if salida is None:
        salida = audio_path.parent / (audio_path.stem + "_transcript.json")

    print(f"\n{'='*50}")
    print(f"  Transcribiendo: {audio_path.name}")
    print(f"  Modelo: {modelo}")
    print(f"{'='*50}")

    # Detectar GPU disponible
    try:
        import torch
        device = "cuda" if torch.cuda.is_available() else "cpu"
        compute_type = "float16" if device == "cuda" else "int8"
    except ImportError:
        device = "cpu"
        compute_type = "int8"

    print(f"[INFO] Usando: {device.upper()}")
    if device == "cpu":
        print("[WARN] Sin GPU — la transcripción será más lenta")

    print(f"[INFO] Cargando modelo Whisper {modelo}...")
    model = WhisperModel(modelo, device=device, compute_type=compute_type)

    print(f"[INFO] Transcribiendo...")
    segments, info = model.transcribe(
        str(audio_path),
        language="es",
        word_timestamps=True,
        vad_filter=True,          # filtra silencios automáticamente
        vad_parameters=dict(
            min_silence_duration_ms=300,
        ),
    )

    print(f"[INFO] Idioma detectado: {info.language} ({info.language_probability:.0%})")

    # Construir chunks por palabra
    chunks = []
    texto_completo = []

    for seg in segments:
        texto_completo.append(seg.text.strip())
        if seg.words:
            for word in seg.words:
                chunks.append({
                    "text": word.word.strip(),
                    "timestamp": [
                        round(word.start, 3),
                        round(word.end, 3),
                    ]
                })

    output = {
        "text": " ".join(texto_completo),
        "chunks": chunks,
        "duracion_total": round(info.duration, 3),
        "idioma": info.language,
    }

    salida.write_text(
        json.dumps(output, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    print(f"\n[OK] Transcript guardado: {salida}")
    print(f"     Palabras detectadas: {len(chunks)}")
    print(f"     Duración total: {info.duration:.1f}s")
    print(f"\n  Vista previa (primeras 10 palabras):")
    for chunk in chunks[:10]:
        print(f"    [{chunk['timestamp'][0]:.2f}s → {chunk['timestamp'][1]:.2f}s] {chunk['text']}")
    print(f"{'='*50}\n")

    return salida


def main():
    parser = argparse.ArgumentParser(
        description="Transcriptor de audio con timestamps — Portal de Recuerdos"
    )
    parser.add_argument(
        "audio",
        help="Ruta al archivo de audio (wav, mp3, m4a...)"
    )
    parser.add_argument(
        "--modelo",
        default="large-v3",
        choices=["tiny", "base", "small", "medium", "large-v2", "large-v3"],
        help="Modelo de Whisper a usar (default: large-v3)"
    )
    parser.add_argument(
        "--salida",
        default=None,
        help="Ruta del JSON de salida (default: mismo nombre que el audio)"
    )
    args = parser.parse_args()

    audio_path = Path(args.audio)
    salida = Path(args.salida) if args.salida else None

    transcribir(audio_path, modelo=args.modelo, salida=salida)


if __name__ == "__main__":
    main()