import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
app = Celery('telebot')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Beat schedule - process queued posts every minute
app.conf.beat_schedule = {
    'process-queued-posts-every-minute': {
        'task': 'bot.tasks.process_queued_posts',
        'schedule': 60.0,
    },
    'auto-fill-schedule-windows-every-5-mins': {
        'task': 'bot.tasks.auto_fill_schedule_windows',
        'schedule': 300.0, # Check every 5 mins
    },
    'refresh-channel-stats-hourly': {
        'task': 'bot.tasks.refresh_channel_stats',
        'schedule': 3600.0,
    },
}
