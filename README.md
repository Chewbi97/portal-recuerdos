# 🌹 Antología de tus Ojos — Portal MyS

> *Un espacio privado y personal para guardar poemas, recuerdos y cartas animadas para la persona que más quiero.*

---

## 📖 ¿Qué es este proyecto?

**Antología de tus Ojos** es un portal web privado construido con React y Firebase, pensado como un espacio íntimo y personal. Cuenta con un login protegido por contraseña única (hardcodeada), y desde dentro se puede:

- 📸 Ver y cambiar una foto principal con una frase especial en el **Dashboard**.
- 🖊️ Subir y leer **Poemas** (sección *Musas*), con título, autor y contenido.
- 🗂️ Guardar **Recuerdos** (sección *Memorias*), con título, descripción y multimedia.
- 💌 Ver y crear **Tarjetas animadas** (botón flotante) para fechas especiales o días normales, con controles de reproducción (play, pausa, adelantar, retroceder) y función de descarga. Las tarjetas de fechas especiales se abren automáticamente ese día.

---

## 🛠️ Tecnologías utilizadas

| Tecnología | Logo | ¿Para qué se usa? | Enlace |
|---|---|---|---|
| React | ⚛️ | Librería principal para la interfaz de usuario | [reactjs.org](https://reactjs.org/) |
| Firebase | 🔥 | Autenticación, almacenamiento de multimedia y hosting | [firebase.google.com](https://firebase.google.com/) |
| React Router DOM | 🔀 | Navegación entre páginas y rutas del portal | [reactrouter.com](https://reactrouter.com/) |
| Phosphor Icons | 🎨 | Biblioteca de íconos para la UI | [phosphoricons.com](https://phosphoricons.com/) |
| SweetAlert2 | 🍬 | Alertas y modales estilizados | [sweetalert2.github.io](https://sweetalert2.github.io/) |
| html2canvas | 📷 | Captura y descarga de tarjetas animadas como imagen | [html2canvas.hertzen.com](https://html2canvas.hertzen.com/) |
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
npm install firebase                   # Firebase (auth, storage, hosting)
npm install react-router-dom           # Enrutamiento
npm install sweetalert2                # Alertas y modales
npm install html2canvas                # Descarga de tarjetas como imagen
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
    ├── App.js                        # Componente raíz y configuración de rutas
    ├── App.css
    ├── firebase.js                   # Configuración e inicialización de Firebase
    ├── index.js                      # Punto de entrada de la aplicación
    ├── index.css
    ├── sweetalertConfig.js           # Configuración global de SweetAlert2
    │
    ├── Assets/                       # Recursos estáticos (imágenes de fondo, etc.)
    │   ├── fondo-dashboard.png
    │   ├── imagen-fondo.jpg
    │   └── imagen-fondo.png
    │
    └── Components/
        ├── HomeContent.js            # Contenido principal del portal
        │
        ├── Dashboard/
        │   └── Dashboard.js         # Vista principal con foto y frase especial
        │
        ├── Login/
        │   └── Login.js             # Pantalla de acceso con contraseña privada
        │
        ├── PortalPoemas/
        │   └── PoemsPortal.js       # Sección Musas — subida y visualización de poemas
        │
        ├── LineadeTiempo/
        │   └── TimeLine.js          # Línea de tiempo de recuerdos (Memorias)
        │
        ├── GaleriaDias/
        │   └── GaleriaDias.js       # Galería de tarjetas especiales
        │
        └── DiaEspecial/             # Tarjetas animadas para fechas especiales
            ├── ControlesAnimacion.js # Controles: play, pausa, adelantar, retroceder
            ├── DiaMujer.js
            ├── EcuacionAmor.js
            ├── GalaxiasFusion.js
            └── SuperficieCorazon.js
```

---

## ⏳ Línea de tiempo del proyecto

El proyecto fue desarrollado durante varios meses en local antes de subirse a GitHub. A continuación el historial de commits registrados:

```
c00827b  🌱  Primer Commit — Upload inicial del portal al repositorio
0b2ee81  📝  Actualización del README con contenido propio del proyecto
a0be5d5  💌  Portal actualizado con la última tarjeta animada
644c59f  📥  Función de descarga de tarjetas agregada + reorganización y actualización del Storage de Firebase
         ↑
        HEAD — main / origin/main (estado actual)
```

---

## 🔐 Acceso

El portal utiliza una contraseña privada hardcodeada conocida únicamente por sus dos usuarios. No se utiliza un sistema de autenticación externo; el acceso está restringido por diseño a una sola pareja.

---

## ☁️ Hosting

El portal está desplegado a través de **Firebase Hosting**. Toda la multimedia (fotos, videos, archivos de recuerdos) se almacena en **Firebase Storage**.

---

## 💛 Autor

Hecho con amor para **Mis Ojitos**, que inspira cada línea de código y cada poema de este portal.