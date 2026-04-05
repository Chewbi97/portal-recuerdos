"""
generar_voz.py — Clona tu voz con XTTS v2 y genera el audio del poema

Uso:
    python generar_voz.py --texto "Mis ojitos bellos..." --salida output/voz_generada.wav
    python generar_voz.py --archivo poema.txt --salida output/voz_generada.wav
"""

import argparse
import torch
from pathlib import Path
from TTS.api import TTS

# ── Configuración ──
REFERENCIA_VOZ = Path(__file__).parent / "referencias" / "sebastian_ref.wav"
IDIOMA = "es"  # español


def cargar_modelo():
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[INFO] Usando: {device.upper()}")
    if device == "cpu":
        print(
            "[WARN] Sin GPU — la generación será más lenta (~2-5 min por minuto de audio)"
        )

    print("[INFO] Cargando modelo XTTS v2...")
    tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)
    print("[OK] Modelo listo")
    return tts


def generar(texto: str, salida: Path, referencia: Path = REFERENCIA_VOZ):
    if not referencia.exists():
        print(f"[ERROR] No existe el archivo de referencia: {referencia}")
        print(
            "        Corre primero el comando ffmpeg para extraer tu voz de referencia"
        )
        return False

    salida.parent.mkdir(parents=True, exist_ok=True)

    print(f"[INFO] Generando audio...")
    print(f"       Texto: {texto[:60]}{'...' if len(texto) > 60 else ''}")
    print(f"       Referencia: {referencia.name}")
    print(f"       Salida: {salida}")

    tts = cargar_modelo()

    tts.tts_to_file(
        text=texto,
        speaker_wav=str(referencia),
        language=IDIOMA,
        file_path=str(salida),
    )

    print(f"[OK] Audio generado: {salida}")
    return True


def main():
    parser = argparse.ArgumentParser(
        description="Generador de voz — Portal de Recuerdos"
    )
    parser.add_argument("--texto", type=str, help="Texto a convertir en voz")
    parser.add_argument("--archivo", type=str, help="Archivo .txt con el poema")
    parser.add_argument("--salida", type=str, default="output/voz_generada.wav")
    parser.add_argument("--referencia", type=str, default=str(REFERENCIA_VOZ))
    args = parser.parse_args()

    # Leer texto
    if args.archivo:
        texto = Path(args.archivo).read_text(encoding="utf-8").strip()
    elif args.texto:
        texto = args.texto
    else:
        print("[ERROR] Debes pasar --texto o --archivo")
        return

    salida = Path(args.salida)
    referencia = Path(args.referencia)

    generar(texto, salida, referencia)


if __name__ == "__main__":
    main()
