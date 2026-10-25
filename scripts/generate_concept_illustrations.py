"""Genera ilustraciones conceptuales en alta resolución para los módulos.
Estilo visual: infografía moderna, tarjetas con bordes redondeados, paleta corporativa elegante.
"""

from pathlib import Path
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from concept_illustrations_m04_m05 import (
    create_m04_illustration,
    create_m05_illustration,
)
from generate_m01_concept import generate_m01_concept as create_m01_illustration

ROOT = Path(__file__).resolve().parents[1]
MEDIA_DIR = ROOT / "media"
MEDIA_DIR.mkdir(exist_ok=True)

# Paleta corporativa armónica
BG_COLOR = "#f8fafc"
CARD_BG = "#ffffff"
PRIMARY_NAVY = "#0f172a"
ACCENT_BLUE = "#1d4ed8"
ACCENT_TEAL = "#0d9488"
ACCENT_AMBER = "#d97706"
ACCENT_RED = "#dc2626"
ACCENT_GREEN = "#16a34a"
TEXT_MUTED = "#64748b"
BORDER_COLOR = "#e2e8f0"


def create_m00_illustration():
    """Genera ilustración conceptual para Módulo 00: Preparación y Primer Contacto."""
    fig = plt.figure(figsize=(10.24, 10.24), dpi=100)
    fig.patch.set_facecolor(BG_COLOR)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_facecolor(BG_COLOR)
    ax.axis("off")

    hdr = patches.FancyBboxPatch(
        (0.06, 0.86), 0.88, 0.09,
        boxstyle="round,pad=0.015,rounding_size=0.02",
        facecolor=CARD_BG, edgecolor=BORDER_COLOR, linewidth=1.5
    )
    ax.add_patch(hdr)
    ax.text(0.09, 0.915, "MÓDULO 00 · PREPARACIÓN Y PRIMER CONTACTO CON IA",
            fontsize=13, fontweight="bold", color=ACCENT_BLUE, family="sans-serif")
    ax.text(0.09, 0.88, "Flujo de Cinco Pasos para Preparar un Informe Administrativo Verificable",
            fontsize=11, color=TEXT_MUTED, family="sans-serif")

    card1 = patches.FancyBboxPatch(
        (0.06, 0.58), 0.88, 0.25,
        boxstyle="round,pad=0.015,rounding_size=0.02",
        facecolor=CARD_BG, edgecolor=BORDER_COLOR, linewidth=1.5
    )
    ax.add_patch(card1)

    badge1 = patches.FancyBboxPatch(
        (0.09, 0.775), 0.36, 0.04,
        boxstyle="round,pad=0.008,rounding_size=0.01",
        facecolor="#eff6ff", edgecolor=ACCENT_BLUE, linewidth=1
    )
    ax.add_patch(badge1)
    ax.text(0.27, 0.795, "PRINCIPIOS ÉTICOS INICIALES (LEY 1581)", fontsize=9.5, fontweight="bold",
            color=ACCENT_BLUE, ha="center", va="center", family="sans-serif")

    ax.text(0.09, 0.73, "• Supervisión Humana: La IA sugiere borradores; la decisión es indelegable de la persona.",
            fontsize=9.5, color=PRIMARY_NAVY, family="sans-serif")
    ax.text(0.09, 0.69, "• Reserva y Privacidad: Nunca ingresar identificaciones, datos de salud ni claves.",
            fontsize=9.5, color=PRIMARY_NAVY, family="sans-serif")
    ax.text(0.09, 0.655, "• Trazabilidad Documental: Cada conclusión debe respaldarse en su archivo de origen.",
            fontsize=9.5, color=PRIMARY_NAVY, family="sans-serif")
    ax.text(0.09, 0.62, "• Control de Alucinaciones: Leer con criterio crítico; el modelo predice texto, no certeza.",
            fontsize=9.5, color=PRIMARY_NAVY, family="sans-serif")
    ax.text(0.09, 0.59, "  ★ REGLA DE ORO: La herramienta no reemplaza la responsabilidad del servidor público.",
            fontsize=9.5, fontweight="bold", color=ACCENT_AMBER, family="sans-serif")

    card2 = patches.FancyBboxPatch(
        (0.06, 0.16), 0.88, 0.39,
        boxstyle="round,pad=0.015,rounding_size=0.02",
        facecolor=CARD_BG, edgecolor=BORDER_COLOR, linewidth=1.5
    )
    ax.add_patch(card2)

    badge2 = patches.FancyBboxPatch(
        (0.09, 0.495), 0.34, 0.04,
        boxstyle="round,pad=0.008,rounding_size=0.01",
        facecolor="#f0fdf4", edgecolor=ACCENT_GREEN, linewidth=1
    )
    ax.add_patch(badge2)
    ax.text(0.26, 0.515, "CINCO PASOS DE LA PRÁCTICA", fontsize=9.5, fontweight="bold",
            color=ACCENT_GREEN, ha="center", va="center", family="sans-serif")

    pasos = [
        ("Paso 1 · Carga el archivo:", "Descarga bienestar.csv (sin datos reales) y adjúntalo al asistente."),
        ("Paso 2 · Pide el análisis:", "Copia la instrucción estructurada con tarea, fórmula y límites explícitos."),
        ("Paso 3 · Revisa las cifras:", "Verifica 42 ÷ 840 = 5 % con una calculadora propia independiente."),
        ("Paso 4 · Obtén el informe:", "Exige informe conciso; retira periodos o causas que no figuren en la fuente."),
        ("Paso 5 · Mide el tiempo:", "Registra duración de lectura y revisión; guarda la evidencia para el Portafolio de Evidencias.")
    ]
    for i, (p_title, p_desc) in enumerate(pasos):
        y_pos = 0.445 - (i * 0.055)
        ax.text(0.09, y_pos, p_title, fontsize=9.5, fontweight="bold", color=PRIMARY_NAVY, family="sans-serif")
        ax.text(0.35, y_pos, p_desc, fontsize=9, color=TEXT_MUTED, family="sans-serif")

    card_bot = patches.FancyBboxPatch(
        (0.06, 0.04), 0.88, 0.10,
        boxstyle="round,pad=0.015,rounding_size=0.02",
        facecolor="#f1f5f9", edgecolor=BORDER_COLOR, linewidth=1.5
    )
    ax.add_patch(card_bot)
    ax.text(0.09, 0.105, "RESULTADO VERIFICABLE DEL MÓDULO 00",
            fontsize=10, fontweight="bold", color=ACCENT_BLUE, family="sans-serif")
    ax.text(0.09, 0.065, "Un informe breve, con cifras contrastadas y sin alucinaciones, listo para sustentar.",
            fontsize=9, color=PRIMARY_NAVY, family="sans-serif")

    output_path = MEDIA_DIR / "m00_concept.jpg"
    plt.savefig(output_path, dpi=100, facecolor=BG_COLOR, bbox_inches="tight")
    plt.close()
    print(f"Generado {output_path}")


def create_m03_illustration():
    """Genera ilustración conceptual para Módulo 03: Flujos y Transformación."""
    fig = plt.figure(figsize=(10.24, 10.24), dpi=100)
    fig.patch.set_facecolor(BG_COLOR)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_facecolor(BG_COLOR)
    ax.axis("off")

    hdr = patches.FancyBboxPatch(
        (0.06, 0.86), 0.88, 0.09,
        boxstyle="round,pad=0.015,rounding_size=0.02",
        facecolor=CARD_BG, edgecolor=BORDER_COLOR, linewidth=1.5
    )
    ax.add_patch(hdr)
    ax.text(0.09, 0.915, "MÓDULO 03 · AUTOMATIZACIÓN DE FLUJOS Y DATOS",
            fontsize=13, fontweight="bold", color=ACCENT_BLUE, family="sans-serif")
    ax.text(0.09, 0.88, "Bandeja Clasificada, Acta Trazable, Limpieza de Datos y Flujo Verificable",
            fontsize=11, color=TEXT_MUTED, family="sans-serif")

    quads = [
        (0.06, 0.48, 0.42, 0.35, "RETO 4 · BANDEJA DE CORREOS", ACCENT_TEAL, [
            "• Entrada: solicitudes_area.csv (10 correos)",
            "• IA: Clasificación semántica inicial",
            "• Regla: Orden exacto de prioridad y destinatario",
            "• Salida: Tabla clasificada + Justificación",
            "★ Clave: La urgencia aparente no altera la prioridad"
        ]),
        (0.52, 0.48, 0.42, 0.35, "RETO 5 · ACTA TRAZABLE", ACCENT_BLUE, [
            "• Entrada: reunion_directiva_borrador.txt",
            "• IA: Extracción estructurada de compromisos",
            "• Comprobación: Cada tarea tiene responsable y fecha",
            "• Salida: Acta con citas textuales del audio/nota",
            "★ Clave: Si falta fecha, marcar 'Por confirmar'"
        ]),
        (0.06, 0.08, 0.42, 0.36, "RETO 6 · LIMPIEZA DE DATOS", ACCENT_AMBER, [
            "• Entrada: suministros_sedes.csv con anomalías",
            "• Tipos de error: Nulos, formatos, duplicados",
            "• Solución: Regla automatizada reproducible",
            "• Salida: Dataset depurado + Log de cambios",
            "★ Clave: No editar a mano; usar receta auditable"
        ]),
        (0.52, 0.08, 0.42, 0.36, "RETO 9 · DISEÑO DE FLUJO", ACCENT_GREEN, [
            "• Entrada: Trámite recurrente del área",
            "• Metodología: Diagrama de 4 a 6 bloques",
            "• Componentes: Datos, IA asistida, Control humano",
            "• Salida: Matriz de riesgos y puntos de decisión",
            "★ Clave: Definir punto exacto de revisión humana"
        ])
    ]

    for (x, y, w, h, title, color, items) in quads:
        card = patches.FancyBboxPatch(
            (x, y), w, h,
            boxstyle="round,pad=0.015,rounding_size=0.02",
            facecolor=CARD_BG, edgecolor=BORDER_COLOR, linewidth=1.5
        )
        ax.add_patch(card)

        badge = patches.FancyBboxPatch(
            (x + 0.02, y + h - 0.055), w - 0.04, 0.04,
            boxstyle="round,pad=0.008,rounding_size=0.01",
            facecolor="#f8fafc", edgecolor=color, linewidth=1
        )
        ax.add_patch(badge)
        ax.text(x + w / 2, y + h - 0.035, title, fontsize=9.5, fontweight="bold",
                color=color, ha="center", va="center", family="sans-serif")

        for idx, item in enumerate(items):
            iy = y + h - 0.095 - (idx * 0.05)
            fontweight = "bold" if "★" in item else "normal"
            fcolor = color if "★" in item else PRIMARY_NAVY
            ax.text(x + 0.02, iy, item, fontsize=8.8, fontweight=fontweight, color=fcolor, family="sans-serif")

    output_path = MEDIA_DIR / "m03_concept.jpg"
    plt.savefig(output_path, dpi=100, facecolor=BG_COLOR, bbox_inches="tight")
    plt.close()
    print(f"Generado {output_path}")


if __name__ == "__main__":
    import sys
    if "--all" in sys.argv:
        create_m00_illustration()
        create_m03_illustration()
        create_m04_illustration()
        create_m05_illustration()
    create_m01_illustration()
    print("Ilustraciones procesadas con éxito.")
