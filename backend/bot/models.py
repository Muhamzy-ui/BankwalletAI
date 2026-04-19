from django.db import models
from django.contrib.auth.models import User
from cloudinary_storage.storage import MediaCloudinaryStorage as cloudinary_storage


class TelegramChannel(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='channels')
    name = models.CharField(max_length=200)
    channel_id = models.CharField(max_length=100)
    channel_username = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    member_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class ScheduleWindow(models.Model):
    DAY_CHOICES = [(i, d) for i, d in enumerate(['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'])] + [(7, 'Everyday')]
    channel = models.ForeignKey(TelegramChannel, on_delete=models.CASCADE, related_name='schedule_windows')
    day_of_week = models.IntegerField(choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('channel', 'day_of_week', 'start_time')

    def __str__(self):
        days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun','Everyday']
        return f"{self.channel.name} - {days[self.day_of_week]} {self.start_time}-{self.end_time}"


class CaptionTemplate(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='caption_templates')
    name = models.CharField(max_length=200)
    content = models.TextField()
    tags = models.CharField(max_length=300, blank=True)
    is_ai_generated = models.BooleanField(default=False)
    use_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class CustomGalleryImage(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='gallery_images')
    image = models.ImageField(upload_to="gallery/", storage=cloudinary_storage())
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"GalleryImage {self.id}"


class TemplateImage(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='templates')
    image = models.ImageField(upload_to="templates/", storage=cloudinary_storage())
    bank_name = models.CharField(max_length=100, blank=True)
    template_type = models.CharField(max_length=50, default='changethename', help_text="e.g. changethename or sendlikethis")
    is_active = models.BooleanField(default=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Template {self.id} - {self.bank_name}"


class Post(models.Model):
    STATUS_CHOICES = [('draft','Draft'),('queued','Queued'),('sent','Sent'),('failed','Failed'),('cancelled','Cancelled')]
    TYPE_CHOICES = [('text','Text'),('photo','Photo'),('video','Video'),('document','Document'),('poll','Poll')]

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    channel = models.ForeignKey(TelegramChannel, on_delete=models.CASCADE, related_name='posts')
    post_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='text')
    caption = models.TextField(blank=True)
    caption_template = models.ForeignKey(CaptionTemplate, null=True, blank=True, on_delete=models.SET_NULL)
    media_url = models.CharField(max_length=500, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    scheduled_time = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    telegram_message_id = models.CharField(max_length=100, blank=True)
    error_message = models.TextField(blank=True)
    ai_caption_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.channel.name} | {self.post_type} | {self.status}"


class BotSettings(models.Model):
    owner = models.OneToOneField(User, on_delete=models.CASCADE, related_name='bot_settings')
    bot_token = models.CharField(max_length=300, blank=True)
    anthropic_api_key = models.CharField(max_length=300, blank=True)
    auto_caption_enabled = models.BooleanField(default=True)
    auto_caption_prompt = models.TextField(default='Generate an engaging Telegram caption for a Nigerian audience. Be energetic, use relevant emojis, and include a call to action. Keep it under 200 characters.')
    default_send_interval_minutes = models.IntegerField(default=60)
    timezone = models.CharField(max_length=50, default='Africa/Lagos')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Settings for {self.owner.username}"