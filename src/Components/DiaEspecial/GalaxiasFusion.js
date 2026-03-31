import React, { useEffect, useRef, useState } from "react";
import ControlesAnimacion from "./ControlesAnimacion";
import { enviarNotificacion } from "../../firebase";
import "./GalaxiasFusion.css";

const FPS = 60;

const S = {
  intro_fin: 15,
  formacion_fin: 30,
  orbita_fin: 45,
  fusion_fin: 55,
  resultante_fin: 134,
  frase_fin: 152,
  // outro sigue en 166 pero necesita más tiempo
};

const T = {
  intro: S.intro_fin * FPS,
  formacion: S.formacion_fin * FPS,
  orbita: S.orbita_fin * FPS,
  fusion: S.fusion_fin * FPS,
  resultante: S.resultante_fin * FPS,
  frase: S.frase_fin * FPS,
  outro: 175 * FPS,
};

const T_POEMA_INICIO = T.formacion;
const T_POEMA_FIN = T.resultante;
const DUR_POEMA = T_POEMA_FIN - T_POEMA_INICIO;
const DURACION_TOTAL = T.outro;

const ORBITA_RADIO_FINAL = 0.164;

const COL = {
  verde: { r: 46, g: 210, b: 100 },
  verde2: { r: 140, g: 255, b: 170 },
  azul: { r: 50, g: 130, b: 230 },
  azul2: { r: 140, g: 200, b: 255 },
  fusion: { r: 32, g: 195, b: 160 },
  fusion2: { r: 110, g: 245, b: 215 },
  blanco: { r: 220, g: 255, b: 248 },
};

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const ease = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

function generarBrazo(n, vueltas, cIn, cOut, disp = 0.15) {
  return Array.from({ length: n }, (_, i) => {
    const t = i / n;
    const ang = t * Math.PI * 2 * vueltas + (Math.random() - 0.5) * 0.35;
    const rad = 0.03 + t * (0.48 + Math.random() * disp);
    const drft = (Math.random() - 0.5) * disp * 0.55;
    const lx = Math.cos(ang) * (rad + drft);
    const ly = Math.sin(ang) * (rad + drft) * 0.37;
    const col = {
      r: Math.round(lerp(cIn.r, cOut.r, t)),
      g: Math.round(lerp(cIn.g, cOut.g, t)),
      b: Math.round(lerp(cIn.b, cOut.b, t)),
    };
    return {
      lx,
      ly,
      bx: lx,
      by: ly,
      r: 0.9 + Math.random() * 2.2 * (1 - t * 0.45),
      alpha: 0.45 + Math.random() * 0.55 * (1 - t * 0.25),
      col,
      speed: 0.0003 + Math.random() * 0.0005,
      fase: Math.random() * Math.PI * 2,
      freq: 0.014 + Math.random() * 0.024,
      dn: clamp(rad / 0.5, 0, 1),
    };
  });
}

function crearGalaxia(cIn, cOut, brazos = 3, nBrazo = 250) {
  const esMobil = window.innerWidth < 600;
  const brazosReal = esMobil ? 2 : brazos;
  const nBrazoReal = esMobil ? Math.floor(nBrazo * 0.45) : nBrazo;
  const pp = [];
  for (let b = 0; b < brazosReal; b++) {
    const off = (b / brazosReal) * Math.PI * 2;
    const cos = Math.cos(off),
      sin = Math.sin(off);
    generarBrazo(nBrazoReal, 2.0, cIn, cOut).forEach((p) => {
      const rx = p.lx * cos - p.ly * sin;
      const ry = p.lx * sin + p.ly * cos;
      pp.push({ ...p, lx: rx, ly: ry, bx: rx, by: ry });
    });
  }
  const nucleoN = esMobil ? 30 : 80;
  for (let i = 0; i < nucleoN; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = Math.random() * 0.045;
    pp.push({
      lx: Math.cos(a) * d,
      ly: Math.sin(a) * d * 0.32,
      bx: Math.cos(a) * d,
      by: Math.sin(a) * d * 0.32,
      r: 1.5 + Math.random() * 3.5,
      alpha: 0.75 + Math.random() * 0.25,
      col: {
        r: Math.min(255, cIn.r + 70),
        g: Math.min(255, cIn.g + 70),
        b: Math.min(255, cIn.b + 70),
      },
      speed: 0.001 + Math.random() * 0.0012,
      fase: Math.random() * Math.PI * 2,
      freq: 0.03 + Math.random() * 0.04,
      dn: 0,
    });
  }
  return pp;
}

const GAL_VERDE = crearGalaxia(COL.verde2, COL.verde);
const GAL_AZUL = crearGalaxia(COL.azul2, COL.azul);
const GAL_FVERDE = crearGalaxia(COL.fusion2, COL.fusion);
const GAL_FAZUL = crearGalaxia(
  { r: 80, g: 230, b: 200 },
  { r: 20, g: 160, b: 130 },
);

function rasterizarFrase(texto, W, H) {
  const off = document.createElement("canvas");
  off.width = W;
  off.height = 200;
  const c = off.getContext("2d");
  const esMobil = W < 600;
  const fs = esMobil
    ? Math.max(28, Math.floor(W * 0.055))
    : Math.max(20, Math.floor(W * 0.036));
  c.fillStyle = "#fff";
  c.font = `300 ${fs}px 'Cormorant Garamond', serif`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(texto, W / 2, 100, W * 0.9);
  const d = c.getImageData(0, 0, W, 200).data;
  const pts = [];
  for (let y = 0; y < 200; y += 3)
    for (let x = 0; x < W; x += 3)
      if (d[(y * W + x) * 4 + 3] > 110) pts.push({ tx: x, ty: H * 0.22 + y });
  return pts;
}

function GalaxiasFusion({ diaEspecial, onClose }) {
  const canvasRef = useRef(null);
  const audioVozRef = useRef(null);
  const audioMusRef = useRef(null);
  const animRef = useRef(null);
  const frameRef = useRef(0);
  const faseRef = useRef(-1);
  const pausadoRef = useRef(false);
  const vozIniciada = useRef(false);
  const fraseRef = useRef([]);
  const loopStartTimeRef = useRef(null); // ✅ para sincronizar tiempo real
  const mostrarPoemaRef = useRef(false);

  const [mostrarPoemaState, setMostrarPoemaState] = useState(false);
  const [faseActual, setFaseActual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [scrollOff, setScrollOff] = useState(0);
  const [mostrarFirma, setMostrarFirma] = useState(false);
  const [alphaFirma, setAlphaFirma] = useState(0);

  const fadeMusica = (de, a, ms) => {
    if (!audioMusRef.current) return;
    const n = 40,
      d = (a - de) / n;
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
      loopStartTimeRef.current = null; // ✅ resetear al reanudar
      audioMusRef.current?.play().catch(() => {});
      if (vozIniciada.current) audioVozRef.current?.play().catch(() => {});
    }
  };

  const handleBarra = (val) => {
    frameRef.current = val;
    setProgreso(val);
    faseRef.current = -1;
    vozIniciada.current = false;
    loopStartTimeRef.current = null; // ✅ resetear al mover la barra

    const enPoema = val >= T_POEMA_INICIO && val < T_POEMA_FIN;
    mostrarPoemaRef.current = enPoema;
    setMostrarPoemaState(enPoema);

    if (enPoema) {
      const prog = (val - T_POEMA_INICIO) / DUR_POEMA;
      setScrollOff(Math.min(prog * 90, 90));
    } else if (val < T_POEMA_INICIO) {
      setScrollOff(0);
    }

    if (audioMusRef.current) {
      audioMusRef.current.currentTime = clamp(
        val / FPS,
        0,
        audioMusRef.current.duration || 999,
      );
      audioMusRef.current.volume = enPoema ? 0.06 : 0.35;
      if (!pausadoRef.current) audioMusRef.current.play().catch(() => {});
    }
    if (val >= T.formacion && audioVozRef.current) {
      const sv = (val - T.formacion) / FPS;
      audioVozRef.current.currentTime = Math.min(
        sv,
        audioVozRef.current.duration || 0,
      );
      if (!pausadoRef.current) audioVozRef.current.play().catch(() => {});
      vozIniciada.current = true;
    } else if (audioVozRef.current) {
      audioVozRef.current.pause();
      audioVozRef.current.currentTime = 0;
    }
    setMostrarFirma(val >= T.frase);
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

    if (diaEspecial.musicaurl) {
      const m = new Audio(diaEspecial.musicaurl);
      m.loop = true;
      m.volume = 0.18;
      m.play().catch(() => {});
      audioMusRef.current = m;
    }
    if (diaEspecial.audiourl) {
      const v = new Audio(diaEspecial.audiourl);
      v.volume = 1;
      v.preload = "auto";
      audioVozRef.current = v;
    }

    enviarNotificacion(
      `🌌 ${diaEspecial.titulo}`,
      diaEspecial.descripcionGaleria || "",
    ).catch(() => {});

    document.fonts.ready.then(() => {
      const pts = rasterizarFrase(
        "Para el rayito más brillante del sol",
        canvas.width,
        canvas.height,
      );
      const esMobil = canvas.width < 600;
      fraseRef.current = pts.map((pt) => ({
        x: canvas.width * Math.random(),
        y: canvas.height * (0.4 + Math.random() * 0.6),
        tx: pt.tx,
        ty: pt.ty,
        r: esMobil ? 2.5 + Math.random() * 2.0 : 1.2 + Math.random() * 1.8,
        alpha: 0,
        col: Math.random() < 0.55 ? COL.fusion2 : COL.blanco,
        spd: 0.08 + Math.random() * 0.08,
      }));
    });

    const esMobilCanvas = canvas.width < 600;
    const STARS = Array.from({ length: esMobilCanvas ? 80 : 200 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.3 + Math.random() * 1.4,
      a: 0.08 + Math.random() * 0.5,
      f: Math.random() * Math.PI * 2,
      q: 0.004 + Math.random() * 0.009,
    }));

    const drawStars = (fr) => {
      const W = canvas.width,
        H = canvas.height;
      ctx.save();
      for (const s of STARS) {
        ctx.globalAlpha = s.a * (0.5 + 0.5 * Math.sin(fr * s.q + s.f));
        ctx.fillStyle = "#dffff5";
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const drawGal = (parts, cx, cy, esc, rot, fr, alpG, progF, mix = 0) => {
      ctx.save();
      for (const p of parts) {
        const ap = fr * p.speed + p.fase;
        const cp = Math.cos(ap),
          sp = Math.sin(ap);
        const rlx = p.bx * cp - p.by * sp;
        const rly = p.bx * sp + p.by * cp;
        const cr = Math.cos(rot),
          sr = Math.sin(rot);
        const fx = rlx * cr - rly * sr;
        const fy = rlx * sr + rly * cr;
        const vis = clamp(
          (progF - p.dn * 0.55) / (1 - p.dn * 0.55 + 0.01),
          0,
          1,
        );
        const pb = 0.55 + 0.45 * Math.abs(Math.sin(fr * p.freq + p.fase));
        const alp = p.alpha * pb * alpG * ease(vis);
        if (alp < 0.01) continue;
        const { r: cr2, g: cg, b: cb } = p.col;
        const { r: fr2, g: fg, b: fb } = COL.fusion;
        const rr = Math.round(lerp(cr2, fr2, mix));
        const rg = Math.round(lerp(cg, fg, mix));
        const rb = Math.round(lerp(cb, fb, mix));
        const px = cx + fx * esc,
          py = cy + fy * esc;
        const h = ctx.createRadialGradient(px, py, 0, px, py, p.r * 8);
        h.addColorStop(0, `rgba(${rr},${rg},${rb},${alp})`);
        h.addColorStop(0.28, `rgba(${rr},${rg},${rb},${alp * 0.5})`);
        h.addColorStop(0.65, `rgba(${rr},${rg},${rb},${alp * 0.12})`);
        h.addColorStop(1, `rgba(${rr},${rg},${rb},0)`);
        ctx.fillStyle = h;
        ctx.beginPath();
        ctx.arc(px, py, p.r * 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = alp;
        ctx.fillStyle = `rgb(${Math.min(255, rr + 110)},${Math.min(255, rg + 110)},${Math.min(255, rb + 110)})`;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(0.2, p.r * 0.4), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    };

    let exParts = [],
      exHecha = false;
    const crearEx = (cx, cy) => {
      const cols = [
        COL.verde,
        COL.azul,
        COL.fusion,
        COL.fusion2,
        COL.verde2,
        COL.azul2,
      ];
      exParts = Array.from({ length: 400 }, () => {
        const a = Math.random() * Math.PI * 2,
          s = 0.6 + Math.random() * 8;
        return {
          x: cx,
          y: cy,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          r: 1 + Math.random() * 3,
          life: 1,
          dec: 0.005 + Math.random() * 0.011,
          col: cols[Math.floor(Math.random() * cols.length)],
        };
      });
    };

    const drawEx = () => {
      ctx.save();
      for (const p of exParts) {
        if (p.life <= 0) continue;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.vy += 0.015;
        p.life -= p.dec;
        const { r, g, b } = p.col;
        ctx.globalAlpha = Math.max(0, p.life * 0.88);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `rgb(${r},${g},${b})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.1, p.r * p.life), 0, Math.PI * 2);
        ctx.fill();
      }
      exParts = exParts.filter((p) => p.life > 0);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      ctx.restore();
    };

    const drawFrase = (prog) => {
      const W = canvas.width,
        H = canvas.height;
      ctx.save();
      const esMobil = W < 600;
      const fs = esMobil
        ? Math.max(24, Math.floor(W * 0.052))
        : Math.max(20, Math.floor(W * 0.036));

      ctx.font = `300 ${fs}px 'Cormorant Garamond', serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Fade in suave según prog
      const alpha = Math.min(prog * 2, 1);
      ctx.globalAlpha = alpha;

      // Glow neón
      ctx.shadowBlur = 20;
      ctx.shadowColor = "rgba(110, 245, 215, 0.8)";
      ctx.fillStyle = "#ffffff";

      ctx.fillText(
        "Para el rayito más brillante del sol",
        W / 2,
        H * 0.22,
        W * 0.85,
      );

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      ctx.restore();
    };

    const actualizarTexto = (fr) => {
      if (fr < T_POEMA_INICIO || fr >= T_POEMA_FIN) return;
      if (!mostrarPoemaRef.current) {
        mostrarPoemaRef.current = true;
        setMostrarPoemaState(true);
      }
      const prog = (fr - T_POEMA_INICIO) / DUR_POEMA;
      setScrollOff(Math.min(prog * 90, 90));
    };

    const loop = (timestamp) => {
      if (pausadoRef.current) {
        animRef.current = requestAnimationFrame(loop);
        return;
      }

      // ✅ Sincronizar con tiempo real respetando posición de barra
      if (!loopStartTimeRef.current) {
        loopStartTimeRef.current = timestamp - (frameRef.current / FPS) * 1000;
      }
      const segundosReales = (timestamp - loopStartTimeRef.current) / 1000;
      frameRef.current = Math.min(
        Math.floor(segundosReales * FPS),
        DURACION_TOTAL,
      );

      const fr = frameRef.current;
      const W = canvas.width,
        H = canvas.height;

      ctx.fillStyle = "rgba(2,4,14,0.17)";
      ctx.fillRect(0, 0, W, H);
      drawStars(fr);

      const ESC = Math.min(W, H) * 0.48;
      const SEP = W * 0.21;
      const MID = H * 0.5;

      if (fr < T.intro) {
        if (faseRef.current !== 0) {
          faseRef.current = 0;
          setFaseActual(0);
        }
        const a = clamp(fr / (FPS * 2), 0, 1);
        drawGal(
          GAL_VERDE,
          W / 2 - SEP * 0.5,
          MID,
          ESC * 0.28,
          fr * 0.002,
          fr,
          a * 0.18,
          0.4,
        );
        drawGal(
          GAL_AZUL,
          W / 2 + SEP * 0.5,
          MID,
          ESC * 0.28,
          -fr * 0.002,
          fr,
          a * 0.18,
          0.4,
        );
      } else if (fr < T.formacion) {
        if (faseRef.current !== 1) {
          faseRef.current = 1;
          setFaseActual(1);
        }
        const p = (fr - T.intro) / (T.formacion - T.intro);
        drawGal(GAL_VERDE, W / 2 - SEP, MID, ESC, fr * 0.003, fr, 0.92, p);
        drawGal(GAL_AZUL, W / 2 + SEP, MID, ESC, -fr * 0.003, fr, 0.92, p);
      } else if (fr < T.orbita) {
        if (faseRef.current !== 2) {
          faseRef.current = 2;
          setFaseActual(2);
          if (!vozIniciada.current && audioVozRef.current) {
            audioVozRef.current.currentTime = 0;
            audioVozRef.current.play().catch(() => {});
            vozIniciada.current = true;
            fadeMusica(0.35, 0.06, 1600);
            audioVozRef.current.addEventListener(
              "ended",
              () => fadeMusica(0.06, 0.18, 2000),
              { once: true },
            );
          }
        }
        const tO = (fr - T.formacion) / (T.orbita - T.formacion);
        const oR = W * 0.2 * (1 - tO * 0.18);
        const oA = tO * Math.PI * 1.35;
        drawGal(
          GAL_VERDE,
          W / 2 + Math.cos(oA) * oR,
          MID + Math.sin(oA) * oR * 0.28,
          ESC,
          fr * 0.003,
          fr,
          0.95,
          1,
        );
        drawGal(
          GAL_AZUL,
          W / 2 + Math.cos(oA + Math.PI) * oR,
          MID + Math.sin(oA + Math.PI) * oR * 0.28,
          ESC,
          -fr * 0.003,
          fr,
          0.95,
          1,
        );
        actualizarTexto(fr);
      } else if (fr < T.fusion) {
        if (faseRef.current !== 3) {
          faseRef.current = 3;
          setFaseActual(3);
          exHecha = false;
        }
        const tF = (fr - T.orbita) / (T.fusion - T.orbita);
        const tE = ease(tF);
        const mix = clamp((tF - 0.42) / 0.58, 0, 1);
        const escF = ESC * (1 + tF * 0.28);
        if (tF > 0.48 && !exHecha) {
          crearEx(W / 2, H / 2);
          exHecha = true;
        }
        const startX = W * ORBITA_RADIO_FINAL;
        drawGal(
          GAL_VERDE,
          lerp(W / 2 + startX, W / 2, tE),
          H / 2,
          escF,
          fr * 0.003,
          fr,
          0.95,
          1,
          mix,
        );
        drawGal(
          GAL_AZUL,
          lerp(W / 2 - startX, W / 2, tE),
          H / 2,
          escF,
          -fr * 0.003,
          fr,
          0.95,
          1,
          mix,
        );
        if (exHecha) drawEx();
        actualizarTexto(fr);
      } else if (fr < T.resultante) {
        if (faseRef.current !== 4) {
          faseRef.current = 4;
          setFaseActual(4);
        }
        const tR = (fr - T.fusion) / (T.resultante - T.fusion);
        const escR = ESC * (1.15 + tR * 0.06);
        drawGal(GAL_FVERDE, W / 2, H / 2, escR, fr * 0.0016, fr, 0.88, 1);
        drawGal(GAL_FAZUL, W / 2, H / 2, escR, -fr * 0.0016, fr, 0.72, 1);
        drawEx();
        actualizarTexto(fr);
      } else if (fr < T.frase) {
        if (faseRef.current !== 5) {
          faseRef.current = 5;
          setFaseActual(5);
          mostrarPoemaRef.current = false;
          setMostrarPoemaState(false);
        }
        const tFr = (fr - T.resultante) / (T.frase - T.resultante);
        drawGal(GAL_FVERDE, W / 2, H / 2, ESC * 0.52, fr * 0.0013, fr, 0.32, 1);
        drawGal(GAL_FAZUL, W / 2, H / 2, ESC * 0.52, -fr * 0.0013, fr, 0.26, 1);
        drawFrase(ease(tFr));
      } else {
        if (faseRef.current !== 6) {
          faseRef.current = 6;
          setFaseActual(6);
          setMostrarFirma(true);
          mostrarPoemaRef.current = false;
        }
        const p = clamp(((fr - T.frase) / (T.outro - T.frase)) * 1.4, 0, 1);
        setAlphaFirma(p);
        drawGal(GAL_FVERDE, W / 2, H / 2, ESC * 0.46, fr * 0.001, fr, 0.5, 1);
        drawGal(GAL_FAZUL, W / 2, H / 2, ESC * 0.46, -fr * 0.001, fr, 0.4, 1);
        drawFrase(1);
      }

      setProgreso(frameRef.current);
      animRef.current = requestAnimationFrame(loop);
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
    <div className="galaxias-overlay">
      <canvas ref={canvasRef} className="galaxias-canvas" />

      {faseActual === 0 && (
        <div className="galaxias-intro">
          <p className="galaxias-titulo-texto">{diaEspecial.titulo}</p>
          <span className="galaxias-subtitulo">
            {diaEspecial.descripcionGaleria}
          </span>
        </div>
      )}

      {faseActual === 2 && (
        <div className="galaxias-labels">
          <span className="label-verde">Mis Ojitos 💚</span>
          <span className="label-azul">Tu Bebé 💙</span>
        </div>
      )}

      {mostrarPoemaState && (
        <div className="galaxias-poema-wrapper">
          <div
            className="galaxias-poema-scroll"
            style={{
              transform: `translateY(-${scrollOff}%)`,
              transition: "none",
            }}
          >
            <p className="galaxias-poema">{diaEspecial.poema}</p>
          </div>
        </div>
      )}

      {mostrarFirma && (
        <div className="galaxias-firma-overlay" style={{ opacity: alphaFirma }}>
          <p className="galaxias-firma-texto">{diaEspecial.firma}</p>
          <div className="galaxias-firma-linea" />
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

export default GalaxiasFusion;
