from django.db import models
from django.contrib.auth.models import User
from bot.models import TelegramChannel, Post


class PostAnalytics(models.Model):
    post = models.OneToOneField(Post, on_delete=models.CASCADE, related_name='analytics')
    views = models.IntegerField(default=0)
    forwards = models.IntegerField(default=0)
    reactions = models.IntegerField(default=0)
    clicks = models.IntegerField(default=0)
    recorded_at = models.DateTimeField(auto_now=True)


class ChannelStats(models.Model):
    channel = models.ForeignKey(TelegramChannel, on_delete=models.CASCADE, related_name='stats')
    date = models.DateField()
    posts_sent = models.IntegerField(default=0)
    posts_failed = models.IntegerField(default=0)
    total_views = models.IntegerField(default=0)
    total_reactions = models.IntegerField(default=0)
    member_count = models.IntegerField(default=0)
    member_growth = models.IntegerField(default=0)

    class Meta:
        unique_together = ('channel', 'date')
        ordering = ['-date']


class ActivityLog(models.Model):
    ACTION_CHOICES = [
        ('post_sent', 'Post Sent'), ('post_failed', 'Post Failed'),
        ('post_queued', 'Post Queued'), ('schedule_updated', 'Schedule Updated'),
        ('caption_generated', 'AI Caption Generated'), ('channel_added', 'Channel Added'),
        ('bot_started', 'Bot Started'), ('bot_stopped', 'Bot Stopped'),
    ]
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activity_logs')
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    message = models.TextField()
    channel = models.ForeignKey(TelegramChannel, null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']