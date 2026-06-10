"""
destinocasualidad.py — Animación Manim 9:16 (1080×1920)
Dos galaxias nebulosas que colisionan y forman dos corazones entrelazados
Duración total: 258 segundos — "Destino o Casualidad" de Melendi

Frame Manim en 9:16: 8.0 ancho × 14.2 alto

Previsualización:
    python -m manim animaciones/destinocasualidad/destinocasualidad.py Animacion -ql --preview

Pipeline completo:
    python pipeline.py --animacion destinocasualidad
"""

from manim import *
import numpy as np

# Forzar resolución 9:16 independientemente del renderer
config.pixel_width  = 1080
config.pixel_height = 1920
config.frame_width  = 8.0
config.frame_height = 14.2

# ── PALETA NEBULOSA ──────────────────────────────────────────────────────────
COL_PURPURA     = ManimColor("#9B59B6")
COL_PURPURA_OSC = ManimColor("#6C3483")
COL_ROSA        = ManimColor("#E91E8C")
COL_ROSA_CLARO  = ManimColor("#FF6EC7")
COL_AZUL_PROF   = ManimColor("#1A237E")
COL_AZUL        = ManimColor("#3F51B5")
COL_TURQUESA    = ManimColor("#00BCD4")
COL_TURQUESA_CL = ManimColor("#80DEEA")
COL_DORADO      = ManimColor("#FFD700")
COL_NARANJA     = ManimColor("#FF6F00")
COL_BLANCO_AZUl = ManimColor("#E8EAF6")
COL_FONDO       = ManimColor("#020008")

# ── POEMA (7 párrafos) ───────────────────────────────────────────────────────
PARRAFOS = [
    "El espacio, el tiempo, la realidad misma…\n¿qué es real?, ¿qué no lo es?\nTodo forma un mundo único para cada persona.\nEsa realidad cambió cuando el rayo más brillante\nde la estrella más brillante abordó mi mundo.",

    "Siempre creí que el amor no era más que una ilusión.\nLo sé, suena frío y apático.\nPero, como suele actuar la vida,\nme regaló una bofetada de realidad contigo.\nLlegaste como un aluvión que trastocó todo.",

    "Primero hubo un periodo en el que solo tu presencia\nme desestabilizaba; no de mala manera,\nsolo me desconcertabas, me atraías más y más.\nPoco a poco te hiciste un hueco en mi corazón,\nnada más que por ser tú, infinitamente hermosa.",

    "Luego me abriste una pequeña puerta a tu mundo,\ny eso se sintió como un regalo enviado por los astros.\nEse pequeño atajo a tu realidad significó\nuna inconmensurable confianza\nque sabía no recaía en cualquiera.",

    "Tras todo esto llegó el momento en que\nentendiste lo que pasaba por mi mente;\ntomaste la iniciativa y recibí\nel beso más maravilloso de la mujer\nque yo ya veía con otros ojos.",

    "Meses de recuerdos y experiencias se fueron acumulando,\ny hoy te puedo decir que no me arrepiento de nada;\nde hecho, cada día tengo más ganas de ti.\nTu presencia me complementa, mi alma entra en armonía,\ny siento que ese es el lugar donde quiero estar.",

    "Mi amor, nada me hace más feliz que ver,\npoco a poco, cómo correspondes\na lo que mi mente y mi corazón sienten por ti.\n\n— Tu bebé, que siempre busca cómo demostrar\nlo que provocas en él ✦",
]

# ── CONFIGURACIÓN ─────────────────────────────────────────────────────────────
FPS          = 30
TOTAL_SEG    = 258
N_PARTICULAS = 600

# Tiempos en segundos
T_CAOS_FIN     = 25
T_GALAXIAS_FIN = 70
T_ORBITA_FIN   = 120
T_COLISION_FIN = 140
T_FINAL_FIN    = 258

T_TEXTO_INICIO = 80
T_TEXTO_FIN    = 250

# ── COORDENADAS 9:16 ─────────────────────────────────────────────────────────
# Frame: 8.0 ancho × 14.2 alto
# Galaxia izquierda: arriba-izquierda
# Galaxia derecha:   abajo-derecha
# Corazones: centro de la pantalla
CX_IZQ   = np.array([-1.6,  3.2, 0])
CX_DER   = np.array([ 1.6, -3.2, 0])
RADIO_GAL = 1.8   # Radio galaxia (cabe en ancho de 8 unidades)


def nebula_color(t: float, galaxia: int) -> ManimColor:
    if galaxia == 0:
        colores = [COL_PURPURA_OSC, COL_AZUL_PROF, COL_PURPURA,
                   COL_AZUL, COL_TURQUESA, COL_BLANCO_AZUl]
    else:
        colores = [COL_ROSA, COL_NARANJA, COL_ROSA_CLARO,
                   COL_DORADO, COL_PURPURA, COL_BLANCO_AZUl]
    t = max(0.0, min(1.0, t))
    idx = int(t * (len(colores) - 1))
    idx = min(idx, len(colores) - 2)
    sub_t = t * (len(colores) - 1) - idx
    return interpolate_color(colores[idx], colores[idx + 1], sub_t)


def pos_galaxia_espiral(i: int, n: int, centro: np.ndarray,
                        radio: float, rotacion: float, seed: int) -> np.ndarray:
    rng    = np.random.default_rng(seed + i)
    brazo  = i % 3
    t_b    = (i / n) ** 0.6
    angulo = t_b * TAU * 2.2 + brazo * TAU / 3 + rotacion
    r      = t_b * radio + rng.uniform(-0.06, 0.06) * radio
    disp   = rng.uniform(-0.03, 0.03) * radio
    x = centro[0] + r * np.cos(angulo) + disp
    y = centro[1] + r * np.sin(angulo) * 0.45 + disp
    return np.array([x, y, 0])


def pos_corazones_entrelazados(i: int, n: int) -> np.ndarray:
    """
    Dos corazones paramétricos entrelazados en el centro.
    En 9:16 los desplazamos ligeramente en Y para centrar mejor.
    """
    mitad = n // 2
    lado  = 0 if i < mitad else 1
    j     = i if lado == 0 else i - mitad
    t     = (j / max(mitad - 1, 1)) * TAU
    hx    =  16 * np.sin(t) ** 3
    hy    =  13 * np.cos(t) - 5 * np.cos(2*t) - 2 * np.cos(3*t) - np.cos(4*t)
    escala   = 0.048
    desplaz_x = -0.65 if lado == 0 else 0.65
    desplaz_y =  0.3  if lado == 0 else -0.3
    return np.array([
        hx * escala + desplaz_x,
        hy * escala * 0.85 + desplaz_y,
        0
    ])


class Animacion(Scene):

    def construct(self):
        self.camera.background_color = COL_FONDO

        rng = np.random.default_rng(42)
        n   = N_PARTICULAS
        n2  = n // 2

        # Posiciones caóticas iniciales — distribuidas en todo el frame 9:16
        pos_caos = [
            np.array([rng.uniform(-3.8, 3.8), rng.uniform(-6.8, 6.8), 0])
            for _ in range(n)
        ]

        colores_init = [
            nebula_color(rng.random(), int(rng.integers(0, 2)))
            for _ in range(n)
        ]

        dots = VGroup(*[
            Dot(pos_caos[i], radius=0.025, color=colores_init[i]).set_opacity(0)
            for i in range(n)
        ])
        self.add(dots)

        # Texto del poema — posicionado en el tercio inferior
        texto_mob = Text(
            "",
            font="Georgia",
            font_size=20,
            color=COL_BLANCO_AZUl,
            line_spacing=1.5,
        ).shift(DOWN * 4.5)
        self.add(texto_mob)
        texto_mob.set_opacity(0)

        # Título final — parte superior
        titulo_final = Text(
            "Destino o Casualidad",
            font="Georgia",
            font_size=30,
            color=COL_BLANCO_AZUl,
        ).shift(UP * 6.0).set_opacity(0)
        self.add(titulo_final)

        # Pre-calcular posiciones objetivo
        pos_gal_izq = [
            pos_galaxia_espiral(i, n2, CX_IZQ, RADIO_GAL, 0.0, seed=0)
            for i in range(n2)
        ]
        pos_gal_der = [
            pos_galaxia_espiral(i, n2, CX_DER, RADIO_GAL, PI, seed=100)
            for i in range(n2)
        ]
        pos_corazones = [
            pos_corazones_entrelazados(i, n)
            for i in range(n)
        ]

        parrafo_actual = [-1]

        def update_escena(mob, dt):
            if not hasattr(self, '_t_counter'):
                self._t_counter = 0.0
            self._t_counter += dt
            t = min(self._t_counter, TOTAL_SEG)

            for i, dot in enumerate(mob):
                lado = 0 if i < n2 else 1
                j    = i if lado == 0 else i - n2

                # ── Fase 1: Caos (0–25s) ──────────────────────────────────
                if t <= T_CAOS_FIN:
                    prog  = t / T_CAOS_FIN
                    op    = min(prog * 3, 1.0)
                    angle = rng.uniform(0, TAU) + t * rng.uniform(0.08, 0.4)
                    offset = np.array([
                        0.08 * np.sin(angle + i * 0.3),
                        0.08 * np.cos(angle + i * 0.2),
                        0
                    ])
                    dot.move_to(pos_caos[i] + offset)
                    dot.set_opacity(op * 0.7)
                    dot.set_color(nebula_color(
                        abs(np.sin(t * 0.3 + i * 0.1)), lado
                    ))

                # ── Fase 2: Formación galaxias (25–70s) ───────────────────
                elif t <= T_GALAXIAS_FIN:
                    prog     = (t - T_CAOS_FIN) / (T_GALAXIAS_FIN - T_CAOS_FIN)
                    prog     = smooth(prog)
                    tgt      = pos_gal_izq[j] if lado == 0 else pos_gal_der[j]
                    src      = pos_caos[i]
                    pos      = interpolate(src, tgt, prog)
                    ang_rot  = prog * 0.8 * (1 if lado == 0 else -1)
                    centro   = CX_IZQ if lado == 0 else CX_DER
                    rel      = pos - centro
                    cos_r, sin_r = np.cos(ang_rot), np.sin(ang_rot)
                    rel_rot  = np.array([
                        rel[0] * cos_r - rel[1] * sin_r,
                        rel[0] * sin_r + rel[1] * cos_r,
                        0
                    ])
                    dot.move_to(centro + rel_rot)
                    dot.set_opacity(0.55 + prog * 0.35)
                    dot.set_color(nebula_color(
                        min((j / n2) * 0.8 + prog * 0.2, 1.0), lado
                    ))

                # ── Fase 3: Órbita y acercamiento (70–120s) ───────────────
                elif t <= T_ORBITA_FIN:
                    prog       = (t - T_GALAXIAS_FIN) / (T_ORBITA_FIN - T_GALAXIAS_FIN)
                    prog_s     = smooth(prog)
                    # Acercar centros hacia el origen
                    sep_x      = 1.6 * (1 - prog_s * 0.85)
                    sep_y      = 3.2 * (1 - prog_s * 0.85)
                    c_izq      = np.array([-sep_x,  sep_y, 0])
                    c_der      = np.array([ sep_x, -sep_y, 0])
                    centro     = c_izq if lado == 0 else c_der
                    rot_vel    = 0.22
                    ang_rot    = (t - T_GALAXIAS_FIN) * rot_vel * (1 if lado == 0 else -1)
                    base_pos   = pos_gal_izq[j] if lado == 0 else pos_gal_der[j]
                    orig_cen   = CX_IZQ if lado == 0 else CX_DER
                    rel        = base_pos - orig_cen
                    cos_r, sin_r = np.cos(ang_rot), np.sin(ang_rot)
                    rel_rot    = np.array([
                        rel[0] * cos_r - rel[1] * sin_r,
                        rel[0] * sin_r + rel[1] * cos_r,
                        0
                    ])
                    dot.move_to(centro + rel_rot)
                    dot.set_opacity(0.75)
                    dot.set_color(nebula_color(min((j / n2) * 0.9, 1.0), lado))

                    if t >= T_TEXTO_INICIO:
                        texto_mob.set_opacity(
                            min((t - T_TEXTO_INICIO) / 3.0, 0.85)
                        )
                        self._actualizar_parrafo(t, texto_mob, parrafo_actual)

                # ── Fase 4: Colisión (120–140s) ───────────────────────────
                elif t <= T_COLISION_FIN:
                    prog          = (t - T_ORBITA_FIN) / (T_COLISION_FIN - T_ORBITA_FIN)
                    explosion_dir = rng.uniform(0, TAU)
                    explosion_r   = prog * rng.uniform(2.0, 5.5)
                    caos_x = explosion_r * np.cos(explosion_dir + i * 0.07)
                    caos_y = explosion_r * np.sin(explosion_dir + i * 0.07) * 0.65
                    pos_exp    = np.array([caos_x, caos_y, 0])
                    tgt        = pos_corazones[i]
                    pos_final  = interpolate(
                        pos_exp, tgt, smooth(max(0.0, prog - 0.5) * 2)
                    )
                    dot.move_to(pos_final)
                    frac_dorado = abs(np.sin(prog * PI))
                    color_col   = interpolate_color(
                        nebula_color(min(j / n2, 1.0), lado),
                        COL_DORADO,
                        frac_dorado * 0.7
                    )
                    dot.set_color(color_col)
                    dot.set_opacity(0.5 + frac_dorado * 0.45)

                    texto_mob.set_opacity(0.5)
                    self._actualizar_parrafo(t, texto_mob, parrafo_actual)

                # ── Fase 5: Corazones entrelazados (140–258s) ─────────────
                else:
                    prog     = min(
                        (t - T_COLISION_FIN) / (T_FINAL_FIN - T_COLISION_FIN), 1.0
                    )
                    ang_rot  = prog * 0.35
                    base_pos = pos_corazones[i]
                    cos_r, sin_r = np.cos(ang_rot), np.sin(ang_rot)
                    rel_rot  = np.array([
                        base_pos[0] * cos_r - base_pos[1] * sin_r,
                        base_pos[0] * sin_r + base_pos[1] * cos_r,
                        0
                    ])
                    parpadeo = 1 + 0.045 * np.sin(t * 2.1 + i * 0.3)
                    dot.move_to(rel_rot * parpadeo)
                    dot.set_color(nebula_color(
                        abs(np.sin((i / n) * 0.9 + t * 0.12)),
                        lado
                    ))
                    dot.set_opacity(0.65 + 0.3 * abs(np.sin(t * 1.8 + i * 0.25)))

                    if t <= T_TEXTO_FIN:
                        texto_mob.set_opacity(0.88)
                        self._actualizar_parrafo(t, texto_mob, parrafo_actual)
                    else:
                        fade_out = max(0.0, 1 - (t - T_TEXTO_FIN) / 4)
                        texto_mob.set_opacity(fade_out * 0.88)
                        titulo_final.set_opacity(
                            min((t - T_TEXTO_FIN) / 4, 0.8)
                        )

        dots.add_updater(update_escena)
        self.wait(TOTAL_SEG)
        dots.remove_updater(update_escena)

    def _actualizar_parrafo(self, t: float, mob: Mobject, parrafo_actual: list):
        dur_total   = T_TEXTO_FIN - T_TEXTO_INICIO
        dur_parrafo = dur_total / len(PARRAFOS)
        idx = int((t - T_TEXTO_INICIO) / dur_parrafo)
        idx = max(0, min(idx, len(PARRAFOS) - 1))

        if idx == parrafo_actual[0]:
            return

        parrafo_actual[0] = idx
        nuevo = Text(
            PARRAFOS[idx],
            font="Georgia",
            font_size=20,
            color=COL_BLANCO_AZUl,
            line_spacing=1.6,
        ).shift(DOWN * 4.5)
        mob.become(nuevo)


if __name__ == "__main__":
    print("✓ destinocasualidad.py cargado — formato 9:16 (1080×1920)")
    print(f"  Partículas: {N_PARTICULAS}")
    print(f"  Duración:   {TOTAL_SEG}s ({TOTAL_SEG//60}:{TOTAL_SEG%60:02d})")
    print(f"  Frame:      8.0 × 14.2 unidades (portrait)")
    print()
    print("Previsualización:")
    print("  python -m manim animaciones/destinocasualidad/destinocasualidad.py Animacion -ql --preview")