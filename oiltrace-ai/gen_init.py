import os, sys
from pathlib import Path

def w(path, content):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")
    print(f"  wrote {path}")

for pkg in [
    "backend/app", "backend/app/api", "backend/app/database",
    "backend/app/simulation", "backend/app/geometry", "backend/app/drift",
    "backend/app/ais", "backend/app/attribution", "backend/app/reports",
    "backend/app/environmental", "backend/app/digital_twin",
    "backend/app/detection", "backend/app/preprocessing", "backend/app/uncertainty",
]:
    w(f"{pkg}/__init__.py", "")

print("init files done")
