"""
ajustar_tono.py — Hace la voz más profunda y cálida

Uso:
    python ajustar_tono.py --entrada output/voz_generada.wav --salida output/voz_final.wav
    python ajustar_tono.py --entrada output/voz_generada.wav --salida output/voz_final.wav --semistonos -3
"""

import argparse
import subprocess
from pathlib import Path


def ajustar_tono(
    entrada: Path,
    salida: Path,
    semistonos: float = -2.5,  # negativo = más grave, positivo = más agudo
    reverb: bool = True,  # pequeño reverb para dar calidez
    normalizar: bool = True,  # normalizar volumen al final
):
    if not entrada.exists():
        print(f"[ERROR] No existe: {entrada}")
        return False

    salida.parent.mkdir(parents=True, exist_ok=True)

    # Factor de pitch: 2^(semistonos/12)
    import math

    factor = 2 ** (semistonos / 12)
    rate_ajustado = int(44100 * factor)

    print(f"[INFO] Ajustando tono...")
    print(
        f"       Semitonos: {semistonos} ({'más grave' if semistonos < 0 else 'más agudo'})"
    )
    print(f"       Factor: {factor:.4f}")

    # Construir filtros de audio
    filtros = []

    # 1. Pitch shift (bajar tono sin cambiar velocidad)
    filtros.append(f"asetrate=44100*{factor}")
    filtros.append("aresample=44100")
    filtros.append("atempo=1.0")  # mantener velocidad original

    # 2. Ecualización para voz más cálida/profunda
    # Refuerza graves leves, reduce agudos duros
    filtros.append("equalizer=f=120:width_type=o:width=2:g=2")  # refuerzo en 120Hz
    filtros.append("equalizer=f=250:width_type=o:width=2:g=1.5")  # calidez en 250Hz
    filtros.append("equalizer=f=3000:width_type=o:width=2:g=-1")  # reduce dureza
    filtros.append("equalizer=f=8000:width_type=o:width=2:g=-2")  # reduce sibilancias

    # 3. Reverb suave para dar espacio
    if reverb:
        filtros.append("aecho=0.8:0.9:40:0.25")  # reverb sutil

    # 4. Normalizar volumen
    if normalizar:
        filtros.append("dynaudnorm=p=0.9:s=5")

    filtro_completo = ",".join(filtros)

    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(entrada),
        "-af",
        filtro_completo,
        "-ar",
        "44100",
        "-ac",
        "1",
        str(salida),
    ]

    print(f"[INFO] Procesando con FFmpeg...")
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"[ERROR] FFmpeg falló:")
        print(result.stderr[-500:])
        return False

    print(f"[OK] Voz ajustada: {salida}")
    return True


def main():
    parser = argparse.ArgumentParser(description="Ajustador de tono de voz")
    parser.add_argument("--entrada", required=True, help="Audio de entrada (wav)")
    parser.add_argument("--salida", required=True, help="Audio de salida (wav/mp3)")
    parser.add_argument(
        "--semistonos",
        type=float,
        default=-2.5,
        help="Semitonos a bajar (default: -2.5, más grave)",
    )
    parser.add_argument("--sin-reverb", action="store_true", help="Sin reverb")
    parser.add_argument(
        "--sin-normalizar", action="store_true", help="Sin normalización"
    )
    args = parser.parse_args()

    ajustar_tono(
        entrada=Path(args.entrada),
        salida=Path(args.salida),
        semistonos=args.semistonos,
        reverb=not args.sin_reverb,
        normalizar=not args.sin_normalizar,
    )


if __name__ == "__main__":
    main()
