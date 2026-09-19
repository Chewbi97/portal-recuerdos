import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import VideoAnimacion from "../DiaEspecial/VideoAnimacion";
import DiaMujer from "../DiaEspecial/DiaMujer";
import EcuacionAmor from "../DiaEspecial/EcuacionAmor";
import SuperficieCorazon from "../DiaEspecial/Superficiecorazon";
import LuciernagasPoema from "../DiaEspecial/GalaxiasFusion";
import Pluma from "../DiaEspecial/Pluma";
import Misojitosyo from "../DiaEspecial/Misojitosyo";
import LoQueSembramos from "../DiaEspecial/LoQueSembramos";

// Nota: es una copia deliberada del mapa de Dashboard.js, no un import
// compartido. Si más adelante quieres eliminar la duplicación, se puede
// extraer COMPONENTES_DIAS a un archivo común (ej. diasConfig.js) — lo
// dejo así por ahora para no tocar Dashboard.js bajo presión de tiempo.
const COMPONENTES_DIAS = {
  diaMujer: DiaMujer,
  ecuacionDelAmor: EcuacionAmor,
  superficieCorazon: SuperficieCorazon,
  luciernagaspoema: LuciernagasPoema,
  pluma: Pluma,
  misojitosyo: Misojitosyo,
  amorYAmistad2026: LoQueSembramos,
};

function PreviewDia() {
  const { cardId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const snap = await getDoc(doc(db, "diasEspeciales", cardId));
        if (snap.exists()) setData({ id: cardId, ...snap.data() });
      } catch (e) {
        console.error("Error cargando preview:", e);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [cardId]);

  const volver = () => navigate("/dashboard");

  if (cargando) return null;

  if (!data) {
    return (
      <div style={{ color: "#fff", padding: 40, fontFamily: "monospace" }}>
        No existe el documento "{cardId}" en diasEspeciales.
      </div>
    );
  }

  // Prioridad 1: video (Manim)
  if (data.videoUrl) return <VideoAnimacion data={data} onClose={volver} />;

  // Prioridad 2: componente legacy registrado
  const Componente = COMPONENTES_DIAS[cardId];
  if (Componente) return <Componente diaEspecial={data} onClose={volver} />;

  return (
    <div style={{ color: "#fff", padding: 40, fontFamily: "monospace" }}>
      No hay componente registrado para "{cardId}".
    </div>
  );
}

export default PreviewDia;