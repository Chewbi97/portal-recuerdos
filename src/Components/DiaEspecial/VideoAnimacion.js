import React, { useRef, useState, useEffect } from "react";
import ControlesAnimacion from "./ControlesAnimacion";
import "./VideoAnimacion.css";

function VideoAnimacion({ data, onClose }) {
  const videoRef = useRef(null);
  const [pausado, setPausado] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [duracion, setDuracion] = useState(0);

  // Sincronizar el estado de pausa
  const handlePausa = () => {
    if (videoRef.current.paused) {
      videoRef.current.play();
      setPausado(false);
    } else {
      videoRef.current.pause();
      setPausado(true);
    }
  };

  // Sincronizar la barra de progreso
  const handleBarra = (valor) => {
    videoRef.current.currentTime = valor;
    setProgreso(valor);
  };

  // Actualizar la barra mientras el video corre
  useEffect(() => {
    const video = videoRef.current;
    const actualizarProgreso = () => setProgreso(video.currentTime);
    const cargarMetadatos = () => setDuracion(video.duration);

    video.addEventListener("timeupdate", actualizarProgreso);
    video.addEventListener("loadedmetadata", cargarMetadatos);

    return () => {
      video.removeEventListener("timeupdate", actualizarProgreso);
      video.removeEventListener("loadedmetadata", cargarMetadatos);
    };
  }, []);

  return (
    <div
      className="pluma-overlay"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div
        className="pluma-canvas-wrapper"
        style={{ width: "100%", display: "flex", justifyContent: "center" }}
      >
        <video
          ref={videoRef}
          src={data.videoUrl}
          className="pluma-canvas"
          autoPlay
          playsInline
          style={{
            width: "100vw", // Fuerza a que ocupe todo el ancho de la pantalla del celular
            height: "auto", // Mantiene la proporción original de Manim
            maxHeight: "75vh", // Deja espacio para que tus controles de abajo no se tapen
            objectFit: "contain",
          }}
        />
      </div>

      <ControlesAnimacion
        pausado={pausado}
        progreso={progreso}
        duracionTotal={duracion}
        onPausa={handlePausa}
        onBarra={handleBarra}
        onClose={onClose}
        videoUrl={data.videoUrl}
      />
    </div>
  );
}

export default VideoAnimacion;
