"""
pluma.py — Animación placeholder para verificar el pipeline

Por ahora solo muestra un texto en pantalla para confirmar
que Manim renderiza correctamente. La animación real va aquí después.
"""

from manim import *

class Animacion(Scene):
    def construct(self):
        # Fondo negro
        self.camera.background_color = "#000205"

        # Texto de prueba
        titulo = Text(
            "Antología de Tus Ojos",
            font_size=48,
            color=WHITE,
            font="Georgia"
        ).set_opacity(0)

        subtitulo = Text(
            "Pipeline funcionando ✓",
            font_size=24,
            color="#80d8f5",
        ).next_to(titulo, DOWN, buff=0.5).set_opacity(0)

        self.add(titulo, subtitulo)

        # Fade in
        self.play(
            titulo.animate.set_opacity(1),
            run_time=2,
            rate_func=smooth
        )
        self.play(
            subtitulo.animate.set_opacity(1),
            run_time=1.5,
            rate_func=smooth
        )

        self.wait(2)

        # Fade out
        self.play(
            FadeOut(titulo),
            FadeOut(subtitulo),
            run_time=1.5
        )

        self.wait(0.5)
