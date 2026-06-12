import React, { useState, useEffect } from "react";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { X } from "@phosphor-icons/react";
import "./CumpleanosTeaser.css";

const CUMPLE = new Date("2026-07-04");

function CumpleanosTeaser({ onClose }) {
  const [fotoUrl, setFotoUrl] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const storage = getStorage();
    getDownloadURL(ref(storage, "portada/cumpleaños.jpg"))
      .then((url) => setFotoUrl(url))
      .catch(() => {});

    // Entrada suave
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 500);
  };

  const diasRestantes = Math.ceil(
    (CUMPLE - new Date()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div
      className={`cumple-backdrop ${visible ? "cumple-backdrop--visible" : ""}`}
      onClick={handleClose}
    >
      <div
        className="cumple-contenido"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="cumple-cerrar" onClick={handleClose}>
          <X size={18} weight="bold" />
        </button>

        <p className="cumple-contador-label">
          {diasRestantes > 0
            ? `Faltan ${diasRestantes} día${diasRestantes !== 1 ? "s" : ""}...`
            : "¡Hoy es el día! 🎉"}
        </p>

        <h2 className="cumple-titulo">Tranquila cielo,</h2>
        <p className="cumple-titulo cumple-titulo--sub">No seas tan impaciente...</p>

        <div className="cumple-linea" />

        <p className="cumple-mensaje">
          Es solo que lo bueno se hace esperar
        </p>

        <p className="cumple-detalle">
          Te quiero mucho y eres muy importante para mí,
          <br />
          nunca lo olvides 💚
        </p>

        {fotoUrl && (
          <div className="cumple-foto-wrapper">
            <img src={fotoUrl} alt="Nosotros" className="cumple-foto" />
            <div className="cumple-foto-glow" />
          </div>
        )}
      </div>
    </div>
  );
}

export default CumpleanosTeaser;