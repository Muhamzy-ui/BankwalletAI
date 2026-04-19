#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

# Install Playwright browser natively for Linux server
python -m playwright install chromium

# Django setup
python manage.py collectstatic --no-input
python manage.py migrate

# Remove the old stale beat schedule entry so it doesn't fire duplicate tasks
python manage.py shell -c "
from django_celery_beat.models import PeriodicTask
deleted, _ = PeriodicTask.objects.filter(name='auto-fill-schedule-windows-every-5-mins').delete()
if deleted:
    print('Cleaned up stale beat task: auto-fill-schedule-windows-every-5-mins')
"

# Create a default superuser if none exists
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@example.com', 'admin_password')"
