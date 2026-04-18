from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from bot.models import Post, TelegramChannel
from .models import ActivityLog, ChannelStats


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def activity_log(request):
    logs = ActivityLog.objects.filter(owner=request.user)[:50]
    data = [{'id': l.id, 'action': l.action, 'message': l.message,
             'channel': l.channel.name if l.channel else None, 'created_at': l.created_at} for l in logs]
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def channel_performance(request):
    channels = TelegramChannel.objects.filter(owner=request.user)
    data = []
    for ch in channels:
        posts = ch.posts.all()
        sent = posts.filter(status='sent').count()
        failed = posts.filter(status='failed').count()
        data.append({
            'id': ch.id, 'name': ch.name, 'channel_id': ch.channel_id,
            'total_posts': posts.count(), 'sent': sent, 'failed': failed,
            'success_rate': round((sent / max(sent + failed, 1)) * 100, 1),
            'member_count': ch.member_count, 'is_active': ch.is_active,
        })
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def post_timeline(request):
    days = int(request.query_params.get('days', 14))
    today = timezone.now().date()
    data = []
    for i in range(days - 1, -1, -1):
        day = today - timedelta(days=i)
        posts = Post.objects.filter(owner=request.user, sent_at__date=day)
        data.append({
            'date': str(day),
            'sent': posts.filter(status='sent').count(),
            'failed': posts.filter(status='failed').count(),
            'queued': Post.objects.filter(owner=request.user, scheduled_time__date=day, status='queued').count(),
        })
    return Response(data)