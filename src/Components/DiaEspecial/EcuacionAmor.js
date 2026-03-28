import React, { useEffect, useRef, useState } from "react";
import ControlesAnimacion from "./ControlesAnimacion";
import { enviarNotificacion } from "../../firebase";
import "./EcuacionAmor.css";

const FPS = 60;
const OFFSET_INICIO = 3 * FPS;
const OFFSET_FIN = 4 * FPS;
const DUR = {
  intro: 2 * FPS,
  corazon: 30 * FPS,
  pausa: 2 * FPS,
  texto: 48 * FPS + OFFSET_INICIO + OFFSET_FIN, // ← 55s total
};
const DURACION_TOTAL = DUR.intro + DUR.corazon + DUR.pausa + DUR.texto;
const T = {
  intro: DUR.intro,
  corazon: DUR.intro + DUR.corazon,
  pausa: DUR.intro + DUR.corazon + DUR.pausa,
  texto: DUR.intro + DUR.corazon + DUR.pausa + DUR.texto,
};

function EcuacionAmor({ diaEspecial, onClose }) {
  const canvasRef = useRef(null);
  const audioVozRef = useRef(null);
  const audioMusicaRef = useRef(null);
  const animRef = useRef(null);
  const frameRef = useRef(0);
  const faseRef = useRef(0);
  const pausadoRef = useRef(false);
  const vozCreadaRef = useRef(false);
  const [faseActual, setFaseActual] = useState(0);
  const [mostrarTexto, setMostrarTexto] = useState(false);
  const [kActual, setKActual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [scrollTexto, setScrollTexto] = useState(0);

  const handleClose = () => {
    cancelAnimationFrame(animRef.current);
    audioMusicaRef.current?.pause();
    audioVozRef.current?.pause();
    onClose();
  };

  const handlePausa = () => {
    pausadoRef.current = !pausadoRef.current;
    setPausado(pausadoRef.current);
    if (pausadoRef.current) {
      audioMusicaRef.current?.pause();
      audioVozRef.current?.pause();
    } else {
      audioMusicaRef.current?.play().catch(() => {});
      audioVozRef.current?.play().catch(() => {});
    }
  };

  const handleBarra = (valor) => {
    frameRef.current = valor;
    setProgreso(valor);

    // Resetear fase para recalcular
    faseRef.current = -1;

    // Sincronizar música
    if (audioMusicaRef.current) {
      const segMusica = valor / FPS;
      audioMusicaRef.current.currentTime =
        segMusica % (audioMusicaRef.current.duration || 1);
      audioMusicaRef.current.volume = 0.25;
      if (!pausadoRef.current) audioMusicaRef.current.play().catch(() => {});
    }

    // Sincronizar voz en off
    const segVozInicio = T.pausa / FPS;
    const segActual = valor / FPS;
    const segVoz = segActual - segVozInicio;

    if (segVoz > 0 && audioVozRef.current) {
      audioVozRef.current.currentTime = Math.min(
        segVoz,
        audioVozRef.current.duration || 0,
      );
      if (!pausadoRef.current) audioVozRef.current.play().catch(() => {});
    } else if (audioVozRef.current) {
      audioVozRef.current.pause();
      audioVozRef.current.currentTime = 0;
    }

    // Sincronizar scroll del texto
    if (valor >= T.pausa) {
      const progTexto = (valor - T.pausa + OFFSET_INICIO) / DUR.texto;
      setScrollTexto(Math.min(progTexto * 120, 120));
      setMostrarTexto(true);
    } else {
      setMostrarTexto(false);
      setScrollTexto(0);
    }

    // Sincronizar k visible
    if (valor >= T.intro && valor < T.corazon) {
      const prog = (valor - T.intro) / DUR.corazon;
      setKActual(Math.floor(prog * 100));
      setFaseActual(1);
    } else if (valor >= T.corazon) {
      setKActual(100);
      setFaseActual(valor >= T.pausa ? 3 : 2);
    } else {
      setFaseActual(0);
      setKActual(0);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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

    if (diaEspecial.musicaUrl) {
      audioMusicaRef.current = new Audio(diaEspecial.musicaUrl);
      audioMusicaRef.current.loop = true;
      audioMusicaRef.current.volume = 0.25;
      audioMusicaRef.current.play().catch(() => {});
    }

    // Pre-cargar voz para que currentTime funcione
    if (diaEspecial.audioUrl) {
      audioVozRef.current = new Audio(diaEspecial.audioUrl);
      audioVozRef.current.volume = 1;
      audioVozRef.current.preload = "auto";
    }

    // ✅ Notificación al abrir el día especial
    enviarNotificacion(
      `💚 ${diaEspecial.titulo}`,
      diaEspecial.descripcionGaleria || "Un momento especial te espera",
    ).catch(() => {});

    const fadeMusica = (desde, hasta, duracionMs) => {
      const pasos = 30;
      const intervalo = duracionMs / pasos;
      const diff = (hasta - desde) / pasos;
      let paso = 0;
      const timer = setInterval(() => {
        paso++;
        if (audioMusicaRef.current) {
          audioMusicaRef.current.volume = Math.max(
            0,
            Math.min(1, desde + diff * paso),
          );
        }
        if (paso >= pasos) clearInterval(timer);
      }, intervalo);
    };

    const dibujarEjes = () => {
      const W = canvas.width;
      const H = canvas.height;
      const escala = Math.min(W, H) * 0.17;
      const cx = W / 2;
      const cy = H * 0.52;

      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - escala * 2.2, cy);
      ctx.lineTo(cx + escala * 2.2, cy);
      ctx.moveTo(cx, cy - escala * 2.5);
      ctx.lineTo(cx, cy + escala * 1.5);
      ctx.stroke();

      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.beginPath();
      ctx.moveTo(cx + escala * 2.1, cy - 5);
      ctx.lineTo(cx + escala * 2.2, cy);
      ctx.lineTo(cx + escala * 2.1, cy + 5);
      ctx.moveTo(cx - 5, cy - escala * 2.4);
      ctx.lineTo(cx, cy - escala * 2.5);
      ctx.lineTo(cx + 5, cy - escala * 2.4);
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.font = `${escala * 0.16}px serif`;
      ctx.textAlign = "center";
      [-1, 1].forEach((n) => {
        ctx.fillText(n, cx + n * escala, cy + escala * 0.22);
        ctx.fillText(n, cx + escala * 0.15, cy - n * escala + escala * 0.07);
      });
    };

    const dibujarCorazonConK = (k, alpha, pulso = 1) => {
      const W = canvas.width;
      const H = canvas.height;
      const escala = Math.min(W, H) * 0.17;
      const cx = W / 2;
      const cy = H * 0.52;
      const total = 600;

      const sup = [],
        inf = [];
      for (let i = 0; i <= total; i++) {
        const x = -Math.sqrt(3) + (2 * Math.sqrt(3) * i) / total;
        const bajo = 3 - x * x;
        if (bajo < 0) continue;
        const base = Math.pow(Math.abs(x), 2 / 3);
        const onda = 0.9 * Math.sin(k * x) * Math.sqrt(bajo);
        sup.push({ x, y: base + onda });
        inf.push({ x, y: base - onda });
      }

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(pulso, pulso);
      ctx.translate(-cx, -cy);

      ctx.beginPath();
      ctx.strokeStyle = `rgba(200,50,50,${alpha})`;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 14;
      ctx.shadowColor = "rgba(220,60,60,0.9)";
      sup.forEach((p, i) => {
        const px = cx + p.x * escala;
        const py = cy - p.y * escala;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      ctx.beginPath();
      inf.forEach((p, i) => {
        const px = cx + p.x * escala;
        const py = cy - p.y * escala;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.restore();
      ctx.shadowBlur = 0;
    };

    const loop = () => {
      if (pausadoRef.current) {
        animRef.current = requestAnimationFrame(loop);
        return;
      }

      const frame = frameRef.current;
      const W = canvas.width;
      const H = canvas.height;

      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(0, 0, W, H);

      if (frame < T.intro) {
        if (faseRef.current !== 0) {
          faseRef.current = 0;
          setFaseActual(0);
        }
      } else if (frame < T.corazon) {
        if (faseRef.current !== 1) {
          faseRef.current = 1;
          setFaseActual(1);
        }
        const prog = (frame - T.intro) / DUR.corazon;
        const k = prog * 100;
        setKActual(Math.floor(k));
        dibujarEjes();
        dibujarCorazonConK(k, 0.5 + prog * 0.5);
      } else if (frame < T.pausa) {
        if (faseRef.current !== 2) {
          faseRef.current = 2;
          setFaseActual(2);
          setKActual(100);
          // Arrancar voz solo si no está ya sonando
          if (audioVozRef.current && audioVozRef.current.paused) {
            audioVozRef.current.currentTime = 0;
            audioVozRef.current.play().catch(() => {});
            fadeMusica(0.25, 0.07, 1500);
            audioVozRef.current.addEventListener(
              "ended",
              () => {
                fadeMusica(0.07, 0.25, 2000);
              },
              { once: true },
            );
          }
        }
        dibujarEjes();
        const pulso = 1 + 0.025 * Math.sin(frame * 0.12);
        dibujarCorazonConK(100, 0.9, pulso);
      } else {
        if (faseRef.current !== 3) {
          faseRef.current = 3;
          setFaseActual(3);
          setMostrarTexto(true);
        }
        // Scroll controlado por JS
        const progTexto = (frame - T.pausa) / DUR.texto;
        setScrollTexto(Math.min(progTexto * 100, 100));
        dibujarEjes();
        const pulso = 1 + 0.018 * Math.sin(frame * 0.08);
        dibujarCorazonConK(100, 0.35, pulso);
      }

      setProgreso(frameRef.current);
      frameRef.current++;
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      audioMusicaRef.current?.pause();
      audioVozRef.current?.pause();
    };
  }, []);

  return (
    <div className="ecuacion-overlay">
      <canvas ref={canvasRef} className="ecuacion-canvas" />

      {faseActual >= 1 && (
        <div className="ecuacion-formula">
          <p>
            y = x<sup>2/3</sup> + 0.9 sin(kx){" "}
            <span style={{ fontSize: "1.3em" }}>√</span>
            <span
              style={{
                borderTop: "1px solid rgba(200,50,50,0.9)",
                paddingTop: "1px",
              }}
            >
              (3 − x²)
            </span>
          </p>
          <p>k = {kActual}</p>
        </div>
      )}

      {mostrarTexto && (
        <div className="ecuacion-texto-wrapper">
          <div
            className="ecuacion-texto-scroll"
            style={{
              transform: `translateY(-${scrollTexto}%)`,
              transition: "none",
            }}
          >
            <p className="ecuacion-poema">{diaEspecial.poema}</p>
            <p className="ecuacion-firma-inline">{diaEspecial.firma}</p>
          </div>
        </div>
      )}

      <ControlesAnimacion
        pausado={pausado}
        progreso={progreso}
        duracionTotal={DURACION_TOTAL}
        onPausa={handlePausa}
        onBarra={handleBarra}
        onClose={handleClose}
      />
    </div>
  );
}

export default EcuacionAmor;
