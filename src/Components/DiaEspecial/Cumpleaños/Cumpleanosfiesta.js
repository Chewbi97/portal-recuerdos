import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";
import "./Cumpleanosfiesta.css";

const TOTAL_SOPLOS = 15;
const DURACION_DESEO_TOTAL = 10000; // ms que "Pide tu deseo" permanece en pantalla
const SPEED_DESEO = 0.017; // ~3s en armarse
const SPEED_FELIZ = 0.01; // ~5s en armarse
const SPEED_CORAZON = 0.005; // ~10s en armarse
const ALPHA_SPEED = 0.05; // velocidad de fade in/out
const FADE_INICIO = 20; // segundos antes del final donde aparece la frase + fade

// ════════════════════════════════════════════════════════════════════════
// PARTÍCULAS DE TEXTO — muestreo de pixeles desde un canvas oculto
// ════════════════════════════════════════════════════════════════════════
function muestrearTexto(texto, fontSize, font, W, H, yPos, maxPts = 1500) {
  const off = document.createElement("canvas");
  off.width = W;
  off.height = H;
  const ctx = off.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.font = `${fontSize}px '${font}', cursive`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(texto, W / 2, yPos, W * 0.94);
  const data = ctx.getImageData(0, 0, W, H).data;
  const pts = [];
  const step = 2; // más denso = más legible
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      if (data[(y * W + x) * 4 + 3] > 90) pts.push({ x, y });
    }
  }
  if (pts.length <= maxPts) return pts;
  const out = [];
  const skip = Math.ceil(pts.length / maxPts);
  for (let i = 0; i < pts.length; i += skip) out.push(pts[i]);
  return out;
}

// ════════════════════════════════════════════════════════════════════════
// CORAZÓN — curva paramétrica clásica
// ════════════════════════════════════════════════════════════════════════
function puntosCorazon(n, cx, cy, escala) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t)
    );
    const r = 0.55 + Math.random() * 0.45;
    pts.push({ x: cx + x * escala * r, y: cy + y * escala * r });
  }
  return pts;
}

// ── Dibuja y actualiza un array de partículas en el canvas ──
function actualizarYDibujar(ctx, parts) {
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    p.x += (p.tx - p.x) * p.speed;
    p.y += (p.ty - p.y) * p.speed;
    p.alpha += (p.targetAlpha - p.alpha) * ALPHA_SPEED;
    if (p.alpha < 0.01) continue;

    const twinkle = 0.78 + 0.22 * Math.sin(performance.now() * 0.0025 + p.fase);

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${p.col},${p.alpha * twinkle})`;
    ctx.shadowBlur = 3;
    ctx.shadowColor = `rgba(${p.col},0.6)`;
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

// ════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════
export default function CumpleanosFiesta() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const animRef = useRef(null);
  const fadeIntervalRef = useRef(null);

  const [fase, setFase] = useState("pastel"); // pastel | deseo | fiesta | final
  const [soplos, setSoplos] = useState(0);
  const [fotos, setFotos] = useState([]);
  const [fotosVisibles, setFotosVisibles] = useState([]);
  const [mostrarFrase, setMostrarFrase] = useState(false);
  const [mostrarFinal, setMostrarFinal] = useState(false);

  // Grupo 1: partículas centrales — "Pide tu deseo" → luego corazón
  const particlesRef = useRef([]);
  // Grupo 2: "Feliz Cumpleaños" — fijo en la parte superior durante la fiesta
  const headerRef = useRef([]);

  // ── Cargar fotos de Firebase Storage ──
  useEffect(() => {
    const storage = getStorage();
    listAll(ref(storage, "cumpleaños"))
      .then(async (res) => {
        const urls = await Promise.all(
          res.items.map((item) => getDownloadURL(item)),
        );
        setFotos(urls);
      })
      .catch(() => setFotos([]));
  }, []);

  // ────────────────────────────────────────────────────────────────────
  // CANVAS — loop de render
  // ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const loop = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.fillStyle = "rgba(0,0,0,0.16)";
      ctx.fillRect(0, 0, W, H);

      actualizarYDibujar(ctx, particlesRef.current);
      actualizarYDibujar(ctx, headerRef.current);

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  // ── Crea/actualiza partículas de un array hacia un texto ──
  const formarTextoEn = useCallback(
    (
      targetRef,
      texto,
      yFrac,
      fontSizeFrac,
      colVerde,
      speed,
      targetAlpha = 1,
    ) => {
      const canvas = canvasRef.current;
      const W = canvas.width;
      const H = canvas.height;
      const fontSize = Math.max(34, W * fontSizeFrac);
      const targets = muestrearTexto(
        texto,
        fontSize,
        "Great Vibes",
        W,
        H,
        H * yFrac,
      );
      const col = colVerde ? "126,217,87" : "240,192,64";

      const parts = targetRef.current;
      if (parts.length < targets.length) {
        for (let i = parts.length; i < targets.length; i++) {
          parts.push({
            x: Math.random() * W,
            y: Math.random() * H,
            tx: 0,
            ty: 0,
            r: 1.7 + Math.random() * 1.4,
            alpha: 0,
            targetAlpha: 0,
            col,
            speed,
            fase: Math.random() * Math.PI * 2,
          });
        }
      }
      for (let i = 0; i < parts.length; i++) {
        if (i < targets.length) {
          const t = targets[i];
          parts[i].tx = t.x;
          parts[i].ty = t.y;
          parts[i].targetAlpha = targetAlpha;
          parts[i].col = col;
          parts[i].speed = speed;
        } else {
          parts[i].targetAlpha = 0;
        }
      }
    },
    [],
  );

  // ── Disuelve (fade out) un array de partículas sin reposicionar ──
  const disolver = useCallback((targetRef) => {
    targetRef.current.forEach((p) => {
      p.targetAlpha = 0;
    });
  }, []);

  // ── Crea/actualiza partículas hacia el corazón ──
  const formarCorazon = useCallback(
    (targetRef, speed = SPEED_CORAZON, targetAlpha = 0.9) => {
      const canvas = canvasRef.current;
      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const cy = H / 2;
      const escala = Math.min(W, H) * 0.018;

      const targets = puntosCorazon(750, cx, cy, escala);
      const parts = targetRef.current;

      if (parts.length < targets.length) {
        for (let i = parts.length; i < targets.length; i++) {
          parts.push({
            x: cx,
            y: cy,
            tx: 0,
            ty: 0,
            r: 1.6 + Math.random() * 1.8,
            alpha: 0,
            targetAlpha: 0,
            col: "126,217,87",
            speed,
            fase: Math.random() * Math.PI * 2,
          });
        }
      }
      for (let i = 0; i < parts.length; i++) {
        if (i < targets.length) {
          const t = targets[i];
          parts[i].tx = t.x;
          parts[i].ty = t.y;
          parts[i].targetAlpha = targetAlpha;
          parts[i].col = Math.random() < 0.18 ? "240,192,64" : "126,217,87";
          parts[i].speed = speed;
        } else {
          parts[i].targetAlpha = 0;
        }
      }
    },
    [],
  );

  // ────────────────────────────────────────────────────────────────────
  // FASE: PASTEL — botón "Sopla"
  // ────────────────────────────────────────────────────────────────────
  const handleSoplar = () => {
    if (soplos >= TOTAL_SOPLOS) return;
    const nuevo = soplos + 1;
    setSoplos(nuevo);
    if (nuevo === TOTAL_SOPLOS) {
      setTimeout(() => iniciarDeseo(), 500);
    }
  };

  const iniciarDeseo = () => {
    setFase("deseo");
    // "Pide tu deseo mi amor" — tarda ~3s en armarse, queda 10s en pantalla
    formarTextoEn(
      particlesRef,
      "Pide tu deseo mi amor",
      0.5,
      0.095,
      true,
      SPEED_DESEO,
      1,
    );

    setTimeout(() => {
      // Disolver el mensaje del centro...
      disolver(particlesRef);

      // ...y armar "Feliz Cumpleaños" arriba — queda fijo toda la fiesta
      formarTextoEn(
        headerRef,
        "Feliz Cumpleaños",
        0.13,
        0.105,
        false,
        SPEED_FELIZ,
        1,
      );

      // Tras la disolución (~1.2s), las partículas centrales forman el corazón
      setTimeout(() => {
        formarCorazon(particlesRef, SPEED_CORAZON, 0.9);
        iniciarFiesta();
      }, 1200);
    }, DURACION_DESEO_TOTAL);
  };

  // ────────────────────────────────────────────────────────────────────
  // FASE: FIESTA — corazón + fotos + canción
  // ────────────────────────────────────────────────────────────────────
  const iniciarFiesta = () => {
    setFase("fiesta");

    const audio = audioRef.current;
    if (audio) {
      audio.volume = 0.85;

      const arrancar = (duracionSeg) => {
        audio.play().catch(() => {});

        const tFrase = Math.max((duracionSeg - FADE_INICIO) * 1000, 0);
        setTimeout(() => setMostrarFrase(true), tFrase);

        const tFadeFinal = Math.max((duracionSeg - 6) * 1000, 0);
        setTimeout(() => {
          let vol = audio.volume;
          fadeIntervalRef.current = setInterval(() => {
            vol -= 0.04;
            audio.volume = Math.max(0, vol);
            if (vol <= 0) clearInterval(fadeIntervalRef.current);
          }, 220);
          setMostrarFinal(true);
        }, tFadeFinal);
      };

      if (audio.readyState >= 1 && audio.duration) {
        arrancar(audio.duration);
      } else {
        audio.addEventListener(
          "loadedmetadata",
          () => arrancar(audio.duration),
          { once: true },
        );
      }
    }

    iniciarCarruselFotos();
  };

  // ── Carrusel: agrega/quita fotos alrededor del corazón ──
  const carruselRef = useRef(null);
  const iniciarCarruselFotos = () => {
    if (carruselRef.current) clearInterval(carruselRef.current);

    const posiciones = [
      { top: "8%", left: "6%" },
      { top: "8%", right: "6%" },
      { top: "62%", left: "5%" },
      { top: "62%", right: "5%" },
      { top: "35%", left: "2%" },
      { top: "35%", right: "2%" },
      { bottom: "6%", left: "20%" },
      { bottom: "6%", right: "20%" },
    ];

    let idx = 0;
    const tick = () => {
      setFotos((current) => {
        if (!current || current.length === 0) return current;
        const url = current[idx % current.length];
        idx++;

        const slotIdx = Math.floor(Math.random() * posiciones.length);
        const key = `${Date.now()}-${Math.random()}`;
        const nueva = { url, key, pos: posiciones[slotIdx] };

        setFotosVisibles((prev) => {
          const sinSlot = prev.filter((f) => f.slotIdx !== slotIdx);
          return [...sinSlot, { ...nueva, slotIdx }].slice(-6);
        });
        return current;
      });
    };

    tick();
    carruselRef.current = setInterval(tick, 3200);
  };

  // ── Cleanup general ──
  useEffect(() => {
    return () => {
      if (carruselRef.current) clearInterval(carruselRef.current);
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      cancelAnimationFrame(animRef.current);
      audioRef.current?.pause();
    };
  }, []);

  const handleSigueme = () => {
    cancelAnimationFrame(animRef.current);
    if (carruselRef.current) clearInterval(carruselRef.current);
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    audioRef.current?.pause();
    navigate("/dashboard");
  };

  const handleSalir = () => {
    cancelAnimationFrame(animRef.current);
    if (carruselRef.current) clearInterval(carruselRef.current);
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    audioRef.current?.pause();
    navigate("/dashboard");
  };

  // ────────────────────────────────────────────────────────────────────
  return (
    <div className="cumf-overlay">
      <canvas ref={canvasRef} className="cumf-canvas" />
      <audio
        ref={audioRef}
        src="https://firebasestorage.googleapis.com/v0/b/portal-de-recuerdos.firebasestorage.app/o/diasEspeciales%2Fmusica%2FCumplea%C3%B1os.mp3?alt=media"
        preload="auto"
      />

      {/* Botón salir — disponible en todo momento */}
      <button className="cumf-salir" onClick={handleSalir} title="Salir">
        ✕
      </button>

      {/* ── FASE PASTEL ── */}
      {fase === "pastel" && (
        <div className="cumf-pastel-wrapper">
          <div className="cumf-pastel">
            <div className="cumf-velas">
              {Array.from({ length: 5 }).map((_, i) => {
                const apagada =
                  soplos >= Math.ceil(((i + 1) / 5) * TOTAL_SOPLOS);
                return (
                  <div key={i} className="cumf-vela">
                    <div
                      className={`cumf-flama ${apagada ? "cumf-flama--apagada" : ""}`}
                    />
                    <div className="cumf-mecha" />
                  </div>
                );
              })}
            </div>
            <div className="cumf-pastel-cuerpo">
              <div className="cumf-pastel-capa cumf-pastel-capa--top" />
              <div className="cumf-pastel-capa cumf-pastel-capa--bottom" />
            </div>
          </div>

          <button className="cumf-btn-soplar" onClick={handleSoplar}>
            Sopla 🎂
          </button>
          <p className="cumf-contador">
            {soplos} / {TOTAL_SOPLOS}
          </p>
        </div>
      )}

      {/* ── FASE FIESTA: fotos alrededor del corazón ── */}
      {fase === "fiesta" &&
        fotosVisibles.map((f) => (
          <div key={f.key} className="cumf-foto-flotante" style={f.pos}>
            <img src={f.url} alt="" />
          </div>
        ))}

      {/* ── FRASE FINAL (debajo del corazón) ── */}
      {fase === "fiesta" && mostrarFrase && (
        <p className="cumf-frase-final">Te Quiero Mucho Mis Ojitos Bellos 💚</p>
      )}

      {/* ── MENSAJE DE CIERRE ── */}
      {mostrarFinal && (
        <div className="cumf-cierre">
          <p className="cumf-cierre-texto">Espera, aún falta un poco más...</p>
          <button className="cumf-btn-sigueme" onClick={handleSigueme}>
            Sígueme amor 💚
          </button>
        </div>
      )}
    </div>
  );
}
