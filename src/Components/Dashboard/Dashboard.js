import React, { useState, useEffect } from "react";
import { Link, useNavigate, Outlet } from "react-router-dom";
import { db } from "../../firebase";
import { getDoc, doc } from "firebase/firestore";
import Galeria from "../Galeria/Galeria";
import GaleriaDias from "../GaleriaDias/GaleriaDias";
import DiaMujer from "../DiaEspecial/DiaMujer";
import EcuacionAmor from "../DiaEspecial/EcuacionAmor";
import SuperficieCorazon from "../DiaEspecial/Superficiecorazon";
import LuciernagasPoema from "../DiaEspecial/GalaxiasFusion";
import Pluma from "../DiaEspecial/Pluma";
import { SignOut, Envelope } from "@phosphor-icons/react";
import "./Dashboard.css";
import { solicitarPermisoNotificaciones } from "../../firebase";
// MAPA: fecha (MM-DD) → ID del documento en Firestore
const FECHAS = {
  "03-08": "diaMujer",
  // "02-14": "sanValentin",  // futuro
};

// MAPA: ID → componente de animación
const COMPONENTES_DIAS = {
  diaMujer: DiaMujer,
  ecuacionDelAmor: EcuacionAmor,
  superficieCorazon: SuperficieCorazon,
  luciernagaspoema: LuciernagasPoema,
  pluma: Pluma,
  // sanValentin: DiaValentin,  // futuro
};

function Dashboard({ handleLogout }) {
  const navigate = useNavigate();
  const [diaEspecial, setDiaEspecial] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarGaleria, setMostrarGaleria] = useState(false);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);

  useEffect(() => {
    solicitarPermisoNotificaciones();
    const verificarDiaEspecial = async () => {
      try {
        const hoy = new Date().toLocaleDateString("en-CA");
        const mmdd = hoy.substring(5);
        const idHoy = FECHAS[mmdd];
        if (!idHoy) return;
        const docSnap = await getDoc(doc(db, "diasEspeciales", idHoy));
        if (docSnap.exists() && docSnap.data().activo) {
          setDiaEspecial({ id: idHoy, ...docSnap.data() });
          const yaVisto = sessionStorage.getItem(`diaEspecial_${hoy}`);
          if (!yaVisto) {
            setMostrarModal(true);
            sessionStorage.setItem(`diaEspecial_${hoy}`, "true");
          }
        }
      } catch (error) {
        console.error("Error verificando día especial:", error);
      }
    };
    verificarDiaEspecial();
  }, []);

  // Click en botón 💌:
  // - Si hay día especial hoy → abre la animación del día
  // - Si no → abre la galería de momentos pasados
  const handleBotonFlotante = () => {
    if (diaEspecial) {
      setMostrarModal(true); // ← si hay día especial hoy → animación
    } else {
      setMostrarGaleria(true); // ← si no → galería
    }
  };

  // Desde la galería, el usuario selecciona un momento → carga su data y abre animación
  const handleSeleccionarMomento = async (id) => {
    try {
      const docSnap = await getDoc(doc(db, "diasEspeciales", id));
      if (docSnap.exists()) {
        setDiaSeleccionado({ id, ...docSnap.data() });
        setMostrarGaleria(false);
        setMostrarModal(true);
      }
    } catch (error) {
      console.error("Error cargando momento:", error);
    }
  };

  const handleCerrarModal = () => {
    setMostrarModal(false);
    setDiaSeleccionado(null);
  };

  // El día a mostrar en el modal: si viene de galería usa diaSeleccionado, si es hoy usa diaEspecial
  const diaParaMostrar = diaSeleccionado || diaEspecial;

  const renderDiaEspecial = () => {
    if (!diaParaMostrar) return null;
    const Componente = COMPONENTES_DIAS[diaParaMostrar.id];
    if (!Componente) return null;
    return (
      <Componente diaEspecial={diaParaMostrar} onClose={handleCerrarModal} />
    );
  };

  return (
    <div className="portal-container">
      <header className="portal-header">
        <h1
          className="portal-main-title"
          onClick={() => navigate("/dashboard")}
          style={{ cursor: "pointer" }}
        >
          Antología De Tus Ojos
        </h1>
        <p className="portal-tagline">
          Tus ojitos son el portal a lo mas profundo de mi mente y de mi ser;
          por derecho propio la unica dueña de mi inspiración
        </p>
        <nav className="portal-nav">
          <Link to="/dashboard/PoemsPortal" className="nav-link">
            Musas ✒️
          </Link>
          <Link to="/dashboard/TimeLine" className="nav-link">
            Memories ⏳
          </Link>
          <Link to="/dashboard/Galeria" className="nav-link">
            Nosotros 💚
          </Link>
        </nav>
      </header>

      <main className="portal-content">
        <Outlet />
      </main>

      <footer className="portal-footer">
        <button onClick={handleLogout} className="btn-logout-minimal">
          <SignOut size={18} weight="light" />
          Cerrar Sesión
        </button>
      </footer>

      {/* BOTÓN FLOTANTE — siempre visible */}
      {!mostrarModal && !mostrarGaleria && (
        <div className="btn-flotante-wrapper">
          <button className="btn-flotante-dia" onClick={handleBotonFlotante}>
            <Envelope size={28} weight="light" />
          </button>
          {!diaEspecial && (
            <span className="btn-flotante-tooltip">Nuestros momentos</span>
          )}
        </div>
      )}

      {/* GALERÍA DE MOMENTOS ESPECIALES */}
      {mostrarGaleria && (
        <GaleriaDias
          onSeleccionar={handleSeleccionarMomento}
          onClose={() => setMostrarGaleria(false)}
        />
      )}

      {/* ANIMACIÓN DEL DÍA ESPECIAL */}
      {mostrarModal && renderDiaEspecial()}
    </div>
  );
}

export default Dashboard;
