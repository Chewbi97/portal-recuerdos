# 🌹 Antología de tus Ojos — Portal MyS

> *Un espacio privado y personal para guardar poemas, recuerdos y cartas animadas para la persona que más quiero.*

---

## 📖 ¿Qué es este proyecto?

**Antología de tus Ojos** es un portal web privado construido con React y Firebase, pensado como un espacio íntimo y personal. Cuenta con un login protegido por contraseña única (hardcodeada), y desde dentro se puede:

- 📸 Ver y cambiar una foto principal con una frase especial en el **Dashboard**.
- 🖊️ Subir y leer **Poemas** (sección *Musas*), con título, autor y contenido.
- 🗂️ Guardar **Recuerdos** (sección *Memorias*), con título, descripción y multimedia.
- 💌 Ver y crear **Tarjetas animadas** (botón flotante) para fechas especiales o días normales, con controles de reproducción (play, pausa, adelantar, retroceder) y función de descarga. Las tarjetas de fechas especiales se abren automáticamente ese día.
- 🖼️ Gestionar una **Galería de fotos** (sección *Nosotros*), organizada en álbumes, con soporte para subida múltiple, mover y eliminar fotos en lote, y creación de collages descargables en varios estilos.

---

## 🛠️ Tecnologías utilizadas

| Tecnología | Logo | ¿Para qué se usa? | Enlace |
|---|---|---|---|
| React | ⚛️ | Librería principal para la interfaz de usuario | [reactjs.org](https://reactjs.org/) |
| Firebase Firestore | 🔥 | Base de datos en tiempo real para fotos, galerías y collages | [firebase.google.com](https://firebase.google.com/) |
| Firebase Storage | ☁️ | Almacenamiento de imágenes y archivos multimedia | [firebase.google.com](https://firebase.google.com/) |
| Firebase Hosting | 🚀 | Despliegue y hosting del portal | [firebase.google.com](https://firebase.google.com/) |
| React Router DOM | 🔀 | Navegación entre páginas y rutas del portal | [reactrouter.com](https://reactrouter.com/) |
| Phosphor Icons | 🎨 | Biblioteca de íconos para la UI | [phosphoricons.com](https://phosphoricons.com/) |
| SweetAlert2 | 🍬 | Alertas y modales estilizados | [sweetalert2.github.io](https://sweetalert2.github.io/) |
| html2canvas | 📷 | Captura y descarga de tarjetas animadas como imagen | [html2canvas.hertzen.com](https://html2canvas.hertzen.com/) |
| Canvas API | 🖌️ | Generación de collages en el navegador (cuadrícula, polaroids, revista, corazón) | Nativa del navegador |
| Google Cloud SDK (gsutil) | 🌐 | Configuración de CORS en Firebase Storage para carga de imágenes en canvas | [cloud.google.com/sdk](https://cloud.google.com/sdk/) |
| Node.js | 🟩 | Entorno de ejecución para herramientas de desarrollo | [nodejs.org](https://nodejs.org/) |

---

## 📦 Dependencias y cómo instalarlas

Clona el repositorio e instala las dependencias con:

```bash
git clone https://github.com/tu-usuario/portal-recuerdos.git
cd portal-recuerdos
npm install
```

Esto instalará automáticamente todas las dependencias listadas en `package.json`:

```bash
npm install @phosphor-icons/react      # Íconos
npm install firebase                   # Firebase (auth, storage, firestore, hosting)
npm install react-router-dom           # Enrutamiento
npm install sweetalert2                # Alertas y modales
npm install html2canvas                # Descarga de tarjetas como imagen
```

### ⚙️ Configuración de CORS en Firebase Storage

Para que el generador de collages pueda cargar imágenes desde Firebase Storage en el canvas del navegador, es necesario configurar CORS. Con Google Cloud SDK instalado, ejecuta desde la raíz del proyecto:

```bash
gsutil cors set cors.json gs://tu-bucket.firebasestorage.app
```

El archivo `cors.json` debe contener:

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
└── src/
    ├── App.css
    ├── App.js
    ├── App.test.js
    ├── cors.json
    ├── firebase.js
    ├── index.css
    ├── index.js
    ├── logo.svg
    ├── reportWebVitals.js
    ├── setupTests.js
    ├── sweetalertConfig.js
    │
    ├── Assets/
    │   ├── fondo-dashboard.png
    │   ├── imagen-fondo.jpg
    │   └── imagen-fondo.png
    │
    └── Components/
        ├── HomeContent.css
        ├── HomeContent.js
        │
        ├── Dashboard/
        │   ├── Dashboard.css
        │   └── Dashboard.js
        │
        ├── Login/
        │   ├── Login.css
        │   └── Login.js
        │
        ├── PortalPoemas/
        │   ├── PoemsPortal.css
        │   └── PoemsPortal.js
        │
        ├── LineadeTiempo/
        │   ├── TimeLine.css
        │   └── TimeLine.js
        │
        ├── Galeria/
        │   ├── Galeria.css
        │   └── Galeria.js
        │
        ├── GaleriaDias/
        │   ├── GaleriaDias.css
        │   └── GaleriaDias.js
        │
        └── DiaEspecial/
            ├── ControlesAnimacion.css
            ├── ControlesAnimacion.js
            ├── DiaMujer.css
            ├── DiaMujer.js
            ├── EcuacionAmor.css
            ├── EcuacionAmor.js
            ├── GalaxiasFusion.css
            ├── GalaxiasFusion.js
            ├── SuperficieCorazon.css
            └── Superficiecorazon.js
```

---

## ⏳ Línea de tiempo del proyecto

El proyecto fue desarrollado durante varios meses en local antes de subirse a GitHub. A continuación el historial de commits registrados:

```
c00827b  🌱  Primer Commit — Upload inicial del portal al repositorio
0b2ee81  📝  Actualización del README con contenido propio del proyecto
a0be5d5  💌  Portal actualizado con la última tarjeta animada
644c59f  📥  Función de descarga de tarjetas agregada + reorganización y actualización del Storage de Firebase
6e151ed  📝  Actualización del archivo README
236232c  🔐  Corrección de fuga de seguridad respecto a la contraseña pública del portal
181d658  🖼️  Componente Galería agregado con su CSS, enrutado y añadido al Nav
63a354a  🐛  Fix del bug que impedía imprimir fotos en el collage + ajuste de estilos del componente Galería
4fd07e5  ✨  Ajuste final de CSS y estilos del componente Galería
2c620cb  ✒️  Se actualiza la función de borrar collages y se aplica diseño responsivo al componente Galeria
359b3e9  👌  Actualización del README.md y despliegue en producción de última versión
        ↑
        HEAD — main / origin/main (estado actual)
```

---

## 🔐 Acceso

El portal utiliza una contraseña privada hardcodeada conocida únicamente por sus dos usuarios. No se utiliza un sistema de autenticación externo; el acceso está restringido por diseño a una sola pareja.

---

## ☁️ Hosting

El portal está desplegado a través de **Firebase Hosting** (https://portal-de-recuerdos.web.app/). Toda la multimedia (fotos, collages, archivos de recuerdos) se almacena en **Firebase Storage**, organizada en las carpetas `galeria/`, `collages/`, `recuerdos/` y `diasEspeciales/`.

---

## 💛 Autor

Hecho con amor para **Mis Ojitos**, que inspira cada línea de código y cada poema de este portal.