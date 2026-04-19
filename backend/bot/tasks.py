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

    from django.db.models import Q
    windows = channel.schedule_windows.filter(
        Q(day_of_week=current_day) | Q(day_of_week=7),
        is_active=True
    )
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

        # Global Pause Check
        if hasattr(post.owner, 'bot_settings') and not post.owner.bot_settings.bot_is_active:
            logger.info(f"Post {post.id} skipped - bot is paused by user")
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
    from datetime import timedelta

    now = timezone.now()
    channels = TelegramChannel.objects.filter(is_active=True).select_related('owner', 'owner__bot_settings')
    
    # Grab all available text captions
    all_captions = list(CaptionTemplate.objects.all())

    images_used_this_run = set()
    captions_used_this_run = set()

    for channel in channels:
        # If the channel is currently inside a schedule window!
        if is_within_schedule(channel):
            
            # Global Pause Check
            if hasattr(channel.owner, 'bot_settings') and not channel.owner.bot_settings.bot_is_active:
                logger.info(f"Skipping auto-post for {channel.name} - bot is globally paused.")
                continue

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
            # Also fetch the LAST post ever sent to this channel so we can avoid repeating it immediately
            last_post = Post.objects.filter(channel=channel).order_by('-created_at').first()
            recent_post = last_post and last_post.scheduled_time >= (now - interval_buffer)
            
            if not recent_post:
                image_url = ""
                
                # Use today's promo images if available, else generate a random receipt
                if today_images:
                    # Filter out images used recently globally, or used previously in this channel
                    safe_images = [img for img in today_images if img.image.url not in images_used_this_run]
                    if last_post and last_post.media_url:
                        safe_images = [img for img in safe_images if img.image.url not in last_post.media_url]
                    
                    # Fallback to full list if we filtered out everything
                    if not safe_images:
                        safe_images = today_images

                    chosen_img = random.choice(safe_images)
                    image_url = chosen_img.image.url
                    images_used_this_run.add(image_url)
                else:
                    # Exclude the exact last receipt from being magically re-generated consecutively
                    # (This is harder to prevent without deep inspection, but generate_receipt() is fairly random already)
                    image_url, _ = generate_receipt()

                if not image_url:
                    print(f"Skipping auto-post for channel {channel.channel_id}: No templates available.")
                    continue

                # Build a production URL for receipts
                site_url = getattr(settings, 'SITE_URL', 'http://localhost:8000')
                if not image_url.startswith('http'):
                    image_url = f"{site_url.rstrip('/')}{image_url}"

                # Extract amount from image filename (e.g. receipt_50000_changethename.jpg -> 50,000)
                extracted_amount = None
                try:
                    import re
                    fname = image_url.split('/')[-1]
                    match = re.search(r'_(\d{4,})', fname)
                    if match:
                        raw = int(match.group(1))
                        extracted_amount = f"{raw:,}"
                except Exception:
                    pass

                # Choose a random saved text caption if available
                final_caption = ""
                if all_captions:
                    # Avoid back-to-back duplicate captions per channel and per cron-run
                    safe_captions = [cap for cap in all_captions if cap.content not in captions_used_this_run]
                    if last_post and last_post.caption:
                        safe_captions = [cap for cap in safe_captions if cap.content != last_post.caption]
                    
                    if not safe_captions:
                        safe_captions = all_captions

                    chosen = random.choice(safe_captions)
                    final_caption = chosen.content
                    captions_used_this_run.add(final_caption)

                    # Replace {amount} placeholder
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