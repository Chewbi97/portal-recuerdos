import React, { useEffect, useRef, useCallback, useState } from "react";
import ControlesAnimacion from "./ControlesAnimacion";
import { enviarNotificacion } from "../../firebase";
import "./Pluma.css";

// ── TIMESTAMPS DEL TRANSCRIPT (offset -18.36 aplicado) ──
const CHUNKS_RAW = [
  // --- Inicio (0s - 18.36s) ---
  { text: "Mis Ojitos Bellos...", start: 0, end: 3.5 },
  { text: "¿Cuántas veces lo has oído de mi boca?", start: 3.5, end: 7.2 },
  { text: "Quizá parezca demasiado sencillo y obvio,", start: 7.2, end: 11.5 },
  {
    text: "pero las obviedades no pasan desapercibidas.",
    start: 11.5,
    end: 18.36,
  },

  // --- Bloque 1 (18.36s - 42.54s) ---
  {
    text: "Tus ojos desde un primer instante se convirtieron",
    start: 18.36,
    end: 21.1,
  },
  {
    text: "en la ventana a un nuevo mundo lleno de ilusión y color.",
    start: 21.1,
    end: 24.32,
  },
  {
    text: "¿Y por qué? No hay razón propia que valga,",
    start: 24.78,
    end: 27.92,
  },
  {
    text: "entregado siempre a los hechos y evidencias,",
    start: 28.1,
    end: 30.62,
  },
  { text: "destrozo mi lógica. ¿Cómo? ¿Por qué?", start: 30.76, end: 34.68 },
  { text: "Hasta que entendí que hay conexiones", start: 36.4, end: 38.3 },
  {
    text: "que no tienen explicación, solo se sienten.",
    start: 38.3,
    end: 41.56,
  },

  // --- Bloque 2 (42.54s - 57.22s) ---
  {
    text: "En esta ocasión mis palabras quieren dejar de repetir",
    start: 42.54,
    end: 45.5,
  },
  { text: "lo que tantas veces ya he expresado.", start: 45.5, end: 48.4 },
  {
    text: "Prefiero el día de hoy solo dar rienda suelta",
    start: 48.4,
    end: 51.38,
  },
  {
    text: "a mis pensamientos y que las letras dibujen",
    start: 51.38,
    end: 54.62,
  },
  {
    text: "lo que mis palabras muchas veces entorpecen.",
    start: 54.62,
    end: 57.22,
  },

  // --- Bloque 3 (57.22s - 82.52s) ---
  { text: "Despertar cada mañana y que lo primero", start: 57.22, end: 59.5 },
  {
    text: "que por mi mente pase es: ¿Cómo habrá pasado la noche?",
    start: 59.5,
    end: 62.5,
  },
  { text: "Tomar el primer café del día y pensar:", start: 62.5, end: 64.5 },
  { text: "Ojalá su día vaya bien...", start: 64.5, end: 67.5 },
  {
    text: "Son comportamientos que antaño no me acogían,",
    start: 67.5,
    end: 71.2,
  },
  { text: "pero me alegra tener de vuelta,", start: 71.2, end: 73.22 },
  {
    text: "porque no es solo mi pensar en la más excelsa estrella",
    start: 73.22,
    end: 76.88,
  },
  {
    text: "que el universo pudo haber enviado para mí.",
    start: 78.18,
    end: 80.6,
  },
  { text: "Es el hecho de pensar que la presencia", start: 80.6, end: 82.52 },
  {
    text: "y existencia tan hermosa corresponda a la mía.",
    start: 82.52,
    end: 86.64,
  },

  // --- Bloque 4: Rellenando el hueco (86.64s - 149.98s) ---
  {
    text: "No enaltezco o superpongo tu imagen a la mía,",
    start: 86.64,
    end: 90.0,
  },
  {
    text: "solo que la admiración y cariño que he desarrollado",
    start: 90.0,
    end: 94.0,
  },
  {
    text: "me hace pensar en querer compartir todo contigo,",
    start: 94.0,
    end: 98.0,
  },
  { text: "en ofrecerte todo lo que mi mano y mente", start: 98.0, end: 102.0 },
  {
    text: "son capaces de ofrecer, no hablo de riquezas.",
    start: 102.0,
    end: 107.0,
  },
  {
    text: "Hablo de entregar todo lo que soy al máximo",
    start: 107.0,
    end: 112.0,
  },
  {
    text: "para hacer que tu mundo sea un bonito lugar,",
    start: 112.0,
    end: 117.0,
  },
  { text: "porque solo así estoy seguro", start: 117.0, end: 122.0 },
  {
    text: "ambos gozaremos de tiempos maravillosos.",
    start: 122.0,
    end: 128.0,
  },
  {
    text: "Mis ojitos te hablo hoy en un día sin presiones,",
    start: 128.0,
    end: 133.0,
  },
  {
    text: "porque contigo cada momento se hace especial.",
    start: 133.0,
    end: 140.0,
  },
  {
    text: "Emanan una pureza que ni el yacimiento cristalino",
    start: 140.0,
    end: 145.0,
  },
  {
    text: "más puro sería capaz de competir frente a ti.",
    start: 145.0,
    end: 149.98,
  },

  // --- Bloque Final (149.98s - Final) ---
  { text: "Y es que cada latido de tu corazón,", start: 149.98, end: 151.36 },
  {
    text: "cada átomo de tu cuerpo, cada acción de tu ser,",
    start: 151.36,
    end: 153.2,
  },
  { text: "de tu Bebé que tanto te quiere,", start: 153.2, end: 154.34 },
  { text: "con las intenciones de amarte.", start: 154.44, end: 157.48 },
  {
    text: "Para la Princesa que sin saber por qué,",
    start: 157.48,
    end: 161.14,
  },
  {
    text: "se convirtió en el centro de mi corazón. ✦",
    start: 161.14,
    end: 164.24,
  },
];

const START_DELAY = 15; // El tiempo que tarda el corazón en formarse y empezar el audio

const FRASES = CHUNKS_RAW.map((c) => ({
  txt: c.text,
  start: c.start + START_DELAY,
  end: c.end + START_DELAY,
}));

const AUDIO_DURATION = 164.24;
const TOTAL_DURATION = 187;
const FPS = 60;
const TOTAL_FRAMES = TOTAL_DURATION * FPS;

// Timing visual
const T_HEART_FORM_END = 18;
const T_STAR_LAUNCH = 20;
const T_STAR_ARRIVE = 38;
const T_HEART_GLOW = 40;
const T_DECOMPOSE_START = 90;
const T_DECOMPOSE_END = 115;
const T_BOOK_PAGES = 118;
const T_BOOK_CLOSE = 150;
const T_BOOK_TITLE = 175;
const T_FIRMA = 179;

export default function Pluma({ diaEspecial, onClose }) {
  const canvasRef = useRef(null);
  const audioVozRef = useRef(null);
  const audioMusRef = useRef(null);
  const animRef = useRef(null);
  const pausadoRef = useRef(false);
  const loopStartRef = useRef(null);
  const frameRef = useRef(0);
  const vozStartedRef = useRef(false);

  // Estado interno de la animación (no React — para no re-renderizar)
  const internalRef = useRef({
    starX: 0,
    starY: 0,
    starVX: 0,
    starVY: 0,
    starPhase: "waiting",
    starGlowR: 0,
    starTrail: [],
    starInitialized: false,
    heartGlowAlpha: 0,
    curFi: -1,
    subTargets: [],
  });

  const partsRef = useRef(null);
  const subPartsRef = useRef(null);
  const starsRef = useRef(null);
  const pixCacheRef = useRef({});

  const [pausado, setPausado] = useState(false);
  const [progreso, setProgreso] = useState(0);

  // ── UTILIDADES ──
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const eio = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
  const rand = (a, b) => a + Math.random() * (b - a);

  const handleClose = () => {
    cancelAnimationFrame(animRef.current);
    audioVozRef.current?.pause();
    audioMusRef.current?.pause();
    onClose();
  };

  const handlePausa = () => {
    pausadoRef.current = !pausadoRef.current;
    setPausado(pausadoRef.current);
    if (pausadoRef.current) {
      audioVozRef.current?.pause();
      audioMusRef.current?.pause();
    } else {
      loopStartRef.current = null;
      audioMusRef.current?.play().catch(() => {});
      if (vozStartedRef.current) audioVozRef.current?.play().catch(() => {});
    }
  };

  const resetInternal = () => {
    const s = internalRef.current;
    s.starX = 0;
    s.starY = 0;
    s.starVX = 0;
    s.starVY = 0;
    s.starPhase = "waiting";
    s.starGlowR = 0;
    s.starTrail = [];
    s.starInitialized = false;
    s.heartGlowAlpha = 0;
    s.curFi = -1;
    s.subTargets = [];
    vozStartedRef.current = false;
    partsRef.current?.forEach((p) => {
      p.x = rand(0, 420);
      p.y = rand(-80, 460);
    });
    subPartsRef.current?.forEach((p) => {
      p.alpha = 0;
      p.active = false;
    });
  };

  const handleBarra = (val) => {
    frameRef.current = val;
    setProgreso(val);
    loopStartRef.current = null; // Para que el render recalcule el tiempo suavemente

    const segActual = val / FPS;

    // 1. Lógica de la MÚSICA (Empieza desde el segundo 0)
    if (audioMusRef.current) {
      audioMusRef.current.currentTime =
        segActual % (audioMusRef.current.duration || 999);

      // Bajamos el volumen (ducking) solo cuando la voz debería estar sonando
      const vozActiva =
        segActual >= START_DELAY && segActual <= START_DELAY + AUDIO_DURATION;
      audioMusRef.current.volume = vozActiva ? 0.06 : 0.18;

      if (!pausadoRef.current) audioMusRef.current.play().catch(() => {});
    }

    // 2. Lógica de la VOZ (Empieza solo después del START_DELAY)
    if (audioVozRef.current) {
      if (segActual >= START_DELAY) {
        // Sincronizamos: Tiempo actual de la tarjeta - 15 segundos de espera
        const tiempoRelativoVoz = segActual - START_DELAY;

        audioVozRef.current.currentTime = Math.min(
          tiempoRelativoVoz,
          audioVozRef.current.duration || 0,
        );

        if (!pausadoRef.current) audioVozRef.current.play().catch(() => {});
        vozStartedRef.current = true;
      } else {
        // Si la barra está antes del segundo 15, la voz debe estar callada
        audioVozRef.current.pause();
        audioVozRef.current.currentTime = 0;
        vozStartedRef.current = false;
      }
    }
  };

  // ── BUILD CORAZÓN ──
  const buildHeartPixels = useCallback((W, H) => {
    const off = document.createElement("canvas");
    off.width = W;
    off.height = H;
    const c = off.getContext("2d");
    const cx = W / 2,
      cy = H * 0.37;
    c.save();
    c.translate(cx, cy);
    c.beginPath();
    c.moveTo(10, -55);
    c.bezierCurveTo(45, -60, 75, -40, 80, -10);
    c.bezierCurveTo(85, 20, 70, 55, 45, 85);
    c.bezierCurveTo(30, 100, 10, 108, 0, 110);
    c.bezierCurveTo(-10, 108, -30, 100, -45, 85);
    c.bezierCurveTo(-70, 55, -85, 20, -80, -10);
    c.bezierCurveTo(-75, -40, -45, -60, -10, -55);
    c.closePath();
    c.fillStyle = "#8B0000";
    c.fill();
    c.beginPath();
    c.moveTo(-10, -55);
    c.bezierCurveTo(-45, -65, -85, -50, -95, -20);
    c.bezierCurveTo(-105, 10, -90, 45, -70, 65);
    c.bezierCurveTo(-55, 78, -45, 85, -45, 85);
    c.bezierCurveTo(-70, 55, -85, 20, -80, -10);
    c.bezierCurveTo(-75, -40, -45, -60, -10, -55);
    c.closePath();
    c.fillStyle = "#6B0000";
    c.fill();
    c.beginPath();
    c.moveTo(10, -55);
    c.bezierCurveTo(30, -70, 60, -80, 70, -70);
    c.bezierCurveTo(85, -55, 80, -35, 65, -30);
    c.bezierCurveTo(50, -25, 30, -35, 10, -55);
    c.closePath();
    c.fillStyle = "#9B1020";
    c.fill();
    c.beginPath();
    c.moveTo(-10, -55);
    c.bezierCurveTo(-30, -72, -65, -82, -78, -70);
    c.bezierCurveTo(-95, -55, -92, -30, -75, -22);
    c.bezierCurveTo(-58, -15, -35, -28, -10, -55);
    c.closePath();
    c.fillStyle = "#7B1525";
    c.fill();
    c.beginPath();
    c.moveTo(5, -55);
    c.bezierCurveTo(8, -80, 15, -100, 10, -118);
    c.bezierCurveTo(8, -128, -2, -132, -8, -128);
    c.bezierCurveTo(-14, -124, -16, -112, -12, -100);
    c.bezierCurveTo(-8, -85, -5, -70, -5, -55);
    c.closePath();
    c.fillStyle = "#CC3030";
    c.fill();
    c.beginPath();
    c.moveTo(-15, -62);
    c.bezierCurveTo(-25, -80, -40, -105, -55, -112);
    c.bezierCurveTo(-65, -118, -75, -112, -72, -102);
    c.bezierCurveTo(-69, -92, -58, -88, -48, -88);
    c.bezierCurveTo(-35, -88, -22, -78, -15, -62);
    c.closePath();
    c.fillStyle = "#4455AA";
    c.fill();
    c.beginPath();
    c.moveTo(55, -60);
    c.bezierCurveTo(62, -80, 65, -100, 60, -118);
    c.bezierCurveTo(57, -128, 50, -130, 44, -126);
    c.bezierCurveTo(38, -122, 38, -110, 42, -95);
    c.bezierCurveTo(46, -80, 50, -68, 50, -58);
    c.closePath();
    c.fillStyle = "#3344AA";
    c.fill();
    c.beginPath();
    c.moveTo(15, -30);
    c.bezierCurveTo(40, -10, 55, 20, 40, 55);
    c.strokeStyle = "rgba(220,60,60,0.6)";
    c.lineWidth = 2.2;
    c.stroke();
    c.beginPath();
    c.moveTo(-15, -30);
    c.bezierCurveTo(-40, 0, -50, 35, -35, 65);
    c.strokeStyle = "rgba(220,60,60,0.5)";
    c.lineWidth = 1.8;
    c.stroke();
    c.beginPath();
    c.moveTo(0, -50);
    c.bezierCurveTo(2, 10, 3, 60, 0, 110);
    c.strokeStyle = "rgba(0,0,0,0.45)";
    c.lineWidth = 2.5;
    c.stroke();
    c.restore();
    const d = off.getContext("2d").getImageData(0, 0, W, H).data;
    const px = [],
      col = [];
    for (let y = 0; y < H; y += 3)
      for (let x = 0; x < W; x += 3) {
        const i = (y * W + x) * 4;
        if (d[i + 3] > 60) {
          px.push({ x, y });
          col.push({ r: d[i], g: d[i + 1], b: d[i + 2] });
        }
      }
    return { px, col };
  }, []);

  const buildBookPixels = useCallback((W, H) => {
    const BCX = W / 2,
      BCY = H * 0.37,
      BW = 200,
      BH = 260,
      BSPINE = 26;
    const off = document.createElement("canvas");
    off.width = W;
    off.height = H;
    const c = off.getContext("2d");
    const bx = BCX - BW / 2,
      by = BCY - BH / 2;
    c.fillStyle = "#0a0a2a";
    c.fillRect(bx, by, BSPINE, BH);
    c.fillStyle = "#080820";
    c.fillRect(bx + BSPINE, by, BW - BSPINE, BH);
    c.strokeStyle = "rgba(0,180,255,0.8)";
    c.lineWidth = 2;
    c.strokeRect(bx + BSPINE + 6, by + 6, BW - BSPINE - 12, BH - 12);
    const d = c.getImageData(0, 0, W, H).data;
    const pts = [];
    for (let y = 0; y < H; y += 3)
      for (let x = 0; x < W; x += 3) {
        const i = (y * W + x) * 4;
        if (d[i + 3] > 30) pts.push({ x, y });
      }
    return { pts, BCX, BCY, BW, BH, BSPINE };
  }, []);

  const buildSubPixels = useCallback((txt, W, H) => {
    const SW = W - 40,
      SH = 90; // más alto para mejor legibilidad
    const off = document.createElement("canvas");
    off.width = SW;
    off.height = SH;
    const c = off.getContext("2d");
    c.clearRect(0, 0, SW, SH);
    c.fillStyle = "#fff";
    // Fuente más grande para mejor lectura
    const fs = txt.length > 40 ? 17 : txt.length > 28 ? 20 : 23;
    c.font = `italic ${fs}px 'EB Garamond', 'Palatino Linotype', Georgia, serif`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(txt, SW / 2, SH / 2, SW - 8);
    const d = c.getImageData(0, 0, SW, SH).data;
    const pts = [];
    for (let y = 0; y < SH; y += 2)
      for (let x = 0; x < SW; x += 2)
        if (d[(y * SW + x) * 4 + 3] > 80)
          pts.push({ x: x + 20, y: H * 0.84 + y - SH / 2 });
    return pts;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = 420,
      H = 700;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    const { px: heartPx, col: heartCol } = buildHeartPixels(W, H);
    const { pts: bookPts, BCX, BCY, BW, BH, BSPINE } = buildBookPixels(W, H);

    const N = Math.min(heartPx.length, 1800);
    partsRef.current = Array.from({ length: N }, (_, i) => {
      const hi = Math.floor((i / N) * heartPx.length);
      const bi = Math.floor((i / N) * bookPts.length);
      const hp = heartPx[hi],
        hc = heartCol[hi],
        bp = bookPts[bi];
      const vary = rand(-18, 18);
      return {
        x: rand(0, W),
        y: rand(-80, H * 0.65),
        htx: hp.x,
        hty: hp.y,
        hcr: clamp(hc.r + vary, 0, 255),
        hcg: clamp(hc.g + vary, 0, 255),
        hcb: clamp(hc.b + vary, 0, 255),
        btx: bp ? bp.x : rand(BCX - 75, BCX + 75),
        bty: bp ? bp.y : rand(BCY - 100, BCY + 100),
        bcr: rand(0, 30),
        bcg: rand(120, 220),
        bcb: 255,
        r: rand(0.8, 2.2),
        alpha: rand(0.4, 1.0),
        delay: rand(0, 0.82),
        twF: rand(0.4, 2.0),
        twP: rand(0, Math.PI * 2),
      };
    });

    starsRef.current = Array.from({ length: 230 }, () => ({
      x: rand(0, W),
      y: rand(0, H * 0.9),
      r: rand(0.2, 1.2),
      a: rand(0.08, 0.55),
      twF: rand(0.3, 1.8),
      twP: rand(0, Math.PI * 2),
    }));

    FRASES.forEach((f) => {
      pixCacheRef.current[f.start] = buildSubPixels(f.txt, W, H);
    });

    subPartsRef.current = Array.from({ length: 440 }, () => ({
      x: rand(0, W),
      y: rand(H * 0.87, H + 20),
      tx: 0,
      ty: 0,
      r: rand(0.7, 1.6),
      alpha: 0,
      active: false,
      speed: rand(0.04, 0.08), // más lento
    }));

    // ── AUDIO ──
    if (diaEspecial?.audioUrl) {
      audioVozRef.current = new Audio(diaEspecial.audioUrl);
      audioVozRef.current.volume = 1.0;
      audioVozRef.current.preload = "auto";
    }
    if (diaEspecial?.musicaUrl) {
      audioMusRef.current = new Audio(diaEspecial.musicaUrl);
      audioMusRef.current.loop = true;
      audioMusRef.current.volume = 0.12; // música más baja de inicio
    }

    enviarNotificacion(
      `✒️ ${diaEspecial?.titulo || "Un momento especial"}`,
      diaEspecial?.descripcionGaleria || "",
    ).catch(() => {});

    const setFrase = (idx) => {
      const s = internalRef.current;
      if (idx === s.curFi) return;
      s.curFi = idx;
      s.subTargets = pixCacheRef.current[FRASES[idx].start] || [];
      subPartsRef.current.forEach((p, i) => {
        const tgt = s.subTargets[i % Math.max(s.subTargets.length, 1)];
        p.active = !!tgt;
        if (tgt) {
          p.tx = tgt.x;
          p.ty = tgt.y;
        }
        p.x = rand(0, W);
        p.y = rand(H * 0.88, H + 20);
        p.alpha = 0;
      });
    };

    const initStar = () => {
      const s = internalRef.current;
      s.starX = W + 60;
      s.starY = rand(H * 0.08, H * 0.2);
      const duration = T_STAR_ARRIVE - T_STAR_LAUNCH;
      s.starVX = (W / 2 - s.starX) / duration;
      s.starVY = (H * 0.37 - s.starY) / duration;
      s.starPhase = "flying";
      s.starTrail = [];
    };

    // ── RENDER ──
    const render = (timestamp) => {
      if (pausadoRef.current) {
        animRef.current = requestAnimationFrame(render);
        return;
      }

      // 1. Calculamos el tiempo base de la animación
      if (!loopStartRef.current) {
        loopStartRef.current = timestamp - (frameRef.current / FPS) * 1000;
      }

      let t = (timestamp - loopStartRef.current) / 1000;

      // 2. Sincronización con la voz (SOLO si ya pasamos los 15s y la voz suena)
      if (
        vozStartedRef.current &&
        audioVozRef.current &&
        !audioVozRef.current.paused
      ) {
        // t es el tiempo del audio + los 15s de espera inicial
        t = audioVozRef.current.currentTime + START_DELAY;
        // Actualizamos el frame para que la barra de progreso no salte
        frameRef.current = Math.floor(t * FPS);
      } else {
        frameRef.current = Math.floor(t * FPS);
      }

      const s = internalRef.current;
      const fr = frameRef.current;

      // ── CONTROL DE AUDIO (Música vs Voz) ──

      // 1. La Música: Arranca inmediatamente (t >= 0)
      if (
        audioMusRef.current &&
        audioMusRef.current.paused &&
        !pausadoRef.current
      ) {
        audioMusRef.current.play().catch(() => {});
      }

      // Lógica de la Voz con RESET
      if (t >= START_DELAY) {
        // Si ya pasó el tiempo y no ha arrancado, arráncala
        if (!vozStartedRef.current && audioVozRef.current) {
          audioVozRef.current.currentTime = 0;
          audioVozRef.current.play().catch(() => {});
          vozStartedRef.current = true;
        }
      } else {
        // SI EL TIEMPO ES MENOR A 15 (reinicio o inicio):
        if (vozStartedRef.current) {
          audioVozRef.current?.pause();
          if (audioVozRef.current) audioVozRef.current.currentTime = 0;
          vozStartedRef.current = false; // ESTO permite que vuelva a empezar sincronizado
        }
      }

      // Ducking: música más bajita durante el poema
      if (audioMusRef.current) {
        const inPoem = t >= 0 && t <= AUDIO_DURATION;
        audioMusRef.current.volume = inPoem ? 0.06 : 0.18;
      }

      setProgreso(fr);

      ctx.clearRect(0, 0, W, H);
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#000205");
      bg.addColorStop(1, "#040008");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Estrellas
      starsRef.current.forEach((st) => {
        ctx.globalAlpha =
          st.a * (0.5 + 0.5 * Math.sin(fr * st.twF * 0.04 + st.twP));
        ctx.fillStyle = "#b0d8f5";
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // ── CORAZÓN ──
      const formT = clamp(t / T_HEART_FORM_END, 0, 1);
      const beatPulse = Math.sin(t * 1.1 * Math.PI * 2);
      const beatScale =
        formT > 0.3 ? 1 + beatPulse * 0.042 * Math.min(formT * 3, 1) : 1;
      const decompT = clamp(
        (t - T_DECOMPOSE_START) / (T_DECOMPOSE_END - T_DECOMPOSE_START),
        0,
        1,
      );
      const HCX = W / 2,
        HCY = H * 0.37;

      if (formT > 0.05 && decompT < 1) {
        const haA = (0.06 + beatPulse * 0.03) * formT * (1 - decompT);
        const hg = ctx.createRadialGradient(HCX, HCY, 15, HCX, HCY, 92 * formT);
        hg.addColorStop(0, `rgba(200,20,30,${haA})`);
        hg.addColorStop(0.6, `rgba(140,5,15,${haA * 0.4})`);
        hg.addColorStop(1, "rgba(80,0,5,0)");
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.arc(HCX, HCY, 92 * formT, 0, Math.PI * 2);
        ctx.fill();
      }

      if (t > T_HEART_GLOW && s.heartGlowAlpha > 0) {
        const glA = s.heartGlowAlpha * (1 - decompT);
        if (glA > 0) {
          const glg = ctx.createRadialGradient(
            HCX,
            HCY,
            0,
            HCX,
            HCY,
            125 * glA,
          );
          glg.addColorStop(0, `rgba(255,220,235,${glA * 0.45})`);
          glg.addColorStop(0.4, `rgba(220,100,130,${glA * 0.2})`);
          glg.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = glg;
          ctx.beginPath();
          ctx.arc(HCX, HCY, 125, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (decompT > 0.4) {
        const bA = clamp((decompT - 0.4) * 1.5, 0, 1);
        const bg2 = ctx.createRadialGradient(BCX, BCY, 10, BCX, BCY, 110 * bA);
        bg2.addColorStop(0, `rgba(0,180,255,${bA * 0.15})`);
        bg2.addColorStop(0.5, `rgba(0,120,200,${bA * 0.06})`);
        bg2.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = bg2;
        ctx.beginPath();
        ctx.arc(BCX, BCY, 110, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── PARTÍCULAS ──
      partsRef.current.forEach((p) => {
        const eff = clamp(
          (formT - p.delay * 0.6) / (1 - p.delay * 0.6 + 0.001),
          0,
          1,
        );
        const heartProg = eio(eff);
        const bookProg = eio(clamp(decompT * 1.15, 0, 1));
        const rawX = lerp(lerp(p.x, p.htx, heartProg), p.btx, bookProg);
        const rawY = lerp(lerp(p.y, p.hty, heartProg), p.bty, bookProg);
        let fx = rawX,
          fy = rawY;
        if (bookProg < 0.9) {
          const dx = (rawX - HCX) * beatScale,
            dy = (rawY - HCY) * beatScale;
          fx = lerp(HCX + dx, rawX, bookProg);
          fy = lerp(HCY + dy, rawY, bookProg);
        }
        const cr = Math.round(lerp(p.hcr, p.bcr, bookProg));
        const cg = Math.round(lerp(p.hcg, p.bcg, bookProg));
        const cb = Math.round(lerp(p.hcb, p.bcb, bookProg));
        const twinkle = 0.65 + 0.35 * Math.sin(fr * p.twF * 0.045 + p.twP);
        const a = p.alpha * Math.max(heartProg, bookProg * 0.5) * twinkle;
        if (a < 0.015) return;
        const hr = p.r * 4.2;
        const hg2 = ctx.createRadialGradient(fx, fy, 0, fx, fy, hr);
        hg2.addColorStop(0, `rgba(${cr},${cg},${cb},${a * 0.52})`);
        hg2.addColorStop(0.4, `rgba(${cr},${cg},${cb},${a * 0.18})`);
        hg2.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = hg2;
        ctx.beginPath();
        ctx.arc(fx, fy, hr, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = Math.min(1, a * 1.05);
        ctx.fillStyle = `rgb(${Math.min(255, cr + 90)},${Math.min(255, cg + 70)},${Math.min(255, cb + 70)})`;
        ctx.beginPath();
        ctx.arc(fx, fy, p.r * 0.52, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // ── LIBRO ──
      if (t > T_BOOK_PAGES) {
        const bookAlpha = clamp((t - T_BOOK_PAGES) / 3, 0, 1);
        const bx = BCX - BW / 2,
          by = BCY - BH / 2;
        if (bookAlpha > 0.1) {
          ctx.save();
          ctx.globalAlpha = bookAlpha * 0.7;
          for (let i = 0; i < 18; i++) {
            const ly = by + (i / 18) * BH;
            const glow = ctx.createLinearGradient(bx, ly, bx + BSPINE, ly);
            glow.addColorStop(0, "rgba(0,150,255,0)");
            glow.addColorStop(
              0.5,
              `rgba(0,200,255,${0.5 + Math.sin(fr * 0.08 + i) * 0.2})`,
            );
            glow.addColorStop(1, "rgba(0,150,255,0)");
            ctx.fillStyle = glow;
            ctx.fillRect(bx, ly, BSPINE, 1.5);
          }
          ctx.shadowColor = "rgba(0,180,255,0.8)";
          ctx.shadowBlur = 8;
          ctx.strokeStyle = `rgba(0,180,255,${bookAlpha * 0.85})`;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(bx + BSPINE + 5, by + 5, BW - BSPINE - 10, BH - 10);
          ctx.shadowBlur = 0;
          ctx.strokeStyle = `rgba(0,140,220,${bookAlpha * 0.4})`;
          ctx.lineWidth = 0.6;
          ctx.strokeRect(bx + BSPINE + 13, by + 13, BW - BSPINE - 26, BH - 26);
          ctx.restore();
        }

        if (t > T_BOOK_PAGES && t < T_BOOK_CLOSE) {
          const pageT = (t - T_BOOK_PAGES) / (T_BOOK_CLOSE - T_BOOK_PAGES);
          const pageNum = Math.floor(pageT * 14);
          const pageProgress = (pageT * 14) % 1;
          for (let pi = 0; pi < Math.min(pageNum, 7); pi++) {
            ctx.save();
            ctx.globalAlpha = bookAlpha * 0.25;
            for (let li = 0; li < 8; li++) {
              const lx = bx + BSPINE + 10 + pi,
                ly = by + 20 + li * 20;
              const lw = (BW - BSPINE - 20) * (0.4 + Math.random() * 0.55);
              ctx.fillStyle = `rgba(${100 + pi * 10},${180 + pi * 8},255,0.6)`;
              ctx.fillRect(lx, ly, lw, 1);
            }
            ctx.restore();
          }
          const scX = Math.abs(Math.cos(pageProgress * Math.PI));
          ctx.save();
          ctx.translate(bx + BSPINE, by + BH / 2);
          ctx.scale(scX, 1);
          ctx.translate(0, -BH / 2);
          ctx.globalAlpha = bookAlpha * 0.55;
          for (let li = 0; li < 10; li++) {
            const filled = li / 10 < pageProgress ? 1 : 0.15;
            const lw = (BW - BSPINE - 20) * (0.3 + li * 0.06);
            const lineG = ctx.createLinearGradient(0, 0, lw, 0);
            lineG.addColorStop(0, "rgba(0,200,255,0)");
            lineG.addColorStop(0.2, `rgba(0,200,255,${filled * 0.7})`);
            lineG.addColorStop(0.8, `rgba(0,180,255,${filled * 0.5})`);
            lineG.addColorStop(1, "rgba(0,200,255,0)");
            ctx.fillStyle = lineG;
            ctx.fillRect(10, 18 + li * 18, lw, 1.2);
          }
          ctx.restore();
        }

        if (t >= T_BOOK_CLOSE) {
          const closeT = clamp(
            (t - T_BOOK_CLOSE) / (T_BOOK_TITLE - T_BOOK_CLOSE),
            0,
            1,
          );
          ctx.save();
          ctx.translate(bx + BSPINE, by + BH / 2);
          ctx.scale(closeT, 1);
          ctx.translate(0, -BH / 2);
          ctx.globalAlpha = bookAlpha * closeT;
          ctx.shadowColor = "rgba(0,180,255,0.6)";
          ctx.shadowBlur = 10;
          ctx.strokeStyle = `rgba(0,180,255,${closeT * 0.9})`;
          ctx.lineWidth = 2;
          ctx.strokeRect(0, 0, BW - BSPINE, BH);
          ctx.shadowColor = "rgba(255,200,0,0.8)";
          ctx.shadowBlur = 8;
          ctx.strokeStyle = `rgba(255,200,0,${closeT * 0.7})`;
          ctx.lineWidth = 1;
          ctx.strokeRect(8, 8, BW - BSPINE - 16, BH - 16);
          ctx.restore();
        }

        if (t > T_BOOK_TITLE) {
          const titA = clamp((t - T_BOOK_TITLE) / 4, 0, 1);
          const bookCenterX = BCX + BSPINE / 2 + 10;
          ctx.save();
          ctx.globalAlpha = titA;
          ctx.textAlign = "center";

          // Título
          ctx.shadowColor = "rgba(255,200,30,0.9)";
          ctx.shadowBlur = 16;
          ctx.font = `italic bold 20px 'EB Garamond', Georgia, serif`;
          ctx.fillStyle = `rgba(255,215,50,${titA})`;
          ctx.fillText(
            diaEspecial?.titulo || "Nuestra Historia",
            bookCenterX,
            BCY - 22,
          );

          // Línea decorativa
          ctx.shadowBlur = 6;
          ctx.strokeStyle = `rgba(255,200,40,${titA * 0.6})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(BCX - 50, BCY - 10);
          ctx.lineTo(BCX + 80, BCY - 10);
          ctx.stroke();

          // Ornamento
          ctx.font = "12px Georgia";
          ctx.fillStyle = `rgba(255,200,40,${titA * 0.6})`;
          ctx.fillText("✦", bookCenterX, BCY + 8);

          // Firma pequeña en portada
          ctx.shadowBlur = 8;
          ctx.font = `italic 12px 'EB Garamond', Georgia, serif`;
          ctx.fillStyle = `rgba(255,195,40,${titA * 0.55})`;
          ctx.fillText(
            diaEspecial?.firma || "Tu Bebé 💚",
            bookCenterX,
            BCY + 26,
          );

          ctx.textAlign = "left";
          ctx.restore();
        }
        if (t > T_FIRMA) {
          const firmaA = clamp((t - T_FIRMA) / 3, 0, 1);
          ctx.save();
          ctx.globalAlpha = firmaA;
          ctx.textAlign = "center";
          ctx.shadowColor = "rgba(255,200,30,0.9)";
          ctx.shadowBlur = 12;
          ctx.font = `italic bold 44px 'EB Garamond', Georgia, serif`;
          ctx.fillStyle = `rgba(255,215,50,${firmaA})`;
          ctx.fillText(diaEspecial?.firma || "Tu Bebé 💚", W / 2, H * 0.76);
          ctx.textAlign = "left";
          ctx.restore();
        }
      }

      // ── ESTRELLA ──
      if (!s.starInitialized && t >= T_STAR_LAUNCH) {
        initStar();
        s.starInitialized = true;
      }

      if (s.starPhase === "flying") {
        const dt = 1 / 60;
        s.starX += s.starVX * dt;
        s.starY += s.starVY * dt;
        s.starTrail.push({ x: s.starX, y: s.starY });
        if (s.starTrail.length > 60) s.starTrail.shift();
        for (let i = 0; i < s.starTrail.length; i++) {
          const tp = i / s.starTrail.length;
          ctx.globalAlpha = tp * 0.42 * (0.6 + 0.4 * Math.sin(fr * 0.15));
          ctx.fillStyle = "#e0f4ff";
          ctx.beginPath();
          ctx.arc(s.starTrail[i].x, s.starTrail[i].y, tp * 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.save();
        ctx.shadowColor = "#a0d8ff";
        ctx.shadowBlur = 18;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(s.starX, s.starY, 3.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(200,230,255,0.75)";
        ctx.lineWidth = 1;
        [0, 1, 2, 3].forEach((di) => {
          const angle = (di * Math.PI) / 4;
          ctx.beginPath();
          ctx.moveTo(
            s.starX - Math.cos(angle) * 10,
            s.starY - Math.sin(angle) * 10,
          );
          ctx.lineTo(
            s.starX + Math.cos(angle) * 10,
            s.starY + Math.sin(angle) * 10,
          );
          ctx.stroke();
        });
        ctx.restore();
        ctx.globalAlpha = 1;
        const dx = s.starX - HCX,
          dy = s.starY - HCY;
        if (Math.sqrt(dx * dx + dy * dy) < 30) {
          s.starPhase = "glowing";
          s.starGlowR = 5;
        }
      }

      if (s.starPhase === "glowing") {
        s.starGlowR += 3.0;
        const ga = Math.max(0, 1 - s.starGlowR / 170);
        s.heartGlowAlpha = Math.max(s.heartGlowAlpha, 1 - ga);
        ctx.save();
        ctx.globalAlpha = ga * 0.52;
        ctx.strokeStyle = "#ffd0e0";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(HCX, HCY, s.starGlowR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = ga * 0.28;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(HCX, HCY, s.starGlowR * 0.55, 0, Math.PI * 2);
        ctx.stroke();
        const fg = ctx.createRadialGradient(
          HCX,
          HCY,
          0,
          HCX,
          HCY,
          s.starGlowR * 0.75,
        );
        fg.addColorStop(0, `rgba(255,225,235,${ga * 0.5})`);
        fg.addColorStop(0.4, `rgba(220,80,110,${ga * 0.22})`);
        fg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.globalAlpha = 1;
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(HCX, HCY, s.starGlowR * 0.75, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        if (s.starGlowR > 175) {
          s.starPhase = "done";
          s.heartGlowAlpha = 1;
        }
      }

      // ── SUBTÍTULOS ──
      // ── SUBTÍTULOS (Versión Nítida) ──
      let fi = -1;
      for (let i = 0; i < FRASES.length; i++) {
        if (t >= FRASES[i].start && t <= FRASES[i].end) {
          fi = i;
          break;
        }
      }

      if (fi !== -1) {
        const f = FRASES[fi];
        const fadeTime = 0.5;
        let alpha = 1;
        if (t < f.start + fadeTime) alpha = (t - f.start) / fadeTime;
        else if (t > f.end - fadeTime) alpha = (f.end - t) / fadeTime;

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.textAlign = "center";
        ctx.font = "italic 22px 'EB Garamond', Georgia, serif";
        ctx.shadowColor = "rgba(0, 255, 255, 0.8)";
        ctx.shadowBlur = 10;
        ctx.fillStyle = "white";
        ctx.fillText(f.txt, W / 2, H * 0.85);
        ctx.restore();
      }

      if (fr < TOTAL_FRAMES) animRef.current = requestAnimationFrame(render);
    };

    // Render inicial (idle)
    ctx.clearRect(0, 0, W, H);
    const bgI = ctx.createLinearGradient(0, 0, 0, H);
    bgI.addColorStop(0, "#000205");
    bgI.addColorStop(1, "#040008");
    ctx.fillStyle = bgI;
    ctx.fillRect(0, 0, W, H);
    starsRef.current.forEach((st) => {
      ctx.globalAlpha = st.a * 0.4;
      ctx.fillStyle = "#b0d8f5";
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 0.05;
    partsRef.current.slice(0, 300).forEach((p) => {
      ctx.fillStyle = `rgb(${p.hcr},${p.hcg},${p.hcb})`;
      ctx.beginPath();
      ctx.arc(p.htx, p.hty, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    animRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animRef.current);
      audioVozRef.current?.pause();
      audioMusRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    const k = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  return (
    <div className="pluma-overlay">
      <div className="pluma-canvas-wrapper">
        <canvas ref={canvasRef} className="pluma-canvas" />
      </div>
      <ControlesAnimacion
        pausado={pausado}
        progreso={progreso}
        duracionTotal={TOTAL_FRAMES}
        onPausa={handlePausa}
        onBarra={handleBarra}
        onClose={handleClose}
        videoUrl={diaEspecial?.videoUrl}
      />
    </div>
  );
}
