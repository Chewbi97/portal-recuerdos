import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";
import "./Cumpleanosfiesta.css";

const TOTAL_SOPLOS = 15;
const DURACION_DESEO_TOTAL = 10000; // ms que "Pide tu deseo" permanece en pantalla
const FADE_TEXTO = 700;             // ms de fade out del texto del deseo
const SPEED_CORAZON = 0.005;        // ~10s en armarse
const ALPHA_SPEED = 0.05;           // velocidad de fade in/out de partículas
const FADE_INICIO = 30;             // segundos antes del final donde aparece la frase + fade
const DURACION_DEFAULT = 4 * 60 + 40; // 4:40 fallback si el audio no cargó aún

// Pulso del corazón
const PULSO_AMPLITUD = 0.045;
const PULSO_VELOCIDAD = 0.0032;

// Chispas que salen del corazón
const CHISPAS_INTERVALO = 1900; // ms entre tandas
const CHISPAS_POR_TANDA = 16;

// Tamaño aproximado de las fotos flotantes (debe coincidir con el CSS)
const FOTO_SIZE = 130;

// ════════════════════════════════════════════════════════════════════════
// CORAZÓN — curva paramétrica clásica, con profundidad (z) para dar volumen
// ════════════════════════════════════════════════════════════════════════
function puntosCorazon(n, escala) {
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
    const r = 0.5 + Math.random() * 0.5;
    const z = Math.random() * 2 - 1; // -1 (fondo) a 1 (frente)
    pts.push({ x: x * escala * r, y: y * escala * r, z });
  }
  return pts;
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
  const carruselRef = useRef(null);
  const intervaloFotoRef = useRef(8000); // ms — se recalcula dinámicamente
  const chispasIntervalRef = useRef(null);

  const [fase, setFase] = useState("pastel"); // pastel | deseo | fiesta | final
  const [soplos, setSoplos] = useState(0);
  const [fotos, setFotos] = useState([]);
  const [fotosVisibles, setFotosVisibles] = useState([]);
  const [deseoEstado, setDeseoEstado] = useState("oculto"); // oculto | mostrando | saliendo
  const [mostrarFeliz, setMostrarFeliz] = useState(false);
  const [mostrarFrase, setMostrarFrase] = useState(false);
  const [mostrarFinal, setMostrarFinal] = useState(false);

  // Partículas del corazón
  const particlesRef = useRef([]);
  // Chispas/fuegos (del corazón y de las fotos)
  const chispasRef = useRef([]);
  // Centro del canvas (para el pulso del corazón)
  const centroRef = useRef({ cx: 0, cy: 0 });

  // ── Cargar fotos de Firebase Storage ──
  useEffect(() => {
    const storage = getStorage();
    listAll(ref(storage, "cumpleaños"))
      .then(async (res) => {
        const urls = await Promise.all(
          res.items.map((item) => getDownloadURL(item))
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
      centroRef.current = { cx: canvas.width / 2, cy: canvas.height / 2 };
    };
    resize();
    window.addEventListener("resize", resize);

    const loop = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.fillStyle = "rgba(0,0,0,0.16)";
      ctx.fillRect(0, 0, W, H);

      const { cx, cy } = centroRef.current;
      const pulso = 1 + PULSO_AMPLITUD * Math.sin(performance.now() * PULSO_VELOCIDAD);

      // ── Glow de fondo del corazón ──
      const parts = particlesRef.current;
      const corazonActivo = parts.some((p) => p.bx !== undefined && p.targetAlpha > 0);
      if (corazonActivo) {
        const radioGlow = Math.min(W, H) * 0.32 * pulso;
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radioGlow);
        glow.addColorStop(0, "rgba(126,217,87,0.16)");
        glow.addColorStop(0.5, "rgba(126,217,87,0.06)");
        glow.addColorStop(1, "rgba(126,217,87,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, radioGlow, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Partículas del corazón ──
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        if (p.bx !== undefined) {
          const profundidad = 1 + p.z * 0.06; // partículas "de frente" pulsan un poco más
          p.tx = cx + p.bx * pulso * profundidad;
          p.ty = cy + p.by * pulso * profundidad;
        }
        p.x += (p.tx - p.x) * p.speed;
        p.y += (p.ty - p.y) * p.speed;
        p.alpha += (p.targetAlpha - p.alpha) * ALPHA_SPEED;
        if (p.alpha < 0.01) continue;

        const twinkle = 0.78 + 0.22 * Math.sin(performance.now() * 0.0025 + p.fase);
        const brillo = p.z !== undefined ? 0.55 + (p.z + 1) / 2 * 0.45 : 1;
        const radio = p.r * (p.z !== undefined ? 0.7 + (p.z + 1) / 2 * 0.6 : 1);

        ctx.beginPath();
        ctx.arc(p.x, p.y, radio, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.col},${p.alpha * twinkle * brillo})`;
        ctx.shadowBlur = 3 + brillo * 3;
        ctx.shadowColor = `rgba(${p.col},0.6)`;
        ctx.fill();

        // Núcleo brillante en partículas frontales — da sensación de "vida"
        if (p.z !== undefined && p.z > 0.4) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, radio * 0.35, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(230,255,225,${p.alpha * 0.8})`;
          ctx.shadowBlur = 0;
          ctx.fill();
        }
      }

      // ── Chispas (corazón + fotos) ──
      const chispas = chispasRef.current;
      for (let i = chispas.length - 1; i >= 0; i--) {
        const c = chispas[i];
        c.x += c.vx;
        c.y += c.vy;
        c.vx *= 0.97;
        c.vy *= 0.97;
        c.alpha -= c.decay;
        if (c.alpha <= 0) {
          chispas.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${c.col},${c.alpha})`;
        ctx.shadowBlur = 6;
        ctx.shadowColor = `rgba(${c.col},0.8)`;
        ctx.fill();
      }

      ctx.shadowBlur = 0;
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  // ── Crea/actualiza las partículas del corazón ──
  const formarCorazon = useCallback(() => {
    const canvas = canvasRef.current;
    const escala = Math.min(canvas.width, canvas.height) * 0.018;
    const targets = puntosCorazon(1300, escala);
    const parts = particlesRef.current;

    if (parts.length < targets.length) {
      for (let i = parts.length; i < targets.length; i++) {
        parts.push({
          x: centroRef.current.cx,
          y: centroRef.current.cy,
          tx: 0,
          ty: 0,
          bx: 0,
          by: 0,
          z: 0,
          r: 1.4 + Math.random() * 1.7,
          alpha: 0,
          targetAlpha: 0,
          col: "126,217,87",
          speed: SPEED_CORAZON,
          fase: Math.random() * Math.PI * 2,
        });
      }
    }
    for (let i = 0; i < parts.length; i++) {
      if (i < targets.length) {
        parts[i].bx = targets[i].x;
        parts[i].by = targets[i].y;
        parts[i].z = targets[i].z;
        parts[i].targetAlpha = 0.9;
        parts[i].col = Math.random() < 0.16 ? "240,192,64" : "126,217,87";
      } else {
        parts[i].targetAlpha = 0;
      }
    }
  }, []);

  // ── Chispas saliendo del corazón ──
  const lanzarChispas = useCallback(() => {
    const parts = particlesRef.current.filter((p) => p.bx !== undefined && p.targetAlpha > 0);
    if (parts.length === 0) return;
    const { cx, cy } = centroRef.current;

    for (let i = 0; i < CHISPAS_POR_TANDA; i++) {
      const origen = parts[Math.floor(Math.random() * parts.length)];
      const dx = origen.x - cx;
      const dy = origen.y - cy;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const dirX = dx / dist;
      const dirY = dy / dist;
      const vel = 0.8 + Math.random() * 2.2;

      chispasRef.current.push({
        x: origen.x,
        y: origen.y,
        vx: dirX * vel + (Math.random() - 0.5) * 0.6,
        vy: dirY * vel + (Math.random() - 0.5) * 0.6,
        r: 1 + Math.random() * 1.6,
        alpha: 0.9,
        decay: 0.015 + Math.random() * 0.02,
        col: Math.random() < 0.4 ? "240,192,64" : "126,217,87",
      });
    }
  }, []);

  // ── Chispas doradas alrededor de un punto (cuando aparece una foto) ──
  const lanzarChispasDoradas = useCallback((x, y, n = 22) => {
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2;
      const vel = 0.6 + Math.random() * 2.4;
      chispasRef.current.push({
        x,
        y,
        vx: Math.cos(ang) * vel,
        vy: Math.sin(ang) * vel,
        r: 1 + Math.random() * 1.8,
        alpha: 1,
        decay: 0.018 + Math.random() * 0.022,
        col: "240,192,64",
      });
    }
  }, []);

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
    setDeseoEstado("mostrando");

    // ── La canción arranca apenas aparece "Pide tu deseo" ──
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
          { once: true }
        );
      }
    }

    setTimeout(() => {
      setDeseoEstado("saliendo");

      setTimeout(() => {
        formarCorazon();
        setMostrarFeliz(true);
        iniciarFiesta();
      }, FADE_TEXTO);
    }, DURACION_DESEO_TOTAL);
  };

  // ────────────────────────────────────────────────────────────────────
  // FASE: FIESTA — corazón + fotos
  // ────────────────────────────────────────────────────────────────────
  const iniciarFiesta = () => {
    setFase("fiesta");

    // Chispas saliendo del corazón cada ~1.9s
    chispasIntervalRef.current = setInterval(lanzarChispas, CHISPAS_INTERVALO);

    iniciarCarruselFotos();
  };

  // ── Carrusel: agrega/quita fotos alrededor del corazón + chispas doradas ──
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

    // Convierte una posición CSS (%) en coordenadas de canvas aproximadas (centro de la foto)
    const calcularPosicionCanvas = (pos) => {
      const canvas = canvasRef.current;
      const W = canvas.width;
      const H = canvas.height;
      let x;
      let y;
      if (pos.left) x = (parseFloat(pos.left) / 100) * W + FOTO_SIZE / 2;
      else x = W - (parseFloat(pos.right) / 100) * W - FOTO_SIZE / 2;
      if (pos.top) y = (parseFloat(pos.top) / 100) * H + FOTO_SIZE / 2;
      else y = H - (parseFloat(pos.bottom) / 100) * H - FOTO_SIZE / 2;
      return { x, y };
    };

    let idx = 0;
    const tick = (fotosActuales) => {
      if (!fotosActuales || fotosActuales.length === 0) return;
      const url = fotosActuales[idx % fotosActuales.length];
      idx++;

      const slotIdx = Math.floor(Math.random() * posiciones.length);
      const key = `${Date.now()}-${Math.random()}`;
      const pos = posiciones[slotIdx];
      const nueva = { url, key, pos };

      const { x, y } = calcularPosicionCanvas(pos);
      lanzarChispasDoradas(x, y);

      setFotosVisibles((prev) => {
        const sinSlot = prev.filter((f) => f.slotIdx !== slotIdx);
        return [...sinSlot, { ...nueva, slotIdx }].slice(-6);
      });
    };

    // ── Calcular intervalo dinámico ──
    // Duración de la fase fiesta: desde que arranca hasta el fade final (~6s antes del fin)
    // Usamos la duración del audio si ya está disponible, o el default
    const audio = audioRef.current;
    const duracionCancion = (audio?.duration && isFinite(audio.duration))
      ? audio.duration
      : DURACION_DEFAULT;
    const duracionFiesta = Math.max(duracionCancion - 6, 30); // segundos de la fase fiesta

    setFotos((current) => {
      const n = current?.length || 1;
      const intervaloMs = Math.max(4000, Math.floor((duracionFiesta * 1000) / n));
      intervaloFotoRef.current = intervaloMs; // guardar para usarlo en el style

      tick(current);
      carruselRef.current = setInterval(() => {
        setFotos((c) => { tick(c); return c; });
      }, intervaloMs);

      return current;
    });
  };

  // ── Cleanup general ──
  useEffect(() => {
    return () => {
      if (carruselRef.current) clearInterval(carruselRef.current);
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      if (chispasIntervalRef.current) clearInterval(chispasIntervalRef.current);
      cancelAnimationFrame(animRef.current);
      audioRef.current?.pause();
    };
  }, []);

  const limpiarTodo = () => {
    cancelAnimationFrame(animRef.current);
    if (carruselRef.current) clearInterval(carruselRef.current);
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    if (chispasIntervalRef.current) clearInterval(chispasIntervalRef.current);
    audioRef.current?.pause();
  };

  const handleSigueme = () => {
    limpiarTodo();
    navigate("/dashboard/CumpleanosUniverso");
  };

  const handleSalir = () => {
    limpiarTodo();
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
      <button className="cumf-salir" onClick={handleSalir} title="Salir">✕</button>

      {/* ── FASE PASTEL ── */}
      {fase === "pastel" && (
        <div className="cumf-pastel-wrapper">
          <div className="cumf-pastel">
            <div className="cumf-velas">
              {Array.from({ length: 5 }).map((_, i) => {
                const apagada = soplos >= Math.ceil(((i + 1) / 5) * TOTAL_SOPLOS);
                return (
                  <div key={i} className="cumf-vela">
                    <div className={`cumf-flama ${apagada ? "cumf-flama--apagada" : ""}`} />
                    <div className="cumf-mecha" />
                  </div>
                );
              })}
            </div>

            <div className="cumf-pastel-cuerpo">
              {/* Capa superior — la más pequeña */}
              <div className="cumf-pastel-capa cumf-pastel-capa--top">
                <div className="cumf-perlas">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <span key={i} className="cumf-perla" />
                  ))}
                </div>
                <div className="cumf-drip cumf-drip--top" />
              </div>

              {/* Capa media */}
              <div className="cumf-pastel-capa cumf-pastel-capa--mid">
                <div className="cumf-flores">
                  <span className="cumf-flor cumf-flor--1">🌸</span>
                  <span className="cumf-flor cumf-flor--2">🌸</span>
                  <span className="cumf-flor cumf-flor--3">🌸</span>
                </div>
                <div className="cumf-drip cumf-drip--mid" />
              </div>

              {/* Capa base — la más grande */}
              <div className="cumf-pastel-capa cumf-pastel-capa--base">
                <div className="cumf-listón" />
              </div>

              {/* Plato */}
              <div className="cumf-pastel-plato" />
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

      {/* ── MENSAJE "PIDE TU DESEO" — efecto de trazo ── */}
      {fase === "deseo" && (
        <p className={`cumf-deseo-texto cumf-deseo-texto--${deseoEstado}`}>
          Pide tu deseo mi amor 💚
        </p>
      )}

      {/* ── "FELIZ CUMPLEAÑOS" — fijo arriba durante la fiesta, efecto de trazo ── */}
      {mostrarFeliz && (fase === "fiesta" || fase === "final") && (
        <p className="cumf-feliz-texto">Feliz Cumpleaños Mi Amor 🎉</p>
      )}

      {/* ── FASE FIESTA: fotos alrededor del corazón ── */}
      {fase === "fiesta" &&
        fotosVisibles.map((f) => (
          <div
            key={f.key}
            className="cumf-foto-flotante"
            style={{
              ...f.pos,
              "--duracion": `${Math.max(2, intervaloFotoRef.current / 1000)}s`,
            }}
          >
            <img src={f.url} alt="" />
          </div>
        ))}

      {/* ── FRASE FINAL (debajo del corazón) — efecto de trazo ── */}
      {fase === "fiesta" && mostrarFrase && (
        <p className="cumf-frase-final">
          Te Quiero Mucho Mis Ojitos Bellos 💚
        </p>
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