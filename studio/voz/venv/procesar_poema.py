"""
procesar_poema.py — Pipeline completo de voz de un solo comando

Pasos:
    1. Genera el audio con tu voz clonada (XTTS v2)
    2. Ajusta el tono para que suene más profundo
    3. Transcribe con Whisper para obtener timestamps
    4. Guarda todo listo para el pipeline de animación

Uso:
    python procesar_poema.py --poema "Mi corazon" --texto "Mis ojitos bellos..."
    python procesar_poema.py --poema "Mi corazon" --archivo poemas/mi_corazon.txt
"""

import argparse
import json
import sys
import torch
from pathlib import Path

# Rutas del studio
STUDIO_DIR = Path(__file__).parent.parent
VOZ_DIR = Path(__file__).parent
OUTPUT_DIR = STUDIO_DIR / "output"


def paso1_generar(texto: str, poema: str, referencia: Path) -> Path:
    print("\n[1/3] Generando voz con XTTS v2...")
    from TTS.api import TTS

    device = "cuda" if torch.cuda.is_available() else "cpu"
    tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)

    salida_raw = OUTPUT_DIR / f"{poema}_voz_raw.wav"
    salida_raw.parent.mkdir(parents=True, exist_ok=True)

    tts.tts_to_file(
        text=texto,
        speaker_wav=str(referencia),
        language="es",
        file_path=str(salida_raw),
    )
    print(f"[OK] Voz generada: {salida_raw}")
    return salida_raw


def paso2_ajustar(voz_raw: Path, poema: str, semistonos: float) -> Path:
    print(f"\n[2/3] Ajustando tono ({semistonos} semitonos)...")
    from ajustar_tono import ajustar_tono

    salida_final = OUTPUT_DIR / f"{poema}_voz_final.wav"
    ajustar_tono(
        entrada=voz_raw,
        salida=salida_final,
        semistonos=semistonos,
        reverb=True,
        normalizar=True,
    )
    return salida_final


def paso3_transcribir(audio: Path, poema: str) -> Path:
    print(f"\n[3/3] Transcribiendo con Whisper...")
    try:
        import whisper

        device = "cuda" if torch.cuda.is_available() else "cpu"
        model = whisper.load_model("large", device=device)
        result = model.transcribe(
            str(audio),
            language="es",
            word_timestamps=True,
            verbose=False,
        )
    except ImportError:
        try:
            from faster_whisper import WhisperModel

            model = WhisperModel(
                "large-v3", device="cuda" if torch.cuda.is_available() else "cpu"
            )
            segments, _ = model.transcribe(
                str(audio), language="es", word_timestamps=True
            )
            # Convertir al formato estándar
            result = {"segments": []}
            for seg in segments:
                words = [
                    {"word": w.word, "start": w.start, "end": w.end}
                    for w in (seg.words or [])
                ]
                result["segments"].append(
                    {
                        "text": seg.text,
                        "start": seg.start,
                        "end": seg.end,
                        "words": words,
                    }
                )
        except ImportError:
            print("[WARN] Whisper no encontrado — saltando transcripción")
            print("       Instala con: pip install faster-whisper")
            return None

    # Guardar transcript
    transcript_path = OUTPUT_DIR / f"{poema}_transcript.json"

    # Construir chunks estilo Whisper
    chunks = []
    for seg in result.get("segments", []):
        for word in seg.get("words", []):
            chunks.append(
                {
                    "text": word.get("word", "").strip(),
                    "timestamp": [
                        round(word.get("start", 0), 3),
                        round(word.get("end", 0), 3),
                    ],
                }
            )

    output = {
        "text": result.get("text", ""),
        "chunks": chunks,
    }

    transcript_path.write_text(
        json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"[OK] Transcript: {transcript_path}")
    return transcript_path


def main():
    parser = argparse.ArgumentParser(description="Pipeline completo de voz")
    parser.add_argument(
        "--poema",
        required=True,
        help="Nombre del poema/tarjeta (ej: mi_corazon) — se usa para nombrar archivos",
    )
    parser.add_argument("--texto", type=str, help="Texto del poema directamente")
    parser.add_argument("--archivo", type=str, help="Ruta a archivo .txt con el poema")
    parser.add_argument(
        "--referencia",
        type=str,
        default=str(VOZ_DIR / "referencias" / "sebastian_ref.wav"),
        help="Audio de referencia de tu voz",
    )
    parser.add_argument(
        "--semistonos",
        type=float,
        default=-2.5,
        help="Ajuste de tono en semitonos (default: -2.5)",
    )
    parser.add_argument(
        "--solo-generar",
        action="store_true",
        help="Solo genera la voz sin ajustar ni transcribir",
    )
    args = parser.parse_args()

    # Leer texto
    if args.archivo:
        texto = Path(args.archivo).read_text(encoding="utf-8").strip()
    elif args.texto:
        texto = args.texto
    else:
        print("[ERROR] Debes pasar --texto o --archivo")
        sys.exit(1)

    referencia = Path(args.referencia)
    if not referencia.exists():
        print(f"[ERROR] No existe referencia de voz: {referencia}")
        print("        Extrae primero 25s de tu voz con FFmpeg")
        sys.exit(1)

    print(f"\n{'='*50}")
    print(f"  Pipeline de voz: {args.poema}")
    print(f"  Texto: {texto[:50]}...")
    print(f"{'='*50}")

    # Paso 1: Generar
    voz_raw = paso1_generar(texto, args.poema, referencia)

    if args.solo_generar:
        print(f"\n[OK] Solo generación — audio en: {voz_raw}")
        return

    # Paso 2: Ajustar tono
    voz_final = paso2_ajustar(voz_raw, args.poema, args.semistonos)

    # Paso 3: Transcribir
    transcript = paso3_transcribir(voz_final, args.poema)

    print(f"\n{'='*50}")
    print(f"  ✓ Listo. Archivos generados:")
    print(f"    Voz:        output/{args.poema}_voz_final.wav")
    if transcript:
        print(f"    Transcript: output/{args.poema}_transcript.json")
    print(f"\n  Siguiente paso:")
    print(f"    python ../pipeline.py --animacion {args.poema}")
    print(f"{'='*50}\n")


if __name__ == "__main__":
    main()
