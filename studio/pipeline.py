"""
pipeline.py — Script maestro del studio

Uso:
    python pipeline.py --animacion pluma
    python pipeline.py --animacion corazon
    python pipeline.py --animacion pluma --solo-render
    python pipeline.py --animacion pluma --solo-subir

Pasos que ejecuta:
    1. Renderiza la animación con Manim → output/{nombre}_raw.mp4
    2. Mezcla audio (voz + música) con FFmpeg → output/{nombre}_final.mp4
    3. Sube el video final a Firebase Storage
    4. Actualiza videoUrl en Firestore
"""

import argparse
import subprocess
import sys
import json
from pathlib import Path
import ffmpeg
import firebase_admin
from firebase_admin import credentials, storage, firestore

from config import (
    ANIMACIONES_DIR, OUTPUT_DIR,
    FIREBASE_CREDENTIALS, FIREBASE_BUCKET,
    MANIM_QUALITY, MANIM_FPS,
    AUDIO_VOZ_VOLUME, AUDIO_MUSICA_VOLUME, AUDIO_DUCKING_VOLUME
)

# ── PASO 1: Render con Manim ──
def render_animacion(nombre: str) -> Path:
    anim_dir = ANIMACIONES_DIR / nombre
    script = anim_dir / f"{nombre}.py"

    if not script.exists():
        print(f"[ERROR] No existe {script}")
        sys.exit(1)

    print(f"\n[1/4] Renderizando {nombre}.py con Manim...")

    result = subprocess.run([
        sys.executable, "-m", "manim",
        str(script),
        "Animacion",                    # nombre de la clase dentro del .py
        f"--quality={MANIM_QUALITY[0]}", # l | m | h | p
        f"--fps={MANIM_FPS}",
        "--output_file", f"{nombre}_raw",
        "--media_dir", str(OUTPUT_DIR / "manim_media"),
    ], capture_output=False)

    if result.returncode != 0:
        print("[ERROR] Manim falló. Revisa los errores arriba.")
        sys.exit(1)

    # Manim guarda en media_dir/videos/.../nombre_raw.mp4
    raw_candidates = list((OUTPUT_DIR / "manim_media").rglob(f"{nombre}_raw.mp4"))
    if not raw_candidates:
        print("[ERROR] No se encontró el video renderizado.")
        sys.exit(1)

    raw_path = raw_candidates[0]
    print(f"[OK] Video raw: {raw_path}")
    return raw_path

# ── PASO 2: Mezcla de audio con FFmpeg ──
def mezclar_audio(nombre: str, raw_video: Path) -> Path:
    anim_dir = ANIMACIONES_DIR / nombre / "assets"
    config_file = ANIMACIONES_DIR / nombre / "audio_config.json"

    final_path = OUTPUT_DIR / f"{nombre}_final.mp4"

    # Leer configuración de audio de la animación
    if not config_file.exists():
        print(f"[2/4] Sin audio_config.json — copiando video sin audio extra...")
        import shutil
        shutil.copy(raw_video, final_path)
        return final_path

    with open(config_file) as f:
        audio_cfg = json.load(f)

    voz_file = anim_dir / audio_cfg.get("voz", "")
    musica_file = anim_dir / audio_cfg.get("musica", "")
    voz_delay = audio_cfg.get("voz_delay_segundos", 0)
    musica_loop = audio_cfg.get("musica_loop", True)

    print(f"\n[2/4] Mezclando audio...")
    print(f"      Voz: {voz_file.name} (delay: {voz_delay}s)")
    print(f"      Música: {musica_file.name}")

    # Construir filtro de audio con ducking automático
    video_input = ffmpeg.input(str(raw_video))

    inputs = [video_input]
    filter_parts = []

    # Música de fondo
    if musica_file.exists():
        musica_input = ffmpeg.input(str(musica_file), stream_loop=-1 if musica_loop else 0)
        inputs.append(musica_input)
        filter_parts.append(f"[{len(inputs)-1}:a]volume={AUDIO_MUSICA_VOLUME}[musica]")

    # Voz con delay
    if voz_file.exists():
        voz_input = ffmpeg.input(str(voz_file))
        inputs.append(voz_input)
        filter_parts.append(
            f"[{len(inputs)-1}:a]adelay={int(voz_delay*1000)}|{int(voz_delay*1000)},"
            f"volume={AUDIO_VOZ_VOLUME}[voz]"
        )

    # Mezcla final
    if len(filter_parts) == 2:
        filter_parts.append("[musica][voz]amix=inputs=2:duration=first:dropout_transition=2[audio_final]")
        output_map = "[audio_final]"
    elif len(filter_parts) == 1 and "musica" in filter_parts[0]:
        output_map = "[musica]"
    elif len(filter_parts) == 1 and "voz" in filter_parts[0]:
        output_map = "[voz]"
    else:
        # Sin audio, solo copiar
        import shutil
        shutil.copy(raw_video, final_path)
        return final_path

    filter_complex = ";".join(filter_parts)

    try:
        (
            ffmpeg
            .input(str(raw_video))
            .output(
                *[i.audio for i in inputs[1:]],
                str(final_path),
                filter_complex=filter_complex,
                map=["0:v", output_map],
                vcodec="copy",
                acodec="aac",
                shortest=None,
                y=None
            )
            .run(overwrite_output=True, quiet=False)
        )
    except ffmpeg.Error as e:
        # Fallback: mezcla simple sin ducking
        print("[WARN] Filtro complejo falló, usando mezcla simple...")
        cmd = ["ffmpeg", "-y", "-i", str(raw_video)]
        if voz_file.exists():
            cmd += ["-i", str(voz_file)]
        if musica_file.exists():
            cmd += ["-i", str(musica_file)]
        if voz_file.exists() and musica_file.exists():
            cmd += [
                "-filter_complex",
                f"[1:a]volume={AUDIO_VOZ_VOLUME}[v];[2:a]volume={AUDIO_MUSICA_VOLUME}[m];[v][m]amix=inputs=2:duration=first[a]",
                "-map", "0:v", "-map", "[a]"
            ]
        elif voz_file.exists():
            cmd += ["-filter_complex", f"[1:a]volume={AUDIO_VOZ_VOLUME}[a]", "-map", "0:v", "-map", "[a]"]
        cmd += ["-vcodec", "copy", "-acodec", "aac", "-shortest", str(final_path)]
        subprocess.run(cmd, check=True)

    print(f"[OK] Video final: {final_path}")
    return final_path

# ── PASO 3: Subir a Firebase Storage ──
def subir_a_storage(nombre: str, video_path: Path) -> str:
    print(f"\n[3/4] Subiendo a Firebase Storage...")

    cred_path = Path(FIREBASE_CREDENTIALS)
    if not cred_path.exists():
        print(f"[ERROR] No existe {cred_path}")
        print("        Descarga las credenciales desde Firebase Console →")
        print("        Configuración del proyecto → Cuentas de servicio → Generar clave privada")
        sys.exit(1)

    # Inicializar Firebase solo una vez
    if not firebase_admin._apps:
        cred = credentials.Certificate(str(cred_path))
        firebase_admin.initialize_app(cred, {"storageBucket": FIREBASE_BUCKET})

    bucket = storage.bucket()
    storage_path = f"diasEspeciales/videos/{nombre}_final.mp4"
    blob = bucket.blob(storage_path)

    blob.upload_from_filename(str(video_path), content_type="video/mp4")
    blob.make_public()

    url = blob.public_url
    print(f"[OK] Subido: {url}")
    return url

# ── PASO 4: Actualizar Firestore ──
def actualizar_firestore(nombre: str, video_url: str):
    print(f"\n[4/4] Actualizando Firestore...")

    db = firestore.client()
    doc_ref = db.collection("diasEspeciales").document(nombre)
    doc = doc_ref.get()

    if not doc.exists:
        print(f"[WARN] Documento diasEspeciales/{nombre} no existe en Firestore.")
        print(f"       Crea el documento manualmente y vuelve a correr con --solo-subir")
        return

    doc_ref.update({"videoUrl": video_url})
    print(f"[OK] videoUrl actualizado en diasEspeciales/{nombre}")

# ── MAIN ──
def main():
    parser = argparse.ArgumentParser(description="Pipeline de animaciones — Portal de Recuerdos")
    parser.add_argument("--animacion", required=True, help="Nombre de la animación (ej: pluma)")
    parser.add_argument("--solo-render", action="store_true", help="Solo renderizar, sin subir")
    parser.add_argument("--solo-subir", action="store_true", help="Solo subir video ya renderizado")
    parser.add_argument("--calidad", default=None, help="Calidad: l | m | h | p (sobreescribe config)")
    args = parser.parse_args()

    nombre = args.animacion
    print(f"\n{'='*50}")
    print(f"  Pipeline: {nombre}")
    print(f"{'='*50}")

    if args.solo_subir:
        # Solo subir el video ya existente
        final_path = OUTPUT_DIR / f"{nombre}_final.mp4"
        if not final_path.exists():
            print(f"[ERROR] No existe {final_path}. Corre sin --solo-subir primero.")
            sys.exit(1)
        url = subir_a_storage(nombre, final_path)
        actualizar_firestore(nombre, url)
    else:
        # Pipeline completo
        raw = render_animacion(nombre)
        final = mezclar_audio(nombre, raw)

        if not args.solo_render:
            url = subir_a_storage(nombre, final)
            actualizar_firestore(nombre, url)
        else:
            print(f"\n[OK] Solo render — video en: {final}")

    print(f"\n{'='*50}")
    print(f"  ✓ Pipeline completado")
    print(f"{'='*50}\n")

if __name__ == "__main__":
    main()
