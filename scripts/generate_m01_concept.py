"""Genera la ilustración conceptual m01_concept.jpg en alta resolución.
Tema: Gestión de correspondencia y triaje administrativo en el SENA.
Paleta: Salvia (#225746, #d5edaa, #edf3e8).
Herramientas: Matplotlib y PIL.
"""

from pathlib import Path
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MEDIA_DIR = ROOT / "media"
MEDIA_DIR.mkdir(exist_ok=True)

# Paleta salvia institucional y tonos armónicos
COLOR_BG = "#edf3e8"
COLOR_CARD = "#ffffff"
COLOR_HEADER_BG = "#ffffff"
COLOR_SAGE_DARK = "#225746"
COLOR_SAGE_LIGHT = "#d5edaa"
COLOR_SAGE_ACCENT = "#153e38"
COLOR_BORDER = "#cfddc6"
COLOR_TEXT_MAIN = "#0f172a"
COLOR_TEXT_MUTED = "#4a5a51"

COLOR_BLUE_BADGE_BG = "#eff6ff"
COLOR_BLUE_BORDER = "#1d4ed8"
COLOR_BLUE_TEXT = "#1d4ed8"

COLOR_GREEN_BADGE_BG = "#f0fdf4"
COLOR_GREEN_BORDER = "#16a34a"
COLOR_GREEN_TEXT = "#15803d"

COLOR_AMBER_BADGE_BG = "#fffbeb"
COLOR_AMBER_BORDER = "#d97706"
COLOR_AMBER_TEXT = "#b45309"


def generate_m01_concept():
    """Genera la infografía conceptual de triaje administrativo y correspondencia."""
    fig = plt.figure(figsize=(17.92, 10.24), dpi=100)
    fig.patch.set_facecolor(COLOR_BG)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_facecolor(COLOR_BG)
    ax.axis("off")

    # ==========================================
    # ENCABEZADO INSTITUCIONAL SUPERIOR
    # ==========================================
    header_patch = patches.FancyBboxPatch(
        (0.035, 0.875), 0.93, 0.095,
        boxstyle="round,pad=0.012,rounding_size=0.02",
        facecolor=COLOR_HEADER_BG, edgecolor=COLOR_BORDER, linewidth=1.8
    )
    ax.add_patch(header_patch)

    header_accent = patches.FancyBboxPatch(
        (0.035, 0.875), 0.008, 0.095,
        boxstyle="round,pad=0.002,rounding_size=0.005",
        facecolor=COLOR_SAGE_DARK, edgecolor=COLOR_SAGE_DARK, linewidth=1
    )
    ax.add_patch(header_accent)

    ax.text(0.055, 0.938, "SENA · GESTIÓN DOCUMENTAL Y CORRESPONDENCIA ADMINISTRATIVA",
            fontsize=13.5, fontweight="bold", color=COLOR_SAGE_DARK, family="sans-serif")
    ax.text(0.055, 0.898, "Triaje Administrativo en Sede: Reglas Deterministas, Redacción Asistida con IA y Juicio Humano Exclusivo",
            fontsize=10.5, color=COLOR_TEXT_MUTED, family="sans-serif")

    badge_sede = patches.FancyBboxPatch(
        (0.735, 0.895), 0.215, 0.055,
        boxstyle="round,pad=0.008,rounding_size=0.015",
        facecolor=COLOR_SAGE_LIGHT, edgecolor=COLOR_SAGE_DARK, linewidth=1.2
    )
    ax.add_patch(badge_sede)
    ax.text(0.842, 0.922, "Ventanilla Única de Radicación (es-CO)",
            fontsize=9.5, fontweight="bold", color=COLOR_SAGE_DARK, ha="center", va="center", family="sans-serif")

    # ==========================================
    # TRES COLUMNAS PRINCIPALES DE TRIAJE
    # ==========================================
    cards_data = [
        {
            "x": 0.035,
            "badge_title": "VÍA 1 · REGLA EXACTA DETERMINISTA",
            "badge_bg": COLOR_GREEN_BADGE_BG,
            "badge_border": COLOR_GREEN_BORDER,
            "badge_color": COLOR_GREEN_TEXT,
            "icon_title": "Cálculos, Fechas y Condiciones Explícitas",
            "sub_flow": "Entrada de Trámite  →  Regla Numérica  →  Salida Inmutable",
            "items": [
                ("Radicación Oficial:", "Asignación automática de consecutivo, fecha y hora."),
                ("Términos Legales (Ley 1755):", "10 días (documentos), 15 días (petición), 30 (consultas)."),
                ("Validación de Requisitos:", "Alerta de folios faltantes, remitente anónimo o sin correo."),
                ("Competencia de Área:", "Enrutamiento automático según el manual de funciones.")
            ],
            "rule_line1": "★ Criterio determinista: La misma entrada",
            "rule_line2": "produce siempre la misma salida sin ambigüedad.",
            "rule_color": COLOR_GREEN_TEXT
        },
        {
            "x": 0.355,
            "badge_title": "VÍA 2 · ASISTENCIA CON INTELIGENCIA ARTIFICIAL",
            "badge_bg": COLOR_BLUE_BADGE_BG,
            "badge_border": COLOR_BLUE_BORDER,
            "badge_color": COLOR_BLUE_TEXT,
            "icon_title": "Comprensión Semántica y Borrador Institucional",
            "sub_flow": "Petición Ciudadana  →  Modelo CRTT  →  Borrador para Cotejo",
            "items": [
                ("Extracción de Hechos:", "Identifica qué pide la persona frente a lo que relata."),
                ("Blindaje de Encargo (CRTT):", "Contexto, Rol, Tarea, Tono respetuoso y Límites estrictos."),
                ("Detección de Vacíos:", "Preguntas sugeridas sobre datos pendientes sin inventar."),
                ("Lenguaje Claro Institucional:", "Redacción directa, cordial y accesible en español de Colombia.")
            ],
            "rule_line1": "★ Criterio de asistencia: La IA propone un borrador;",
            "rule_line2": "no califica derechos ni envía comunicaciones oficiales.",
            "rule_color": COLOR_BLUE_TEXT
        },
        {
            "x": 0.675,
            "badge_title": "VÍA 3 · JUICIO HUMANO EXCLUSIVO (HITL)",
            "badge_bg": COLOR_AMBER_BADGE_BG,
            "badge_border": COLOR_AMBER_BORDER,
            "badge_color": COLOR_AMBER_TEXT,
            "icon_title": "Supervisión Jurídica y Autorización Final",
            "sub_flow": "Expediente Oficial  →  Contraste en Fuente  →  Firma y Decisión",
            "items": [
                ("Verificación en Fuentes:", "Contraste en carpetas físicas, libros radicadores y SOFIA."),
                ("Protección de Datos (Ley 1581):", "Reserva de identidades, historias y datos de salud."),
                ("Valoración de Excepciones:", "Atención de urgencias, fuerza mayor o conflictos de área."),
                ("Firma y Notificación:", "Responsabilidad ética, administrativa y jurídica del servidor.")
            ],
            "rule_line1": "★ Criterio humano: La firma y la decisión final",
            "rule_line2": "son indelegables de la persona servidora pública.",
            "rule_color": COLOR_AMBER_TEXT
        }
    ]

    card_width = 0.29
    card_height = 0.61
    card_y = 0.24

    for col in cards_data:
        x = col["x"]

        # Tarjeta contenedora
        card = patches.FancyBboxPatch(
            (x, card_y), card_width, card_height,
            boxstyle="round,pad=0.012,rounding_size=0.02",
            facecolor=COLOR_CARD, edgecolor=COLOR_BORDER, linewidth=1.5
        )
        ax.add_patch(card)

        # Badge superior de la vía
        badge = patches.FancyBboxPatch(
            (x + 0.015, card_y + card_height - 0.062), card_width - 0.03, 0.046,
            boxstyle="round,pad=0.008,rounding_size=0.012",
            facecolor=col["badge_bg"], edgecolor=col["badge_border"], linewidth=1.2
        )
        ax.add_patch(badge)
        ax.text(x + card_width / 2, card_y + card_height - 0.039, col["badge_title"],
                fontsize=9.8, fontweight="bold", color=col["badge_color"], ha="center", va="center", family="sans-serif")

        # Título de la vía
        ax.text(x + 0.018, card_y + card_height - 0.098, col["icon_title"],
                fontsize=11.5, fontweight="bold", color=COLOR_TEXT_MAIN, family="sans-serif")

        # Flujo miniatura interno
        flow_box = patches.FancyBboxPatch(
            (x + 0.015, card_y + card_height - 0.155), card_width - 0.03, 0.042,
            boxstyle="round,pad=0.006,rounding_size=0.008",
            facecolor="#f8faf6", edgecolor="#dce5d6", linewidth=1.0
        )
        ax.add_patch(flow_box)
        ax.text(x + card_width / 2, card_y + card_height - 0.134, col["sub_flow"],
                fontsize=8.6, fontweight="bold", color=COLOR_SAGE_DARK, ha="center", va="center", family="sans-serif")

        # Puntos clave
        y_text = card_y + card_height - 0.198
        for title, desc in col["items"]:
            ax.text(x + 0.018, y_text, f"• {title}",
                    fontsize=9.6, fontweight="bold", color=COLOR_TEXT_MAIN, family="sans-serif")
            y_text -= 0.032
            ax.text(x + 0.028, y_text, desc,
                    fontsize=8.9, color=COLOR_TEXT_MUTED, family="sans-serif")
            y_text -= 0.052

        # Caja de regla de oro al pie de la tarjeta con dos líneas limpias sin cortar palabras
        rule_box = patches.FancyBboxPatch(
            (x + 0.015, card_y + 0.02), card_width - 0.03, 0.075,
            boxstyle="round,pad=0.008,rounding_size=0.01",
            facecolor="#fcfdfa", edgecolor=col["badge_border"], linewidth=1.0, linestyle="--"
        )
        ax.add_patch(rule_box)
        ax.text(x + card_width / 2, card_y + 0.068, col["rule_line1"],
                fontsize=8.8, fontweight="bold", color=col["rule_color"], ha="center", family="sans-serif")
        ax.text(x + card_width / 2, card_y + 0.038, col["rule_line2"],
                fontsize=8.6, color=COLOR_TEXT_MAIN, ha="center", family="sans-serif")

    # ==========================================
    # BANNER TRANSVERSAL INFERIOR (CICLO DE ATENCIÓN)
    # ==========================================
    bottom_y = 0.035
    bottom_height = 0.17
    bottom_patch = patches.FancyBboxPatch(
        (0.035, bottom_y), 0.93, bottom_height,
        boxstyle="round,pad=0.012,rounding_size=0.02",
        facecolor=COLOR_HEADER_BG, edgecolor=COLOR_BORDER, linewidth=1.5
    )
    ax.add_patch(bottom_patch)

    ax.text(0.055, bottom_y + bottom_height - 0.035, "CICLO DE TRAZABILIDAD Y ATENCIÓN EN VENTANILLA DE CORRESPONDENCIA",
            fontsize=10.8, fontweight="bold", color=COLOR_SAGE_DARK, family="sans-serif")

    etapas = [
        ("01 · Radicación", "Recepción física o digital y consecutivo oficial"),
        ("02 · Triaje", "Separación según necesidad: regla, IA o juicio"),
        ("03 · Elaboración", "Cálculo de términos y redacción con modelo CRTT"),
        ("04 · Aprobación", "Contraste con expediente y firma responsable")
    ]

    step_w = 0.198
    step_gap = 0.038
    step_start_x = 0.055

    for i, (e_title, e_desc) in enumerate(etapas):
        sx = step_start_x + i * (step_w + step_gap)
        s_box = patches.FancyBboxPatch(
            (sx, bottom_y + 0.025), step_w, 0.082,
            boxstyle="round,pad=0.006,rounding_size=0.01",
            facecolor="#f6f9f3", edgecolor="#d5e2cf", linewidth=1.1
        )
        ax.add_patch(s_box)
        ax.text(sx + 0.012, bottom_y + 0.082, e_title,
                fontsize=9.4, fontweight="bold", color=COLOR_SAGE_DARK, family="sans-serif")
        ax.text(sx + 0.012, bottom_y + 0.048, e_desc,
                fontsize=7.8, color=COLOR_TEXT_MUTED, family="sans-serif")

        if i < len(etapas) - 1:
            ax.text(sx + step_w + step_gap / 2, bottom_y + 0.065, "→",
                    fontsize=14, fontweight="bold", color="#79945b", ha="center", va="center", family="sans-serif")

    temp_path = MEDIA_DIR / "m01_concept_temp.png"
    target_path = MEDIA_DIR / "m01_concept.jpg"

    plt.savefig(temp_path, dpi=100, facecolor=COLOR_BG, bbox_inches="tight")
    plt.close()

    with Image.open(temp_path) as img:
        img_resized = img.resize((1792, 1024), Image.Resampling.LANCZOS)
        img_rgb = img_resized.convert("RGB")
        img_rgb.save(target_path, "JPEG", quality=92, optimize=True, progressive=True)

    temp_path.unlink(missing_ok=True)
    print(f"Generado exitosamente {target_path} (1792x1024 px)")


if __name__ == "__main__":
    generate_m01_concept()
