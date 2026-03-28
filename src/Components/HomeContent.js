import React, { useState, useEffect, useRef } from "react";
import { db, storage } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { DotsThreeVertical, Camera } from "@phosphor-icons/react";
import "./HomeContent.css";

function HomeContent() {
  const [fotoUrl, setFotoUrl] = useState(null);
  const [loadingPortada, setLoadingPortada] = useState(true);
  const [caption, setCaption] = useState("♥ Nuestra Historia ♥");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [imgCargada, setImgCargada] = useState(false);
  const [tiempoJuntos, setTiempoJuntos] = useState({});

  useEffect(() => {
    const cargarPortada = async () => {
      try {
        const docRef = doc(db, "configuracion", "portada");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.fotoUrl) setFotoUrl(data.fotoUrl);
          if (data.caption) setCaption(data.caption);
        }
      } catch (error) {
        console.error("Error cargando portada:", error);
      } finally {
        setLoadingPortada(false);
      }
    };
    cargarPortada();
  }, []);

  useEffect(() => {
    // Fecha de inicio de la relación — cambiala por la real
    const inicio = new Date("2025-11-12T20:00:00");

    const calcular = () => {
      const ahora = new Date();
      const diff = ahora - inicio;

      const años = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
      const meses = Math.floor(
        (diff % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44),
      );
      const dias = Math.floor(
        (diff % (1000 * 60 * 60 * 24 * 30.44)) / (1000 * 60 * 60 * 24),
      );
      const horas = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const segundos = Math.floor((diff % (1000 * 60)) / 1000);

      setTiempoJuntos({ años, meses, dias, horas, minutos, segundos });
    };

    calcular();
    const intervalo = setInterval(calcular, 1000); // actualiza cada segundo
    return () => clearInterval(intervalo);
  }, []);

  const handleCambiarFoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const storageRef = ref(storage, "portada/foto-principal");
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      await setDoc(doc(db, "configuracion", "portada"), {
        fotoUrl: url,
        caption,
      });
      setFotoUrl(url);
    } catch (error) {
      alert("Error al subir la foto: " + (error.code || error.message));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="home-content">
      <div className="featured-card-transparent">
        <h2 className="home-title-main">
          Este es nuestro lugar secreto, Mis Ojitos.
          <br />
          Navega y recuerda.
        </h2>
        <div className="contador-container">
          <p className="contador-titulo">Cuando Todo Inicio 💚</p>
          <div className="contador-grid">
            {tiempoJuntos.años > 0 && (
              <div className="contador-item">
                <span className="contador-numero">{tiempoJuntos.años}</span>
                <span className="contador-label">
                  {tiempoJuntos.años === 1 ? "año" : "años"}
                </span>
              </div>
            )}
            <div className="contador-item">
              <span className="contador-numero">{tiempoJuntos.meses}</span>
              <span className="contador-label">
                {tiempoJuntos.meses === 1 ? "mes" : "meses"}
              </span>
            </div>
            <div className="contador-item">
              <span className="contador-numero">{tiempoJuntos.dias}</span>
              <span className="contador-label">
                {tiempoJuntos.dias === 1 ? "día" : "días"}
              </span>
            </div>
            <div className="contador-item">
              <span className="contador-numero">{tiempoJuntos.horas}</span>
              <span className="contador-label">horas</span>
            </div>
            <div className="contador-item">
              <span className="contador-numero">{tiempoJuntos.minutos}</span>
              <span className="contador-label">min</span>
            </div>
            <div className="contador-item">
              <span className="contador-numero">{tiempoJuntos.segundos}</span>
              <span className="contador-label">seg</span>
            </div>
          </div>
        </div>
        <div className="polaroid-frame">
          <div style={{ position: "relative" }}>
            {(!imgCargada || loadingPortada) && (
              <div className="portada-skeleton" />
            )}
            <img
              src={loadingPortada ? null : fotoUrl}
              alt="♥ Nuestra Historia ♥"
              className="fit-image"
              style={{
                opacity: imgCargada ? 1 : 0,
                transition: "opacity 0.4s ease",
              }}
              onLoad={() => setImgCargada(true)}
            />
          </div>
          <div className="caption-row">
            <p className="photo-caption-text">{caption}</p>
            <div
              className="options-container"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="btn-options"
                onClick={() => setMenuAbierto(!menuAbierto)}
              >
                <DotsThreeVertical size={22} weight="bold" />
              </button>
              {menuAbierto && (
                <div className="options-menu">
                  <button
                    onClick={() => {
                      fileInputRef.current.click();
                      setMenuAbierto(false);
                    }}
                  >
                    <Camera size={16} weight="light" /> Modificar
                  </button>
                </div>
              )}
            </div>
          </div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleCambiarFoto}
          />
        </div>
      </div>
    </div>
  );
}

export default HomeContent;
