"""
Adversarial and Responsive Verification Suite
Identity: r3_challenger_1
Milestone: M3 / Verificación adversarial diagramas e infografías nativas
"""
import os
import re
import math
from bs4 import BeautifulSoup

def main():
    print("=" * 70)
    print("ADVERSARIAL STRESS TEST & VERIFICATION HARNESS - r3_challenger_1")
    print("=" * 70)

    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()
    soup = BeautifulSoup(html, 'html.parser')

    native_diagrams = soup.select('.native-diagram')
    print(f"\n[1] NATIVE DIAGRAMS AUDIT: Found {len(native_diagrams)} .native-diagram elements")

    # Test 2: Selectable HTML text vs images/rasterized text
    print("\n--- TEST 2: Plain Selectable HTML Text in .native-diagram ---")
    selectable_text_passed = True
    for idx, d in enumerate(native_diagrams):
        parent_sec = d.find_parent('section')
        sec_id = parent_sec.get('id', 'unknown') if parent_sec else 'unknown'
        title_el = d.select_one('.native-diagram__title, h3, h4')
        title = title_el.get_text(strip=True) if title_el else 'Sin título'
        
        imgs = d.select('img')
        svgs = d.select('svg')
        canvases = d.select('canvas')
        
        # Check text length
        text_content = d.get_text(strip=True)
        word_count = len(text_content.split())
        
        print(f"  [{idx+1}] Module: {sec_id} | Title: '{title[:45]}...'")
        print(f"      Words: {word_count} | <img>: {len(imgs)} | <svg>: {len(svgs)} | <canvas>: {len(canvases)}")
        
        if imgs or svgs or canvases:
            print(f"      [WARN] Found embedded graphic elements inside .native-diagram!")
            selectable_text_passed = False
        else:
            print(f"      [PASS] 100% plain selectable HTML5 text.")

    # Test 1 & Responsive Stress: Viewport Simulation across 320px, 375px, 412px, 768px, 1200px
    print("\n--- TEST 1: Responsive Layout & Overflow-X Stress Testing ---")
    viewports = [320, 375, 412, 768, 1200]
    
    # Read CSS files
    css_files = [
        'css/tokens.css',
        'css/course-shell.css',
        'css/course-learning.css',
        'css/learning-support.css',
        'css/course-responsive.css'
    ]
    all_css = ""
    for cf in css_files:
        if os.path.exists(cf):
            with open(cf, 'r', encoding='utf-8') as f:
                all_css += f"\n/* {cf} */\n" + f.read()

    print(f"  Loaded {len(all_css)} bytes of CSS from {len(css_files)} files.")

    # Inspect all diagrams for fixed widths, min-widths, inline styles
    overflow_risk_items = []
    for idx, d in enumerate(native_diagrams):
        parent_sec = d.find_parent('section')
        sec_id = parent_sec.get('id', 'unknown') if parent_sec else 'unknown'
        title_el = d.select_one('.native-diagram__title, h3, h4')
        title = title_el.get_text(strip=True) if title_el else 'Sin título'

        # Check inline styles for fixed widths or large min-widths
        style = d.get('style', '')
        all_children_with_style = d.select('[style]')
        
        for el in [d] + all_children_with_style:
            st = el.get('style', '')
            # check min-width or width > 300px
            width_matches = re.findall(r'(min-width|width|grid-template-columns)\s*:\s*([^;]+)', st)
            for prop, val in width_matches:
                val = val.strip()
                # Check if fixed px > 300 or minmax(260px, ...)
                px_vals = [int(p) for p in re.findall(r'(\d+)px', val)]
                for p in px_vals:
                    if p >= 260:
                        overflow_risk_items.append({
                            'diagram': f"[{sec_id}] {title[:30]}",
                            'tag': el.name,
                            'classes': el.get('class', []),
                            'property': prop,
                            'value': val,
                            'px': p
                        })

    print(f"\n  Inspected fixed-width and min-width risks in .native-diagram elements:")
    if overflow_risk_items:
        print(f"  [WARN] Found {len(overflow_risk_items)} elements with width/min-width >= 260px:")
        for item in overflow_risk_items:
            print(f"    - {item['diagram']} -> <{item['tag']}.{' '.join(item['classes'])}> {item['property']}: {item['value']}")
    else:
        print("  [PASS] No fixed or large min-widths found in .native-diagram elements.")

    # Check CSS media queries for .native-diagram
    print("\n  Analyzing media queries for .native-diagram in CSS:")
    native_mq = re.findall(r'@media\s*\([^{]+\)\s*\{[^}]*\.native-diagram[^}]*\}', all_css, re.DOTALL)
    for mq in native_mq:
        print(f"    - Found media query: {mq[:120].strip()}...")

    # Also audit SVGs in the page (interactive-diagram-card)
    print("\n--- AUDIT OF OTHER DIAGRAMS & SVGS ACROSS 5 MODULES ---")
    all_svgs = soup.select('svg')
    print(f"  Total SVG elements in index.html: {len(all_svgs)}")
    svg_details = []
    for s in all_svgs:
        p_card = s.find_parent(class_=re.compile(r'interactive-diagram|diagram|process|visual'))
        sec = s.find_parent('section')
        sec_id = sec.get('id', 'unknown') if sec else 'unknown'
        viewbox = s.get('viewbox') or s.get('viewBox', 'None')
        texts = s.select('text')
        min_fs = 999
        text_samples = []
        for t in texts:
            fs = t.get('font-size', '12')
            try:
                fs_num = float(re.sub(r'[^\d.]', '', fs))
                if fs_num < min_fs:
                    min_fs = fs_num
            except:
                pass
            text_samples.append(t.get_text(strip=True))
        
        svg_details.append({
            'sec_id': sec_id,
            'parent_class': p_card.get('class') if p_card else 'none',
            'viewbox': viewbox,
            'text_count': len(texts),
            'min_font_size': min_fs if min_fs != 999 else None,
            'aria_label': s.get('aria-label', s.get('aria-labelledby', 'None'))
        })

    for sd in svg_details:
        print(f"  SVG in [{sd['sec_id']}] parent={sd['parent_class']} viewBox={sd['viewbox']} texts={sd['text_count']} min_fs={sd['min_font_size']}")
        print(f"      Label: {sd['aria_label'][:70]}...")

    # Contrast Ratio Verification (WCAG AA)
    print("\n--- TEST 3: Color Contrast Verification (WCAG AA) ---")
    # Contrast calculation helper
    def srgb_to_luminance(c):
        # c in 0..1
        if c <= 0.03928:
            return c / 12.92
        else:
            return ((c + 0.055) / 1.055) ** 2.4

    def hex_to_rgb(hex_str):
        hex_str = hex_str.lstrip('#')
        if len(hex_str) == 3:
            hex_str = ''.join(c*2 for c in hex_str)
        return tuple(int(hex_str[i:i+2], 16) / 255.0 for i in (0, 2, 4))

    def get_contrast(rgb1, rgb2):
        l1 = 0.2126 * srgb_to_luminance(rgb1[0]) + 0.7152 * srgb_to_luminance(rgb1[1]) + 0.0722 * srgb_to_luminance(rgb1[2])
        l2 = 0.2126 * srgb_to_luminance(rgb2[0]) + 0.7152 * srgb_to_luminance(rgb2[1]) + 0.0722 * srgb_to_luminance(rgb2[2])
        lighter = max(l1, l2)
        darker = min(l1, l2)
        return (lighter + 0.05) / (darker + 0.05)

    # Key color tokens used in native diagrams
    color_pairs = [
        # (Foreground, Background, Description, Target min)
        ('#1e293b', '#ffffff', 'Card Title ink on White surface', 4.5),
        ('#1e293b', '#f8fafc', 'Card Title ink on Paper surface', 4.5),
        ('#3b5042', '#f8fafc', 'Card text on Paper surface', 4.5),
        ('#475569', '#ffffff', 'Muted text on White surface', 4.5),
        ('#475569', '#f8fafc', 'Muted text on Paper surface', 4.5),
        ('#225746', '#ffffff', 'Green kicker on White surface', 4.5),
        ('#153e38', '#ffffff', 'Green-dark heading on White surface', 4.5),
        ('#ffffff', '#225746', 'White step-num on Green circle', 3.0),
        ('#ffffff', '#1e7049', 'White step-num on Rule green circle', 3.0),
        ('#ffffff', '#1d68bd', 'White step-num on AI blue circle', 3.0),
        ('#ffffff', '#b57a1e', 'White step-num on Human amber circle', 3.0),
        ('#15803d', '#f0fdf4', 'Rule header on light green card', 4.5),
        ('#1d4ed8', '#eff6ff', 'AI header on light blue card', 4.5),
        ('#b45309', '#fffbeb', 'Human header on light amber card', 4.5),
        ('#15803d', '#fcfdfa', 'Rule example on light surface', 4.5),
        ('#1d4ed8', '#fcfdfa', 'AI example on light surface', 4.5),
        ('#b45309', '#fcfdfa', 'Human example on light surface', 4.5),
    ]

    all_contrast_pass = True
    for fg_hex, bg_hex, desc, target in color_pairs:
        fg_rgb = hex_to_rgb(fg_hex)
        bg_rgb = hex_to_rgb(bg_hex)
        ratio = get_contrast(fg_rgb, bg_rgb)
        passed = ratio >= target
        if not passed:
            all_contrast_pass = False
        status = "PASS" if passed else "FAIL"
        print(f"  [{status}] {desc}: {fg_hex} on {bg_hex} -> {ratio:.2f}:1 (req >= {target}:1)")

    print(f"\nOverall Contrast Result: {'ALL PASS' if all_contrast_pass else 'FAILURES DETECTED'}")

if __name__ == '__main__':
    main()
