"""
alinear_poema.py — Alinea el texto del poema con los timestamps de Whisper,
tolerando palabras que Whisper no detectó (sin desincronizar lo que sigue).

Uso:
    python alinear_poema.py --poema poema.txt --transcript output/amorYAmistad_transcript.json --salida output/amorYAmistad_alineado.json

poema.txt debe ser el texto EXACTO que pusiste en Firestore (con \n reales,
incluyendo los marcadores **negrita** tal cual).
"""

import argparse
import json
import re
import unicodedata
import difflib
from pathlib import Path


def normalizar(palabra: str) -> str:
    """Quita tildes, puntuación y mayúsculas para comparar de forma tolerante."""
    p = palabra.lower()
    p = "".join(
        c for c in unicodedata.normalize("NFD", p) if unicodedata.category(c) != "Mn"
    )
    p = re.sub(r"[^\w]", "", p)
    return p


def limpiar_negrita(rawPalabra: str, estado: dict) -> tuple[str, bool]:
    """Quita los ** y determina si la palabra está dentro de un tramo en negrita."""
    palabra = rawPalabra
    entra = palabra.startswith("**")
    if entra:
        palabra = palabra[2:]
    sale = palabra.endswith("**") and len(palabra) > 2
    if sale:
        palabra = palabra[:-2]

    if entra:
        estado["negrita"] = True
    negrita = estado["negrita"]
    if sale:
        estado["negrita"] = False
    return palabra, negrita


def alinear(poema_texto: str, chunks: list) -> list:
    lineas_raw = poema_texto.split("\n")
    estado_negrita = {"negrita": False}

    # Construir lista plana de palabras del poema, recordando a qué línea pertenece cada una
    palabras_poema = []  # [{texto, negrita, linea_idx}]
    for linea_idx, linea in enumerate(lineas_raw):
        for raw in linea.strip().split():
            texto, negrita = limpiar_negrita(raw, estado_negrita)
            if texto:
                palabras_poema.append(
                    {"texto": texto, "negrita": negrita, "linea_idx": linea_idx}
                )

    palabras_audio = [c["text"] for c in chunks]
    norm_poema = [normalizar(p["texto"]) for p in palabras_poema]
    norm_audio = [normalizar(w) for w in palabras_audio]

    sm = difflib.SequenceMatcher(None, norm_poema, norm_audio, autojunk=False)
    opcodes = sm.get_opcodes()

    resultado = [None] * len(palabras_poema)
    huecos_reportados = 0

    for tag, i1, i2, j1, j2 in opcodes:
        if tag == "equal":
            for offset in range(i2 - i1):
                chunk = chunks[j1 + offset]
                resultado[i1 + offset] = (chunk["timestamp"][0], chunk["timestamp"][1])
        elif tag == "replace" and (i2 - i1) == (j2 - j1):
            # Mismo número de palabras a ambos lados — probablemente Whisper
            # transcribió distinto (ej. tildes, número vs letras) pero es 1 a 1
            for offset in range(i2 - i1):
                chunk = chunks[j1 + offset]
                resultado[i1 + offset] = (chunk["timestamp"][0], chunk["timestamp"][1])
        # tag == "delete" → palabra(s) del poema que Whisper NO detectó → se interpolan después
        # tag == "insert" → Whisper detectó palabra(s) de más (ruido, repetición) → se ignoran

        if tag in ("delete",) or (tag == "replace" and (i2 - i1) != (j2 - j1)):
            huecos_reportados += i2 - i1

    # Interpolar los huecos (palabras del poema sin timestamp directo)
    i = 0
    while i < len(resultado):
        if resultado[i] is None:
            inicio_hueco = i
            while i < len(resultado) and resultado[i] is None:
                i += 1
            fin_hueco = i  # exclusivo

            t_prev = resultado[inicio_hueco - 1][1] if inicio_hueco > 0 else 0.0
            t_next = (
                resultado[fin_hueco][0] if fin_hueco < len(resultado) else t_prev + 0.5
            )

            n = fin_hueco - inicio_hueco
            paso = (t_next - t_prev) / (n + 1)
            for k in range(n):
                start = t_prev + paso * k
                end = t_prev + paso * (k + 1)
                resultado[inicio_hueco + k] = (start, end)
        else:
            i += 1

    print(f"[INFO] Palabras del poema: {len(palabras_poema)}")
    print(f"[INFO] Palabras del audio: {len(palabras_audio)}")
    print(f"[INFO] Huecos interpolados: {huecos_reportados}")

    # Agrupar de vuelta en líneas para el formato que consume el componente React
    lineas_out = []
    linea_actual_idx = None
    linea_actual = None
    for p, (start, end) in zip(palabras_poema, resultado):
        if p["linea_idx"] != linea_actual_idx:
            if linea_actual is not None and linea_actual["palabras"]:
                lineas_out.append(linea_actual)
            linea_actual = {"palabras": [], "inicio": start}
            linea_actual_idx = p["linea_idx"]
        linea_actual["palabras"].append(
            {
                "texto": p["texto"],
                "negrita": p["negrita"],
                "start": round(start, 3),
                "end": round(end, 3),
            }
        )
    if linea_actual is not None and linea_actual["palabras"]:
        lineas_out.append(linea_actual)

    return lineas_out


def main():
    parser = argparse.ArgumentParser(
        description="Alinea poema con transcript de Whisper"
    )
    parser.add_argument(
        "--poema", required=True, help="Archivo .txt con el poema exacto"
    )
    parser.add_argument(
        "--transcript", required=True, help="JSON generado por whisper_transcribe.py"
    )
    parser.add_argument("--salida", required=True, help="JSON de salida ya alineado")
    args = parser.parse_args()

    poema_texto = Path(args.poema).read_text(encoding="utf-8")
    transcript = json.loads(Path(args.transcript).read_text(encoding="utf-8"))

    lineas = alinear(poema_texto, transcript["chunks"])

    Path(args.salida).write_text(
        json.dumps({"lineas": lineas}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"[OK] Guardado: {args.salida}")


if __name__ == "__main__":
    main()
