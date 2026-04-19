from rest_framework import viewsets, status, generics
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.utils import timezone
from django.conf import settings
import requests
import json
import os
from .models import TelegramChannel, ScheduleWindow, CaptionTemplate, Post, BotSettings, CustomGalleryImage
from .serializers import (UserSerializer, RegisterSerializer, TelegramChannelSerializer,
                           ScheduleWindowSerializer, CaptionTemplateSerializer, PostSerializer, BotSettingsSerializer, CustomGalleryImageSerializer)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class TelegramChannelViewSet(viewsets.ModelViewSet):
    serializer_class = TelegramChannelSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TelegramChannel.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        channel = self.get_object()
        try:
            settings_obj = request.user.bot_settings
            token = settings_obj.bot_token or settings.TELEGRAM_BOT_TOKEN
            if not token:
                return Response({'error': 'No bot token configured'}, status=400)
            url = f"https://api.telegram.org/bot{token}/getChat"
            resp = requests.get(url, params={'chat_id': channel.channel_id}, timeout=10)
            data = resp.json()
            if data.get('ok'):
                chat = data['result']
                channel.member_count = chat.get('members_count', 0)
                channel.save()
                return Response({'success': True, 'chat': chat})
            return Response({'error': data.get('description', 'Failed')}, status=400)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


class ScheduleWindowViewSet(viewsets.ModelViewSet):
    serializer_class = ScheduleWindowSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ScheduleWindow.objects.filter(channel__owner=self.request.user)


class CaptionTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = CaptionTemplateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CaptionTemplate.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class CustomGalleryViewSet(viewsets.ModelViewSet):
    serializer_class = CustomGalleryImageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CustomGalleryImage.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=False, methods=['post'])
    def generate_ai(self, request):
        """Generate a caption using Claude AI"""
        context = request.data.get('context', '')
        try:
            settings_obj = request.user.bot_settings
            api_key = settings_obj.anthropic_api_key or settings.ANTHROPIC_API_KEY
            if not api_key:
                return Response({'error': 'No Anthropic API key configured'}, status=400)

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
            caption_text = result['content'][0]['text']

            template = CaptionTemplate.objects.create(
                owner=request.user, name=f"AI Caption {timezone.now().strftime('%d/%m %H:%M')}",
                content=caption_text, is_ai_generated=True
            )
            return Response(CaptionTemplateSerializer(template).data)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Post.objects.filter(owner=self.request.user)
        status_filter = self.request.query_params.get('status')
        channel_filter = self.request.query_params.get('channel')
        if status_filter:
            qs = qs.filter(status=status_filter)
        if channel_filter:
            qs = qs.filter(channel_id=channel_filter)
        return qs

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['post'])
    def send_now(self, request, pk=None):
        post = self.get_object()
        result = send_post_to_telegram(post, request.user)
        if result['success']:
            return Response({'success': True, 'message_id': result.get('message_id')})
        return Response({'error': result['error']}, status=400)

    @action(detail=True, methods=['post'])
    def queue(self, request, pk=None):
        post = self.get_object()
        scheduled_time = request.data.get('scheduled_time')
        if scheduled_time:
            post.scheduled_time = scheduled_time
        post.status = 'queued'
        post.save()
        return Response(PostSerializer(post).data)


def send_post_to_telegram(post, user):
    try:
        settings_obj = user.bot_settings
        token = settings_obj.bot_token or settings.TELEGRAM_BOT_TOKEN
        if not token:
            return {'success': False, 'error': 'No bot token configured'}

        base_url = f"https://api.telegram.org/bot{token}"
        channel_id = post.channel.channel_id

        if post.post_type == 'text':
            resp = requests.post(f"{base_url}/sendMessage",
                json={'chat_id': channel_id, 'text': post.caption, 'parse_mode': 'HTML'}, timeout=15)
        elif post.post_type == 'photo':
            # Extract local path from media_url if it's a local file
            local_path = None
            if post.media_url and '/media/' in post.media_url:
                rel_path = post.media_url.split('/media/')[-1]
                local_path = os.path.join(settings.BASE_DIR, 'media', rel_path)

            if local_path and os.path.exists(local_path):
                with open(local_path, 'rb') as f:
                    resp = requests.post(f"{base_url}/sendPhoto",
                        data={'chat_id': channel_id, 'caption': post.caption, 'parse_mode': 'HTML'},
                        files={'photo': f},
                        timeout=15)
            else:
                resp = requests.post(f"{base_url}/sendPhoto",
                    json={'chat_id': channel_id, 'photo': post.media_url, 'caption': post.caption, 'parse_mode': 'HTML'}, timeout=15)
        else:
            resp = requests.post(f"{base_url}/sendMessage",
                json={'chat_id': channel_id, 'text': post.caption, 'parse_mode': 'HTML'}, timeout=15)

        data = resp.json()
        if data.get('ok'):
            post.status = 'sent'
            post.sent_at = timezone.now()
            post.telegram_message_id = str(data['result']['message_id'])
            post.save()
            return {'success': True, 'message_id': post.telegram_message_id}
        else:
            post.status = 'failed'
            post.error_message = data.get('description', 'Unknown error')
            post.save()
            return {'success': False, 'error': post.error_message}
    except Exception as e:
        post.status = 'failed'
        post.error_message = str(e)
        post.save()
        return {'success': False, 'error': str(e)}


class BotSettingsView(generics.RetrieveUpdateAPIView):
    serializer_class = BotSettingsSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        obj, _ = BotSettings.objects.get_or_create(owner=self.request.user)
        return obj


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    user = request.user
    channels = TelegramChannel.objects.filter(owner=user)
    posts = Post.objects.filter(owner=user)
    today = timezone.now().date()

    stats = {
        'total_channels': channels.count(),
        'active_channels': channels.filter(is_active=True).count(),
        'total_posts': posts.count(),
        'sent_today': posts.filter(sent_at__date=today).count(),
        'queued_posts': posts.filter(status='queued').count(),
        'failed_posts': posts.filter(status='failed').count(),
        'ai_captions_used': posts.filter(ai_caption_used=True).count(),
        'caption_templates': CaptionTemplate.objects.filter(owner=user).count(),
        'recent_posts': PostSerializer(posts[:10], many=True).data,
    }

    # Posts per day last 7 days
    from datetime import timedelta
    daily_data = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        count = posts.filter(sent_at__date=day).count()
        daily_data.append({'date': str(day), 'count': count})
    stats['daily_posts'] = daily_data

    return Response(stats)


from .receipt_generator import generate_receipt

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_educational_receipt(request):
    bank_type = request.data.get('bank_type', 'opay')
    amount = request.data.get('amount', 501000.0)
    channel_id = request.data.get('channel_id')
    caption = request.data.get('caption', '')   # User's custom message
    sender_name = request.data.get('sender_name')
    receiver_name = request.data.get('receiver_name')

    try:
        amount = float(amount)
        if amount <= 500000:
            amount = 501000.0
    except ValueError:
        amount = 501000.0

    # Check for text-only mode
    if bank_type.lower() == 'text':
        image_url = None
        absolute_image_url = None
        file_path = None
    else:
        # Generate the receipt image first
        image_url, file_path = generate_receipt(bank_type, amount, sender_name, receiver_name)
        # Build the absolute URL for the image on the server
        site_url = getattr(settings, 'SITE_URL', 'http://localhost:8000')
        absolute_image_url = f"{site_url.rstrip('/')}{image_url}"
    
    # If no channel specified, return preview only
    if not channel_id or str(channel_id).lower() in ['test', '0', '']:
        return Response({
            'success': True,
            'image_url': image_url,
            'post_id': None,
            'message': 'Test receipt generated! (Not queued to any channel)'
        })

    # Try to find a registered channel by DB id first
    channel = None
    try:
        channel = TelegramChannel.objects.get(id=int(channel_id), owner=request.user)
    except (TelegramChannel.DoesNotExist, ValueError):
        # Could be a raw Telegram Chat ID (e.g. 8342713750 or -100123456789)
        # Try to find by channel_id field
        try:
            channel = TelegramChannel.objects.get(channel_id=str(channel_id), owner=request.user)
        except TelegramChannel.DoesNotExist:
            channel = None

    if channel:
        # If the user left caption blank, maybe use one from the pool
        import random
        if not caption and random.random() < 0.5:
            from .models import CaptionTemplate
            pool = list(CaptionTemplate.objects.filter(owner=request.user))
            if pool:
                caption = random.choice(pool).content

        # Post via a registered channel
        post = Post.objects.create(
            owner=request.user,
            channel=channel,
            post_type='text' if bank_type.lower() == 'text' else 'photo',
            media_url=absolute_image_url if absolute_image_url else "",
            caption=caption,
            status='queued',
            scheduled_time=timezone.now()
        )
        # Send immediately
        result = send_post_to_telegram(post, request.user)
        return Response({
            'success': True,
            'image_url': image_url,
            'post_id': post.id,
            'message': 'Receipt generated and sent!' if result['success'] else f"Queued but send failed: {result.get('error')}"
        })
    else:
        # Use raw Telegram Chat ID directly without requiring a registered channel
        try:
            bot_settings = request.user.bot_settings
            token = bot_settings.bot_token or settings.TELEGRAM_BOT_TOKEN
        except Exception:
            token = settings.TELEGRAM_BOT_TOKEN

        if not token:
            return Response({'error': 'No bot token configured. Go to Bot Settings and save your token.'}, status=400)

        # If the user left caption blank, maybe use one from the pool
        import random
        if not caption and random.random() < 0.5:
            from .models import CaptionTemplate
            pool = list(CaptionTemplate.objects.filter(owner=request.user))
            if pool:
                caption = random.choice(pool).content

        if bank_type.lower() == 'text':
            resp = requests.post(
                f"https://api.telegram.org/bot{token}/sendMessage",
                json={'chat_id': str(channel_id), 'text': caption, 'parse_mode': 'HTML'},
                timeout=15
            )
        else:
            if file_path and os.path.exists(file_path):
                with open(file_path, 'rb') as f:
                    resp = requests.post(
                        f"https://api.telegram.org/bot{token}/sendPhoto",
                        data={'chat_id': str(channel_id), 'caption': caption, 'parse_mode': 'HTML'},
                        files={'photo': f},
                        timeout=15
                    )
            else:
                resp = requests.post(
                    f"https://api.telegram.org/bot{token}/sendPhoto",
                    json={'chat_id': str(channel_id), 'photo': absolute_image_url, 'caption': caption, 'parse_mode': 'HTML'},
                    timeout=15
                )
        data = resp.json()
        if data.get('ok'):
            return Response({'success': True, 'image_url': image_url, 'message': 'Receipt sent to Telegram!'})
        else:
            return Response({'success': True, 'image_url': image_url, 'message': f"Image generated. Telegram said: {data.get('description', 'unknown error')}"})


import glob
import os

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_templates(request):
    template_dir = os.path.join(settings.BASE_DIR, 'media', 'templates')
    os.makedirs(template_dir, exist_ok=True)
    # Show both sendlikethis and changethename files
    files = []
    for pat in ['*sendlikethis*.*', '*changethename*.*']:
        files.extend(glob.glob(os.path.join(template_dir, pat)))
    files = list(set(files))  # deduplicate
    site_url = getattr(settings, 'SITE_URL', 'http://localhost:8000')
    results = [{'filename': os.path.basename(f), 'url': f"{site_url}/media/templates/{os.path.basename(f)}"} for f in files]
    return Response(results)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_template(request, filename):
    template_dir = os.path.join(settings.BASE_DIR, 'media', 'templates')
    # Security: strip any path traversal attempts
    safe_name = os.path.basename(filename)
    file_path = os.path.join(template_dir, safe_name)
    if os.path.exists(file_path):
        os.remove(file_path)
        return Response({'success': True, 'deleted': safe_name})
    return Response({'error': 'File not found'}, status=404)

import json
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def template_coordinates(request):
    coord_file = os.path.join(settings.BASE_DIR, 'media', 'templates', 'coordinates.json')
    if request.method == 'POST':
        # Save new coordinates
        try:
            with open(coord_file, 'r') as f:
                data = json.load(f)
        except Exception:
            data = {}
        
        filename = request.data.get('filename')
        if filename:
            data[filename] = request.data.get('coordinates')
            with open(coord_file, 'w') as f:
                json.dump(data, f, indent=4)
        return Response({'success': True})
    else:
        # Load all coordinates
        try:
            with open(coord_file, 'r') as f:
                return Response(json.load(f))
        except Exception:
            return Response({})