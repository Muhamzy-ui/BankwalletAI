"""
Run: .\venv\Scripts\python.exe test_receipts.py
Generates one receipt for each bank into media/receipts/
"""
import os, sys
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

import django
django.setup()

from bot.receipt_generator import (
    _gen_vfd, _gen_sparkle, _gen_kongapay,
    _gen_moniepoint, _gen_palmpay, _gen_opay
)

media_dir = os.path.join(os.getcwd(), "media", "receipts")
os.makedirs(media_dir, exist_ok=True)

tests = [
    ("VFD",        _gen_vfd),
    ("Sparkle",    _gen_sparkle),
    ("KongaPay",   _gen_kongapay),
    ("Moniepoint", _gen_moniepoint),
    ("PalmPay",    _gen_palmpay),
    ("OPay",       _gen_opay),
]

for name, fn in tests:
    try:
        url = fn(media_dir)
        print(f"[OK]    {name:12s} => {url}")
    except Exception as e:
        import traceback
        print(f"[ERROR] {name:12s} => {e}")
        traceback.print_exc()

print("\nDone! Open media/receipts/ to inspect the generated images.")
