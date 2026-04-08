"""
cartapluma.py — Animación: Galaxia → Corazón de Partículas → "Tu Bebé 💚"
Duración total: 4:52 (292 segundos)
Poema: empieza en t=35s, dura 3:17 (197s)
"""

from manim import *
import numpy as np
import random
import json
from pathlib import Path
from manim import *
import manimpango
manimpango.register_font("./GreatVibes-Regular.ttf")

# ── CONFIGURACIÓN ────────────────────────────────────────────────────────────
TOTAL_DURATION = 292  # 4:52
POEM_START = 35  # segundo en que empieza la voz
POEM_END = 232  # segundo en que termina la voz (~35 + 197)
GALAXY_FORM_END = 30  # la galaxia termina de formarse
HEART_START = 32  # el corazón empieza a formarse
HEART_FULL = 55  # corazón completamente formado
FIRMA_START = 245  # "Tu Bebé 💚" empieza a formarse
FIRMA_FULL = 265  # firma completamente visible

CAMERA_W = 8.0 # ancho del frame de Manim (16:9 → 14.2 x 8)
CAMERA_H = 14.2

# ── FRASES DEL POEMA (pre-procesadas desde transcript.json) ─────────────────
FRASES = [
    {
        "txt": "Hay palabras que parecen pequeñas para todo lo que",
        "start": 35.14,
        "end": 38.74,
    },
    {"txt": "intentan sostener,", "start": 38.44, "end": 39.92},
    {"txt": "como cuando digo que eres la nada de mi", "start": 39.74, "end": 42.74},
    {"txt": "todo.", "start": 42.44, "end": 43.06},
    {"txt": "Y no es ausencia,", "start": 42.9, "end": 44.94},
    {"txt": "es transformación,", "start": 44.72, "end": 46.5},
    {"txt": "porque uno llega cargando mundos,", "start": 46.2, "end": 49.02},
    {"txt": "rutinas,", "start": 48.72, "end": 49.82},
    {"txt": "pendientes,", "start": 49.7, "end": 50.86},
    {"txt": "caminos trazados,", "start": 50.58, "end": 52.24},
    {
        "txt": "una vida llena de nombres y ocupaciones que parecen",
        "start": 52.0,
        "end": 56.36,
    },
    {"txt": "importantes,", "start": 56.06, "end": 56.86},
    {"txt": "hasta que apareces tú.", "start": 57.12, "end": 59.48},
    {"txt": "Y entonces,", "start": 59.3, "end": 60.38},
    {"txt": "todo eso,", "start": 60.48, "end": 61.62},
    {"txt": "sin desaparecer,", "start": 61.4, "end": 63.1},
    {"txt": "pierde peso,", "start": 62.86, "end": 63.96},
    {"txt": "se vuelve liviano.", "start": 63.86, "end": 65.2},
    {"txt": "Se vuelve fondo.", "start": 65.14, "end": 66.42},
    {"txt": "Porque mi atención,", "start": 66.38, "end": 67.78},
    {"txt": "mi centro,", "start": 67.84, "end": 69.06},
    {"txt": "mi impulso,", "start": 68.94, "end": 70.2},
    {"txt": "deciden girar hacia un solo punto.", "start": 69.92, "end": 72.76},
    {
        "txt": "Tú eres esa pausa que reordena el universo,",
        "start": 72.88,
        "end": 76.68,
    },
    {
        "txt": "ese instante donde todo lo demás deja de urgir.",
        "start": 76.86,
        "end": 80.98,
    },
    {"txt": "Y tus ojos,", "start": 80.78, "end": 81.96},
    {"txt": "tus ojos no son solo mirada,", "start": 81.96, "end": 84.44},
    {
        "txt": "son abismos dulces donde la voluntad se rinde sin",
        "start": 84.18,
        "end": 88.1,
    },
    {"txt": "resistencia.", "start": 87.8, "end": 89.1},
    {"txt": "En ellos no solo veo belleza,", "start": 88.92, "end": 91.88},
    {"txt": "veo algo que me llama a quedarme,", "start": 91.68, "end": 93.98},
    {"txt": "a contemplar sin prisa,", "start": 93.84, "end": 95.76},
    {
        "txt": "como quien observa una nebulosa lejana sabiendo que nunca",
        "start": 95.66,
        "end": 99.58,
    },
    {"txt": "podrá abarcarla completa,", "start": 99.28, "end": 101.58},
    {"txt": "pero aún así no puede dejar de mirarla.", "start": 101.62, "end": 104.78},
    {
        "txt": "Hay en ti una inmensidad que no se explica,",
        "start": 104.62,
        "end": 108.3,
    },
    {"txt": "que se siente,", "start": 108.02, "end": 109.82},
    {
        "txt": "y que despierta en mí una necesidad tranquila,",
        "start": 110.36,
        "end": 113.66,
    },
    {"txt": "pero firme de cuidar,", "start": 113.36, "end": 115.32},
    {"txt": "de querer,", "start": 115.04, "end": 115.9},
    {"txt": "de proteger lo que no pide ser protegido,", "start": 115.88, "end": 119.5},
    {"txt": "pero inspira a hacerlo.", "start": 119.28, "end": 121.34},
    {"txt": "Y no es solo lo que muestras,", "start": 121.24, "end": 123.52},
    {"txt": "es todo lo que hay detrás.", "start": 123.4, "end": 125.4},
    {"txt": "Ese mundo tuyo,", "start": 125.66, "end": 126.72},
    {"txt": "complejo,", "start": 126.5, "end": 127.62},
    {"txt": "real,", "start": 127.46, "end": 128.4},
    {"txt": "lleno de historias,", "start": 128.38, "end": 130.32},
    {"txt": "de luces y de sombras,", "start": 130.04, "end": 132.22},
    {
        "txt": "de procesos que te han hecho ser quien eres,",
        "start": 131.92,
        "end": 134.96,
    },
    {"txt": "lejos de asustarme,", "start": 134.92, "end": 136.74},
    {"txt": "me llama,", "start": 136.62, "end": 137.64},
    {"txt": "lejos de pesar,", "start": 137.62, "end": 138.96},
    {"txt": "me impulsa.", "start": 139.02, "end": 140.38},
    {"txt": "Porque entiendo que todo lo que admiro,", "start": 140.18, "end": 142.96},
    {"txt": "todo lo que me atrapa,", "start": 142.78, "end": 144.54},
    {"txt": "todo lo que me hace quedarme,", "start": 144.24, "end": 146.22},
    {
        "txt": "es el resultado de esa conjunción invisible que vive",
        "start": 146.08,
        "end": 150.1,
    },
    {"txt": "en ti.", "start": 149.8, "end": 150.64},
    {"txt": "No quiero una versión ligera de ti,", "start": 150.48, "end": 153.0},
    {"txt": "quiero el universo completo,", "start": 152.86, "end": 154.66},
    {"txt": "completo,", "start": 154.36, "end": 154.84},
    {"txt": "con todo lo que implica,", "start": 154.7, "end": 156.6},
    {"txt": "con todo lo que trae,", "start": 156.42, "end": 158.38},
    {"txt": "con todo lo que eres.", "start": 158.1, "end": 159.8},
    {"txt": "Y en medio de todo eso,", "start": 159.76, "end": 161.48},
    {"txt": "sin darme cuenta,", "start": 161.3, "end": 162.82},
    {"txt": "encendiste algo en mí.", "start": 162.82, "end": 164.84},
    {"txt": "No llegaste a darle sentido a mi vida,", "start": 164.7, "end": 167.76},
    {"txt": "porque mi vida ya caminaba,", "start": 167.6, "end": 169.92},
    {"txt": "pero sí encendiste una llama,", "start": 169.78, "end": 172.12},
    {"txt": "una que me empuja a crecer,", "start": 171.98, "end": 174.3},
    {"txt": "a ser mejor,", "start": 174.06, "end": 175.16},
    {"txt": "a construir algo más sólido,", "start": 175.14, "end": 177.82},
    {"txt": "más digno de lo que siento.", "start": 177.56, "end": 179.52},
    {"txt": "Una llama que no busca solo arder,", "start": 179.32, "end": 182.5},
    {"txt": "sino iluminar camino,", "start": 182.28, "end": 184.1},
    {"txt": "y que en su luz siempre te incluye.", "start": 184.36, "end": 187.22},
    {"txt": "Porque si avanzo,", "start": 187.02, "end": 188.66},
    {"txt": "quiero que sea contigo,", "start": 188.36, "end": 190.12},
    {"txt": "si construyo,", "start": 189.88, "end": 191.3},
    {"txt": "quiero que sea a tu lado.", "start": 191.1, "end": 193.06},
    {"txt": "Y si sueño,", "start": 192.94, "end": 194.94},
    {"txt": "inevitablemente apareces.", "start": 194.76, "end": 198.22},
    {
        "txt": "Y entonces entiendo que hay presencias que no llegan",
        "start": 198.14,
        "end": 201.9,
    },
    {"txt": "a cambiarlo todo,", "start": 201.6, "end": 202.74},
    {"txt": "sino a hacerlo más claro,", "start": 202.64, "end": 204.94},
    {"txt": "más profundo,", "start": 204.78, "end": 206.16},
    {"txt": "más verdadero.", "start": 205.98, "end": 207.3},
    {"txt": "Por eso,", "start": 207.1, "end": 208.0},
    {
        "txt": "si alguna vez me escuchas decir que eres la",
        "start": 207.76,
        "end": 211.06,
    },
    {"txt": "nada de mi todo,", "start": 210.76, "end": 212.04},
    {"txt": "entiende,", "start": 212.51, "end": 213.81},
    {"txt": "que en ese caben mil cosas.", "start": 213.89, "end": 220.54},
    {"txt": "En ese nada solo cabes tú.", "start": 220.4, "end": 226.58},
    {"txt": "Y curiosamente,", "start": 226.38, "end": 228.75},
    {"txt": "eso lo convierte en todo.", "start": 229.0, "end": 232.54},
]


# ── HELPERS ──────────────────────────────────────────────────────────────────
def rng_seed(seed=42):
    random.seed(seed)
    np.random.seed(seed)


def lerp(a, b, t):
    return a + (b - a) * np.clip(t, 0, 1)


def ease_in_out(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)


def ease_out(t):
    t = np.clip(t, 0, 1)
    return 1 - (1 - t) ** 2


# ── POSICIONES DEL CORAZÓN ANATÓMICO ────────────────────────────────────────
def heart_points(cx, cy, scale, n=800):
    """Genera puntos sobre la silueta de un corazón humano."""
    rng_seed(7)
    pts = []
    # Parámetro principal: la silueta
    for i in range(n):
        t = (i / n) * TAU
        # Corazón matemático con distorsión anatómica
        x = 16 * np.sin(t) ** 3
        y = 13 * np.cos(t) - 5 * np.cos(2 * t) - 2 * np.cos(3 * t) - np.cos(4 * t)
        # Distorsión leve para parecer más orgánico
        x *= 1 + 0.08 * np.sin(t * 3)
        y *= 0.92
        pts.append(np.array([cx + x * scale, cy + y * scale, 0]))

    # Puntos interiores para dar volumen
    for r in [0.25, 0.5, 0.75]:
        for i in range(int(n * r * 0.6)):
            t = (i / (n * r * 0.6)) * TAU
            x = 16 * np.sin(t) ** 3 * r
            y = (
                -(
                    13 * np.cos(t)
                    - 5 * np.cos(2 * t)
                    - 2 * np.cos(3 * t)
                    - np.cos(4 * t)
                )
                * r
                * 0.92
            )
            x += random.gauss(0, 0.3)
            y += random.gauss(0, 0.3)
            pts.append(np.array([cx + x * scale, cy + y * scale, 0]))

    random.shuffle(pts)
    return pts


# ── POSICIONES DE GALAXIA ────────────────────────────────────────────────────
def galaxy_points(cx, cy, n=600, radius=3.2, arms=3):
    """Genera puntos que forman una galaxia espiral."""
    rng_seed(13)
    pts = []
    for i in range(n):
        arm = i % arms
        t = (i / n) * TAU * 2.5 + arm * (TAU / arms)
        r = 0.05 + (i / n) * radius + random.gauss(0, 0.15)
        spread = random.gauss(0, 0.12) * (r / radius)
        x = cx + r * np.cos(t) + spread
        y = cy + r * np.sin(t) * 0.4 + spread * 0.4  # aplanada
        z = random.gauss(0, 0.05)  # leve profundidad
        pts.append(np.array([x, y, z]))

    # Núcleo brillante
    for i in range(int(n * 0.15)):
        a = random.uniform(0, TAU)
        r = abs(random.gauss(0, 0.25))
        pts.append(np.array([cx + r * np.cos(a), cy + r * np.sin(a) * 0.4, 0]))

    random.shuffle(pts)
    return pts


# ── COLORES ──────────────────────────────────────────────────────────────────
# Corazón: rojo-carmesí anatómico
def heart_color(idx, total):
    t = idx / max(total, 1)
    r = lerp(0.55, 0.85, t + random.uniform(-0.1, 0.1))
    g = lerp(0.02, 0.12, t)
    b = lerp(0.05, 0.18, t)
    return ManimColor.from_rgb(
        (
            np.clip(r, 0, 1),
            np.clip(g, 0, 1),
            np.clip(b, 0, 1),
        )
    )


# Galaxia: azul-violeta-blanco
def galaxy_color(idx, total):
    t = idx / max(total, 1)
    paleta = [
        (0.5, 0.6, 1.0),  # azul pálido
        (0.8, 0.7, 1.0),  # violeta
        (1.0, 1.0, 1.0),  # blanco
        (0.4, 0.7, 1.0),  # celeste
        (0.9, 0.85, 1.0),  # blanco-violeta
    ]
    col = paleta[idx % len(paleta)]
    return ManimColor.from_rgb(col)


# Firma: verde esmeralda neón
FIRMA_COLOR = ManimColor.from_rgb((0.15, 0.95, 0.45))
FIRMA_GLOW = ManimColor.from_rgb((0.05, 0.55, 0.25))

# Subtítulo: blanco con sombra cian
SUB_COLOR = WHITE


# ── ESCENA PRINCIPAL ─────────────────────────────────────────────────────────
class Animacion(Scene):

    def construct(self):
        rng_seed()
        self.camera.frame_width = 8.0
        self.camera.frame_height = 14.2
        self.camera.background_color = ManimColor.from_rgb((0.01, 0.01, 0.04))

        # Centros
        GAL_POS = np.array([0, -0.3, 0])  # galaxia ligeramente abajo
        HEART_POS = np.array([0, 0.4, 0])  # corazón un poco arriba

        # ── 1. ESTRELLAS DE FONDO (estáticas, siempre presentes) ─────────────
        stars = self._crear_estrellas(300)
        self.add(stars)

        # ── 2. GALAXIA ────────────────────────────────────────────────────────
        gal_pts = galaxy_points(GAL_POS[0], GAL_POS[1], n=600)
        gal_dots = self._crear_dots(
            gal_pts, lambda i, n: galaxy_color(i, n), r_min=0.012, r_max=0.038
        )

        # Partículas del corazón (empiezan en pos de galaxia, migran al corazón)
        n_heart = 900
        h_pts = heart_points(HEART_POS[0], HEART_POS[1], scale=0.105, n=n_heart)

        # Posiciones de origen (en la galaxia + ruido)
        g_origins = []
        for i in range(n_heart):
            gi = i % len(gal_pts)
            origin = gal_pts[gi] + np.array(
                [random.gauss(0, 0.4), random.gauss(0, 0.2), 0]
            )
            g_origins.append(origin)

        heart_dots = VGroup()
        for i in range(n_heart):
            d = Dot(point=g_origins[i], radius=random.uniform(0.008, 0.025))
            # Color: mezcla de galaxia inicialmente
            t_col = i / n_heart
            d.set_color(galaxy_color(i, n_heart))
            d.set_opacity(0)
            heart_dots.add(d)

        self.add(heart_dots)

        # ── TEXTO SUBTÍTULO (siempre al fondo) ───────────────────────────────
        sub_txt = Text("", font="Georgia", font_size=26, color=WHITE)
        sub_txt.move_to(np.array([0, -3.5, 0]))
        self.add(sub_txt)

        # ── FIRMA (aparece al final) ──────────────────────────────────────────
        firma_txt = Text(
            "Tu Bebé 💚", font="Great Vibes", font_size=56, color=FIRMA_COLOR
        )
        firma_txt.move_to(np.array([0, 0.4, 0]))
        firma_txt.set_opacity(0)
        self.add(firma_txt)

        # ── TRACKER DE TIEMPO ─────────────────────────────────────────────────
        t_tracker = ValueTracker(0)

        # ── UPDATERS ─────────────────────────────────────────────────────────

        # Estado de la animación
        state = {
            "gal_visible": False,
            "gal_dots_added": False,
            "sub_idx": -1,
            "firma_shown": False,
        }

        # Estrellas parpadeantes
        def update_stars(mob, dt):
            t = t_tracker.get_value()
            for i, s in enumerate(mob):
                f = 0.5 + 0.5 * np.sin(t * (0.8 + i * 0.03) + i * 1.7)
                s.set_opacity(f * (0.15 + (i % 5) * 0.06))

        stars.add_updater(update_stars)

        # Galaxia girando suavemente
        def update_gal(mob, dt):
            t = t_tracker.get_value()
            prog = ease_in_out(t / GALAXY_FORM_END)
            # Rotar muy suavemente
            mob.rotate(dt * 0.08, axis=OUT, about_point=GAL_POS)
            # Opacidad: aparece en los primeros 20s
            for i, d in enumerate(mob):
                base_op = 0.55 + 0.35 * np.sin(t * 0.4 + i * 0.5)
                d.set_opacity(base_op * prog)

        gal_dots.add_updater(update_gal)

        # Corazón: migración y latido
        def update_heart(mob, dt):
            t = t_tracker.get_value()

            # Fase: galaxia → corazón
            migrate_prog = ease_in_out((t - HEART_START) / (HEART_FULL - HEART_START))
            migrate_prog = np.clip(migrate_prog, 0, 1)

            # Latido (solo cuando está formado)
            beat_phase = t * 1.1 * TAU  # ~66 bpm
            beat = 1 + np.sin(beat_phase) * 0.032 * min(migrate_prog * 3, 1)

            # Descomposición hacia firma
            firma_prog = ease_in_out((t - FIRMA_START) / (FIRMA_FULL - FIRMA_START))
            firma_prog = np.clip(firma_prog, 0, 1)

            for i, d in enumerate(mob):
                origin = g_origins[i]
                target = h_pts[i % len(h_pts)]

                # Pos interpolada galaxia → corazón → dispersión firma
                if firma_prog > 0:
                    # Las partículas se dispersan aleatoriamente
                    rng = np.array([np.sin(i * 2.7) * 6, np.cos(i * 1.9) * 4, 0])
                    pos = lerp(target, rng, firma_prog)
                else:
                    pos = lerp(origin, target, migrate_prog)

                # Aplicar latido desde el centro del corazón
                if migrate_prog > 0.3 and firma_prog == 0:
                    delta = pos - HEART_POS
                    pos = HEART_POS + delta * beat

                d.move_to(pos)

                # Opacidad y color
                if migrate_prog < 0.01:
                    d.set_opacity(0)
                else:
                    # Color: azul-galaxia → rojo-corazón
                    t_col = i / len(mob)
                    gcol = galaxy_color(i, len(mob))
                    hcol = heart_color(i, len(mob))

                    # Interpolación de color via opacidad y fill
                    r_g, g_g, b_g = 0.5, 0.6, 1.0
                    r_h = 0.55 + t_col * 0.3
                    g_h = 0.02 + t_col * 0.1
                    b_h = 0.05 + t_col * 0.13

                    r = lerp(r_g, r_h, migrate_prog)
                    g = lerp(g_g, g_h, migrate_prog)
                    b = lerp(b_g, b_h, migrate_prog)

                    if firma_prog > 0:
                        # Hacia verde para la firma
                        r = lerp(r, 0.1, firma_prog)
                        g = lerp(g, 0.9, firma_prog)
                        b = lerp(b, 0.3, firma_prog)

                    d.set_color(
                        ManimColor.from_rgb(
                            (
                                np.clip(r, 0, 1),
                                np.clip(g, 0, 1),
                                np.clip(b, 0, 1),
                            )
                        )
                    )

                    twinkle = 0.65 + 0.35 * np.sin(t * (0.5 + i * 0.02) + i)
                    op = twinkle * migrate_prog * (1 - firma_prog * 0.8)
                    d.set_opacity(np.clip(op, 0, 1))

        heart_dots.add_updater(update_heart)

        # Subtítulos sincronizados
        def update_sub(mob, dt):
            t = t_tracker.get_value()
            fi = -1
            for i, f in enumerate(FRASES):
                if f["start"] <= t <= f["end"]:
                    fi = i
                    break

            if fi == -1:
                mob.set_opacity(0)
                return

            f = FRASES[fi]
            # Fade in/out suave
            fade = 0.4
            if t < f["start"] + fade:
                alpha = (t - f["start"]) / fade
            elif t > f["end"] - fade:
                alpha = (f["end"] - t) / fade
            else:
                alpha = 1.0

            alpha = np.clip(alpha, 0, 1)

            if state["sub_idx"] != fi:
                state["sub_idx"] = fi
                mob.become(
                    Text(
                        f["txt"], font="Great Vibes", font_size=30, color=WHITE
                    ).move_to(np.array([0, -3.4, 0]))
                )

            mob.set_opacity(alpha)

        sub_txt.add_updater(update_sub)

        # Firma
        def update_firma(mob, dt):
            t = t_tracker.get_value()
            firma_prog = ease_in_out((t - FIRMA_START) / (FIRMA_FULL - FIRMA_START))
            firma_prog = np.clip(firma_prog, 0, 1)

            if firma_prog > 0:
                # Pulso suave
                pulse = 1 + np.sin(t * 1.5) * 0.015 * firma_prog
                mob.set_opacity(firma_prog)
                mob.set_color(FIRMA_COLOR)
            else:
                mob.set_opacity(0)

        firma_txt.add_updater(update_firma)

        # ── AÑADIR GALAXIA ────────────────────────────────────────────────────
        self.add(gal_dots)

        # ── PLAY — avanzar el tracker de tiempo ──────────────────────────────
        # Dividimos en bloques para no hacer un wait() único de 292s
        # Manim procesa updaters cada frame mientras corre la animación
        self.play(
            t_tracker.animate.set_value(TOTAL_DURATION),
            rate_func=linear,
            run_time=TOTAL_DURATION,
        )

    # ── HELPERS DE ESCENA ────────────────────────────────────────────────────

    def _crear_estrellas(self, n):
        rng_seed(3)
        stars = VGroup()
        for i in range(n):
            x = random.uniform(-CAMERA_W / 2 + 0.3, CAMERA_W / 2 - 0.3)
            y = random.uniform(-CAMERA_H / 2 + 0.3, CAMERA_H / 2 - 0.3)
            r = random.uniform(0.008, 0.025)
            brightness = random.uniform(0.08, 0.7)
            d = Dot(point=np.array([x, y, 0]), radius=r)
            d.set_color(WHITE)
            d.set_opacity(brightness)
            stars.add(d)
        return stars

    def _crear_dots(self, pts, color_fn, r_min=0.01, r_max=0.03):
        grp = VGroup()
        n = len(pts)
        for i, p in enumerate(pts):
            r = random.uniform(r_min, r_max)
            d = Dot(point=p, radius=r)
            d.set_color(color_fn(i, n))
            d.set_opacity(0)
            grp.add(d)
        return grp
