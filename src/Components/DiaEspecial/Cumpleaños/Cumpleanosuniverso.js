import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Cumpleanosuniverso.css";

// ── Configuración ──
const DURACION_DEFAULT = 216.5; // segundos — se ajusta con la duración real del audio
const SCROLL_MAX = 94; // % máximo de desplazamiento al terminar el poema
const VOLUMEN_MUSICA = 0.28; // Interstellar de fondo, bajo para que la voz se escuche
const VOLUMEN_VOZ = 1;

// ── URLs de Firebase Storage ──
const URL_VIDEO =
  "https://firebasestorage.googleapis.com/v0/b/portal-de-recuerdos.firebasestorage.app/o/diasEspeciales%2Fvideos%2FSaturnoBebe.mp4?alt=media";
const URL_MUSICA =
  "https://firebasestorage.googleapis.com/v0/b/portal-de-recuerdos.firebasestorage.app/o/diasEspeciales%2Fmusica%2FInterestellarFondo.mp3?alt=media";
const URL_VOZ =
  "https://firebasestorage.googleapis.com/v0/b/portal-de-recuerdos.firebasestorage.app/o/diasEspeciales%2Faudio%2FPoemaCumplea%C3%B1os.mp4?alt=media";

// ── Poema — cada línea es un renglón del crawl, doble salto = nueva estrofa ──
const POEMA = `Feliz cumpleaños, mi Saturno.

Hace exactamente un año,
tu nombre era una estrella más
perdida entre miles de millones.

Tu existencia y la mía
compartían el mismo cielo,
pero habitaban constelaciones distintas.

Y sin embargo,
como si el universo hubiese dedicado siglos
a calcular una órbita imposible,
un día nuestros caminos coincidieron.

Desde entonces he intentado comprender
qué fue aquello que llamó mi atención.

Pensé que había sido tu inteligencia,
tu disciplina,
tu belleza,
tu manera de enfrentar la vida.

Pero ninguna de esas respuestas
logró explicarlo por completo.

Porque cuando te observé,
no vi solamente a una mujer.

Vi un universo.

Vi galaxias enteras escondidas
detrás de una mirada.

Vi sueños luchando por nacer.

Vi fortalezas construidas
a partir de antiguas tormentas.

Vi una luz tan propia,
tan auténtica,
que incluso hoy continúa sorprendiéndome.

Y mientras más tiempo pasa,
más me convenzo de algo:

La magnificencia del cosmos
no vive únicamente entre nebulosas,
estrellas o planetas lejanos.

A veces adquiere forma humana.

A veces sonríe.

A veces tiene tus ojos.

Quizá por eso tu presencia es tan magnética.

Porque deja huella.

Porque transforma.

Porque incluso cuando abandonas un lugar,
algo de ti permanece en él.

Como Saturno,
que no necesita acercarse demasiado
para que todos reconozcan su belleza.

Como Saturno,
que lleva consigo anillos que lo rodean,
no como cadenas,
sino como el testimonio de todo lo que ha vivido.

Y yo veo esos anillos en ti.

Los veo en tus luchas.

En tus responsabilidades.

En tus preocupaciones.

En tus anhelos.

En cada cosa que cargas
sin quejarte tanto como deberías.

Y aunque hoy no pueda hacer más
que extender una mano hacia tu universo,
quiero que sepas algo.

No me interesa contemplar únicamente
los días soleados de tu cielo.

No me interesa aparecer
solo cuando la marea es tranquila.

Porque las estrellas más hermosas
no brillan únicamente cuando todo está bien.

Brillan porque aprendieron a existir
en medio de la oscuridad.

Y si algún día el peso de tus anillos
se vuelve demasiado grande,
si alguna vez el universo parece moverse
más rápido de lo que puedes soportar,
quiero seguir siendo esa presencia cercana,
esa pequeña gravedad
que te recuerde que no tienes que recorrerlo todo sola.

Hoy es tu cumpleaños.

Hoy el universo entero debería detenerse
un instante para celebrar
la extraordinaria casualidad de que existas.

Y aun así siento que ninguna palabra,
ningún gesto,
ningún regalo,
alcanza a representar
todo lo bueno que deseo para ti.

Porque para alguien como tú,
las cosas hermosas siempre parecen quedarse cortas.

Solo puedo decirte
que me siento profundamente agradecido
de haberte encontrado.

Que cada día admiro más
a la mujer que eres.

Y que hay afectos tan grandes
que terminan pareciéndose
a la gravedad misma:

No necesitan hacerse visibles
para sostener mundos enteros.

Por eso,
en este día donde celebramos tu existencia,
solo quiero pedirle una cosa al universo:

Que nunca permita que se apague
esa luz que llevas dentro.

Porque encontrar una estrella así
es algo que ocurre muy pocas veces.

Y quienes tenemos la fortuna de contemplarla,
solo podemos hacer una cosa:

Cuidar su resplandor.

Feliz cumpleaños, mis ojitos.

Gracias por existir.
💚`;

export default function CumpleanosUniverso() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const vozRef = useRef(null);
  const musicaRef = useRef(null);
  const animRef = useRef(null);
  const fadeMusicaRef = useRef(null);
  const duracionRef = useRef(DURACION_DEFAULT);

  const scrollRef = useRef(null); // ref al contenedor del scroll

  const [scrollPx, setScrollPx] = useState(0);
  const [finalizado, setFinalizado] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const voz = vozRef.current;
    const musica = musicaRef.current;

    video?.play().catch(() => {});

    // ── Crossfade suave en el loop del video ──
    // 1 segundo antes del final hace fade out, al reiniciar hace fade in
    const handleTimeUpdate = () => {
      if (!video) return;
      const restante = video.duration - video.currentTime;
      if (restante <= 1) {
        video.style.opacity = Math.max(0, restante); // fade out
      } else if (video.currentTime < 1) {
        video.style.opacity = Math.min(1, video.currentTime); // fade in
      } else {
        video.style.opacity = 1;
      }
    };
    video?.addEventListener("timeupdate", handleTimeUpdate);

    if (musica) {
      musica.volume = VOLUMEN_MUSICA;
      musica.loop = true;
      musica.play().catch(() => {});
    }
    if (voz) {
      voz.volume = VOLUMEN_VOZ;
      voz.play().catch(() => {});
    }

    const handleLoadedMeta = () => {
      if (voz.duration && isFinite(voz.duration)) {
        duracionRef.current = voz.duration;
      }
    };
    voz?.addEventListener("loadedmetadata", handleLoadedMeta);

    // ── Loop: sincroniza el scroll del poema con el audio de la voz ──
    const loop = () => {
      if (voz && scrollRef.current) {
        const prog = Math.min(voz.currentTime / duracionRef.current, 1);
        // scrollHeight total desplazable = altura del contenido - altura visible
        const contenedor = scrollRef.current;
        const scrollable = contenedor.scrollHeight - window.innerHeight;
        setScrollPx(prog * Math.max(0, scrollable));
      }
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);

    // ── Al terminar el poema ──
    const handleEnded = () => {
      setFinalizado(true);
      if (musica) {
        let vol = musica.volume;
        fadeMusicaRef.current = setInterval(() => {
          vol = Math.max(0, vol - 0.01);
          musica.volume = vol;
          if (vol <= 0) clearInterval(fadeMusicaRef.current);
        }, 150);
      }
    };
    voz?.addEventListener("ended", handleEnded);

    return () => {
      cancelAnimationFrame(animRef.current);
      if (fadeMusicaRef.current) clearInterval(fadeMusicaRef.current);
      video?.removeEventListener("timeupdate", handleTimeUpdate);
      voz?.removeEventListener("loadedmetadata", handleLoadedMeta);
      voz?.removeEventListener("ended", handleEnded);
      voz?.pause();
      musica?.pause();
      video?.pause();
    };
  }, []);

  const limpiarTodo = () => {
    cancelAnimationFrame(animRef.current);
    if (fadeMusicaRef.current) clearInterval(fadeMusicaRef.current);
    vozRef.current?.pause();
    musicaRef.current?.pause();
    videoRef.current?.pause();
  };

  const handleSalir = () => {
    limpiarTodo();
    navigate("/dashboard");
  };

  return (
    <div className="cumu-overlay">
      {/* Fondo: video en loop */}
      <video
        ref={videoRef}
        className="cumu-video"
        src={URL_VIDEO}
        loop
        muted
        playsInline
        autoPlay
      />
      <div className="cumu-oscuro" />

      {/* Audio: voz + música */}
      <audio ref={vozRef} src={URL_VOZ} preload="auto" />
      <audio ref={musicaRef} src={URL_MUSICA} preload="auto" />

      {/* Salir — disponible en todo momento */}
      <button className="cumu-salir" onClick={handleSalir} title="Salir">
        ✕
      </button>

      {/* Poema — crawl tipo Star Wars */}
      {!finalizado && (
        <div className="cumu-poema-wrapper">
          <div
            ref={scrollRef}
            className="cumu-poema-scroll"
            style={{
              transform: `translateY(-${scrollPx}px)`,
              transition: "none",
            }}
          >
            <p className="cumu-poema-texto">{POEMA}</p>
          </div>
        </div>
      )}

      {/* Cierre */}
      {finalizado && (
        <div className="cumu-cierre">
          <p className="cumu-cierre-texto">Feliz Cumpleaños, Mis Ojitos 💚</p>
          <button className="cumu-btn-volver" onClick={handleSalir}>
            Volver al portal
          </button>
        </div>
      )}
    </div>
  );
}
