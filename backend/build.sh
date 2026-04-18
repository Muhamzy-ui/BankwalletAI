#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

# Install Playwright browser dependencies natively for Linux server
python -m playwright install chromium
python -m playwright install-deps chromium

# Django setup
python manage.py collectstatic --no-input
python manage.py migrate

# Create a default superuser if none exists
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@example.com', 'admin_password')"
