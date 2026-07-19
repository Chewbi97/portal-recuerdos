import React, { useState, useEffect } from "react";
import {
  X,
  CalendarBlank,
  MusicNote,
  SpinnerGap,
  Cake,
  Heart,
} from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";
import "./GaleriaDias.css";

function GaleriaDias({ onSeleccionar, onClose }) {
  const navigate = useNavigate();
  const [momentos, setMomentos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarMomentos = async () => {
      try {
        const snapshot = await getDocs(collection(db, "diasEspeciales"));
        const docs = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((d) => d.activo && d.visible !== false)
          .sort((a, b) => a.fecha?.localeCompare(b.fecha));
        setMomentos(docs);
      } catch (error) {
        console.error("Error cargando momentos:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarMomentos();
  }, []);

  const handleCumpleanos = () => {
    onClose();
    navigate("/dashboard/Cumpleanoscard");
  };

  const handleCancion = () => {
    onClose();
    navigate("/dashboard/Misojitosyo");
  };

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

            {/* ── Card de cumpleaños ── */}
            <div
              className="momento-card momento-card--cumple"
              onClick={handleCumpleanos}
            >
              <div className="momento-emoji">🎂</div>
              <div className="momento-info">
                <h2 className="momento-nombre">Feliz Cumpleaños</h2>
                <p className="momento-fecha">
                  <CalendarBlank size={14} weight="light" /> 04 de Julio 2026
                </p>
                <p className="momento-desc">
                  Una tarjeta especial para tu día más especial 💚
                </p>
              </div>
              <div className="momento-play">
                <Cake size={22} weight="light" />
                <span>Revivir</span>
              </div>
            </div>

            {/* ── Card "Mis ojitos, yo..." ── */}
            <div
              className="momento-card momento-card--cancion"
              onClick={handleCancion}
            >
              <div className="momento-emoji">🎵</div>
              <div className="momento-info">
                <h2 className="momento-nombre">Mis ojitos, yo...</h2>
                <p className="momento-fecha">
                  <CalendarBlank size={14} weight="light" /> Para siempre
                </p>
                <p className="momento-desc">
                  Donde Vive la Inmensidad — una canción para tus ojos 💚
                </p>
              </div>
              <div className="momento-play">
                <Heart size={22} weight="light" />
                <span>Escuchar</span>
              </div>
            </div>
          </div>
        )}

        {!loading && momentos.length === 0 && (
          <p className="galeria-empty-msg">
            Aún no hay momentos especiales guardados 💌
          </p>
        )}
      </div>
    </div>
  );
}

export default GaleriaDias;
