from manim import *
import manimpango

# Forzamos el registro
manimpango.register_font("./GreatVibes-Regular.ttf")

class Prueba(Scene):
    def construct(self):
        # Probamos ambos textos
        texto_1 = Text("Tu Bebé 💚", font="Great Vibes", font_size=60, color=GREEN)
        texto_2 = Text("Texto de prueba con Great Vibes", font="Great Vibes", font_size=40).next_to(texto_1, DOWN)
        
        self.add(texto_1, texto_2)
        self.wait(2)