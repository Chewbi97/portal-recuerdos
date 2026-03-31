import React, { useEffect, useRef, useState } from "react";
import ControlesAnimacion from "./ControlesAnimacion";
import { enviarNotificacion } from "../../firebase";
import "./DiaMujer.css";

function DiaMujer({ diaEspecial, onClose }) {
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const animRef = useRef(null);
  const [pausado, setPausado] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const pausadoRef = useRef(false);
  const frameRef = useRef(0);

  // Duración total en frames
  const FPS = 60;
  const DURACION_TOTAL = (3 + 7 + 2 + 3 + 5) * FPS; // todas las fases

  // ESC para cerrar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") handleClose();
      if (e.key === " ") handlePausa(); // espacio también pausa
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handlePausa = () => {
    pausadoRef.current = !pausadoRef.current;
    setPausado(pausadoRef.current);
    if (audioRef.current) {
      pausadoRef.current
        ? audioRef.current.pause()
        : audioRef.current.play().catch(() => {});
    }
  };

  const handleBarra = (valor) => {
    frameRef.current = valor;
    setProgreso(valor);

    // Sincronizar audio con la posición de la barra
    if (audioRef.current) {
      const segundos = valor / FPS;
      audioRef.current.currentTime = Math.min(
        segundos,
        audioRef.current.duration || 0,
      );
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const W = canvas.width,
      H = canvas.height;

    const TOTAL = 2500;
    const DUR = {
      formacion: 3 * FPS,
      giro: 7 * FPS,
      explosion: 2 * FPS,
      texto: 3 * FPS,
      vortice: 5 * FPS,
    };

    let fase = 0,
      time = 0,
      faseTime = 0;

    const hX = (t) => 16 * Math.pow(Math.sin(t), 3);
    const hY = (t) =>
      -(
        13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t)
      );
    const hZ = (t) => 5 * Math.sin(t) * Math.cos(t);

    const genPosCorazon = () => {
      const t = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 0.35);
      const noise = 1 - r;
      return {
        x: hX(t) * r + (Math.random() - 0.5) * noise * 12,
        y: hY(t) * r + (Math.random() - 0.5) * noise * 12,
        z: hZ(t) * r + (Math.random() - 0.5) * noise * 6,
      };
    };

    const sampleText = (text, fontSize, yPos, maxPts = 600) => {
      const off = document.createElement("canvas");
      off.width = W;
      off.height = H;
      const octx = off.getContext("2d");
      octx.fillStyle = "#fff";
      octx.font = `${fontSize}px 'Great Vibes', cursive`;
      octx.textAlign = "center";
      octx.textBaseline = "middle";
      octx.fillText(text, W / 2, yPos);
      const data = octx.getImageData(0, 0, W, H).data;
      const all = [];
      const step = 3;
      for (let py = 0; py < H; py += step)
        for (let px = 0; px < W; px += step)
          if (data[(py * W + px) * 4 + 3] > 100) all.push({ x: px, y: py });
      if (all.length <= maxPts) return all;
      const out = [];
      const skip = Math.ceil(all.length / maxPts);
      for (let i = 0; i < all.length; i += skip) out.push(all[i]);
      return out;
    };

    const fsTitulo = Math.min(W * 0.072, 66);
    const fsFrase = Math.min(W * 0.036, 30);
    const fsFirma = Math.min(W * 0.044, 38);
    const yCorazon = H * 0.4;
    const yTitulo = H * 0.12;
    const yFrase1 = H * 0.72;
    const yFrase2 = H * 0.76;
    const yFirma = H * 0.88;

    const ptsTitulo = sampleText(
      "Feliz Día de la Mujer",
      fsTitulo,
      yTitulo,
      700,
    );
    const ptsFrase1 = sampleText(
      "Bendito el día en que el universo",
      fsFrase,
      yFrase1,
      400,
    );
    const ptsFrase2 = sampleText(
      "decidió cruzar nuestros caminos",
      fsFrase,
      yFrase2,
      400,
    );
    const ptsFirma = sampleText("— Tu Bebé 💚", fsFirma, yFirma, 300);
    const todosTexto = [...ptsTitulo, ...ptsFrase1, ...ptsFrase2, ...ptsFirma];

    class P {
      constructor(idx) {
        const pos = genPosCorazon();
        this.ox = pos.x;
        this.oy = pos.y;
        this.oz = pos.z;
        const tgt = todosTexto[idx % todosTexto.length];
        this.tx = tgt ? tgt.x : W / 2;
        this.ty = tgt ? tgt.y : H / 2;
        this.sx = Math.random() * W;
        this.sy = Math.random() * H;
        this.cvx = (Math.random() - 0.5) * 8;
        this.cvy = (Math.random() - 0.5) * 8;
        const ang = Math.random() * Math.PI * 2;
        const spd = Math.random() * 12 + 4;
        this.evx = Math.cos(ang) * spd;
        this.evy = Math.sin(ang) * spd;
        this.size = Math.random() * 1.8 + 0.4;
        this.op = Math.random() * 0.55 + 0.45;
        this.gold = Math.random() < 0.25;
        this.captured = false;
        this.explX = 0;
        this.explY = 0;
      }

      project(rotY) {
        const cosY = Math.cos(rotY),
          sinY = Math.sin(rotY);
        let rx = this.ox * cosY - this.oz * sinY;
        let ry = this.oy;
        let rz = this.ox * sinY + this.oz * cosY;
        const rx2 = 0.3;
        const ry2 = ry * Math.cos(rx2) - rz * Math.sin(rx2);
        const rz2 = ry * Math.sin(rx2) + rz * Math.cos(rx2);
        const fov = 340;
        const sc = fov / (fov + rz2);
        return {
          x: W / 2 + rx * sc * 13,
          y: yCorazon + ry2 * sc * 13,
          sc,
          rz: rz2,
        };
      }

      col(a) {
        return this.gold ? `rgba(255,210,0,${a})` : `rgba(0,255,100,${a})`;
      }
      shad() {
        return this.gold ? "rgba(255,210,0,0.8)" : "rgba(0,255,100,0.8)";
      }

      draw(rotY) {
        ctx.shadowBlur = 5;
        ctx.shadowColor = this.shad();

        if (fase === 0) {
          const prog = Math.min(faseTime / DUR.formacion, 1);
          const ease = 1 - Math.pow(1 - prog, 2.8);
          const { x, y } = this.project(rotY);
          this.sx +=
            (x - this.sx) * ease * 0.045 + this.cvx * (1 - ease) * 0.25;
          this.sy +=
            (y - this.sy) * ease * 0.045 + this.cvy * (1 - ease) * 0.25;
          this.cvx *= 0.96;
          this.cvy *= 0.96;
          ctx.beginPath();
          ctx.arc(this.sx, this.sy, this.size, 0, Math.PI * 2);
          ctx.fillStyle = this.col(this.op * (0.2 + ease * 0.8));
          ctx.fill();
          return;
        }
        if (fase === 1) {
          const { x, y, sc, rz } = this.project(rotY);
          this.sx = x;
          this.sy = y;
          const bright = 0.35 + Math.max(0, rz / 120) * 0.65;
          const sz = this.size * sc * Math.max(0.25, bright);
          ctx.beginPath();
          ctx.arc(x, y, sz, 0, Math.PI * 2);
          ctx.fillStyle = this.col(this.op * bright);
          ctx.fill();
          return;
        }
        if (fase === 2) {
          if (!this.captured) {
            this.explX = this.sx;
            this.explY = this.sy;
            this.captured = true;
          }
          const prog = faseTime / DUR.explosion;
          this.explX += this.evx * (1 - prog * 0.7);
          this.explY += this.evy * (1 - prog * 0.7);
          ctx.beginPath();
          ctx.arc(this.explX, this.explY, this.size, 0, Math.PI * 2);
          ctx.fillStyle = this.col(this.op * (1 - prog * 0.15));
          ctx.fill();
          return;
        }
        if (fase === 3) {
          const prog = Math.min(faseTime / DUR.texto, 1);
          const ease = 1 - Math.pow(1 - prog, 3);
          this.explX += (this.tx - this.explX) * ease * 0.055;
          this.explY += (this.ty - this.explY) * ease * 0.055;
          ctx.beginPath();
          ctx.arc(this.explX, this.explY, this.size * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = this.col(Math.min(1, prog * 2));
          ctx.fill();
          return;
        }
        if (fase === 4) {
          const prog = Math.min(faseTime / DUR.vortice, 1);
          const esFrase = this.ty > H * 0.6;
          if (esFrase) {
            const { x, y } = this.project(rotY);
            const dx = this.explX - W / 2;
            const dy = this.explY - yCorazon;
            const ang = Math.atan2(dy, dx) + prog * Math.PI * 3;
            const dist = Math.sqrt(dx * dx + dy * dy) * (1 - prog * 0.98);
            this.explX =
              W / 2 + Math.cos(ang) * dist + (x - W / 2) * prog * 0.9;
            this.explY =
              yCorazon + Math.sin(ang) * dist + (y - yCorazon) * prog * 0.9;
            ctx.beginPath();
            ctx.arc(this.explX, this.explY, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.col(this.op * (0.5 + prog * 0.5));
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(this.explX, this.explY, this.size * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = this.col(this.op);
            ctx.fill();
          }
          return;
        }
        if (fase === 5) {
          const { x, y, sc, rz } = this.project(rotY);
          const bright = 0.35 + Math.max(0, rz / 120) * 0.65;
          const sz = this.size * sc * Math.max(0.25, bright);
          this.explX += (x - this.explX) * 0.025;
          this.explY += (y - this.explY) * 0.025;
          ctx.beginPath();
          ctx.arc(this.explX, this.explY, sz, 0, Math.PI * 2);
          ctx.fillStyle = this.col(this.op * bright * 0.85);
          ctx.fill();
        }
      }
    }

    const parts = Array.from({ length: TOTAL }, (_, i) => new P(i));

    const drawText = (alpha = 1) => {
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowBlur = 12;
      ctx.shadowColor = `rgba(0,255,100,${alpha * 0.8})`;
      ctx.fillStyle = `rgba(0,255,100,${alpha})`;
      ctx.font = `${fsTitulo}px 'Great Vibes', cursive`;
      ctx.fillText("Feliz Día de la Mujer", W / 2, yTitulo);
      ctx.shadowBlur = 8;
      ctx.shadowColor = `rgba(0,255,100,${alpha * 0.6})`;
      ctx.fillStyle = `rgba(0,255,100,${alpha * 0.85})`;
      ctx.font = `${fsFrase}px 'Great Vibes', cursive`;
      ctx.fillText("Bendito el día en que el universo", W / 2, yFrase1);
      ctx.fillText("decidió cruzar nuestros caminos", W / 2, yFrase2);
      ctx.shadowBlur = 10;
      ctx.shadowColor = `rgba(255,210,0,${alpha * 0.8})`;
      ctx.fillStyle = `rgba(255,210,0,${alpha})`;
      ctx.font = `${fsFirma}px 'Great Vibes', cursive`;
      ctx.fillText("— Tu Bebé 💚", W / 2, yFirma);
      ctx.restore();
    };

    const drawOrb = () => {
      const prog = Math.min(faseTime / DUR.vortice, 1);
      const orbY = yFrase1 - 20;
      const r = 55 + Math.sin(time * 0.08) * 10;
      const alpha = 1 - prog * 0.5;
      const g1 = ctx.createRadialGradient(W / 2, orbY, 0, W / 2, orbY, r * 2.2);
      g1.addColorStop(0, `rgba(0,255,100,${0.25 * alpha})`);
      g1.addColorStop(0.5, `rgba(0,220,80,${0.12 * alpha})`);
      g1.addColorStop(1, `rgba(0,255,100,0)`);
      ctx.beginPath();
      ctx.ellipse(W / 2, orbY, r * 2.2, r * 0.7, 0, 0, Math.PI * 2);
      ctx.fillStyle = g1;
      ctx.fill();
      const g2 = ctx.createRadialGradient(W / 2, orbY, 0, W / 2, orbY, r);
      g2.addColorStop(0, `rgba(200,255,200,${0.9 * alpha})`);
      g2.addColorStop(0.3, `rgba(0,255,100,${0.7 * alpha})`);
      g2.addColorStop(1, `rgba(0,180,60,0)`);
      ctx.beginPath();
      ctx.ellipse(W / 2, orbY, r, r * 0.45, 0, 0, Math.PI * 2);
      ctx.fillStyle = g2;
      ctx.fill();
      const nRayos = 16;
      for (let i = 0; i < nRayos; i++) {
        const ang = (i / nRayos) * Math.PI * 2 + time * 0.05;
        const ox = W / 2 + Math.cos(ang) * r * 0.9;
        const oy = orbY + Math.sin(ang) * r * 0.4;
        const tx = W / 2 + (Math.random() - 0.5) * 60;
        const ty = yCorazon + 60 + Math.random() * 20;
        const grad = ctx.createLinearGradient(ox, oy, tx, ty);
        grad.addColorStop(0, `rgba(0,255,100,${0.55 * alpha})`);
        grad.addColorStop(0.6, `rgba(0,255,100,${0.2 * alpha})`);
        grad.addColorStop(1, `rgba(0,255,100,0)`);
        ctx.beginPath();
        const cpx = W / 2 + Math.cos(ang + 0.4) * 80;
        const cpy = (oy + ty) * 0.5;
        ctx.moveTo(ox, oy);
        ctx.quadraticCurveTo(cpx, cpy, tx, ty);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1 + Math.random() * 0.8;
        ctx.stroke();
      }
      ctx.shadowBlur = 12;
      ctx.shadowColor = "rgba(0,255,100,1)";
      for (let i = 0; i < 8; i++) {
        const t2 = (time * 0.015 + i * 0.8) % 1;
        const ang2 = i * 0.785 + time * 0.04;
        const px = W / 2 + Math.cos(ang2) * r * 0.6 * (1 - t2);
        const py = orbY - t2 * (orbY - yCorazon - 40);
        ctx.beginPath();
        ctx.arc(px, py, 2.5 * (1 - t2 * 0.6), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,255,100,${(1 - t2) * alpha})`;
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    };

    const loop = () => {
      if (pausadoRef.current) {
        animRef.current = requestAnimationFrame(loop);
        return;
      }

      // Leer tiempo desde frameRef en vez de variable local
      time = frameRef.current;

      // calcular fase según time
      const totalF = DUR.formacion;
      const totalG = totalF + DUR.giro;
      const totalE = totalG + DUR.explosion;
      const totalT = totalE + DUR.texto;
      const totalV = totalT + DUR.vortice;

      if (time < totalF) {
        fase = 0;
        faseTime = time;
      } else if (time < totalG) {
        fase = 1;
        faseTime = time - totalF;
      } else if (time < totalE) {
        fase = 2;
        faseTime = time - totalG;
      } else if (time < totalT) {
        fase = 3;
        faseTime = time - totalE;
      } else if (time < totalV) {
        fase = 4;
        faseTime = time - totalT;
      } else {
        fase = 5;
        faseTime = time - totalV;
      }

      const rotY = time * 0.013;
      ctx.shadowBlur = 0;
      ctx.fillStyle = fase >= 3 ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.20)";
      ctx.fillRect(0, 0, W, H);

      if (fase === 0 || fase === 1 || fase === 5) {
        parts.sort((a, b) => {
          const c = Math.cos(rotY),
            s = Math.sin(rotY);
          return a.oz * c + a.ox * s - (b.oz * c + b.ox * s);
        });
      }

      parts.forEach((p) => p.draw(rotY));

      if (fase >= 3) {
        const alpha = fase === 3 ? Math.min(faseTime / DUR.texto, 1) : 1;
        drawText(alpha);
      }
      if (fase === 4 || fase === 5) drawOrb();

      setProgreso(frameRef.current);
      frameRef.current++;
      animRef.current = requestAnimationFrame(loop);
    };

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    loop();

    const onResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    if (diaEspecial?.audioUrl && audioRef.current) {
      audioRef.current.volume = 0.5;
      audioRef.current.play().catch(() => {});
    }
    // ✅ Notificación al abrir el día especial
    enviarNotificacion(
      `💚 ${diaEspecial.titulo}`,
      diaEspecial.descripcionGaleria || "Un momento especial te espera",
    ).catch(() => {});
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [diaEspecial]);

  const handleClose = () => {
    cancelAnimationFrame(animRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    onClose();
  };

  return (
    <div className="dia-especial-overlay">
      <canvas ref={canvasRef} className="heart-canvas" />
      {diaEspecial?.audioUrl && (
        <audio ref={audioRef} src={diaEspecial.audioUrl} loop />
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

export default DiaMujer;
