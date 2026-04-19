from celery import shared_task
from django.utils import timezone
from django.conf import settings
import requests
import logging

logger = logging.getLogger(__name__)


import pytz

def is_within_schedule(channel):
    """Check if current time is within any active schedule window for this channel"""
    user_tz_str = 'Africa/Lagos'
    if hasattr(channel.owner, 'bot_settings') and channel.owner.bot_settings.timezone:
        user_tz_str = channel.owner.bot_settings.timezone
    
    try:
        tz = pytz.timezone(user_tz_str)
    except pytz.UnknownTimeZoneError:
        tz = pytz.UTC
    now = timezone.now().astimezone(tz)
    current_day = now.weekday()  # 0=Monday
    current_time = now.time()

    windows = channel.schedule_windows.filter(is_active=True, day_of_week=current_day)
    if not windows.exists():
        return False  # No window = don't send

    for window in windows:
        if window.start_time <= current_time <= window.end_time:
            return True
    return False


def generate_ai_caption(user, context=""):
    """Generate caption using Claude AI"""
    try:
        settings_obj = user.bot_settings
        api_key = settings_obj.anthropic_api_key or settings.ANTHROPIC_API_KEY
        if not api_key:
            return None

        prompt = settings_obj.auto_caption_prompt
        if context:
            prompt = f"{prompt}\n\nContext: {context}"

        resp = requests.post(
            'https://api.anthropic.com/v1/messages',
            headers={'x-api-key': api_key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json'},
            json={'model': 'claude-sonnet-4-20250514', 'max_tokens': 300,
                  'messages': [{'role': 'user', 'content': prompt}]},
            timeout=30
        )
        result = resp.json()
        return result['content'][0]['text']
    except Exception as e:
        logger.error(f"AI caption generation failed: {e}")
        return None


@shared_task(bind=True, max_retries=3)
def process_queued_posts(self):
    """Main celery task - runs every minute. Features Exponential Backoff Retries."""
    from bot.models import Post
    from bot.views import send_post_to_telegram
    from analytics.models import ActivityLog

    now = timezone.now()
    due_posts = Post.objects.filter(
        status='queued',
        scheduled_time__lte=now
    ).select_related('channel', 'owner', 'owner__bot_settings')

    for post in due_posts:
        # Check schedule window
        if not is_within_schedule(post.channel):
            logger.info(f"Post {post.id} skipped - outside schedule window")
            continue

        # Auto-generate caption if missing and auto-caption enabled
        if not post.caption and post.owner.bot_settings.auto_caption_enabled:
            ai_caption = generate_ai_caption(post.owner)
            if ai_caption:
                post.caption = ai_caption
                post.ai_caption_used = True
                post.save()

        result = send_post_to_telegram(post, post.owner)

        if not result['success']:
            error_msg = str(result.get('error', '')).lower()
            # If rate limited (HTTP 429) or timeout, retry with backoff: 60s, 120s, 240s
            if 'timeout' in error_msg or 'too many requests' in error_msg:
                ActivityLog.objects.create(owner=post.owner, action='post_queued', message='Rate limit/Timeout hit, retrying...', channel=post.channel)
                raise self.retry(countdown=60 * (2 ** self.request.retries))

        action = 'post_sent' if result['success'] else 'post_failed'
        msg = f"Post sent to {post.channel.name}" if result['success'] else f"Failed: {result.get('error', 'Unknown')}"
        ActivityLog.objects.create(owner=post.owner, action=action, message=msg, channel=post.channel)


@shared_task
def refresh_channel_stats():
    """Refresh member counts for all active channels"""
    from bot.models import TelegramChannel, BotSettings
    from django.contrib.auth.models import User

    channels = TelegramChannel.objects.filter(is_active=True).select_related('owner', 'owner__bot_settings')
    for channel in channels:
        try:
            token = channel.owner.bot_settings.bot_token or settings.TELEGRAM_BOT_TOKEN
            if not token:
                continue
            url = f"https://api.telegram.org/bot{token}/getChatMemberCount"
            resp = requests.get(url, params={'chat_id': channel.channel_id}, timeout=10)
            data = resp.json()
            if data.get('ok'):
                channel.member_count = data['result']
                channel.save()
        except Exception as e:
            logger.error(f"Failed to refresh stats for channel {channel.id}: {e}")

@shared_task
def auto_fill_schedule_windows():
    """Automatically queue random receipts when windows are active!"""
    from bot.models import TelegramChannel, Post, CustomGalleryImage, CaptionTemplate
    from bot.receipt_generator import generate_receipt
    import random
    import pytz
    from datetime import timedelta, date

    now = timezone.now()
    channels = TelegramChannel.objects.filter(is_active=True).select_related('owner', 'owner__bot_settings')
    
    # Grab all available text captions
    all_captions = list(CaptionTemplate.objects.all())

    for channel in channels:
        # If the channel is currently inside a schedule window!
        if is_within_schedule(channel):
            
            # Recalculate today's images using the channel owner's timezone to ensure "today" is accurate for them
            user_tz_str = channel.owner.bot_settings.timezone if hasattr(channel.owner, 'bot_settings') else 'Africa/Lagos'
            try:
                tz = pytz.timezone(user_tz_str)
            except pytz.UnknownTimeZoneError:
                tz = pytz.UTC
            local_now = now.astimezone(tz)
            today_start = tz.localize(timezone.datetime.combine(local_now.date(), timezone.datetime.min.time()))
            
            # Check if there are any Custom Gallery Images uploaded TODAY
            today_images = list(CustomGalleryImage.objects.filter(uploaded_at__gte=today_start, is_active=True))

            # Get this channel's custom sending interval (default 5 minutes if not set)
            try:
                interval_minutes = channel.owner.bot_settings.default_send_interval_minutes or 5
            except Exception:
                interval_minutes = 5
            interval_buffer = timedelta(minutes=interval_minutes) - timedelta(seconds=30)

            # Check if we already auto-posted recently within the interval window
            recent_post = Post.objects.filter(channel=channel, scheduled_time__gte=now - interval_buffer).exists()
            if not recent_post:
                image_url = ""
                
                # Use today's promo images if available, else generate a random receipt
                if today_images:
                    chosen_img = random.choice(today_images)
                    image_url = chosen_img.image.url
                else:
                    image_url, _ = generate_receipt()  # No args = fully random

                # Build a production URL for receipts (gallery images already have /media/)
                site_url = getattr(settings, 'SITE_URL', 'http://localhost:8000')
                if not image_url.startswith('http'):
                    image_url = f"{site_url.rstrip('/')}{image_url}"

                # Extract amount from image filename (e.g. receipt_50000_changethename.jpg -> 50,000)
                extracted_amount = None
                try:
                    import re
                    fname = image_url.split('/')[-1]  # just the filename
                    match = re.search(r'_(\d{4,})', fname)  # find a 4+ digit number
                    if match:
                        raw = int(match.group(1))
                        extracted_amount = f"{raw:,}"  # format as 50,000
                except Exception:
                    pass

                # Choose a random saved text caption if available
                final_caption = ""
                if all_captions:
                    chosen = random.choice(all_captions)
                    final_caption = chosen.content
                    # Replace {amount} placeholder with extracted filename amount
                    if extracted_amount:
                        final_caption = final_caption.replace('{amount}', f'₦{extracted_amount}')

                # Queue it for immediate dispatch
                Post.objects.create(
                    owner=channel.owner,
                    channel=channel,
                    post_type='photo',
                    media_url=image_url,
                    caption=final_caption,
                    status='queued',
                    scheduled_time=now
                )
                logger.info(f"Auto-queued post for {channel.name}.")