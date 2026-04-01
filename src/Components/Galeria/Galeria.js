import React, { useState, useEffect, useRef } from "react";
import { db, storage } from "../../firebase";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { swalPortal } from "../../sweetalertConfig";
import {
  DotsThreeVertical,
  PencilSimple,
  Trash,
  X,
  Camera,
  FolderPlus,
  ArrowLeft,
  Images,
  CheckSquare,
  Square,
  ArrowsLeftRight,
  Swatches,
} from "@phosphor-icons/react";
import "./Galeria.css";

function Galeria() {
  const [galerias, setGalerias] = useState([]);
  const [fotos, setFotos] = useState([]);
  const [galeriaActual, setGaleriaActual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtroAño, setFiltroAño] = useState("todos");
  const [filtroMes, setFiltroMes] = useState("todos");
  const [collages, setCollages] = useState([]);
  const añoActual = new Date().getFullYear();
  const años = Array.from(
    { length: añoActual - 2023 },
    (_, i) => añoActual - i,
  );
  const meses = [
    { v: "01", l: "Enero" },
    { v: "02", l: "Febrero" },
    { v: "03", l: "Marzo" },
    { v: "04", l: "Abril" },
    { v: "05", l: "Mayo" },
    { v: "06", l: "Junio" },
    { v: "07", l: "Julio" },
    { v: "08", l: "Agosto" },
    { v: "09", l: "Septiembre" },
    { v: "10", l: "Octubre" },
    { v: "11", l: "Noviembre" },
    { v: "12", l: "Diciembre" },
  ];
  const [menuAbierto, setMenuAbierto] = useState(null);
  const [menuGaleriaAbierto, setMenuGaleriaAbierto] = useState(null);
  const [showNuevaGaleria, setShowNuevaGaleria] = useState(false);
  const [nombreNuevaGaleria, setNombreNuevaGaleria] = useState("");
  const [editandoGaleria, setEditandoGaleria] = useState(null);
  const [showMoverFoto, setShowMoverFoto] = useState(null);
  const fileInputRef = useRef(null);
  const [subiendo, setSubiendo] = useState(false);
  const [modoCollage, setModoCollage] = useState(false);
  const [fotosSeleccionadas, setFotosSeleccionadas] = useState([]);
  const [showGenerador, setShowGenerador] = useState(false);
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [fotosSeleccionadasAccion, setFotosSeleccionadasAccion] = useState([]);
  const [showMoverMultiple, setShowMoverMultiple] = useState(false);
  const fetchGalerias = async () => {
    const snap = await getDocs(
      query(collection(db, "galerias"), orderBy("fechaCreacion", "desc")),
    );
    setGalerias(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const fetchCollages = async () => {
    const snap = await getDocs(
      query(collection(db, "collages"), orderBy("fechaCreacion", "desc")),
    );
    setCollages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const fetchFotos = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, "fotos"), orderBy("fechaSubida", "desc")),
      );
      setFotos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGalerias();
    fetchFotos();
    fetchCollages();
  }, []);

  const fotosFiltradas = fotos.filter((f) => {
    const fecha = f.fechaSubida?.toDate ? f.fechaSubida.toDate() : null;
    const galeriaOk =
      galeriaActual === null
        ? !f.galeriaId
        : galeriaActual.id === "__sin_galeria__"
          ? !f.galeriaId
          : f.galeriaId === galeriaActual.id;
    if (!fecha) return galeriaOk;
    const año = fecha.getFullYear().toString();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const añoOk = filtroAño === "todos" || año === filtroAño;
    const mesOk = filtroMes === "todos" || mes === filtroMes;
    return galeriaOk && añoOk && mesOk;
  });

  const handleSubirFoto = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setSubiendo(true);
    try {
      for (const file of files) {
        const storageRef = ref(storage, `galeria/${Date.now()}_${file.name}`);
        const snap = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snap.ref);
        await addDoc(collection(db, "fotos"), {
          imageUrl: url,
          storagePath: snap.ref.fullPath,
          galeriaId:
            galeriaActual && galeriaActual.id !== "__sin_galeria__"
              ? galeriaActual.id
              : null,
          fechaSubida: serverTimestamp(),
          subidoPor: "portal",
        });
      }
      await fetchFotos();
    } catch (err) {
      console.error(err);
    } finally {
      setSubiendo(false);
      e.target.value = "";
    }
  };

  const handleEliminarFoto = async (foto) => {
    const result = await swalPortal.fire({
      title: "¿Eliminar esta foto?",
      text: "Esta acción no se puede deshacer 📸",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;
    try {
      if (foto.storagePath) await deleteObject(ref(storage, foto.storagePath));
      await deleteDoc(doc(db, "fotos", foto.id));
      await fetchFotos();
    } catch (err) {
      console.error(err);
    }
    setMenuAbierto(null);
  };

  const handleMoverFoto = async (fotoId, nuevaGaleriaId) => {
    await updateDoc(doc(db, "fotos", fotoId), {
      galeriaId: nuevaGaleriaId || null,
    });
    await fetchFotos();
    setShowMoverFoto(null);
    setMenuAbierto(null);
  };

  const handleCrearGaleria = async () => {
    if (!nombreNuevaGaleria.trim()) return;
    if (editandoGaleria) {
      await updateDoc(doc(db, "galerias", editandoGaleria.id), {
        nombre: nombreNuevaGaleria.trim(),
      });
    } else {
      await addDoc(collection(db, "galerias"), {
        nombre: nombreNuevaGaleria.trim(),
        fechaCreacion: serverTimestamp(),
      });
    }
    setNombreNuevaGaleria("");
    setShowNuevaGaleria(false);
    setEditandoGaleria(null);
    await fetchGalerias();
  };

  const toggleSeleccionAccion = (fotoId) => {
    setFotosSeleccionadasAccion((prev) =>
      prev.includes(fotoId)
        ? prev.filter((id) => id !== fotoId)
        : [...prev, fotoId],
    );
  };

  const handleEliminarMultiple = async () => {
    const result = await swalPortal.fire({
      title: `¿Eliminar ${fotosSeleccionadasAccion.length} fotos?`,
      text: "Esta acción no se puede deshacer 📸",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;
    for (const fotoId of fotosSeleccionadasAccion) {
      const foto = fotos.find((f) => f.id === fotoId);
      if (foto?.storagePath)
        await deleteObject(ref(storage, foto.storagePath)).catch(() => {});
      await deleteDoc(doc(db, "fotos", fotoId));
    }
    setFotosSeleccionadasAccion([]);
    setModoSeleccion(false);
    await fetchFotos();
  };

  const handleMoverMultiple = async (nuevaGaleriaId) => {
    for (const fotoId of fotosSeleccionadasAccion) {
      await updateDoc(doc(db, "fotos", fotoId), {
        galeriaId: nuevaGaleriaId || null,
      });
    }
    setFotosSeleccionadasAccion([]);
    setModoSeleccion(false);
    setShowMoverMultiple(false);
    await fetchFotos();
  };

  const handleEliminarGaleria = async (galeria) => {
    const result = await swalPortal.fire({
      title: `¿Eliminar "${galeria.nombre}"?`,
      text: "¿Qué hacemos con las fotos de esta galería?",
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "Eliminar fotos también",
      denyButtonText: "Conservar sin galería",
      cancelButtonText: "Cancelar",
    });
    if (result.isDismissed) return;
    const fotosGaleria = fotos.filter((f) => f.galeriaId === galeria.id);
    if (result.isConfirmed) {
      for (const foto of fotosGaleria) {
        if (foto.storagePath)
          await deleteObject(ref(storage, foto.storagePath)).catch(() => {});
        await deleteDoc(doc(db, "fotos", foto.id));
      }
    } else if (result.isDenied) {
      for (const foto of fotosGaleria) {
        await updateDoc(doc(db, "fotos", foto.id), { galeriaId: null });
      }
    }
    await deleteDoc(doc(db, "galerias", galeria.id));
    await fetchGalerias();
    await fetchFotos();
    setMenuGaleriaAbierto(null);
  };

  const toggleSeleccion = (fotoId) => {
    setFotosSeleccionadas((prev) =>
      prev.includes(fotoId)
        ? prev.filter((id) => id !== fotoId)
        : [...prev, fotoId],
    );
  };

  const portadaGaleria = (galeriaId) =>
    fotos.find((f) => f.galeriaId === galeriaId)?.imageUrl || null;
  const conteoFotos = (galeriaId) =>
    fotos.filter((f) => f.galeriaId === galeriaId).length;
  const fotosSinGaleria = fotos.filter((f) => !f.galeriaId);
  const fotosParaCollage = fotos.filter((f) =>
    fotosSeleccionadas.includes(f.id),
  );

  return (
    <div
      className="galeriafotos-container"
      onClick={() => {
        setMenuAbierto(null);
        setMenuGaleriaAbierto(null);
      }}
    >
      {/* HEADER */}
      <div className="galeria-header">
        <div className="galeria-header-left">
          {galeriaActual && (
            <button
              className="btn-volver"
              onClick={() => {
                setGaleriaActual(null);
                setModoCollage(false);
                setFotosSeleccionadas([]);
              }}
            >
              <ArrowLeft size={18} weight="light" />
            </button>
          )}
          <h1>
            {galeriaActual ? (
              galeriaActual.nombre
            ) : (
              <>
                Nosotros <span>💚</span>
              </>
            )}
          </h1>
        </div>
        <div className="galeria-header-actions">
          {!modoCollage ? (
            <>
              <button
                className="btn-accion-header"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current.click();
                }}
              >
                <Camera size={17} weight="light" /> Añadir foto
              </button>
              {!galeriaActual && (
                <button
                  className="btn-accion-header btn-secundario"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNuevaGaleria(true);
                  }}
                >
                  <FolderPlus size={17} weight="light" /> Nueva galería
                </button>
              )}
              <button
                className="btn-accion-header btn-collage"
                onClick={() => setModoCollage(true)}
              >
                <Swatches size={17} weight="light" /> Crear collage
              </button>
            </>
          ) : (
            <>
              <span className="collage-contador">
                {fotosSeleccionadas.length} seleccionadas
              </span>
              {fotosSeleccionadas.length >= 2 && (
                <button
                  className="btn-accion-header btn-collage"
                  onClick={() => setShowGenerador(true)}
                >
                  <Images size={17} weight="light" /> Generar
                </button>
              )}
              <button
                className="btn-accion-header btn-cancelar-collage"
                onClick={() => {
                  setModoCollage(false);
                  setFotosSeleccionadas([]);
                }}
              >
                <X size={15} weight="bold" /> Cancelar
              </button>
            </>
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          multiple
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleSubirFoto}
        />
      </div>

      {/* FILTROS */}
      <div className="galeria-filtros">
        <select
          className="select-filtro"
          value={filtroAño}
          onChange={(e) => setFiltroAño(e.target.value)}
        >
          <option value="todos">Todos los años</option>
          {años.map((a) => (
            <option key={a} value={a.toString()}>
              {a}
            </option>
          ))}
        </select>
        <select
          className="select-filtro"
          value={filtroMes}
          onChange={(e) => setFiltroMes(e.target.value)}
        >
          <option value="todos">Todos los meses</option>
          {meses.map((m) => (
            <option key={m.v} value={m.v}>
              {m.l}
            </option>
          ))}
        </select>
      </div>

      {/* VISTA PRINCIPAL */}
      {!galeriaActual && (
        <>
          <div
            className="seccion-sin-galeria"
            onClick={() =>
              setGaleriaActual({ id: "__sin_galeria__", nombre: "Sin galería" })
            }
          >
            <div className="sin-galeria-preview">
              {fotosSinGaleria.slice(0, 4).map((f, i) => (
                <img
                  key={f.id}
                  src={f.imageUrl}
                  alt=""
                  className={`preview-mini preview-mini-${i}`}
                />
              ))}
              {fotosSinGaleria.length === 0 && (
                <div className="sin-galeria-vacia">
                  <Camera size={28} weight="thin" />
                </div>
              )}
            </div>
            <div className="sin-galeria-info">
              <span className="galeria-card-nombre">Nuestra galería</span>
              <span className="galeria-card-conteo">
                {fotosSinGaleria.length} fotos
              </span>
            </div>
          </div>

          <div className="galerias-grid">
            {/* Card de Collages */}
            <div
              className="galeria-card"
              onClick={() =>
                setGaleriaActual({ id: "__collages__", nombre: "Collages 🎨" })
              }
            >
              <div className="galeria-card-portada">
                {collages.length > 0 ? (
                  <img src={collages[0].imageUrl} alt="Collages" />
                ) : (
                  <div className="galeria-card-vacia">
                    <Images size={32} weight="thin" />
                  </div>
                )}
              </div>
              <div className="galeria-card-footer">
                <span className="galeria-card-nombre">Collages</span>
                <span className="galeria-card-conteo">
                  {collages.length} collages
                </span>
              </div>
            </div>
            {galerias.map((g) => (
              <div
                key={g.id}
                className="galeria-card"
                onClick={() => setGaleriaActual(g)}
              >
                <div className="galeria-card-portada">
                  {portadaGaleria(g.id) ? (
                    <img src={portadaGaleria(g.id)} alt={g.nombre} />
                  ) : (
                    <div className="galeria-card-vacia">
                      <Images size={32} weight="thin" />
                    </div>
                  )}
                </div>
                <div className="galeria-card-footer">
                  <span className="galeria-card-nombre">{g.nombre}</span>
                  <span className="galeria-card-conteo">
                    {conteoFotos(g.id)} fotos
                  </span>
                </div>
                <div
                  className="options-container"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="btn-options-galeria"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuGaleriaAbierto(
                        menuGaleriaAbierto === g.id ? null : g.id,
                      );
                    }}
                  >
                    <DotsThreeVertical size={18} weight="bold" />
                  </button>
                  {menuGaleriaAbierto === g.id && (
                    <div className="options-menu">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditandoGaleria(g);
                          setNombreNuevaGaleria(g.nombre);
                          setShowNuevaGaleria(true);
                          setMenuGaleriaAbierto(null);
                        }}
                      >
                        <PencilSimple size={14} weight="light" /> Renombrar
                      </button>
                      <button
                        className="delete-opt"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEliminarGaleria(g);
                        }}
                      >
                        <Trash size={14} weight="light" /> Eliminar galería
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* BARRA DE ACCIONES MÚLTIPLES */}
      {galeriaActual && !modoCollage && (
        <div className="barra-seleccion">
          {!modoSeleccion ? (
            <button
              className="btn-seleccion-modo"
              onClick={() => setModoSeleccion(true)}
            >
              <CheckSquare size={16} weight="light" /> Seleccionar fotos
            </button>
          ) : (
            <>
              <span className="collage-contador">
                {fotosSeleccionadasAccion.length} seleccionadas
              </span>
              {fotosSeleccionadasAccion.length > 0 && (
                <>
                  <button
                    className="btn-accion-header btn-secundario"
                    onClick={() => setShowMoverMultiple(true)}
                  >
                    <ArrowsLeftRight size={16} weight="light" /> Mover
                  </button>
                  <button
                    className="btn-accion-header btn-cancelar-collage"
                    onClick={handleEliminarMultiple}
                  >
                    <Trash size={16} weight="light" /> Eliminar
                  </button>
                </>
              )}
              <button
                className="btn-accion-header btn-secundario"
                onClick={() => {
                  setModoSeleccion(false);
                  setFotosSeleccionadasAccion([]);
                }}
              >
                <X size={14} weight="bold" /> Cancelar
              </button>
            </>
          )}
        </div>
      )}

      {/* GRID DE FOTOS */}
      {loading ? (
        <div className="galeria-loading">Cargando recuerdos...</div>
      ) : (
        galeriaActual &&
        (galeriaActual.id === "__collages__" ? (
          <div className="fotos-grid">
            {collages.map((c) => (
              <div
                key={c.id}
                className="foto-card"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = c.imageUrl;
                  a.target = "_blank";
                  a.click();
                }}
              >
                <img
                  src={c.imageUrl}
                  alt={c.titulo || "Collage"}
                  loading="lazy"
                />
                <div className="foto-fecha">
                  {c.titulo || ""} {c.frase ? `· ${c.frase}` : ""}
                </div>
              </div>
            ))}
            {collages.length === 0 && (
              <div className="galeria-vacia">
                <Images size={48} weight="thin" />
                <p>Aún no hay collages</p>
              </div>
            )}
          </div>
        ) : (
          <div className="fotos-grid">
            {fotosFiltradas.map((foto) => (
              <div
                key={foto.id}
                className={`foto-card 
              ${modoCollage ? "foto-card-seleccionable" : ""} 
              ${fotosSeleccionadas.includes(foto.id) ? "foto-card-seleccionada" : ""}
              ${modoSeleccion ? "foto-card-seleccionable" : ""}
              ${fotosSeleccionadasAccion.includes(foto.id) ? "foto-card-seleccionada" : ""}
            `}
                onClick={() => {
                  if (modoCollage) toggleSeleccion(foto.id);
                  else if (modoSeleccion) toggleSeleccionAccion(foto.id);
                }}
              >
                <img src={foto.imageUrl} alt="" loading="lazy" />
                {modoCollage && (
                  <div className="foto-check">
                    {fotosSeleccionadas.includes(foto.id) ? (
                      <CheckSquare size={24} weight="fill" color="#2d5a27" />
                    ) : (
                      <Square size={24} weight="light" color="white" />
                    )}
                  </div>
                )}
                {modoSeleccion && (
                  <div className="foto-check">
                    {fotosSeleccionadasAccion.includes(foto.id) ? (
                      <CheckSquare size={24} weight="fill" color="#2d5a27" />
                    ) : (
                      <Square size={24} weight="light" color="white" />
                    )}
                  </div>
                )}
                <div className="foto-fecha">
                  {foto.fechaSubida?.toDate
                    ? foto.fechaSubida.toDate().toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : ""}
                </div>
                {!modoCollage && !modoSeleccion && (
                  <div
                    className="options-container foto-options"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="btn-options-foto"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuAbierto(
                          menuAbierto === foto.id ? null : foto.id,
                        );
                      }}
                    >
                      <DotsThreeVertical size={18} weight="bold" />
                    </button>
                    {menuAbierto === foto.id && (
                      <div className="options-menu">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMoverFoto(foto.id);
                            setMenuAbierto(null);
                          }}
                        >
                          <ArrowsLeftRight size={14} weight="light" /> Mover
                          a...
                        </button>
                        <button
                          className="delete-opt"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEliminarFoto(foto);
                          }}
                        >
                          <Trash size={14} weight="light" /> Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {fotosFiltradas.length === 0 && (
              <div className="galeria-vacia">
                <Camera size={48} weight="thin" />
                <p>Aún no hay fotos aquí</p>
              </div>
            )}
          </div>
        ))
      )}

      {/* MODAL MOVER MÚLTIPLE */}
      {showMoverMultiple && (
        <div
          className="modal-overlay"
          onClick={() => setShowMoverMultiple(false)}
        >
          <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
            <h2>Mover {fotosSeleccionadasAccion.length} fotos a...</h2>
            <div className="lista-galerias-mover">
              <button
                className="btn-galeria-mover"
                onClick={() => handleMoverMultiple(null)}
              >
                📁 Sin galería
              </button>
              {galerias.map((g) => (
                <button
                  key={g.id}
                  className="btn-galeria-mover"
                  onClick={() => handleMoverMultiple(g.id)}
                >
                  📂 {g.nombre}
                </button>
              ))}
            </div>
            <button
              className="btn-cancelar-modal"
              onClick={() => setShowMoverMultiple(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* MODAL NUEVA/EDITAR GALERÍA */}
      {showNuevaGaleria && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowNuevaGaleria(false);
            setEditandoGaleria(null);
            setNombreNuevaGaleria("");
          }}
        >
          <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
            <h2>{editandoGaleria ? "Renombrar galería" : "Nueva galería"}</h2>
            <input
              type="text"
              className="input-vintage"
              placeholder="Nombre de la galería..."
              value={nombreNuevaGaleria}
              onChange={(e) => setNombreNuevaGaleria(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCrearGaleria()}
              autoFocus
            />
            <div className="modal-botones">
              <button
                className="btn-guardar-vintage"
                onClick={handleCrearGaleria}
              >
                {editandoGaleria ? "Guardar" : "Crear"}
              </button>
              <button
                className="btn-cancelar-modal"
                onClick={() => {
                  setShowNuevaGaleria(false);
                  setEditandoGaleria(null);
                  setNombreNuevaGaleria("");
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MOVER FOTO */}
      {showMoverFoto && (
        <div className="modal-overlay" onClick={() => setShowMoverFoto(null)}>
          <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
            <h2>Mover foto a...</h2>
            <div className="lista-galerias-mover">
              <button
                className="btn-galeria-mover"
                onClick={() => handleMoverFoto(showMoverFoto, null)}
              >
                📁 Sin galería
              </button>
              {galerias.map((g) => (
                <button
                  key={g.id}
                  className="btn-galeria-mover"
                  onClick={() => handleMoverFoto(showMoverFoto, g.id)}
                >
                  📂 {g.nombre}
                </button>
              ))}
            </div>
            <button
              className="btn-cancelar-modal"
              onClick={() => setShowMoverFoto(null)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* GENERADOR DE COLLAGE */}
      {showGenerador && (
        <GeneradorCollage
          fotos={fotosParaCollage}
          onClose={() => {
            setShowGenerador(false);
            setModoCollage(false);
            setFotosSeleccionadas([]);
          }}
        />
      )}

      {subiendo && (
        <div className="subiendo-overlay">
          <div className="subiendo-msg">Subiendo fotos... 📸</div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERADOR DE COLLAGE
// ─────────────────────────────────────────────────────────────────────────────
function GeneradorCollage({ fotos, onClose }) {
  const [estilo, setEstilo] = useState(null);
  const [titulo, setTitulo] = useState("");
  const [frase, setFrase] = useState("");
  const [generando, setGenerando] = useState(false);
  const canvasRef = useRef(null);
  const [preview, setPreview] = useState(null);

  const estilos = [
    { id: "cuadricula", label: "Cuadrícula", emoji: "⊞" },
    { id: "polaroids", label: "Polaroids", emoji: "📷" },
    { id: "revista", label: "Revista", emoji: "📰" },
    { id: "corazon", label: "Corazón", emoji: "💚" },
  ];

  const generarCollage = async () => {
    if (!estilo) return;
    setGenerando(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = 1080;
    canvas.height = 1080;
    ctx.fillStyle = "#fdf6e3";
    ctx.fillRect(0, 0, 1080, 1080);

    const cargarImagen = (url) =>
      new Promise((res) => {
        fetch(url)
          .then((r) => r.blob())
          .then((blob) => {
            const objectUrl = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = () => {
              URL.revokeObjectURL(objectUrl);
              res(img);
            };
            img.onerror = () => res(null);
            img.src = objectUrl;
          })
          .catch(() => res(null));
      });

    const imgs = await Promise.all(fotos.map((f) => cargarImagen(f.imageUrl)));
    const validas = imgs.filter(Boolean);

    if (estilo === "cuadricula") dibujarCuadricula(ctx, validas, titulo, frase);
    else if (estilo === "polaroids")
      dibujarPolaroids(ctx, validas, titulo, frase);
    else if (estilo === "revista") dibujarRevista(ctx, validas, titulo, frase);
    else if (estilo === "corazon") dibujarCorazon(ctx, validas, titulo, frase);

    setPreview(canvas.toDataURL("image/jpeg", 0.92));
    setGenerando(false);
  };

  const handleDescargarYGuardar = async () => {
    if (!preview) return;
    const a = document.createElement("a");
    a.href = preview;
    a.download = `collage_${Date.now()}.jpg`;
    a.click();
    try {
      const blob = await (await fetch(preview)).blob();
      const storageRef = ref(storage, `collages/${Date.now()}.jpg`);
      const snap = await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(snap.ref);
      await addDoc(collection(db, "collages"), {
        imageUrl: url,
        storagePath: snap.ref.fullPath,
        titulo,
        frase,
        estilo,
        fotosIds: fotos.map((f) => f.id),
        fechaCreacion: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error guardando collage:", err);
    }
  };

  return (
    <div className="generador-overlay">
      <div className="generador-contenido">
        <button className="generador-close" onClick={onClose}>
          <X size={20} weight="bold" />
        </button>
        <h2 className="generador-titulo">Crear Collage</h2>
        {!preview ? (
          <>
            <p className="generador-label">Elige un estilo:</p>
            <div className="estilos-grid">
              {estilos.map((e) => (
                <button
                  key={e.id}
                  className={`estilo-btn ${estilo === e.id ? "estilo-btn-activo" : ""}`}
                  onClick={() => setEstilo(e.id)}
                >
                  <span className="estilo-emoji">{e.emoji}</span>
                  <span>{e.label}</span>
                </button>
              ))}
            </div>
            <input
              type="text"
              className="input-vintage"
              placeholder="Título del collage (opcional)"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
            <input
              type="text"
              className="input-vintage"
              placeholder="Frase o dedicatoria (opcional)"
              value={frase}
              onChange={(e) => setFrase(e.target.value)}
            />
            <button
              className="btn-guardar-vintage"
              disabled={!estilo || generando}
              onClick={generarCollage}
            >
              {generando ? "Generando..." : "Generar collage"}
            </button>
          </>
        ) : (
          <>
            <img src={preview} alt="Collage" className="collage-preview" />
            <div className="generador-botones">
              <button
                className="btn-guardar-vintage"
                onClick={handleDescargarYGuardar}
              >
                ⬇️ Descargar y guardar
              </button>
              <button
                className="btn-cancelar-modal"
                onClick={() => setPreview(null)}
              >
                Cambiar estilo
              </button>
            </div>
          </>
        )}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </div>
  );
}

function drawTextoCollage(ctx, titulo, frase, W, H) {
  if (titulo) {
    ctx.save();
    ctx.font = `bold ${Math.floor(W * 0.055)}px 'Great Vibes', cursive`;
    ctx.fillStyle = "#2d5a27";
    ctx.textAlign = "center";
    ctx.fillText(titulo, W / 2, H - 80);
    ctx.restore();
  }
  if (frase) {
    ctx.save();
    ctx.font = `italic ${Math.floor(W * 0.028)}px 'EB Garamond', serif`;
    ctx.fillStyle = "#7f8c8d";
    ctx.textAlign = "center";
    ctx.fillText(frase, W / 2, H - 40);
    ctx.restore();
  }
}

function drawImgCover(ctx, img, x, y, w, h) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = img.width * scale,
    sh = img.height * scale;
  const sx = x + (w - sw) / 2,
    sy = y + (h - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh);
}

function dibujarCuadricula(ctx, imgs, titulo, frase) {
  const W = 1080,
    H = 1080;
  const pad = 12;
  const cols = imgs.length <= 4 ? 2 : 3;
  const filas = cols;
  const cw = (W - pad * (cols + 1)) / cols;
  const ch = (H - pad * (filas + 1) - (titulo || frase ? 100 : 0)) / filas;
  imgs.slice(0, cols * filas).forEach((img, i) => {
    const col = i % cols,
      fila = Math.floor(i / cols);
    const x = pad + col * (cw + pad),
      y = pad + fila * (ch + pad);
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, cw, ch, 8);
    ctx.clip();
    drawImgCover(ctx, img, x, y, cw, ch);
    ctx.restore();
  });
  drawTextoCollage(ctx, titulo, frase, W, H);
}

function dibujarPolaroids(ctx, imgs, titulo, frase) {
  const W = 1080,
    H = 1080;
  ctx.fillStyle = "#f5e6c8";
  ctx.fillRect(0, 0, W, H);
  const posiciones = [
    { x: 60, y: 80, rot: -8 },
    { x: 420, y: 50, rot: 5 },
    { x: 720, y: 90, rot: -4 },
    { x: 100, y: 480, rot: 6 },
    { x: 430, y: 460, rot: -7 },
    { x: 740, y: 500, rot: 4 },
  ];
  imgs.slice(0, 6).forEach((img, i) => {
    const { x, y, rot } = posiciones[i] || { x: i * 160, y: 200, rot: 0 };
    const pw = 280,
      ph = 320;
    ctx.save();
    ctx.translate(x + pw / 2, y + ph / 2);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.translate(-pw / 2, -ph / 2);
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,0.2)";
    ctx.shadowBlur = 15;
    ctx.fillRect(0, 0, pw, ph);
    ctx.shadowBlur = 0;
    ctx.save();
    ctx.beginPath();
    ctx.rect(10, 10, pw - 20, ph - 60);
    ctx.clip();
    drawImgCover(ctx, img, 10, 10, pw - 20, ph - 60);
    ctx.restore();
    ctx.restore();
  });
  drawTextoCollage(ctx, titulo, frase, W, H);
}

function dibujarRevista(ctx, imgs, titulo, frase) {
  const W = 1080,
    H = 1080;
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, W, H);
  const layout = [
    { x: 0, y: 0, w: 650, h: 650 },
    { x: 660, y: 0, w: 420, h: 315 },
    { x: 660, y: 325, w: 420, h: 315 },
    { x: 0, y: 660, w: 340, h: 300 },
    { x: 350, y: 660, w: 340, h: 300 },
    { x: 700, y: 660, w: 380, h: 300 },
  ];
  imgs.slice(0, 6).forEach((img, i) => {
    const { x, y, w, h } = layout[i] || { x: 0, y: 0, w: 200, h: 200 };
    const gap = 5;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + gap, y + gap, w - gap * 2, h - gap * 2);
    ctx.clip();
    drawImgCover(ctx, img, x + gap, y + gap, w - gap * 2, h - gap * 2);
    ctx.restore();
  });
  if (titulo) {
    ctx.save();
    ctx.font = `bold ${Math.floor(W * 0.06)}px 'Great Vibes', cursive`;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.textAlign = "left";
    ctx.fillText(titulo, 20, 630);
    ctx.restore();
  }
  if (frase) {
    ctx.save();
    ctx.font = `italic ${Math.floor(W * 0.025)}px 'EB Garamond', serif`;
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.textAlign = "left";
    ctx.fillText(frase, 20, 660);
    ctx.restore();
  }
}

function dibujarCorazon(ctx, imgs, titulo, frase) {
  const W = 1080,
    H = 1080;
  ctx.fillStyle = "#0d0d1a";
  ctx.fillRect(0, 0, W, H);
  const cx = W / 2,
    cy = H / 2 - 40;
  const escala = 420;
  ctx.save();
  ctx.beginPath();
  for (let t = 0; t <= Math.PI * 2; t += 0.01) {
    const x = cx + (escala * 16 * Math.pow(Math.sin(t), 3)) / 16;
    const y =
      cy -
      (escala *
        (13 * Math.cos(t) -
          5 * Math.cos(2 * t) -
          2 * Math.cos(3 * t) -
          Math.cos(4 * t))) /
        16;
    t < 0.02 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.clip();
  const grid = Math.ceil(Math.sqrt(imgs.length));
  const cw = W / grid,
    ch = H / grid;
  imgs.forEach((img, i) => {
    const col = i % grid,
      fila = Math.floor(i / grid);
    drawImgCover(ctx, img, col * cw, fila * ch, cw, ch);
  });
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  for (let t = 0; t <= Math.PI * 2; t += 0.01) {
    const x = cx + (escala * 16 * Math.pow(Math.sin(t), 3)) / 16;
    const y =
      cy -
      (escala *
        (13 * Math.cos(t) -
          5 * Math.cos(2 * t) -
          2 * Math.cos(3 * t) -
          Math.cos(4 * t))) /
        16;
    t < 0.02 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.strokeStyle = "rgba(46,210,100,0.6)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
  drawTextoCollage(ctx, titulo, frase, W, H);
}

export default Galeria;
