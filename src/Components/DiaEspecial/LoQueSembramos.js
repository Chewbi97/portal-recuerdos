import React, { useEffect, useRef, useState } from "react";
import { enviarNotificacion } from "../../firebase";
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";
import poemaAlineado from "../../Assets/amorYAmistad_alineado.json";
import "./LoQueSembramos.css";

// ─────────────────────────────────────────────────────────────
// SATURNO — geometría del anillo
// Elipse achatada en % del contenedor (no en px) para que funcione
// igual en cualquier tamaño de pantalla sin medir el DOM.
// ─────────────────────────────────────────────────────────────
// Medidos directamente sobre Saturno.jpg (751×349px)
const ANILLO_RX = 41;
const ANILLO_RY = 11;
const INCLINACION_ANILLO = (-14.3 * Math.PI) / 180;
const ANILLO_CENTRO_X = 52; // % — no coincide exacto con el centro geométrico del contenedor
const ANILLO_CENTRO_Y = 45.5; // porque la imagen no está perfectamente centrada en su propio lienzo
const ASPECT_CONTENEDOR = 349 / 751; // alto/ancho real de Saturno.jpg — necesario para rotar bien
const VELOCIDAD_ROTACION = 0.00025; // radianes por ms

// ─────────────────────────────────────────────────────────────
// TÍTULO — se escribe letra por letra mientras suena la música,
// antes de que empiece la voz del poema.
// ─────────────────────────────────────────────────────────────
const TITULO_POEMA = "La fortuna de coincidir";
const MENSAJE_EPILOGO = "Te Amo Mis Ojitos Bellos ☀️";
const RETRASO_VOZ = 30; // segundos desde que arranca la música hasta que empieza la voz
const DURACION_ESCRITURA_TITULO = 20; // se termina de escribir antes del retraso completo

const NUM_DESTELLOS = 28;
function generarDestellos() {
  return Array.from({ length: NUM_DESTELLOS }, () => ({
    left: Math.random() * 100,
    top: Math.random() * 60, // solo mitad superior, cerca del título
    delay: Math.random() * 4,
    duracion: 2.5 + Math.random() * 3,
    tam: 1 + Math.random() * 2,
  }));
}

function calcularPosicionFoto(theta) {
  const dx = ANILLO_RX * Math.cos(theta);
  // Convertimos dy a la misma "unidad física" que dx antes de rotar,
  // porque % de ancho y % de alto NO son la misma distancia en un
  // contenedor rectangular como este.
  const dyBruto = ANILLO_RY * Math.sin(theta);
  const dy = dyBruto * ASPECT_CONTENEDOR;

  // Rota el punto de la elipse para que coincida con el ángulo
  // del anillo que ya viene dibujado en la imagen de Saturno.
  const cosI = Math.cos(INCLINACION_ANILLO);
  const sinI = Math.sin(INCLINACION_ANILLO);
  const dxR = dx * cosI - dy * sinI;
  const dyRUnidadAncho = dx * sinI + dy * cosI;
  // Devolvemos dy a su unidad original (% de alto) para posicionar con top/left
  const dyR = dyRUnidadAncho / ASPECT_CONTENEDOR;

  const x = ANILLO_CENTRO_X + dxR;
  const y = ANILLO_CENTRO_Y + dyR;
  const esFrente = dyR > 0; // "frente" = mitad de abajo del anillo ya inclinado
  return { x, y, esFrente };
}

// ─────────────────────────────────────────────────────────────
// TRANSCRIPT DE LA VOZ
// Reemplaza este array vacío con el contenido de "chunks" que
// genera studio/whisper_transcribe.py una vez grabes y
// transcribas el poema. Ejemplo de uso una vez lo tengas:
//
//   import transcriptData from "./assets/amorYAmistad_transcript.json";
//   const CHUNKS = transcriptData.chunks;
//
// Cada elemento debe verse así: { text: "palabra", timestamp: [inicio, fin] }
// ─────────────────────────────────────────────────────────────
const LINEAS = poemaAlineado.lineas;

function obtenerLineaActual(lineas, t) {
  let actual = null;
  for (const linea of lineas) {
    if (linea.inicio <= t) actual = linea;
    else break;
  }
  return actual;
}

// Devuelve un array { texto, negrita } por palabra visible hasta el
// momento t, en vez de un string plano, para poder pintar negrita por palabra.
function palabrasReveladas(linea, t) {
  if (!linea) return [];
  return linea.palabras
    .map((p) => {
      let texto = "";
      if (t >= p.end) texto = p.texto;
      else if (t >= p.start) {
        const frac = (t - p.start) / (p.end - p.start || 0.001);
        const nChars = Math.max(1, Math.ceil(frac * p.texto.length));
        texto = p.texto.slice(0, nChars);
      }
      return { texto, negrita: p.negrita };
    })
    .filter((p) => p.texto.length > 0);
}

function LoQueSembramos({ diaEspecial, onClose }) {
  const [fase, setFase] = useState("intro"); // intro | poema | saturno | cierre
  const [subFasePoema, setSubFasePoema] = useState("titulo"); // titulo | texto | epilogo
  const [tituloVisible, setTituloVisible] = useState("");
  const [palabrasVisibles, setPalabrasVisibles] = useState([]);
  const [alphaFirma, setAlphaFirma] = useState(0);

  const audioMusicaRef = useRef(null);
  const audioVozRef = useRef(null);
  const audioSaturnoRef = useRef(null);
  const animRef = useRef(null);
  const animSaturnoRef = useRef(null);
  const fotosRefs = useRef([]);
  const anguloBaseRef = useRef(0);
  const lineasRef = useRef([]);
  const faseRef = useRef("intro");
  const vozIniciadaRef = useRef(false);
  const destellosRef = useRef(generarDestellos());
  const [fotosSaturno, setFotosSaturno] = useState([]);
  const [numFotosVisibles, setNumFotosVisibles] = useState(0);

  // ── Cargar fotos de la pareja desde Storage (carpeta dedicada) ──
  useEffect(() => {
    const storage = getStorage();
    listAll(ref(storage, "amorYAmistad"))
      .then(async (res) => {
        const urls = await Promise.all(
          res.items.map((item) => getDownloadURL(item)),
        );
        setFotosSaturno(urls);
      })
      .catch(() => setFotosSaturno([]));
  }, []);

  useEffect(() => {
    lineasRef.current = LINEAS;
  }, []);

  useEffect(() => {
    faseRef.current = fase;
  }, [fase]);

  useEffect(() => {
    enviarNotificacion(
      `💌 ${diaEspecial?.titulo || "Un momento especial"}`,
      diaEspecial?.descripcionGaleria || "Alguien tiene algo para ti",
    ).catch(() => {});
  }, [diaEspecial]);

  useEffect(() => {
    const k = (e) => e.key === "Escape" && handleClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const detenerTodoAudio = () => {
    audioMusicaRef.current?.pause();
    audioVozRef.current?.pause();
    audioSaturnoRef.current?.pause();
    cancelAnimationFrame(animRef.current);
    cancelAnimationFrame(animSaturnoRef.current);
  };

  const handleClose = () => {
    detenerTodoAudio();
    onClose();
  };

  const iniciarPoema = () => {
    setFase("poema");
    setSubFasePoema("titulo");
    setTituloVisible("");
    vozIniciadaRef.current = false;

    if (diaEspecial?.musicaPoemaUrl) {
      audioMusicaRef.current = new Audio(diaEspecial.musicaPoemaUrl);
      audioMusicaRef.current.loop = false;
      audioMusicaRef.current.volume = 0.22;
      audioMusicaRef.current.play().catch(() => {});
      audioMusicaRef.current.addEventListener(
        "ended",
        () => {
          // La música terminó de sonar del todo → avanzar solos a Saturno
          if (faseRef.current === "poema") irASaturno();
        },
        { once: true },
      );
    }

    const loop = () => {
      const tMusica = audioMusicaRef.current?.currentTime || 0;

      if (!vozIniciadaRef.current) {
        // ── Título escribiéndose ──
        const progresoTitulo = Math.min(tMusica / DURACION_ESCRITURA_TITULO, 1);
        const nChars = Math.ceil(progresoTitulo * TITULO_POEMA.length);
        setTituloVisible(TITULO_POEMA.slice(0, nChars));

        if (tMusica >= RETRASO_VOZ && diaEspecial?.audioUrl) {
          vozIniciadaRef.current = true;
          setSubFasePoema("texto");
          audioVozRef.current = new Audio(diaEspecial.audioUrl);
          audioVozRef.current.volume = 1;
          audioVozRef.current.play().catch(() => {});
          audioVozRef.current.addEventListener(
            "ended",
            () => setSubFasePoema("epilogo"),
            { once: true },
          );
        }
      } else {
        // ── Poema con voz ya iniciada ──
        const t = audioVozRef.current?.currentTime || 0;
        const linea = obtenerLineaActual(lineasRef.current, t);
        setPalabrasVisibles(palabrasReveladas(linea, t));
      }

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
  };

  const irASaturno = () => {
    detenerTodoAudio();
    setFase("saturno");
    setNumFotosVisibles(0);

    if (diaEspecial?.musicaSaturnoUrl) {
      audioSaturnoRef.current = new Audio(diaEspecial.musicaSaturnoUrl);
      audioSaturnoRef.current.volume = 0.6;
      audioSaturnoRef.current.play().catch(() => {});
    }

    let ultimoTs = performance.now();
    const totalFotos = fotosSaturno.length;

    const loop = (ts) => {
      const dt = ts - ultimoTs;
      ultimoTs = ts;
      anguloBaseRef.current += VELOCIDAD_ROTACION * dt;

      // Reposicionar cada foto directamente en el DOM (sin re-render por frame)
      fotosRefs.current.forEach((el, i) => {
        if (!el || totalFotos === 0) return;
        const theta = anguloBaseRef.current + (i / totalFotos) * Math.PI * 2;
        const { x, y, esFrente } = calcularPosicionFoto(theta);
        const escala = esFrente ? 1 : 0.72;
        el.style.left = `${x}%`;
        el.style.top = `${y}%`;
        el.style.transform = `translate(-50%, -50%) scale(${escala})`;
        el.style.zIndex = esFrente ? 5 : 1;
        el.style.filter = esFrente ? "none" : "brightness(0.55)";
      });

      // Progreso de la canción → cuántas fotos deben estar reveladas
      const audio = audioSaturnoRef.current;
      if (audio && audio.duration) {
        const progreso = Math.min(audio.currentTime / audio.duration, 1);
        const nuevoNum = Math.min(totalFotos, Math.ceil(progreso * totalFotos));
        setNumFotosVisibles((prev) => (prev !== nuevoNum ? nuevoNum : prev));
      }

      animSaturnoRef.current = requestAnimationFrame(loop);
    };
    animSaturnoRef.current = requestAnimationFrame(loop);
  };

  const irACierre = () => {
    detenerTodoAudio();
    setFase("cierre");
    setTimeout(() => setAlphaFirma(1), 200);
  };

  return (
    <div className="sembramos-overlay">
      <button className="sembramos-cerrar" onClick={handleClose}>
        ✕
      </button>

      {fase === "intro" && (
        <div className="sembramos-intro">
          <p className="sembramos-intro-titulo">
            {diaEspecial?.titulo || "Para ti"}
          </p>
          <button className="sembramos-toque" onClick={iniciarPoema}>
            💚
          </button>
          <p className="sembramos-intro-hint">toca para comenzar</p>
        </div>
      )}

      {fase === "poema" && (
        <div className="sembramos-poema-wrapper">
          <div className="sembramos-destellos">
            {destellosRef.current.map((d, i) => (
              <span
                key={i}
                className="sembramos-destello"
                style={{
                  left: `${d.left}%`,
                  top: `${d.top}%`,
                  width: `${d.tam}px`,
                  height: `${d.tam}px`,
                  animationDelay: `${d.delay}s`,
                  animationDuration: `${d.duracion}s`,
                }}
              />
            ))}
          </div>

          <p className="sembramos-titulo-poema">{tituloVisible}</p>

          {subFasePoema === "texto" && (
            <p className="sembramos-poema-linea">
              {palabrasVisibles.map((p, i) => (
                <span
                  key={i}
                  className={p.negrita ? "sembramos-negrita" : undefined}
                >
                  {p.texto}{" "}
                </span>
              ))}
            </p>
          )}
          {subFasePoema === "epilogo" && (
            <p className="sembramos-epilogo">{MENSAJE_EPILOGO}</p>
          )}

          <button className="sembramos-siguiente" onClick={irASaturno}>
            Siguiente parte →
          </button>
        </div>
      )}

      {fase === "saturno" && (
        <div className="saturno-escena">
          <div className="saturno-planeta-wrap">
            <div className="saturno-halo" />

            {diaEspecial?.saturnoImg ? (
              <img
                src={diaEspecial.saturnoImg}
                alt="Saturno"
                className="saturno-planeta"
              />
            ) : (
              <div className="saturno-planeta saturno-planeta-placeholder" />
            )}

            {fotosSaturno.map((url, i) => (
              <div
                key={url}
                ref={(el) => (fotosRefs.current[i] = el)}
                className={`saturno-foto ${i < numFotosVisibles ? "saturno-foto--visible" : ""}`}
              >
                <img src={url} alt="" />
              </div>
            ))}
          </div>

          <button className="sembramos-siguiente" onClick={irACierre}>
            Siguiente parte →
          </button>
        </div>
      )}

      {fase === "cierre" && (
        <div className="sembramos-cierre" style={{ opacity: alphaFirma }}>
          <p>{diaEspecial?.firma || "Tu Bebé 💚"}</p>
        </div>
      )}
    </div>
  );
}

export default LoQueSembramos;
