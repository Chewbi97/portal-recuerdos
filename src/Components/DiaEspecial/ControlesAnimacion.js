import React from "react";
import { Play, Pause, X } from "@phosphor-icons/react";
import "./ControlesAnimacion.css";

function ControlesAnimacion({ pausado, progreso, duracionTotal, onPausa, onBarra, onClose }) {
  const formatTiempo = (frames) => {
    const seg = Math.floor(frames / 60);
    const min = Math.floor(seg / 60);
    const s = seg % 60;
    return `${min}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="controles-overlay">
      <button className="controles-close" onClick={onClose}>
        <X size={20} weight="bold" />
      </button>

      <div className="controles-barra-wrapper">
        <button className="controles-play" onClick={onPausa}>
          {pausado
            ? <Play size={22} weight="fill" />
            : <Pause size={22} weight="fill" />
          }
        </button>

        <span className="controles-tiempo">
          {formatTiempo(progreso)}
        </span>

        <input
          type="range"
          className="controles-slider"
          min={0}
          max={duracionTotal}
          value={progreso}
          onChange={(e) => onBarra(Number(e.target.value))}
        />

        <span className="controles-tiempo">
          {formatTiempo(duracionTotal)}
        </span>
      </div>
    </div>
  );
}

export default ControlesAnimacion;