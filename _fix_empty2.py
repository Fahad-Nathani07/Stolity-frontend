from pathlib import Path

EMPTY = '''<div className="files-empty-state">
  <div className="files-empty-state__inner">
    <div className="files-empty-state__icon">
      <img src={empty_folder} alt="" />
    </div>
    <div className="files-empty-state__title">
      No files or folders yet
    </div>
    <div className="files-empty-state__subtitle">
      Start by uploading your first file or creating a new folder to keep your
      workspace organised.
    </div>
  </div>
</div>'''

pages = [
    Path(r"F:\Fahad Infomanav\00_Projects\03_Stolity\00_Edit_Here\Client\src\pages\Files.jsx"),
    Path(r"F:\Fahad Infomanav\00_Projects\03_Stolity\00_Edit_Here\Client\src\pages\NestedPage.jsx"),
    Path(r"F:\Fahad Infomanav\00_Projects\03_Stolity\00_Edit_Here\Client\src\pages\Favourites.jsx"),
    Path(r"F:\Fahad Infomanav\00_Projects\03_Stolity\00_Edit_Here\Client\src\pages\RecycleBin.jsx"),
]

needle = "<img src={empty_folder} alt=\"\" />"

for p in pages:
    text = p.read_text(encoding="utf-8")
    count = 0
    search_from = 0
    while True:
        img_idx = text.find(needle, search_from)
        if img_idx < 0:
            break
        # Only replace empty-state icons (near "No files or folders yet")
        window = text[img_idx : img_idx + 500]
        if "No files or folders yet" not in text[img_idx : img_idx + 800]:
            search_from = img_idx + len(needle)
            continue

        # Walk back to the outer empty container: look for height: "calc(72vh
        # or height:"72vh" within preceding 800 chars, then find its opening <div
        pre = text[max(0, img_idx - 1200) : img_idx]
        markers = [
            'height: "calc(72vh - 20px)"',
            'height:"72vh"',
            'height: "72vh"',
            "height:\"72vh\"",
        ]
        marker_pos = -1
        used = None
        for m in markers:
            pos = pre.rfind(m)
            if pos > marker_pos:
                marker_pos = pos
                used = m
        if marker_pos < 0:
            print(p.name, "no height marker near empty_folder")
            search_from = img_idx + len(needle)
            continue

        abs_marker = max(0, img_idx - 1200) + marker_pos
        # find opening <div before marker
        open_div = text.rfind("<div", 0, abs_marker)
        if open_div < 0:
            print(p.name, "no open div")
            search_from = img_idx + len(needle)
            continue

        # find end after subtitle: after "workspace organised." next </div></div></div>
        end_phrase = "workspace organised."
        end_idx = text.find(end_phrase, img_idx)
        if end_idx < 0:
            print(p.name, "no end phrase")
            search_from = img_idx + len(needle)
            continue
        # consume following closing divs (3 levels)
        close_start = end_idx + len(end_phrase)
        # skip whitespace
        i = close_start
        closes = 0
        while i < len(text) and closes < 3:
            while i < len(text) and text[i] in " \t\r\n":
                i += 1
            if text.startswith("</div>", i):
                i += len("</div>")
                closes += 1
            else:
                break
        if closes < 3:
            print(p.name, "expected 3 closing divs, got", closes)
            search_from = img_idx + len(needle)
            continue

        text = text[:open_div] + EMPTY + text[i:]
        count += 1
        search_from = open_div + len(EMPTY)

    p.write_text(text, encoding="utf-8")
    print(p.name, "replaced", count)
