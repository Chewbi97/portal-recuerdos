import React, { useEffect, useRef, useState } from "react";
import ControlesAnimacion from "./ControlesAnimacion";
import { enviarNotificacion } from "../../firebase";
import "./Pluma.css";

// ─── TIMELINE del JSON de Whisper (normalizado) ───────────────────
// Los timestamps se normalizan restando el offset del primer chunk (18.36)
const CHUNKS_RAW = [
  {text:"Mis",start:18.36,end:18.7},{text:"ojos",start:18.7,end:18.8},{text:"de",start:18.8,end:18.8},{text:"primer",start:18.8,end:19.32},{text:"instante",start:19.32,end:19.92},{text:"se",start:19.92,end:20.12},{text:"tornaron",start:20.12,end:20.52},{text:"en",start:20.52,end:20.68},{text:"la",start:20.68,end:20.74},{text:"ventana",start:20.74,end:21.1},{text:"hacia",start:21.1,end:21.4},{text:"un",start:21.4,end:21.54},{text:"mundo",start:21.54,end:21.66},{text:"nuevo,",start:21.66,end:22.22},{text:"colmado",start:22.78,end:23.3},{text:"de",start:23.3,end:23.44},{text:"ilusión",start:23.44,end:23.8},{text:"y",start:23.8,end:23.94},{text:"de",start:23.94,end:24.02},{text:"color.",start:24.02,end:24.32},{text:"Y",start:24.78,end:24.84},{text:"¿por",start:24.84,end:25},{text:"qué?",start:25,end:25.22},{text:"No",start:26.48,end:26.58},{text:"hay",start:26.58,end:26.72},{text:"razón",start:26.72,end:27.02},{text:"que",start:27.02,end:27.38},{text:"lo",start:27.38,end:27.48},{text:"sustente,",start:27.48,end:27.92},{text:"pues",start:28.1,end:28.16},{text:"yo",start:28.16,end:28.38},{text:"ha",start:28.38,end:28.6},{text:"entregado",start:28.6,end:29.02},{text:"siempre",start:29.02,end:29.32},{text:"a",start:29.32,end:29.42},{text:"los",start:29.42,end:29.56},{text:"hechos",start:29.56,end:29.8},{text:"y",start:29.8,end:29.96},{text:"a",start:29.96,end:29.98},{text:"la",start:29.98,end:30.04},{text:"evidencia,",start:30.04,end:30.62},{text:"bimilosica,",start:30.76,end:31.26},{text:"desmoronarse.",start:31.26,end:32.02},{text:"¿Por",start:32.98,end:33.48},{text:"qué?",start:33.48,end:33.74},{text:"¿O",start:34.22,end:34.26},{text:"cómo?",start:34.26,end:34.68},{text:"Hasta",start:36.4,end:36.66},{text:"que",start:36.66,end:36.8},{text:"comprendí",start:36.8,end:37.26},{text:"que",start:37.26,end:37.38},{text:"existían",start:37.38,end:37.82},{text:"conexiones",start:37.82,end:38.3},{text:"que",start:38.3,end:38.52},{text:"no",start:38.52,end:38.62},{text:"requieren",start:38.62,end:38.92},{text:"explicación,",start:38.92,end:39.68},{text:"pues",start:39.96,end:40.08},{text:"su",start:40.08,end:40.24},{text:"lenguaje",start:40.24,end:40.7},{text:"es",start:40.7,end:41.06},{text:"el",start:41.06,end:41.2},{text:"sentir.",start:41.2,end:41.56},{text:"En",start:42.54,end:43.36},{text:"esta",start:43.36,end:43.52},{text:"ocasión,",start:43.52,end:43.8},{text:"mis",start:43.8,end:43.94},{text:"palabras",start:43.94,end:44.16},{text:"rehúsan",start:44.16,end:44.72},{text:"a",start:44.72,end:44.8},{text:"repetir",start:44.8,end:45.28},{text:"lo",start:45.28,end:45.4},{text:"que",start:45.4,end:45.52},{text:"tantas",start:45.52,end:46},{text:"veces",start:46,end:46.18},{text:"ya",start:46.18,end:46.52},{text:"he",start:46.52,end:46.64},{text:"dicho",start:46.64,end:46.92},{text:"prefiero",start:46.92,end:47.84},{text:"dejar",start:48,end:48.2},{text:"a",start:48.2,end:48.3},{text:"mis",start:48.3,end:48.4},{text:"pensamientos",start:48.4,end:49},{text:"al",start:49,end:49.22},{text:"libre",start:49.22,end:49.38},{text:"albedrío",start:49.56,end:50.02},{text:"y",start:50.02,end:51.38},{text:"que",start:51.38,end:51.48},{text:"sean",start:51.48,end:51.7},{text:"las",start:51.7,end:51.92},{text:"letras",start:51.92,end:52.22},{text:"quienes",start:52.22,end:52.5},{text:"tracen",start:52.5,end:52.88},{text:"lo",start:52.88,end:53},{text:"que",start:53,end:53.12},{text:"yo,",start:53.12,end:53.24},{text:"en",start:53.76,end:53.98},{text:"su",start:53.98,end:54.12},{text:"torpeza,",start:54.12,end:54.62},{text:"no",start:54.62,end:54.8},{text:"siempre",start:54.8,end:55.2},{text:"logro",start:55.2,end:55.52},{text:"expresar.",start:55.52,end:56.1},{text:"Despertar",start:57.5,end:58.1},{text:"cada",start:58.1,end:58.32},{text:"mañana",start:58.32,end:58.7},{text:"y",start:58.7,end:58.84},{text:"que",start:58.84,end:58.96},{text:"lo",start:58.96,end:59.1},{text:"primero",start:59.1,end:59.48},{text:"que",start:59.48,end:59.62},{text:"cruce",start:59.62,end:59.9},{text:"mi",start:59.9,end:60.06},{text:"mente",start:60.06,end:60.36},{text:"sea",start:60.36,end:60.62},{text:"cómo",start:60.62,end:60.98},{text:"habrá",start:60.98,end:61.3},{text:"pasado",start:61.3,end:61.64},{text:"su",start:61.64,end:61.82},{text:"noche,",start:61.82,end:62.14},{text:"tomar",start:62.5,end:62.86},{text:"el",start:62.86,end:63},{text:"primer",start:63,end:63.28},{text:"sorbo",start:63.28,end:63.6},{text:"de",start:63.6,end:63.74},{text:"café",start:63.74,end:64.06},{text:"y",start:64.06,end:64.24},{text:"pensar",start:64.24,end:64.62},{text:"ojalá",start:64.62,end:65},{text:"su",start:65,end:65.2},{text:"día",start:65.2,end:65.44},{text:"sea",start:65.44,end:65.7},{text:"benigno,",start:65.7,end:66.2},{text:"son",start:66.5,end:66.72},{text:"hábitos",start:66.72,end:67.14},{text:"que",start:67.14,end:67.3},{text:"en",start:67.3,end:67.46},{text:"antaño",start:67.46,end:67.9},{text:"me",start:67.9,end:68.06},{text:"acompañaban,",start:68.06,end:68.68},{text:"mas",start:68.9,end:69.06},{text:"celebro",start:69.06,end:69.52},{text:"su",start:69.52,end:69.7},{text:"retorno",start:69.7,end:70.18},{text:"y",start:70.18,end:70.66},{text:"nuestro",start:70.66,end:71.18},{text:"pensamiento",start:71.18,end:71.9},{text:"puesto",start:73.22,end:73.52},{text:"en",start:73.52,end:73.76},{text:"la",start:73.76,end:73.84},{text:"más",start:73.84,end:74.04},{text:"excelsa",start:74.04,end:74.48},{text:"estrella",start:74.48,end:74.84},{text:"que",start:74.84,end:75.02},{text:"el",start:75.02,end:75.06},{text:"universo",start:75.06,end:75.38},{text:"pudo",start:75.38,end:75.8},{text:"haberme",start:75.8,end:76.2},{text:"concedido,",start:76.2,end:76.88},{text:"sino",start:76.88,end:78.18},{text:"el",start:78.3,end:78.38},{text:"asombro",start:78.38,end:78.78},{text:"de",start:78.78,end:78.9},{text:"saber",start:78.9,end:79.16},{text:"que",start:79.16,end:79.4},{text:"tan",start:79.4,end:79.62},{text:"bella",start:79.62,end:79.86},{text:"existencia",start:79.86,end:80.6},{text:"coincide",start:80.6,end:81.24},{text:"de",start:81.24,end:81.4},{text:"algún",start:81.4,end:81.56},{text:"modo",start:81.56,end:81.84},{text:"con",start:81.84,end:82.02},{text:"la",start:82.02,end:82.18},{text:"mía.",start:82.18,end:82.52},{text:"No",start:82.52,end:84.02},{text:"enalzo",start:84.02,end:84.52},{text:"tu",start:84.52,end:84.68},{text:"imagen",start:84.68,end:85.08},{text:"por",start:85.08,end:85.54},{text:"encima",start:85.54,end:85.94},{text:"de",start:85.94,end:86.22},{text:"la",start:86.22,end:86.34},{text:"mía,",start:86.34,end:86.64},{text:"ni",start:86.64,end:87.86},{text:"pretendo",start:87.86,end:88.24},{text:"tal",start:88.24,end:88.46},{text:"cosa,",start:88.46,end:88.86},{text:"mas",start:88.86,end:89.4},{text:"la",start:89.4,end:89.56},{text:"admiración",start:89.56,end:89.92},{text:"es",start:109.98,end:110.3},{text:"que",start:110.3,end:110.5},{text:"cada",start:110.5,end:110.8},{text:"latido",start:110.8,end:111.2},{text:"de",start:111.2,end:111.4},{text:"tu",start:111.4,end:111.6},{text:"corazón,",start:111.6,end:112.1},{text:"cada",start:112.1,end:112.4},{text:"átomo",start:112.4,end:112.9},{text:"de",start:112.9,end:113.1},{text:"tu",start:113.1,end:113.3},{text:"ser,",start:113.3,end:113.8},{text:"cada",start:113.8,end:114.1},{text:"gesto,",start:114.1,end:114.6},{text:"dimana",start:114.6,end:115.1},{text:"de",start:150.7,end:150.82},{text:"tu",start:153.2,end:153.34},{text:"bebé",start:153.34,end:153.58},{text:"que",start:153.58,end:153.7},{text:"tanto",start:153.7,end:153.9},{text:"te",start:153.9,end:154.1},{text:"quiere,",start:154.1,end:154.34},{text:"con",start:154.44,end:154.54},{text:"intención",start:154.54,end:154.98},{text:"sincera",start:154.98,end:155.44},{text:"de",start:155.44,end:155.56},{text:"amarte.",start:155.56,end:156.02},{text:"Para",start:157.48,end:157.74},{text:"la",start:157.74,end:157.9},{text:"princesa,",start:157.9,end:158.7},{text:"quien",start:158.7,end:159.2},{text:"sabe",start:159.2,end:159.56},{text:"cómo",start:159.56,end:160.58},{text:"ni",start:160.58,end:160.76},{text:"por",start:160.76,end:160.94},{text:"qué",start:160.94,end:161.14},{text:"se",start:161.14,end:161.78},{text:"ha",start:161.78,end:161.86},{text:"convertido",start:161.86,end:162.36},{text:"en",start:162.36,end:162.46},{text:"el",start:162.46,end:162.62},{text:"centro",start:162.62,end:163},{text:"de",start:163,end:163.78},{text:"mi",start:163.78,end:163.9},{text:"corazón.",start:163.9,end:164.24}
];

const OFFSET = CHUNKS_RAW[0].start;
const TIMELINE = CHUNKS_RAW.map(c => ({
  text: c.text.trim(),
  start: c.start - OFFSET,
  end: c.end - OFFSET,
}));

const DURACION_AUDIO = TIMELINE[TIMELINE.length - 1].end + 2;
const FPS = 60;
const DURACION_TOTAL = Math.ceil((DURACION_AUDIO + 4) * FPS); // +4s de outro

// ─── HELPERS ─────────────────────────────────────────────────────
const lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));
const easeInOut = (t) => t < 0.5 ? 2*t*t : -1 + (4 - 2*t)*t;
const easeOut = (t) => 1 - (1-t)*(1-t);

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────
function Pluma({ diaEspecial, onClose }) {
  const canvasRef = useRef(null);
  const audioVozRef = useRef(null);
  const audioMusRef = useRef(null);
  const animRef = useRef(null);
  const frameRef = useRef(0);
  const pausadoRef = useRef(false);
  const loopStartRef = useRef(null);
  const vozIniciada = useRef(false);

  // Estado de escritura
  const textoEscritoRef = useRef([]);   // palabras ya escritas [{text, x, y, linea}]
  const palabraActualRef = useRef(null);
  const progPalabraRef = useRef(0);

  // Pluma
  const plumaRef = useRef({ x: 0, y: 0, angulo: -30, estado: 'inicio' });

  const [pausado, setPausado] = useState(false);
  const [progreso, setProgreso] = useState(0);

  // ── Fade música ──────────────────────────────────────────────────
  const fadeMusica = (de, a, ms) => {
    if (!audioMusRef.current) return;
    const n = 40, d = (a - de) / n;
    let i = 0;
    const t = setInterval(() => {
      i++;
      if (audioMusRef.current)
        audioMusRef.current.volume = Math.max(0, Math.min(1, de + d * i));
      if (i >= n) clearInterval(t);
    }, ms / n);
  };

  const handleClose = () => {
    cancelAnimationFrame(animRef.current);
    audioMusRef.current?.pause();
    audioVozRef.current?.pause();
    onClose();
  };

  const handlePausa = () => {
    pausadoRef.current = !pausadoRef.current;
    setPausado(pausadoRef.current);
    if (pausadoRef.current) {
      audioMusRef.current?.pause();
      audioVozRef.current?.pause();
    } else {
      loopStartRef.current = null;
      audioMusRef.current?.play().catch(() => {});
      if (vozIniciada.current) audioVozRef.current?.play().catch(() => {});
    }
  };

  const handleBarra = (val) => {
    frameRef.current = val;
    setProgreso(val);
    loopStartRef.current = null;
    vozIniciada.current = false;
    textoEscritoRef.current = [];
    palabraActualRef.current = null;

    const segActual = val / FPS;
    if (audioMusRef.current) {
      audioMusRef.current.currentTime = Math.min(segActual, audioMusRef.current.duration || 999);
      const enVoz = segActual >= 0 && segActual <= DURACION_AUDIO;
      audioMusRef.current.volume = enVoz ? 0.12 : 0.35;
      if (!pausadoRef.current) audioMusRef.current.play().catch(() => {});
    }
    if (segActual > 0 && audioVozRef.current) {
      audioVozRef.current.currentTime = Math.min(segActual, audioVozRef.current.duration || 0);
      if (!pausadoRef.current) audioVozRef.current.play().catch(() => {});
      vozIniciada.current = true;
    } else if (audioVozRef.current) {
      audioVozRef.current.pause();
      audioVozRef.current.currentTime = 0;
    }
  };

  useEffect(() => {
    const k = (e) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Audio
    if (diaEspecial.musicaUrl) {
      audioMusRef.current = new Audio(diaEspecial.musicaUrl);
      audioMusRef.current.loop = true;
      audioMusRef.current.volume = 0.35;
      audioMusRef.current.play().catch(() => {});
    }
    if (diaEspecial.audioUrl) {
      audioVozRef.current = new Audio(diaEspecial.audioUrl);
      audioVozRef.current.volume = 1;
      audioVozRef.current.preload = "auto";
    }

    enviarNotificacion(`✒️ ${diaEspecial.titulo}`, diaEspecial.descripcionGaleria || "").catch(() => {});

    // ── Funciones de dibujo ───────────────────────────────────────

    const dibujarFondo = () => {
      const W = canvas.width, H = canvas.height;
      // Fondo oscuro cálido — como una mesa de madera antigua
      const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H)*0.8);
      grad.addColorStop(0, '#2C1A0E');
      grad.addColorStop(0.6, '#1A0F07');
      grad.addColorStop(1, '#0D0703');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Viñeta en esquinas
      const vig = ctx.createRadialGradient(W/2, H/2, H*0.3, W/2, H/2, H*0.85);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.6)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);
    };

    const dibujarPergamino = (W, H) => {
      const pw = Math.min(W * 0.72, 720);
      const ph = Math.min(H * 0.82, 900);
      const px = (W - pw) / 2;
      const py = (H - ph) / 2;

      ctx.save();

      // Sombra del pergamino
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetX = 8;
      ctx.shadowOffsetY = 12;

      // Forma del pergamino con bordes irregulares (curvatura de papel antiguo)
      ctx.beginPath();
      // Esquina superior izquierda — enrollada
      ctx.moveTo(px + 18, py + 12);
      ctx.bezierCurveTo(px + 8, py + 4, px + 2, py + 8, px + 6, py + 20);
      // Borde superior con ondulaciones sutiles
      ctx.bezierCurveTo(px + pw*0.15, py - 4, px + pw*0.3, py + 6, px + pw*0.45, py + 2);
      ctx.bezierCurveTo(px + pw*0.6, py - 2, px + pw*0.75, py + 5, px + pw - 14, py + 8);
      // Esquina superior derecha — ligeramente doblada
      ctx.bezierCurveTo(px + pw - 4, py + 4, px + pw - 2, py + 10, px + pw - 8, py + 22);
      // Borde derecho con micro-ondulaciones
      ctx.bezierCurveTo(px + pw + 3, py + ph*0.25, px + pw - 5, py + ph*0.5, px + pw + 2, py + ph*0.75);
      ctx.bezierCurveTo(px + pw - 3, py + ph*0.88, px + pw + 4, py + ph - 20, px + pw - 10, py + ph - 10);
      // Esquina inferior derecha
      ctx.bezierCurveTo(px + pw - 2, py + ph - 4, px + pw - 6, py + ph - 2, px + pw - 20, py + ph - 6);
      // Borde inferior
      ctx.bezierCurveTo(px + pw*0.75, py + ph + 4, px + pw*0.5, py + ph - 3, px + pw*0.25, py + ph + 2);
      ctx.bezierCurveTo(px + pw*0.12, py + ph - 1, px + 22, py + ph + 3, px + 12, py + ph - 8);
      // Esquina inferior izquierda — ligeramente doblada hacia adentro
      ctx.bezierCurveTo(px + 4, py + ph - 4, px + 2, py + ph - 10, px + 8, py + ph - 22);
      // Borde izquierdo
      ctx.bezierCurveTo(px - 3, py + ph*0.75, px + 5, py + ph*0.5, px - 2, py + ph*0.25);
      ctx.closePath();

      // Relleno base del pergamino — degradado cálido
      const pergGrad = ctx.createLinearGradient(px, py, px + pw, py + ph);
      pergGrad.addColorStop(0, '#F2E0C4');
      pergGrad.addColorStop(0.3, '#EDD8B8');
      pergGrad.addColorStop(0.6, '#E8D0A8');
      pergGrad.addColorStop(0.85, '#EDD5B0');
      pergGrad.addColorStop(1, '#E5CB9F');
      ctx.fillStyle = pergGrad;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Textura de papel — líneas horizontales muy sutiles (renglones)
      ctx.save();
      ctx.clip(); // Solo dentro del pergamino
      ctx.globalAlpha = 0.06;
      ctx.strokeStyle = '#8B6914';
      ctx.lineWidth = 0.5;
      for (let ly = py + 60; ly < py + ph - 40; ly += 28) {
        ctx.beginPath();
        ctx.moveTo(px + 30, ly);
        ctx.lineTo(px + pw - 30, ly);
        ctx.stroke();
      }

      // Manchas de envejecimiento
      ctx.globalAlpha = 0.04;
      const manchas = [
        {x: px + 40, y: py + 80, r: 25},
        {x: px + pw - 60, y: py + 120, r: 18},
        {x: px + 80, y: py + ph - 100, r: 30},
        {x: px + pw*0.6, y: py + ph*0.7, r: 22},
        {x: px + pw*0.3, y: py + ph*0.4, r: 15},
      ];
      manchas.forEach(m => {
        const mg = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r);
        mg.addColorStop(0, '#8B5E1A');
        mg.addColorStop(1, 'rgba(139,94,26,0)');
        ctx.fillStyle = mg;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI*2);
        ctx.fill();
      });

      // Curvatura del papel — sombra interna en los bordes
      ctx.globalAlpha = 0.12;
      const curvIzq = ctx.createLinearGradient(px, py, px + 60, py);
      curvIzq.addColorStop(0, 'rgba(0,0,0,0.4)');
      curvIzq.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = curvIzq;
      ctx.fillRect(px, py, 60, ph);

      const curvDer = ctx.createLinearGradient(px + pw - 60, py, px + pw, py);
      curvDer.addColorStop(0, 'rgba(0,0,0,0)');
      curvDer.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx.fillStyle = curvDer;
      ctx.fillRect(px + pw - 60, py, 60, ph);

      const curvTop = ctx.createLinearGradient(px, py, px, py + 50);
      curvTop.addColorStop(0, 'rgba(0,0,0,0.25)');
      curvTop.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = curvTop;
      ctx.fillRect(px, py, pw, 50);

      ctx.restore();

      // Borde del pergamino
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = '#A07830';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();

      return { px, py, pw, ph };
    };

    const dibujarTarro = (px, py, ph, frame) => {
      const tx = px - 10;
      const ty = py + ph - 200;
      const tw = 70, th = 100;

      ctx.save();

      // Sombra del tarro
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 4;
      ctx.shadowOffsetY = 6;

      // Cuerpo del tarro — cilindro con perspectiva
      const tarroGrad = ctx.createLinearGradient(tx, ty, tx + tw, ty);
      tarroGrad.addColorStop(0, '#5C3D1E');
      tarroGrad.addColorStop(0.25, '#8B6340');
      tarroGrad.addColorStop(0.5, '#A07848');
      tarroGrad.addColorStop(0.75, '#7A5530');
      tarroGrad.addColorStop(1, '#4A2E12');
      ctx.fillStyle = tarroGrad;
      ctx.beginPath();
      ctx.roundRect(tx, ty + 20, tw, th - 20, [4, 4, 8, 8]);
      ctx.fill();

      // Líneas de textura de madera
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.2;
      ctx.strokeStyle = '#3A1E08';
      ctx.lineWidth = 0.8;
      for (let lx = tx + 8; lx < tx + tw - 8; lx += 6) {
        ctx.beginPath();
        ctx.moveTo(lx, ty + 22);
        ctx.lineTo(lx, ty + th - 2);
        ctx.stroke();
      }

      // Tapa metálica
      ctx.globalAlpha = 1;
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 8;
      const tapaGrad = ctx.createLinearGradient(tx, ty, tx + tw, ty + 22);
      tapaGrad.addColorStop(0, '#8A8A8A');
      tapaGrad.addColorStop(0.3, '#C8C8C8');
      tapaGrad.addColorStop(0.6, '#9A9A9A');
      tapaGrad.addColorStop(1, '#6A6A6A');
      ctx.fillStyle = tapaGrad;
      ctx.beginPath();
      ctx.roundRect(tx - 3, ty + 10, tw + 6, 18, 4);
      ctx.fill();

      // Elipse superior de la tapa
      ctx.beginPath();
      ctx.ellipse(tx + tw/2, ty + 10, tw/2 + 2, 8, 0, 0, Math.PI*2);
      ctx.fillStyle = '#B0B0B0';
      ctx.fill();

      // Tinta dentro del tarro — nivel oscuro
      ctx.shadowBlur = 0;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(tx + 3, ty + 28, tw - 6, th - 32, [0, 0, 6, 6]);
      ctx.clip();
      ctx.fillStyle = '#1A1008';
      ctx.fillRect(tx + 3, ty + 50, tw - 6, th - 52);
      // Reflejo en la tinta
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#8B7355';
      ctx.fillRect(tx + 8, ty + 52, 12, th - 56);
      ctx.restore();

      ctx.restore();
      return { tx: tx + tw/2, ty: ty + 15 }; // punto de mojado
    };

    const dibujarPluma = (x, y, angulo, mojada) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angulo * Math.PI / 180);

      const largo = 180;
      const grosorCano = 7;

      // Sombra de la pluma
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 3;

      // Cañón de madera
      const canoGrad = ctx.createLinearGradient(0, -grosorCano/2, 0, grosorCano/2);
      canoGrad.addColorStop(0, '#8B6340');
      canoGrad.addColorStop(0.4, '#C49A6C');
      canoGrad.addColorStop(0.7, '#A07848');
      canoGrad.addColorStop(1, '#6B4A28');
      ctx.fillStyle = canoGrad;
      ctx.beginPath();
      ctx.roundRect(-largo * 0.7, -grosorCano/2, largo * 0.75, grosorCano, 3);
      ctx.fill();

      // Anillo metálico
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#B8A070';
      ctx.beginPath();
      ctx.roundRect(-largo*0.7 + largo*0.7 - 8, -grosorCano/2 - 1, 10, grosorCano + 2, 1);
      ctx.fill();

      // Plumilla — forma de gota/punta
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 4;
      const plumGrad = ctx.createLinearGradient(0, -4, 0, 4);
      plumGrad.addColorStop(0, '#2A2A2A');
      plumGrad.addColorStop(0.5, '#4A4A4A');
      plumGrad.addColorStop(1, '#1A1A1A');
      ctx.fillStyle = plumGrad;
      ctx.beginPath();
      ctx.moveTo(largo * 0.05, -grosorCano/2 + 1);
      ctx.bezierCurveTo(largo * 0.25, -5, largo * 0.45, -2, largo * 0.55, 0);
      ctx.bezierCurveTo(largo * 0.45, 2, largo * 0.25, 5, largo * 0.05, grosorCano/2 - 1);
      ctx.closePath();
      ctx.fill();

      // Hendidura de la plumilla
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#0A0A0A';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(largo * 0.1, 0);
      ctx.lineTo(largo * 0.52, 0);
      ctx.stroke();

      // Tinta en la punta si está mojada
      if (mojada) {
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = '#1A0A00';
        ctx.beginPath();
        ctx.ellipse(largo * 0.48, 0, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        // Gota colgante
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(largo * 0.53, 3, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    // ── Layout del texto en el pergamino ─────────────────────────
    let layoutCalculado = false;
    let wordLayout = []; // [{text, x, y, width}]

    const calcularLayout = (px, py, pw, ph) => {
      if (layoutCalculado) return;
      layoutCalculado = true;

      const fontSize = Math.max(16, Math.min(22, pw * 0.038));
      ctx.font = `italic ${fontSize}px 'EB Garamond', Georgia, serif`;

      const margenIzq = px + pw * 0.12;
      const margenDer = px + pw * 0.88;
      const yInicio = py + ph * 0.12;
      const lineHeight = fontSize * 1.75;
      const espacioPalabra = fontSize * 0.35;

      let cx2 = margenIzq;
      let cy2 = yInicio;

      TIMELINE.forEach((chunk) => {
        const txt = chunk.text;
        const w = ctx.measureText(txt).width;

        if (cx2 + w > margenDer) {
          cx2 = margenIzq;
          cy2 += lineHeight;
        }

        wordLayout.push({
          text: txt,
          x: cx2,
          y: cy2,
          width: w,
          start: chunk.start,
          end: chunk.end,
          fontSize,
        });

        cx2 += w + espacioPalabra;
      });
    };

    const dibujarTextoEscrito = (tiempoActual, px, py, pw, ph) => {
      const fontSize = wordLayout[0]?.fontSize || 20;
      ctx.save();
      ctx.font = `italic ${fontSize}px 'EB Garamond', Georgia, serif`;
      ctx.fillStyle = '#1C0F05';
      ctx.shadowColor = 'rgba(0,0,0,0.15)';
      ctx.shadowBlur = 1;
      ctx.shadowOffsetX = 0.5;
      ctx.shadowOffsetY = 0.5;

      let plumaX = null, plumaY = null;
      let plumaAngulo = -25;
      let mojada = false;

      wordLayout.forEach((word, idx) => {
        if (tiempoActual >= word.end) {
          // Palabra completamente escrita
          ctx.globalAlpha = 0.92;
          ctx.fillText(word.text, word.x, word.y);
          plumaX = word.x + word.width + 4;
          plumaY = word.y;
          mojada = true;
        } else if (tiempoActual >= word.start) {
          // Palabra escribiéndose
          const prog = (tiempoActual - word.start) / Math.max(0.01, word.end - word.start);
          const letrasAMostrar = Math.ceil(word.text.length * prog);
          const textoParc = word.text.slice(0, letrasAMostrar);
          ctx.globalAlpha = 0.92;
          ctx.fillText(textoParc, word.x, word.y);
          const wParc = ctx.measureText(textoParc).width;
          plumaX = word.x + wParc + 2;
          plumaY = word.y;
          mojada = true;
        }
      });

      ctx.restore();
      return { plumaX, plumaY, plumaAngulo, mojada };
    };

    // ── LOOP PRINCIPAL ────────────────────────────────────────────
    const loop = (timestamp) => {
      if (pausadoRef.current) {
        animRef.current = requestAnimationFrame(loop);
        return;
      }

      if (!loopStartRef.current) {
        loopStartRef.current = timestamp - (frameRef.current / FPS) * 1000;
      }
      const seg = (timestamp - loopStartRef.current) / 1000;
      frameRef.current = Math.min(Math.floor(seg * FPS), DURACION_TOTAL);
      const tiempoActual = seg;

      const W = canvas.width, H = canvas.height;

      // Limpiar
      ctx.clearRect(0, 0, W, H);
      dibujarFondo();

      const { px, py, pw, ph } = dibujarPergamino(W, H);
      const tarroPos = dibujarTarro(px, py, ph, frameRef.current);

      // Calcular layout una vez que tenemos dimensiones
      calcularLayout(px, py, pw, ph);

      // Fase 1 (0-2s): Pluma va al tarro
      // Fase 2 (2s+): Escribe sincronizado con voz
      let plumaX, plumaY, plumaAng, mojada;

      const plumaInicioX = px + pw + 30;
      const plumaInicioY = py + 40;

      if (tiempoActual < 0.5) {
        // Pluma aparece en reposo
        plumaX = plumaInicioX;
        plumaY = plumaInicioY;
        plumaAng = -30;
        mojada = false;

      } else if (tiempoActual < 1.2) {
        // Pluma se mueve hacia el tarro
        const t = easeInOut((tiempoActual - 0.5) / 0.7);
        plumaX = lerp(plumaInicioX, tarroPos.tx - 60, t);
        plumaY = lerp(plumaInicioY, tarroPos.ty + 10, t);
        plumaAng = lerp(-30, -60, t);
        mojada = false;

      } else if (tiempoActual < 1.6) {
        // Pluma moja en el tarro
        const t = easeInOut((tiempoActual - 1.2) / 0.4);
        plumaX = tarroPos.tx - 60;
        plumaY = lerp(tarroPos.ty + 10, tarroPos.ty + 25, t);
        plumaAng = -65;
        mojada = t > 0.5;

      } else if (tiempoActual < 2.2) {
        // Pluma vuelve al papel
        const t = easeOut((tiempoActual - 1.6) / 0.6);
        const primeraX = wordLayout[0]?.x - 20 || px + pw*0.12;
        const primeraY = wordLayout[0]?.y || py + ph*0.12;
        plumaX = lerp(tarroPos.tx - 60, primeraX, t);
        plumaY = lerp(tarroPos.ty + 20, primeraY, t);
        plumaAng = lerp(-65, -25, t);
        mojada = true;

        // Arrancar voz y bajar música
        if (!vozIniciada.current && tiempoActual > 1.8 && audioVozRef.current) {
          audioVozRef.current.currentTime = 0;
          audioVozRef.current.play().catch(() => {});
          vozIniciada.current = true;
          fadeMusica(0.35, 0.12, 1500);
          audioVozRef.current.addEventListener("ended", () => fadeMusica(0.12, 0.35, 2000), { once: true });
        }

      } else {
        // Escribe — sincronizado con el audio de voz
        const vozTime = tiempoActual - 2.2; // offset de cuando arranca la voz
        const resultado = dibujarTextoEscrito(vozTime, px, py, pw, ph);
        plumaX = resultado.plumaX || (wordLayout[0]?.x || px + pw*0.12);
        plumaY = resultado.plumaY || (wordLayout[0]?.y || py + ph*0.12);
        plumaAng = resultado.plumaAngulo;
        mojada = resultado.mojada;

        // Outro — pluma descansa
        if (vozTime > DURACION_AUDIO + 0.5) {
          const tOutro = Math.min((vozTime - DURACION_AUDIO - 0.5) / 2, 1);
          plumaX = lerp(plumaX, plumaX + 60, easeOut(tOutro));
          plumaAng = lerp(-25, 10, easeOut(tOutro));
        }
      }

      // Dibujar pluma
      if (plumaX !== null) {
        dibujarPluma(plumaX, plumaY, plumaAng, mojada);
      }

      setProgreso(frameRef.current);
      if (frameRef.current < DURACION_TOTAL) {
        animRef.current = requestAnimationFrame(loop);
      }
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      audioMusRef.current?.pause();
      audioVozRef.current?.pause();
    };
  }, []);

  return (
    <div className="pluma-overlay">
      <canvas ref={canvasRef} className="pluma-canvas" />
      <ControlesAnimacion
        pausado={pausado}
        progreso={progreso}
        duracionTotal={DURACION_TOTAL}
        onPausa={handlePausa}
        onBarra={handleBarra}
        onClose={handleClose}
        videoUrl={diaEspecial.videoUrl}
      />
    </div>
  );
}

export default Pluma;