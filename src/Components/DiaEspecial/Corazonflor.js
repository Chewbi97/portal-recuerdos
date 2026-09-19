import React, { useEffect, useRef, useState } from "react";
import ControlesAnimacion from "./ControlesAnimacion";
import { enviarNotificacion } from "../../firebase";
import "../DiaEspecial/Corazonflor.css";

const FPS = 60;

// ── Duraciones de cada fase ──
// El corazón YA NO se forma antes del poema: se va completando MIENTRAS se lee,
// durante los primeros "formacion" segundos de la fase de texto. Después de eso
// se queda completo por el resto de la lectura.
const DUR = {
  intro: 5 * FPS,
  formacion: 70 * FPS, // cuánto tarda en completarse el corazón (60-80s), leyendo de fondo
  texto: 340 * FPS, // ← doblado: la canción (3:15) se repite ~2 veces durante la lectura
  outro: 15 * FPS,
};

const T = {
  intro: DUR.intro,
  texto: DUR.intro + DUR.texto,
  outro: DUR.intro + DUR.texto + DUR.outro,
};

const DURACION_TOTAL = T.outro;

const N_CURVAS = 20;
const PASOS_THETA = 360; // resolución angular de cada curva

// ── Genera las 20 curvas una sola vez (en coordenadas "matemáticas") ──
// r(θ) = -2(s·cosθ + c·senθ) / (1 - 0.7·senθ·|cosθ|)   con s=sin(πa/10), c=cos(πa/10)
function generarCurvas() {
  const curvas = [];
  for (let a = 1; a <= N_CURVAS; a++) {
    const s = Math.sin((Math.PI * a) / 10);
    const c = Math.cos((Math.PI * a) / 10);
    const puntos = [];
    for (let i = 0; i <= PASOS_THETA; i++) {
      const theta = (i / PASOS_THETA) * Math.PI * 2;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);
      const denom = 1 - 0.7 * sinT * Math.abs(cosT);
      const r = (-2 * (s * cosT + c * sinT)) / denom;
      // Solo la rama física (r negativo sería una reflexión espuria)
      if (r >= 0) {
        puntos.push({ x: r * cosT, y: r * sinT });
      } else {
        puntos.push(null); // hueco — igual que en la imagen de referencia
      }
    }
    curvas.push(puntos);
  }
  return curvas;
}

const CURVAS = generarCurvas();

// La figura NO es simétrica verticalmente (los lóbulos de arriba llegan más lejos
// que la punta de abajo), así que calculamos su centro real en vez de asumir 0.
function calcularCentroY(curvas) {
  let minY = Infinity;
  let maxY = -Infinity;
  curvas.forEach((curva) => {
    curva.forEach((p) => {
      if (!p) return;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });
  });
  return (minY + maxY) / 2;
}

const CENTRO_Y = calcularCentroY(CURVAS);

function proyectar(mx, my, cx, cy, escala) {
  return { px: cx + mx * escala, py: cy - my * escala };
}

// Interpreta **texto** como negrita (Firestore guarda el poema en texto plano,
// esto evita que los asteriscos salgan literales en pantalla).
function renderConNegritas(texto) {
  if (!texto) return null;
  const partes = texto.split(/(\*\*[^*]+\*\*)/g);
  return partes.map((parte, i) => {
    if (parte.startsWith("**") && parte.endsWith("**")) {
      return <strong key={i}>{parte.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={i}>{parte}</React.Fragment>;
  });
}

function CorazonFlor({ diaEspecial, onClose }) {
  const canvasRef = useRef(null);
  const audioVozRef = useRef(null);
  const audioMusicaRef = useRef(null);
  const volumenBaseMusicaRef = useRef(0.3); // volumen "de referencia" (sin contar el fundido del loop)
  const animRef = useRef(null);
  const frameRef = useRef(0);
  const faseRef = useRef(-1);
  const pausadoRef = useRef(false);
  const vozIniciada = useRef(false);

  const [faseActual, setFaseActual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [mostrarTexto, setMostrarTexto] = useState(false);
  const [scrollTexto, setScrollTexto] = useState(0);
  const [mostrarFirma, setMostrarFirma] = useState(false);
  const [alphaFirma, setAlphaFirma] = useState(0);

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
      if (frameRef.current >= T.intro)
        audioVozRef.current?.play().catch(() => {});
    }
  };

  const fadeMusica = (desde, hasta, duracionMs) => {
    if (!audioMusicaRef.current) return;
    const pasos = 40;
    const diff = (hasta - desde) / pasos;
    let paso = 0;
    const timer = setInterval(() => {
      paso++;
      if (audioMusicaRef.current)
        audioMusicaRef.current.volume = Math.max(
          0,
          Math.min(1, desde + diff * paso),
        );
      if (paso >= pasos) clearInterval(timer);
    }, duracionMs / pasos);
  };

  const handleBarra = (valor) => {
    frameRef.current = valor;
    setProgreso(valor);
    faseRef.current = -1;
    vozIniciada.current = false;

    if (audioMusicaRef.current) {
      volumenBaseMusicaRef.current =
        valor >= T.intro && valor < T.texto ? 0.07 : 0.3;
      audioMusicaRef.current.currentTime =
        (valor / FPS) % (audioMusicaRef.current.duration || 1);
      if (!pausadoRef.current) audioMusicaRef.current.play().catch(() => {});
    }
    const segVoz = (valor - T.intro) / FPS;
    if (segVoz > 0 && audioVozRef.current) {
      audioVozRef.current.currentTime = Math.min(
        segVoz,
        audioVozRef.current.duration || 0,
      );
      if (!pausadoRef.current) audioVozRef.current.play().catch(() => {});
      vozIniciada.current = true;
    } else if (audioVozRef.current) {
      audioVozRef.current.pause();
      audioVozRef.current.currentTime = 0;
    }

    if (valor >= T.intro && valor < T.texto) {
      setScrollTexto(Math.min(((valor - T.intro) / DUR.texto) * 100, 100));
      setMostrarTexto(true);
      setMostrarFirma(false);
    } else if (valor >= T.texto) {
      setMostrarTexto(false);
      setMostrarFirma(true);
    } else {
      setMostrarTexto(false);
      setMostrarFirma(false);
      setScrollTexto(0);
    }
  };

  useEffect(() => {
    const k = (e) => {
      if (e.key === "Escape") handleClose();
    };
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

    if (diaEspecial.musicaUrl) {
      audioMusicaRef.current = new Audio(diaEspecial.musicaUrl);
      audioMusicaRef.current.loop = true;
      audioMusicaRef.current.volume = volumenBaseMusicaRef.current;
      audioMusicaRef.current.play().catch(() => {});

      // ── Fade suave cada vez que la canción vuelve a empezar (loop) ──
      const FADE_LOOP_SEG = 2.5;
      const manejarFadeLoop = () => {
        const audio = audioMusicaRef.current;
        if (!audio || !audio.duration) return;
        const t = audio.currentTime;
        const dur = audio.duration;
        const base = volumenBaseMusicaRef.current;
        if (dur - t < FADE_LOOP_SEG) {
          audio.volume = base * Math.max(0, (dur - t) / FADE_LOOP_SEG);
        } else if (t < FADE_LOOP_SEG) {
          audio.volume = base * Math.min(1, t / FADE_LOOP_SEG);
        } else {
          audio.volume = base;
        }
      };
      audioMusicaRef.current.addEventListener("timeupdate", manejarFadeLoop);
    }
    if (diaEspecial.audioUrl) {
      audioVozRef.current = new Audio(diaEspecial.audioUrl);
      audioVozRef.current.volume = 1;
      audioVozRef.current.preload = "auto";
    }

    enviarNotificacion(
      `💜 ${diaEspecial.titulo}`,
      diaEspecial.descripcionGaleria || "Un momento especial te espera",
    ).catch(() => {});

    // ── Dibuja las 20 curvas hasta cierto progreso angular (0..1) ──
    // progresoGlobal: cuánto de cada curva ya se "dibujó" (todas florecen juntas)
    const dibujarFlor = (progresoGlobal, rot, alphaGlobal, glow = true) => {
      const W = canvas.width;
      const H = canvas.height;
      const escala = Math.min(W, H) * 0.155;
      const cx = W / 2;
      const cy = H * 0.5;
      const cosR = Math.cos(rot);
      const sinR = Math.sin(rot);

      const hastaIndice = Math.floor(progresoGlobal * PASOS_THETA);

      ctx.save();
      ctx.globalAlpha = alphaGlobal;
      if (glow) {
        ctx.shadowBlur = 10;
      }

      CURVAS.forEach((puntos, idx) => {
        // Color: violeta → rosa → dorado según el índice de la curva
        const t = idx / (N_CURVAS - 1);
        const r = Math.floor(170 + t * 60);
        const g = Math.floor(100 + (1 - t) * 40);
        const b = Math.floor(220 - t * 60);
        ctx.strokeStyle = `rgba(${r},${g},${b},0.75)`;
        ctx.shadowColor = `rgba(${r},${g},${b},0.6)`;
        ctx.lineWidth = 1.1;

        ctx.beginPath();
        let trazando = false;
        for (let i = 0; i <= hastaIndice && i <= PASOS_THETA; i++) {
          const p = puntos[i];
          if (!p) {
            trazando = false;
            continue;
          }
          // Rotación 2D suave sobre el propio plano de la figura
          const rx = p.x * cosR - p.y * sinR;
          const ry = p.x * sinR + p.y * cosR - CENTRO_Y;
          const { px, py } = proyectar(rx, ry, cx, cy, escala);
          if (!trazando) {
            ctx.moveTo(px, py);
            trazando = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.stroke();
      });

      ctx.shadowBlur = 0;
      ctx.restore();
    };

    const loop = () => {
      if (pausadoRef.current) {
        animRef.current = requestAnimationFrame(loop);
        return;
      }
      const frame = frameRef.current;
      const W = canvas.width;
      const H = canvas.height;

      ctx.fillStyle = "rgba(5,0,10,0.16)";
      ctx.fillRect(0, 0, W, H);

      const rotLenta = frame * 0.0006;

      if (frame < T.intro) {
        if (faseRef.current !== 0) {
          faseRef.current = 0;
          setFaseActual(0);
        }
        dibujarFlor(0.015, 0, 0.25);
      } else if (frame < T.texto) {
        if (faseRef.current !== 1) {
          faseRef.current = 1;
          setFaseActual(1);
          setMostrarTexto(true);
          if (!vozIniciada.current && audioVozRef.current) {
            audioVozRef.current.currentTime = 0;
            audioVozRef.current.play().catch(() => {});
            vozIniciada.current = true;
            fadeMusica(0.3, 0.07, 1800);
            audioVozRef.current.addEventListener(
              "ended",
              () => fadeMusica(0.07, 0.3, 2000),
              { once: true },
            );
          }
        }
        const tiempoEnTexto = frame - T.intro;
        // El corazón crece durante los primeros DUR.formacion segundos de la lectura,
        // luego se queda completo el resto del poema.
        const progFlor = Math.min(tiempoEnTexto / DUR.formacion, 1);
        setScrollTexto(Math.min((tiempoEnTexto / DUR.texto) * 100, 100));
        // Alpha sube junto con la formación, hasta un tope cómodo para leer encima
        dibujarFlor(progFlor, rotLenta, 0.15 + progFlor * 0.35);
      } else {
        if (faseRef.current !== 2) {
          faseRef.current = 2;
          setFaseActual(2);
          setMostrarTexto(false);
          setMostrarFirma(true);
        }
        setAlphaFirma(Math.min(((frame - T.texto) / DUR.outro) * 1.5, 1));
        dibujarFlor(1, rotLenta, 0.28);
      }

      setProgreso(frameRef.current);
      if (frameRef.current < DURACION_TOTAL) frameRef.current++;
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
    <div className="corazonflor-overlay">
      <canvas ref={canvasRef} className="corazonflor-canvas" />

      {faseActual === 0 && (
        <div className="corazonflor-titulo">
          <p className="corazonflor-titulo-texto">{diaEspecial.titulo}</p>
          {diaEspecial.descripcionGaleria && (
            <span className="corazonflor-subtitulo">
              {diaEspecial.descripcionGaleria}
            </span>
          )}
          {diaEspecial.firma && (
            <span className="corazonflor-firma-intro">
              {diaEspecial.firma}
            </span>
          )}
        </div>
      )}

      {mostrarTexto && (
        <div className="corazonflor-texto-wrapper">
          <div
            className="corazonflor-texto-scroll"
            style={{
              transform: `translateY(-${scrollTexto}%)`,
              transition: "none",
            }}
          >
            <p className="corazonflor-poema">
              {renderConNegritas(diaEspecial.poema)}
            </p>
            <p className="corazonflor-firma-inline">{diaEspecial.firma}</p>
          </div>
        </div>
      )}

      {mostrarFirma && (
        <div
          className="corazonflor-firma-overlay"
          style={{ opacity: alphaFirma }}
        >
          <p>{diaEspecial.firma}</p>
        </div>
      )}

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

export default CorazonFlor;