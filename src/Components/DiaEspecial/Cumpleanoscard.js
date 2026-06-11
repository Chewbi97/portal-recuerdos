import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Cumpleanoscard.css";

// ── PALETA ──────────────────────────────────────────────────────────────────
const COLORES = [
  { r: 45,  g: 90,  b: 39  }, // verde oscuro portal
  { r: 126, g: 217, b: 87  }, // verde lima brillante
  { r: 240, g: 192, b: 64  }, // dorado cálido
  { r: 255, g: 255, b: 220 }, // blanco cremoso
  { r: 90,  g: 160, b: 70  }, // verde medio
  { r: 255, g: 210, b: 100 }, // amarillo suave
];

function colorAleatorio() {
  return COLORES[Math.floor(Math.random() * COLORES.length)];
}

// ── PARTÍCULA ────────────────────────────────────────────────────────────────
class Particula {
  constructor(x, y, col) {
    const angulo = Math.random() * Math.PI * 2;
    const velocidad = 1.5 + Math.random() * 5;
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angulo) * velocidad;
    this.vy = Math.sin(angulo) * velocidad;
    this.alpha = 1;
    this.decay = 0.012 + Math.random() * 0.018;
    this.r = col.r;
    this.g = col.g;
    this.b = col.b;
    this.radio = 1.8 + Math.random() * 2.2;
    this.gravedad = 0.06 + Math.random() * 0.04;
    this.trail = [];
  }

  update() {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 7) this.trail.shift();
    this.vy += this.gravedad;
    this.vx *= 0.98;
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= this.decay;
  }

  draw(ctx) {
    // Estela
    for (let i = 0; i < this.trail.length; i++) {
      const t = i / this.trail.length;
      ctx.beginPath();
      ctx.arc(this.trail[i].x, this.trail[i].y, this.radio * t * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.r},${this.g},${this.b},${this.alpha * t * 0.4})`;
      ctx.fill();
    }
    // Núcleo
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radio, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${this.r},${this.g},${this.b},${this.alpha})`;
    ctx.shadowBlur = 8;
    ctx.shadowColor = `rgba(${this.r},${this.g},${this.b},0.8)`;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  muerto() {
    return this.alpha <= 0;
  }
}

// ── COHETE ───────────────────────────────────────────────────────────────────
class Cohete {
  constructor(W, H) {
    this.x = W * (0.15 + Math.random() * 0.7);
    this.y = H;
    this.targetY = H * (0.08 + Math.random() * 0.35);
    this.velocidad = 6 + Math.random() * 5;
    this.col = colorAleatorio();
    this.particulas = [];
    this.explotado = false;
    this.trail = [];
  }

  update(W, H) {
    if (!this.explotado) {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 12) this.trail.shift();
      this.y -= this.velocidad;
      if (this.y <= this.targetY) {
        this.explotar(200 + Math.floor(Math.random() * 80));
      }
    } else {
      this.particulas = this.particulas.filter((p) => !p.muerto());
      this.particulas.forEach((p) => p.update());
    }
  }

  explotar(n) {
    this.explotado = true;
    for (let i = 0; i < n; i++) {
      this.particulas.push(new Particula(this.x, this.y, this.col));
    }
    // Segunda capa con color contrastante
    const col2 = COLORES[(COLORES.indexOf(this.col) + 2) % COLORES.length];
    for (let i = 0; i < 40; i++) {
      this.particulas.push(new Particula(this.x, this.y, col2));
    }
  }

  draw(ctx) {
    if (!this.explotado) {
      // Estela del cohete
      for (let i = 0; i < this.trail.length; i++) {
        const t = i / this.trail.length;
        ctx.beginPath();
        ctx.arc(this.trail[i].x, this.trail[i].y, 2 * t, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.col.r},${this.col.g},${this.col.b},${t * 0.6})`;
        ctx.fill();
      }
      // Punta del cohete
      ctx.beginPath();
      ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,220,0.95)`;
      ctx.shadowBlur = 12;
      ctx.shadowColor = `rgba(${this.col.r},${this.col.g},${this.col.b},1)`;
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      this.particulas.forEach((p) => p.draw(ctx));
    }
  }

  terminado() {
    return this.explotado && this.particulas.length === 0;
  }
}

// ── COMPONENTE ───────────────────────────────────────────────────────────────
export default function CumpleanosCard() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const cohetesRef = useRef([]);
  const lanzadorRef = useRef(null);
  const [fase, setFase] = useState("cuenta"); // cuenta | fuegos | mensaje
  const [numero, setNumero] = useState(10);
  const [visible, setVisible] = useState(false);
  const [mensajeVisible, setMensajeVisible] = useState(false);

  // ── FUEGOS ARTIFICIALES ──────────────────────────────────────────────────
  const iniciarFuegos = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const lanzarCohete = () => {
      cohetesRef.current.push(new Cohete(canvas.width, canvas.height));
    };

    // Lanzar cohetes periódicamente
    lanzarCohete();
    lanzarCohete();
    lanzadorRef.current = setInterval(() => {
      const n = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < n; i++) lanzarCohete();
    }, 600);

    // Parar lanzador y mostrar mensaje después de 5s
    setTimeout(() => {
      clearInterval(lanzadorRef.current);
      // Esperar que los últimos cohetes terminen (~2s más) y mostrar mensaje
      setTimeout(() => {
        setMensajeVisible(true);
      }, 2200);
    }, 5000);

    const loop = () => {
      ctx.fillStyle = "rgba(244, 236, 216, 0.18)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      cohetesRef.current = cohetesRef.current.filter((c) => !c.terminado());
      cohetesRef.current.forEach((c) => {
        c.update(canvas.width, canvas.height);
        c.draw(ctx);
      });

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resize);
      clearInterval(lanzadorRef.current);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  // ── CUENTA REGRESIVA ─────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (fase !== "cuenta") return;

    if (numero === 0) {
      // Breve pausa en 0 y luego fuegos
      const t = setTimeout(() => {
        setFase("fuegos");
        iniciarFuegos();
      }, 800);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => setNumero((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [numero, fase, iniciarFuegos]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animRef.current);
      clearInterval(lanzadorRef.current);
    };
  }, []);

  const handleContinuar = () => {
    cancelAnimationFrame(animRef.current);
    clearInterval(lanzadorRef.current);
    // acá después navegará a la tarjeta interactiva real
    navigate("/dashboard");
  };

  const handleClose = () => {
    cancelAnimationFrame(animRef.current);
    clearInterval(lanzadorRef.current);
    navigate("/dashboard");
  };

  return (
    <div className={`cumcard-backdrop ${visible ? "cumcard-backdrop--visible" : ""}`}>

      {/* Canvas de fuegos — siempre montado, solo visible en fase fuegos */}
      <canvas
        ref={canvasRef}
        className={`cumcard-canvas ${fase === "fuegos" ? "cumcard-canvas--visible" : ""}`}
      />

      {/* ── CUENTA REGRESIVA ── */}
      {fase === "cuenta" && (
        <div className="cumcard-cuenta">
          <p className="cumcard-cuenta-label">Prepárate...</p>
          <span
            key={numero}
            className={`cumcard-numero ${numero === 0 ? "cumcard-numero--cero" : ""}`}
          >
            {numero}
          </span>
        </div>
      )}

      {/* ── MENSAJE FINAL ── */}
      {fase === "fuegos" && mensajeVisible && (
        <div className="cumcard-mensaje">
          <p className="cumcard-mensaje-texto">
            Hoy en tu día especial,
          </p>
          <p className="cumcard-mensaje-texto cumcard-mensaje-texto--sub">
            déjame ser yo quien ilumine esos bellos ojos
          </p>
          <p className="cumcard-mensaje-texto cumcard-mensaje-texto--sub">
            que solo tú tienes 💚
          </p>
          <button className="cumcard-btn" onClick={handleContinuar}>
            Continuar →
          </button>
        </div>
      )}

      {/* Botón cerrar discreto */}
      <button className="cumcard-cerrar" onClick={handleClose}>✕</button>
    </div>
  );
}