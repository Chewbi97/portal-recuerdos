# 🎬 Studio — Portal de Recuerdos

Zona de producción de animaciones. Todo lo que está aquí **no se despliega** — es el taller donde se crean los videos que luego consume la app React.

---

## ⚙️ Setup inicial (una sola vez)

### 1. Requisitos

- Python 3.12 → pipeline, Manim y Whisper
- Python 3.10 → generación de voz con XTTS v2
- FFmpeg instalado y en PATH

### 2. Entorno 1 — Pipeline y transcripción (Python 3.12)

```bash
cd studio
py -3.12 -m venv .venv
source .venv/Scripts/activate
pip install -r requirements.txt
```

### 3. Entorno 2 — Voz XTTS (Python 3.10)

```bash
cd studio/voz
py -3.10 -m venv .venv
source .venv/Scripts/activate
pip install TTS
pip install transformers==4.40.0
pip install torch==2.1.0 torchaudio==2.1.0 --index-url https://download.pytorch.org/whl/cu118
```

> Los dos entornos son independientes y no deben mezclarse. XTTS v2 no es compatible con PyTorch 2.6+.

### 4. Voz de referencia

Extrae un clip limpio de tu voz (25 segundos, sin música de fondo):

```bash
ffmpeg -i "ruta\a\tu\audio.m4a" -ss 00:00:02 -t 25 -vn -ar 22050 -ac 1 "studio\voz\referencias\sebastian_ref.wav"
```

### 5. Credenciales Firebase

- Ve a Firebase Console → Configuración del proyecto → Cuentas de servicio
- Click en "Generar nueva clave privada"
- Guarda el JSON como `studio/firebase-credentials.json`
- **Nunca subas ese archivo a GitHub** (ya está en .gitignore)

### 6. Variables de entorno

```bash
cp env.example .env
# Edita .env con tu bucket de Firebase
```

---

## 🗣️ Pipeline de voz

Genera el audio del poema con tu voz clonada antes de crear la animación.

```bash
# Activar entorno de voz (desde studio/voz/)
source .venv/Scripts/activate

# Generar voz desde texto directo
python procesar_poema.py --poema mi_poema --texto "Mis ojitos bellos..."

# Generar voz desde archivo .txt
python procesar_poema.py --poema mi_poema --archivo poemas/mi_poema.txt

# Solo generar sin ajustar tono (para escuchar cómo suena primero)
python procesar_poema.py --poema mi_poema --texto "..." --solo-generar

# Ajustar semitonos (default -2.5 = más grave)
python procesar_poema.py --poema mi_poema --texto "..." --semistonos -3.5
```

El comando genera en `output/`:

- `{nombre}_voz_final.wav` → voz con tono ajustado
- `{nombre}_transcript.json` → timestamps por palabra

---

## 🎙️ Transcripción con Whisper

Si ya tienes el audio grabado y solo necesitas los timestamps:

```bash
# Activar entorno de transcripción (desde studio/)
source .venv/Scripts/activate

# Transcribir audio y generar transcript.json
python whisper_transcribe.py "studio/animaciones/pluma/assets/Mi Corazon.mp4"
```

---

## 🚀 Pipeline de animación

```bash
# Activar entorno del pipeline (desde studio/)
source .venv/Scripts/activate

# Pipeline completo: render + mezcla audio + subir a Firebase
python pipeline.py --animacion pluma

# Solo renderizar sin subir
python pipeline.py --animacion pluma --solo-render

# Solo subir video ya renderizado
python pipeline.py --animacion pluma --solo-subir

# Con calidad específica: l=low m=medium h=high p=production
python pipeline.py --animacion pluma --calidad h
```

---

## 📁 Estructura de una animación

Cada animación vive en `animaciones/{nombre}/`:

```
animaciones/pluma/
├── pluma.py             ← La animación en Manim (clase llamada "Animacion")
├── audio_config.json    ← Configuración de mezcla de audio
└── assets/
    ├── voz.mp3          ← Audio de la voz (generado o grabado)
    ├── musica.mp3       ← Música de fondo
    └── transcript.json  ← Timestamps de Whisper
```

### audio_config.json

```json
{
  "voz": "voz.mp3",
  "musica": "musica.mp3",
  "voz_delay_segundos": 15,
  "musica_loop": true
}
```

---

## 📦 Qué queda en Firebase

```
Storage:
  diasEspeciales/videos/pluma_final.mp4   ← video final mezclado
  diasEspeciales/fuentes/pluma/           ← assets originales (backup)

Firestore:
  diasEspeciales/pluma/
    videoUrl: "https://..."               ← actualizado automáticamente
```

La app React solo lee `videoUrl` y reproduce el video. Sin canvas, sin partículas en tiempo real, sin lag en móvil.

---

## ➕ Crear una animación nueva

1. Crea la carpeta: `animaciones/{nombre}/`
2. Crea `{nombre}.py` con una clase llamada `Animacion` que extiende `Scene`
3. Crea `audio_config.json` con las rutas de los audios
4. Genera o copia los audios en `assets/`
5. Transcribe si es necesario: `python whisper_transcribe.py assets/voz.mp3`
6. Corre el pipeline: `python pipeline.py --animacion {nombre}`

---

## 🔇 Lo que NO va a GitHub

```
output/                      ← Videos y audios generados
**/media/                    ← Archivos temporales de Manim
**/__pycache__/              ← Caché de Python
**/.venv/                    ← Entornos virtuales
firebase-credentials.json    ← Credenciales (NUNCA subir)
.env                         ← Variables de entorno privadas
voz/referencias/             ← Clips de voz personal
```

Los scripts `.py` **sí se suben** — son el código fuente de las animaciones y el pipeline.
