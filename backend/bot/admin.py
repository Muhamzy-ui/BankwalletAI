from django.contrib import admin
from .models import TelegramChannel, ScheduleWindow, CaptionTemplate, Post, BotSettings

@admin.register(TelegramChannel)
class ChannelAdmin(admin.ModelAdmin):
    list_display = ['name', 'channel_id', 'owner', 'is_active', 'member_count', 'created_at']
    list_filter = ['is_active']

@admin.register(ScheduleWindow)
class ScheduleWindowAdmin(admin.ModelAdmin):
    list_display = ['channel', 'day_of_week', 'start_time', 'end_time', 'is_active']

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['channel', 'post_type', 'status', 'scheduled_time', 'sent_at', 'ai_caption_used']
    list_filter = ['status', 'post_type']

@admin.register(CaptionTemplate)
class CaptionAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'is_ai_generated', 'use_count', 'created_at']

@admin.register(BotSettings)
class BotSettingsAdmin(admin.ModelAdmin):
    list_display = ['owner', 'auto_caption_enabled', 'default_send_interval_minutes']