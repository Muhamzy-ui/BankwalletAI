"""
Run: .\venv\Scripts\python.exe test_html_receipts.py
Generates absolute flawless replicas using HTML and Playwright Chromium.
"""
import os, sys
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

import django
django.setup()

from bot.receipt_generator import (
    _gen_vfd, _gen_sparkle, _gen_kongapay,
    _gen_moniepoint, _gen_palmpay, _gen_opay
)

tests = [
    ("VFD",        _gen_vfd),
    ("Sparkle",    _gen_sparkle),
    ("KongaPay",   _gen_kongapay),
    ("Moniepoint", _gen_moniepoint),
    ("PalmPay",    _gen_palmpay),
    ("OPay",       _gen_opay),
]

print("=== STARTING PLAYWRIGHT HTML TO IMAGE GENERATION ===")
print("Please wait, Chromium headless browser is waking up...\n")

for name, fn in tests:
    try:
        url = fn()
        print(f"[OK] {name:12s} => {url}")
    except Exception as e:
        import traceback
        print(f"[ERROR] {name:12s} => {e}")
        traceback.print_exc()

print("\nDone! Check the /media/receipts/ folder for your new pixel-perfect HTML replicas!")
