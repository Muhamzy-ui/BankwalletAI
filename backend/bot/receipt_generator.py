"""
Pixel-perfect Nigerian bank receipt generator using Playwright & Django Templates.
"""

import os
import random
import string
import glob
import shutil
from datetime import datetime

from django.conf import settings
from django.template.loader import render_to_string
from playwright.sync_api import sync_playwright

# ─── Utility helpers ─────────────────────────────────────────────────────────

def _rand_amount():
    return random.randint(150000, 4500000) + random.randint(0, 99) / 100

def _format_amount(amount):
    return f"₦{amount:,.2f}"

def _rand_txn_id(length=20):
    return ''.join(random.choices(string.digits, k=length))

_NIGERIAN_NAMES = [
    "Adaeze Okonkwo", "Chukwuemeka Nwosu", "Fatima Aliyu", "Babatunde Okafor",
    "Ngozi Eze", "Ibrahim Musa", "Aisha Bello", "Chidi Nnaji", "Kemi Adeleke",
    "Emeka Obi", "Yewande Adesanya", "Olumide Bakare", "Amina Garba",
    "Tunde Fashola"
]

_BANKS_POOL = ["OPay", "Moniepoint", "Kuda MFB", "GTBank", "Access Bank", "PalmPay", "KongaPay", "Sparkle"]

def _rand_name():
    return random.choice(_NIGERIAN_NAMES)

def _rand_bank():
    return random.choice(_BANKS_POOL)

# ─── Playwright Renderer ─────────────────────────────────────────────────────

def _render_html_to_img(template_name, context, output_filename):
    """Renders a Django HTML template to a string, then uses Playwright to screenshot it."""
    html_content = render_to_string(f"bot/receipts/{template_name}", context)
    
    media_dir = os.path.join(settings.BASE_DIR, "media", "receipts")
    os.makedirs(media_dir, exist_ok=True)
    file_path = os.path.join(media_dir, output_filename)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                args=[
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-gpu",
                    "--no-first-run",
                    "--no-zygote",
                    "--single-process",
                    "--disable-extensions",
                ]
            )
            page = browser.new_page(viewport={"width": 450, "height": 950})
            page.set_content(html_content, wait_until="networkidle")
            page.evaluate("document.fonts.ready")
            page.screenshot(path=file_path)
            browser.close()
        return f"/media/receipts/{output_filename}"
    except Exception as e:
        print(f"[Playwright ERROR] {e} — falling back to sendlikethis template")
        # Fall back to a real photo template from the templates folder
        template_dir = os.path.join(settings.BASE_DIR, "media", "templates")
        return _sendlikethis_fallback(template_dir, media_dir)


def _sendlikethis_fallback(template_dir, media_dir):
    """Emergency fallback: pick any real template image."""
    all_patterns = [
        os.path.join(template_dir, "*.jpeg"),
        os.path.join(template_dir, "*.jpg"),
        os.path.join(template_dir, "*.png"),
    ]
    candidates = []
    for pat in all_patterns:
        candidates.extend(glob.glob(pat))
    if not candidates:
        return None
    chosen = random.choice(candidates)
    filename = f"receipt_fallback_{_rand_txn_id(10)}{os.path.splitext(chosen)[1]}"
    dest = os.path.join(media_dir, filename)
    shutil.copy(chosen, dest)
    return f"/media/receipts/{filename}"

# ─── Bank Data Generators ────────────────────────────────────────────────────

def _gen_vfd():
    now = datetime.now()
    ctx = {
        "amount": _format_amount(_rand_amount()),
        "sender": "Bank Wallet Ltd",
        "date": now.strftime("%b %d, %Y %H:%M:%S"),
        "txn_id": _rand_txn_id(20),
        "session_id": _rand_txn_id(30)
    }
    return _render_html_to_img("vfd.html", ctx, f"receipt_vfd_{_rand_txn_id(10)}.png")

def _gen_sparkle():
    now = datetime.now()
    ctx = {
        "amount": f"{_rand_amount():,.2f}",
        "sender": "Bank Wallet Ltd",
        "receiver": _rand_name(),
        "date_full": now.strftime("%A, %b %d, %Y,\n%I:%M %p"),
        "session_id": _rand_txn_id(35)
    }
    return _render_html_to_img("sparkle.html", ctx, f"receipt_sparkle_{_rand_txn_id(10)}.png")

def _gen_kongapay():
    now = datetime.now()
    ctx = {
        "amount": _format_amount(_rand_amount()),
        "sender": "Bank Wallet Ltd",
        "receiver": _rand_name(),
        "date": now.strftime("%d/%m/%Y@%I:%M%p"),
        "txn_id": _rand_txn_id(24)
    }
    return _render_html_to_img("kongapay.html", ctx, f"receipt_kongapay_{_rand_txn_id(10)}.png")

def _gen_moniepoint():
    now = datetime.now()
    ctx = {
        "amount": _format_amount(_rand_amount()),
        "sender": "Bank Wallet Ltd",
        "bank": "Moniepoint",
        "date_top": now.strftime("%A, %b %d, %Y | %I:%M %p"),
        "date_bottom": now.strftime("%A, %b %d, %Y"),
        "txn_id": f"MIT|CRP|{_rand_txn_id(20)}|{_rand_txn_id(15)}_CREDIT_4"
    }
    return _render_html_to_img("moniepoint.html", ctx, f"receipt_moniepoint_{_rand_txn_id(10)}.png")

def _gen_palmpay():
    now = datetime.now()
    ctx = {
        "amount": _format_amount(_rand_amount()),
        "sender": "Bank Wallet Ltd",
        "receiver": _rand_name(),
        "bank": _rand_bank(),
        "date": now.strftime("%I:%M %p, %b %d, %Y"),
        "txn_id": _rand_txn_id(12) + "a00"
    }
    return _render_html_to_img("palmpay.html", ctx, f"receipt_palmpay_{_rand_txn_id(10)}.png")

def _gen_opay():
    now = datetime.now()
    ctx = {
        "amount": _format_amount(_rand_amount()),
        "sender": "Bank Wallet Ltd",
        "receiver": _rand_name(),
        "bank": _rand_bank(),
        "date": now.strftime("%b %d, %Y  %H:%M:%S"),
        "txn_id": _rand_txn_id(12),
        "session_id": _rand_txn_id(30)
    }
    return _render_html_to_img("opay.html", ctx, f"receipt_opay_{_rand_txn_id(10)}.png")


# ─── Sendlikethis passthrough ─────────────────────────────────────────────────

def _handle_sendlikethis(template_dir, media_dir):
    patterns = [
        os.path.join(template_dir, "*sendlikethis*.jpeg"),
        os.path.join(template_dir, "*sendlikethis*.jpg"),
        os.path.join(template_dir, "*sendlikethis*.png"),
    ]
    candidates = []
    for p in patterns:
        candidates.extend(glob.glob(p))

    if not candidates:
        return None

    chosen = random.choice(candidates)
    os.makedirs(media_dir, exist_ok=True)
    filename = f"receipt_sendlikethis_{_rand_txn_id(10)}{os.path.splitext(chosen)[1]}"
    dest = os.path.join(media_dir, filename)
    shutil.copy(chosen, dest)
    return f"/media/receipts/{filename}"


# ─── Main API ─────────────────────────────────────────────────────────

BANK_GENERATORS = {
    "vfd": _gen_vfd,
    "sparkle": _gen_sparkle,
    "kongapay": _gen_kongapay,
    "moniepoint": _gen_moniepoint,
    "palmpay": _gen_palmpay,
    "opay": _gen_opay,
}

ALL_BANKS = list(BANK_GENERATORS.keys())

def generate_receipt(bank_type=None, amount=None, sender_name=None, receiver_name=None):
    media_dir = os.path.join(settings.BASE_DIR, "media", "receipts")
    os.makedirs(media_dir, exist_ok=True)
    template_dir = os.path.join(settings.BASE_DIR, "media", "templates")

    use_sendlikethis = random.random() < 0.40
    if use_sendlikethis:
        url = _handle_sendlikethis(template_dir, media_dir)
        if url: return url

    if not bank_type or bank_type.lower() in ("random", ""):
        bank_type = random.choice(ALL_BANKS)

    bank_type = bank_type.lower().replace(" ", "")
    gen_fn = BANK_GENERATORS.get(bank_type, _gen_opay)
    return gen_fn()
