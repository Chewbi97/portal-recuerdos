import { db } from "../../firebase";
import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { swalPortal } from "../../sweetalertConfig";
import {
  DotsThreeVertical,
  PencilSimple,
  Trash,
  X,
  PenNib,
  MagnifyingGlass,
  User,
  CalendarBlank,
  Export,
} from "@phosphor-icons/react";
import { enviarNotificacion } from "../../firebase";
import html2canvas from "html2canvas";
import "./PoemsPortal.css";

function PoemsPortal() {
  const [poemas, setPoemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedPoema, setSelectedPoema] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [busqueda, setBusqueda] = useState("");
  const añoActual = new Date().getFullYear();
  const años = Array.from(
    { length: añoActual - 2023 },
    (_, i) => añoActual - i,
  );
  const [filtroPeriodo, setFiltroPeriodo] = useState("todos");
  const [animando, setAnimando] = useState(false);
  const ITEMS_POR_PAGINA = 12;
  const [activeMenu, setActiveMenu] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [newPoem, setNewPoem] = useState({
    titulo: "",
    contenido: "",
    autor: "",
  });

  useEffect(() => {
    const closeMenu = () => setActiveMenu(null);
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, []);

  const fetchPoemas = async () => {
    try {
      setLoading(true);
      const poemasSnapshot = await getDocs(
        query(collection(db, "poemas"), orderBy("fechaCreacion", "desc")),
      );
      setPoemas(
        poemasSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      );
    } catch (err) {
      console.error("Error al leer:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoemas();
  }, []);

  const handleEdit = (poema) => {
    setNewPoem({
      titulo: poema.titulo,
      contenido: poema.contenido,
      autor: poema.autor,
    });
    setEditingId(poema.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNewPoemSubmit = async (e) => {
    e.preventDefault();
    if (!editingId) {
      await enviarNotificacion(
        "✒️ Nuevo poema en el portal",
        `"${newPoem.titulo}" — Por: ${newPoem.autor}`,
      );
    }
    if (!newPoem.titulo || !newPoem.contenido) return;
    setIsAdding(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "poemas", editingId), {
          ...newPoem,
          fechaEdicion: serverTimestamp(),
        });
        setEditingId(null);
      } else {
        await addDoc(collection(db, "poemas"), {
          ...newPoem,
          autor: newPoem.autor || "",
          fechaCreacion: serverTimestamp(),
        });
      }
      setNewPoem({ titulo: "", contenido: "", autor: "" });
      setShowForm(false);
      await fetchPoemas();
    } catch (err) {
      alert("Error al guardar: " + err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await swalPortal.fire({
      title: "¿Borrar este verso?",
      text: "Una vez eliminado, la inspiración se perderá en el viento 🍃",
      showCancelButton: true,
      confirmButtonText: "Sí, borrar",
      cancelButtonText: "Cancelar",
    });
    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, "poemas", id));
        fetchPoemas();
      } catch (err) {
        console.error("Error al eliminar:", err);
      }
    }
    setActiveMenu(null);
  };

  const handleCompartir = async (poema, e) => {
    e.stopPropagation();
    setActiveMenu(null);
    const div = document.createElement("div");
    div.style.cssText = `
  width: 600px;
  padding: 60px;
  background: #fdf6e3;
  font-family: 'EB Garamond', serif;
  position: fixed;
  top: -9999px;
  left: -9999px;
  border-radius: 16px;
  border: 1px solid #dcd0c0;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
`;

    const fecha = poema.fechaCreacion
      ? poema.fechaCreacion.toDate().toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Fecha estelar";

    div.innerHTML = `
    <h2 style="font-family:'Great Vibes',cursive; font-size:2.8rem; color:#2d5a27; margin:0 0 10px; text-align:center;">${poema.titulo}</h2>
    <p style="font-size:1rem; color:#7f8c8d; text-align:center; margin:0 0 30px; font-style:italic;">Por: ${poema.autor}</p>
    <p style="font-size:1.3rem; line-height:2rem; color:#3d2b1f; white-space:pre-line; margin:0 0 40px; font-family:'EB Garamond',serif; font-style:italic;">${poema.contenido}</p>
    <div style="border-top:1px solid #dcd0c0; padding-top:15px; display:flex; justify-content:space-between; align-items:center;">
      <span style="font-family:'Great Vibes',cursive; font-size:1.4rem; color:#2d5a27;">Antología De Tus Ojos</span>
      <span style="font-size:0.9rem; color:#7f8c8d; font-style:italic;">${fecha}</span>
    </div>
  `;

    document.body.appendChild(div);

    try {
      const canvas = await html2canvas(div, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#fdf6e3",
      });
      const link = document.createElement("a");
      link.download = `${poema.titulo}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Error al generar imagen:", err);
    } finally {
      document.body.removeChild(div);
    }
  };

  if (loading)
    return <div className="loading-msg">Abriendo el libro de versos...</div>;

  const poemasFiltrados = poemas.filter((p) => {
    const txt = busqueda.toLowerCase();
    const coincideTexto =
      p.titulo?.toLowerCase().includes(txt) ||
      p.contenido?.toLowerCase().includes(txt) ||
      p.autor?.toLowerCase().includes(txt);
    const año = p.fechaCreacion?.toDate().getFullYear().toString();
    const ahora = new Date();
    const coincidePeriodo =
      filtroPeriodo === "todos"
        ? true
        : filtroPeriodo === "recientes"
          ? p.fechaCreacion?.toDate() >=
            new Date(ahora.getFullYear(), ahora.getMonth() - 3, 1)
          : año === filtroPeriodo;
    return coincideTexto && coincidePeriodo;
  });

  const totalPaginas = Math.ceil(poemasFiltrados.length / ITEMS_POR_PAGINA);
  const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
  const poemasPagina = poemasFiltrados.slice(inicio, inicio + ITEMS_POR_PAGINA);

  const cambiarPagina = (nueva) => {
    if (nueva === paginaActual) return;
    setAnimando(true);
    setTimeout(() => {
      setPaginaActual(nueva);
      setAnimando(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 300);
  };

  return (
    <div className="poems-portal-container">
      <div className="header-portal">
        <div className="header-left">
          <h1>
            <PenNib size={28} weight="light" /> Musas{" "}
            <span>({poemas.length})</span>
          </h1>
        </div>
        <button
          className={showForm ? "btn-redactar btn-cancelar" : "btn-redactar"}
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) {
              setEditingId(null);
              setNewPoem({ titulo: "", contenido: "", autor: "" });
            }
          }}
        >
          {showForm ? (
            <>
              <X size={15} weight="bold" /> Cancelar
            </>
          ) : (
            <>
              <PenNib size={17} weight="light" /> Redactar Poema
            </>
          )}
        </button>
      </div>

      <div className="buscador-container">
        <div className="input-search-wrapper">
          <MagnifyingGlass size={15} weight="light" className="search-icon" />
          <input
            type="text"
            className="input-buscador"
            placeholder="Buscar recuerdo..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPaginaActual(1);
            }}
          />
        </div>
        <select
          className="select-periodo"
          value={filtroPeriodo}
          onChange={(e) => {
            setFiltroPeriodo(e.target.value);
            setPaginaActual(1);
          }}
        >
          <option value="todos">Todos</option>
          <option value="recientes">Últimos 3 meses</option>
          {años.map((año) => (
            <option key={año} value={año.toString()}>
              {año}
            </option>
          ))}
        </select>
      </div>

      {showForm && (
        <div className="form-container-vintage">
          <h2>{editingId ? "Refinando el verso" : "Captura tu inspiración"}</h2>
          <form onSubmit={handleNewPoemSubmit} className="form-vintage">
            <input
              type="text"
              placeholder="Título del Poema"
              className="input-vintage"
              value={newPoem.titulo}
              onChange={(e) =>
                setNewPoem({ ...newPoem, titulo: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="¿Quién escribe?"
              className="input-vintage"
              value={newPoem.autor}
              onChange={(e) =>
                setNewPoem({ ...newPoem, autor: e.target.value })
              }
              required
            />
            <textarea
              placeholder="Escribe aquí tu verso..."
              className="textarea-vintage"
              rows="8"
              value={newPoem.contenido}
              onChange={(e) =>
                setNewPoem({ ...newPoem, contenido: e.target.value })
              }
              required
            />
            <button
              type="submit"
              disabled={isAdding}
              className="btn-guardar-vintage"
            >
              {isAdding
                ? "Sellando pergamino..."
                : editingId
                  ? "Guardar Cambios"
                  : "Publicar Poema"}
            </button>
          </form>
        </div>
      )}

      <div
        className={`poem-list ${animando ? "pagina-saliendo" : "pagina-entrando"}`}
      >
        {poemasFiltrados.length === 0 ? (
          <div className="no-poems-message">¡No se encontraron poemas!</div>
        ) : (
          poemasPagina.map((poema) => (
            <div
              key={poema.id}
              className="poem-card"
              onClick={() => setSelectedPoema(poema)}
            >
              <div
                className="options-container"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="three-dots-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenu(activeMenu === poema.id ? null : poema.id);
                  }}
                >
                  <DotsThreeVertical size={20} weight="bold" />
                </button>
                {activeMenu === poema.id && (
                  <div className="dropdown-menu">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(poema);
                      }}
                    >
                      <button onClick={(e) => handleCompartir(poema, e)}>
                        <Export size={14} weight="light" /> Compartir
                      </button>
                      <PencilSimple size={14} weight="light" /> Editar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(poema.id);
                      }}
                      className="delete-opt"
                    >
                      <Trash size={14} weight="light" /> Borrar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenu(null);
                      }}
                    >
                      <X size={14} weight="light" /> Cancelar
                    </button>
                  </div>
                )}
              </div>
              <h3>{poema.titulo}</h3>
              <p className="poem-author">
                <User size={13} weight="light" /> Por: {poema.autor}
              </p>
              <div className="poem-content">{poema.contenido}</div>
              <div className="poem-date">
                <small>
                  <CalendarBlank size={12} weight="light" />{" "}
                  {poema.fechaCreacion
                    ? poema.fechaCreacion.toDate().toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Fecha estelar"}
                </small>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPaginas > 1 && (
        <div className="paginacion">
          <button
            className="btn-pagina"
            onClick={() => cambiarPagina(paginaActual - 1)}
            disabled={paginaActual === 1}
          >
            ← Anterior
          </button>
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              className={`btn-pagina ${paginaActual === num ? "btn-pagina-activa" : ""}`}
              onClick={() => cambiarPagina(num)}
            >
              {num}
            </button>
          ))}
          <button
            className="btn-pagina"
            onClick={() => cambiarPagina(paginaActual + 1)}
            disabled={paginaActual === totalPaginas}
          >
            Siguiente →
          </button>
        </div>
      )}

      {selectedPoema && (
        <div className="zoom-overlay" onClick={() => setSelectedPoema(null)}>
          <div
            className="zoom-content zoom-poema"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-zoom"
              onClick={() => setSelectedPoema(null)}
            >
              <X size={18} weight="bold" />
            </button>
            <div className="zoom-text">
              <h2>{selectedPoema.titulo}</h2>
              <p className="poem-author">
                <User size={14} weight="light" /> Por: {selectedPoema.autor}
              </p>
              <p className="poem-content-full">{selectedPoema.contenido}</p>
              <p className="poem-date">
                <CalendarBlank size={13} weight="light" />{" "}
                {selectedPoema.fechaCreacion
                  ? selectedPoema.fechaCreacion
                      .toDate()
                      .toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                  : "Fecha estelar"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PoemsPortal;
