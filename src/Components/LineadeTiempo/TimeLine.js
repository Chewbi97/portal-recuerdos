import React, { useState, useEffect, useRef } from "react";
import { db, storage } from "../../firebase";
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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { swalPortal } from "../../sweetalertConfig";
import {
  DotsThreeVertical,
  PencilSimple,
  Trash,
  X,
  Camera,
  CalendarBlank,
  MagnifyingGlass,
  Image,
} from "@phosphor-icons/react";
import { enviarNotificacion } from "../../firebase";
import "./TimeLine.css";

function TimeLine() {
  const [recuerdos, setRecuerdos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedRecuerdo, setSelectedRecuerdo] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const [newRecuerdo, setNewRecuerdo] = useState({
    titulo: "",
    descripcion: "",
    fechaEvento: "",
  });
  const [paginaActual, setPaginaActual] = useState(1);
  const [busqueda, setBusqueda] = useState("");
  const [filtroPeriodo, setFiltroPeriodo] = useState("todos");
  const añoActual = new Date().getFullYear();
  const años = Array.from(
    { length: añoActual - 2023 },
    (_, i) => añoActual - i,
  );
  const [animando, setAnimando] = useState(false);
  const ITEMS_POR_PAGINA = 12;
  const [indiceSeleccionado, setIndiceSeleccionado] = useState(null);
  const touchStartX = useRef(null);
  const [descripcionExpandida, setDescripcionExpandida] = useState(false);

  const fetchRecuerdos = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, "recuerdos"),
        orderBy("fechaEvento", "desc"),
      );
      const querySnapshot = await getDocs(q);
      setRecuerdos(
        querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      );
    } catch (error) {
      console.error("Error al cargar recuerdos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecuerdos();
  }, []);

  // ✅ useEffect de teclado — usa recuerdos (estado) en lugar de recuerdosFiltrados
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedRecuerdo) return;
      if (e.key === "Escape") {
        setSelectedRecuerdo(null);
        setIndiceSeleccionado(null);
        setDescripcionExpandida(false);
      } else if (e.key === "ArrowRight") {
        setIndiceSeleccionado((prev) => {
          const siguiente = prev + 1;
          if (siguiente < recuerdos.length) {
            setSelectedRecuerdo(recuerdos[siguiente]);
            return siguiente;
          }
          return prev;
        });
      } else if (e.key === "ArrowLeft") {
        setIndiceSeleccionado((prev) => {
          const anterior = prev - 1;
          if (anterior >= 0) {
            setSelectedRecuerdo(recuerdos[anterior]);
            return anterior;
          }
          return prev;
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedRecuerdo, recuerdos]);

  const handleEdit = (recuerdo) => {
    setNewRecuerdo({
      titulo: recuerdo.titulo,
      descripcion: recuerdo.descripcion,
      fechaEvento: recuerdo.fechaEvento,
    });
    setEditingId(recuerdo.id);
    setMenuAbierto(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!editingId) {
      await enviarNotificacion(
        "📸 Nuevo recuerdo agregado",
        `"${newRecuerdo.titulo}" — ${newRecuerdo.fechaEvento}`,
      );
    }
    if (!newRecuerdo.titulo || !newRecuerdo.descripcion) return;
    setIsAdding(true);
    try {
      if (editingId) {
        let urlImagen =
          recuerdos.find((r) => r.id === editingId)?.imageUrl || "";
        if (file) {
          const snap = await uploadBytes(
            ref(storage, `recuerdos/${Date.now()}_${file.name}`),
            file,
          );
          urlImagen = await getDownloadURL(snap.ref);
        }
        await updateDoc(doc(db, "recuerdos", editingId), {
          ...newRecuerdo,
          imageUrl: urlImagen,
          fechaEdicion: serverTimestamp(),
        });
        setEditingId(null);
      } else {
        let urlImagen = "";
        if (file) {
          const snap = await uploadBytes(
            ref(storage, `recuerdos/${Date.now()}_${file.name}`),
            file,
          );
          urlImagen = await getDownloadURL(snap.ref);
        }
        await addDoc(collection(db, "recuerdos"), {
          ...newRecuerdo,
          imageUrl: urlImagen,
          fechaCreacion: serverTimestamp(),
        });
      }
      setNewRecuerdo({ titulo: "", descripcion: "", fechaEvento: "" });
      setFile(null);
      setShowForm(false);
      await fetchRecuerdos();
    } catch (error) {
      alert("Hubo un problema: " + (error.code || error.message));
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await swalPortal.fire({
      title: "¿Borrar este recuerdo?",
      text: "Esta acción no se puede deshacer 📸",
      showCancelButton: true,
      confirmButtonText: "Sí, borrar",
      cancelButtonText: "Cancelar",
    });
    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, "recuerdos", id));
        fetchRecuerdos();
      } catch (error) {
        console.error("Error al borrar:", error);
      }
    }
    setMenuAbierto(null);
  };

  if (loading)
    return <div className="loading-msg">Cargando momentos mágicos...</div>;

  const recuerdosFiltrados = recuerdos.filter((r) => {
    const txt = busqueda.toLowerCase();
    const coincideTexto =
      r.titulo?.toLowerCase().includes(txt) ||
      r.descripcion?.toLowerCase().includes(txt);
    const año = r.fechaEvento?.substring(0, 4);
    const ahora = new Date();
    const coincidePeriodo =
      filtroPeriodo === "todos"
        ? true
        : filtroPeriodo === "recientes"
          ? new Date(r.fechaEvento) >=
            new Date(ahora.getFullYear(), ahora.getMonth() - 3, 1)
          : año === filtroPeriodo;
    return coincideTexto && coincidePeriodo;
  });

  const totalPaginas = Math.ceil(recuerdosFiltrados.length / ITEMS_POR_PAGINA);
  const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
  const recuerdosPagina = recuerdosFiltrados.slice(
    inicio,
    inicio + ITEMS_POR_PAGINA,
  );

  const cambiarPagina = (nueva) => {
    if (nueva === paginaActual) return;
    setAnimando(true);
    setTimeout(() => {
      setPaginaActual(nueva);
      setAnimando(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 300);
  };

  const irAnterior = () => {
    const nuevo = indiceSeleccionado - 1;
    if (nuevo >= 0) {
      setSelectedRecuerdo(recuerdosFiltrados[nuevo]);
      setIndiceSeleccionado(nuevo);
    }
  };

  const irSiguiente = () => {
    const nuevo = indiceSeleccionado + 1;
    if (nuevo < recuerdosFiltrados.length) {
      setSelectedRecuerdo(recuerdosFiltrados[nuevo]);
      setIndiceSeleccionado(nuevo);
    }
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (!touchStartX.current) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? irSiguiente() : irAnterior();
    }
    touchStartX.current = null;
  };

  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <h1>📸 Nuestra Línea de Tiempo</h1>
        <button
          className={`btn-nuevo-recuerdo ${showForm ? "btn-cancelar" : ""}`}
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) {
              setEditingId(null);
              setNewRecuerdo({ titulo: "", descripcion: "", fechaEvento: "" });
              setFile(null);
            }
          }}
        >
          {showForm ? (
            <>
              <X size={15} weight="bold" /> Cancelar
            </>
          ) : (
            <>
              <Camera size={17} weight="light" /> Añadir Momento
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
        <div className="form-recuerdo-vintage">
          <h2>
            {editingId ? (
              <>
                <PencilSimple size={18} weight="light" /> Editando recuerdo
              </>
            ) : (
              <>
                <Camera size={18} weight="light" /> Nuevo momento
              </>
            )}
          </h2>
          <form onSubmit={handleUpload}>
            <input
              type="text"
              placeholder="¿Qué momento guardaremos hoy?"
              required
              className="input-vintage"
              value={newRecuerdo.titulo}
              onChange={(e) =>
                setNewRecuerdo({ ...newRecuerdo, titulo: e.target.value })
              }
            />
            <textarea
              placeholder="Cuéntame la historia de este día..."
              required
              className="textarea-vintage"
              value={newRecuerdo.descripcion}
              onChange={(e) =>
                setNewRecuerdo({ ...newRecuerdo, descripcion: e.target.value })
              }
            />
            <div className="form-row">
              <input
                type="date"
                required
                className="input-date-vintage"
                max={new Date().toISOString().split("T")[0]}
                value={newRecuerdo.fechaEvento}
                onChange={(e) =>
                  setNewRecuerdo({
                    ...newRecuerdo,
                    fechaEvento: e.target.value,
                  })
                }
              />
              <div className="file-input-wrapper">
                <button
                  type="button"
                  className="btn-elegir-foto"
                  onClick={() => fileInputRef.current.click()}
                >
                  <Camera size={15} weight="light" />{" "}
                  {file
                    ? file.name
                    : editingId
                      ? "Cambiar foto"
                      : "Elegir foto"}
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isAdding}
              className="btn-guardar-vintage"
            >
              {isAdding
                ? "Sellando recuerdo..."
                : editingId
                  ? "Guardar Cambios"
                  : "Inmortalizar Momento"}
            </button>
          </form>
        </div>
      )}

      <div
        className={`recuerdos-grid ${animando ? "pagina-saliendo" : "pagina-entrando"}`}
      >
        {recuerdosPagina.map((r) => (
          <div
            key={r.id}
            className="polaroid-card"
            onClick={() => {
              setSelectedRecuerdo(r);
              setIndiceSeleccionado(recuerdosFiltrados.indexOf(r));
            }}
          >
            <div
              className="options-container"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="btn-options"
                onClick={() =>
                  setMenuAbierto(menuAbierto === r.id ? null : r.id)
                }
              >
                <DotsThreeVertical size={20} weight="bold" />
              </button>
              {menuAbierto === r.id && (
                <div className="options-menu">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(r);
                    }}
                  >
                    <PencilSimple size={14} weight="light" /> Editar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(r.id);
                    }}
                    className="delete-opt"
                  >
                    <Trash size={14} weight="light" /> Borrar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuAbierto(null);
                    }}
                  >
                    <X size={14} weight="light" /> Cancelar
                  </button>
                </div>
              )}
            </div>
            <div className="polaroid-image">
              {r.imageUrl ? (
                <img src={r.imageUrl} alt="Recuerdo" loading="lazy" />
              ) : (
                <div className="no-photo">
                  <Image size={30} weight="thin" />
                  <span>Sin foto</span>
                </div>
              )}
            </div>
            <div className="polaroid-content">
              <span className="moment-date">
                <CalendarBlank size={12} weight="light" /> {r.fechaEvento}
              </span>
              <h3>{r.titulo}</h3>
              <p className="description-clamped">{r.descripcion}</p>
            </div>
          </div>
        ))}
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

      {selectedRecuerdo && (
        <div
          className="zoom-overlay"
          onClick={() => {
            setSelectedRecuerdo(null);
            setIndiceSeleccionado(null);
            setDescripcionExpandida(false);
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="zoom-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-zoom"
              onClick={() => {
                setSelectedRecuerdo(null);
                setIndiceSeleccionado(null);
                setDescripcionExpandida(false);
              }}
            >
              <X size={18} weight="bold" />
            </button>

            <div className="zoom-card">
              <div className="zoom-img-wrapper">
                <div className="zoom-contador">
                  {indiceSeleccionado + 1} / {recuerdosFiltrados.length}
                </div>
                {indiceSeleccionado > 0 && (
                  <button
                    className="zoom-nav zoom-nav-left"
                    onClick={(e) => {
                      e.stopPropagation();
                      irAnterior();
                    }}
                  >
                    ‹
                  </button>
                )}
                {indiceSeleccionado < recuerdosFiltrados.length - 1 && (
                  <button
                    className="zoom-nav zoom-nav-right"
                    onClick={(e) => {
                      e.stopPropagation();
                      irSiguiente();
                    }}
                  >
                    ›
                  </button>
                )}
                {selectedRecuerdo.imageUrl ? (
                  <img
                    src={selectedRecuerdo.imageUrl}
                    alt="Zoom"
                    className="zoom-img"
                  />
                ) : (
                  <div className="no-photo-zoom">
                    <Image size={48} weight="thin" />
                  </div>
                )}
              </div>

              <div className="zoom-text">
                <span className="moment-date">
                  <CalendarBlank size={13} weight="light" />{" "}
                  {selectedRecuerdo.fechaEvento}
                </span>
                <h2>{selectedRecuerdo.titulo}</h2>
                {descripcionExpandida && (
                  <p
                    className="zoom-descripcion expandida"
                    onClick={() => setDescripcionExpandida(false)}
                  >
                    {selectedRecuerdo.descripcion}
                  </p>
                )}
                {!descripcionExpandida && selectedRecuerdo.descripcion && (
                  <button
                    className="zoom-ver-mas"
                    onClick={() => setDescripcionExpandida(true)}
                  >
                    ver descripción...
                  </button>
                )}
                {descripcionExpandida && (
                  <button
                    className="zoom-ver-mas"
                    onClick={() => setDescripcionExpandida(false)}
                  >
                    ver menos
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TimeLine;
