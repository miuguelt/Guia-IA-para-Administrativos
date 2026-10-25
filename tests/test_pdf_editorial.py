"""Comprueba que la versión impresa conserve instrucciones útiles para ese medio."""
import sys
from pathlib import Path
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from lab_document_pdfs import html_blocks


class EditorialPDFTests(unittest.TestCase):
    def test_pdf_keeps_source_and_task_without_printing_browser_buttons(self):
        blocks = html_blocks('''<div class="lab-callout"><h3>Compara las cifras</h3>
            <p>Usa bienestar.csv y conserva el periodo pendiente.</p>
            <div class="lab-actions"><a href="paquete.zip">Descargar paquete para la IA</a>
            <button>Copiar encargo</button></div><p>Comprueba 42 de 840.</p></div>''')
        text = " ".join(block["text"] for block in blocks)
        self.assertIn("bienestar.csv", text)
        self.assertIn("periodo pendiente", text)
        self.assertIn("42 de 840", text)
        self.assertNotIn("Descargar paquete", text)
        self.assertNotIn("Copiar encargo", text)


if __name__ == "__main__":
    unittest.main()
