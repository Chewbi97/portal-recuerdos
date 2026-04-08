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


# ── PASO 1: Render con Manim ──
def render_animacion(nombre: str) -> Path:
    anim_dir = ANIMACIONES_DIR / nombre
    script = anim_dir / f"{nombre}.py"

    if not script.exists():
        print(f"[ERROR] No existe {script}")
        sys.exit(1)

    print(f"\n[1/4] Renderizando {nombre}.py con Manim...")

    result = subprocess.run(
        [
            sys.executable,
            "-m",
            "manim",
            str(script),
            "Animacion",  # nombre de la clase dentro del .py
            f"--quality={MANIM_QUALITY[0]}",  # l | m | h | p
            f"--fps={MANIM_FPS}",
            "--resolution", "1080,1920",
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

    # Sin audio_config → copiar video tal cual
    if not config_file.exists():
        print(f"[2/4] Sin audio_config.json — copiando video sin audio extra...")
        import shutil

        shutil.copy(raw_video, final_path)
        return final_path

    with open(config_file) as f:
        audio_cfg = json.load(f)

    voz_file = anim_dir / audio_cfg.get("voz", "")
    musica_file = (
        anim_dir / audio_cfg.get("musica", "") if audio_cfg.get("musica") else None
    )
    voz_delay = audio_cfg.get("voz_delay_segundos", 0)
    musica_loop = audio_cfg.get("musica_loop", True)

    tiene_voz = voz_file.exists()
    tiene_musica = musica_file is not None and musica_file.exists()

    print(f"\n[2/4] Mezclando audio...")
    if tiene_voz:
        print(f"      Voz:    {voz_file.name}  (delay: {voz_delay}s)")
    if tiene_musica:
        print(f"      Música: {musica_file.name}")

    # ── Caso 1: Solo voz, sin música ──────────────────────────────────────────
    if tiene_voz and not tiene_musica:
        delay_ms = int(voz_delay * 1000)
        filter_complex = (
            f"[1:a]"
            f"adelay={delay_ms}|{delay_ms},"
            f"volume={AUDIO_VOZ_VOLUME}"
            f"[audio_final]"
        )
        cmd = [
            "ffmpeg",
            "-y",
            "-i",
            str(raw_video),
            "-i",
            str(voz_file),
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
            "-shortest",
            str(final_path),
        ]
        print("[INFO] Solo voz, sin música...")
        result = subprocess.run(cmd, capture_output=False)
        if result.returncode != 0:
            print("[ERROR] FFmpeg falló al mezclar solo voz.")
            import shutil

            shutil.copy(raw_video, final_path)
        else:
            print(f"[OK] Video final: {final_path}")
        return final_path

    # ── Caso 2: Solo música, sin voz ─────────────────────────────────────────
    if tiene_musica and not tiene_voz:
        loop_flag = "-stream_loop -1" if musica_loop else ""
        cmd = [
            "ffmpeg",
            "-y",
            "-i",
            str(raw_video),
        ]
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
            "-shortest",
            str(final_path),
        ]
        result = subprocess.run(cmd, capture_output=False)
        if result.returncode != 0:
            import shutil

            shutil.copy(raw_video, final_path)
        else:
            print(f"[OK] Video final: {final_path}")
        return final_path

    # ── Caso 3: Voz + Música con ducking real ─────────────────────────────────
    #
    # Estrategia de ducking con FFmpeg sidechaincompress:
    #   - La voz actúa como sidechain para comprimir la música
    #   - Cuando la voz suena → música baja automáticamente
    #   - Cuando la voz para → música sube gradualmente
    #
    # Filtros:
    #   [1:a] = voz (con delay)
    #   [2:a] = música (con loop si aplica)
    #
    # Cadena:
    #   voz → adelay → volume=1.0 → [voz_final]
    #   musica → volume=0.30 → sidechaincompress → [musica_ducked]
    #   [voz_final] + [musica_ducked] → amix → [output]

    delay_ms = int(voz_delay * 1000)

    # Vol base de música: 30% intro/outro, ducking a ~8% durante la voz
    # ratio=8 significa que cuando la voz entra, la música se comprime 8:1
    # threshold=-20dB, attack=300ms, release=1000ms para transiciones suaves
    filter_complex = (
        # Voz: aplicar delay y volumen
        f"[1:a]adelay={delay_ms}|{delay_ms},volume={AUDIO_VOZ_VOLUME}[voz_proc];"
        # Música: volumen base
        f"[2:a]volume={AUDIO_MUSICA_VOLUME * 2.5}[musica_base];"
        # Ducking: la voz comprime la música
        # sidechaincompress: cuando detecta señal de la voz, baja la música
        f"[musica_base][voz_proc]sidechaincompress="
        f"threshold=0.015:"  # umbral muy bajo para detectar la voz rápido
        f"ratio=4:"  # comprimir 4:1 (la música queda a ~25% de su nivel)
        f"attack=400:"  # 400ms para bajar suavemente
        f"release=1200:"  # 1200ms para subir suavemente al terminar la voz
        f"makeup=1.0"
        f"[musica_ducked];"
        # Mezcla final
        f"[voz_proc][musica_ducked]amix=inputs=2:duration=longest:dropout_transition=3[audio_final]"
    )

    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(raw_video),
        "-i",
        str(voz_file),
    ]

    if musica_loop:
        cmd += ["-stream_loop", "-1", "-i", str(musica_file)]
    else:
        cmd += ["-i", str(musica_file)]

    cmd += [
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

    print("[INFO] Mezclando con ducking automático...")
    print(f"       Volumen base música:   {AUDIO_MUSICA_VOLUME * 2.5 * 100:.0f}%")
    print(
        f"       Volumen durante voz:   ~{AUDIO_MUSICA_VOLUME * 2.5 / 4 * 100:.0f}%  (ducking 4:1)"
    )
    print(f"       Attack/Release:        400ms / 1200ms")

    result = subprocess.run(cmd, capture_output=False)

    if result.returncode != 0:
        print("[WARN] Ducking falló, intentando mezcla simple...")
        # Fallback: mezcla directa sin ducking
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
            print(
                "[ERROR] Mezcla simple también falló. Copiando video sin audio extra."
            )
            import shutil

            shutil.copy(raw_video, final_path)
        else:
            print(f"[OK] Video final (mezcla simple): {final_path}")
    else:
        print(f"[OK] Video final con ducking: {final_path}")

    return final_path


# ── PASO 3: Subir a Firebase Storage ──
def subir_a_storage(nombre: str, video_path: Path) -> str:
    print(f"\n[3/4] Subiendo a Firebase Storage...")

    cred_path = Path(FIREBASE_CREDENTIALS)
    if not cred_path.exists():
        print(f"[ERROR] No existe {cred_path}")
        print("        Descarga las credenciales desde Firebase Console →")
        print(
            "        Configuración del proyecto → Cuentas de servicio → Generar clave privada"
        )
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
        print(
            f"       Crea el documento manualmente y vuelve a correr con --solo-subir"
        )
        return

    doc_ref.update({"videoUrl": video_url})
    print(f"[OK] videoUrl actualizado en diasEspeciales/{nombre}")


# ── MAIN ──
def main():
    parser = argparse.ArgumentParser(
        description="Pipeline de animaciones — Portal de Recuerdos"
    )
    parser.add_argument(
        "--animacion", required=True, help="Nombre de la animación (ej: pluma)"
    )
    parser.add_argument(
        "--solo-render", action="store_true", help="Solo renderizar, sin subir"
    )
    parser.add_argument(
        "--solo-subir", action="store_true", help="Solo subir video ya renderizado"
    )
    parser.add_argument(
        "--calidad", default=None, help="Calidad: l | m | h | p (sobreescribe config)"
    )
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
