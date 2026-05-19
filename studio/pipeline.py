"""
pipeline.py — Script maestro del studio

Uso:
    python pipeline.py --animacion pluma
    python pipeline.py --animacion destinocasualidad
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
import shutil
from pathlib import Path
import ffmpeg
import firebase_admin
from firebase_admin import credentials, storage, firestore

from config import (
    ANIMACIONES_DIR,
    OUTPUT_DIR,
    FIREBASE_CREDENTIALS,
    FIREBASE_BUCKET,
    MANIM_QUALITY,
    MANIM_FPS,
    AUDIO_VOZ_VOLUME,
    AUDIO_MUSICA_VOLUME,
    AUDIO_DUCKING_VOLUME,
)


# ── PASO 1: Render con Manim ──────────────────────────────────────────────────
def render_animacion(nombre: str, calidad: str = None) -> Path:
    anim_dir = ANIMACIONES_DIR / nombre
    script = anim_dir / f"{nombre}.py"

    if not script.exists():
        print(f"[ERROR] No existe {script}")
        sys.exit(1)

    calidad_flag = calidad[0] if calidad else MANIM_QUALITY[0]
    print(f"\n[1/4] Renderizando {nombre}.py con Manim (OpenGL)...")
    print(f"      Calidad: {calidad_flag} | Resolución: 1080×1920 | FPS: {MANIM_FPS}")

    result = subprocess.run(
        [
            sys.executable,
            "-m",
            "manim",
            str(script),
            "Animacion",
            f"--quality={calidad_flag}",
            f"--fps={MANIM_FPS}",
            "--resolution",
            "1080,1920",
            "--renderer=opengl",
            "--output_file",
            f"{nombre}_raw",
            "--media_dir",
            str(OUTPUT_DIR / "manim_media"),
        ],
        capture_output=False,
    )

    if result.returncode != 0:
        print("[ERROR] Manim falló. Revisa los errores arriba.")
        sys.exit(1)

    # OpenGL a veces ignora --media_dir y guarda en ./media/
    # Buscar en múltiples rutas posibles
    search_dirs = [
        OUTPUT_DIR / "manim_media",
        Path("media"),
        Path("."),
    ]

    raw_path = None
    for search_dir in search_dirs:
        candidates = (
            list(search_dir.rglob(f"{nombre}_raw.mp4")) if search_dir.exists() else []
        )
        if candidates:
            raw_path = candidates[0]
            break

    if not raw_path:
        print("[ERROR] No se encontró el video renderizado.")
        print("        Rutas buscadas:")
        for d in search_dirs:
            print(f"          {d.resolve()}")
        sys.exit(1)

    # Mover a output/ si no está ya ahí
    destino = OUTPUT_DIR / f"{nombre}_raw.mp4"
    if raw_path.resolve() != destino.resolve():
        shutil.copy(str(raw_path), str(destino))
        print(f"[OK] Video raw copiado a: {destino}")
    else:
        print(f"[OK] Video raw: {raw_path}")

    return destino


# ── PASO 2: Mezcla de audio con FFmpeg ───────────────────────────────────────
def mezclar_audio(nombre: str, raw_video: Path) -> Path:
    anim_dir = ANIMACIONES_DIR / nombre / "assets"
    config_file = ANIMACIONES_DIR / nombre / "audio_config.json"
    final_path = OUTPUT_DIR / f"{nombre}_final.mp4"

    # Sin audio_config → copiar video tal cual
    if not config_file.exists():
        print(f"[2/4] Sin audio_config.json — copiando video sin audio...")
        shutil.copy(raw_video, final_path)
        return final_path

    with open(config_file) as f:
        audio_cfg = json.load(f)

    voz_nombre = audio_cfg.get("voz")
    musica_nombre = audio_cfg.get("musica")

    voz_file = (anim_dir / voz_nombre) if voz_nombre else None
    musica_file = (anim_dir / musica_nombre) if musica_nombre else None

    tiene_voz = voz_file is not None and voz_file.exists()
    tiene_musica = musica_file is not None and musica_file.exists()

    voz_delay = audio_cfg.get("voz_delay_segundos", 0)
    musica_loop = audio_cfg.get("musica_loop", True)

    print(f"\n[2/4] Mezclando audio...")
    if tiene_voz:
        print(f"      Voz:    {voz_file.name}  (delay: {voz_delay}s)")
    if tiene_musica:
        print(f"      Música: {musica_file.name}")
    if not tiene_voz and not tiene_musica:
        print("      Sin audios configurados — copiando video sin audio...")
        shutil.copy(raw_video, final_path)
        return final_path

    # ── Solo música, sin voz ──────────────────────────────────────────────────
    if tiene_musica and not tiene_voz:
        cmd = ["ffmpeg", "-y", "-i", str(raw_video)]
        if musica_loop:
            cmd += ["-stream_loop", "-1"]
        cmd += [
            "-i",
            str(musica_file),
            "-filter_complex",
            f"[1:a]volume={AUDIO_MUSICA_VOLUME}[audio_final]",
            "-map",
            "0:v",
            "-map",
            "[audio_final]",
            "-vcodec",
            "copy",
            "-acodec",
            "aac",
            "-b:a",
            "192k",
            "-shortest",
            str(final_path),
        ]
        result = subprocess.run(cmd, capture_output=False)
        if result.returncode != 0:
            print("[ERROR] FFmpeg falló. Copiando video sin audio.")
            shutil.copy(raw_video, final_path)
        else:
            print(f"[OK] Video final: {final_path}")
        return final_path

    # ── Solo voz, sin música ──────────────────────────────────────────────────
    if tiene_voz and not tiene_musica:
        delay_ms = int(voz_delay * 1000)
        cmd = [
            "ffmpeg",
            "-y",
            "-i",
            str(raw_video),
            "-i",
            str(voz_file),
            "-filter_complex",
            f"[1:a]adelay={delay_ms}|{delay_ms},volume={AUDIO_VOZ_VOLUME}[audio_final]",
            "-map",
            "0:v",
            "-map",
            "[audio_final]",
            "-vcodec",
            "copy",
            "-acodec",
            "aac",
            "-b:a",
            "192k",
            "-shortest",
            str(final_path),
        ]
        result = subprocess.run(cmd, capture_output=False)
        if result.returncode != 0:
            print("[ERROR] FFmpeg falló. Copiando video sin audio.")
            shutil.copy(raw_video, final_path)
        else:
            print(f"[OK] Video final: {final_path}")
        return final_path

    # ── Voz + Música con ducking ──────────────────────────────────────────────
    delay_ms = int(voz_delay * 1000)
    filter_complex = (
        f"[1:a]adelay={delay_ms}|{delay_ms},volume={AUDIO_VOZ_VOLUME}[voz_proc];"
        f"[2:a]volume={AUDIO_MUSICA_VOLUME * 2.5}[musica_base];"
        f"[musica_base][voz_proc]sidechaincompress="
        f"threshold=0.015:ratio=4:attack=400:release=1200:makeup=1.0[musica_ducked];"
        f"[voz_proc][musica_ducked]amix=inputs=2:duration=longest:dropout_transition=3[audio_final]"
    )

    cmd = ["ffmpeg", "-y", "-i", str(raw_video), "-i", str(voz_file)]
    if musica_loop:
        cmd += ["-stream_loop", "-1"]
    cmd += [
        "-i",
        str(musica_file),
        "-filter_complex",
        filter_complex,
        "-map",
        "0:v",
        "-map",
        "[audio_final]",
        "-vcodec",
        "copy",
        "-acodec",
        "aac",
        "-b:a",
        "192k",
        "-shortest",
        str(final_path),
    ]

    print("[INFO] Mezclando voz + música con ducking automático...")
    result = subprocess.run(cmd, capture_output=False)

    if result.returncode != 0:
        print("[WARN] Ducking falló, intentando mezcla simple...")
        filter_simple = (
            f"[1:a]adelay={delay_ms}|{delay_ms},volume={AUDIO_VOZ_VOLUME}[v];"
            f"[2:a]volume={AUDIO_MUSICA_VOLUME}[m];"
            f"[v][m]amix=inputs=2:duration=longest:dropout_transition=2[audio_final]"
        )
        cmd_fallback = [
            "ffmpeg",
            "-y",
            "-i",
            str(raw_video),
            "-i",
            str(voz_file),
            "-i",
            str(musica_file),
            "-filter_complex",
            filter_simple,
            "-map",
            "0:v",
            "-map",
            "[audio_final]",
            "-vcodec",
            "copy",
            "-acodec",
            "aac",
            "-shortest",
            str(final_path),
        ]
        result2 = subprocess.run(cmd_fallback, capture_output=False)
        if result2.returncode != 0:
            print("[ERROR] Mezcla simple también falló. Copiando sin audio.")
            shutil.copy(raw_video, final_path)
        else:
            print(f"[OK] Video final (mezcla simple): {final_path}")
    else:
        print(f"[OK] Video final con ducking: {final_path}")

    return final_path


# ── PASO 3: Subir a Firebase Storage ─────────────────────────────────────────
def subir_a_storage(nombre: str, video_path: Path) -> str:
    print(f"\n[3/4] Subiendo a Firebase Storage...")

    cred_path = Path(FIREBASE_CREDENTIALS)
    if not cred_path.exists():
        print(f"[ERROR] No existe {cred_path}")
        print(
            "        Firebase Console → Configuración → Cuentas de servicio → Generar clave"
        )
        sys.exit(1)

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


# ── PASO 4: Actualizar Firestore ──────────────────────────────────────────────
def actualizar_firestore(nombre: str, video_url: str):
    print(f"\n[4/4] Actualizando Firestore...")

    db = firestore.client()
    doc_ref = db.collection("diasEspeciales").document(nombre)
    doc = doc_ref.get()

    if not doc.exists:
        print(f"[WARN] Documento diasEspeciales/{nombre} no existe en Firestore.")
        print(f"       Créalo manualmente y corre de nuevo con --solo-subir")
        return

    doc_ref.update({"videoUrl": video_url})
    print(f"[OK] videoUrl actualizado en diasEspeciales/{nombre}")


# ── MAIN ──────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="Pipeline de animaciones — Portal de Recuerdos"
    )
    parser.add_argument(
        "--animacion",
        required=True,
        help="Nombre de la animación (ej: destinocasualidad)",
    )
    parser.add_argument(
        "--solo-render",
        action="store_true",
        help="Solo renderizar, sin mezclar ni subir",
    )
    parser.add_argument(
        "--solo-subir",
        action="store_true",
        help="Solo subir el video final ya existente",
    )
    parser.add_argument(
        "--calidad",
        default=None,
        help="Calidad Manim: l | m | h | p  (sobreescribe config)",
    )
    args = parser.parse_args()

    nombre = args.animacion
    print(f"\n{'='*52}")
    print(f"  Pipeline: {nombre}")
    print(f"  Renderer: OpenGL  |  Resolución: 1080×1920")
    print(f"{'='*52}")

    if args.solo_subir:
        final_path = OUTPUT_DIR / f"{nombre}_final.mp4"
        if not final_path.exists():
            print(f"[ERROR] No existe {final_path}.")
            print(f"        Corre sin --solo-subir primero.")
            sys.exit(1)
        url = subir_a_storage(nombre, final_path)
        actualizar_firestore(nombre, url)

    else:
        raw = render_animacion(nombre, calidad=args.calidad)
        final = mezclar_audio(nombre, raw)

        if not args.solo_render:
            url = subir_a_storage(nombre, final)
            actualizar_firestore(nombre, url)
        else:
            print(f"\n[OK] Solo render — video en: {final}")

    print(f"\n{'='*52}")
    print(f"  ✓ Pipeline completado")
    print(f"{'='*52}\n")


if __name__ == "__main__":
    main()
