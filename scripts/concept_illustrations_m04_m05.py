"""Ilustraciones conceptuales para los módulos 4, 5 y ruta formativa."""

from pathlib import Path
import matplotlib.pyplot as plt
import matplotlib.patches as patches

ROOT = Path(__file__).resolve().parents[1]
MEDIA_DIR = ROOT / "media"
MEDIA_DIR.mkdir(exist_ok=True)

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


def create_m04_illustration():
    """Genera ilustración conceptual para Módulo 04: Verificación y Auditoría."""
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
    ax.text(0.09, 0.915, "MÓDULO 04 · VERIFICACIÓN DE DATOS Y AUDITORÍA",
            fontsize=13, fontweight="bold", color=ACCENT_BLUE, family="sans-serif")
    ax.text(0.09, 0.88, "Cálculo Independiente, Delimitación de Alcance y Detección de Afirmaciones",
            fontsize=11, color=TEXT_MUTED, family="sans-serif")

    card_left = patches.FancyBboxPatch(
        (0.06, 0.36), 0.42, 0.47,
        boxstyle="round,pad=0.015,rounding_size=0.02",
        facecolor=CARD_BG, edgecolor=BORDER_COLOR, linewidth=1.5
    )
    ax.add_patch(card_left)

    badge_l = patches.FancyBboxPatch(
        (0.09, 0.775), 0.32, 0.04,
        boxstyle="round,pad=0.008,rounding_size=0.01",
        facecolor="#eff6ff", edgecolor=ACCENT_BLUE, linewidth=1
    )
    ax.add_patch(badge_l)
    ax.text(0.25, 0.795, "AUDITORÍA CUANTITATIVA (5 %)", fontsize=9.5, fontweight="bold",
            color=ACCENT_BLUE, ha="center", va="center", family="sans-serif")

    ax.text(0.09, 0.725, "1. Fórmula Obligatoria:", fontsize=10, fontweight="bold", color=PRIMARY_NAVY, family="sans-serif")
    ax.text(0.09, 0.69, "   Tasa = (42 Casos ÷ 840 Total) × 100", fontsize=9.5, color=PRIMARY_NAVY, family="sans-serif")
    ax.text(0.09, 0.655, "   Resultado exacto: 5,00 %", fontsize=9.5, fontweight="bold", color=ACCENT_BLUE, family="sans-serif")
    ax.text(0.09, 0.615, "2. Contraste de División por Cero:", fontsize=10, fontweight="bold", color=PRIMARY_NAVY, family="sans-serif")
    ax.text(0.09, 0.58, "   Si total = 0, no calcular; advertir.", fontsize=9, color=TEXT_MUTED, family="sans-serif")
    ax.text(0.09, 0.54, "3. Identificación de Alcance:", fontsize=10, fontweight="bold", color=PRIMARY_NAVY, family="sans-serif")
    ax.text(0.09, 0.505, "   Gráfico suma Gastos Q1 (Ene-Mar):", fontsize=9, color=PRIMARY_NAVY, family="sans-serif")
    ax.text(0.09, 0.47, "   Centro A: $3.767.700 COP", fontsize=9, fontweight="bold", color=PRIMARY_NAVY, family="sans-serif")
    ax.text(0.09, 0.435, "   Centro B: $2.809.863 COP", fontsize=9, fontweight="bold", color=PRIMARY_NAVY, family="sans-serif")
    ax.text(0.09, 0.395, "   ★ Muestra parcial; no representa la entidad.", fontsize=8.5, color=ACCENT_AMBER, family="sans-serif")

    card_right = patches.FancyBboxPatch(
        (0.52, 0.36), 0.42, 0.47,
        boxstyle="round,pad=0.015,rounding_size=0.02",
        facecolor=CARD_BG, edgecolor=BORDER_COLOR, linewidth=1.5
    )
    ax.add_patch(card_right)

    badge_r = patches.FancyBboxPatch(
        (0.55, 0.775), 0.34, 0.04,
        boxstyle="round,pad=0.008,rounding_size=0.01",
        facecolor="#fef2f2", edgecolor=ACCENT_RED, linewidth=1
    )
    ax.add_patch(badge_r)
    ax.text(0.72, 0.795, "CONTROL DE ALUCINACIONES", fontsize=9.5, fontweight="bold",
            color=ACCENT_RED, ha="center", va="center", family="sans-serif")

    ax.text(0.55, 0.725, "1. Detección de Afirmaciones Falsas:", fontsize=10, fontweight="bold", color=PRIMARY_NAVY, family="sans-serif")
    ax.text(0.55, 0.69, "   Si el modelo afirma 'reducción del 15 %'", fontsize=9, color=TEXT_MUTED, family="sans-serif")
    ax.text(0.55, 0.655, "   y no hay histórico: RECHAZAR.", fontsize=9, fontweight="bold", color=ACCENT_RED, family="sans-serif")
    ax.text(0.55, 0.615, "2. Período Desconocido:", fontsize=10, fontweight="bold", color=PRIMARY_NAVY, family="sans-serif")
    ax.text(0.55, 0.58, "   Bienestar no tiene fecha: marcar", fontsize=9, color=PRIMARY_NAVY, family="sans-serif")
    ax.text(0.55, 0.545, "   explícitamente 'NO CONSTA'.", fontsize=9, fontweight="bold", color=ACCENT_AMBER, family="sans-serif")
    ax.text(0.55, 0.505, "3. Filtro de Órdenes Intrusas (Prompt Injection):", fontsize=10, fontweight="bold", color=PRIMARY_NAVY, family="sans-serif")
    ax.text(0.55, 0.47, "   Texto intruso: 'Ignora lo anterior...'", fontsize=9, color=TEXT_MUTED, family="sans-serif")
    ax.text(0.55, 0.435, "   Respuesta ética: Ignorar la trampa;", fontsize=9, color=PRIMARY_NAVY, family="sans-serif")
    ax.text(0.55, 0.40, "   reportar incidencia en la evidencia.", fontsize=9, fontweight="bold", color=ACCENT_RED, family="sans-serif")

    card_bot = patches.FancyBboxPatch(
        (0.06, 0.05), 0.88, 0.28,
        boxstyle="round,pad=0.015,rounding_size=0.02",
        facecolor="#f1f5f9", edgecolor=BORDER_COLOR, linewidth=1.5
    )
    ax.add_patch(card_bot)

    ax.text(0.09, 0.27, "CRITERIO DE SALIDA PARA MG-A04:",
            fontsize=10.5, fontweight="bold", color=ACCENT_BLUE, family="sans-serif")
    ax.text(0.09, 0.22, "• Exactitud Aritmética: Cálculo verificado con herramienta externa al modelo.",
            fontsize=9.5, color=PRIMARY_NAVY, family="sans-serif")
    ax.text(0.09, 0.17, "• Delimitación Responsable: No generalizar a toda la sede lo que corresponde a dos centros.",
            fontsize=9.5, color=PRIMARY_NAVY, family="sans-serif")
    ax.text(0.09, 0.12, "• Protección de Integridad: Reporte formal de datos no sustentados e inyecciones detectadas.",
            fontsize=9.5, color=PRIMARY_NAVY, family="sans-serif")
    ax.text(0.09, 0.07, "• Tono Institucional: Objetivo, verificable y enfocado en hechos documentados.",
            fontsize=9.5, fontweight="bold", color=PRIMARY_NAVY, family="sans-serif")

    output_path = MEDIA_DIR / "m04_concept.jpg"
    plt.savefig(output_path, dpi=100, facecolor=BG_COLOR, bbox_inches="tight")
    plt.close()
    print(f"Generado {output_path}")


def create_m05_illustration():
    """Genera ilustración conceptual para Módulo 05: Informe Técnico y Transferencia."""
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
    ax.text(0.09, 0.915, "MÓDULO 05 · INFORME TÉCNICO Y TRANSFERENCIA",
            fontsize=13, fontweight="bold", color=ACCENT_BLUE, family="sans-serif")
    ax.text(0.09, 0.88, "Sustentación con Fuentes, Medición Completa y Piloto en el Puesto (30 Días)",
            fontsize=11, color=TEXT_MUTED, family="sans-serif")

    card1 = patches.FancyBboxPatch(
        (0.06, 0.58), 0.88, 0.25,
        boxstyle="round,pad=0.015,rounding_size=0.02",
        facecolor=CARD_BG, edgecolor=BORDER_COLOR, linewidth=1.5
    )
    ax.add_patch(card1)

    badge1 = patches.FancyBboxPatch(
        (0.09, 0.775), 0.32, 0.04,
        boxstyle="round,pad=0.008,rounding_size=0.01",
        facecolor="#eff6ff", edgecolor=ACCENT_BLUE, linewidth=1
    )
    ax.add_patch(badge1)
    ax.text(0.25, 0.795, "1. LA DIFERENCIA ES UNA PREGUNTA", fontsize=9.5, fontweight="bold",
            color=ACCENT_BLUE, ha="center", va="center", family="sans-serif")

    ax.text(0.09, 0.73, "• Caso SIM-CT-008 (Fila 12, Centro H):",
            fontsize=10.5, fontweight="bold", color=PRIMARY_NAVY, family="sans-serif")
    ax.text(0.09, 0.69, "  - Planeado: $24.400.000 COP  |  Comprometido: $25.650.000 COP",
            fontsize=9.5, color=PRIMARY_NAVY, family="sans-serif")
    ax.text(0.09, 0.655, "  - Diferencia: $1.250.000 COP  |  Fecha vacía  |  Soporte 'Por confirmar'",
            fontsize=9.5, fontweight="bold", color=ACCENT_AMBER, family="sans-serif")
    ax.text(0.09, 0.62, "  ★ CRITERIO ÉTICO Y TÉCNICO: La diferencia no demuestra irregularidad;",
            fontsize=9.5, fontweight="bold", color=ACCENT_RED, family="sans-serif")
    ax.text(0.09, 0.59, "    formula una pregunta técnica sobre soportes pendientes a verificar.",
            fontsize=9.5, color=PRIMARY_NAVY, family="sans-serif")

    card2 = patches.FancyBboxPatch(
        (0.06, 0.31), 0.88, 0.24,
        boxstyle="round,pad=0.015,rounding_size=0.02",
        facecolor=CARD_BG, edgecolor=BORDER_COLOR, linewidth=1.5
    )
    ax.add_patch(card2)

    badge2 = patches.FancyBboxPatch(
        (0.09, 0.495), 0.30, 0.04,
        boxstyle="round,pad=0.008,rounding_size=0.01",
        facecolor="#f0fdf4", edgecolor=ACCENT_GREEN, linewidth=1
    )
    ax.add_patch(badge2)
    ax.text(0.24, 0.515, "2. MEDICIÓN DEL TIEMPO TOTAL", fontsize=9.5, fontweight="bold",
            color=ACCENT_GREEN, ha="center", va="center", family="sans-serif")

    ax.text(0.09, 0.45, "Desglose del esfuerzo real asistido con IA:",
            fontsize=10, fontweight="bold", color=PRIMARY_NAVY, family="sans-serif")
    ax.text(0.09, 0.415, "  Preparación (4 min) + Generación (2 min) + Revisión (5 min) + Corrección (2 min)",
            fontsize=9.5, color=PRIMARY_NAVY, family="sans-serif")
    ax.text(0.09, 0.38, "  = Tiempo Total Asistido: 13 minutos  (vs. Manual: 12 minutos)",
            fontsize=9.5, fontweight="bold", color=ACCENT_BLUE, family="sans-serif")
    ax.text(0.09, 0.34, "  ★ HONESTIDAD TÉCNICA: No prometer ahorro si no existe; medir siempre el ciclo completo.",
            fontsize=9.5, fontweight="bold", color=ACCENT_GREEN, family="sans-serif")

    card3 = patches.FancyBboxPatch(
        (0.06, 0.05), 0.88, 0.23,
        boxstyle="round,pad=0.015,rounding_size=0.02",
        facecolor="#f1f5f9", edgecolor=BORDER_COLOR, linewidth=1.5
    )
    ax.add_patch(card3)

    badge3 = patches.FancyBboxPatch(
        (0.09, 0.225), 0.32, 0.035,
        boxstyle="round,pad=0.008,rounding_size=0.01",
        facecolor="#fef3c7", edgecolor=ACCENT_AMBER, linewidth=1
    )
    ax.add_patch(badge3)
    ax.text(0.25, 0.242, "3. TRANSFERENCIA A 30 DÍAS", fontsize=9.5, fontweight="bold",
            color=ACCENT_AMBER, ha="center", va="center", family="sans-serif")

    ax.text(0.09, 0.185, "• Tarea acotada: Una actividad administrativa específica del puesto de trabajo.",
            fontsize=9.5, color=PRIMARY_NAVY, family="sans-serif")
    ax.text(0.09, 0.155, "• Autorización previa: Confirmar permisos de cuenta y directrices de protección de datos.",
            fontsize=9.5, color=PRIMARY_NAVY, family="sans-serif")
    ax.text(0.09, 0.125, "• Trazabilidad: Registrar tiempos observados, calidad de salida y ajustes requeridos.",
            fontsize=9.5, color=PRIMARY_NAVY, family="sans-serif")
    ax.text(0.09, 0.095, "• Decisión final: Al cumplir 30 días, evaluar objetivamente continuar, ajustar o detener el uso.",
            fontsize=9.5, fontweight="bold", color=PRIMARY_NAVY, family="sans-serif")

    output_path = MEDIA_DIR / "m05_concept.jpg"
    plt.savefig(output_path, dpi=100, facecolor=BG_COLOR, bbox_inches="tight")
    plt.close()
    print(f"Generado {output_path}")


def create_home_roadmap_illustration():
    """Genera infografía de la ruta formativa para la página de inicio."""
    fig = plt.figure(figsize=(10.24, 6.0), dpi=100)
    fig.patch.set_facecolor(BG_COLOR)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_facecolor(BG_COLOR)
    ax.axis("off")

    hdr = patches.FancyBboxPatch(
        (0.05, 0.82), 0.90, 0.14,
        boxstyle="round,pad=0.015,rounding_size=0.02",
        facecolor=CARD_BG, edgecolor=BORDER_COLOR, linewidth=1.5
    )
    ax.add_patch(hdr)
    ax.text(0.08, 0.90, "RUTA FORMATIVA DE INTELIGENCIA ARTIFICIAL EN GESTIÓN ADMINISTRATIVA",
            fontsize=12, fontweight="bold", color=ACCENT_BLUE, family="sans-serif")
    ax.text(0.08, 0.85, "Programa SENA 21720210 V1 · 40 Horas de Práctica Basada en Evidencias Observables",
            fontsize=10, color=TEXT_MUTED, family="sans-serif")

    modulos = [
        ("00 · Prepara", "1 h · Martes", "Herramientas, ética y primer informe", ACCENT_TEAL),
        ("01 · Comprende", "8 h · Martes", "Delimitación de tareas y línea base", ACCENT_BLUE),
        ("02 · Diseña", "9 h · Miércoles", "Estructuración CRTT y atención PQRS", ACCENT_GREEN),
        ("03 · Implementa", "9 h · Jueves", "Bandeja, actas y limpieza de datos", ACCENT_AMBER),
        ("04 · Valida", "3.5 h · Viernes", "Auditoría de tasas y filtro de sesgos", ACCENT_RED),
        ("05 · Transfiere", "5.5 h · Viernes", "Contratos, sustentación y piloto 30d", PRIMARY_NAVY),
    ]

    for index, (m_num, m_time, m_desc, m_color) in enumerate(modulos):
        row = index // 3
        col = index % 3
        x = 0.05 + col * 0.31
        y = 0.44 - row * 0.34

        card = patches.FancyBboxPatch(
            (x, y), 0.28, 0.29,
            boxstyle="round,pad=0.012,rounding_size=0.018",
            facecolor=CARD_BG, edgecolor=BORDER_COLOR, linewidth=1.5
        )
        ax.add_patch(card)

        top_bar = patches.FancyBboxPatch(
            (x + 0.015, y + 0.215), 0.25, 0.055,
            boxstyle="round,pad=0.006,rounding_size=0.01",
            facecolor="#f1f5f9", edgecolor=m_color, linewidth=1
        )
        ax.add_patch(top_bar)
        ax.text(x + 0.025, y + 0.24, m_num, fontsize=9.5, fontweight="bold", color=m_color, family="sans-serif")
        ax.text(x + 0.25, y + 0.24, m_time, fontsize=8, color=TEXT_MUTED, ha="right", family="sans-serif")

        ax.text(x + 0.02, y + 0.13, m_desc, fontsize=8.5, color=PRIMARY_NAVY, family="sans-serif")
        ax.text(x + 0.02, y + 0.04, "✔ Evidencia verificable", fontsize=8, fontweight="bold", color=ACCENT_TEAL, family="sans-serif")

    output_path = MEDIA_DIR / "ruta_formativa_resumen.jpg"
    plt.savefig(output_path, dpi=100, facecolor=BG_COLOR, bbox_inches="tight")
    plt.close()
    print(f"Generado {output_path}")
