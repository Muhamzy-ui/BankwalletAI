from django.contrib import admin
from .models import ActivityLog, ChannelStats, PostAnalytics

@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ['owner', 'action', 'channel', 'created_at']
    list_filter = ['action']