"""Migrate after-login AOS zoom animations → Home1 ScrollReveal."""
from pathlib import Path
import re

VARIANT = {
    "zoom-out": ("fadeSoft", "0.05", "0.75"),
    "zoom-in": ("fadeUp", "0.1", "0.85"),
}

FILES = [
    ("src/pages/HelpSupportCenter.jsx", 'import ScrollReveal from "../components/ScrollReveal";'),
    ("src/pages/FAQPage.jsx", 'import ScrollReveal from "../components/ScrollReveal";'),
    ("src/pages/PaymentIntegrationPage.jsx", 'import ScrollReveal from "../components/ScrollReveal";'),
    ("src/pages/UserProfile.jsx", 'import ScrollReveal from "../components/ScrollReveal";'),
    ("src/pages/SupportDashboard.jsx", 'import ScrollReveal from "../components/ScrollReveal";'),
    ("src/pages/JobPortal/JobDashboard.jsx", 'import ScrollReveal from "../../components/ScrollReveal";'),
    ("src/pages/JobPortal/JobPortalAdmin.jsx", 'import ScrollReveal from "../../components/ScrollReveal";'),
]


def strip_aos_effects(text: str) -> str:
    text = re.sub(
        r"\n\s*useEffect\(\(\)\s*=>\s*\{\s*AOS\.init\(\{[\s\S]*?\}\);\s*\}, \[\]\);\s*",
        "\n",
        text,
        count=1,
    )
    text = re.sub(
        r"\n\s*useEffect\(\(\)\s*=>\s*\{\s*AOS\.refresh\(\);\s*\}, \[[^\]]*\]\);\s*",
        "\n",
        text,
        count=1,
    )
    return text


def swap_imports(text: str, scroll_import: str) -> str:
    text = re.sub(r'import AOS from "aos";\r?\n', "", text)
    text = re.sub(r'import "aos/dist/aos\.css";\r?\n', "", text)
    if "ScrollReveal" not in text:
        lines = text.splitlines(True)
        i = 0
        while i < len(lines) and (
            lines[i].startswith("import ") or lines[i].strip() == ""
        ):
            i += 1
        j = i - 1
        while j >= 0 and lines[j].strip() == "":
            j -= 1
        lines.insert(j + 1, scroll_import + ("\r\n" if "\r\n" in text else "\n"))
        text = "".join(lines)
    return text


def rewrite_file(path: str, scroll_import: str) -> None:
    p = Path(path)
    text = p.read_text(encoding="utf-8")
    text = swap_imports(text, scroll_import)
    text = strip_aos_effects(text)

    # Convert: <Tag ... data-aos="x" ...>children</Tag>
    # → <ScrollReveal as="Tag" ... variant ...>children</ScrollReveal>
    # Only for tags whose entire opening tag is on one line (true for all our cases).
    open_re = re.compile(
        r'<([a-zA-Z][a-zA-Z0-9]*)((?:[^>\n]|data-aos="[^"]*")*?)\sdata-aos="([^"]+)"([^>\n]*)>'
    )

    converted = 0
    pos = 0
    out = []
    while True:
        m = open_re.search(text, pos)
        if not m:
            out.append(text[pos:])
            break
        out.append(text[pos : m.start()])
        tag, before, aos, after = m.group(1), m.group(2), m.group(3), m.group(4)
        variant, delay, dur = VARIANT.get(aos, ("fadeUp", "0.1", "0.85"))
        attrs = (before + after).strip()
        # extract key={...}
        key_attr = ""
        km = re.search(r"\skey=\{([^}]+)\}", " " + attrs)
        if km:
            key_attr = f" key={{{km.group(1)}}}"
            attrs = (attrs[: km.start() - 1] + attrs[km.end() - 1 :]).strip()
        # also strip any leftover data-aos-*
        attrs = re.sub(r'\s*data-aos(?:-[a-z]+)="[^"]*"', "", attrs).strip()
        attr_str = f" {attrs}" if attrs else ""
        open_tag = (
            f'<ScrollReveal as="{tag}"{attr_str} '
            f'variant="{variant}" delay={{{delay}}} duration={{{dur}}}{key_attr}>'
        )
        out.append(open_tag)

        # Find matching close tag </tag> with nesting awareness (simple)
        search_from = m.end()
        depth = 1
        close_pat = re.compile(rf"</{re.escape(tag)}\s*>")
        open_pat = re.compile(rf"<{re.escape(tag)}(?:\s|>|/)")
        cursor = search_from
        close_at = None
        while depth > 0:
            next_open = open_pat.search(text, cursor)
            next_close = close_pat.search(text, cursor)
            if not next_close:
                break
            if next_open and next_open.start() < next_close.start():
                # check self-closing
                chunk = text[next_open.start() : next_open.start() + 200]
                end_gt = chunk.find(">")
                if end_gt != -1 and chunk[end_gt - 1] == "/":
                    cursor = next_open.start() + end_gt + 1
                    continue
                depth += 1
                cursor = next_open.end()
            else:
                depth -= 1
                if depth == 0:
                    close_at = next_close
                else:
                    cursor = next_close.end()
        if close_at is None:
            # fallback: don't convert this one fully — append original
            out[-1] = m.group(0)
            pos = m.end()
            continue
        out.append(text[m.end() : close_at.start()])
        out.append("</ScrollReveal>")
        pos = close_at.end()
        converted += 1

    new_text = "".join(out)
    p.write_text(new_text, encoding="utf-8")
    print(f"{path}: converted {converted} blocks")


def main():
    for path, imp in FILES:
        rewrite_file(path, imp)


if __name__ == "__main__":
    main()
