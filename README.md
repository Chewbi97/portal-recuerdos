# 🌹 Antología de tus Ojos — Portal MyS

> _Un espacio privado y personal para guardar poemas, recuerdos y cartas animadas para la persona que más quiero._

---

## 📖 ¿Qué es este proyecto?

**Antología de tus Ojos** es un portal web privado construido con React y Firebase, pensado como un espacio íntimo y personal. Cuenta con un login protegido por contraseña única (hardcodeada), y desde dentro se puede:

- 📸 Ver y cambiar una foto principal con una frase especial en el **Dashboard**.
- 🖊️ Subir y leer **Poemas** (sección _Musas_), con título, autor y contenido.
- 🗂️ Guardar **Recuerdos** (sección _Memorias_), con título, descripción y multimedia.
- 💌 Ver y crear **Tarjetas animadas** (botón flotante) para fechas especiales o días normales, con controles de reproducción (play, pausa, adelantar, retroceder) y función de descarga. Las tarjetas de fechas especiales se abren automáticamente ese día.
- 🖼️ Gestionar una **Galería de fotos** (sección _Nosotros_), organizada en álbumes, con soporte para subida múltiple, mover y eliminar fotos en lote, y creación de collages descargables en varios estilos.

---

## 🛠️ Tecnologías utilizadas

### Frontend & Hosting

<table>
  <thead>
    <tr>
      <th align="left">Tecnología</th>
      <th align="center">Logo</th>
      <th align="left">¿Para qué se usa?</th>
      <th align="left">Enlace</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><b>React</b></td>
      <td align="center"><img src="https://1000logos.net/react-logo/" width="25" title="React"></td>
      <td>Librería principal para la interfaz de usuario</td>
      <td><a href="https://reactjs.org/">reactjs.org</a></td>
    </tr>
    <tr>
      <td><b>Localhost / Dev</b></td>
      <td align="center"><img src="https://shields.io" alt="LocalDev"></td>
      <td>Entorno de ejecución local para pruebas y previsualización</td>
      <td><a href="http://localhost:3000">localhost:3000</a></td>
    </tr>
    <tr>
      <td><b>JavaScript</b></td>
      <td align="center"><img src="https://githubusercontent.com" width="25" title="JavaScript"></td>
      <td>Lenguaje principal del frontend y lógica de animaciones</td>
      <td>Nativo</td>
    </tr>
    <tr>
      <td><b>CSS</b></td>
      <td align="center"><img src="https://githubusercontent.com" width="25" title="CSS3"></td>
      <td>Estilos, diseño responsivo y animaciones visuales</td>
      <td>Nativo</td>
    </tr>
    <tr>
      <td><b>Firebase Firestore</b></td>
      <td align="center"><img src="https://vectorlogo.zone" width="25" title="Firestore"></td>
      <td>Base de datos en tiempo real para fotos, galerías y collages</td>
      <td><a href="https://firebase.google.com/">firebase.google.com</a></td>
    </tr>
    <tr>
      <td><b>Firebase Storage</b></td>
      <td align="center"><img src="https://vectorlogo.zone" width="25" title="Firebase Storage"></td>
      <td>Almacenamiento de imágenes y archivos multimedia</td>
      <td><a href="https://firebase.google.com/">firebase.google.com</a></td>
    </tr>
    <tr>
      <td><b>Firebase Hosting</b></td>
      <td align="center"><img src="https://vectorlogo.zone" width="25" title="Firebase Hosting"></td>
      <td>Despliegue y hosting del portal</td>
      <td><a href="https://firebase.google.com/">firebase.google.com</a></td>
    </tr>
    <tr>
      <td><b>React Router DOM</b></td>
      <td align="center"><img src="https://githubusercontent.com" width="25" title="React Router"></td>
      <td>Navegación entre páginas y rutas del portal</td>
      <td><a href="https://reactrouter.com/">reactrouter.com</a></td>
    </tr>
    <tr>
      <td><b>Phosphor Icons</b></td>
      <td align="center"><img src="https://phosphoricons.com" width="25" title="Phosphor Icons"></td>
      <td>Biblioteca de íconos para la UI</td>
      <td><a href="https://phosphoricons.com/">phosphoricons.com</a></td>
    </tr>
    <tr>
      <td><b>SweetAlert2</b></td>
      <td align="center"><img src="https://github.io" width="25" title="SweetAlert2"></td>
      <td>Alertas y modales estilizados</td>
      <td><a href="https://sweetalert2.github.io/">sweetalert2.github.io</a></td>
    </tr>
    <tr>
      <td><b>html2canvas</b></td>
      <td align="center"><img src="https://hertzen.com" width="25" title="html2canvas"></td>
      <td>Captura y descarga de tarjetas animadas como imagen</td>
      <td><a href="https://html2canvas.hertzen.com/">html2canvas</a></td>
    </tr>
    <tr>
      <td><b>Canvas API</b></td>
      <td align="center"><img src="https://githubusercontent.com" width="25" title="Canvas/HTML5"></td>
      <td>Generación de collages y animaciones en el navegador</td>
      <td>Nativa</td>
    </tr>
    <tr>
      <td><b>Google Cloud SDK</b></td>
      <td align="center"><img src="https://vectorlogo.zone" width="25" title="Google Cloud"></td>
      <td>Configuración de CORS en Firebase Storage</td>
      <td><a href="https://cloud.google.com/sdk">cloud.google.com</a></td>
    </tr>
    <tr>
      <td><b>Node.js</b></td>
      <td align="center"><img src="https://githubusercontent.com" width="25" title="Node.js"></td>
      <td>Entorno de ejecución para herramientas de desarrollo</td>
      <td><a href="https://nodejs.org/">nodejs.org</a></td>
    </tr>
  </tbody>
</table>

---

## 📦 Dependencias y cómo instalarlas

### App React

Clona el repositorio e instala las dependencias con:

```bash
git clone https://github.com/Chewbi97/portal-recuerdos.git
cd portal-recuerdos
npm install
```

Dependencias principales:

```bash
npm install @phosphor-icons/react      # Íconos
npm install firebase                   # Firebase
npm install react-router-dom           # Enrutamiento
npm install sweetalert2                # Alertas y modales
npm install html2canvas                # Descarga de tarjetas
```

### Studio — Pipeline Python

El studio requiere **dos entornos virtuales separados** por compatibilidad de librerías:

#### Entorno 1 — Transcripción y pipeline (Python 3.12)

```bash
cd studio
py -3.12 -m venv .venv
source .venv/Scripts/activate
pip install -r requirements.txt
```

#### Entorno 2 — Generación de voz XTTS (Python 3.10)

```bash
cd studio/voz
py -3.10 -m venv .venv
source .venv/Scripts/activate
pip install TTS
pip install transformers==4.40.0
pip install torch==2.1.0 torchaudio==2.1.0 --index-url https://download.pytorch.org/whl/cu118
```

> **Nota:** XTTS v2 requiere Python 3.10 y PyTorch 2.1. Versiones más nuevas de PyTorch son incompatibles con el modelo. Los dos venvs son completamente independientes y **no deben mezclarse**.

### ⚙️ Configuración de CORS en Firebase Storage

```bash
gsutil cors set cors.json gs://tu-bucket.firebasestorage.app
```

El archivo `cors.json`:

```json
[
  {
    "origin": ["http://localhost:3000", "https://portal-de-recuerdos.web.app/"],
    "method": ["GET"],
    "maxAgeSeconds": 3600
  }
]
```

### ▶️ Ejecutar en desarrollo

```bash
npm start
```

### 🏗️ Generar build de producción

```bash
npm run build
```

### 🚀 Desplegar en Firebase Hosting

```bash
firebase deploy
```

---

## 🗂️ Estructura del proyecto

```
portal-recuerdos/
│
├── src/                              ← App React (frontend)
│   ├── firebase.js
│   ├── App.js / App.css
│   └── Components/
│       ├── Dashboard/
│       ├── Login/
│       ├── PortalPoemas/
│       ├── LineadeTiempo/
│       ├── Galeria/
│       ├── GaleriaDias/
│       └── DiaEspecial/
│           ├── ControlesAnimacion.js
│           ├── DiaMujer.js
│           ├── EcuacionAmor.js
│           ├── GalaxiasFusion.js
│           ├── Plumas.js
│           └── SuperficieCorazon.js
│
└── studio/                           ← Pipeline de producción (no se despliega)
    ├── config.py                     ← Configuración central
    ├── pipeline.py                   ← Script maestro: render + mezcla + subida
    ├── requirements.txt              ← Dependencias Python 3.12
    ├── env.example                   ← Plantilla de variables de entorno
    ├── README.md                     ← Documentación interna del studio
    ├── whisper_transcribe.py         ← Transcripción con timestamps (GPU)
    │
    ├── animaciones/
    │   ├── audio_config.json         ← Config de mezcla de audio
    │   ├── pluma.py                  ← Animación Manim — tarjeta pluma
    │   └── assets/                   ← Audios fuente de cada animación
    │
    └── voz/                          ← Módulo de generación de voz
        ├── referencias/              ← Clip de voz de referencia (gitignored)
        ├── ajustar_tono.py           ← Ajusta pitch y ecualización con FFmpeg
        ├── generarvoz.py             ← Clona la voz con XTTS v2
        └── procesar_poema.py         ← Pipeline completo de voz de un solo comando
```

---

## 🎬 Studio — Pipeline de animaciones

El studio es la zona de producción local donde se crean las animaciones que consume la app. La app React solo reproduce el video final — sin canvas en tiempo real, sin lag en móvil.

### Flujo de producción para una tarjeta nueva

```
1. Escribir el poema en texto
       ↓
2. Generar voz con tu voz clonada (XTTS v2)
       ↓
3. Transcribir con Whisper → timestamps por palabra
       ↓
4. Crear animación en Manim (pluma.py, corazon.py, etc.)
       ↓
5. Pipeline: render + mezcla audio + subir a Firebase
       ↓
6. App React reproduce el videoUrl desde Firestore
```

### Comandos principales

```bash
# ── Activar entorno transcriptor (Python 3.12) ──
# Desde la carpeta studio/
source .venv/Scripts/activate

# ── Activar entorno de voz (Python 3.10) ──
# Desde la carpeta studio/voz/
source .venv/Scripts/activate

# ── Transcribir audio con timestamps (entorno 3.12 activo) ──
python studio/whisper_transcribe.py "studio/animaciones/pluma/assets/Mi Corazon.mp4"

# ── Generar voz clonada (entorno 3.10 activo, desde studio/voz/) ──
python procesar_poema.py --poema prueba --texto "Mis ojitos bellos, cada latido de tu corazón posee una pureza sin igual." --solo-generar

# ── Solo ajustar tono de un audio ya grabado ──
python ajustar_tono.py --entrada audio.wav --salida audio_final.wav --semistonos -2.5

# ── Pipeline completo: render + mezcla + subir a Firebase (entorno 3.12 activo) ──
python pipeline.py --animacion pluma

# ── Solo renderizar sin subir ──
python pipeline.py --animacion pluma --solo-render

# ── Solo subir video ya renderizado ──
python pipeline.py --animacion pluma --solo-subir
```

### Credenciales Firebase para el studio

1. Ve a Firebase Console → Configuración del proyecto → Cuentas de servicio
2. Click en "Generar nueva clave privada"
3. Guarda el JSON como `studio/firebase-credentials.json`
4. Copia `env.example` como `.env` y completa el bucket

> **Nunca subas** `firebase-credentials.json` ni `.env` a GitHub — ya están en `.gitignore`.

---

## 🔇 ¿Qué va en .gitignore?

Los scripts `.py` **sí se suben** — son el código fuente de las animaciones y el pipeline. Lo que se excluye:

```
studio/output/                  ← Videos y audios generados localmente
studio/**/media/                ← Archivos temporales de Manim
studio/**/__pycache__/          ← Caché de Python
studio/**/.venv/                ← Entornos virtuales
studio/firebase-credentials.json  ← Credenciales (NUNCA subir)
studio/.env                     ← Variables de entorno privadas
studio/voz/referencias/         ← Clips de voz personal (privacidad)
```

---

## ⏳ Línea de tiempo del proyecto

```
c00827b  🌱  Primer Commit — Upload inicial del portal al repositorio
0b2ee81  📝  Actualizando el README con mi propio contenido
a0be5d5  💌  Portal actualizado con última tarjeta animada
644c59f  📥  Función para descargar tarjetas agregada + reorganización Storage Firebase
6e151ed  📝  Actualización del archivo README
236232c  🔐  Corrección de fuga de seguridad respecto a la contraseña pública del portal
181d658  🖼️  Se agrega el componente Galería con su CSS, enrutado y añadido al Nav
63a354a  🐛  Fix del bug que no imprimía fotos en el collage + ajuste estilos Galería
4fd07e5  ✨  Se ajustan los últimos detalles de CSS y estilos del componente Galería
2c620cb  ✒️  Se actualiza la función de borrar collages + diseño responsivo para móvil
359b3e9  👌  Actualización del README.md y despliegue en producción de última versión
0d43e96  👓  Se agrega la función zoom a la galería
064d5c3  ✒️  Se incluye nueva tarjeta, boceto inicial
cc1012d  ✒️  Se termina y se envía a producción la tarjeta Plumas en completo funcionamiento
d31419e  📝  Actualización de Commits
[próximo] 🎬  Studio agregado — pipeline Manim + Whisper (self-hosted) + XTTS v2

        ↑
        HEAD — main / origin/main (estado actual)
```

---

## 🔐 Acceso

El portal utiliza una contraseña privada hardcodeada conocida únicamente por sus dos usuarios. No se utiliza un sistema de autenticación externo; el acceso está restringido por diseño a una sola pareja.

---

## ☁️ Hosting

El portal está desplegado a través de **Firebase Hosting** (https://portal-de-recuerdos.web.app/). Toda la multimedia se almacena en **Firebase Storage**, organizada en las carpetas `galeria/`, `collages/`, `recuerdos/` y `diasEspeciales/`.

---

## 💛 Autor

Hecho con amor para **Mis Ojitos**, que inspira cada línea de código y cada poema de este portal.
