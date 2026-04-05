# 🎬 Studio — Portal de Recuerdos

Zona de producción de animaciones. Todo lo que está aquí **no se despliega** — es el taller donde se crean los videos que luego consume la app React.

---

## ⚙️ Setup inicial (una sola vez)

### 1. Requisitos
- Python 3.11 o 3.12
- FFmpeg instalado y en PATH
- Manim: `pip install -r requirements.txt`

### 2. Credenciales Firebase
- Ve a Firebase Console → Configuración del proyecto → Cuentas de servicio
- Click en "Generar nueva clave privada"
- Guarda el JSON como `studio/firebase-credentials.json`
- **Nunca subas ese archivo a GitHub** (ya está en .gitignore)

### 3. Variables de entorno
```bash
cp .env.example .env
# Edita .env con tu bucket de Firebase
```

---

## 🚀 Uso del pipeline

```bash
cd studio

# Pipeline completo: render + mezcla audio + subir a Firebase
python pipeline.py --animacion pluma

# Solo renderizar (sin subir)
python pipeline.py --animacion pluma --solo-render

# Solo subir (ya tienes el video renderizado)
python pipeline.py --animacion pluma --solo-subir

# Con calidad específica: l=low m=medium h=high p=production
python pipeline.py --animacion pluma --calidad h
```

---

## 📁 Estructura de una animación

Cada animación vive en `animaciones/{nombre}/`:

```
animaciones/pluma/
├── pluma.py            ← La animación en Manim (clase llamada "Animacion")
├── audio_config.json   ← Configuración de audio
└── assets/
    ├── voz.mp3         ← Audio de la voz grabada
    ├── musica.mp3      ← Música de fondo
    └── transcript.json ← Timestamps de Whisper (opcional)
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

La app React solo lee `videoUrl` y reproduce el video. Sin canvas, sin partículas en tiempo real.

---

## ➕ Crear una animación nueva

1. Crea la carpeta: `animaciones/{nombre}/`
2. Crea `{nombre}.py` con una clase llamada `Animacion` que extiende `Scene`
3. Crea `audio_config.json` con las rutas de los audios
4. Pon los audios en `assets/`
5. Corre: `python pipeline.py --animacion {nombre}`
