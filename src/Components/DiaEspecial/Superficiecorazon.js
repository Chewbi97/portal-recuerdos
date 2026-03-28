import React, { useEffect, useRef, useState } from "react";
import ControlesAnimacion from "./ControlesAnimacion";
import { enviarNotificacion } from "../../firebase";
import "./SuperficieCorazon.css";

const FPS = 60;

const DUR = {
  intro: 5 * FPS,
  construccion: 70 * FPS,
  pausa: 3 * FPS,
  texto: 166 * FPS,
  outro: 8 * FPS,
};

const T = {
  intro: DUR.intro,
  construccion: DUR.intro + DUR.construccion,
  pausa: DUR.intro + DUR.construccion + DUR.pausa,
  texto: DUR.intro + DUR.construccion + DUR.pausa + DUR.texto,
  outro: DUR.intro + DUR.construccion + DUR.pausa + DUR.texto + DUR.outro,
};

const DURACION_TOTAL = T.outro;

// Parametrización CORRECTA del Heart Surface 3D
// u ∈ [0, π], v ∈ [0, 2π]
// x = sin³(u)·cos(v)
// z = sin³(u)·sin(v)
// y = (13cos(u) - 5cos(2u) - 2cos(3u) - cos(4u)) / 17
// Esta es la parametrización estándar que da la forma de corazón con hendidura arriba y punta abajo
function generarMalla(pasosU = 60, pasosV = 60) {
  const puntos = [];
  for (let i = 0; i <= pasosU; i++) {
    const fila = [];
    const u = (i / pasosU) * Math.PI; // 0..π
    const sinU = Math.sin(u);
    const cosU = Math.cos(u);
    const sin3U = sinU * sinU * sinU;
    // Perfil Y: da la hendidura en u=0 (arriba) y la punta en u=π (abajo)
    const y =
      (13 * cosU -
        5 * Math.cos(2 * u) -
        2 * Math.cos(3 * u) -
        Math.cos(4 * u)) /
      17;
    for (let j = 0; j <= pasosV; j++) {
      const v = (j / pasosV) * Math.PI * 2; // 0..2π
      const x = sin3U * Math.cos(v);
      const z = sin3U * Math.sin(v) * 0.35; // aplanado: Z mucho más delgado que X
      fila.push({ x, y, z });
    }
    puntos.push(fila);
  }
  return puntos;
}

const MALLA = generarMalla(60, 60);

// Proyección 3D → 2D, solo rotación en Y (giro horizontal)
function proyectar(x, y, z, rotY, cx, cy, escala) {
  const cosY = Math.cos(rotY),
    sinY = Math.sin(rotY);
  const x1 = x * cosY - z * sinY;
  const z1 = x * sinY + z * cosY;
  // Leve inclinación fija en X para ver el volumen 3D
  const tiltX = 0.5; // más inclinado para ver el aplanado
  const cosX = Math.cos(tiltX),
    sinX = Math.sin(tiltX);
  const y1 = y * cosX - z1 * sinX;
  const z2 = y * sinX + z1 * cosX;
  // Perspectiva suave
  const dist = 7;
  const factor = dist / (dist + z2 * 0.15);
  return {
    px: cx + x1 * escala * factor,
    py: cy - y1 * escala * factor * 0.95,
    z: z2,
  };
}

function SuperficieCorazon({ diaEspecial, onClose }) {
  const canvasRef = useRef(null);
  const audioVozRef = useRef(null);
  const audioMusicaRef = useRef(null);
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
      if (frameRef.current >= T.pausa)
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
      audioMusicaRef.current.volume =
        valor >= T.pausa && valor < T.texto ? 0.07 : 0.3;
      audioMusicaRef.current.currentTime =
        (valor / FPS) % (audioMusicaRef.current.duration || 1);
      if (!pausadoRef.current) audioMusicaRef.current.play().catch(() => {});
    }
    const segVoz = (valor - T.pausa) / FPS;
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

    if (valor >= T.pausa && valor < T.texto) {
      setScrollTexto(Math.min(((valor - T.pausa) / DUR.texto) * 100, 100));
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
      audioMusicaRef.current.volume = 0.3;
      audioMusicaRef.current.play().catch(() => {});
    }
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

    // Partículas de fondo neón
    const NUM_PARTICULAS = 180;
    const particulas = Array.from({ length: NUM_PARTICULAS }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.5 + Math.random() * 1.8,
      speed: 0.00008 + Math.random() * 0.00015,
      fase: Math.random() * Math.PI * 2,
      frecParpadeo: 0.02 + Math.random() * 0.04,
    }));

    const dibujarParticulas = (frame, alphaMax) => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.save();
      for (const p of particulas) {
        // Movimiento lento hacia arriba
        p.y -= p.speed;
        if (p.y < 0) {
          p.y = 1;
          p.x = Math.random();
        }
        // Parpadeo suave
        const brillo =
          0.3 + 0.7 * Math.abs(Math.sin(frame * p.frecParpadeo + p.fase));
        const alpha = brillo * alphaMax;
        const px = p.x * W;
        const py = p.y * H;
        // Halo neón verde
        const grad = ctx.createRadialGradient(px, py, 0, px, py, p.r * 3);
        grad.addColorStop(0, `rgba(255,220,80,${alpha})`);
        grad.addColorStop(0.4, `rgba(200,150,30,${alpha * 0.6})`);
        grad.addColorStop(1, `rgba(120,80,0,0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, p.r * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    // Dibuja el corazón relleno con gradiente sólido verde (fase final)
    const dibujarCorazonSolido = (rotY, alpha) => {
      const W = canvas.width;
      const H = canvas.height;
      const escala = Math.min(W, H) * 0.3;
      const cx = W / 2;
      const cy = H * 0.48;
      const filas = MALLA.length;
      const cols = MALLA[0].length;

      ctx.save();
      ctx.globalAlpha = alpha;

      // Dibujar cada "cinta" horizontal entre anillo i e i+1 como polígono relleno
      for (let i = 0; i < filas - 1; i++) {
        // Calcular y promedio del anillo para el color del degradado
        const yAvg = (MALLA[i][0].y + MALLA[i + 1][0].y) / 2;
        // Normalizar yAvg: 1=arriba(hendidura), 0=abajo(punta)
        const tColor = Math.max(0, Math.min(1, (yAvg + 0.4) / 1.1));

        // Degradado vertical: verde oscuro abajo → verde brillante arriba
        const r = Math.floor(5 + tColor * 25);
        const g = Math.floor(80 + tColor * 175);
        const b = Math.floor(20 + tColor * 60);

        // Solo dibujar anillos visibles (los de frente, z > 0)
        for (let j = 0; j < cols; j++) {
          const j2 = (j + 1) % cols;
          const p00 = proyectar(
            MALLA[i][j].x,
            MALLA[i][j].y,
            MALLA[i][j].z,
            rotY,
            cx,
            cy,
            escala,
          );
          const p01 = proyectar(
            MALLA[i][j2].x,
            MALLA[i][j2].y,
            MALLA[i][j2].z,
            rotY,
            cx,
            cy,
            escala,
          );
          const p10 = proyectar(
            MALLA[i + 1][j].x,
            MALLA[i + 1][j].y,
            MALLA[i + 1][j].z,
            rotY,
            cx,
            cy,
            escala,
          );
          const p11 = proyectar(
            MALLA[i + 1][j2].x,
            MALLA[i + 1][j2].y,
            MALLA[i + 1][j2].z,
            rotY,
            cx,
            cy,
            escala,
          );

          // Solo cara frontal (z positivo)
          const zAvg = (p00.z + p01.z + p10.z + p11.z) / 4;
          const zNorm = Math.max(0, Math.min(1, (zAvg + 1.2) / 2.4));

          // Degradado verde → azul-verde según posición y profundidad
          // tColor: 1=lóbulos arriba (verde brillante), 0=punta abajo (verde azulado oscuro)
          // zNorm: 1=frente (brillante), 0=atrás (oscuro)
          const luz = 0.35 + zNorm * 0.65;
          // Verde puro en la zona media, azul-verde en la punta, verde lima en los lóbulos
          const rFinal = Math.floor((5 + tColor * 20) * luz);
          const gFinal = Math.floor((100 + tColor * 130 + zNorm * 50) * luz);
          const bFinal = Math.floor(
            (60 + (1 - tColor) * 120 + zNorm * 40) * luz,
          );

          ctx.beginPath();
          ctx.moveTo(p00.px, p00.py);
          ctx.lineTo(p01.px, p01.py);
          ctx.lineTo(p11.px, p11.py);
          ctx.lineTo(p10.px, p10.py);
          ctx.closePath();
          ctx.fillStyle = `rgba(${rFinal},${gFinal},${bFinal},${0.82 + zNorm * 0.18})`;
          ctx.fill();
        }
      }

      ctx.restore();
    };

    const dibujarMalla = (progConstruccion, rotY, alphaGlobal) => {
      const W = canvas.width;
      const H = canvas.height;
      const escala = Math.min(W, H) * 0.3;
      const cx = W / 2;
      const cy = H * 0.48;
      const filas = MALLA.length;
      const cols = MALLA[0].length;
      const filasVisibles = Math.floor(progConstruccion * filas);

      ctx.save();
      ctx.globalAlpha = alphaGlobal;

      // Efecto neón: shadowBlur en el canvas
      ctx.shadowBlur = 8;
      ctx.shadowColor = "rgba(0,255,80,0.5)";

      // Anillos horizontales — cada línea con degradado de brillo neón
      for (let i = 0; i < filasVisibles; i++) {
        // Línea base oscura
        ctx.beginPath();
        let primero = true;
        const puntos = [];
        for (let j = 0; j <= cols; j++) {
          const jj = j % cols;
          const p = MALLA[i][jj];
          const proj = proyectar(p.x, p.y, p.z, rotY, cx, cy, escala);
          puntos.push(proj);
          if (primero) {
            ctx.moveTo(proj.px, proj.py);
            primero = false;
          } else ctx.lineTo(proj.px, proj.py);
        }
        // Color base según profundidad promedio
        const zAvg = puntos.reduce((s, p) => s + p.z, 0) / puntos.length;
        const zN = Math.max(0, Math.min(1, (zAvg + 1.2) / 2.4));
        const g = Math.floor(90 + zN * 165);
        const r = Math.floor(5 + zN * 30);
        ctx.strokeStyle = `rgba(${r},${g},30,${0.3 + zN * 0.65})`;
        ctx.lineWidth = 0.6 + zN * 1.0;
        ctx.stroke();
      }

      // Meridianos — más tenues, sin shadow para no saturar
      ctx.shadowBlur = 4;
      const meridianos =
        progConstruccion >= 1
          ? cols
          : Math.floor(progConstruccion * cols * 1.5);
      for (let j = 0; j < Math.min(meridianos, cols); j++) {
        ctx.beginPath();
        let primero = true;
        for (let i = 0; i < filasVisibles; i++) {
          const p = MALLA[i][j];
          const { px, py, z } = proyectar(p.x, p.y, p.z, rotY, cx, cy, escala);
          const zNorm = Math.max(0, Math.min(1, (z + 1.2) / 2.4));
          const g2 = Math.floor(70 + zNorm * 175);
          ctx.strokeStyle = `rgba(10,${g2},20,${0.18 + zNorm * 0.5})`;
          ctx.lineWidth = 0.4 + zNorm * 0.6;
          if (primero) {
            ctx.moveTo(px, py);
            primero = false;
          } else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

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

      ctx.fillStyle = "rgba(0,0,0,0.13)";
      ctx.fillRect(0, 0, W, H);

      const rotY = frame * 0.0015;
      dibujarParticulas(frame, 0.55); // rotación horizontal lenta

      if (frame < T.intro) {
        if (faseRef.current !== 0) {
          faseRef.current = 0;
          setFaseActual(0);
        }
        dibujarMalla(0.03, rotY, 0.2);
      } else if (frame < T.construccion) {
        if (faseRef.current !== 1) {
          faseRef.current = 1;
          setFaseActual(1);
        }
        const prog = (frame - T.intro) / DUR.construccion;
        dibujarMalla(prog, rotY, 0.5 + prog * 0.5);
      } else if (frame < T.pausa) {
        if (faseRef.current !== 2) {
          faseRef.current = 2;
          setFaseActual(2);
        }
        // Transición suave: alpha del sólido sube de 0→1 durante la pausa (3s)
        const progTransicion = (frame - T.construccion) / DUR.pausa;
        const alphaSolido = Math.min(progTransicion, 1);
        const alphaMalla = Math.max(1 - progTransicion * 1.5, 0);
        if (alphaMalla > 0) dibujarMalla(1, rotY, alphaMalla);
        dibujarCorazonSolido(rotY, alphaSolido);
      } else if (frame < T.texto) {
        if (faseRef.current !== 3) {
          faseRef.current = 3;
          setFaseActual(3);
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
        setScrollTexto(Math.min(((frame - T.pausa) / DUR.texto) * 100, 100));
        dibujarCorazonSolido(rotY, 0.5);
      } else {
        if (faseRef.current !== 4) {
          faseRef.current = 4;
          setFaseActual(4);
          setMostrarTexto(false);
          setMostrarFirma(true);
        }
        setAlphaFirma(Math.min(((frame - T.texto) / DUR.outro) * 1.5, 1));
        dibujarCorazonSolido(rotY, 0.3);
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
    <div className="corazon3d-overlay">
      <canvas ref={canvasRef} className="corazon3d-canvas" />

      {faseActual === 0 && (
        <div className="corazon3d-titulo">
          <p>{diaEspecial.titulo}</p>
        </div>
      )}

      {faseActual >= 1 && faseActual <= 2 && (
        <div className="corazon3d-formula">
          <span className="formula-eq">
            (x² + <sup>9</sup>/<sub>4</sub>y² + z² − 1)<sup>3</sup> − x²z³ −{" "}
            <sup>9</sup>/<sub>200</sub>y²z³ = 0
          </span>
        </div>
      )}

      {mostrarTexto && (
        <div className="corazon3d-texto-wrapper">
          <div
            className="corazon3d-texto-scroll"
            style={{
              transform: `translateY(-${scrollTexto}%)`,
              transition: "none",
            }}
          >
            <p className="corazon3d-poema">{diaEspecial.poema}</p>
            <p className="corazon3d-firma-inline">{diaEspecial.firma}</p>
          </div>
        </div>
      )}

      {mostrarFirma && (
        <div
          className="corazon3d-firma-overlay"
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
      />
    </div>
  );
}

export default SuperficieCorazon;
