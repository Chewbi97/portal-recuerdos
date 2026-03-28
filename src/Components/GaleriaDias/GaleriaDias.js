import React, { useState, useEffect } from "react";
import { X, CalendarBlank, MusicNote, SpinnerGap } from "@phosphor-icons/react";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";
import "./GaleriaDias.css";

function GaleriaDias({ onSeleccionar, onClose }) {
  const [momentos, setMomentos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarMomentos = async () => {
      try {
        const snapshot = await getDocs(collection(db, "diasEspeciales"));
        const docs = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((d) => d.activo) // solo los activos
          .sort((a, b) => a.fecha?.localeCompare(b.fecha)); // ordenados por fecha
        setMomentos(docs);
      } catch (error) {
        console.error("Error cargando momentos:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarMomentos();
  }, []);

  return (
    <div className="galeria-overlay" onClick={onClose}>
      <div className="galeria-container" onClick={(e) => e.stopPropagation()}>
        <button className="galeria-close" onClick={onClose}>
          <X size={20} weight="bold" />
        </button>

        <div className="galeria-header">
          <h1 className="galeria-titulo">Nuestros Momentos Especiales</h1>
          <p className="galeria-subtitulo">
            Cada fecha, un recuerdo que vive para siempre 💌
          </p>
        </div>

        {loading ? (
          <div className="galeria-loading">
            <SpinnerGap size={28} weight="light" className="spinner" />
            <p>Cargando momentos...</p>
          </div>
        ) : momentos.length === 0 ? (
          <div className="galeria-empty">
            <p>Aún no hay momentos especiales guardados 💌</p>
          </div>
        ) : (
          <div className="galeria-grid">
            {momentos.map((momento) => (
              <div
                key={momento.id}
                className="momento-card"
                style={{
                  background: `rgba(${momento.colorTema || "255,255,255"}, 0.1)`,
                  borderColor: `rgba(${momento.colorTema || "255,255,255"}, 0.35)`,
                }}
                onClick={() => onSeleccionar(momento.id)}
              >
                <div className="momento-emoji">{momento.emoji || "💌"}</div>
                <div className="momento-info">
                  <h2 className="momento-nombre">{momento.titulo}</h2>
                  <p className="momento-fecha">
                    <CalendarBlank size={14} weight="light" /> {momento.fecha}
                  </p>
                  <p className="momento-desc">{momento.descripcionGaleria}</p>
                </div>
                <div className="momento-play">
                  <MusicNote size={22} weight="light" />
                  <span>Revivir</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default GaleriaDias;
