"""Assemble the quote form into one HTML file: python3 tools/quote-form/build.py"""
import base64, pathlib
here = pathlib.Path(__file__).parent
root = here.parent.parent
page = (here / "page.html").read_text(encoding="utf-8")
core = (here / "quote-core.js").read_text(encoding="utf-8")
logo = "data:image/jpeg;base64," + base64.b64encode((root / "assets" / "logo.jpeg").read_bytes()).decode()
out = page.replace("/*__CORE__*/", core).replace("__LOGO__", logo)
(here / "index.html").write_text(out, encoding="utf-8")
print("wrote", here / "index.html", len(out), "bytes")
