import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Misojitosyo.css";

const URL_CANCION =
  "https://firebasestorage.googleapis.com/v0/b/portal-de-recuerdos.firebasestorage.app/o/diasEspeciales%2Fmusica%2FDonde%20Vive%20la%20Inmensidad.mp3.mpeg?alt=media";

// ── Función del corazón optimizada ──
function puntoCorazon(x, A, k) {
  if (Math.abs(x) >= Math.sqrt(6)) return null;
  const raiz = Math.sqrt(6 - x * x);
  const base = Math.pow(Math.abs(x), 4 / 9);
  return base + A * Math.cos(k * x) * raiz;
}

// Mapea coordenadas matemáticas a canvas
function toCanvas(mx, my, cx, cy, escala) {
  return {
    px: cx + mx * escala,
    py: cy - my * escala,
  };
}

export default function MisOjitosYo() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // audioSourceRef guardará el nodo vivo BufferSource de Web Audio
  const audioSourceRef = useRef(null);
  const animRef = useRef(null);
  const analyserRef = useRef(null);
  const audioCtxRef = useRef(null);
  const dataArrayRef = useRef(null);
  const faseRef = useRef("intro");

  const [fase, setFase] = useState("intro");
  const [fraseBrillando, setFraseBrillando] = useState(false);
  const [cargando, setCargando] = useState(false); // Estado visual por si el fetch tarda en móvil

  const kRef = useRef(-87.3);
  const amplRef = useRef(0.8);
  const tiempoRef = useRef(0);

  // ── Loop de canvas ──
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const dibujarCorazon = (A, k, glow, color) => {
      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const cy = H * 0.53; // Mantiene tu ajuste perfecto para que no tape las letras
      const escala = Math.min(W, H) * 0.15;

      const PASOS = 600;
      const xMin = -Math.sqrt(6) + 0.001;
      const xMax = Math.sqrt(6) - 0.001;
      const paso = (xMax - xMin) / PASOS;

      ctx.beginPath();
      let primero = true;
      for (let i = 0; i <= PASOS; i++) {
        const x = xMin + i * paso;
        const y = puntoCorazon(x, A, k);
        if (y === null) continue;
        const { px, py } = toCanvas(x, y, cx, cy, escala);
        if (primero) {
          ctx.moveTo(px, py);
          primero = false;
        } else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.6;
      ctx.shadowBlur = glow;
      ctx.shadowColor = color;
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    const loop = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(0, 0, W, H);

      tiempoRef.current += 0.012;

      let A = amplRef.current;
      let k = kRef.current;
      let glow = 12;
      let color = "#4dff91";

      if (faseRef.current === "intro") {
        const pulso = Math.sin(tiempoRef.current * 0.8);
        A = 0.8 + pulso * 0.25;
        k = -87.3 + pulso * 15;
        glow = 14 + pulso * 8;
        color = `rgba(77,255,145,${0.75 + pulso * 0.25})`;
      } else if (faseRef.current === "cancion" && analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        const arr = dataArrayRef.current;
        const len = arr.length;

        let sum = 0;
        for (let i = 0; i < len; i++) sum += arr[i];
        const vol = sum / len / 255;

        let maxVal = 0,
          maxIdx = 0;
        for (let i = 0; i < len; i++) {
          if (arr[i] > maxVal) {
            maxVal = arr[i];
            maxIdx = i;
          }
        }
        const freqNorm = maxIdx / len;

        A = 0.5 + vol * 1.2;
        k = -87.3 - freqNorm * 80 - vol * 40;
        glow = 10 + vol * 30;
        const bright = Math.floor(145 + vol * 110);
        color = `rgba(77,255,${Math.min(bright, 255)},${0.8 + vol * 0.2})`;
        amplRef.current = A;
        kRef.current = k;
      } else if (faseRef.current === "frase") {
        const pulso = Math.sin(tiempoRef.current * 0.5);
        A = 0.6 + pulso * 0.15;
        k = -87.3 + pulso * 8;
        glow = 8 + pulso * 4;
        color = `rgba(77,255,145,0.5)`;
      }

      dibujarCorazon(A, k, glow, color);
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  // ── Iniciar canción — Método definitivo por Fetch & Buffer para móviles ──
  const iniciarCancion = async () => {
    if (cargando || faseRef.current !== "intro") return;

    // Inicializar AudioContext al instante de recibir el click (Requisito móvil)
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (
        window.AudioContext || window.webkitAudioContext
      )();
    }

    if (audioCtxRef.current.state === "suspended") {
      await audioCtxRef.current.resume();
    }

    setCargando(true);

    try {
      // Descarga el archivo de Firebase directo a la memoria como binario libre de bloqueos CORS de video/audio tag
      const respuesta = await fetch(URL_CANCION);
      const arrayBuffer = await respuesta.arrayBuffer();

      // Decodifica las frecuencias en el procesador del teléfono
      const audioBuffer =
        await audioCtxRef.current.decodeAudioData(arrayBuffer);

      // Crear Analizador
      const analyser = audioCtxRef.current.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

      // Crear Fuente Pura
      const source = audioCtxRef.current.createBufferSource();
      source.buffer = audioBuffer;

      // Conexión directa del flujo
      source.connect(analyser);
      analyser.connect(audioCtxRef.current.destination);

      audioSourceRef.current = source;

      // Transición de interfaz
      faseRef.current = "cancion";
      setFase("cancion");
      setCargando(false);

      // Iniciar reproducción
      source.start(0);

      // Evento de fin de canción
      source.onended = () => {
        faseRef.current = "frase";
        setFase("frase");
        setTimeout(() => setFraseBrillando(true), 300);
      };
    } catch (e) {
      console.error("Fallo de decodificación o descarga en el móvil:", e);
      setCargando(false);
      faseRef.current = "intro";
      setFase("intro");
    }
  };

  const handleSalir = () => {
    cancelAnimationFrame(animRef.current);

    // Detener el BufferSource puro de manera segura
    try {
      audioSourceRef.current?.stop();
    } catch (e) {
      // Evita crasheos si la canción no había empezado
    }

    if (audioCtxRef.current) {
      audioCtxRef.current.close();
    }
    navigate("/dashboard");
  };

  return (
    <div className="moy-overlay">
      <canvas ref={canvasRef} className="moy-canvas" />

      {/* Salir */}
      <button className="moy-salir" onClick={handleSalir}>
        ✕
      </button>

      {/* Nombre de la canción — siempre visible */}
      <div className="moy-nombre-cancion">
        <p className="moy-nombre-texto">Donde Vive la Inmensidad</p>
      </div>

      {/* Título — solo en intro */}
      {fase === "intro" && (
        <div className="moy-intro">
          <p className="moy-titulo">Mis ojitos, yo...</p>
          <button
            className="moy-btn-play"
            onClick={iniciarCancion}
            disabled={cargando}
            style={{ opacity: cargando ? 0.5 : 1 }}
          >
            {cargando ? "..." : "▶"}
          </button>
          <p className="moy-hint">
            {cargando ? "cargando audio..." : "toca para escuchar"}
          </p>
        </div>
      )}

      {/* Frase final */}
      {fase === "frase" && (
        <p
          className={`moy-frase-final ${fraseBrillando ? "moy-frase-final--visible" : ""}`}
        >
          Te Amo Mis Ojitos 💚
        </p>
      )}
    </div>
  );
}
